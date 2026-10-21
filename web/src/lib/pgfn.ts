import "server-only"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"

// Dívida ativa da União por CNPJ, importada dos dados abertos da PGFN (npm run pgfn:importar).
// shortcut: SQLite local em web/data/pgfn; para deploy, importar a mesma tabela no Supabase.
export type PassivoPgfn = {
  tributarioCents: string // não previdenciário + previdenciário
  fgtsCents: string
  inscricoes: number
  referencia: string | null
}

const arquivo = join(process.cwd(), "data", "pgfn", "pgfn.sqlite")
let db: DatabaseSync | null = null

export function consultarPassivo(cnpj: string): PassivoPgfn | null {
  if (!db) {
    if (!existsSync(arquivo)) return null // base ainda não importada
    db = new DatabaseSync(arquivo, { readOnly: true })
  }
  const p = db
    .prepare("select nao_prev_cents + prev_cents as trib, fgts_cents as fgts, inscricoes from passivo where cnpj = ?")
    .get(cnpj) as { trib: number; fgts: number; inscricoes: number } | undefined
  const ref = db.prepare("select valor from meta where chave = 'referencia'").get() as { valor: string } | undefined
  if (!p) return { tributarioCents: "0", fgtsCents: "0", inscricoes: 0, referencia: ref?.valor ?? null }
  return { tributarioCents: String(p.trib), fgtsCents: String(p.fgts), inscricoes: p.inscricoes, referencia: ref?.valor ?? null }
}
