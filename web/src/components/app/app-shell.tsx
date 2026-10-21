"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { BarChart3Icon, FileSearchIcon, HomeIcon, MenuIcon, SearchIcon, SettingsIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/", label: "Painel", icon: HomeIcon },
  { href: "/diagnosticos", label: "Diagnósticos", icon: FileSearchIcon },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3Icon },
  { href: "/configuracoes/pdf", label: "Configurações", icon: SettingsIcon },
]

// Layout das telas logadas: sidebar fixa no desktop, gaveta no mobile, header com busca de CNPJ (S20).
export function AppShell({ escritorio, usuario, children }: { escritorio: string; usuario: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-full">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>

      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        id="menu-lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-sidebar flex-col bg-nav text-on-nav transition-transform duration-300 ease-drawer motion-reduce:transition-none lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-header items-center justify-between px-5">
          <span className="text-lg font-bold">{escritorio}</span>
          <Button variant="ghost" size="icon-sm" className="text-on-nav hover:bg-nav-active hover:text-on-nav lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <XIcon />
          </Button>
        </div>
        <nav aria-label="Principal" className="flex-1 px-3">
          <ul className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active ? "bg-nav-active text-on-nav" : "text-on-nav-muted hover:bg-nav-active hover:text-on-nav",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-header items-center gap-3 border-b bg-surface px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} aria-controls="menu-lateral">
            <MenuIcon />
          </Button>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Olá, <span className="font-semibold text-foreground">{usuario}</span>
          </p>
          <form role="search" action="/diagnosticos" className="ml-auto w-full max-w-xs">
            <label htmlFor="busca-cnpj" className="sr-only">Buscar por CNPJ ou razão social</label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="busca-cnpj" name="q" placeholder="CNPJ ou razão social" className="pl-9" />
            </div>
          </form>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
