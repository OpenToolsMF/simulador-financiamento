---
layout: layouts/guide.njk
contentKind: guide
contentId: term-or-payment
locale: pt-BR
order: 5
category: amortization
title: "Amortizar prazo ou diminuir parcela: qual é a diferença"
description: "Compare o efeito de usar R$ 20 mil no mês 60 para encurtar o contrato ou reduzir as parcelas restantes."
tags: [amortização extraordinária, reduzir prazo, reduzir parcela]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: objetivos, label: "Dois objetivos" }
  - { id: comparacao, label: "R$ 20 mil no mês 60" }
  - { id: leitura, label: "O que muda" }
contractNotes:
  - "O contrato define quando o aporte é processado, se há valor mínimo e como a prestação ou o prazo são recalculados."
  - "Encargos vencidos podem ser quitados antes que o restante reduza o principal."
limitations:
  - "A comparação supõe aporte integral ao saldo e processamento no mês 60."
  - "Não considera tarifa, multa, restrição operacional nem uso de FGTS."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [fgts-amortization, financing-basics, simulator-mistakes]
relatedSimulationIds: [term-vs-payment, extra-20k-year-five]
---
<h2 id="objetivos">Dois objetivos</h2>

Uma amortização extraordinária reduz o saldo no mesmo valor nos dois casos. O que muda é a maneira de recalcular o fluxo seguinte:

- **reduzir prazo:** mantém a lógica da prestação e elimina meses finais;
- **reduzir parcela:** conserva o prazo e distribui o saldo menor pelas parcelas restantes.

<div class="content-formula" role="math" aria-label="Novo saldo igual ao saldo antes do aporte menos o aporte">novo saldo = saldo antes do aporte − aporte</div>

<h2 id="comparacao">R$ 20 mil no mês 60</h2>

O cenário aplica exatamente R$ 20 mil em um SAC de R$ 300 mil e 360 meses. Uma variante reduz o prazo; a outra reduz a parcela.

{% scenarioModule "term-vs-payment", generatedPage %}

<h2 id="leitura">O que muda</h2>

Reduzir prazo costuma retirar mais períodos de incidência de juros, enquanto reduzir parcela libera mais caixa mensal. O total de juros e os meses eliminados são resultados do cenário, não uma regra universal.

Antes de comparar, confirme no demonstrativo se o aporte foi aplicado ao principal e qual data de referência foi usada. Um pagamento feito depois do vencimento pode aparecer apenas no ciclo seguinte.
