// Cliente para a API Econodata (https://www.econodata.com.br)
// Endpoint: POST https://api.econodata.com.br/v4/companies/search
// Documentação: https://econodata-tecnologia.github.io/api-v4-docs
// Requer chave de API configurada em NEXT_PUBLIC_ECONODATA_API_KEY
// Sem a chave, o sistema continua usando apenas a BrasilAPI (dados públicos da Receita Federal).
// Com a chave, enriquece com: faturamento, funcionários, regime tributário,
// telefones, emails, sites, redes sociais, tecnologias, sócios, decisores, dívidas, grupo econômico, etc.

export type EconodataEmpresa = {
  // Identificação
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  situacao_cadastral: string | null
  tipo: string | null // MATRIZ | FILIAL
  data_abertura: string | null
  capital_social: string | null
  natureza_juridica: string | null
  opcao_simples: string | null // SIM | NAO | NAO_OPTANTE
  uf: string | null
  municipio: string | null
  cidade: string | null
  cep: string | null

  // CNAE / Atividade
  cnae_primario: string | null
  cnae_primario_descricao: string | null
  cnaes_secundarios: Array<{ codigo: string; descricao: string }>
  setor: string | null
  segmento: string | null

  // Porte e Faturamento
  funcionarios: number | null
  funcionarios_faixa: string | null
  faturamento_estimado_cents: string | null // valor em centavos (string)
  faturamento_faixa: string | null
  faturamento_matriz_filiais_cents: string | null
  porte: string | null

  // Regime Tributário
  regime_tributario: string | null // SIMPLES | PRESUMIDO | REAL | NAO_SE_ENQUADRA
  regime_tributario_descricao: string | null

  // Contatos
  telefones: Array<{ numero: string; tipo: string; assertividade: string; verificado: boolean; temWhatsapp: boolean }>
  email_receita: string | null
  emails_validados: string[]
  emails_publicos: Array<{ email: string; origem: string; prioridade: number }>
  site: string | null
  websites: string[]
  redes_sociais: Array<{ rede: string; url: string }>
  tem_whatsapp: boolean

  // Pessoas e Organograma
  socios: Array<{ nome: string; qualificacao: string | null; documento: string | null; papel: string | null }>
  decisores: Array<{ nome: string; cargo: string | null; email: string | null; nivel_decisao: string | null }>
  colaboradores: Array<{ nome: string; cargo: string | null; email: string | null }>

  // Sinais e Saúde Financeira
  dividas: any // objeto com dívidas (PGFN, etc.)
  tecnologias: Array<{ nome: string; categoria: string }>
  tecnologias_categorias: string[]
  nivel_atividade: string | null
  recebimentos_governo: number | null
  grupo_economico: any
  filiais: Array<{ cnpj: string; nome: string; uf: string | null }>

  // Metadados
  origem_dados: string | null
  fonte_econodata: boolean
}

type EconodataConfig = {
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

const DEFAULT_CONFIG: EconodataConfig = {
  baseUrl: "https://api.econodata.com.br",
  timeout: 10000,
}

function normalizeCnpj(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function cents(valor: number | null | undefined): string | null {
  if (valor === null || valor === undefined) return null
  return String(Math.round(Number(valor) * 100))
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
      return null
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

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
        if (res.status === 429) {
          console.warn("Econodata: limite de requisições excedido (429)")
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

    // ---- Faturamento ----
    const fatCnpj = estrategico.faturamentoCnpj || {}
    const fatMatriz = estrategico.faturamentoMatrizFiliais || {}
    const faturamentoCents = cents(
      fatCnpj.valor ?? fatMatriz.valor ?? perfil.faturamento ?? null
    )

    // ---- Funcionários ----
    const headcount = estrategico.headcountCnpj || estrategico.headcountMatrizFiliais || {}
    const funcionarios = headcount.valor
      ? Math.round(Number(headcount.valor))
      : perfil.funcionarios ?? null

    // ---- Telefones ----
    const telefonesRaw = contatos.telefones || []
    const telefones = telefonesRaw.map((t: any) => ({
      numero: t.numero || "",
      tipo: t.tipo || "",
      assertividade: t.assertividade || "",
      verificado: t.verificado === true,
      temWhatsapp: t.temWhatsapp === true,
    }))

    // ---- Emails ----
    const emailReceita = contatos.emailReceita || null
    const emailsValidados = contatos.emailsValidadosSetores || contatos.emails_validados || []
    const emailsPublicos = (contatos.emailsPublicos || []).map((e: any) => ({
      email: e.email || "",
      origem: e.origem || "",
      prioridade: e.prioridade ?? 0,
    }))

    // ---- Sites / Websites ----
    const websites = perfil.websites || contatosAv.websites || []
    const site = websites.length > 0 ? websites[0] : null

    // ---- Redes sociais ----
    const redesSociaisRaw = contatos.redesSociais || contatosAv.redesSociais || perfil.redesSociais || []
    const redesSociais = redesSociaisRaw.map((r: any) => ({
      rede: r.rede || r.plataforma || "",
      url: r.url || r.link || "",
    }))

    // ---- CNAEs ----
    const cnaesSecundarios = (emp.cnaesSecundarios || []).map((c: any) => ({
      codigo: c.codigo || c.codigoCnae || "",
      descricao: c.descricao || c.descricaoCnae || "",
    }))

    // ---- Socios ----
    const socios = (perfil.socios || []).map((s: any) => ({
      nome: s.nome || "",
      qualificacao: s.qualificacao || s.qualificacaoSocio || null,
      documento: s.documento || s.cpfCnpj || null,
      papel: s.papel || null,
    }))

    // ---- Decisores ----
    const decisores = (perfil.decisores || []).map((d: any) => ({
      nome: d.nome || "",
      cargo: d.cargo || null,
      email: d.email || null,
      nivel_decisao: d.nivelDecisao || d.nivel_decisao || null,
    }))

    // ---- Colaboradores ----
    const colaboradores = (perfil.colaboradores || []).map((c: any) => ({
      nome: c.nome || "",
      cargo: c.cargo || null,
      email: c.email || null,
    }))

    // ---- Tecnologias ----
    const tecnologiasRaw = estrategico.tecnologias?.tecnologias || perfil.tecnologias || []
    const tecnologias = tecnologiasRaw.map((t: any) => ({
      nome: t.nome || t.tecnologia || "",
      categoria: t.categoria || "",
    }))
    const tecnologiasCategorias = estrategico.tecnologias?.categorias || perfil.tecnologiasCategorias || []

    // ---- Dívidas ----
    const dividas = estrategico.dividas || perfil.dividas || emp.dividas || null

    // ---- Grupo econômico / Filiais ----
    const grupoEconomico = emp.grupoEconomico || estrategico.grupoEconomico || null
    const filiais = (emp.filiais || perfil.filiais || []).map((f: any) => ({
      cnpj: f.cnpj || "",
      nome: f.nome || "",
      uf: f.uf || null,
    }))

    return {
      cnpj: emp.cnpj || "",
      razao_social: emp.razaoSocial || "",
      nome_fantasia: emp.nomeFantasia || null,
      situacao_cadastral: emp.situacao || null,
      tipo: emp.tipoUnidade || null,
      data_abertura: emp.dataAbertura || null,
      capital_social: emp.capitalSocial ? String(emp.capitalSocial) : null,
      natureza_juridica: emp.naturezaJuridica || null,
      opcao_simples: emp.opcaoSimples || null,
      uf: emp.uf || null,
      municipio: emp.municipio || emp.cidade || null,
      cidade: emp.cidade || emp.municipio || null,
      cep: emp.cep || null,

      cnae_primario: emp.cnaePrimario ? String(emp.cnaePrimario) : null,
      cnae_primario_descricao: perfil.cnaePrimarioDescricao || null,
      cnaes_secundarios: cnaesSecundarios,
      setor: perfil.setor || emp.setor || null,
      segmento: perfil.segmento || emp.segmento || null,

      funcionarios,
      funcionarios_faixa: estrategico.headcountCnpj?.de && estrategico.headcountCnpj?.ate
        ? `${estrategico.headcountCnpj.de} a ${estrategico.headcountCnpj.ate}`
        : null,
      faturamento_estimado_cents: faturamentoCents,
      faturamento_faixa: fatCnpj.de && fatCnpj.ate
        ? `R$ ${fatCnpj.de.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a R$ ${fatCnpj.ate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : null,
      faturamento_matriz_filiais_cents: cents(fatMatriz.valor),
      porte: emp.porte || estrategico.porte || null,

      regime_tributario: perfil.regimeTributario || estrategico.regimeTributario || null,
      regime_tributario_descricao: perfil.regimeTributarioDescricao || null,

      telefones,
      email_receita: emailReceita,
      emails_validados: emailsValidados,
      emails_publicos: emailsPublicos,
      site,
      websites,
      redes_sociais: redesSociais,
      tem_whatsapp: telefones.some((t: { temWhatsapp: boolean }) => t.temWhatsapp) || contatos.temWhatsapp === true,

      socios,
      decisores,
      colaboradores,

      dividas,
      tecnologias,
      tecnologias_categorias: tecnologiasCategorias,
      nivel_atividade: perfil.nivelAtividade || null,
      recebimentos_governo: perfil.recebimentosGoverno || null,
      grupo_economico: grupoEconomico,
      filiais,

      origem_dados: fatCnpj.origem || headcount.origem || null,
      fonte_econodata: true,
    }
  }
}

// Instância singleton (usa variável de ambiente se disponível)
export const econodata = new EconodataClient({
  apiKey: typeof process !== "undefined" && process.env.NEXT_PUBLIC_ECONODATA_API_KEY
    ? process.env.NEXT_PUBLIC_ECONODATA_API_KEY
    : undefined,
})
