import type { Solucao } from "./types.ts"

export const redccaoCustosVT: Solucao = {
  slug: "reducao-custos-vt",
  nome: "Redução de Custos de Vale Transporte",
  grupo: "CORPORATE",
  pilar: "reducao_custos",
  area: "Corporate",
  avaliar: ({ colaboradoresClt: clt }) => {
    const elegivel = clt > 0
    return {
      elegivel,
      prioridade: clt >= 20 ? "medio" : "baixo",
      estimativaCents: null,
      motivo: elegivel
        ? `Possível redução no vale transporte para ${clt} funcionário(s) CLT.`
        : "Sem funcionários CLT informados.",
    }
  },
}
