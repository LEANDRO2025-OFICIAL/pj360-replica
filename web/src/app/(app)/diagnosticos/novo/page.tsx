import { NovoDiagnosticoForm } from "./novo-form"

export default function NovoDiagnosticoPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-[28px] leading-[34px] font-bold">Analisar um CNPJ</h1>
        <p className="text-muted-foreground">
          Buscamos os dados cadastrais públicos da empresa. Na etapa seguinte você confirma regime, faturamento e equipe.
        </p>
      </header>
      <NovoDiagnosticoForm />
    </div>
  )
}
