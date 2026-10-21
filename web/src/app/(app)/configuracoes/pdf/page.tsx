import { SettingsIcon } from "lucide-react"
import { EmptyState } from "@/components/app/empty-state"

// Stub (S11): configuração do PDF entra nos should-haves.
export default function ConfigPdfPage() {
  return (
    <EmptyState icon={SettingsIcon} title="Configuração do relatório em breve">
      Aqui você vai definir cabeçalho, texto de abertura e contato que saem no PDF.
    </EmptyState>
  )
}
