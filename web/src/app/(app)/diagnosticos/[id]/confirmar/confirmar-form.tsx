"use client"

import { useActionState } from "react"
import { Campo } from "@/components/app/campo"
import { MoneyInput } from "@/components/app/money-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EntradaConfirmada } from "@/lib/data/types"
import { ORIGENS, REGIMES } from "@/lib/labels"
import type { Regime } from "@/lib/solucoes/types"
import { confirmarDiagnosticoAction } from "../../actions"

type Props = { id: string; padrao: EntradaConfirmada | null; regimeSugerido: Regime | null; passivoSugerido: string | null }

export function ConfirmarForm({ id, padrao, regimeSugerido, passivoSugerido }: Props) {
  const [estado, action, pending] = useActionState(confirmarDiagnosticoAction.bind(null, id), null)
  const erroEm = (c: string) => (estado?.campo === c ? estado.erro : undefined)
  const v = estado?.valores
  const cents = (k: string, p?: string) => { const s = v ? v[k] : p; return s ? BigInt(s) : null }

  return (
    <Card>
      <CardContent>
        <form key={JSON.stringify(v)} action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
          <Campo id="regime" label="Regime tributário" erro={erroEm("regime")}>
            <Select items={REGIMES} name="regime" defaultValue={(v ? v.regime : padrao?.regime ?? regimeSugerido) || undefined}>
              <SelectTrigger id="regime" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REGIMES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="origem" label="Origem do cliente" erro={erroEm("origem")}>
            <Select items={ORIGENS} name="origem" defaultValue={(v ? v.origem : padrao?.origem) || "prospeccao_fria"}>
              <SelectTrigger id="origem" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORIGENS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo id="faturamento" label="Faturamento médio anual" erro={erroEm("faturamentoMedioCents")}>
            <MoneyInput id="faturamento" name="faturamentoMedioCents" defaultCents={cents("faturamentoMedioCents", padrao?.faturamentoMedioCents)} />
          </Campo>
          <Campo id="colaboradoresClt" label="Funcionários CLT" erro={erroEm("colaboradoresClt")}>
            <Input id="colaboradoresClt" name="colaboradoresClt" type="number" min={0} step={1} inputMode="numeric" defaultValue={v ? v.colaboradoresClt : (padrao?.colaboradoresClt ?? "")} />
          </Campo>
          <Campo id="passivo" label="Passivo tributário (dívida com o fisco)" ajuda="Preenchido com a dívida ativa da União (PGFN) quando disponível. Ajuste se houver outras dívidas." erro={erroEm("passivoTributarioCents")}>
            <MoneyInput id="passivo" name="passivoTributarioCents" defaultCents={cents("passivoTributarioCents", padrao?.passivoTributarioCents ?? passivoSugerido ?? undefined)} />
          </Campo>
          {estado && !estado.campo && <p role="alert" className="text-sm text-destructive sm:col-span-2">{estado.erro}</p>}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" size="lg" loading={pending}>{pending ? "Calculando…" : "Calcular oportunidades"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
