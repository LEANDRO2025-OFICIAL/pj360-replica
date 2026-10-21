"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server"

export type EstadoAuth = { erro?: string; ok?: string; email?: string } | null

const email = z.email("Informe um e-mail válido.")
const senha = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72)

export async function entrarAction(_: EstadoAuth, fd: FormData): Promise<EstadoAuth> {
  if (!supabaseConfigurado) redirect("/") // demonstração: sem autenticação
  const dadosForm = z.object({ email, senha: z.string().min(1, "Informe a senha.") }).safeParse({
    email: fd.get("email"),
    senha: fd.get("senha"),
  })
  if (!dadosForm.success) return { erro: dadosForm.error.issues[0].message, email: String(fd.get("email") ?? "") }

  const sb = await criarClienteServidor()
  const { error } = await sb.auth.signInWithPassword({ email: dadosForm.data.email, password: dadosForm.data.senha })
  // mensagem única para e-mail inexistente ou senha errada (não revela quais e-mails têm conta)
  if (error) return { erro: "E-mail ou senha incorretos.", email: dadosForm.data.email }
  await sb.rpc("garantir_escritorio")
  redirect("/")
}

export async function sairAction() {
  if (supabaseConfigurado) {
    const sb = await criarClienteServidor()
    await sb.auth.signOut()
  }
  redirect("/login")
}

export async function pedirRedefinicaoAction(_: EstadoAuth, fd: FormData): Promise<EstadoAuth> {
  const r = email.safeParse(fd.get("email"))
  if (!r.success) return { erro: r.error.issues[0].message }
  if (supabaseConfigurado) {
    const sb = await criarClienteServidor()
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    await sb.auth.resetPasswordForEmail(r.data, { redirectTo: `${site}/auth/confirm?next=/redefinir-senha` })
  }
  // mesma resposta exista ou não a conta
  return { ok: "Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha." }
}

export async function redefinirSenhaAction(_: EstadoAuth, fd: FormData): Promise<EstadoAuth> {
  const r = z
    .object({ senha, confirmacao: z.string() })
    .refine((v) => v.senha === v.confirmacao, { message: "As senhas não conferem." })
    .safeParse({ senha: fd.get("senha"), confirmacao: fd.get("confirmacao") })
  if (!r.success) return { erro: r.error.issues[0].message }
  if (!supabaseConfigurado) return { erro: "Disponível só com o Supabase configurado." }
  const sb = await criarClienteServidor()
  const { error } = await sb.auth.updateUser({ password: r.data.senha })
  if (error) return { erro: "O link expirou. Peça um novo na tela de login." }
  redirect("/")
}
