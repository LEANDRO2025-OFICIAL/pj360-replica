"use client"

import { PrinterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ImprimirButton() {
  return (
    <Button onClick={() => window.print()}>
      <PrinterIcon aria-hidden="true" />Imprimir ou salvar PDF
    </Button>
  )
}
