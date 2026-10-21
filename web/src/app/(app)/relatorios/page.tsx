import { BarChart3Icon } from "lucide-react"
import { EmptyState } from "@/components/app/empty-state"

// Stub (S19): relatório mensal entra como could-have.
export default function RelatoriosPage() {
  return (
    <EmptyState icon={BarChart3Icon} title="Relatórios em breve">
      O resumo mensal de diagnósticos chega numa próxima etapa.
    </EmptyState>
  )
}
