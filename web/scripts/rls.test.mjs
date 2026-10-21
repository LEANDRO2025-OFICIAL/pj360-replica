// Teste das regras de acesso (RLS) contra as migrations reais, num Postgres em memória (PGlite).
// Não precisa de chaves nem de rede: npm run test:rls
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { test } from "node:test"
import { PGlite } from "@electric-sql/pglite"

const pasta = new URL("../../supabase/migrations/", import.meta.url)
const A = "00000000-0000-0000-0000-00000000000a"
const B = "00000000-0000-0000-0000-00000000000b"

async function banco() {
  const db = new PGlite()
  // stubs do que o Supabase fornece: schema auth, auth.uid() e o papel authenticated
  await db.exec(`create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
    create role authenticated;`)
  for (const f of readdirSync(pasta).filter((n) => n.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(new URL(f, pasta), "utf8").replace("create extension if not exists pgcrypto;", ""))
  }
  await db.exec(`grant usage on schema public to authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
    insert into auth.users values ('${A}', 'a@exemplo.test'), ('${B}', 'b@exemplo.test');`)
  return db
}

const como = (db, uid) => db.exec(`reset role; set app.uid = '${uid}'; set role authenticated;`)

test("cada usuário cai no próprio escritório e não vê o do outro", async () => {
  const db = await banco()

  await como(db, A)
  const ea = (await db.query("select garantir_escritorio() as id")).rows[0].id
  await db.exec(`insert into empresas (escritorio_id, cnpj, razao_social) values ('${ea}', '11222333000181', 'Empresa de A')`)
  assert.equal((await db.query("select garantir_escritorio() as id")).rows[0].id, ea, "segunda chamada devolve o mesmo escritório")

  await como(db, B)
  const eb = (await db.query("select garantir_escritorio() as id")).rows[0].id
  assert.notEqual(eb, ea)
  assert.equal((await db.query("select * from empresas")).rows.length, 0, "B não vê empresas de A")
  assert.equal((await db.query("select * from escritorios")).rows.length, 1, "B só vê o próprio escritório")
  await assert.rejects(
    db.exec(`insert into empresas (escritorio_id, cnpj, razao_social) values ('${ea}', '99999999000191', 'invasão')`),
    /row-level security/,
    "B não grava no escritório de A",
  )
  assert.equal((await db.query("update empresas set razao_social = 'x' returning id")).rows.length, 0, "B não altera dados de A")
  assert.equal((await db.query("select * from solucoes")).rows.length, 3, "catálogo é visível para todos os logados")
  await assert.rejects(db.exec(`insert into solucoes (slug, nome, grupo, area) values ('x', 'x', 'TAX', 'x')`), /row-level security/)
})

test("sem login não acessa nada", async () => {
  const db = await banco()
  await db.exec("reset role; set app.uid = ''; set role authenticated;")
  await assert.rejects(db.query("select garantir_escritorio()"), /não autenticado/)
  assert.equal((await db.query("select * from diagnosticos")).rows.length, 0)
})
