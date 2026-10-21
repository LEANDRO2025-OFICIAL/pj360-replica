import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBRL, formatBRLCompact, parseBRL } from "./money.ts";

test("formatBRLCompact", () => {
  assert.equal(formatBRLCompact(4348000000n), "R$ 43,5 mi");
  assert.equal(formatBRLCompact(13720719477n), "R$ 137,2 mi");
  assert.equal(formatBRLCompact(null), "—");
});

test("formatBRL", () => {
  assert.equal(formatBRL(13720719477n), "R$ 137.207.194,77");
  assert.equal(formatBRL("5"), "R$ 0,05");
  assert.equal(formatBRL(0), "R$ 0,00");
  assert.equal(formatBRL(-150n), "-R$ 1,50");
  assert.equal(formatBRL(null), "—");
  assert.equal(formatBRL(900719925474099312n), "R$ 9.007.199.254.740.993,12"); // acima de 2^53
});

test("parseBRL", () => {
  assert.equal(parseBRL("1.234,56"), 123456n);
  assert.equal(parseBRL("R$ 10"), 1000n);
  assert.equal(parseBRL("0,5"), 50n);
  assert.equal(parseBRL(""), null);
  assert.equal(parseBRL("1,2,3"), null);
});
