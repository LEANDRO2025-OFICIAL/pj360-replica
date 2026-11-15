"use client"

import { useActionState, useState } from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stepper } from "@/components/app/stepper"
import { salvarEtapaAssessment } from "./actions"

const ETAPAS = [
  { id: "perfil", label: "Perfil" },
  { id: "energia", label: "Energia" },
  { id: "agro", label: "Agro" },
  { id: "ma", label: "M&A" },
  { id: "tax", label: "Tributário" },
  { id: "liq-contratada", label: "Líq. Contratada" },
  { id: "societario", label: "Societário" },
  { id: "bank", label: "Bank" },
  { id: "family", label: "Family" },
] as const

type EtapaId = (typeof ETAPAS)[number]["id"]

const FORMULARIOS: Record<EtapaId, React.ComponentType<any>> = {
  perfil: PerfilForm,
  energia: EnergiaForm,
  agro: AgroForm,
  ma: MaForm,
  tax: TaxForm,
  "liq-contratada": LiqContratadaForm,
  societario: SocietarioForm,
  bank: BankForm,
  family: FamilyForm,
}

export function AssessmentClient({ id }: { id: string }) {
  const [etapaAtual, setEtapaAtual] = useState<number>(0)
  const [estado, action, pending] = useActionState(salvarEtapaAssessment.bind(null, id), null)
  const [concluidas, setConcluidas] = useState<number[]>([])

  const etapa = ETAPAS[etapaAtual]
  const FormComponente = FORMULARIOS[etapa.id]

  const proximo = () => {
    setConcluidas((prev) => (prev.includes(etapaAtual) ? prev : [...prev, etapaAtual]))
    if (etapaAtual < ETAPAS.length - 1) setEtapaAtual((p) => p + 1)
  }

  const anterior = () => setEtapaAtual((p) => Math.max(0, p - 1))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-[28px] leading-[34px] font-bold">Assessment</h1>
        <p className="text-muted-foreground">
          Responda o questionário para refinar as oportunidades do diagnóstico.
        </p>
      </header>

      <Stepper
        steps={ETAPAS.map((e) => e.label)}
        current={etapaAtual}
        done={concluidas}
        onSelect={(i) => setEtapaAtual(i)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{etapa.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormComponente id={id} etapa={etapa.id} action={action} />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {etapaAtual > 0 ? (
          <Button variant="outline" onClick={anterior} disabled={pending}>
            <ArrowLeftIcon className="size-4 mr-2" />Voltar
          </Button>
        ) : null}
        <div className="text-xs text-muted-foreground">
          Etapa {etapaAtual + 1} de {ETAPAS.length}
        </div>
        {etapaAtual < ETAPAS.length - 1 ? (
          <Button onClick={proximo} disabled={pending}>
            Avançar <ArrowRightIcon className="size-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={proximo} disabled={pending}>
            Concluir <CheckIcon className="size-4 ml-2" />
          </Button>
        )}
      </div>

      {estado?.erro && <p role="alert" className="text-sm text-destructive">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="text-sm text-success">{estado.ok}</p>}
    </div>
  )
}

// ----- Formulários por etapa -----

function PerfilForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Segmento de atuação</label>
      <input
        name="segmento"
        className="input w-full"
        placeholder="Ex.: Comércio, Indústria, Serviços"
      />
      <label className="block text-sm font-medium">Porte da empresa</label>
      <select name="porte" className="input w-full">
        <option value="">Selecione</option>
        <option value="micro">Micro</option>
        <option value="pequena">Pequena</option>
        <option value="media">Média</option>
        <option value="grande">Grande</option>
      </select>
      <label className="block text-sm font-medium">Faturamento declarado (R$)</label>
      <input name="faturamentoDeclarado" type="text" className="input w-full" placeholder="0,00" />
    </form>
  )
}

function EnergiaForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Grupo tarifário</label>
      <select name="grupoTarifario" className="input w-full">
        <option value="">Selecione</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
      <label className="block text-sm font-medium">Mercado</label>
      <select name="mercado" className="input w-full">
        <option value="">Selecione</option>
        <option value="cativo">Cativo</option>
        <option value="livre">Livre</option>
      </select>
      <label className="block text-sm font-medium">Conta média mensal (R$)</label>
      <input name="contaMediaCents" type="text" className="input w-full" placeholder="0,00" />
    </form>
  )
}

function AgroForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Tem atividade agropecuária?</label>
      <select name="temAtividadeAgro" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
      <label className="block text-sm font-medium">Área (hectares)</label>
      <input name="areaHectares" type="text" className="input w-full" placeholder="0,00" />
    </form>
  )
}

function MaForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Interesse em M&A?</label>
      <select name="interesseMAndA" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
      <label className="block text-sm font-medium">Valor da transação (R$)</label>
      <input name="valorTransacaoCents" type="text" className="input w-full" placeholder="0,00" />
    </form>
  )
}

function TaxForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Tem contencioso tributário?</label>
      <select name="temContencioso" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
      <label className="block text-sm font-medium">Valor do contencioso (R$)</label>
      <input name="valorContenciosoCents" type="text" className="input w-full" placeholder="0,00" />
    </form>
  )
}

function LiqContratadaForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Tem endividamento?</label>
      <select name="temEndividamento" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
      <label className="block text-sm font-medium">Valor do endividamento (R$)</label>
      <input name="valorEndividamentoCents" type="text" className="input w-full" placeholder="0,00" />
    </form>
  )
}

function SocietarioForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Número de sócios</label>
      <input name="numSocios" type="number" min={0} className="input w-full" />
      <label className="block text-sm font-medium">Tem sócios estrangeiros?</label>
      <select name="temSociosEstrangeiros" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
    </form>
  )
}

function BankForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Tem operações cambiais?</label>
      <select name="temOperacoesCambiais" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
      <label className="block text-sm font-medium">Tem cartão de crédito empresarial?</label>
      <select name="temCartaoCredito" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
    </form>
  )
}

function FamilyForm({ id, etapa, action }: { id: string; etapa: string; action: any }) {
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="etapa" value={etapa} />
      <label className="block text-sm font-medium">Sucessão planejada?</label>
      <select name="temSucessaoPlanejada" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
      <label className="block text-sm font-medium">Tem holding?</label>
      <select name="temHolding" className="input w-full">
        <option value="">Selecione</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </select>
    </form>
  )
}
