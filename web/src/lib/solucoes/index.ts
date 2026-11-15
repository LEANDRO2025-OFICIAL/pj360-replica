import { transacaoTributaria } from "./transacao-tributaria.ts"
import { revisaoPrevidenciaria } from "./revisao-previdenciaria.ts"
import { supplyTax } from "./supply-tax.ts"
import { pontosQualificados } from "./pontos-qualificados.ts"
import { leiDoBem } from "./lei-do-bem.ts"
import { revisaoTributaria } from "./revisao-tributaria.ts"
import { apuracaoAssistida } from "./apuracao-assistida.ts"
import { redccaoCustosVT } from "./reducao-custos-vt.ts"
import { renegociacaoDividas } from "./renegociacao-dividas.ts"
import { antecipacaoRecebiveis } from "./antecipacao-recebiveis.ts"
import { reducaoEnergia } from "./reducao-custos-energia.ts"
import {
  cambio,
  fidcCaptacao,
  fidcOtimizacao,
  planoEmpresario,
  reperfilamentoDivida,
  seguroResponsabilidadeCivil,
  seguroGarantia,
  seguroSucessao,
} from "./solucoes-bancarias-familiares.ts"
import { governanca, holdingParticipacoes, holdingPatrimonial } from "./solucoes-bancarias-familiares.ts"
import { ma } from "./solucoes-bancarias-familiares.ts"
import { agrocenarios, planejamentoIntegrado, regularizacaoFundiaria } from "./solucoes-corporativas.ts"
import type { Entrada, Saida, Solucao } from "./types.ts"

// Sobe quando qualquer regra ou premissa mudar: fica gravado em cada diagnóstico.
export const VERSAO_REGRAS = "2026-10-21.3"

export const CATALOGO: Solucao[] = [
  transacaoTributaria,
  revisaoPrevidenciaria,
  supplyTax,
  pontosQualificados,
  leiDoBem,
  revisaoTributaria,
  apuracaoAssistida,
  redccaoCustosVT,
  renegociacaoDividas,
  antecipacaoRecebiveis,
  reducaoEnergia,
  agrocenarios,
  planejamentoIntegrado,
  regularizacaoFundiaria,
  cambio,
  fidcCaptacao,
  fidcOtimizacao,
  planoEmpresario,
  reperfilamentoDivida,
  seguroResponsabilidadeCivil,
  seguroGarantia,
  seguroSucessao,
  governanca,
  holdingParticipacoes,
  holdingPatrimonial,
  ma,
]

export type Resultado = Saida & Pick<Solucao, "slug" | "nome" | "grupo" | "pilar" | "area">

export function avaliarTudo(e: Entrada): { resultados: Resultado[]; totalCents: bigint } {
  const resultados = CATALOGO.map(({ avaliar, ...meta }) => ({ ...meta, ...avaliar(e) }))
  const totalCents = resultados.reduce((t, r) => t + (r.elegivel && r.estimativaCents ? r.estimativaCents : 0n), 0n)
  return { resultados, totalCents }
}
