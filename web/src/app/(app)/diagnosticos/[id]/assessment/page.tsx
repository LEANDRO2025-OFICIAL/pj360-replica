import { notFound } from "next/navigation"
import { dados } from "@/lib/data"
import { AssessmentClient } from "./assessment-client"

// S09: Assessment — 9 etapas. Página server com cliente para interatividade.
export default async function AssessmentPage({ params }: PageProps<"/diagnosticos/[id]/assessment">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  return <AssessmentClient id={id} />
}
