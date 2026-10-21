// Dados cadastrais públicos do CNPJ (dados abertos da Receita) via BrasilAPI. Sem chave.
// https://brasilapi.com.br/docs#tag/CNPJ
export type EmpresaPublica = {
  razaoSocial: string
  nomeFantasia: string | null
  cnaePrincipal: string | null
  atividade: string | null
  naturezaJuridica: string | null
  endereco: string
  optanteSimples: boolean | null
  // forma de tributação declarada à Receita no ano mais recente publicado (dados abertos de regime tributário)
  regime: "SIMPLES" | "PRESUMIDO" | "REAL" | null
  regimeAno: number | null
  pgfn?: import("./pgfn").PassivoPgfn | null // dívida ativa da União (dados abertos PGFN), anexada na criação
  socios: { nome: string; qualificacao: string | null }[]
}

type Resposta = {
  razao_social?: string
  nome_fantasia?: string
  cnae_fiscal?: number
  cnae_fiscal_descricao?: string
  natureza_juridica?: string
  logradouro?: string
  numero?: string
  bairro?: string
  municipio?: string
  uf?: string
  opcao_pelo_simples?: boolean | null
  regime_tributario?: { ano?: number; forma_de_tributacao?: string }[]
  qsa?: { nome_socio?: string; qualificacao_socio?: string }[]
}

// Simples vale o cadastro atual; senão, a forma de tributação do ano mais recente (Lucro Real / Presumido).
function regimeDe(d: Resposta): Pick<EmpresaPublica, "regime" | "regimeAno"> {
  if (d.opcao_pelo_simples) return { regime: "SIMPLES", regimeAno: null }
  const ultimo = (d.regime_tributario ?? []).toSorted((a, b) => (b.ano ?? 0) - (a.ano ?? 0))[0]
  const forma = ultimo?.forma_de_tributacao?.toUpperCase() ?? ""
  const regime = forma.includes("REAL") ? "REAL" : forma.includes("PRESUMIDO") ? "PRESUMIDO" : null
  return { regime, regimeAno: regime ? (ultimo?.ano ?? null) : null }
}

// null = não encontrado ou fonte fora do ar; a tela de confirmação abre para digitação manual.
export async function buscarCnpj(cnpj: string): Promise<EmpresaPublica | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      // sem User-Agent próprio a API responde 403 (bloqueio de bot) para o fetch do Node
      headers: { "User-Agent": "diagnostico-escritorio/0.1 (uso interno)", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const d = (await res.json()) as Resposta
    if (!d.razao_social) return null
    return {
      razaoSocial: d.razao_social,
      nomeFantasia: d.nome_fantasia || null,
      cnaePrincipal: d.cnae_fiscal ? String(d.cnae_fiscal) : null,
      atividade: d.cnae_fiscal_descricao ?? null,
      naturezaJuridica: d.natureza_juridica ?? null,
      endereco: [d.logradouro, d.numero, d.bairro, d.municipio && `${d.municipio}/${d.uf}`].filter(Boolean).join(", "),
      optanteSimples: d.opcao_pelo_simples ?? null,
      ...regimeDe(d),
      socios: (d.qsa ?? []).map((s) => ({ nome: s.nome_socio ?? "", qualificacao: s.qualificacao_socio ?? null })),
    }
  } catch {
    return null
  }
}
