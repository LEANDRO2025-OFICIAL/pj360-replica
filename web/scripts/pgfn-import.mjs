// Importa a dívida ativa da União (dados abertos da PGFN) para web/data/pgfn/pgfn.sqlite, somada por CNPJ.
// Uso:  npm run pgfn:importar -- 2026_trimestre_02 [--baixar]
//   --baixar  baixa os 3 zips de https://dadosabertos.pgfn.gov.br/<trimestre>/ (~1,4 GB no total)
//   sem --baixar, usa os zips que já estiverem em web/data/pgfn/<trimestre>/
// Considera só devedor PRINCIPAL pessoa jurídica. Valores em centavos.
import { execFileSync } from "node:child_process"
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import { createInterface } from "node:readline"
import { Readable } from "node:stream"
import { fileURLToPath } from "node:url"
import { pipeline } from "node:stream/promises"
import { DatabaseSync } from "node:sqlite"

const [trimestre, ...flags] = process.argv.slice(2)
if (!/^\d{4}_trimestre_0[1-4]$/.test(trimestre ?? "")) throw new Error("Informe o trimestre, ex.: 2026_trimestre_02")
const base = fileURLToPath(new URL("../data/pgfn/", import.meta.url))
const pasta = join(base, trimestre)
mkdirSync(pasta, { recursive: true })

const BASES = { Nao_Previdenciario: "nao_prev_cents", Previdenciario: "prev_cents", FGTS: "fgts_cents" }

if (flags.includes("--baixar")) {
  for (const nome of Object.keys(BASES)) {
    const destino = join(pasta, `Dados_abertos_${nome}.zip`)
    if (existsSync(destino)) continue
    console.log(`baixando ${nome}...`)
    const res = await fetch(`https://dadosabertos.pgfn.gov.br/${trimestre}/Dados_abertos_${nome}.zip`)
    if (!res.ok || !res.body) throw new Error(`download ${nome}: HTTP ${res.status}`)
    await pipeline(Readable.fromWeb(res.body), createWriteStream(destino))
  }
}

const db = new DatabaseSync(join(base, "pgfn.sqlite"))
db.exec(`create table if not exists passivo (cnpj text primary key, nao_prev_cents integer not null default 0,
  prev_cents integer not null default 0, fgts_cents integer not null default 0, inscricoes integer not null default 0);
  create table if not exists meta (chave text primary key, valor text);
  delete from passivo;`)

// null quando o valor não é um número: contado e reportado, nunca somado como zero em silêncio
const centavos = (v) => {
  const s = (v ?? "").trim().replace(/\./g, (m, i, str) => (str.includes(",") ? "" : m)).replace(",", ".")
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  return Math.round(Number(s) * 100)
}
// tira aspas e o BOM (lido como latin1 vira "ï»¿")
const campo = (x) => (x ?? "").replace(/^﻿|^ï»¿/, "").trim().replace(/^"(.*)"$/, "$1")

for (const [nome, coluna] of Object.entries(BASES)) {
  const zip = join(pasta, `Dados_abertos_${nome}.zip`)
  if (!existsSync(zip)) throw new Error(`Falta ${zip}. Rode com --baixar ou coloque o arquivo na pasta.`)
  const extraido = join(pasta, nome)
  rmSync(extraido, { recursive: true, force: true })
  mkdirSync(extraido)
  // tar do Windows e do macOS (bsdtar) abre .zip sem dependência extra; no Linux costuma haver só unzip
  if (process.platform === "win32") execFileSync("C:\\Windows\\System32\\tar.exe", ["-xf", zip, "-C", extraido])
  else {
    try {
      execFileSync("bsdtar", ["-xf", zip, "-C", extraido])
    } catch (e) {
      if (e.code !== "ENOENT") throw e
      execFileSync("unzip", ["-q", "-o", zip, "-d", extraido])
    }
  }

  const upsert = db.prepare(`insert into passivo (cnpj, ${coluna}, inscricoes) values (?, ?, 1)
    on conflict(cnpj) do update set ${coluna} = ${coluna} + excluded.${coluna}, inscricoes = inscricoes + 1`)
  let linhas = 0
  let invalidos = 0
  for (const arquivo of readdirSync(extraido).filter((f) => f.toLowerCase().endsWith(".csv"))) {
    const caminho = join(extraido, arquivo)
    console.log(`${nome}: ${arquivo} (${Math.round(statSync(caminho).size / 1e6)} MB)`)
    const rl = createInterface({ input: createReadStream(caminho, { encoding: "latin1" }), crlfDelay: Infinity })
    let idx = null
    db.exec("begin")
    for await (const linha of rl) {
      const c = linha.split(";").map(campo)
      if (!idx) {
        const h = c.map((x) => x.toUpperCase())
        idx = { doc: h.indexOf("CPF_CNPJ"), pessoa: h.indexOf("TIPO_PESSOA"), devedor: h.indexOf("TIPO_DEVEDOR"), valor: h.indexOf("VALOR_CONSOLIDADO") }
        if (Object.values(idx).some((i) => i < 0)) throw new Error(`Cabeçalho inesperado em ${arquivo}: ${linha}`)
        continue
      }
      if (!/jur/i.test(c[idx.pessoa] ?? "") || !/principal/i.test(c[idx.devedor] ?? "")) continue
      const cnpj = (c[idx.doc] ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "")
      if (cnpj.length !== 14) continue
      const valor = centavos(c[idx.valor])
      if (valor === null) {
        if (++invalidos <= 5) console.warn(`  valor ilegível em ${arquivo}: ${JSON.stringify(c[idx.valor])}`)
        continue
      }
      upsert.run(cnpj, valor)
      if (++linhas % 200000 === 0) {
        db.exec("commit; begin")
        process.stdout.write(`  ${linhas} inscrições\r`)
      }
    }
    db.exec("commit")
  }
  rmSync(extraido, { recursive: true, force: true })
  console.log(`${nome}: ${linhas} inscrições de PJ (devedor principal)`)
  // mais de 1% ilegível indica formato diferente do esperado: melhor parar que gravar passivo errado
  if (invalidos > linhas / 100) throw new Error(`${nome}: ${invalidos} valores ilegíveis em VALOR_CONSOLIDADO; confira o formato`)
  if (invalidos) console.warn(`${nome}: ${invalidos} valores ilegíveis ignorados`)
}

db.prepare("insert or replace into meta (chave, valor) values ('referencia', ?)").run(trimestre)
const { n } = db.prepare("select count(*) as n from passivo").get()
console.log(`ok: ${n} CNPJs com dívida ativa, referência ${trimestre}`)
db.close()
