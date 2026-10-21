import { PREMISSAS } from "./premissas.ts"
import type { Solucao } from "./types.ts"

const p = PREMISSAS.transacao
const pct = (n: number) => BigInt(Math.round(n * 10000))

export const transacaoTributaria: Solucao = {
  slug: "transacao-tributaria",
  nome: "Transação Tributária",
  grupo: "TAX",
  pilar: "reducao_custos",
  area: "Tributário administrativo",
  avaliar: ({ passivoTributarioCents: passivo, faturamentoMedioCents: fat }) => {
    if (passivo <= 0n) {
      return { elegivel: false, prioridade: "baixo", estimativaCents: null, motivo: "Sem passivo tributário informado." }
    }
    const estimativa = (passivo * pct(p.descontoEstimado)) / 10000n
    const teto = (passivo * pct(p.descontoMaximo)) / 10000n
    const alto = fat > 0n && passivo * 10000n >= fat * pct(p.prioridadeAltaSePassivoSobreFaturamento)
    return {
      elegivel: true,
      prioridade: alto ? "alto" : "medio",
      estimativaCents: estimativa,
      motivo: "Há passivo tributário que pode ser negociado com desconto em juros e multas.",
      detalhe: { passivoCents: passivo.toString(), tetoCents: teto.toString() },
    }
  },
}
