import Link from "next/link"
import { FileQuestionIcon } from "lucide-react"
import { EmptyState } from "@/components/app/empty-state"
import { buttonVariants } from "@/components/ui/button"

export default function NaoEncontrado() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <EmptyState icon={FileQuestionIcon} title="Página não encontrada" action={<Link href="/diagnosticos" className={buttonVariants()}>Ir para os diagnósticos</Link>}>
        O endereço pode estar errado ou o diagnóstico foi removido.
      </EmptyState>
    </main>
  )
}
