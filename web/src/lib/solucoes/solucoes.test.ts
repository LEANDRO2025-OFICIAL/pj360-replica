import assert from "node:assert/strict";
import { test } from "node:test";
import { avaliarTudo } from "./index.ts";
import { revisaoPrevidenciaria } from "./revisao-previdenciaria.ts";
import { supplyTax } from "./supply-tax.ts";
import { transacaoTributaria } from "./transacao-tributaria.ts";
import type { Entrada } from "./types.ts";

const base: Entrada = { regime: "REAL", faturamentoMedioCents: 4000000000n, colaboradoresClt: 120, passivoTributarioCents: 1000000000n };

test("transação: SIM com passivo, NÃO sem", () => {
  const sim = transacaoTributaria.avaliar(base);
  assert.equal(sim.elegivel, true);
  assert.equal(sim.estimativaCents, 400000000n); // 40% de R$ 10 mi
  assert.equal(sim.prioridade, "alto"); // passivo = 25% do faturamento
  assert.equal(transacaoTributaria.avaliar({ ...base, passivoTributarioCents: 0n }).elegivel, false);
});

test("previdenciária: SIM no Real, NÃO no Simples e com poucos CLT", () => {
  const sim = revisaoPrevidenciaria.avaliar(base);
  assert.equal(sim.elegivel, true);
  // 120 × 3.500 × 13,33 = 5.598.600 /ano; × 20% × 5% × 5 anos = 279.930
  assert.equal(sim.estimativaCents, 27993000n);
  assert.equal(sim.prioridade, "medio");
  assert.equal(revisaoPrevidenciaria.avaliar({ ...base, regime: "SIMPLES" }).elegivel, false);
  assert.equal(revisaoPrevidenciaria.avaliar({ ...base, colaboradoresClt: 3 }).elegivel, false);
});

test("supply tax: só elegibilidade", () => {
  assert.equal(supplyTax.avaliar(base).elegivel, true);
  assert.equal(supplyTax.avaliar(base).estimativaCents, null);
  assert.equal(supplyTax.avaliar({ ...base, regime: "PRESUMIDO", faturamentoMedioCents: 100n }).elegivel, false);
});

test("total soma só elegíveis com valor", () => {
  const { totalCents, resultados } = avaliarTudo(base);
  assert.equal(resultados.length, 3);
  assert.equal(totalCents, 400000000n + 27993000n);
});
