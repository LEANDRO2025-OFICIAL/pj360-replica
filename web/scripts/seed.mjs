// Dados de demonstração no SEU projeto Supabase: npm run seed
// Usa SUPABASE_SECRET_KEY (só local). Empresas e números fictícios; nenhuma pessoa real.
import { createClient } from "@supabase/supabase-js"
import { avaliarTudo, VERSAO_REGRAS } from "../src/lib/solucoes/index.ts"

process.loadEnvFile(new URL("../.env.local", import.meta.url))
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret, SEED_ADMIN_EMAIL: email } = process.env
if (!url || !secret || !email) throw new Error("Preencha NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY e SEED_ADMIN_EMAIL no .env.local")

const sb = createClient(url, secret, { auth: { persistSession: false } })
const ok = ({ data, error }, passo) => {
  if (error) throw new Error(`${passo}: ${error.message}`)
  return data
}

const { users } = ok(await sb.auth.admin.listUsers({ perPage: 1000 }), "listar usuários")
const admin = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!admin) throw new Error(`Convide ${email} no painel do Supabase (Authentication → Users) antes do seed.`)

let membro = ok(await sb.from("membros").select("escritorio_id").eq("user_id", admin.id).maybeSingle(), "ler membro")
if (!membro) {
  const esc = ok(await sb.from("escritorios").insert({ nome: "Escritório Demo" }).select("id").single(), "criar escritório")
  ok(await sb.from("membros").insert({ escritorio_id: esc.id, user_id: admin.id, nome: email.split("@")[0], papel: "admin" }), "criar membro")
  membro = { escritorio_id: esc.id }
}
const escritorioId = membro.escritorio_id

const catalogo = ok(await sb.from("solucoes").select("id, slug"), "ler catálogo")
const idPorSlug = new Map(catalogo.map((s) => [s.slug, s.id]))

const exemplos = [
  { cnpj: "11222333000181", razao: "Atacado Exemplo Ltda", regime: "REAL", fat: 4000000000n, clt: 120, passivo: 1000000000n },
  { cnpj: "12ABC34501DE35", razao: "Serviços Fictícios S/A", regime: "PRESUMIDO", fat: 1200000000n, clt: 35, passivo: 0n },
]

for (const ex of exemplos) {
  const emp = ok(
    await sb.from("empresas").upsert(
      { escritorio_id: escritorioId, cnpj: ex.cnpj, razao_social: ex.razao, segmento: "Comércio Atacadista", fonte: "seed" },
      { onConflict: "escritorio_id,cnpj" },
    ).select("id").single(),
    "salvar empresa",
  )
  const { resultados, totalCents } = avaliarTudo({
    regime: ex.regime,
    faturamentoMedioCents: ex.fat,
    colaboradoresClt: ex.clt,
    passivoTributarioCents: ex.passivo,
  })
  const diag = ok(
    await sb.from("diagnosticos").insert({
      escritorio_id: escritorioId,
      empresa_id: emp.id,
      criado_por: admin.id,
      observacao: "Dados de demonstração",
      origem_cliente: "minha_carteira",
      regime_tributario: ex.regime,
      faturamento_medio_cents: ex.fat.toString(),
      colaboradores_clt: ex.clt,
      passivo_tributario_cents: ex.passivo.toString(),
      total_estimado_cents: totalCents.toString(),
      versao_regras: VERSAO_REGRAS,
      status: "concluido",
      confirmado_em: new Date().toISOString(),
      concluido_em: new Date().toISOString(),
    }).select("id").single(),
    "criar diagnóstico",
  )
  ok(
    await sb.from("oportunidades").insert(
      resultados.map((r) => ({
        escritorio_id: escritorioId,
        diagnostico_id: diag.id,
        solucao_id: idPorSlug.get(r.slug),
        elegivel: r.elegivel,
        prioridade: r.prioridade,
        estimativa_cents: r.estimativaCents?.toString() ?? null,
        detalhe: { motivo: r.motivo },
      })),
    ),
    "criar oportunidades",
  )
  console.log(`ok  ${ex.razao}`)
}
