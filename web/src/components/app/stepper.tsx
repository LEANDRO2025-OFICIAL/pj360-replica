"use client"

import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  steps: string[]
  current: number
  done?: number[]
  onSelect?: (index: number) => void
}

// Etapas do assessment (S09). Lista ordenada; etapa atual com aria-current="step".
// Rola na horizontal em telas estreitas em vez de virar um <select>.
export function Stepper({ steps, current, done = [], onSelect }: Props) {
  return (
    <nav aria-label="Etapas">
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((label, i) => {
          const isCurrent = i === current
          const isDone = done.includes(i)
          return (
            <li key={label} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect?.(i)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium outline-none transition-[background-color,border-color,color] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isCurrent && isDone && "border-border bg-success-soft text-on-success-soft",
                  !isCurrent && !isDone && "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-foreground/5 text-xs tabular-nums" aria-hidden="true">
                  {isDone && !isCurrent ? <CheckIcon className="size-3" /> : i + 1}
                </span>
                {label}
                {isDone && <span className="sr-only">(concluída)</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
