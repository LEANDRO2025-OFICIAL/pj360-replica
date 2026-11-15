"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { dados } from "@/lib/data"
import type { EntradaConfirmada, Origem } from "@/lib/data/types"
import { ORIGENS, REGIMES } from "@/lib/labels"
import { avaliarTudo, VERSAO_REGRAS } from "@/lib/solucoes"
import type { Regime } from "@/lib/solucoes/types"

export type EstadoForm = { erro: string; campo?: string; valores?: Record<string, string> } | null

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim()
const falha = (fd: FormData, erro: string, campo?: string): EstadoForm => {
  const valores: Record<string, string> = {}
  for (const [k, v] of fd) {
    if (typeof v === "string" && !k.startsWith("$")) valores[k] = v
  }
  return { erro, campo, valores }
}

const centavos = (v: string) => (/^\d+$/.test(v) ? v : null)

export async function editarDiagnosticoAction(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const regime = texto(fd, "regime") as Regime
  const origem = texto(fd, "origem") as Origem
  const fat = centavos(texto(fd, "faturamentoMedioCents"))
  const passivo = centavos(texto(fd, "passivoTributarioCents") || "0")
  const clt = Number(texto(fd, "colaboradoresClt"))
  const observacao = texto(fd, "observacao") || null

  if (!(regime in REGIMES)) return falha(fd, "Escolha o regime tributário.", "regime")
  if (!(origem in ORIGENS)) return falha(fd, "Escolha a origem do cliente.", "origem")
  if (!fat || fat === "0") return falha(fd, "Informe o faturamento médio anual.", "faturamentoMedioCents")
  if (!passivo) return falha(fd, "Passivo inválido.", "passivoTributarioCents")
  if (!Number.isInteger(clt) || clt < 0) return falha(fd, "Informe o número de funcionários CLT (0 se não houver).", "colaboradoresClt")

  if (!(await dados.obterDiagnostico(id))) return falha(fd, "Diagnóstico não encontrado.")

  const entrada: EntradaConfirmada = { regime, origem, faturamentoMedioCents: fat, colaboradoresClt: clt, passivoTributarioCents: passivo }
  const { resultados, totalCents } = avaliarTudo({
    regime,
    faturamentoMedioCents: BigInt(fat),
    colaboradoresClt: clt,
    passivoTributarioCents: BigInt(passivo),
  })
  await dados.salvarResultado(id, {
    entrada,
    observacao,
    oportunidades: resultados.map((r) => ({ ...r, estimativaCents: r.estimativaCents?.toString() ?? null })),
    totalCents: totalCents.toString(),
    versaoRegras: VERSAO_REGRAS,
  })
  redirect(`/diagnosticos/${id}`)
}
