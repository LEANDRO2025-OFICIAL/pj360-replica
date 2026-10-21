import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseConfigurado } from "@/lib/supabase/server"
import { LoginForm } from "./login-form"

export const instant = false

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { link } = await searchParams
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Entrar</CardTitle>
          <CardDescription>Use o e-mail cadastrado pelo escritório.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {link === "expirado" && (
            <p role="alert" className="rounded-md bg-warning-soft px-3 py-2 text-sm text-on-warning-soft">
              O link do e-mail expirou ou já foi usado. Peça outro em “Esqueci a senha”.
            </p>
          )}
          <LoginForm />
          {!supabaseConfigurado && (
            <p role="note" className="rounded-md bg-warning-soft px-3 py-2 text-xs text-on-warning-soft">
              Modo demonstração: sem Supabase configurado, o acesso não pede senha e os dados ficam em memória.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
