"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatBRL, parseBRL } from "@/lib/money"

type Props = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  name: string
  defaultCents?: bigint | null
  onCentsChange?: (cents: bigint | null) => void
}

// Campo R$ (S06, S09, S14). Mostra formatado; envia centavos num hidden input com o mesmo name.
export function MoneyInput({ name, defaultCents = null, onCentsChange, className, ...props }: Props) {
  const [cents, setCents] = useState<bigint | null>(defaultCents)
  const [text, setText] = useState(defaultCents === null ? "" : formatBRL(defaultCents).replace("R$ ", ""))

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground" aria-hidden="true">
        R$
      </span>
      <Input
        {...props}
        inputMode="decimal"
        className="pl-9 tabular-nums"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const c = parseBRL(e.target.value)
          setCents(c)
          onCentsChange?.(c)
        }}
        onBlur={() => setText(cents === null ? "" : formatBRL(cents).replace("R$ ", ""))}
      />
      <input type="hidden" name={name} value={cents === null ? "" : cents.toString()} />
    </div>
  )
}
