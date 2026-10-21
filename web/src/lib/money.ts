// Dinheiro trafega em centavos (bigint no banco, string no JSON). Nunca float.
export function formatBRL(cents: bigint | string | number | null | undefined): string {
  if (cents === null || cents === undefined || cents === "") return "—";
  const c = BigInt(cents);
  const neg = c < 0n;
  const abs = neg ? -c : c;
  // reais + centavos sem passar por float (Intl com number perde precisão acima de 2^53)
  const grouped = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cent = (abs % 100n).toString().padStart(2, "0");
  return `${neg ? "-" : ""}R$ ${grouped},${cent}`;
}

// KPIs e resumos: "R$ 43,5 mi". Só exibição (passa por float); o valor exato vai no title.
const compact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
export function formatBRLCompact(cents: bigint | string | number | null | undefined): string {
  if (cents === null || cents === undefined || cents === "") return "—";
  return compact.format(Number(BigInt(cents)) / 100).replace(/ /g, " ");
}

// "1.234,56" | "1234,5" | "R$ 10" -> 123456n ; null quando vazio ou inválido
export function parseBRL(input: string): bigint | null {
  const s = input.replace(/[^\d,]/g, "");
  if (!s) return null;
  const [int, dec = ""] = s.split(",");
  if (s.split(",").length > 2) return null;
  return BigInt(int || "0") * 100n + BigInt((dec + "00").slice(0, 2));
}
