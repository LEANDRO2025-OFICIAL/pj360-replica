// Cliente para a API Econodata (https://www.econodata.com.br)
// Requer chave de API configurada em NEXT_PUBLIC_ECONODATA_API_KEY
// Sem a chave, o sistema continua usando apenas a BrasilAPI (dados públicos da Receita Federal).
// Com a chave, enriquece com: faturamento estimado, número de funcionários,
// regime tributário, emails, telefones, sites, redes sociais, decisores, etc.

export type EconodataEmpresa = {
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  data_abertura: string | null
  natureza_juridica: string | null
  situacao_cadastral: string | null
  tipo: string | null // MATRIZ | FILIAL
  capital_social: string | null
  opcao_simples: string | null // SIM | NAO
  cnae_principal: string | null
  cnae_principal_descricao: string | null
  cnaes_secundarios: Array<{ codigo: string; descricao: string }>
  endereco: {
    logradouro: string | null
    numero: string | null
    complemento: string | null
    bairro: string | null
    municipio: string | null
    uf: string | null
    cep: string | null
  } | null
  // Campos Premium (requerem chave de API válida)
  faturamento_estimado: string | null
  faturamento_verificado: string | null
  funcionarios: number | null
  regime_tributario: string | null // SIMPLES | PRESUMIDO | REAL | NAO_SE_ENQUADRA
  telefone: string | null
  email: string | null
  site: string | null
  socios: Array<{ nome: string; qualificacao: string | null; documento: string | null }>
  decisores: Array<{ nome: string; cargo: string | null; email: string | null }>
}

type EconodataConfig = {
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

const DEFAULT_CONFIG: EconodataConfig = {
  baseUrl: "https://www.econodata.com.br",
  timeout: 8000,
}

function normalizeCnpj(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export class EconodataClient {
  private config: EconodataConfig

  constructor(config: EconodataConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  get isConfigured(): boolean {
    return Boolean(this.config.apiKey)
  }

  async buscarPorCnpj(cnpj: string): Promise<EconodataEmpresa | null> {
    const c = normalizeCnpj(cnpj)
    if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return null

    if (!this.isConfigured) {
      // Sem chave: retorna null, o sistema continua com BrasilAPI
      return null
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout ?? 8000)

      // Endpoint da API Econodata para consulta de empresa por CNPJ
      const url = `${this.config.baseUrl}/api/v1/empresa/${c}`

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: "application/json",
          "User-Agent": "pj360-diagnostico/1.0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.warn("Econodata: chave de API inválida ou sem acesso")
          return null
        }
        if (res.status === 404) {
          return null
        }
        console.warn(`Econodata: erro ${res.status} ao consultar CNPJ ${c}`)
        return null
      }

      const data = (await res.json()) as any
      return this.mapearResposta(data)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn("Econodata: timeout na consulta")
      } else {
        console.warn("Econodata: erro na consulta", err)
      }
      return null
    }
  }

  private mapearResposta(data: any): EconodataEmpresa {
    return {
      cnpj: data.cnpj || data.cnpj_formatado || "",
      razao_social: data.razao_social || data.razaoSocial || "",
      nome_fantasia: data.nome_fantasia || data.nomeFantasia || null,
      data_abertura: data.data_abertura || data.dataAbertura || null,
      natureza_juridica: data.natureza_juridica || data.naturezaJuridica || null,
      situacao_cadastral: data.situacao_cadastral || data.situacaoCadastral || null,
      tipo: data.tipo || data.tipoUnidade || null,
      capital_social: data.capital_social || data.capitalSocial || null,
      opcao_simples: data.opcao_simples || data.opcaoSimples || null,
      cnae_principal: data.cnae_principal || data.cnaePrincipal || null,
      cnae_principal_descricao: data.cnae_principal_descricao || data.cnaePrincipalDescricao || null,
      cnaes_secundarios: (data.cnaes_secundarios || data.cnaesSecundarios || []).map((c: any) => ({
        codigo: c.codigo || c.codigoCnae || "",
        descricao: c.descricao || c.descricaoCnae || "",
      })),
      endereco: data.endereco
        ? {
            logradouro: data.endereco.logradouro || null,
            numero: data.endereco.numero || null,
            complemento: data.endereco.complemento || null,
            bairro: data.endereco.bairro || null,
            municipio: data.endereco.municipio || null,
            uf: data.endereco.uf || null,
            cep: data.endereco.cep || null,
          }
        : null,
      faturamento_estimado: data.faturamento_estimado || data.faturamentoEstimado || null,
      faturamento_verificado: data.faturamento_verificado || data.faturamentoVerificado || null,
      funcionarios: data.funcionarios || data.qtd_funcionarios || null,
      regime_tributario: data.regime_tributario || data.regimeTributario || null,
      telefone: data.telefone || null,
      email: data.email || null,
      site: data.site || data.website || null,
      socios: (data.socios || []).map((s: any) => ({
        nome: s.nome || s.nomeSocio || "",
        qualificacao: s.qualificacao || s.qualificacaoSocio || null,
        documento: s.documento || s.cpfCnpj || null,
      })),
      decisores: (data.decisores || []).map((d: any) => ({
        nome: d.nome || "",
        cargo: d.cargo || null,
        email: d.email || null,
      })),
    }
  }
}

// Instância singleton (usa variável de ambiente se disponível)
export const econodata = new EconodataClient({
  apiKey: typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONODATA_API_KEY
    ? process.env.NEXT_PUBLIC_ECONODATA_API_KEY
    : undefined,
})
