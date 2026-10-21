import Link from "next/link"
import { BuildingIcon, FileSearchIcon, PiggyBankIcon, PlusIcon, SearchIcon } from "lucide-react"
import { EmptyState } from "@/components/app/empty-state"
import { KpiTile } from "@/components/app/kpi-tile"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCnpj } from "@/lib/cnpj"
import { dados } from "@/lib/data"
import { formatData } from "@/lib/labels"
import { formatBRL, formatBRLCompact } from "@/lib/money"

export default async function DiagnosticosPage({ searchParams }: PageProps<"/diagnosticos">) {
  const { q } = await searchParams
  const busca = typeof q === "string" ? q : ""
  const lista = await dados.listarDiagnosticos({ q: busca })
  const todos = busca ? await dados.listarDiagnosticos() : lista
  const total = todos.reduce((t, d) => t + BigInt(d.totalCents), 0n)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[34px] font-bold">Diagnósticos</h1>
          <p className="text-muted-foreground">Empresas analisadas pelo escritório.</p>
        </div>
        <Link href="/diagnosticos/novo" className={buttonVariants()}>
          <PlusIcon aria-hidden="true" />Analisar CNPJ
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiTile label="Empresas analisadas" value={String(todos.length)} icon={BuildingIcon} />
        <KpiTile label="Potencial estimado" value={formatBRLCompact(total)} fullValue={formatBRL(total)} caption="soma dos diagnósticos" icon={PiggyBankIcon} />
      </div>

      <form role="search" className="flex max-w-md gap-2">
        <label htmlFor="q" className="sr-only">Buscar por CNPJ ou razão social</label>
        <Input id="q" name="q" defaultValue={busca} placeholder="CNPJ ou razão social" />
        <button type="submit" className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Buscar">
          <SearchIcon />
        </button>
      </form>

      {lista.length === 0 ? (
        busca ? (
          <EmptyState icon={SearchIcon} title="Nada encontrado" action={<Link href="/diagnosticos" className={buttonVariants({ variant: "outline" })}>Limpar busca</Link>}>
            Nenhum diagnóstico com “{busca}”.
          </EmptyState>
        ) : (
          <EmptyState icon={FileSearchIcon} title="Nenhum diagnóstico ainda" action={<Link href="/diagnosticos/novo" className={buttonVariants()}><PlusIcon aria-hidden="true" />Analisar CNPJ</Link>}>
            Informe o CNPJ de um cliente para ver as oportunidades encontradas.
          </EmptyState>
        )
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Potencial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-0 whitespace-normal">
                    <Link
                      href={d.status === "concluido" ? `/diagnosticos/${d.id}` : `/diagnosticos/${d.id}/confirmar`}
                      className="font-medium text-primary underline-offset-4 [overflow-wrap:anywhere] hover:underline"
                    >
                      {d.razaoSocial}
                    </Link>
                    {d.status !== "concluido" && <span className="ml-2 text-xs text-on-warning-soft">aguardando confirmação</span>}
                    <span className="block text-xs text-muted-foreground tabular-nums sm:hidden">{formatCnpj(d.cnpj)}</span>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatCnpj(d.cnpj)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatData(d.criadoEm)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatBRL(d.totalCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
