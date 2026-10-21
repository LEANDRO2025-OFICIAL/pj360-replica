import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// shortcut: tela de login sem autenticação (dados fake). Supabase Auth entra no /replica-backend.
export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Entrar</CardTitle>
          <CardDescription>Use o e-mail cadastrado pelo escritório.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" autoComplete="current-password" />
            </div>
            <button type="submit" className={buttonVariants({ className: "w-full" })}>Entrar</button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">Esqueci a senha</Link>
            </p>
            <p role="note" className="rounded-md bg-warning-soft px-3 py-2 text-xs text-on-warning-soft">
              Versão de demonstração: o acesso ainda não pede senha.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
