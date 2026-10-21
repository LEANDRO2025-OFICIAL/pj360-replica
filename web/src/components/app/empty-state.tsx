import type { LucideIcon } from "lucide-react"

type Props = { icon: LucideIcon; title: string; children?: React.ReactNode; action?: React.ReactNode }

// Lista vazia (S04, S19), sem resultados de filtro, erro recuperável.
export function EmptyState({ icon: Icon, title, children, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-surface px-6 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action}
    </div>
  )
}
