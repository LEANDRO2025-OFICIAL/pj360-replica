import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.pontosQualificados
const pct = (n: number) => BigInt(Math.round(n * 10000))

export const pontosQualificados: Solucao = {
  slug: "pontos-qualificados",
  nome: "Pontos Qualificados (PJE)",
  grupo: "TAX",
  pilar: "reducao_custos",
  area: "Tributário administrativo",
  avaliar: ({ regime, faturamentoMedioCents: fat, passivoTributarioCents: passivo }) => {
    const regimeOk = regime === "REAL" || regime === "PRESUMIDO"
    if (!regimeOk) {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: "Exige regime de Lucro Real ou Presumido." }
    }
    // desconto sobre o passivo tributário com base na tese de exclusão de ICMS da base do PIS/COFINS
    const estimativa = passivo > 0n ? (passivo * pct(p.descontoPontosQualificados)) / 10000n : null
    return {
      elegivel: passivo > 0n,
      prioridade: estimativa && estimativa >= p.prioridadeAltaAcimaCents ? "alto" : "medio",
      estimativaCents: estimativa,
      motivo: passivo > 0n ? "Possível exclusão de ICMS da base de cálculo do PIS/COFINS (tese do século)." : "Sem passivo tributário informado para mensurar o ganho.",
      detalhe: { passivoCents: passivo.toString() },
    }
  },
}
