---
layout: layouts/guide.njk
contentKind: guide
contentId: simulator-mistakes
locale: pt-BR
order: 12
category: contracts
title: "Erros comuns ao usar um simulador de financiamento"
description: "Evite confundir taxa mensal e anual, ignorar TR e custos ou escolher o objetivo errado de uma amortização."
tags: [simulador, erros, taxa, TR, custos]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: []
toc:
  - { id: entradas, label: "Entradas erradas" }
  - { id: exemplo, label: "Taxa nominal e efetiva" }
  - { id: checklist, label: "Checklist antes de confiar" }
contractNotes:
  - "A nomenclatura da proposta pode não coincidir com a dos campos; use a memória de cálculo e não apenas o anúncio."
  - "Saldo atual e prazo remanescente são melhores entradas para um contrato em andamento do que os valores originais."
limitations:
  - "O checklist reduz erros de entrada, mas não valida contrato ou recomendação financeira."
  - "Resultados continuam sujeitos às limitações do sistema, datas e custos modelados."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
  - { label: "Banco Central — série SGS 226 da TR", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
relatedGuideIds: [annual-to-monthly-rate, tr-balance, bank-payment-difference]
relatedSimulationIds: [term-vs-payment, with-without-tr]
---
<h2 id="entradas">Entradas erradas</h2>

| Entrada problemática | Entrada verificável |
|---|---|
| “12” como taxa mensal porque o anúncio diz 12% a.a. | 12% anual com tipo nominal ou efetivo confirmado |
| Valor do imóvel | Valor efetivamente financiado |
| Zero de correção sem ler o indexador | TR ou série prevista na cláusula |
| Parcela financeira como parcela total | Juros e amortização mais seguros e tarifas |
| Aporte sem objetivo | Reduzir prazo ou reduzir parcela explicitamente |

<h2 id="exemplo">Taxa nominal e efetiva</h2>

<div class="content-formula" role="math" aria-label="Doze por cento ao ano efetivos não é igual a um por cento ao mês">12% a.a. efetivos ≠ 1% a.m.</div>

O exemplo abaixo mostra a diferença entre interpretar 12% anuais como efetivos ou nominais. Informar 12% **ao mês** seria um erro muito maior e fora da escala usual deste cenário.

{% scenarioModule "nominal-rate-example", generatedPage %}

<h2 id="checklist">Checklist antes de confiar</h2>

Confirme principal, prazo remanescente, periodicidade e tipo da taxa, sistema, correção, primeiro vencimento, custos e objetivo de cada amortização. Guarde a referência dos dados e compare as primeiras linhas com o demonstrativo.

Use o resultado como estimativa. Se uma entrada não está explícita no contrato, registre a hipótese em vez de tratá-la como fato.
