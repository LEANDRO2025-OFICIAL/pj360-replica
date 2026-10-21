# Architecture: diagnóstico tributário do escritório (rebuild do loop central do PJ360)

Base: `replica/recon.md` e `replica/features.csv` (2026-10-21). Uso interno de um escritório, sem cobrança.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript | um projeto para telas, server actions e rotas de API; deploy direto na Vercel |
| styling | Tailwind + shadcn/ui, tokens do `/replica-design` | tabela, modal, stepper e toggle prontos; o layout do PJ360 é Bootstrap genérico |
| database | Postgres no Supabase | um banco só, com RLS, Auth e Storage no mesmo lugar |
| data access | `@supabase/supabase-js` com o JWT do usuário + tipos gerados (`supabase gen types`) | a RLS vale em toda consulta; um ORM com conexão de serviço ignoraria a RLS |
| auth | Supabase Auth (email + senha, recuperar senha) | é o que o PJ360 usa (S02); sem cadastro aberto: o admin convida os membros |
| payments | nenhum | uso interno; cota e checkout ficaram em `skip` |
| email | SMTP do Supabase Auth, e Resend como SMTP quando sair do teste | só e-mails de login e convite |
| dados de CNPJ | BrasilAPI `GET /api/cnpj/v1/{cnpj}` (dados abertos da Receita) | gratuita e pública: razão social, CNAEs, natureza, endereço, Simples e QSA; substituível por CNPJá ou ReceitaWS com chave própria |
| IA | AI SDK + Vercel AI Gateway, modelo `anthropic/claude-sonnet-5-5` | streaming do texto do S10; troca de modelo sem mudar código |
| PDF | página HTML de relatório com CSS de impressão + `window.print()` | o preview já é HTML (como no PJ360); shortcut: PDF no navegador, e PDF no servidor (Playwright) só se precisar anexar por e-mail |
| jobs | nenhum na v1 | tudo é síncrono e rápido (regras < 1 s); a IA roda em streaming na requisição |
| files | Supabase Storage (só para a planilha da importação em massa, que é could) | — |
| hosting | Vercel | Node.js com Fluid Compute; timeout padrão de 300 s cobre o streaming da IA |
| testes | Vitest para as regras, Playwright para o F01 | as regras são funções puras: é ali que o erro custa caro |

Um banco, um app, sem microserviços.

## Schema

Tables: 11 (escritorios, membros, empresas, socios, solucoes, teses, diagnosticos, oportunidades, assessments, analises_ia, config_pdf) + view `kpis_escritorio`.
Access rules: RLS do Postgres em todas as tabelas, via `is_membro(escritorio_id)` / `is_admin(escritorio_id)`. O catálogo (`solucoes`, `teses`) só é lido pelos usuários e só é escrito por migration ou seed com a service role.

SQL completo: `replica/schema.sql`. Foi validado no PGlite com stubs do Supabase (RLS isola escritórios, CHECK de CNPJ, view de KPIs).

Decisões:
- Dinheiro em `bigint` de centavos. O passivo visto no recon passa de R$ 137 mi, o que estoura `int`. Só BRL, por isso sem coluna de moeda (shortcut anotado no SQL).
- `oportunidades` tem `unique (diagnostico_id, solucao_id)`. Reprocessar o diagnóstico (Atualizar dados, salvar o assessment) é um upsert e nunca duplica linhas.
- `diagnosticos.versao_regras` registra qual versão do motor gerou o resultado. Um diagnóstico antigo continua explicável depois que uma fórmula muda.
- `empresas` é um cache por escritório (`unique (escritorio_id, cnpj)`) com `dados_publicos` em JSON bruto, para auditoria. `empresa_id` em `diagnosticos` usa `on delete restrict`, então não se apaga uma empresa que tem histórico.
- Os dados confirmados em S06 (regime, faturamento, CLT, passivo) ficam no diagnóstico, não na empresa. Cada leitura guarda as próprias entradas.
- Toda tabela-filha carrega `escritorio_id`, o que deixa a policy simples. As server actions copiam o `escritorio_id` do diagnóstico pai, nunca do input do cliente.

## Motor de soluções

O motor fica em código, não no banco: um arquivo por solução em `lib/solucoes/<slug>.ts`, cada um com uma função pura.

```ts
type Entrada = { empresa: Empresa; diag: DadosConfirmados; assessment?: Respostas; teses: Tese[] };
type Saida = { elegivel: boolean; prioridade: 'alto'|'medio'|'baixo'; estimativaCents: bigint | null;
               scoreAderencia?: number; detalhe: Record<string, unknown> };
export function avaliar(e: Entrada): Saida
```

- `lib/solucoes/index.ts` é o registro `slug → avaliar` e exporta `VERSAO_REGRAS`.
- Uma solução no catálogo sem regra em código resulta em `elegivel: false` e é registrada em log, sem derrubar o diagnóstico.
- Cada regra tem um teste Vitest com pelo menos um caso SIM e um caso NÃO.
- Ordem de escrita: primeiro as 5 soluções com R$ que o escritório mais vende. As outras podem sair só com SIM/NÃO, como o PJ360 faz ("Sem estimativa").
- As fórmulas do recon são palpites de um único caso. Os percentuais e os critérios precisam vir do seu conhecimento tributário, não do PJ360.

## API

Server actions (`'use server'`) para mutações e Server Components para leitura. "who" = membro autenticado do escritório; a RLS reforça em toda consulta.

### F01 Consultor diagnostica um CNPJ

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| page `/diagnosticos` | lista com busca, filtro, ordenação e paginação (S04, S15) | membro | `?q&segmento&ordem&pagina` | linhas + KPIs da view | F01 |
| action `criarDiagnostico` | valida os dígitos do CNPJ, busca na BrasilAPI (cache de 30 dias em `empresas`), faz upsert da empresa e dos sócios se pedido, cria o diagnóstico `aguardando_confirmacao` | membro | `{cnpj, razaoSocial?, importarSocios, observacao?}` | `{diagnosticoId, prefill}` para o S06 | F01 |
| action `confirmarDiagnostico` | grava as entradas do S06, `processando`, roda as regras, upsert das oportunidades, soma o total e fecha como `concluido` (ou `erro` com mensagem) | membro | `{id, regime, origem, fatInicialCents, fatFinalCents, clt, cltBase, passivoCents}` | resultado do S08 | F01 |
| page `/diagnosticos/[id]` | resultados (S08) | membro | — | visão executiva + oportunidades por grupo | F01 |
| action `editarDiagnostico` | corrige os dados (S14) e reprocessa | membro | patch dos campos de S14 | resultado atualizado | F01 |
| action `atualizarDadosPublicos` | rebusca o CNPJ ignorando o cache e reprocessa | membro | `{id}` | resultado atualizado | F01 |
| action `apagarDiagnostico` | remove o diagnóstico (cascade nas oportunidades e no assessment) | admin | `{id}` | ok | — |

### F02 Relatório

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| page `/diagnosticos/[id]/relatorio` | relatório S21 em HTML com CSS de impressão | membro | `?modelo=completo\|resumido&solucao=<slug>` | página pronta para imprimir ou salvar em PDF | F02 |
| page `/configuracoes/pdf` + action `salvarConfigPdf` | cabeçalho, texto introdutório e contato do PDF (S11) | admin | campos de `config_pdf` | ok | F02 |

### F03 Assessment

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| page `/diagnosticos/[id]/assessment` | stepper de 9 etapas (S09) | membro | — | respostas salvas | F03 |
| action `salvarEtapaAssessment` | valida a etapa com zod, faz merge em `respostas` e reprocessa as regras | membro | `{id, etapa, respostas}` | resultado atualizado | F03 |

### F04 Análise por IA

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/diagnosticos/[id]/analise` | monta o prompt com os dados e as oportunidades já calculadas (a IA não inventa número), faz streaming do texto e grava em `analises_ia` no fim | membro | `{refazer?: boolean}` | stream de texto | F04 |

### F05/F06 (could)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `GET /api/diagnosticos/export` | exporta a lista filtrada em CSV (o Excel abre) | membro | mesmos filtros de `/diagnosticos` | `text/csv` | — |
| action `importarCnpjs` | valida a planilha linha a linha e cria diagnósticos `aguardando_confirmacao` | membro | arquivo .xlsx (Storage) | tabela de validação S16 | F05 |
| page `/carteira/valuation` | soma das estimativas por solução nos diagnósticos escolhidos | membro | ids + honorários | tabela S17 | F06 |

### Painel e conta

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| page `/` | painel S01: KPIs da view, totais por pilar, últimos diagnósticos | membro | — | — | — |
| page `/login`, `/recuperar-senha` | Supabase Auth | público | email, senha | sessão | — |
| action `convidarMembro` | `auth.admin.inviteUserByEmail` + linha em `membros` | admin | `{email, nome, papel}` | ok | — |

Webhooks in: nenhum. Webhooks out: nenhum.
Jobs: nenhum na v1. Se a cota da BrasilAPI apertar na importação em massa, enfileirar com Vercel Queues.

## The parts that bite

- **CNPJ:** desde jul/2026 a Receita emite CNPJ alfanumérico (12 caracteres A-Z/0-9 mais 2 dígitos verificadores). Normalizar para 14 caracteres maiúsculos sem máscara e validar os DVs com o algoritmo novo, que vale também para os numéricos, antes de chamar a API. O CHECK do banco já aceita os dois formatos. Conferir se a fonte de dados escolhida já responde aos alfanuméricos.
- **Fonte pública:** a BrasilAPI tem rate limit e cai às vezes. Usar o cache de 30 dias e um timeout de 8 s. Com a API fora, a tela S06 abre para digitação manual, sem erro fatal.
- **Dados que não são públicos:** faturamento, CLT e passivo vêm da digitação no S06. Mostrar o selo "informado pelo consultor" no relatório.
- **Idempotência:** reprocessar é upsert por `(diagnostico_id, solucao_id)`. Desabilitar o botão durante a action para evitar duplo clique no "Adicionar".
- **Corrida:** dois cliques em "Atualizar dados" disputam o reprocessamento. A última escrita vence, o que é aceitável, porque as regras são determinísticas para as mesmas entradas.
- **Dinheiro:** só `bigint` de centavos, nunca `float`. Converter `bigint` para string na fronteira com o JSON. Formatar com `Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'})`.
- **Fuso e data:** `timestamptz` em UTC; exibir em `America/Sao_Paulo` (ou no fuso do escritório). "Diagnósticos do mês" usa o mês nesse fuso, não em UTC. Ajustar a view antes de abrir para mais de um fuso.
- **IA:** o prompt recebe só números já calculados e manda a IA não estimar valores. Tratar erro e timeout, com um estado de erro claro e o botão "Refazer". Nunca mandar CPF de sócio para o modelo.
- **Multi-tenancy:** a RLS cobre a leitura. As server actions nunca aceitam `escritorio_id` do cliente: derivam do diagnóstico ou do membro.
- **LGPD:** os sócios são dados pessoais. Importar só quando o toggle estiver ligado, apagar em cascata com a empresa e deixar o admin excluir a pedido.
- **Responsabilidade:** as estimativas são indicativas. Aviso fixo no S08 e no rodapé do PDF, como o PJ360 faz no valuation.

## Build order

1. **Vertical slice:** login, novo diagnóstico, confirmação, resultado, PDF, feio e com 3 soluções.
   - screens: S02, S04 (lista simples), S05, S06, S08, S21 (completo)
   - tables: escritorios, membros, empresas, diagnosticos, solucoes, oportunidades
   - routes: `/login`, `/diagnosticos`, `criarDiagnostico`, `confirmarDiagnostico`, `/diagnosticos/[id]`, `/diagnosticos/[id]/relatorio`
   - regras: Transação Tributária, Revisão Previdenciária, Supply Tax (uma com R$ sobre o passivo, uma com R$ por CLT, uma só de elegibilidade), cada uma com teste Vitest
   - pronto quando: um CNPJ real vira um PDF com 3 linhas, de ponta a ponta, na Vercel
2. **Must-haves:** catálogo completo das 29 soluções (as sem regra saem como NÃO), agrupamento por grupo e pilar, prioridade, recuperar senha, busca, ordenação e paginação da lista, validação de CNPJ, teste Playwright do F01.
   - screens: S04 completa, S08 completa · tables: + teses · routes: + `/recuperar-senha`
3. **Should-haves:** configuração do PDF (S11), PDF completo e resumido (S12), assessment em 9 etapas (S09), análise IA (S10), editar e atualizar dados (S14), filtro (S15), export CSV, quadro societário (S13), KPIs do painel (S01), teses com probabilidade, score de aderência, blocos de elegibilidade.
   - tables: + assessments, analises_ia, config_pdf, socios
4. **Could-haves:** importação em massa (S16), valuation da carteira (S17), PDF por solução, relatório mensal (S19), chat flutuante, busca rápida no header (S20).
5. **Fixes from replica-entrepreneur:** depois que ele rodar.
