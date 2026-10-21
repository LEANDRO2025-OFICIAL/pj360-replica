import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { formatCnpj } from "@/lib/cnpj"
import { dados } from "@/lib/data"
import { formatData, PILARES, REGIMES } from "@/lib/labels"
import { formatBRL } from "@/lib/money"
import type { Pilar } from "@/lib/solucoes/types"
import { ImprimirButton } from "./imprimir-button"

// rota bloqueante: o relatório depende do diagnóstico inteiro, não há shell útil para mostrar antes
export const instant = false

// S21: relatório para o cliente. HTML com CSS de impressão; "Salvar como PDF" pelo diálogo do navegador.
export default async function RelatorioPage({ params }: PageProps<"/diagnosticos/[id]/relatorio">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  if (d.status !== "concluido" || !d.entrada) redirect(`/diagnosticos/${id}/confirmar`)

  const encontradas = d.oportunidades.filter((o) => o.elegivel)
  const porPilar = (Object.keys(PILARES) as Pilar[]).map((p) => {
    const itens = encontradas.filter((o) => o.pilar === p)
    return { p, qtd: itens.length, total: itens.reduce((t, o) => t + BigInt(o.estimativaCents ?? 0), 0n) }
  })

  return (
    <div className="bg-background print:bg-surface">
      <div className="mx-auto flex max-w-[210mm] justify-between gap-3 px-4 py-4 print:hidden">
        <Link href={`/diagnosticos/${d.id}`} className={buttonVariants({ variant: "outline" })}>Voltar</Link>
        <ImprimirButton />
      </div>

      <article className="mx-auto max-w-[210mm] space-y-8 bg-surface px-10 py-12 text-sm shadow-card print:px-0 print:py-0 print:shadow-none">
        <header className="space-y-1 border-b pb-6">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Diagnóstico de oportunidades</p>
          <h1 className="text-[28px] leading-[34px] font-bold">{d.razaoSocial}</h1>
          <p className="text-muted-foreground tabular-nums">CNPJ {formatCnpj(d.cnpj)} · emitido em {formatData(d.criadoEm)}</p>
        </header>

        <section aria-labelledby="r-empresa" className="space-y-3">
          <h2 id="r-empresa" className="text-lg font-semibold">A empresa</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Regime</dt><dd>{REGIMES[d.entrada.regime]}</dd>
            <dt className="text-muted-foreground">Faturamento médio anual</dt><dd className="tabular-nums">{formatBRL(d.entrada.faturamentoMedioCents)}</dd>
            <dt className="text-muted-foreground">Funcionários CLT</dt><dd className="tabular-nums">{d.entrada.colaboradoresClt}</dd>
            <dt className="text-muted-foreground">Passivo tributário</dt><dd className="tabular-nums">{formatBRL(d.entrada.passivoTributarioCents)}</dd>
            {d.empresa?.atividade && (<><dt className="text-muted-foreground">Atividade</dt><dd>{d.empresa.atividade}</dd></>)}
          </dl>
          <p className="text-xs text-muted-foreground">Faturamento, equipe e passivo informados pelo consultor.</p>
        </section>

        <section aria-labelledby="r-solucoes" className="space-y-3">
          <h2 id="r-solucoes" className="text-lg font-semibold">Soluções encontradas ({encontradas.length})</h2>
          {encontradas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma solução se aplica com os dados informados.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 font-medium">Solução</th>
                  <th scope="col" className="py-2 font-medium">Pilar</th>
                  <th scope="col" className="py-2 text-right font-medium">Estimativa</th>
                </tr>
              </thead>
              <tbody>
                {encontradas.map((o) => (
                  <tr key={o.slug} className="border-b align-top break-inside-avoid">
                    <td className="py-2 pr-4">
                      <p className="font-medium">{o.nome}</p>
                      <p className="text-xs text-muted-foreground">{o.motivo}</p>
                    </td>
                    <td className="py-2 pr-4">{PILARES[o.pilar]}</td>
                    <td className="py-2 text-right tabular-nums">{o.estimativaCents ? formatBRL(o.estimativaCents) : "a calcular"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2} className="pt-3 text-left">Total estimado</th>
                  <td className="pt-3 text-right font-bold tabular-nums">{formatBRL(d.totalCents)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          <ul className="grid grid-cols-3 gap-3 pt-2">
            {porPilar.map(({ p, qtd, total }) => (
              <li key={p} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{PILARES[p]}</p>
                <p className="font-semibold tabular-nums">{formatBRL(total)}</p>
                <p className="text-xs text-muted-foreground">{qtd} {qtd === 1 ? "solução" : "soluções"}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t pt-4 text-xs text-muted-foreground">
          Estimativas indicativas, calculadas a partir dos dados acima (regras {d.versaoRegras}). Não constituem parecer técnico,
          jurídico ou contábil; cada oportunidade depende de análise detalhada do caso.
        </footer>
      </article>
    </div>
  )
}
