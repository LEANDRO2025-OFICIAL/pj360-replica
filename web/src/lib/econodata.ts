// Cliente para a API Econodata (https://www.econodata.com.br)
// Endpoint: POST https://api.econodata.com.br/v4/companies/search
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
    uf: string | null
    municipio: string | null
    cep: string | null
  } | null
  // Campos Premium (requerem chave de API válida)
  faturamento_estimado: string | null // valor em centavos (string)
  faturamento_faixa: string | null // "de X ate Y"
  funcionarios: number | null
  funcionarios_faixa: string | null // "de X ate Y"
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
  baseUrl: "https://api.econodata.com.br",
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

      // Endpoint correto da API Econodata v4 (POST)
      const url = `${this.config.baseUrl}/v4/companies/search`

      const body = JSON.stringify({
        criterios: { cnpj: c },
        incluir: ["cadastro", "estrategico", "perfilNegocio", "contatosBasicos", "contatosAvancados"],
      })

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "pj360-diagnostico/1.0",
        },
        body,
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
    const emp = data.empresa || data
    const estrategico = emp.estrategico || {}
    const contatos = emp.contatosBasicos || {}
    const perfil = emp.perfilNegocio || {}
    const contatosAv = emp.contatosAvancados || {}

    // Faturamento: usar o valor do estrategico (em centavos)
    const fatCnpj = estrategico.faturamentoCnpj || {}
    const faturamentoEstimadoCents = fatCnpj.valor
      ? String(Math.round(Number(fatCnpj.valor) * 100))
      : null

    // Funcionários
    const headcount = estrategico.headcountCnpj || {}
    const funcionarios = headcount.valor ? Math.round(Number(headcount.valor)) : null

    // Telefone: primeiro telefone disponível
    const telefones = contatos.telefones || []
    const telefone = telefones.length > 0 ? telefones[0].numero : null

    // Email: emailReceita ou primeiro email público
    const email = contatos.emailReceita ||
      (contatos.emailsPublicos?.length > 0 ? contatos.emailsPublicos[0].email : null) ||
      null

    // Site: primeiro website
    const sites = perfil.websites || contatosAv.websites || []
    const site = sites.length > 0 ? sites[0] : null

    // Socios
    const socios = (perfil.socios || []).map((s: any) => ({
      nome: s.nome || "",
      qualificacao: s.qualificacao || null,
      documento: s.documento || null,
    }))

    // Decisores
    const decisores = (perfil.decisores || []).map((d: any) => ({
      nome: d.nome || "",
      cargo: d.cargo || null,
      email: d.email || null,
    }))

    // Regime tributário
    const regime = perfil.regimeTributario || estrategico.regimeTributario || null

    return {
      cnpj: emp.cnpj || "",
      razao_social: emp.razaoSocial || emp.razao_social || "",
      nome_fantasia: emp.nomeFantasia || emp.nome_fantasia || null,
      data_abertura: emp.dataAbertura || emp.data_abertura || null,
      natureza_juridica: emp.naturezaJuridica || emp.natureza_juridica || null,
      situacao_cadastral: emp.situacao || emp.situacao_cadastral || null,
      tipo: emp.tipoUnidade || emp.tipo || null,
      capital_social: emp.capitalSocial ? String(emp.capitalSocial) : null,
      opcao_simples: emp.opcaoSimples || emp.opcao_simples || null,
      cnae_principal: emp.cnaePrimario ? String(emp.cnaePrimario) : null,
      cnae_principal_descricao: null, // não vem direto na resposta resumida
      cnaes_secundarios: (emp.cnaesSecundarios || []).map((c: any) => ({
        codigo: c.codigo || c.codigoCnae || "",
        descricao: c.descricao || c.descricaoCnae || "",
      })),
      endereco: emp.uf || emp.cidade || emp.cep
        ? {
            uf: emp.uf || null,
            municipio: emp.cidade || null,
            cep: emp.cep || null,
          }
        : null,
      faturamento_estimado: faturamentoEstimadoCents,
      faturamento_faixa: fatCnpj.de && fatCnpj.ate
        ? `R$ ${fatCnpj.de.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a R$ ${fatCnpj.ate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : null,
      funcionarios,
      funcionarios_faixa: headcount.de && headcount.ate
        ? `${headcount.de} a ${headcount.ate}`
        : null,
      regime_tributario: regime,
      telefone,
      email,
      site,
      socios,
      decisores,
    }
  }
}

// Instância singleton (usa variável de ambiente se disponível)
export const econodata = new EconodataClient({
  apiKey: typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONODATA_API_KEY
    ? process.env.NEXT_PUBLIC_ECONODATA_API_KEY
    : undefined,
})
