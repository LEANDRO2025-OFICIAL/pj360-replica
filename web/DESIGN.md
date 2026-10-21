# DESIGN.md

Guia visual para quem gera ou edita telas neste app (pessoas e agentes). Fonte dos valores: `../replica/design/tokens.json`. Especificação dos componentes: `../replica/design/components.md`. Vitrine viva: rota `/design`.

## Overview

Ferramenta interna de diagnóstico tributário e corporativo por CNPJ, usada por consultores todos os dias. O tom é sóbrio, confiável e denso de informação, sem marketing: perfil "Accessible & Ethical / B2B" (alto contraste, foco visível, texto de 14–16px). Os números (R$, contagens) são o conteúdo principal e precisam ser lidos de relance.

## Colors

### Brand & Accent
- `accent` `#0369a1` (azul-petróleo): ação primária, links, foco. Hover `#075985`. Versão suave `#e0f2fe` para seleção e hover de menu.
- Uma ação primária por área. O resto é secondary, outline ou ghost.

### Surface
- Página `#f8fafc`, cards `#ffffff`, faixas e pílulas neutras `#f1f5f9`, bordas `#e2e8f0`.
- Navegação e KPIs em slate escuro (`#0f172a` e `#1e293b`) com texto `#f8fafc`.

### Text
- Principal `#0f172a`, secundário `#475569`. Nunca preto ou branco puros.

### Status e grupos
- Sucesso `#15803d`, aviso `#a16207`, perigo `#b91c1c`, cada um com versão suave para fundo de pílula.
- Grupos de solução: TAX `#1d4ed8`, CONTABILIDADE `#6d28d9`, CORPORATE `#0f766e`, BANK `#15803d`, ENERGY `#b45309`, FAMILY `#be185d`, BROKERS `#c2410c`. Sempre com o nome escrito; a cor só reforça.
- Todo par de texto e fundo passa no WCAG AA (`python contrast.py tokens.json`).

## Typography

### Font Family
- Plus Jakarta Sans (Google Fonts, OFL) via `next/font`. Fallback: Inter, system-ui.

### Hierarchy
| papel | tamanho / altura | peso |
| --- | --- | --- |
| display | 40 / 44 | 700 |
| título de página | 28 / 34 | 700 |
| título de seção | 20 / 28 | 600 |
| corpo | 16 / 24 | 400 |
| tabela, formulário | 14 / 20 | 400–500 |
| legenda | 12 / 16 | 500 |

### Principles
- A hierarquia vem primeiro do peso e da cor; o tamanho entra depois.
- Toda coluna de número usa `tabular-nums`. Valores em R$ ficam alinhados à direita nas tabelas.
- Resumos usam o formato compacto ("R$ 43,5 mi") com o valor exato no `title`; tabelas e relatório mostram o valor exato.

## Layout

### Spacing System
Base 4px: 4, 8, 12, 16, 24, 32, 48, 64. O espaço dentro de um grupo é sempre menor que o espaço entre grupos.

### Grid & Container
- Sidebar 248px fixa a partir de 1024px; abaixo disso vira gaveta.
- Header 64px sticky. Conteúdo até 1280px, com margem de 24px (16px no mobile).
- KPIs em 4 colunas no desktop, 2 no tablet e 1 no mobile.

### Responsive Strategy
- Mobile-first, sem rolagem horizontal na página.
- No mobile, as tabelas de resultado viram cards, um por solução.
- Pontos de quebra: 375, 768, 1024, 1440.

## Elevation & Depth
- Estrutura usa borda de 1px `border`. Sombra só no que flutua: modal (`shadow-pop`), menus e select (`shadow-md`).
- Sem gradientes, sem brilho, sem glassmorphism.

## Shapes

### Border Radius Scale
6 (sm), 8 (md), 12 (lg: cards, campos, botões), pílula 999.

## Components

### Buttons
40px de altura (32 sm, 48 lg). Press com `scale(0.97)` em 150ms. Loading mantém o rótulo e mostra um spinner.

### Navigation
Sidebar escura com o item ativo em `nav-active` e `aria-current="page"`, link "Pular para o conteúdo" e busca de CNPJ no header.

### Inputs & Forms
Campos de 40px, sempre com `<Label>` visível e erro abaixo do campo ligado por `aria-describedby`. Valores em R$ usam `MoneyInput` (envia centavos).

### Pills & Badges
- Oportunidade: Sim (verde suave) ou Não (neutro).
- Prioridade: Alta, Média, Baixa.
- Estimativa: valor em R$ ou "Sem valor estimado", que não é o mesmo que R$ 0,00.
- Grupo: chip com ponto colorido e o nome escrito.

## Motion
- Curvas fortes: `ease-out` cubic-bezier(0.23, 1, 0.32, 1), `ease-drawer` cubic-bezier(0.32, 0.72, 0, 1).
- Toda animação de UI fica abaixo de 300ms. Ações de teclado não animam.
- `prefers-reduced-motion` deixa só os fades.

## Do / Don't
- Use os tokens (`bg-primary`, `text-muted-foreground`, `bg-tile`...).
- Escreva os textos de verdade em português, sem lorem ipsum.
- Desenhe os estados de vazio, carregando e erro de cada tela.
- Não use hex solto, `transition-all`, z-index acima de 50, ícone emoji, cor como único sinal ou placeholder no lugar de rótulo.
- Não copie logos, ícones, textos ou o marinho com dourado do PJ360.
