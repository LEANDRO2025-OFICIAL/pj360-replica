import "server-only"
import { avaliarTudo, VERSAO_REGRAS } from "@/lib/solucoes"
import type { Dados, Diagnostico, EntradaConfirmada } from "./types"

// shortcut: dados em memória, somem ao reiniciar o servidor; troca pela versão Supabase no /replica-backend.
const g = globalThis as unknown as { __dados?: Map<string, Diagnostico> }

function seed(): Map<string, Diagnostico> {
  const m = new Map<string, Diagnostico>()
  const entrada: EntradaConfirmada = {
    regime: "REAL",
    origem: "minha_carteira",
    faturamentoMedioCents: "4000000000",
    colaboradoresClt: 120,
    passivoTributarioCents: "1000000000",
  }
  const { resultados, totalCents } = avaliarTudo({
    regime: entrada.regime,
    faturamentoMedioCents: BigInt(entrada.faturamentoMedioCents),
    colaboradoresClt: entrada.colaboradoresClt,
    passivoTributarioCents: BigInt(entrada.passivoTributarioCents),
  })
  const exemplo: Diagnostico = {
    id: "00000000-0000-4000-8000-000000000001",
    cnpj: "11222333000181",
    razaoSocial: "Atacado Exemplo Ltda (dados fictícios)",
    observacao: "Cliente de demonstração",
    empresa: null,
    status: "concluido",
    entrada,
    oportunidades: resultados.map((r) => ({ ...r, estimativaCents: r.estimativaCents?.toString() ?? null })),
    totalCents: totalCents.toString(),
    versaoRegras: VERSAO_REGRAS,
    criadoEm: "2026-10-20T13:00:00.000Z",
  }
  m.set(exemplo.id, exemplo)
  return m
}

const db = (g.__dados ??= seed())

export const dados: Dados = {
  async listarDiagnosticos(filtro) {
    const q = filtro?.q?.trim().toLowerCase()
    return [...db.values()]
      .filter((d) => !q || d.razaoSocial.toLowerCase().includes(q) || d.cnpj.includes(q.replace(/[^0-9a-z]/g, "").toUpperCase()))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  },
  async obterDiagnostico(id) {
    return db.get(id) ?? null
  },
  async criarDiagnostico(input) {
    const d: Diagnostico = {
      ...input,
      id: crypto.randomUUID(),
      status: "aguardando_confirmacao",
      entrada: null,
      oportunidades: [],
      totalCents: "0",
      versaoRegras: null,
      criadoEm: new Date().toISOString(),
    }
    db.set(d.id, d)
    return d
  },
  async salvarResultado(id, r) {
    const atual = db.get(id)
    if (!atual) throw new Error("Diagnóstico não encontrado")
    const d: Diagnostico = { ...atual, ...r, status: "concluido" }
    db.set(id, d)
    return d
  },
}
