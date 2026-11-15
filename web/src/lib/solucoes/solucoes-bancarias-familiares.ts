import type { Solucao } from "./types.ts"

// ===== BANK =====

export const cambio: Solucao = {
  slug: "cambio",
  nome: "Câmbio",
  grupo: "BANK",
  pilar: "reducao_custos",
  area: "Bank",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de operações de câmbio não disponíveis no diagnóstico inicial.",
  }),
}

export const fidcCaptacao: Solucao = {
  slug: "fidc-captacao-recursos",
  nome: "FIDC - Captação de Recursos",
  grupo: "BANK",
  pilar: "aumento_performance",
  area: "Bank",
  avaliar: ({ faturamentoMedioCents: fat }) => {
    const elegivel = fat > 0n
    return {
      elegivel,
      prioridade: fat > 0n ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Estrutura de FIDC com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}

export const fidcOtimizacao: Solucao = {
  slug: "fidc-otimizacao-tributaria",
  nome: "FIDC - Otimização Tributária",
  grupo: "BANK",
  pilar: "reducao_custos",
  area: "Bank",
  avaliar: ({ faturamentoMedioCents: fat }) => {
    const elegivel = fat > 0n
    return {
      elegivel,
      prioridade: fat > 0n ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Otimização tributária via FIDC com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}

export const planoEmpresario: Solucao = {
  slug: "plano-empresario",
  nome: "Plano Empresário",
  grupo: "BANK",
  pilar: "aumento_performance",
  area: "Bank",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de crédito e garantias não disponíveis no diagnóstico inicial.",
  }),
}

export const reperfilamentoDivida: Solucao = {
  slug: "reperfilamento-divida",
  nome: "Reperfilamento de Dívida",
  grupo: "BANK",
  pilar: "reducao_custos",
  area: "Bank",
  avaliar: ({ passivoTributarioCents: passivo }) => {
    const elegivel = passivo > 0n
    return {
      elegivel,
      prioridade: passivo > 0n ? "alto" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Possível reperfilamento de dívidas com base em passivo de R$ ${(passivo / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem passivo informado.",
    }
  },
}

export const seguroResponsabilidadeCivil: Solucao = {
  slug: "seguro-responsabilidade-civil",
  nome: "Seguro de Responsabilidade Civil",
  grupo: "BANK",
  pilar: "compliance",
  area: "Bank",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de atividade e exposição a risco não disponíveis no diagnóstico inicial.",
  }),
}

export const seguroGarantia: Solucao = {
  slug: "seguro-garantia-licitante-executante",
  nome: "Seguro Garantia Licitante e Executante",
  grupo: "BANK",
  pilar: "compliance",
  area: "Bank",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de licitações e contratos não disponíveis no diagnóstico inicial.",
  }),
}

export const seguroSucessao: Solucao = {
  slug: "seguro-sucessao-empresarial",
  nome: "Seguro Sucessão Empresarial",
  grupo: "BANK",
  pilar: "compliance",
  area: "Bank",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados societários e familiares não disponíveis no diagnóstico inicial.",
  }),
}

// ===== FAMILY =====

export const governanca: Solucao = {
  slug: "governanca",
  nome: "Governança Corporativa",
  grupo: "FAMILY",
  pilar: "compliance",
  area: "Family",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de estrutura societária e familiares não disponíveis no diagnóstico inicial.",
  }),
}

export const holdingParticipacoes: Solucao = {
  slug: "holding-participacoes",
  nome: "Holding de Participações",
  grupo: "FAMILY",
  pilar: "compliance",
  area: "Family",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de participação societária não disponíveis no diagnóstico inicial.",
  }),
}

export const holdingPatrimonial: Solucao = {
  slug: "holding-patrimonial",
  nome: "Holding Patrimonial",
  grupo: "FAMILY",
  pilar: "compliance",
  area: "Family",
  avaliar: () => ({
    elegivel: false,
    prioridade: "baixo",
    estimativaCents: null,
    motivo: "Requer dados de patrimônio e sucessão não disponíveis no diagnóstico inicial.",
  }),
}

// ===== BROKERS =====

export const ma: Solucao = {
  slug: "m-a",
  nome: "M&A (Fusões e Aquisições)",
  grupo: "BROKERS",
  pilar: "aumento_performance",
  area: "Brokers",
  avaliar: ({ faturamentoMedioCents: fat }) => {
    const elegivel = fat > 0n
    return {
      elegivel,
      prioridade: fat > 0n ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Avaliação de M&A com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}
