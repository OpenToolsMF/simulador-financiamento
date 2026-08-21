---
layout: layouts/guide.njk
contentKind: guide
contentId: cet
locale: pt-BR
order: 8
category: rates
title: "O que é CET e por que importa mais do que a taxa anunciada"
description: "Entenda o Custo Efetivo Total, quais fluxos entram no cálculo e por que este simulador não calcula o CET regulatório."
tags: [CET, custos, seguros, tarifas, proposta]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: conceito, label: "O que o CET reúne" }
  - { id: exemplo, label: "Proposta hipotética" }
  - { id: simulador, label: "O que o simulador cobre" }
contractNotes:
  - "A instituição calcula e informa o CET conforme os fluxos, datas e custos efetivos da proposta."
  - "Seguros, serviços opcionais e despesas pagas a terceiros precisam ser identificados no documento contratual."
limitations:
  - "O Mapa das Parcelas não calcula nem reproduz o CET regulatório."
  - "O módulo mostra somente o impacto de um custo mensal hipotético e não substitui a planilha da instituição."
sources:
  - { label: "Banco Central — cuidados ao contratar crédito e CET", url: "https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito", reviewed: "2026-07-27" }
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [compare-proposals, bank-payment-difference, annual-to-monthly-rate]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="conceito">O que o CET reúne</h2>

O Custo Efetivo Total expressa, em uma única taxa, os encargos e despesas vinculados à operação. A taxa de juros é apenas um componente. O cálculo regulatório considera os fluxos efetivos e suas datas.

<div class="content-formula" role="math" aria-label="Valor líquido recebido igual ao valor presente dos pagamentos e despesas">valor líquido recebido = valor presente de parcelas + despesas</div>

<h2 id="exemplo">Proposta hipotética</h2>

Considere o mesmo financiamento com e sem R$ 150 mensais de custo acessório:

| Item | Cenário básico | Cenário com custo |
|---|---:|---:|
| Principal | R$ 300.000 | R$ 300.000 |
| Prazo e juros | iguais | iguais |
| Custo mensal adicional | R$ 0 | R$ 150 |

{% scenarioModule "monthly-cost-impact", generatedPage %}

<h2 id="simulador">O que o simulador cobre</h2>

O campo de custos mensais permite enxergar o aumento nominal das saídas, mas **não calcula o CET regulatório**: não modela todos os desembolsos iniciais, datas específicas, tributos, valores líquidos liberados nem regras normativas.

Para comparar propostas, use o CET informado pela instituição e confira a composição. Não tente reconstruí-lo apenas somando percentuais.
