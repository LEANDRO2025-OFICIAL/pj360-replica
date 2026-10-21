import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCnpj, isValidCnpj, normalizeCnpj } from "./cnpj.ts";

test("isValidCnpj", () => {
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11222333000182"), false);
  assert.equal(isValidCnpj("12.ABC.345/01DE-35"), true); // exemplo alfanumérico da Receita
  assert.equal(isValidCnpj("12ABC34501DE36"), false);
  assert.equal(isValidCnpj("00000000000000"), false);
  assert.equal(isValidCnpj("123"), false);
});

test("normalize e format", () => {
  assert.equal(normalizeCnpj(" 12.abc.345/01de-35 "), "12ABC34501DE35");
  assert.equal(formatCnpj("11222333000181"), "11.222.333/0001-81");
});
