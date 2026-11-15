"use client"

import { useState } from "react"
import { BotIcon, CopyIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AnaliseIAClient({ id }: { id: string }) {
  const [texto, setTexto] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const gerar = async (refazer = false) => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/diagnosticos/${id}/analise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refazer }),
      })
      if (!res.ok) throw new Error("Erro ao gerar análise")
      const data = await res.json()
      setTexto(data.analise)
    } catch {
      setErro("Erro ao comunicar com a IA. Tente novamente em instantes.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-[28px] leading-[34px] font-bold">Assistente IA — PJ MIND</h1>
        <p className="text-muted-foreground">
          Análise gerada por IA com base nos dados do diagnóstico. Não substitui parecer técnico.
        </p>
      </header>

      <div className="flex gap-2">
        <Button onClick={() => gerar(false)} disabled={carregando}>
          {carregando ? "Gerando…" : "Gerar análise"}
        </Button>
        {texto && (
          <Button
            onClick={() => {
              navigator.clipboard.writeText(texto ?? "")
            }}
            variant="outline"
          >
            <CopyIcon className="size-4" aria-hidden="true" />Copiar texto
          </Button>
        )}
        <Button onClick={() => gerar(true)} variant="outline" disabled={carregando}>
          <RefreshCwIcon className="size-4" aria-hidden="true" />Refazer
        </Button>
      </div>

      {erro && (
        <Card>
          <CardContent className="bg-destructive/10 border-destructive/20 p-4">
            <p className="text-sm text-destructive">{erro}</p>
          </CardContent>
        </Card>
      )}

      {texto && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BotIcon className="size-5" aria-hidden="true" />Análise gerada
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            {texto.split("\n").map((linha, i) => {
              if (linha.startsWith("# ")) return <h2 key={i}>{linha.slice(2)}</h2>
              if (linha.startsWith("## ")) return <h3 key={i}>{linha.slice(3)}</h3>
              if (linha.startsWith("- ")) return <li key={i}>{linha.slice(2)}</li>
              return <p key={i}>{linha}</p>
            })}
          </CardContent>
        </Card>
      )}

      {!texto && !erro && (
        <p className="text-muted-foreground">
          Clique em "Gerar análise" para obter o texto da IA sobre este diagnóstico.
        </p>
      )}
    </div>
  )
}
