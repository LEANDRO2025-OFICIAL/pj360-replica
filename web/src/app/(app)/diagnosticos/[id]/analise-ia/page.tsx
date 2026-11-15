import { notFound } from "next/navigation"
import { dados } from "@/lib/data"
import { AnaliseIAClient } from "./analise-ia-client"

// S10: Análise por IA (PJ MIND). Página server com cliente para interatividade.
export default async function AnaliseIAPage({ params }: PageProps<"/diagnosticos/[id]/analise-ia">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  return <AnaliseIAClient id={id} />
}
