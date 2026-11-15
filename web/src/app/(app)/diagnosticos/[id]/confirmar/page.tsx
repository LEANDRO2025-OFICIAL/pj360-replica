import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCnpj } from "@/lib/cnpj"
import { dados } from "@/lib/data"
import { REGIMES } from "@/lib/labels"
import { formatBRL } from "@/lib/money"
import { ConfirmarForm } from "./confirmar-form"

// Formata um valor em centavos (string) para BRL
function brl(cents: string | null | undefined): string {
  if (!cents) return "—"
  const c = BigInt(cents)
  const neg = c < 0n
  const abs = neg ? -c : c
  const grouped = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const cent = (abs % 100n).toString().padStart(2, "0")
  return `${neg ? "-" : ""}R$ ${grouped},${cent}`
}

export default async function ConfirmarPage({ params }: PageProps<"/diagnosticos/[id]/confirmar">) {
  const { id } = await params
  const d = await dados.obterDiagnostico(id)
  if (!d) notFound()
  const e = d.empresa

  const temEconomico = Boolean(e?.fonteEconodata)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-[28px] leading-[34px] font-bold">Confirme os dados</h1>
        <p className="text-muted-foreground">
          O cálculo usa o que estiver aqui. Faturamento, equipe e passivo não são públicos: informe o que o cliente passou.
        </p>
      </header>

      {/* Dados cadastrais públicos (Receita Federal via BrasilAPI) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-muted-foreground"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              Dados cadastrais públicos
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Receita Federal via BrasilAPI</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Item termo="CNPJ" valor={formatCnpj(d.cnpj)} mono />
            <Item termo="Razão social" valor={e?.razaoSocial} />
            <Item termo="Nome fantasia" valor={e?.nomeFantasia} />
            <Item termo="Atividade principal" valor={e?.cnaePrincipal && e?.atividade ? `${e.cnaePrincipal} · ${e.atividade}` : "—"} />
            <Item termo="Natureza jurídica" valor={e?.naturezaJuridica} />
            <Item termo="Endereço" valor={e?.endereco} />
            <Item termo="Cidade / UF" valor={e?.municipio && e?.uf ? `${e.municipio}/${e.uf}` : "—"} />
            <Item termo="CEP" valor={e?.cep} />
            <Item termo="Simples Nacional" valor={e?.optanteSimples == null ? null : e.optanteSimples ? "Optante" : "Não optante"} />
            <Item termo="Situação cadastral" valor={e?.situacao_cadastral} />
            <Item termo="Tipo de unidade" valor={e?.tipo} />
            <Item termo="Data de abertura" valor={e?.data_abertura} />
            <Item termo="Capital social" valor={e?.capital_social ? brl(e.capital_social) : "—"} />
            <Item termo="Regime (Receita)" valor={e?.regime ? `${REGIMES[e.regime]}${e.regimeAno ? ` (${e.regimeAno})` : ""}` : "—"} />
          </dl>

          {!e && (
            <p role="status" className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-on-warning-soft">
              A base pública não respondeu para este CNPJ. Você pode seguir com os dados abaixo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Enriquecimento Econodata (dados pagos - apenas com chave configurada) */}
      {temEconomico && e && (
        <Card className="border-primary/30">
          <CardHeader className="border-primary/20">
            <CardTitle className="flex items-center gap-2 text-primary">
              <span className="flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Enriquecimento Econodata
              </span>
              <span className="ml-auto text-xs text-primary">Dados proprietários via API Econodata</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Item termo="Faturamento estimado" valor={e.faturamentoEstimadoCents ? brl(e.faturamentoEstimadoCents) : "—"} />
              <Item termo="Faturamento matriz+filiais" valor={e.faturamentoMatrizFiliaisCents ? brl(e.faturamentoMatrizFiliaisCents) : "—"} />
              <Item termo="Funcionários" valor={e.funcionarios != null ? String(e.funcionarios) : "—"} />
              <Item termo="Porte" valor={e.porte} />
              <Item termo="Regime tributário (Econodata)" valor={e.regimeTributarioEconodata ? REGIMES[e.regimeTributarioEconodata] : "—"} />
              <Item termo="Origem dos dados" valor={e.origemDados} />
            </dl>

            {/* Contatos */}
            {(e.telefones?.length ?? 0) > 0 || e.emailReceita || e.site && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Contatos</h3>
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {e.telefones?.length && (
                    <>
                      <dt className="text-muted-foreground">Telefone principal</dt>
                      <dd className="font-medium tabular-nums">{e.telefones[0].numero}</dd>
                      <dt className="text-muted-foreground">Tipo / assertividade</dt>
                      <dd className="font-medium">{e.telefones[0].tipo} · {e.telefones[0].assertividade}</dd>
                      {e.telefones[0].verificado && (
                        <>
                          <dt className="text-muted-foreground">Verificação</dt>
                          <dd className="font-medium text-success">{'Verificado'}</dd>
                        </>
                      )}
                      {e.telefones[0].temWhatsapp && (
                        <>
                          <dt className="text-muted-foreground">WhatsApp</dt>
                          <dd className="font-medium text-success">{'Tem WhatsApp'}</dd>
                        </>
                      )}
                    </>
                  )}
                  <dt className="text-muted-foreground">E-mail Receita</dt>
                  <dd className="font-medium tabular-nums break-all">{e.emailReceita || "—"}</dd>
                  <dt className="text-muted-foreground">Site</dt>
                  <dd className="font-medium tabular-nums break-all">{e.site || "—"}</dd>
                </dl>
              </div>
            )}

            {/* Emails validados */}
            {(e.emailsValidados?.length ?? 0) > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Emails validados</h3>
                <div className="flex flex-wrap gap-2">
                  {(e.emailsValidados ?? []).slice(0, 8).map((email, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs border border-primary/20">{email}</span>
                  ))}
                  {(e.emailsValidados ?? []).length > 8 && (
                    <span className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs border border-primary/20">+{(e.emailsValidados ?? []).length - 8} mais</span>
                  )}
                </div>
              </div>
            )}

            {/* Redes sociais */}
            {(e.redesSociais?.length ?? 0) > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Redes sociais</h3>
                <div className="flex flex-wrap gap-2">
                  {(e.redesSociais ?? []).map((rs) => (
                    <span key={`${rs.rede}-${rs.url}`} className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs border border-primary/20" title={rs.url}>
                      {rs.rede}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tecnologias */}
            {(e.tecnologias?.length ?? 0) > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Tecnologias</h3>
                <div className="flex flex-wrap gap-2">
                  {(e.tecnologias ?? []).map((t) => (
                    <span key={t.nome} className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs border border-primary/20" title={t.categoria}>
                      {t.nome}
                    </span>
                  ))}
                  {e.tecnologiasCategorias?.length && (
                    <span className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs border border-primary/20" title="Categorias">
                      {e.tecnologiasCategorias.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sócios */}
            {(e.sociosEconodata?.length ?? 0) > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Sócios</h3>
                <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {(e.sociosEconodata ?? []).map((s) => (
                    <div key={s.nome} className="p-3 rounded border border-surface-muted bg-surface">
                      <p className="text-xs text-muted-foreground truncate">{s.nome}</p>
                      {s.qualificacao && <p className="text-[10px] text-muted-foreground truncate">{s.qualificacao}</p>}
                      {s.documento && <p className="text-[10px] text-muted-foreground truncate">{s.documento}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decisores */}
            {(e.decisores?.length ?? 0) > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Decisores</h3>
                <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {(e.decisores ?? []).map((dec) => (
                    <div key={dec.nome} className="p-3 rounded border border-surface-muted bg-surface">
                      <p className="text-xs font-medium">{dec.nome}</p>
                      {dec.cargo && <p className="text-[10px] text-muted-foreground truncate">{dec.cargo}</p>}
                      {dec.nivelDecisao && <p className="text-[10px] text-primary truncate">{dec.nivelDecisao}</p>}
                      {dec.email && <p className="text-[10px] text-muted-foreground truncate break-all">{dec.email}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dívidas */}
            {e.dividas && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Dívidas</h3>
                <pre className="text-xs text-muted-foreground overflow-x-auto bg-surface p-2 rounded">{JSON.stringify(e.dividas, null, 2)}</pre>
              </div>
            )}

            {/* Grupo econômico / Filiais */}
            {(e.filiais?.length ?? 0) > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Filiais</h3>
                <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  {(e.filiais ?? []).map((f) => (
                    <div key={f.cnpj} className="p-3 rounded border border-surface-muted bg-surface">
                      <p className="text-xs font-medium">{f.nome}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{f.cnpj}</p>
                      {f.uf && <p className="text-[10px] text-muted-foreground">{f.uf}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulário de confirmação (dados digitados pelo consultor) */}
      <ConfirmarForm
        id={d.id}
        padrao={d.entrada}
        regimeSugerido={e?.regimeTributarioEconodata ?? e?.regime ?? (e?.optanteSimples ? "SIMPLES" : null)}
        passivoSugerido={e?.pgfn?.tributarioCents ?? null}
        faturamentoSugerido={e?.faturamentoEstimadoCents ?? null}
        colaboradoresSugerido={e?.funcionarios ?? null}
      />
    </div>
  )
}

function Item({ termo, valor, mono }: { termo: string; valor?: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{termo}</dt>
      <dd className={`font-medium [overflow-wrap:anywhere] ${mono ? "tabular-nums" : ""}`}>{valor || "—"}</dd>
    </div>
  )
}
