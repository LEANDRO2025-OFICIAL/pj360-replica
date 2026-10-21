// Estado de carregamento das telas logadas (também é o limite de Suspense das leituras por URL).
export default function Carregando() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-6">
      <div className="h-9 w-64 animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none" />
    </div>
  )
}
