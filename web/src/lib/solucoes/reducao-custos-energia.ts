import type { Solucao } from "./types.ts"

export const reducaoEnergia: Solucao = {
  slug: "reducao-custos-energia",
  nome: "Redução de Custos com Energia Elétrica",
  grupo: "ENERGY",
  pilar: "reducao_custos",
  area: "Energia",
  avaliar: ({ faturamentoMedioCents: fat }) => {
    const elegivel = fat > 0n
    return {
      elegivel,
      prioridade: fat > 0n ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Análise da fatura de energia com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}
