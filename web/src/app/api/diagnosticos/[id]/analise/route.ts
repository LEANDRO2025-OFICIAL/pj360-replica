import { NextResponse } from "next/server"

// S10: Análise por IA (PJ MIND). Gera texto de análise do diagnóstico.
// Em modo demonstração (sem IA configurada), retorna um texto indicativo.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { refazer = false } = (await request.json()) ?? {}

  // Sem IA configurada: retorna análise indicativa baseada nos dados do diagnóstico
  const analise = `
# Análise PJ MIND — Diagnóstico ${id}

## Resumo executivo

Com base nos dados informados para este diagnóstico, a empresa apresenta oportunidades de redução de custos tributários e aumento de performance em ${refazer ? "reavaliação" : "análise inicial"}.

## Principais pontos observados

- O diagnóstico já mapeou soluções elegíveis com base no regime tributário, faturamento, equipe CLT e passivo tributário informados.
- Cada solução tem prioridade (alta, média ou baixa) e estimativa de valor quando aplicável.
- Soluções com estimativa de R$ nula dependem de análise complementar ou dados do assessment.

## Recomendação

1. Comece pelas soluções com prioridade "alta" e estimativa definida.
2. Para soluções com estimativa "a calcular", preencha o assessment para refinar a análise.
3. Gere o relatório PDF para levar ao cliente com o laudo do escritório.

---
*Análise gerada por IA (PJ MIND) — versão indicativa. Valide com o time tributário antes de apresentar ao cliente.*
  `

  return NextResponse.json({ analise, refazer, geradoEm: new Date().toISOString() })
}
