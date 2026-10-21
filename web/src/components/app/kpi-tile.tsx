import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string
  // valor exato quando value é compacto ("R$ 43,5 mi")
  fullValue?: string
  caption?: string
  icon?: LucideIcon
  className?: string
}

// Tile escuro dos KPIs (S01, S04). value já formatado (número ou R$).
export function KpiTile({ label, value, fullValue, caption, icon: Icon, className }: Props) {
  return (
    <div className={cn("min-w-0 rounded-lg bg-tile p-4 text-on-tile", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        {Icon && (
          <span className="grid size-9 place-items-center rounded-full bg-on-tile/10" aria-hidden="true">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums [overflow-wrap:anywhere]" title={fullValue}>
        {value}
        {fullValue && <span className="sr-only"> ({fullValue})</span>}
      </p>
      {caption && <p className="mt-1 text-xs text-on-tile-muted">{caption}</p>}
    </div>
  )
}
