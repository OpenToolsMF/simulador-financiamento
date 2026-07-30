---
layout: layouts/guide.njk
contentKind: guide
contentId: sac-table
locale: en
order: 2
category: fundamentals
title: "SAC table: how it works and how to calculate it"
description: "Understand constant amortization under SAC, calculate interest and payments, and follow the outstanding balance curve."
tags: [SAC, formula, declining payment, outstanding balance]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: formula, label: "SAC formula" }
  - { id: calculation, label: "Sample calculation" }
  - { id: interpretation, label: "What the curve shows" }
contractNotes:
  - "Amortization remains constant only without balance indexation, grace periods, capitalized charges or extraordinary events."
  - "The collected payment may include insurance and fees outside the SAC formula."
limitations:
  - "The scenario excludes arrears, construction phases, grace periods and renegotiation."
  - "A repeated fixed adjustment rate is a hypothesis, not a forecast."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, price-table, sac-or-price]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="formula">SAC formula</h2>

The Constant Amortization System divides principal by the term. For financed amount `PV` and `n` payments:

<div class="content-formula" role="math" aria-label="Amortization equals financed amount divided by number of payments">A = PV ÷ n</div>

Each month, `Iₜ = OBₜ₋₁ × i` and `Pₜ = A + Iₜ + costs`. With no indexation or extra event, declining interest makes the payment fall.

<h2 id="calculation">Sample calculation</h2>

For BRL 300,000 over 360 months, theoretical amortization before cent adjustments is BRL 833.33 per month. The interest reference is shown inside the generated module.

{% scenarioModule "sac-300k-360", generatedPage %}

<h2 id="interpretation">What the curve shows</h2>

Without indexation, the balance falls almost linearly. Payments fall faster early on because each balance reduction removes more interest from the next period. The engine adjusts cents in the final row to close the balance.

SAC does not guarantee the lowest cost under every contract. Rate, index, term, insurance and other charges must be considered together.
