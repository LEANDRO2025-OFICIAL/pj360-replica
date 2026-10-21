# Recon map: PJ360 (web)

Scope: loop central do diagnóstico — CNPJ do cliente → coleta de dados públicos → confirmação dos dados → pré-diagnóstico com IA → oportunidades por solução com estimativa em R$ → relatório PDF.
For: uso interno do escritório do usuário (não é produto para vender).
Date: 2026-10-21

Método: site público + conta do próprio usuário (escritório "LS"), navegada pelo usuário logado no navegador do app, em ritmo humano. Não foram lidos bundles JS nem chamadas de rede. Os textos dos modais foram lidos do DOM visível da página. Em 2026-10-21 o próprio usuário criou 1 diagnóstico (cota do mês) para mapear S08, S10 e o relatório PDF. Os dados da empresa diagnosticada e os contatos do usuário não foram copiados para este mapa.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site | https://pj360.com.br/ | posicionamento, módulos (Energia, Previdenciário, Tributário, Holding, Fintax, Câmbio, M&A), "dados públicos via APIs + IA, comparando com 40 mil empresas" |
| 2 | login | https://portal.pj360.com.br/login | email + senha, "Esqueci minha senha" |
| 3 | cadastro | https://portal.pj360.com.br/cadastre-se | Empresa, CNPJ/CPF, email, nome, senha x2, telefone, WhatsApp |
| 4 | conta do usuário: home | https://portal.pj360.com.br/home | painel do consultor com KPIs (print S01 do usuário) |
| 5 | conta do usuário: diagnósticos | https://portal.pj360.com.br/diagnosticos/listar | lista vazia + todos os modais do fluxo |
| 6 | conta do usuário: relatório | https://portal.pj360.com.br/usuarios/relatorio_diagnosticos_realizados | resumo por mês |
| 7 | conta do usuário: PJ Data | https://portal.pj360.com.br/pjdata | hub de módulos de dados (fora do escopo) |
| 8 | termos de uso | não encontrados no site público | usuário declarou que a conta não tem restrição de uso concorrente |

Não há help center, changelog nem docs de API públicos. Existe uma tela interna de "Novidades do PJ360" (/novidades), que não foi lida.

## Core loop

O consultor digita o CNPJ de um cliente e, em menos de um minuto, recebe uma lista de soluções (tributárias, energia, previdenciárias, societárias, crédito...) com prioridade e estimativa em R$, que ele leva ao cliente num PDF com a marca do escritório.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Home / Painel do Consultor | /home | visão geral da operação do consultor | header (menu, seletor de escritório, busca CNPJ, suporte, notificações, perfil), banner de saudação, cards de conteúdo, grupos de KPI tiles (Diagnósticos, Financeiro, Comercial, Blindagens, Equipe, Diagnósticos & Soluções com gráficos 6 meses, Projetos & Contratos), widget de chat IA | filled com zeros (conta nova) |
| S02 | Login | /login | autenticação | card central, email, senha, botão, link recuperar senha | default |
| S03 | Cadastro | /cadastre-se | ativar conta | form 8 campos | default |
| S04 | Lista de diagnósticos | /diagnosticos/listar | carteira de CNPJs diagnosticados | botões (Novo diagnóstico, Filtrar, Exportar Excel, Importar em massa, Valuation da carteira), 4 KPI cards (CNPJs consultados, Redução de custos, Compliance, Aumento de performance), tabela CNPJ / Razão Social / Solicitação / R$ / Ações com ordenação e paginação | empty |
| S05 | Modal Novo diagnóstico | S04 → Novo diagnóstico | iniciar diagnóstico | Razão Social, CNPJ, toggle "Importar quadro societário", Observação, aviso "usa dados públicos" | default |
| S06 | Modal Confirmar dados | após S05 (inferido) | revisar dados públicos antes do cálculo | CNPJ, razão social, setor, nome fantasia, regime tributário (editável), CNAE, origem do cliente (editável), faturamento inicial/final/média (editáveis), colaboradores CLT do CNPJ ou matriz+filiais (editável) | não visto preenchido |
| S07 | Modal Processando | após S06 | espera | "A IA do PJ360 está analisando seus resultados" | loading |
| S08 | Modal Resultados do diagnóstico | após S07 ou Ações da linha em S04 | entrega do valor | Visão executiva (CNPJ, regime, CNAE, segmento, empresa, atividade, endereço, receita anual estimada, colaboradores CLT, passivo tributário, origem); lista de TODAS as soluções do catálogo (29) agrupadas por categoria com chip colorido (TAX, CONTABILIDADE, CORPORATE, BANK, ENERGY, FAMILY, BROKERS); cada solução: Oportunidade (SIM/NÃO), Prioridade (ALTO/MÉDIO/BAIXO), Estimativa (R$ ou "Sem estimativa"), Ações (PDF da solução, link "Ver treinamento" desabilitado quando não há); rodapé "Análise realizada por" + data/hora da leitura; barra fixa: Atualizar dados, menu "…" (Journey, Assistente IA, Configurações), Assessment, PDF Assessment (desabilitado sem assessment), Visualizar | filled; mobile = cards em vez de tabela |
| S09 | Modal Assessment | S08 → Assessment | questionário para refinar oportunidades | stepper de 9 etapas: Perfil, Energia, Agro, M&A, Tax, Liq. Contratada, Societário, Bank, Family; selects Sim/Não, campos R$, sub-modais para adicionar itens (sócio, endividamento, obra, recebível, empresa do grupo com débito) | default |
| S10 | Modal Assistente IA "PJ MIND" | S08 → Assistente IA | texto de análise da empresa gerado por IA | título "Assistente IA PJ MIND - {razão social}", escritório + CNPJ, texto longo, ações: copiar texto, voltar ao topo, refazer análise; gerado sob demanda ao abrir | error ("Erro na requisição da IA. Tente novamente em instantes.") |
| S11 | Modal Configurar PDF | S08 → Configurações | personalizar relatório | toggles (cabeçalho, texto introdutório, infos comerciais), texto do cabeçalho, texto introdutório, nome / telefone / email comercial | default |
| S12 | Modal Escolha / Preview do PDF | S08 → Visualizar | ver e baixar o relatório | escolha do modelo: "PDF Completo" (todos os blocos) ou "PDF Resumido" (capa, dados do cliente, infos comerciais, quadro societário, resumo das soluções); preview em iframe HTML com Baixar PDF e Voltar | filled, loading |
| S13 | Modal Quadro societário (BETA) | S08 ou S05 com toggle | sócios da empresa | tabela Sócio / Tipo sócio / Tipo pessoa / CPF-CNPJ / emails / telefones, botão Atualizar dados | não visto |
| S14 | Modal Editar diagnóstico | Ações da linha em S04 | corrigir dados da empresa | dados da empresa, termômetro comercial, classificação/setor, CNAE principal e secundários, natureza jurídica, dívida tributária, faturamento, regime | default |
| S15 | Modal Filtrar | S04 → Filtrar | filtrar a lista | CNPJ, nome, razão social, segmento, observação | default |
| S16 | Modal Importação em massa | S04 → Importar em massa | diagnosticar vários CNPJs | baixar modelo .xlsx, upload, tabela de validação (CNPJ, válido, já possui diagnóstico, mensagem), Importar | aguardando arquivo |
| S17 | Modal Valuation da carteira | S04 → Valuation da carteira | somar o potencial da carteira | responsável, honorários, part. inicial/final %, seleção de diagnósticos → tabela Solução / Estimativa / Qtd empresas | default |
| S18 | Modais de bloqueio | durante S05 | regras de negócio | "Limite de diagnósticos excedido" (checkout ou consultor), "CNPJ fora de perfil", "Empresa blindada — continuar?", "Erro ao processar", "Comprar créditos" | não vistos disparados |
| S19 | Relatório de diagnósticos | menu → Relatórios → Diagnósticos realizados | contagem por mês | gráfico, tabela Mês / Quantidade, total | empty |
| S20 | Busca rápida CNPJ | campo "Consultar CNPJ" no header | atalho para consulta | input + botão seta | comportamento não testado |
| S21 | Relatório "Diagnósticos de Oportunidades — Tax & Corporate Report" | S12 → PDF Completo | o entregável ao cliente | páginas com cabeçalho repetido (nome do escritório + data); capa; Informações do cliente; Informações comerciais (empresa, nome, contato, e-mail do consultor); Mapa societário; "Soluções mapeadas" (Grupo, Solução, Pilar, Área, Projeção) com total e resumo por pilar (redução de custos / aumento de performance / compliance: qtd e R$); uma seção por solução com SIM (ver blocos abaixo); valuation indicativo com aviso legal | filled |

### Blocos das seções por solução no S21 (padrões reutilizáveis)

| bloco | exemplo observado | o que mostra |
| --- | --- | --- |
| Texto institucional | todas | o que é a solução, benefícios em tópicos |
| Lista de teses com probabilidade | Pontos Qualificados | tabela Tributo / Tese / Probabilidade (Provável, Possível, Remota) + distribuição em R$ por faixa (verde/amarelo/vermelho) |
| Faixas de risco | Revisão Previdenciária | legenda Administrativo 0% / Verde <15% / Amarelo 15–50% / Vermelho >50% com R$ por faixa e total |
| Quebra por tributo | Revisão Tributária Administrativa | R$ por tributo (ICMS, ICMS-ST, INSS, IPI, IRPJ/CSLL, PIS/COFINS) + tabela Tributo / Ponto de crédito / Grau de risco |
| Critérios de elegibilidade | Supply Tax | regra (regime LR ou LP; faturamento médio ≥ R$ 30 mi) vs. valor da empresa → "Empresa elegível" |
| Projeção de recuperação | Transação Tributária | valor da dívida, recuperável estimado, teto máximo recuperável (70%), faixa "de / até" |
| Score de aderência | Apuração Assistida, Renegociação de Dívidas | nota x/10 numa régua Baixo–Alto + rótulo (baixa/média/alta aderência) |
| Questionário pendente | M&A | "responda o assessment para validar" + disclaimer |
| Valuation indicativo | Valuation | 4 valores (mínimo, faixa, máximo) + aviso de caráter indicativo |

### Catálogo de soluções observado (29)

- TAX: FINEP, Lei do Bem, Pontos Qualificados, Revisão Previdenciária, Revisão Tributária Administrativa, Supply Tax, Transação Tributária
- CONTABILIDADE: Apuração Assistida
- CORPORATE: Agrocenários, Planejamento integrado, Redução de Custos de Vale Transporte, Regularização fundiária, Renegociação de dívida, Renegociação de Dívidas
- BANK: Antecipação de Recebíveis, Câmbio, FIDC - Captação de Recursos, FIDC - Otimização Tributária, Plano Empresário, Reperfilamento de Dívida, Seguro de Responsabilidade Civil, Seguro Garantia Licitante e Executante, Seguro Sucessão Empresarial
- ENERGY: Redução de Custos com Energia Elétrica
- FAMILY: Governança, Holding de Participações, Holding Patrimonial
- BROKERS: M & A

Cada solução também tem Pilar (redução de custos, aumento de performance, compliance) e Área (Fintax, Tributário Administrativo, Contabilidade, Bank, Energia, Family, Brokers).

### Padrões das estimativas (inferidos de 1 caso, todos são palpite)

- Renegociação de Dívidas: estimativa = passivo tributário inteiro.
- Transação Tributária: recuperável estimado ≈ 47,6% do passivo; teto = 70% do passivo.
- Revisão Previdenciária: total ≈ R$ 6.942 por colaborador CLT, dividido em faixas fixas (45% / 18% / 20% / 17%).
- Supply Tax: elegível se regime LR/LP e faturamento médio ≥ R$ 30 mi; sem valor em R$.
- Valuation: faixa proporcional ao faturamento (≈ 0,1× a 0,7×).
- Muitas soluções retornam só SIM/NÃO + prioridade, sem R$ ("Sem estimativa"): a regra é só de elegibilidade.
- Valores com centavos ",01" e ",50" sugerem que os números digitados na confirmação entram direto nas fórmulas.

## Flows

```
F01 Consultor diagnostica um CNPJ (core loop)
    S04 -> S05 (razão social, CNPJ, obs) -> [S18 checks: cota, perfil, blindagem]
        -> S06 confirma/edita regime, faturamento, CLT -> S07 processando -> S08 resultados
    happy path clicks: ~4 (Novo diagnóstico, Adicionar, Confirmar, abrir resultado), mais digitação
    edge: cota esgotada; CNPJ fora de perfil; CNPJ já blindado por outro consultor;
          CNPJ já diagnosticado; dados públicos incompletos (faturamento ou CLT vazios);
          CNPJ inválido; falha da API pública; empresa do Simples vs. Lucro Real muda as soluções

F02 Consultor entrega o relatório
    S08 -> S11 configura cabeçalho/intro/contato -> S12 escolhe Completo ou Resumido -> preview S21 -> Baixar PDF
    happy path clicks: 3 sem configurar (Visualizar, PDF Completo, Baixar PDF)
    edge: preview não carrega (fallback: abrir em nova aba); PDF do assessment ainda não existe

F03 Consultor refina com o assessment
    S08 -> S09 (9 etapas, Sim/Não + valores) -> salvar -> S08 com estimativas atualizadas (inferido) -> PDF Assessment
    edge: etapas não aplicáveis; listas de itens (endividamentos, obras, recebíveis, sócios)

F04 Consultor pede a leitura da IA
    S08 -> S10 texto gerado -> copiar / refazer análise
    edge: geração lenta ou falha (visto: "Erro ao se comunicar com o PJ MIND" na primeira abertura)

F05 Consultor importa a carteira
    S04 -> S16 baixa modelo -> sobe .xlsx -> valida linhas -> Importar -> vários diagnósticos
    edge: CNPJ inválido, já diagnosticado, cota insuficiente para o lote

F06 Consultor avalia a carteira
    S04 -> S17 seleciona diagnósticos, honorários e participação -> Gerar valuation
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Header bar | — | com notificações não lidas | todas |
| Sidebar menu | grupos colapsáveis (Comercial, Contratos, Relatórios, Treinamentos, Central de Suporte), busca no menu | aberto, fechado, mobile | todas |
| Seletor de escritório | select | 1 opção, várias | header |
| Busca CNPJ | input + botão ícone | vazio, digitando | header |
| KPI tile | escuro (azul-marinho) com ícone, valor, legenda; donut % | zero, com valor, variação vs. mês passado | S01, S04 |
| Section header | ícone + título + subtítulo | — | S01 |
| Data table | ordenável, paginada, coluna de ações | empty, filled | S04, S08, S16, S17 |
| Modal | pequeno (confirmação), grande (formulário), full (resultados) | loading, erro, sucesso | todas as de fluxo |
| Stepper | 9 etapas com select de etapa no mobile | etapa atual, concluída | S09 |
| Select Sim/Não | — | Selecione, Sim, Não | S09 |
| Input monetário | prefixo R$ | vazio, preenchido, editável | S06, S09, S14 |
| Toggle | — | ligado, desligado | S05, S11 |
| Botão | primário azul, escuro (preto + texto dourado), marrom, ghost | default, hover, disabled, loading | todas |
| Badge "Editável" | — | — | S06, S17 |
| Chat flutuante IA | botão "Conversar com a IA" | aberto, fechado | todas |
| Toast/alerta | info (aviso dados públicos) | — | S05 |

## Inferred data model

```
Escritorio  id, nome (ex. "LS"), plano, limite_diagnosticos_mes, limite_blindagens
            evidence: seletor do header, KPIs Contratados/Restantes, "Limite de blindagens: sem limite"
            confidence: high

Usuario     id, escritorio_id, nome, email, telefone, whatsapp, papel (consultor | gestor)
            evidence: S03, "Meus dados", ranking de consultores em S01
            confidence: medium (papéis são palpite)

Empresa     cnpj (pk), razao_social, nome_fantasia, natureza_juridica, cnae_principal, cnaes_secundarios[],
            atividade_economica, endereco, data_abertura, segmento, regime_tributario
            (SIMPLES | PRESUMIDO | REAL | NAO_SE_ENQUADRA), faturamento_inicial, faturamento_final,
            faturamento_medio, colaboradores_clt_cnpj, colaboradores_clt_grupo, passivo_tributario
            evidence: S06, S08, S14
            confidence: high (campos); faturamento e CLT vêm de fonte não pública ou estimativa — guess

Socio       id, empresa_cnpj, nome, tipo_socio, tipo_pessoa (PF | PJ), cpf_cnpj, email, email2,
            telefone, telefone2, participacao_pct
            evidence: S13, modal_add_socio
            confidence: high

Diagnostico id, escritorio_id, usuario_id, empresa_cnpj, tipo (CNPJ | PROCURACAO),
            origem_cliente (PROSPECCAO_FRIA | INDICACAO | MINHA_CARTEIRA), observacao,
            solicitado_em, status (processando | concluido | erro), dados_confirmados (snapshot json),
            total_estimado
            evidence: S04 colunas, S05, S06, S07, select tipo_diagnostico
            confidence: high

Oportunidade id, diagnostico_id, solucao_id, elegivel (bool, SIM/NÃO), prioridade (ALTO | MEDIO | BAIXO),
             estimativa_valor (nullable = "Sem estimativa"), score_aderencia (0-10, nullable),
             detalhe (json: teses, faixas de risco, quebra por tributo, faixa de recuperação)
            evidence: S08 (uma linha por solução do catálogo, inclusive NÃO), S21 blocos por solução
            confidence: high (campos), medium (detalhe json)

Solucao     id, grupo (TAX | CONTABILIDADE | CORPORATE | BANK | ENERGY | FAMILY | BROKERS),
            nome, pilar (REDUCAO_CUSTOS | AUMENTO_PERFORMANCE | COMPLIANCE | null),
            area (Fintax, Tributário Administrativo, Contabilidade, Bank, Energia, Family, Brokers),
            tipo_bloco_relatorio, texto_institucional, regra_elegibilidade, formula_estimativa, treinamento_url
            evidence: S08 categorias, S21 colunas Grupo/Pilar/Área, link /treinamentos/home?solucao={id}
            confidence: high (campos visíveis); guess (regras e fórmulas: escrever do zero)

Tese        id, solucao_id, tributo (ICMS | PIS/COFINS | IRPJ/CSLL | INSS | CPRB | CIDE | IPI ...),
            descricao, probabilidade (PROVAVEL | POSSIVEL | REMOTA), condicao_aplicacao
            evidence: S21 Pontos Qualificados e Revisão Tributária Administrativa
            confidence: medium

Assessment  id, diagnostico_id, etapa, respostas (json por etapa), atualizado_em
            itens filhos: endividamento (banco, valor, prazo, taxa, indexador, saldo),
            obra (nome, conclusao_pct, vendas_pct, vgv, custo), recebivel (tipo, qtd, valor),
            empresa_grupo_debito (cnpj, valor)
            evidence: S09 e sub-modais
            confidence: high (campos), medium (estrutura)

AnaliseIA   id, diagnostico_id, texto, gerado_em
            evidence: S10 "Refazer análise"
            confidence: medium

ConfigPDF   escritorio_id ou usuario_id, mostrar_cabecalho, mostrar_intro, mostrar_info_comercial,
            texto_cabecalho, texto_intro, contato_nome, contato_telefone, contato_email
            evidence: S11
            confidence: high

Blindagem   id, empresa_cnpj, usuario_id, escritorio_id, inicio, expira_em, status,
            motivo_desblindagem
            evidence: S01 seção Blindagens, S18 "Empresa blindada", PJ Data → Desblindagens
            confidence: medium (é regra da rede de franquias, ver fora de escopo)
```

Relationships: Escritorio 1-n Usuario; Escritorio 1-n Diagnostico; Usuario 1-n Diagnostico; Empresa 1-n Diagnostico; Empresa 1-n Socio; Diagnostico 1-n Oportunidade; Solucao 1-n Oportunidade; Solucao 1-n Tese; Diagnostico 1-1 Assessment; Diagnostico 1-n AnaliseIA; Empresa 1-n Blindagem.

## Feature matrix

See `features.csv`. Must: 13, should: 16, could: 11, skip: 8.

## Out of scope (cannot or should not be cloned)

- A base interna de 35 a 40 mil empresas usada para comparar: são dados do PJ360 e do Grupo Studio.
- As regras e estimativas das soluções como estão no PJ360: não dá para ver, e copiar não é permitido. As suas têm que nascer do seu conhecimento tributário (é o maior trabalho).
- A rede Grupo Studio: franquias, blindagem de CNPJ entre unidades, ranking da rede, execução técnica pela Studio Operacional.
- O contrato Journey e o fluxo de signatários: dependem da operação do Grupo Studio.
- Conteúdo de marketing (blog, newsletter, Morning Call, canal de notícias), GS Academy e treinamentos.
- Checkout e compra de créditos de diagnóstico: não fazem sentido para uso interno.
- Faturamento e número de CLT por CNPJ não são públicos. Vêm de fonte paga ou de estimativa, e a escolha é sua.

## Size

Screens 21 (11 no loop central), flows 6, entities 10, solutions no catálogo 29.
Hard parts:
1. Enriquecimento de dados: os dados cadastrais vêm de fontes abertas (Receita Federal / BrasilAPI e similares), mas faturamento, CLT e passivo tributário precisam de fonte paga, estimativa ou digitação na tela S06.
2. Motor de soluções: regras de elegibilidade e fórmulas de estimativa por área. É conhecimento tributário, não código, e define a qualidade do produto.
3. Relatório PDF configurável + análise por IA consistente com os números.
Size: M (algumas semanas) para o loop central com um primeiro conjunto de 5 a 10 soluções. Cada área nova de soluções soma esforço de conteúdo, não de tela.
