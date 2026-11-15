import "server-only"
import type { EmpresaPublica } from "@/lib/brasilapi"
import type { Grupo, Pilar, Prioridade, Regime } from "@/lib/solucoes/types"
import { criarClienteServidor } from "@/lib/supabase/server"
import type { Dados, Diagnostico, Oportunidade, Origem, Status } from "./types"

// bigint chega como texto (::text) para não perder precisão no JSON.
const CAMPOS = `id, observacao, status, regime_tributario, origem_cliente, colaboradores_clt,
  faturamento_medio_cents::text, passivo_tributario_cents::text, total_estimado_cents::text, versao_regras, created_at,
  faturamento_economico_cents::text, colaboradores_economicos, regime_tributario_economico, fonte_economica,
  empresas!inner(cnpj, razao_social, dados_publicos)`
const COMPLETO = `${CAMPOS}, oportunidades(elegivel, prioridade, estimativa_cents::text, detalhe, solucoes(slug, nome, grupo, pilar, area, ordem))`

type Linha = {
  id: string
  observacao: string | null
  status: Status | "processando" | "erro"
  regime_tributario: Regime | null
  origem_cliente: Origem
  colaboradores_clt: number | null
  faturamento_medio_cents: string | null
  passivo_tributario_cents: string | null
  total_estimado_cents: string
  versao_regras: string | null
  created_at: string
  faturamento_economico_cents: string | null
  colaboradores_economicos: number | null
  regime_tributario_economico: Regime | null
  fonte_economica: boolean
  empresas: { cnpj: string; razao_social: string; dados_publicos: Partial<EmpresaPublica> }
  oportunidades?: {
    elegivel: boolean
    prioridade: Prioridade
    estimativa_cents: string | null
    detalhe: { motivo?: string }
    solucoes: { slug: string; nome: string; grupo: Grupo; pilar: Pilar; area: string; ordem: number }
  }[]
}

function paraDiagnostico(l: Linha): Diagnostico {
  const concluido = l.status === "concluido" && l.regime_tributario && l.faturamento_medio_cents
  const oportunidades: Oportunidade[] = (l.oportunidades ?? [])
    .toSorted((a, b) => a.solucoes.ordem - b.solucoes.ordem)
    .map((o) => ({
      slug: o.solucoes.slug,
      nome: o.solucoes.nome,
      grupo: o.solucoes.grupo,
      pilar: o.solucoes.pilar,
      area: o.solucoes.area,
      elegivel: o.elegivel,
      prioridade: o.prioridade,
      estimativaCents: o.estimativa_cents,
      motivo: o.detalhe?.motivo ?? "",
    }))
  return {
    id: l.id,
    cnpj: l.empresas.cnpj,
    razaoSocial: l.empresas.razao_social,
    observacao: l.observacao,
    empresa: l.empresas.dados_publicos?.razaoSocial ? (l.empresas.dados_publicos as EmpresaPublica) : null,
    status: concluido ? "concluido" : "aguardando_confirmacao",
    entrada: concluido
      ? {
          regime: l.regime_tributario!,
          origem: l.origem_cliente,
          faturamentoMedioCents: l.faturamento_medio_cents!,
          colaboradoresClt: l.colaboradores_clt ?? 0,
          passivoTributarioCents: l.passivo_tributario_cents ?? "0",
          faturamentoEconomicoCents: l.faturamento_economico_cents ?? null,
          colaboradoresEconomicos: l.colaboradores_economicos ?? null,
          regimeTributarioEconomico: l.regime_tributario_economico ?? null,
          fonteEconomica: l.fonte_economica,
        }
      : null,
    oportunidades,
    totalCents: l.total_estimado_cents,
    versaoRegras: l.versao_regras,
    criadoEm: l.created_at,
  }
}

function falhou(op: string, error: { message: string } | null): never {
  throw new Error(`Falha ao ${op}: ${error?.message ?? "sem resposta"}`)
}

export const dados: Dados = {
  async listarDiagnosticos(filtro) {
    const sb = await criarClienteServidor()
    let q = sb.from("diagnosticos").select(CAMPOS).order("created_at", { ascending: false })
    // remove caracteres que mudam a sintaxe do filtro do PostgREST
    const busca = filtro?.q?.replace(/[,()%*\\:."']/g, " ").trim()
    if (busca) {
      const cnpj = busca.replace(/[^0-9a-z]/gi, "").toUpperCase()
      q = q.or(`razao_social.ilike.%${busca}%${cnpj ? `,cnpj.ilike.%${cnpj}%` : ""}`, { referencedTable: "empresas" })
    }
    const { data, error } = await q
    if (error) falhou("listar diagnósticos", error)
    return (data as unknown as Linha[]).map(paraDiagnostico)
  },

  async obterDiagnostico(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const sb = await criarClienteServidor()
    const { data, error } = await sb.from("diagnosticos").select(COMPLETO).eq("id", id).maybeSingle()
    if (error) falhou("abrir o diagnóstico", error)
    return data ? paraDiagnostico(data as unknown as Linha) : null
  },

  async criarDiagnostico({ cnpj, razaoSocial, observacao, empresa }) {
    const sb = await criarClienteServidor()
    const { data: escritorioId, error: e1 } = await sb.rpc("garantir_escritorio")
    if (e1) falhou("identificar o escritório", e1)
    const { data: claims } = await sb.auth.getClaims()

    const { data: emp, error: e2 } = await sb
      .from("empresas")
      .upsert(
        {
          escritorio_id: escritorioId,
          cnpj,
          razao_social: razaoSocial,
          nome_fantasia: empresa?.nomeFantasia ?? null,
          natureza_juridica: empresa?.naturezaJuridica ?? null,
          cnae_principal: empresa?.cnaePrincipal ?? null,
          atividade_economica: empresa?.atividade ?? null,
          optante_simples: empresa?.optanteSimples ?? null,
          dados_publicos: empresa ?? {},
          dados_publicos_em: empresa ? new Date().toISOString() : null,
        },
        { onConflict: "escritorio_id,cnpj" },
      )
      .select("id")
      .single()
    if (e2 || !emp) falhou("salvar a empresa", e2)

    const { data, error: e3 } = await sb
      .from("diagnosticos")
      .insert({ escritorio_id: escritorioId, empresa_id: emp.id, criado_por: claims?.claims.sub ?? null, observacao })
      .select(CAMPOS)
      .single()
    if (e3 || !data) falhou("criar o diagnóstico", e3)
    return paraDiagnostico(data as unknown as Linha)
  },

  async salvarResultado(id, r) {
    const sb = await criarClienteServidor()
    const { data: atual, error: e1 } = await sb.from("diagnosticos").select("escritorio_id").eq("id", id).single()
    if (e1 || !atual) falhou("abrir o diagnóstico", e1)

    const { data: catalogo, error: e2 } = await sb.from("solucoes").select("id, slug").in("slug", r.oportunidades.map((o) => o.slug))
    if (e2 || !catalogo) falhou("ler o catálogo de soluções", e2)
    const idPorSlug = new Map(catalogo.map((s) => [s.slug as string, s.id as string]))

    const agora = new Date().toISOString()
    const { error: e3 } = await sb
      .from("diagnosticos")
      .update({
        observacao: r.observacao ?? null,
        regime_tributario: r.entrada!.regime,
        origem_cliente: r.entrada!.origem,
        faturamento_medio_cents: r.entrada!.faturamentoMedioCents,
        colaboradores_clt: r.entrada!.colaboradoresClt,
        passivo_tributario_cents: r.entrada!.passivoTributarioCents,
        faturamento_economico_cents: r.entrada!.faturamentoEconomicoCents ?? null,
        colaboradores_economicos: r.entrada!.colaboradoresEconomicos ?? null,
        regime_tributario_economico: r.entrada!.regimeTributarioEconomico ?? null,
        fonte_economica: r.entrada!.fonteEconomica ?? false,
        total_estimado_cents: r.totalCents,
        versao_regras: r.versaoRegras,
        status: "concluido",
        confirmado_em: agora,
        concluido_em: agora,
        erro: null,
      })
      .eq("id", id)
    if (e3) falhou("salvar os dados confirmados", e3)

    const linhas = r.oportunidades
      .filter((o) => idPorSlug.has(o.slug)) // regra em código sem linha no catálogo: não grava (sobe na próxima migration)
      .map((o) => ({
        escritorio_id: atual.escritorio_id,
        diagnostico_id: id,
        solucao_id: idPorSlug.get(o.slug),
        elegivel: o.elegivel,
        prioridade: o.prioridade,
        estimativa_cents: o.estimativaCents,
        detalhe: { motivo: o.motivo },
      }))
    const { error: e4 } = await sb.from("oportunidades").upsert(linhas, { onConflict: "diagnostico_id,solucao_id" })
    if (e4) falhou("salvar as oportunidades", e4)

    const d = await this.obterDiagnostico(id)
    if (!d) falhou("reabrir o diagnóstico", null)
    return d
  },
}
