---
layout: layouts/guide.njk
contentKind: guide
contentId: simulator-mistakes
locale: en
order: 12
category: contracts
title: "Common mistakes when using a financing simulator"
description: "Avoid mixing monthly and annual rates, ignoring TR and costs, or selecting the wrong extra-amortization goal."
tags: [simulator, mistakes, rate, TR, costs]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: []
toc:
  - { id: inputs, label: "Wrong inputs" }
  - { id: example, label: "Nominal and effective rates" }
  - { id: checklist, label: "Checklist before relying" }
contractNotes:
  - "Proposal labels may not match field labels; use the calculation worksheet, not only the advertisement."
  - "Current balance and remaining term are better inputs for an active contract than original values."
limitations:
  - "The checklist reduces input errors but does not validate a contract or provide financial advice."
  - "Results remain subject to the modelled system, dates and costs."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
  - { label: "Central Bank of Brazil — TR series SGS 226", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
relatedGuideIds: [annual-to-monthly-rate, tr-balance, bank-payment-difference]
relatedSimulationIds: [term-vs-payment, with-without-tr]
---
<h2 id="inputs">Wrong inputs</h2>

| Problematic input | Verifiable input |
|---|---|
| “12” monthly because the ad says 12% p.a. | 12% annual with nominal/effective type confirmed |
| Property price | Amount actually financed |
| Zero adjustment without reading the index clause | Contractual TR or series |
| Financial payment as total payment | Add insurance and fees |
| Contribution without a goal | Explicit term or payment reduction |

<h2 id="example">Nominal and effective rates</h2>

<div class="content-formula" role="math" aria-label="Twelve percent effective annually is not one percent monthly">12% effective p.a. ≠ 1% monthly</div>

{% scenarioModule "nominal-rate-example", generatedPage %}

<h2 id="checklist">Checklist before relying</h2>

Confirm principal, remaining term, period and rate type, system, adjustment, first due date, costs and each amortization goal. Keep the data reference and compare the first lines with the statement.

Treat every result as an estimate. Record an unknown input as an assumption instead of a fact.
