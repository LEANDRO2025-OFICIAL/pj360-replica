"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { entrarAction } from "../actions"

export function LoginForm() {
  const [estado, action, pending] = useActionState(entrarAction, null)
  return (
    <form key={estado?.email} action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={estado?.email} required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required aria-describedby={estado?.erro ? "login-erro" : undefined} />
      </div>
      {estado?.erro && <p id="login-erro" role="alert" className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" className="w-full" loading={pending}>Entrar</Button>
      <p className="text-center text-sm">
        <Link href="/redefinir-senha" className="text-primary underline-offset-4 hover:underline">Esqueci a senha</Link>
      </p>
    </form>
  )
}
