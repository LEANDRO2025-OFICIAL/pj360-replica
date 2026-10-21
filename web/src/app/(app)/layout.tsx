import { AppShell } from "@/components/app/app-shell"
import { criarClienteServidor, supabaseConfigurado } from "@/lib/supabase/server"

// shortcut: telas logadas são rotas bloqueantes (dados por usuário, usePathname no menu); rever se ligar partialPrefetching.
export const instant = false

export default async function AppLayout({ children }: LayoutProps<"/">) {
  let escritorio = "Escritório (demonstração)"
  let usuario = "Consultor"
  if (supabaseConfigurado) {
    const sb = await criarClienteServidor()
    // a RLS só devolve o vínculo do próprio usuário
    const { data } = await sb.from("membros").select("nome, escritorios(nome)").limit(1).maybeSingle()
    const m = data as unknown as { nome: string; escritorios: { nome: string } } | null
    if (m) {
      usuario = m.nome
      escritorio = m.escritorios.nome
    }
  }
  return (
    <AppShell escritorio={escritorio} usuario={usuario}>
      {children}
    </AppShell>
  )
}
