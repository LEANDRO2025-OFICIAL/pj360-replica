// CNPJ numérico ou alfanumérico (Receita, 2026): 12 caracteres [0-9A-Z] + 2 DVs numéricos.
// Valor de cada caractere = código ASCII - 48 (0-9 → 0-9, A → 17 ... Z → 42); módulo 11.

export function normalizeCnpj(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function dv(base: string): number {
  let peso = 2;
  let soma = 0;
  for (let i = base.length - 1; i >= 0; i--) {
    soma += (base.charCodeAt(i) - 48) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const r = soma % 11;
  return r < 2 ? 0 : 11 - r;
}

export function isValidCnpj(input: string): boolean {
  const c = normalizeCnpj(input);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
  if (/^(.)\1{13}$/.test(c)) return false;
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

// 12ABC34501DE35 -> 12.ABC.345/01DE-35
export function formatCnpj(input: string): string {
  const c = normalizeCnpj(input);
  if (c.length !== 14) return input;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}
