import type { EmpresaPublica } from "@/lib/brasilapi"
import type { Grupo, Pilar, Prioridade, Regime } from "@/lib/solucoes/types"

// Formas serializáveis (Server → Client): dinheiro em centavos como string.
export type Origem = "prospeccao_fria" | "indicacao" | "minha_carteira"
export type Status = "aguardando_confirmacao" | "concluido"

export type EntradaConfirmada = {
  regime: Regime
  origem: Origem
  faturamentoMedioCents: string
  colaboradoresClt: number
  passivoTributarioCents: string
  // Enriquecimento Econodata (opcional, sobrescreve os valores digitados quando disponível)
  faturamentoEconomicoCents?: string | null      // faturamento estimado do Econodata (centavos)
  colaboradoresEconomicos?: number | null        // nº de funcionários do Econodata
  regimeTributarioEconomico?: Regime | null      // regime do Econodata
  fonteEconomica?: boolean                       // true se os dados vieram do Econodata
  // Campos extras de enriquecimento (apenas leitura, exibidos na tela)
  telefonesEconomicos?: Array<{
    numero: string
    tipo: string
    assertividade: string
    verificado: boolean
    temWhatsapp: boolean
  }>
  emailReceitaEconomico?: string | null
  siteEconomico?: string | null
  sociosEconomicos?: Array<{ nome: string; qualificacao: string | null; documento: string | null }>
  decisoresEconomicos?: Array<{ nome: string; cargo: string | null; email: string | null }>
  tecnologiasEconomicas?: Array<{ nome: string; categoria: string }>
}

export type Oportunidade = {
  slug: string
  nome: string
  grupo: Grupo
  pilar: Pilar
  area: string
  elegivel: boolean
  prioridade: Prioridade
  estimativaCents: string | null
  motivo: string
}

export type Diagnostico = {
  id: string
  cnpj: string
  razaoSocial: string
  observacao: string | null
  empresa: EmpresaPublica | null // null = fonte pública indisponível; dados digitados no S06
  status: Status
  entrada: EntradaConfirmada | null
  oportunidades: Oportunidade[]
  totalCents: string
  versaoRegras: string | null
  criadoEm: string // ISO 8601 UTC
}

// Contrato da camada de dados. A versão Supabase (/replica-backend) implementa as mesmas funções.
export type Dados = {
  listarDiagnosticos(filtro?: { q?: string }): Promise<Diagnostico[]>
  obterDiagnostico(id: string): Promise<Diagnostico | null>
  criarDiagnostico(input: Pick<Diagnostico, "cnpj" | "razaoSocial" | "observacao" | "empresa">): Promise<Diagnostico>
  salvarResultado(
    id: string,
    r: Pick<Diagnostico, "entrada" | "oportunidades" | "totalCents" | "versaoRegras" | "observacao">,
  ): Promise<Diagnostico>
}
