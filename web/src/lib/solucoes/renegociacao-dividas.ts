import type { Solucao } from "./types.ts"

export const renegociacaoDividas: Solucao = {
  slug: "renegociacao-dividas",
  nome: "Renegociação de Dívidas",
  grupo: "CORPORATE",
  pilar: "reducao_custos",
  area: "Corporate",
  avaliar: ({ passivoTributarioCents: passivo }) => {
    const elegivel = passivo > 0n
    return {
      elegivel,
      prioridade: passivo > 0n ? "alto" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Possível renegociação de passivo tributário de R$ ${(passivo / 100n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
        : "Sem passivo tributário informado.",
    }
  },
}
