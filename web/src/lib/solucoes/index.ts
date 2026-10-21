import { revisaoPrevidenciaria } from "./revisao-previdenciaria.ts"
import { supplyTax } from "./supply-tax.ts"
import { transacaoTributaria } from "./transacao-tributaria.ts"
import type { Entrada, Saida, Solucao } from "./types.ts"

// Sobe quando qualquer regra ou premissa mudar: fica gravado em cada diagnóstico.
export const VERSAO_REGRAS = "2026-10-21.1"

export const CATALOGO: Solucao[] = [transacaoTributaria, revisaoPrevidenciaria, supplyTax]

export type Resultado = Saida & Pick<Solucao, "slug" | "nome" | "grupo" | "pilar" | "area">

export function avaliarTudo(e: Entrada): { resultados: Resultado[]; totalCents: bigint } {
  const resultados = CATALOGO.map(({ avaliar, ...meta }) => ({ ...meta, ...avaliar(e) }))
  const totalCents = resultados.reduce((t, r) => t + (r.elegivel && r.estimativaCents ? r.estimativaCents : 0n), 0n)
  return { resultados, totalCents }
}
