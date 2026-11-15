import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.apuracaoAssistida
const pct = (n: number) => BigInt(Math.round(n * 10000))

export const apuracaoAssistida: Solucao = {
  slug: "apuracao-assistida",
  nome: "Apuração Assistida",
  grupo: "CONTABILIDADE",
  pilar: "reducao_custos",
  area: "Contabilidade",
  avaliar: ({ regime, faturamentoMedioCents: fat }) => {
    const regimeOk = regime === "REAL" || regime === "PRESUMIDO"
    if (!regimeOk || fat <= 0n) {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: "Exige regime de Lucro Real ou Presumido e faturamento informado." }
    }
    // economia estimada na apuração de tributos (fração do faturamento)
    const estimativa = (fat * pct(p.economiaApuracao)) / 10000n
    return {
      elegivel: true,
      prioridade: estimativa >= p.prioridadeAltaAcimaCents ? "alto" : "medio",
      estimativaCents: estimativa,
      motivo: "Revisão da apuração mensal de IRPJ, CSLL, PIS e COFINS para reduzir a carga tributária.",
      detalhe: { faturamentoCents: fat.toString() },
    }
  },
}
