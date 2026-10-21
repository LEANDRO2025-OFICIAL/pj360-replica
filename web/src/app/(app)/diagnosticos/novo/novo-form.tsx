"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Campo } from "@/components/app/campo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { criarDiagnosticoAction } from "../actions"

export function NovoDiagnosticoForm() {
  const [estado, action, pending] = useActionState(criarDiagnosticoAction, null)
  const erroEm = (c: string) => (estado?.campo === c ? estado.erro : undefined)
  const v = estado?.valores ?? {}

  return (
    <Card>
      <CardContent>
        <form key={JSON.stringify(v)} action={action} className="space-y-5" noValidate>
          <Campo id="cnpj" label="CNPJ" erro={erroEm("cnpj")}>
            <Input id="cnpj" name="cnpj" defaultValue={v.cnpj} required autoFocus autoComplete="off" placeholder="00.000.000/0000-00" />
          </Campo>
          <Campo id="razaoSocial" label="Razão social (opcional)" ajuda="Preenchemos a partir da base pública quando possível." erro={erroEm("razaoSocial")}>
            <Input id="razaoSocial" name="razaoSocial" defaultValue={v.razaoSocial} autoComplete="organization" />
          </Campo>
          <Campo id="observacao" label="Observação (opcional)">
            <Textarea id="observacao" name="observacao" defaultValue={v.observacao} rows={3} />
          </Campo>
          {estado && !estado.campo && <p role="alert" className="text-sm text-destructive">{estado.erro}</p>}
          <div className="flex justify-end gap-3">
            <Link href="/diagnosticos" className={buttonVariants({ variant: "outline" })}>Cancelar</Link>
            <Button type="submit" loading={pending}>{pending ? "Buscando dados…" : "Continuar"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
