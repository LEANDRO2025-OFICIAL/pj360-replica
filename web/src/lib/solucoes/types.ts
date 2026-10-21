export type Regime = "SIMPLES" | "PRESUMIDO" | "REAL" | "NAO_SE_ENQUADRA"
export type Grupo = "TAX" | "CONTABILIDADE" | "CORPORATE" | "BANK" | "ENERGY" | "FAMILY" | "BROKERS"
export type Pilar = "reducao_custos" | "aumento_performance" | "compliance"
export type Prioridade = "alto" | "medio" | "baixo"

// Entradas confirmadas pelo consultor (S06). Dinheiro em centavos.
export type Entrada = {
  regime: Regime
  faturamentoMedioCents: bigint
  colaboradoresClt: number
  passivoTributarioCents: bigint
}

export type Saida = {
  elegivel: boolean
  prioridade: Prioridade
  estimativaCents: bigint | null // null = sem valor estimado
  motivo: string // por que é (ou não é) oportunidade, em linguagem do consultor
  detalhe?: Record<string, string>
}

export type Solucao = {
  slug: string
  nome: string
  grupo: Grupo
  pilar: Pilar
  area: string
  avaliar: (e: Entrada) => Saida
}
