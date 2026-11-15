import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.revisaoTributaria
const pct = (n: number) => BigInt(Math.round(n * 10000))

export const revisaoTributaria: Solucao = {
  slug: "revisao-tributaria",
  nome: "Revisão Tributária Administrativa",
  grupo: "TAX",
  pilar: "reducao_custos",
  area: "Tributário administrativo",
  avaliar: ({ regime, faturamentoMedioCents: fat }) => {
    const regimeOk = regime === "REAL" || regime === "PRESUMIDO"
    if (!regimeOk || fat <= 0n) {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: "Exige regime de Lucro Real ou Presumido e faturamento informado." }
    }
    // revisão administrativa de tributos pagos a maior (fração conservadora do faturamento)
    const estimativa = (fat * pct(p.descontoAdministrativo)) / 10000n
    return {
      elegivel: true,
      prioridade: estimativa >= p.prioridadeAltaAcimaCents ? "alto" : "medio",
      estimativaCents: estimativa,
      motivo: "Possível recuperação de tributos pagos indevidamente ou a maior nos últimos 5 anos.",
      detalhe: { faturamentoCents: fat.toString() },
    }
  },
}
