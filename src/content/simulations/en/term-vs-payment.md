---
layout: layouts/simulation.njk
contentKind: simulation
contentId: term-vs-payment
scenarioId: term-vs-payment
locale: en
order: 5
title: "Reduce term or reduce payment"
description: "Apply the same BRL 20,000 in month 60 and compare the two amortization goals."
tags: [reduce term, reduce payment, comparison]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
limitations:
  - "Both variants assume the full contribution is processed in the same month."
  - "A real contract may impose recalculation, minimum value and date rules."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [term-or-payment, fgts-amortization, simulator-mistakes]
---
<h2>The scenario</h2>

The balance receives BRL 20,000 in month 60 in both variants. One removes final payments; the other keeps 360 months and recalculates the payment.

<h2>How to interpret</h2>

Term reduction prioritizes removing interest-bearing periods. Payment reduction prioritizes monthly cash-flow relief. The indicators quantify this trade-off only for the scenario.
