import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.previdenciaria
const fator = (n: number) => BigInt(Math.round(n * 10000))

export const revisaoPrevidenciaria: Solucao = {
  slug: "revisao-previdenciaria",
  nome: "Revisão Previdenciária",
  grupo: "TAX",
  pilar: "reducao_custos",
  area: "Tributário administrativo",
  avaliar: ({ regime, colaboradoresClt: clt }) => {
    if (regime === "SIMPLES") {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: "No Simples a contribuição patronal vem no DAS." }
    }
    if (clt < p.minimoColaboradores) {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: `Menos de ${p.minimoColaboradores} funcionários CLT.` }
    }
    // folha anual × alíquota patronal × fração com tese × anos não prescritos
    const folhaAnual = (BigInt(clt) * p.salarioMedioMensalCents * fator(p.mesesPorAno)) / 10000n
    const estimativa =
      (folhaAnual * fator(p.aliquotaPatronal) * fator(p.fracaoVerbasIndenizatorias) * BigInt(p.anosPrescricao)) / 100000000n
    return {
      elegivel: true,
      prioridade: estimativa >= p.prioridadeAltaAcimaCents ? "alto" : "medio",
      estimativaCents: estimativa,
      motivo: "Folha relevante com verbas que podem sair da base do INSS patronal.",
      detalhe: { folhaAnualCents: folhaAnual.toString() },
    }
  },
}
