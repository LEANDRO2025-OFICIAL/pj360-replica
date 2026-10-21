// Premissas de cálculo do escritório. VALIDAR com o time tributário antes de usar com cliente:
// são pontos de partida conservadores, não números do PJ360 nem parecer técnico.
export const PREMISSAS = {
  transacao: {
    descontoEstimado: 0.4, // fração do passivo recuperável na média dos editais (estimativa)
    descontoMaximo: 0.65, // teto legal geral de desconto (Lei 13.988/2020, art. 11)
    prioridadeAltaSePassivoSobreFaturamento: 0.1,
  },
  previdenciaria: {
    salarioMedioMensalCents: 350000n, // R$ 3.500,00
    mesesPorAno: 13.33, // 12 salários + 13º + 1/3 de férias
    aliquotaPatronal: 0.2,
    fracaoVerbasIndenizatorias: 0.05, // parte da folha com tese de exclusão da base
    anosPrescricao: 5,
    minimoColaboradores: 10,
    prioridadeAltaAcimaCents: 50000000n, // R$ 500 mil
  },
  supplyTax: {
    faturamentoMinimoCents: 2000000000n, // R$ 20 mi
  },
} as const
