---
layout: layouts/guide.njk
contentKind: guide
contentId: compare-proposals
locale: pt-BR
order: 10
category: contracts
title: "Como comparar duas propostas de financiamento imobiliário"
description: "Monte um quadro único para comparar taxa, CET, indexador, custos, parcela inicial e total estimado de duas propostas."
tags: [propostas, CET, indexador, comparação]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
toc:
  - { id: normalize, label: "Normalize as propostas" }
  - { id: quadro, label: "Quadro comparativo" }
  - { id: interpretar, label: "Interprete sem atalhos" }
contractNotes:
  - "Proposta e contrato podem ter validade, condições de aprovação e custos diferentes; compare documentos da mesma etapa."
  - "Indexadores, seguros e tarifas podem mudar ao longo do tempo e precisam de regras explícitas."
limitations:
  - "O cenário usa propostas hipotéticas e não recomenda instituição ou produto."
  - "Totais futuros com TR repetida são estimativas, não garantias."
sources:
  - { label: "Banco Central — cuidados ao contratar crédito e CET", url: "https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito", reviewed: "2026-07-27" }
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [cet, tr-balance, sac-or-price]
relatedSimulationIds: [with-without-tr, sac-300k-360]
---
<h2 id="normalize">Normalize as propostas</h2>

Compare o mesmo valor de imóvel, entrada, principal e prazo. Registre separadamente taxa de juros, tipo anual, sistema, indexador, CET, seguros, tarifas, primeiro vencimento e regras de amortização.

<h2 id="quadro">Quadro comparativo</h2>

| Campo | Proposta A | Proposta B |
|---|---|---|
| Principal e prazo | iguais | iguais |
| Juros | mediana prefixada BCB | mediana pós-fixada TR BCB |
| Correção | nenhuma | referência TR repetida |
| Custo mensal hipotético | R$ 0 | R$ 120 |
| CET | consultar documento | consultar documento |

{% scenarioModule "proposal-comparison", generatedPage %}

<h2 id="interpretar">Interprete sem atalhos</h2>

<div class="content-formula" role="math" aria-label="Custo comparável inclui pagamentos, despesas iniciais e custos acessórios">custo comparável = parcelas + despesas iniciais + custos acessórios</div>

Uma primeira parcela menor pode vir acompanhada de indexação, prazo maior ou custo acessório. Um total estimado também não substitui o CET: são métricas diferentes. Faça pelo menos um cenário-base e um cenário de estresse explicitando as hipóteses.
