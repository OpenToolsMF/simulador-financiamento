---
layout: layouts/guide.njk
contentKind: guide
contentId: sac-or-price
locale: en
order: 4
category: fundamentals
title: "SAC or Price: compare the same financing"
description: "Compare SAC and Price side by side while keeping exactly the same amount, term and interest rate."
tags: [SAC, Price, comparison, total cost]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: fair, label: "A fair comparison" }
  - { id: results, label: "Side-by-side results" }
  - { id: interpretation, label: "How to interpret" }
contractNotes:
  - "Real proposals seldom differ only by system; verify the rate, CET, index, insurance and term."
  - "Some Price contracts include monetary adjustment or charges that change the total payment."
limitations:
  - "The result does not choose a suitable system or forecast future income."
  - "It excludes indexation, ancillary costs, taxes and approval conditions."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [sac-table, price-table, compare-proposals]
relatedSimulationIds: [sac-300k-360, price-300k-360]
---
<h2 id="fair">A fair comparison</h2>

Changing system, rate and term together hides the source of a difference. This comparison fixes `PV = BRL 300,000`, `n = 360` and the same BCB rate. Only amortization method changes.

| Aspect | SAC | Price |
|---|---|---|
| Early amortization | Higher and nearly constant | Lower and rising |
| Financial payment | Declining | Level without indexation |
| Early balance | Falls faster | Falls more slowly |

<h2 id="results">Side-by-side results</h2>

{% scenarioModule "sac-vs-price", generatedPage %}

<h2 id="interpretation">How to interpret</h2>

SAC tends to have a higher first payment and lower total interest because principal falls earlier. Price tends to start lower but holds a larger balance longer. The exact gap is derived from the rate and term.

A borrowing decision also requires the CET, index, costs and prepayment rules. This comparison isolates only the mathematics.
