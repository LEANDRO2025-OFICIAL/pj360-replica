"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { dados } from "@/lib/data"
import { avaliarTudo, VERSAO_REGRAS } from "@/lib/solucoes"

export type EstadoEtapa = { erro?: string; ok?: string } | null

const ETAPAS = [
  "perfil",
  "energia",
  "agro",
  "ma",
  "tax",
  "liq-contratada",
  "societario",
  "bank",
  "family",
] as const

type Etapa = (typeof ETAPAS)[number]

const respostasPerfil = z.object({
  segmento: z.string().optional(),
  porte: z.string().optional(),
  faturamentoDeclarado: z.string().optional(),
})

const respostasEnergia = z.object({
  grupoTarifario: z.enum(["A", "B"]).optional(),
  mercado: z.enum(["cativo", "livre"]).optional(),
  contaMediaCents: z.string().optional(),
})

const respostasAgro = z.object({
  temAtividadeAgro: z.enum(["sim", "nao"]).optional(),
  areaHectares: z.string().optional(),
})

const respostasMA = z.object({
  interesseMAndA: z.enum(["sim", "nao"]).optional(),
  valorTransacaoCents: z.string().optional(),
})

const respostasTax = z.object({
  temContencioso: z.enum(["sim", "nao"]).optional(),
  valorContenciosoCents: z.string().optional(),
})

const respostasLiqContratada = z.object({
  temEndividamento: z.enum(["sim", "nao"]).optional(),
  valorEndividamentoCents: z.string().optional(),
})

const respostasSocietario = z.object({
  numSocios: z.coerce.number().min(0).optional(),
  temSociosEstrangeiros: z.enum(["sim", "nao"]).optional(),
})

const respostasBank = z.object({
  temOperacoesCambiais: z.enum(["sim", "nao"]).optional(),
  temCartaoCredito: z.enum(["sim", "nao"]).optional(),
})

const respostasFamily = z.object({
  temSucessaoPlanejada: z.enum(["sim", "nao"]).optional(),
  temHolding: z.enum(["sim", "nao"]).optional(),
})

const schemas: Record<Etapa, z.ZodSchema<any>> = {
  perfil: respostasPerfil,
  energia: respostasEnergia,
  agro: respostasAgro,
  ma: respostasMA,
  tax: respostasTax,
  "liq-contratada": respostasLiqContratada,
  societario: respostasSocietario,
  bank: respostasBank,
  family: respostasFamily,
}

export async function salvarEtapaAssessment(
  id: string,
  _: EstadoEtapa,
  fd: FormData,
): Promise<EstadoEtapa> {
  const etapa = String(fd.get("etapa") ?? "")
  if (!ETAPAS.includes(etapa as Etapa)) return { erro: "Etapa inválida." }

  const schema = schemas[etapa as Etapa]
  const parse = schema.safeParse(Object.fromEntries(fd))
  if (!parse.success) {
    return { erro: parse.error.issues[0].message }
  }

  const d = await dados.obterDiagnostico(id)
  if (!d) return { erro: "Diagnóstico não encontrado." }

  // Lê as respostas atuais do assessment (vamos guardar em observacao por enquanto, já que o fake não tem assessment)
  // Na versão Supabase, isso seria gravado na tabela assessments
  const respostasAtuais: Record<string, unknown> = {}
  try {
    const atualObs = d.observacao
    if (atualObs) {
      try {
        const parsed = JSON.parse(atualObs)
        if (parsed && typeof parsed === "object" && parsed._assessment) {
          Object.assign(respostasAtuais, parsed.respostas)
        }
      } catch {
        // ignora, não é JSON de assessment
      }
    }
  } catch {}

  const novasRespostas = {
    ...respostasAtuais,
    [etapa]: parse.data,
  }

  const observacaoComAssessment = JSON.stringify({
    _assessment: true,
    respostas: novasRespostas,
  })

  // Reprocessa com as mesmas entradas (o assessment ainda não altera as regras no MVP)
  const entrada = d.entrada
  if (!entrada) return { erro: "Diagnóstico ainda não foi confirmado. Confirme os dados primeiro." }

  const { resultados, totalCents } = avaliarTudo({
    regime: entrada.regime,
    faturamentoMedioCents: BigInt(entrada.faturamentoMedioCents),
    colaboradoresClt: entrada.colaboradoresClt,
    passivoTributarioCents: BigInt(entrada.passivoTributarioCents),
  })

  await dados.salvarResultado(id, {
    entrada,
    observacao: observacaoComAssessment,
    oportunidades: resultados.map((r) => ({ ...r, estimativaCents: r.estimativaCents?.toString() ?? null })),
    totalCents: totalCents.toString(),
    versaoRegras: VERSAO_REGRAS,
  })

  return { ok: "Etapa salva com sucesso." }
}
