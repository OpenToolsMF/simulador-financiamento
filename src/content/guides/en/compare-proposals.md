---
layout: layouts/guide.njk
contentKind: guide
contentId: compare-proposals
locale: en
order: 10
category: contracts
title: "How to compare two mortgage proposals"
description: "Build one table for rate, CET, index, costs, initial payment and estimated total across two proposals."
tags: [proposals, CET, index, comparison]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
toc:
  - { id: normalize, label: "Normalize proposals" }
  - { id: table, label: "Comparison table" }
  - { id: interpret, label: "Interpret without shortcuts" }
contractNotes:
  - "A proposal and final contract may have different validity, approval conditions and costs; compare the same stage."
  - "Indexes, insurance and fees may change over time and require explicit rules."
limitations:
  - "The scenario uses hypothetical proposals and does not recommend a lender or product."
  - "Future totals with repeated TR are estimates, not guarantees."
sources:
  - { label: "Central Bank of Brazil — credit contracting and CET guidance", url: "https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito", reviewed: "2026-07-27" }
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [cet, tr-balance, sac-or-price]
relatedSimulationIds: [with-without-tr, sac-300k-360]
---
<h2 id="normalize">Normalize proposals</h2>

Compare the same property value, down payment, principal and term. Record interest, annual rate type, system, index, CET, insurance, fees, first due date and prepayment rules separately.

<h2 id="table">Comparison table</h2>

| Field | Proposal A | Proposal B |
|---|---|---|
| Principal and term | equal | equal |
| Interest | BCB fixed-rate median | BCB TR-indexed median |
| Adjustment | none | repeated TR reference |
| Hypothetical monthly cost | BRL 0 | BRL 120 |
| CET | check document | check document |

{% scenarioModule "proposal-comparison", generatedPage %}

<h2 id="interpret">Interpret without shortcuts</h2>

<div class="content-formula" role="math" aria-label="Comparable cost includes payments, initial expenses and ancillary costs">comparable cost = payments + initial expenses + ancillary costs</div>

A lower first payment may come with indexation, a longer term or another charge. An estimated total also does not replace CET: they are different measures.
