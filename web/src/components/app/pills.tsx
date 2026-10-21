import { cn } from "@/lib/utils"

export const GRUPOS = ["TAX", "CONTABILIDADE", "CORPORATE", "BANK", "ENERGY", "FAMILY", "BROKERS"] as const
export type Grupo = (typeof GRUPOS)[number]

// classes literais para o Tailwind enxergar
const grupoCor: Record<Grupo, string> = {
  TAX: "text-cat-tax bg-cat-tax",
  CONTABILIDADE: "text-cat-contabilidade bg-cat-contabilidade",
  CORPORATE: "text-cat-corporate bg-cat-corporate",
  BANK: "text-cat-bank bg-cat-bank",
  ENERGY: "text-cat-energy bg-cat-energy",
  FAMILY: "text-cat-family bg-cat-family",
  BROKERS: "text-cat-brokers bg-cat-brokers",
}

// Cabeçalho de grupo no resultado (S08). O ponto usa a cor; o texto usa a mesma cor (AA sobre surface).
export function CategoryChip({ grupo }: { grupo: Grupo }) {
  const [text, dot] = grupoCor[grupo].split(" ")
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border border-current/30 bg-surface px-3 py-1 text-xs font-bold tracking-wide", text)}>
      <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
      {grupo}
    </span>
  )
}

const base = "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold uppercase"

// Oportunidade SIM/NÃO. Cor + texto, nunca só cor.
export function OpportunityPill({ elegivel }: { elegivel: boolean }) {
  return (
    <span className={cn(base, elegivel ? "bg-success-soft text-on-success-soft" : "bg-surface-muted text-muted-foreground")}>
      {elegivel ? "Sim" : "Não"}
    </span>
  )
}

export type Prioridade = "alto" | "medio" | "baixo"
const prioridadeCls: Record<Prioridade, string> = {
  alto: "bg-danger-soft text-on-danger-soft",
  medio: "bg-warning-soft text-on-warning-soft",
  baixo: "bg-surface-muted text-muted-foreground",
}
const prioridadeLabel: Record<Prioridade, string> = { alto: "Alta", medio: "Média", baixo: "Baixa" }

export function PriorityPill({ prioridade }: { prioridade: Prioridade }) {
  return (
    <span className={cn(base, prioridadeCls[prioridade])}>
      <span className="sr-only">Prioridade </span>
      {prioridadeLabel[prioridade]}
    </span>
  )
}

// Estimativa vazia = "sem valor estimado" (não é zero)
export function EstimatePill({ value }: { value: string | null }) {
  return value ? (
    <span className="font-semibold tabular-nums">{value}</span>
  ) : (
    <span className={cn(base, "bg-surface-muted font-medium normal-case text-muted-foreground")}>Sem valor estimado</span>
  )
}
