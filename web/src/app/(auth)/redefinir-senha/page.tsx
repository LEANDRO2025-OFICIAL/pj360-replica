import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server"
import { NovaSenhaForm, PedirLinkForm } from "./forms"

export const instant = false

// Sem sessão: pede o link por e-mail. Com sessão (veio do link do e-mail): define a nova senha.
export default async function RedefinirSenhaPage() {
  let logado = false
  if (supabaseConfigurado) {
    const sb = await criarClienteServidor()
    logado = Boolean((await sb.auth.getClaims()).data?.claims)
  }
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{logado ? "Nova senha" : "Esqueci a senha"}</CardTitle>
          <CardDescription>
            {logado ? "Escolha uma senha com pelo menos 8 caracteres." : "Enviamos um link para você criar uma nova senha."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logado ? <NovaSenhaForm /> : <PedirLinkForm />}
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">Voltar para o login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
