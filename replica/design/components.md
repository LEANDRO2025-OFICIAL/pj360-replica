# Componentes

Fonte dos valores: `tokens.json` → `node replica/design/build-tokens.mjs` → `web/src/app/tokens.css` → `globals.css` (variáveis do shadcn e `@theme`).
Base acessível: shadcn/ui estilo `base-nova` (Base UI). Ícones: Lucide. Verificação visual: `/design` no app (`web/src/app/design/page.tsx`).

## Mapa papel → classe Tailwind

| papel (tokens.json) | classe | nota |
| --- | --- | --- |
| bg | `bg-background` | fundo da página |
| surface | `bg-card` ou `bg-surface` | cards, tabelas, header |
| surface-muted | `bg-muted` ou `bg-surface-muted` | linhas zebradas, pílulas neutras |
| text | `text-foreground` | |
| text-muted | `text-muted-foreground` | nunca `text-muted` (no shadcn, `muted` é cor de fundo) |
| accent | `bg-primary` / `text-primary` | a cor da marca é o `primary` do shadcn |
| accent-soft / on-accent-soft | `bg-accent` / `text-accent-foreground` | hover de menu, seleção |
| border / border-input | `border-border` / `border-input` | |
| focus | `ring-ring` | anel de 3px a 50% (`focus-visible:ring-3 ring-ring/50`) |
| nav-bg, on-nav, on-nav-muted, nav-active | `bg-nav`, `text-on-nav`, `text-on-nav-muted`, `bg-nav-active` | sidebar |
| tile-bg, on-tile, on-tile-muted | `bg-tile`, `text-on-tile`, `text-on-tile-muted` | KPIs |
| danger / success / warning (+ -soft, on-*-soft) | `text-destructive`, `bg-success-soft text-on-success-soft` ... | |
| cat-* | `text-cat-tax`, `bg-cat-tax` ... | grupos de solução |

Regra: nenhum hex em componente. Se faltar um papel, ele entra em `tokens.json`, depois `build-tokens.mjs`, e passa pelo `contrast.py`.
Também não use `bg-black`/`bg-white` crus: use `bg-foreground/N` ou `bg-on-tile/N`.

## Motion, elevação e camadas (skills emil-design-eng e craft)

- Curvas: `ease-out` = `cubic-bezier(0.23, 1, 0.32, 1)` (entrada e feedback), `ease-in-out` = `cubic-bezier(0.77, 0, 0.175, 1)` (movimento na tela), `ease-drawer` = `cubic-bezier(0.32, 0.72, 0, 1)` (gaveta). Ficam no tokens.json e viram as classes `ease-out`, `ease-in-out` e `ease-drawer`.
- Durações: press 150ms, popover/select 100–150ms (Base UI), modal 200ms ao abrir e 150ms ao fechar, gaveta 300ms. A saída é sempre mais rápida que a entrada.
- Popovers crescem a partir do gatilho (`origin-(--transform-origin)`); modal fica centralizado. Nunca `scale(0)`; o mínimo é 0.95 com opacity.
- Movimento reduzido: regra global em `globals.css` zera escala e deslocamento das animações `tw-animate` (fica só o fade); a gaveta usa `motion-reduce:transition-none`.
- Elevação: borda fina para estrutura (cards, tabelas, KPIs); sombra só para o que flutua (`shadow-pop` em modal, `shadow-md` em menus). Não usar borda e sombra pesada juntas.
- Camadas (z-index): header sticky 20, overlay da gaveta 30, gaveta 40, popover/modal/toast 50. Nada acima disso.
- Alvos de toque: campos e botões padrão com 40px; ícone de ação com no mínimo 40px (o `icon-sm` de 32px só fica em barra densa de desktop).

## Primitivos (shadcn, ajustados)

```
Button                                   web/src/components/ui/button.tsx
  variants  default (primário), secondary, outline, ghost, destructive (suave), link
  sizes     sm 32px, default 40px, lg 48px; icon 40, icon-sm 32, icon-lg 48
  states    default, hover (bg-primary-hover = token accent-hover), active (scale 0.97), focus-visible (anel 3px ring/50),
            disabled (50%), loading
  motion    transition só de transform/cores/sombra, 150ms ease-out (curva forte do token); nunca transition-all
  tokens    bg primary, text primary-foreground, radius lg, text sm/500, cursor-pointer
  a11y      <button> real; loading = disabled + aria-busy + spinner aria-hidden, o rótulo continua visível e lido;
            botão só com ícone exige aria-label
  used on   todas

Input / Textarea                          ui/input.tsx, ui/textarea.tsx
  states    default, focus-visible, disabled, invalid (aria-invalid → borda e anel destructive), placeholder
  tokens    border input, radius lg, text sm
  a11y      sempre com <Label htmlFor>; erro em <p id> ligado por aria-describedby; nunca placeholder no lugar do rótulo
  used on   S02, S05, S06, S09, S11, S14, S15

MoneyInput                                components/app/money-input.tsx
  comportamento  digita "1.234,56", formata no blur, envia centavos (string de bigint) num hidden com o mesmo name
  states    vazio (envia ""), preenchido, inválido (herda o aria-invalid do Input)
  a11y      prefixo "R$" aria-hidden; inputMode=decimal
  used on   S06, S09, S14, S17

Select                                    ui/select.tsx (Base UI)
  uso       <Select items={{valor: rótulo}} name>, <SelectValue placeholder>, SelectItem por opção
  states    fechado, aberto, item destacado, selecionado (check), disabled
  a11y      combobox/listbox do Base UI, setas, Enter, Esc, digitar para pular; rótulo via Label ou aria-label no trigger
  used on   S06 (regime, origem), S09 (Sim/Não), S14, S15

Switch                                    ui/switch.tsx
  states    off, on, focus-visible, disabled
  a11y      role=switch; rótulo clicável via <Label htmlFor>
  used on   S05 (trazer sócios), S11 (mostrar blocos do PDF)

Dialog                                    ui/dialog.tsx (Base UI)
  sizes     padrão (sm:max-w-sm) para confirmação e formulário curto; full (max-w-5xl, rolagem interna) para S08 e S12
  states    abrindo, aberto, fechando; footer com Cancelar (outline) + ação primária
  a11y      foco preso; foco inicial no primeiro campo; Esc fecha; título obrigatório (aria-labelledby); devolve o foco ao gatilho
  used on   S05, S06, S07, S11, S12, S13, S15, S16, S17, S18

Table                                     ui/table.tsx
  states    filled, vazio (EmptyState no lugar do corpo), carregando (linhas skeleton), ordenável (aria-sort no th)
  a11y      <table> real com <th scope=col>; ação de linha = botão com texto ou aria-label com o nome da empresa
  used on   S04, S08 (desktop), S16, S17, S19

Card                                      ui/card.tsx
  tokens    bg card, radius lg, shadow card
  used on   S01, S06, S08 (visão executiva), S08 mobile (uma solução por card)

Toast                                     ui/sonner.tsx (montado no layout, tema claro)
  variants  success, error, info, loading
  a11y      região aria-live do sonner; erro também aparece na tela quando bloqueia o fluxo, não só no toast
  used on   salvar, falha de consulta de CNPJ, falha da IA

DropdownMenu, Tooltip, Progress           ui/*.tsx
  used on   menu "…" de S08 (Atualizar dados, Análise por IA, Configurar PDF); tooltip em ícone; Progress no S07
```

## Componentes do app

```
AppShell                                  components/app/app-shell.tsx
  partes    sidebar 248px (bg-nav), header 64px (bg-surface, borda inferior), main max-w-7xl, gutter 24/16
  states    desktop (sidebar fixa ≥ lg), mobile (gaveta com overlay, botão ☰), item ativo (aria-current=page)
  a11y      link "Pular para o conteúdo"; <nav aria-label="Principal">; busca em <form role=search> com label sr-only;
            botão ☰ com aria-expanded + aria-controls
  used on   todas as telas logadas

KpiTile                                   components/app/kpi-tile.tsx
  props     label, value (já formatado), fullValue (valor exato quando value é compacto), caption, icon
  dinheiro  use formatBRLCompact ("R$ 43,5 mi") + fullValue=formatBRL(...); o valor exato vai no title e em sr-only
            (valor longo estourava o tile; achado no teste visual)
  tokens    bg tile, text on-tile / on-tile-muted, radius lg, valor text-2xl/700 tabular-nums
  states    valor, zero, carregando (skeleton do mesmo tamanho)
  a11y      ícone aria-hidden; a ordem de leitura é rótulo, valor, legenda
  used on   S01, S04

CategoryChip                              components/app/pills.tsx
  variants  TAX, CONTABILIDADE, CORPORATE, BANK, ENERGY, FAMILY, BROKERS (cat-*)
  a11y      o nome do grupo é texto; a cor é reforço
  used on   S08, S21

OpportunityPill / PriorityPill / EstimatePill   components/app/pills.tsx
  Opportunity  Sim (success-soft) / Não (surface-muted)
  Priority     Alta (danger-soft) / Média (warning-soft) / Baixa (surface-muted); "Prioridade" em sr-only
  Estimate     valor em R$ (tabular-nums) ou "Sem valor estimado", que não é o mesmo que R$ 0,00
  used on   S08, S21

Stepper                                   components/app/stepper.tsx
  states    atual (primary), concluída (success-soft + check), pendente
  a11y      <nav aria-label="Etapas"> + <ol>; aria-current="step"; "(concluída)" em sr-only; rola na horizontal no mobile
  used on   S09

EmptyState                                components/app/empty-state.tsx
  props     icon, title, texto, action
  used on   S04 vazia, filtro sem resultado, S19 vazia, erro recuperável (ex.: IA indisponível + "Tentar de novo")
```

## Formatação

- Dinheiro: `formatBRL(cents)` e `parseBRL(texto)` em `web/src/lib/money.ts`, só com bigint e sem float. `formatBRLCompact` só para exibir resumos. Teste: `npm test`.
- CNPJ: exibir `00.000.000/0000-00`, ou o equivalente alfanumérico; guardar 14 caracteres sem máscara.
- Datas: `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })`.

## Ainda não construído (entra com as telas)

- Skeletons de tabela e KPI, cabeçalho ordenável com `aria-sort`, paginação e Dialog no tamanho full. Todos só fazem sentido com dados reais (`/replica-build`).
