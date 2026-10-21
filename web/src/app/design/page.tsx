"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BuildingIcon, CheckCircle2Icon, FileSearchIcon, PercentIcon, PiggyBankIcon, PlusIcon } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { KpiTile } from "@/components/app/kpi-tile"
import { CategoryChip, EstimatePill, GRUPOS, OpportunityPill, PriorityPill } from "@/components/app/pills"
import { MoneyInput } from "@/components/app/money-input"
import { Stepper } from "@/components/app/stepper"
import { EmptyState } from "@/components/app/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatBRL, formatBRLCompact } from "@/lib/money"

// Verificação visual do design system. Dados de exemplo fictícios.
const cores = [
  "bg", "surface", "surface-muted", "border", "border-input", "text", "text-muted", "accent", "accent-soft",
  "nav-bg", "tile-bg", "danger", "danger-soft", "success", "success-soft", "warning", "warning-soft",
  "cat-tax", "cat-contabilidade", "cat-corporate", "cat-bank", "cat-energy", "cat-family", "cat-brokers",
]

const regimes = { SIMPLES: "Simples Nacional", PRESUMIDO: "Lucro Presumido", REAL: "Lucro Real", NAO_SE_ENQUADRA: "Outro / não se aplica" }

const linhas = [
  { solucao: "Parcelamento de débitos federais", elegivel: true, prioridade: "alto" as const, cents: 4250000000n },
  { solucao: "Créditos de contribuição previdenciária", elegivel: true, prioridade: "medio" as const, cents: 98000000n },
  { solucao: "Incentivo à inovação", elegivel: false, prioridade: "baixo" as const, cents: null },
]

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

export default function DesignPage() {
  const [etapa, setEtapa] = useState(1)
  const [importarSocios, setImportarSocios] = useState(false)

  return (
    <AppShell escritorio="Escritório Demo" usuario="Consultor">
      <div className="space-y-10">
        <header>
          <h1 className="text-[28px] leading-[34px] font-bold">Design system</h1>
          <p className="text-muted-foreground">Tokens de replica/design/tokens.json e os primitivos da aplicação.</p>
        </header>

        <Secao titulo="Cores (papéis)">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {cores.map((c) => (
              <li key={c} className="overflow-hidden rounded-md border bg-surface text-xs">
                <div className="h-12" style={{ background: `var(--tk-${c})` }} />
                <p className="px-2 py-1.5 font-mono">{c}</p>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Tipografia">
          <div className="space-y-2 rounded-lg border bg-surface p-6">
            <p className="text-[40px] leading-[44px] font-bold">Display 40</p>
            <p className="text-[28px] leading-[34px] font-bold">Título 28</p>
            <p className="text-xl font-semibold">Subtítulo 20</p>
            <p className="text-base">Corpo 16: texto de leitura corrida dos relatórios.</p>
            <p className="text-sm">Corpo 14: tabelas, formulários e rótulos.</p>
            <p className="text-xs font-medium text-muted-foreground">Legenda 12: datas, ajudas e metadados.</p>
            <p className="font-semibold tabular-nums">{formatBRL(13720719477n)}</p>
          </div>
        </Secao>

        <Secao titulo="Botões">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="destructive">Excluir</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Pequeno 32</Button>
            <Button>Médio 40</Button>
            <Button size="lg">Grande 48</Button>
            <Button loading>Processando</Button>
            <Button disabled>Desabilitado</Button>
            <Button size="icon" aria-label="Adicionar"><PlusIcon /></Button>
          </div>
        </Secao>

        <Secao titulo="Formulário">
          <Card>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj-erro">CNPJ (erro)</Label>
                <Input id="cnpj-erro" defaultValue="11.111.111/1111-11" aria-invalid="true" aria-describedby="cnpj-erro-msg" />
                <p id="cnpj-erro-msg" className="text-sm text-destructive">Dígitos verificadores não conferem.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faturamento">Faturamento médio anual</Label>
                <MoneyInput id="faturamento" name="faturamento" defaultCents={4000000000n} />
              </div>
              <div className="space-y-2">
                <Label>Regime tributário</Label>
                <Select items={regimes} name="regime">
                  <SelectTrigger className="w-full" aria-label="Regime tributário">
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(regimes).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="obs">Observação</Label>
                <Textarea id="obs" placeholder="Opcional" />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="socios" checked={importarSocios} onCheckedChange={setImportarSocios} />
                <Label htmlFor="socios">Trazer quadro de sócios</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desab">Desabilitado</Label>
                <Input id="desab" disabled defaultValue="Somente leitura" />
              </div>
            </CardContent>
          </Card>
        </Secao>

        <Secao titulo="KPIs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Empresas analisadas" value="12" caption="neste mês" icon={BuildingIcon} />
            <KpiTile label="Redução de custos" value={formatBRLCompact(4348000000n)} fullValue={formatBRL(4348000000n)} caption="soma estimada" icon={PiggyBankIcon} />
            <KpiTile label="Concluídos" value="9" caption="de 12" icon={CheckCircle2Icon} />
            <KpiTile label="Uso do mês" value="75%" caption="do total previsto" icon={PercentIcon} />
          </div>
        </Secao>

        <Secao titulo="Grupos e status">
          <div className="flex flex-wrap gap-2">
            {GRUPOS.map((g) => <CategoryChip key={g} grupo={g} />)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OpportunityPill elegivel /> <OpportunityPill elegivel={false} />
            <PriorityPill prioridade="alto" /> <PriorityPill prioridade="medio" /> <PriorityPill prioridade="baixo" />
            <EstimatePill value={formatBRL(53800001n)} /> <EstimatePill value={null} />
          </div>
        </Secao>

        <Secao titulo="Tabela de oportunidades">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solução</TableHead>
                  <TableHead>Oportunidade</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Estimativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.solucao}>
                    <TableCell className="font-medium">{l.solucao}</TableCell>
                    <TableCell><OpportunityPill elegivel={l.elegivel} /></TableCell>
                    <TableCell><PriorityPill prioridade={l.prioridade} /></TableCell>
                    <TableCell className="text-right"><EstimatePill value={l.cents === null ? null : formatBRL(l.cents)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Secao>

        <Secao titulo="Etapas (assessment)">
          <Stepper
            steps={["Perfil", "Energia", "Agro", "M&A", "Tributos", "Liquidez", "Societário", "Bancos", "Família"]}
            current={etapa}
            done={[0]}
            onSelect={setEtapa}
          />
        </Secao>

        <Secao titulo="Vazio, modal e aviso">
          <EmptyState
            icon={FileSearchIcon}
            title="Nenhum diagnóstico ainda"
            action={<Button><PlusIcon />Analisar um CNPJ</Button>}
          >
            Informe o CNPJ de um cliente para ver as oportunidades encontradas.
          </EmptyState>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>Abrir modal</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Analisar CNPJ</DialogTitle>
                  <DialogDescription>Buscamos os dados públicos do CNPJ antes do cálculo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="cnpj-modal">CNPJ</Label>
                  <Input id="cnpj-modal" placeholder="00.000.000/0000-00" />
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                  <Button>Continuar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="secondary" onClick={() => toast.success("Diagnóstico salvo")}>Mostrar aviso</Button>
            <Button variant="secondary" onClick={() => toast.error("Não foi possível consultar o CNPJ agora")}>Aviso de erro</Button>
          </div>
        </Secao>

        <Secao titulo="Card">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Visão executiva</CardTitle>
              <CardDescription>Dados cadastrais e entradas confirmadas.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <p className="text-muted-foreground">Regime</p><p className="font-medium">Lucro Real</p>
              <p className="text-muted-foreground">Funcionários CLT</p><p className="font-medium tabular-nums">120</p>
            </CardContent>
          </Card>
        </Secao>
      </div>
    </AppShell>
  )
}
