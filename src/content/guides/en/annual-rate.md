---
layout: layouts/guide.njk
contentKind: guide
contentId: annual-to-monthly-rate
locale: en
order: 6
category: rates
title: "Convert nominal and effective annual rates to monthly rates"
description: "Distinguish nominal from effective rates and correctly convert annual percentages to a monthly period."
tags: [annual rate, monthly rate, nominal, effective]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: []
toc:
  - { id: effective, label: "Equivalent effective rate" }
  - { id: nominal, label: "Nominal rate" }
  - { id: impact, label: "Payment impact" }
contractNotes:
  - "The proposal should identify period and rate type; do not assume every annual percentage is effective."
  - "Annual CET contains other cash flows and cannot be converted as if it were only an interest rate."
limitations:
  - "The formulas assume regular monthly compounding."
  - "They exclude daily rates, business-day rules, grace periods and irregular flows."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [cet, bank-payment-difference, simulator-mistakes]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="effective">Equivalent effective rate</h2>

An effective annual rate `iₐ` already includes compounding for the year:

<div class="content-formula" role="math" aria-label="Equivalent monthly rate equals one plus annual rate to the one twelfth power minus one">iₘ = (1 + iₐ)<sup>1/12</sup> − 1</div>

Twelve percent effective annually is about 0.9489% monthly, not 1%.

<h2 id="nominal">Nominal rate</h2>

If 12% a year is **nominal with monthly compounding**, divide by 12: `iₘ = 1%`. That monthly rate yields about 12.6825% effective annually.

<h2 id="impact">Payment impact</h2>

The module applies both readings to the same principal and term.

{% scenarioModule "nominal-rate-example", generatedPage %}

Select the period and annual type exactly as the proposal states. “12% p.a.” alone does not provide enough information to choose safely.
