"use client"

import { AlertTriangleIcon } from "lucide-react"
import { EmptyState } from "@/components/app/empty-state"
import { Button } from "@/components/ui/button"

// Falha de banco ou de rede numa tela logada: mensagem simples e tentar de novo (o detalhe fica no log do servidor).
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState icon={AlertTriangleIcon} title="Não deu para carregar esta tela" action={<Button onClick={reset}>Tentar de novo</Button>}>
      Pode ser uma instabilidade momentânea. Se continuar, avise quem administra o sistema.
    </EmptyState>
  )
}
