// Dados cadastrais públicos do CNPJ (dados abertos da Receita) via BrasilAPI. Sem chave.
// Enriquecimento opcional via API Econodata (requer NEXT_PUBLIC_ECONODATA_API_KEY).
// https://brasilapi.com.br/docs#tag/CNPJ
import { econodata, type EconodataEmpresa } from "./econodata"

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
  // Enriquecimento Econodata (apenas quando a chave da API está configurada)
  faturamentoEstimadoCents?: string | null
  faturamentoVerificadoCents?: string | null
  funcionarios?: number | null
  regimeTributarioEconodata?: "SIMPLES" | "PRESUMIDO" | "REAL" | "NAO_SE_ENQUADRA" | null
  telefone?: string | null
  email?: string | null
  site?: string | null
  sociosEconodata?: Array<{ nome: string; qualificacao: string | null; documento: string | null }>
  decisores?: Array<{ nome: string; cargo: string | null; email: string | null }>
  fonteEconodata?: boolean
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
  // 1. Busca na BrasilAPI (dados públicos da Receita, sempre disponível)
  const publica = await buscarCnpjBrasilApi(cnpj)
  if (!publica) return null

  // 2. Enriquecimento opcional via Econodata (se a chave estiver configurada)
  if (econodata.isConfigured) {
    try {
      const enriquecido = await econodata.buscarPorCnpj(cnpj)
      if (enriquecido) {
        return mesclarEconodata(publica, enriquecido)
      }
    } catch {
      // falha silenciosa: continua com dados da BrasilAPI
    }
  }

  return publica
}

async function buscarCnpjBrasilApi(cnpj: string): Promise<EmpresaPublica | null> {
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

function mesclarEconodata(
  publica: EmpresaPublica,
  econ: EconodataEmpresa,
): EmpresaPublica {
  // faturamento_estimado já vem em centavos (string) da API Econodata v4
  return {
    ...publica,
    faturamentoEstimadoCents: econ.faturamento_estimado ?? null,
    faturamentoVerificadoCents: null, // não vem na resposta v4 resumida
    funcionarios: econ.funcionarios ?? null,
    regimeTributarioEconodata: econ.regime_tributario
      ? (econ.regime_tributario as EmpresaPublica["regimeTributarioEconodata"])
      : null,
    telefone: econ.telefone ?? null,
    email: econ.email ?? null,
    site: econ.site ?? null,
    sociosEconodata: econ.socios.length > 0 ? econ.socios : undefined,
    decisores: econ.decisores.length > 0 ? econ.decisores : undefined,
    fonteEconodata: true,
  }
}
