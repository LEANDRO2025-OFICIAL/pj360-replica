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
    r: Pick<Diagnostico, "entrada" | "oportunidades" | "totalCents" | "versaoRegras">,
  ): Promise<Diagnostico>
}
