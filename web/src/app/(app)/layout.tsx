import { AppShell } from "@/components/app/app-shell"

// shortcut: telas logadas são rotas bloqueantes (dados por usuário, usePathname no menu); rever se ligar partialPrefetching.
export const instant = false

// shortcut: escritório e usuário fixos até o login real (/replica-backend).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell escritorio="Meu escritório" usuario="Consultor">
      {children}
    </AppShell>
  )
}
