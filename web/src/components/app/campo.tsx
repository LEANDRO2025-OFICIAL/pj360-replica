import { cloneElement } from "react"
import { Label } from "@/components/ui/label"

type Filho = React.ReactElement<{ "aria-invalid"?: boolean; "aria-describedby"?: string }>

// Rótulo + campo + ajuda ou erro, já ligados por aria-describedby / aria-invalid.
export function Campo({ id, label, ajuda, erro, children }: { id: string; label: string; ajuda?: string; erro?: string; children: Filho }) {
  const desc = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { "aria-invalid": erro ? true : undefined, "aria-describedby": desc })}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-sm text-destructive">{erro}</p>
      ) : (
        ajuda && <p id={`${id}-ajuda`} className="text-xs text-muted-foreground">{ajuda}</p>
      )}
    </div>
  )
}
