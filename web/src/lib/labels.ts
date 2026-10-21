import type { Origem } from "@/lib/data/types"
import type { Pilar, Regime } from "@/lib/solucoes/types"

export const REGIMES: Record<Regime, string> = {
  SIMPLES: "Simples Nacional",
  PRESUMIDO: "Lucro Presumido",
  REAL: "Lucro Real",
  NAO_SE_ENQUADRA: "Outro / não se aplica",
}

export const ORIGENS: Record<Origem, string> = {
  prospeccao_fria: "Prospecção",
  indicacao: "Indicação",
  minha_carteira: "Já é cliente",
}

export const PILARES: Record<Pilar, string> = {
  reducao_custos: "Redução de custos",
  aumento_performance: "Aumento de desempenho",
  compliance: "Conformidade",
}

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
export const formatData = (iso: string) => data.format(new Date(iso))
