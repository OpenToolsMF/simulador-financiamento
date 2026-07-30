---
layout: layouts/guide.njk
contentKind: guide
contentId: term-or-payment
locale: en
order: 5
category: amortization
title: "Reduce the term or lower the payment: what changes"
description: "Compare using BRL 20,000 in month 60 to shorten the contract or reduce the remaining payments."
tags: [extra amortization, reduce term, reduce payment]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: goals, label: "Two goals" }
  - { id: comparison, label: "BRL 20,000 in month 60" }
  - { id: changes, label: "What changes" }
contractNotes:
  - "The contract defines processing dates, minimum values and how the payment or term is recalculated."
  - "Past-due charges may be settled before the remainder reduces principal."
limitations:
  - "The comparison assumes the whole amount reaches principal in month 60."
  - "It excludes fees, penalties, operational limits and FGTS eligibility."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [fgts-amortization, financing-basics, simulator-mistakes]
relatedSimulationIds: [term-vs-payment, extra-20k-year-five]
---
<h2 id="goals">Two goals</h2>

An extra amortization reduces balance by the same amount in both cases. The following flow differs:

- **reduce term:** keeps the payment logic and removes final months;
- **reduce payment:** keeps the term and spreads the lower balance over remaining months.

<div class="content-formula" role="math" aria-label="New balance equals balance before contribution minus contribution">new balance = prior balance − contribution</div>

<h2 id="comparison">BRL 20,000 in month 60</h2>

{% scenarioModule "term-vs-payment", generatedPage %}

<h2 id="changes">What changes</h2>

Reducing term often removes more interest-bearing periods; reducing payment frees more monthly cash. Interest saved and months removed are scenario outputs, not universal rules.

Check the statement to confirm that the contribution reached principal and which reference date was used.
