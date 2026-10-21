import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { FileTextIcon, PencilIcon } from "lucide-react"
import { CategoryChip, EstimatePill, OpportunityPill, PriorityPill } from "@/components/app/pills"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCnpj } from "@/lib/cnpj"
import { dados } from "@/lib/data"
import type { Oportunidade } from "@/lib/data/types"
import { formatData, ORIGENS, PILARES, REGIMES } from "@/lib/labels"
import { formatBRL } from "@/lib/money"
import type { Grupo } from "@/lib/solucoes/types"

export default async function ResultadoPage({ params }: PageProps<"/diagnosticos/[id]">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  if (d.status !== "concluido" || !d.entrada) redirect(`/diagnosticos/${id}/confirmar`)

  const e = d.entrada
  const grupos = Object.groupBy(d.oportunidades, (o) => o.grupo) as Partial<Record<Grupo, Oportunidade[]>>
  const elegiveis = d.oportunidades.filter((o) => o.elegivel).length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground tabular-nums">{formatCnpj(d.cnpj)}</p>
          <h1 className="text-[28px] leading-[34px] font-bold [overflow-wrap:anywhere]">{d.razaoSocial}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/diagnosticos/${d.id}/confirmar`} className={buttonVariants({ variant: "outline" })}>
            <PencilIcon aria-hidden="true" />Ajustar dados
          </Link>
          <Link href={`/diagnosticos/${d.id}/relatorio`} className={buttonVariants()}>
            <FileTextIcon aria-hidden="true" />Ver relatório
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Visão executiva</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Item termo="Regime" valor={REGIMES[e.regime]} />
              <Item termo="Origem" valor={ORIGENS[e.origem]} />
              <Item termo="Faturamento médio anual" valor={formatBRL(e.faturamentoMedioCents)} />
              <Item termo="Funcionários CLT" valor={String(e.colaboradoresClt)} />
              <Item termo="Passivo tributário" valor={formatBRL(e.passivoTributarioCents)} />
              <Item termo="Atividade" valor={d.empresa?.atividade} />
            </dl>
          </CardContent>
        </Card>
        <Card className="bg-tile text-on-tile ring-0">
          <CardContent className="space-y-1">
            <p className="text-sm font-semibold">Potencial estimado</p>
            <p className="text-[28px] leading-[34px] font-bold tabular-nums [overflow-wrap:anywhere]">{formatBRL(d.totalCents)}</p>
            <p className="text-xs text-on-tile-muted">{elegiveis} de {d.oportunidades.length} soluções com oportunidade</p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="titulo-oportunidades" className="space-y-4">
        <h2 id="titulo-oportunidades" className="text-xl font-semibold">Oportunidades por solução</h2>
        {(Object.keys(grupos) as Grupo[]).map((g) => (
          <div key={g} className="space-y-3">
            <CategoryChip grupo={g} />
            <ul className="grid gap-3">
              {grupos[g]!.map((o) => (
                <li key={o.slug}>
                  <Card size="sm">
                    <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-6">
                      <div className="min-w-0">
                        <p className="font-semibold">{o.nome}</p>
                        <p className="text-sm text-muted-foreground">{o.motivo}</p>
                        <p className="text-xs text-muted-foreground">{PILARES[o.pilar]} · {o.area}</p>
                      </div>
                      <Rotulo termo="Oportunidade"><OpportunityPill elegivel={o.elegivel} /></Rotulo>
                      <Rotulo termo="Prioridade"><PriorityPill prioridade={o.prioridade} /></Rotulo>
                      <Rotulo termo="Estimativa" className="md:min-w-40 md:text-right">
                        <EstimatePill value={o.estimativaCents === null ? null : formatBRL(o.estimativaCents)} />
                      </Rotulo>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
        <p>Calculado em {formatData(d.criadoEm)} com as regras versão {d.versaoRegras}.</p>
        <p>Valores indicativos a partir dos dados informados. Não substituem análise técnica do caso.</p>
      </footer>
    </div>
  )
}

function Item({ termo, valor }: { termo: string; valor?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{termo}</dt>
      <dd className="font-medium tabular-nums [overflow-wrap:anywhere]">{valor || "—"}</dd>
    </div>
  )
}

// No mobile o rótulo aparece ao lado do valor; no desktop vira coluna sem rótulo visível.
function Rotulo({ termo, className = "", children }: { termo: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 md:block ${className}`}>
      <span className="text-xs text-muted-foreground md:sr-only">{termo}</span>
      {children}
    </div>
  )
}
