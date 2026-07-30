---
layout: layouts/guide.njk
contentKind: guide
contentId: sac-table
locale: pt-BR
order: 2
category: fundamentals
title: "Tabela SAC: como funciona e como calcular"
description: "Entenda a amortização constante do SAC, calcule juros e parcelas e acompanhe a curva do saldo devedor."
tags: [SAC, fórmula, parcela decrescente, saldo devedor]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: formula, label: "Fórmula do SAC" }
  - { id: calculo, label: "Cálculo amostral" }
  - { id: interpretacao, label: "O que a curva mostra" }
contractNotes:
  - "A amortização só permanece constante se não houver correção do saldo, carência, incorporação de encargos ou eventos extraordinários."
  - "A prestação cobrada pode somar seguros e tarifas que não fazem parte da fórmula SAC."
limitations:
  - "O cenário não representa atraso, carência, obra, juros de fase de construção ou renegociação."
  - "Uma taxa fixa de correção repetida é apenas uma hipótese, não uma previsão."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, price-table, sac-or-price]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="formula">Fórmula do SAC</h2>

No Sistema de Amortização Constante, o principal é dividido pelo prazo. Para valor financiado `PV` e `n` parcelas:

<div class="content-formula" role="math" aria-label="Amortização igual ao valor financiado dividido pelo número de parcelas">A = PV ÷ n</div>

Em cada mês, `Jₜ = SDₜ₋₁ × i` e `Pₜ = A + Jₜ + custos`. Sem correção e sem evento extra, a amortização é constante e a redução dos juros faz a prestação cair.

<h2 id="calculo">Cálculo amostral</h2>

Neste cenário de R$ 300 mil em 360 meses, a amortização teórica antes dos ajustes de centavos é R$ 833,33 por mês. Os juros usam a mediana BCB indicada no próprio módulo, evitando copiar resultados manualmente para o texto.

{% scenarioModule "sac-300k-360", generatedPage %}

<h2 id="interpretacao">O que a curva mostra</h2>

A linha do saldo tende a cair quase de forma linear quando não há correção. Já a prestação diminui mais no início, quando a queda do saldo retira mais juros da parcela seguinte. Observe a última linha da tabela: o motor ajusta centavos para encerrar o saldo, então ela pode não repetir exatamente a amortização teórica.

O SAC não garante menor custo em qualquer contrato. Taxa, indexador, prazo, seguros e demais encargos precisam ser comparados em conjunto.
