import Link from "next/link"
import { BuildingIcon, CheckCircle2Icon, PiggyBankIcon, PlusIcon } from "lucide-react"
import { KpiTile } from "@/components/app/kpi-tile"
import { buttonVariants } from "@/components/ui/button"
import { dados } from "@/lib/data/fake"
import { formatBRL, formatBRLCompact } from "@/lib/money"

// S01 (versão da fatia): KPIs básicos. Gráficos e seções extras entram nos should-haves.
export default async function PainelPage() {
  const todos = await dados.listarDiagnosticos()
  const concluidos = todos.filter((d) => d.status === "concluido")
  const total = concluidos.reduce((t, d) => t + BigInt(d.totalCents), 0n)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[34px] font-bold">Painel</h1>
          <p className="text-muted-foreground">Resumo dos diagnósticos do escritório.</p>
        </div>
        <Link href="/diagnosticos/novo" className={buttonVariants()}>
          <PlusIcon aria-hidden="true" />Analisar CNPJ
        </Link>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Empresas analisadas" value={String(todos.length)} icon={BuildingIcon} />
        <KpiTile label="Concluídos" value={String(concluidos.length)} caption={`de ${todos.length}`} icon={CheckCircle2Icon} />
        <KpiTile label="Potencial estimado" value={formatBRLCompact(total)} fullValue={formatBRL(total)} icon={PiggyBankIcon} />
      </div>
    </div>
  )
}
