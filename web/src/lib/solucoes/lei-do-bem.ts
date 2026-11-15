import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.leiDoBem
const pct = (n: number) => BigInt(Math.round(n * 10000))

export const leiDoBem: Solucao = {
  slug: "lei-do-bem",
  nome: "Lei do Bem (Inovação)",
  grupo: "TAX",
  pilar: "reducao_custos",
  area: "Tributário administrativo",
  avaliar: ({ regime, faturamentoMedioCents: fat }) => {
    const regimeOk = regime === "REAL" || regime === "PRESUMIDO"
    if (!regimeOk || fat <= 0n) {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: "Exige regime de Lucro Real ou Presumido e faturamento informado." }
    }
    // crédito estimado sobre o IRPJ/CSLL de inovação (fração conservadora do faturamento)
    const estimativa = (fat * pct(p.aliquotaInovacao)) / 10000n
    return {
      elegivel: true,
      prioridade: estimativa >= p.prioridadeAltaAcimaCents ? "alto" : "medio",
      estimativaCents: estimativa,
      motivo: "Possível crédito de IRPJ/CSLL sobre despesas de inovação tecnológica.",
      detalhe: { faturamentoCents: fat.toString() },
    }
  },
}
