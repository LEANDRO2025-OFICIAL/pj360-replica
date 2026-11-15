import type { Solucao } from "./types.ts"

export const agrocenarios: Solucao = {
  slug: "agrocenarios",
  nome: "Agrocenários",
  grupo: "CORPORATE",
  pilar: "reducao_custos",
  area: "Agronegócio",
  avaliar: ({ faturamentoMedioCents: fat }) => {
    const elegivel = fat > 0n
    return {
      elegivel,
      prioridade: fat > 0n ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Análise de cenários agrícolas com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}

export const planejamentoIntegrado: Solucao = {
  slug: "planejamento-integrado",
  nome: "Planejamento Integrado",
  grupo: "CORPORATE",
  pilar: "aumento_performance",
  area: "Corporate",
  avaliar: ({ faturamentoMedioCents: fat }) => {
    const elegivel = fat > 0n
    return {
      elegivel,
      prioridade: fat > 0n ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Planejamento tributário integrado com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}

export const regularizacaoFundiaria: Solucao = {
  slug: "regularizacao-fundiaria",
  nome: "Regularização Fundiária",
  grupo: "CORPORATE",
  pilar: "compliance",
  area: "Corporate",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de imóveis e documentação fundiária não disponíveis no diagnóstico inicial.",
  }),
}
