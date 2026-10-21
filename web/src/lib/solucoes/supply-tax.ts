import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.supplyTax

export const supplyTax: Solucao = {
  slug: "supply-tax",
  nome: "Planejamento tributário da cadeia de suprimentos",
  grupo: "TAX",
  pilar: "reducao_custos",
  area: "Planejamento tributário",
  avaliar: ({ regime, faturamentoMedioCents: fat }) => {
    const regimeOk = regime === "REAL" || regime === "PRESUMIDO"
    const elegivel = regimeOk && fat >= p.faturamentoMinimoCents
    return {
      elegivel,
      prioridade: elegivel ? "medio" : "baixo",
      estimativaCents: null, // só elegibilidade: o valor depende de análise da operação
      motivo: elegivel
        ? "Lucro Real ou Presumido com faturamento para ganho em compras e logística."
        : "Exige Lucro Real ou Presumido e faturamento médio a partir de R$ 20 milhões.",
    }
  },
}
