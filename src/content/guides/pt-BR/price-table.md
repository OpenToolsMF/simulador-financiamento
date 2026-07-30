---
layout: layouts/guide.njk
contentKind: guide
contentId: price-table
locale: pt-BR
order: 3
category: fundamentals
title: "Tabela Price: fórmula, vantagens e limitações"
description: "Calcule a prestação da Tabela Price e entenda como juros e amortização mudam dentro de uma parcela nivelada."
tags: [Price, prestação, fórmula, arredondamento]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: formula, label: "Fórmula da prestação" }
  - { id: evolucao, label: "Evolução calculada" }
  - { id: cuidados, label: "Vantagens e cuidados" }
contractNotes:
  - "A prestação financeira pode deixar de ser constante quando há correção monetária, seguros variáveis ou recálculo contratual."
  - "Bancos podem adotar convenções de data e arredondamento diferentes das usadas nesta estimativa."
limitations:
  - "O cálculo pressupõe períodos mensais regulares e taxa constante."
  - "Não inclui custos do CET, mora, carência nem mudança de indexador."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, sac-table, sac-or-price]
relatedSimulationIds: [price-300k-360]
---
<h2 id="formula">Fórmula da prestação</h2>

Na Price, uma taxa periódica constante produz uma prestação financeira nivelada. Para principal `PV`, taxa mensal `i` e prazo `n`:

<div class="content-formula" role="math" aria-label="Prestação igual ao principal multiplicado pela taxa e dividido por um menos um mais a taxa elevado ao prazo negativo">PMT = PV × i ÷ [1 − (1 + i)<sup>−n</sup>]</div>

Os juros de cada mês ainda são calculados sobre o saldo. A amortização é a diferença `Aₜ = PMT − Jₜ`: começa menor e cresce ao longo do contrato.

<h2 id="evolucao">Evolução calculada</h2>

O exemplo usa os mesmos R$ 300 mil, 360 meses e referência BCB do exemplo SAC. Compare as colunas de juros e amortização entre o começo e o final.

{% scenarioModule "price-300k-360", generatedPage %}

<h2 id="cuidados">Vantagens e cuidados</h2>

A parcela financeira nivelada facilita visualizar um orçamento estável quando não há indexador nem custos variáveis. Em contrapartida, a amortização inicial é menor do que no SAC com os mesmos parâmetros, deixando saldo maior por mais tempo.

Arredondar a prestação para centavos em todos os meses acumula pequenas diferenças. O motor recalcula a última parcela para liquidar o saldo; um banco pode distribuir esse ajuste de outra forma.
