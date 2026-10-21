import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCnpj } from "@/lib/cnpj"
import { dados } from "@/lib/data"
import { REGIMES } from "@/lib/labels"
import { formatBRL } from "@/lib/money"
import { ConfirmarForm } from "./confirmar-form"

export default async function ConfirmarPage({ params }: PageProps<"/diagnosticos/[id]/confirmar">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  const e = d.empresa

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-[28px] leading-[34px] font-bold">Confirme os dados</h1>
        <p className="text-muted-foreground">
          O cálculo usa o que estiver aqui. Faturamento, equipe e passivo não são públicos: informe o que o cliente passou.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{d.razaoSocial}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Item termo="CNPJ" valor={formatCnpj(d.cnpj)} mono />
            <Item termo="Nome fantasia" valor={e?.nomeFantasia} />
            <Item termo="Atividade principal" valor={e?.atividade && `${e.cnaePrincipal} · ${e.atividade}`} />
            <Item termo="Natureza jurídica" valor={e?.naturezaJuridica} />
            <Item termo="Endereço" valor={e?.endereco} />
            <Item termo="Simples Nacional" valor={e?.optanteSimples == null ? null : e.optanteSimples ? "Optante" : "Não optante"} />
            <Item
              termo="Dívida ativa da União (PGFN)"
              valor={e?.pgfn ? `${formatBRL(e.pgfn.tributarioCents)}${e.pgfn.referencia ? ` · ref. ${e.pgfn.referencia.replace("_trimestre_0", "/T")}` : ""}` : "base da PGFN não importada"}
            />
            <Item termo="Regime declarado à Receita" valor={e?.regime ? `${REGIMES[e.regime]}${e.regimeAno ? ` (${e.regimeAno})` : ""}` : null} />
          </dl>
          {!e && (
            <p role="status" className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-on-warning-soft">
              A base pública não respondeu para este CNPJ. Você pode seguir com os dados abaixo.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmarForm id={d.id} padrao={d.entrada} regimeSugerido={e?.regime ?? (e?.optanteSimples ? "SIMPLES" : null)} passivoSugerido={e?.pgfn?.tributarioCents ?? null} />
    </div>
  )
}

function Item({ termo, valor, mono }: { termo: string; valor?: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{termo}</dt>
      <dd className={`font-medium [overflow-wrap:anywhere] ${mono ? "tabular-nums" : ""}`}>{valor || "—"}</dd>
    </div>
  )
}
