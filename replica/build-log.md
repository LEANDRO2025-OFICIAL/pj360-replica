# Build log

Camada de dados: **fake em memória** (`web/src/lib/data/fake.ts`, some ao reiniciar o servidor), com o contrato `Dados` de `lib/data/types.ts` que a versão Supabase vai implementar.
Screenshots: `replica/clone-screens/<ID>-1440.png` e `<ID>-390.png`.

| ID | data | status | falta | mais difícil que o esperado |
| --- | --- | --- | --- | --- |
| shell | 2026-10-21 | done | — | Next 16 com `cacheComponents`: rotas logadas marcadas `instant = false` (shortcut anotado) |
| S02 Login | 2026-10-21 | partial | autenticação real, recuperar senha | — |
| S01 Painel | 2026-10-21 | partial | gráficos, seções comercial/financeiro | — |
| S04 Lista | 2026-10-21 | partial | ordenação, paginação, filtro por segmento, export | — |
| S05 Novo diagnóstico | 2026-10-21 | done | checar CNPJ já diagnosticado | BrasilAPI responde 403 ao fetch do Node sem User-Agent; React 19 limpa o form depois da action (resolvido devolvendo os valores) |
| S06 Confirmar dados | 2026-10-21 | done | quadro societário, CLT matriz+filiais | — |
| S07 Processando | 2026-10-21 | done | — | o cálculo é síncrono (< 1 s): o botão em loading cobre o estado |
| S08 Resultado | 2026-10-21 | partial | 26 das 29 soluções, Assessment, Assistente IA, PDF por solução | — |
| S21 Relatório | 2026-10-21 | partial | modelo resumido, configuração do cabeçalho (S11), PDF no servidor | — |
| S11, S19 | 2026-10-21 | stub | tela inteira | — |

## Pendências conhecidas

- As **premissas das 3 regras** (`lib/solucoes/premissas.ts`) são pontos de partida conservadores e precisam ser validadas pelo time tributário. Não são números do PJ360.
- Leitor de tela: a prioridade é anunciada como "Prioridade Prioridade Alta" no S08 (rótulo da linha + sr-only da pílula). Corrigir no componente.
- 404 em pt-BR, porém com status HTTP 200 por causa do streaming (comportamento do Next com `loading.tsx`).
- Fluxo testado no navegador com o CNPJ público do Banco do Brasil e dados de exemplo. Teclado: dá para preencher tudo; o Select abre com Enter.
