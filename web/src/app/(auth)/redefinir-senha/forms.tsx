"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pedirRedefinicaoAction, redefinirSenhaAction } from "../actions"

export function PedirLinkForm() {
  const [estado, action, pending] = useActionState(pedirRedefinicaoAction, null)
  if (estado?.ok) return <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-sm text-on-success-soft">{estado.ok}</p>
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      {estado?.erro && <p role="alert" className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" className="w-full" loading={pending}>Enviar link</Button>
    </form>
  )
}

export function NovaSenhaForm() {
  const [estado, action, pending] = useActionState(redefinirSenhaAction, null)
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="senha">Nova senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmacao">Repita a senha</Label>
        <Input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required />
      </div>
      {estado?.erro && <p role="alert" className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" className="w-full" loading={pending}>Salvar senha</Button>
    </form>
  )
}
