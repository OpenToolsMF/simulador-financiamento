---
layout: layouts/guide.njk
contentKind: guide
contentId: price-table
locale: en
order: 3
category: fundamentals
title: "Price table: formula, advantages and limitations"
description: "Calculate a Price payment and understand how interest and amortization move within a level financial payment."
tags: [Price, payment, formula, rounding]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: formula, label: "Payment formula" }
  - { id: evolution, label: "Calculated evolution" }
  - { id: caveats, label: "Advantages and caveats" }
contractNotes:
  - "The total payment may cease to be level when there is indexation, variable insurance or a contractual recalculation."
  - "Lenders may use date and rounding conventions different from this estimate."
limitations:
  - "The calculation assumes regular monthly periods and a constant rate."
  - "It excludes CET costs, arrears, grace periods and index changes."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, sac-table, sac-or-price]
relatedSimulationIds: [price-300k-360]
---
<h2 id="formula">Payment formula</h2>

Under Price, a constant periodic rate creates a level financial payment. For principal `PV`, monthly rate `i` and term `n`:

<div class="content-formula" role="math" aria-label="Payment equals principal times rate divided by one minus one plus rate raised to negative term">PMT = PV × i ÷ [1 − (1 + i)<sup>−n</sup>]</div>

Monthly interest still uses the balance. Amortization is `Aₜ = PMT − Iₜ`: it starts smaller and grows over time.

<h2 id="evolution">Calculated evolution</h2>

This example uses the same BRL 300,000, 360 months and BCB reference as the SAC example.

{% scenarioModule "price-300k-360", generatedPage %}

<h2 id="caveats">Advantages and caveats</h2>

A level financial payment can make budgeting easier when there is no index or variable cost. The trade-off is lower early amortization than SAC with equal inputs, so a larger balance remains for longer.

Rounding every payment to cents accumulates small differences. This engine clears them in the final payment; a lender may distribute the adjustment differently.
