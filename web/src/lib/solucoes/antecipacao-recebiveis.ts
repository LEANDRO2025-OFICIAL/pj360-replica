import type { Solucao } from "./types.ts"

export const antecipacaoRecebiveis: Solucao = {
  slug: "antecipacao-recebiveis",
  nome: "Antecipação de Recebíveis",
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
        ? `Antecipação de recebíveis com base em faturamento médio de R$ ${(fat / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem faturamento informado.",
    }
  },
}
