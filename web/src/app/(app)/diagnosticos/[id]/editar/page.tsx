import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCnpj } from "@/lib/cnpj"
import { dados } from "@/lib/data"
import { REGIMES } from "@/lib/labels"
import { formatBRL } from "@/lib/money"
import { ConfirmarForm } from "../confirmar/confirmar-form"

export default async function EditarPage({ params }: PageProps<"/diagnosticos/[id]/editar">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  const e = d.empresa

  const temEconomico = Boolean(e?.fonteEconodata || e?.faturamentoEstimadoCents || e?.funcionarios)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-[28px] leading-[34px] font-bold">Editar diagnóstico</h1>
        <p className="text-muted-foreground">
          Corrige os dados da empresa e recalcula as oportunidades. O cálculo usa o que estiver aqui.
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
            {temEconomico && (
              <>
                <Item termo="Faturamento estimado (Econodata)" valor={e?.faturamentoEstimadoCents ? formatBRL(e.faturamentoEstimadoCents) : "—"} />
                <Item termo="Funcionários (Econodata)" valor={e?.funcionarios != null ? String(e.funcionarios) : "—"} />
                <Item termo="Regime tributário (Econodata)" valor={e?.regimeTributarioEconodata ? REGIMES[e.regimeTributarioEconodata] : "—"} />
              </>
            )}
          </dl>
          {!e && (
            <p role="status" className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-on-warning-soft">
              A base pública não respondeu para este CNPJ. Você pode seguir com os dados abaixo.
            </p>
          )}
          {temEconomico && (
            <p role="status" className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-foreground">
              Dados de enriquecimento Econodata detectados: faturamento, funcionários e regime tributário foram sugeridos automaticamente.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmarForm
        id={d.id}
        padrao={d.entrada}
        regimeSugerido={e?.regimeTributarioEconodata ?? e?.regime ?? (e?.optanteSimples ? "SIMPLES" : null)}
        passivoSugerido={e?.pgfn?.tributarioCents ?? null}
        faturamentoSugerido={e?.faturamentoEstimadoCents ?? null}
        colaboradoresSugerido={e?.funcionarios ?? null}
      />
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
