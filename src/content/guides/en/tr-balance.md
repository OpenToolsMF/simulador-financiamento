---
layout: layouts/guide.njk
contentKind: guide
contentId: tr-balance
locale: en
order: 8
category: rates
title: "How TR changes a mortgage's outstanding balance"
description: "Compare the same financing with and without TR adjustment and understand the simulator's conservative assumption."
tags: [TR, monetary adjustment, outstanding balance, SGS 226]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
toc:
  - { id: application, label: "Where adjustment enters" }
  - { id: reference, label: "Official reference" }
  - { id: comparison, label: "With and without TR" }
contractNotes:
  - "Contracts may apply TR by anniversary and their own date rules; verify the clause and statement."
  - "Adjustment may occur before interest and amortization, changing each balance step."
limitations:
  - "The scenario repeats the highest observation in the annual window as a fixed monthly rate; this is not a TR forecast."
  - "It does not reproduce anniversaries, lags, pro rata rules or future changes."
sources:
  - { label: "Central Bank of Brazil — TR series SGS 226", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, bank-payment-difference, compare-proposals]
relatedSimulationIds: [with-without-tr]
---
<h2 id="application">Where adjustment enters</h2>

In a simplified model, the index updates the balance before the rest of the calculation:

<div class="content-formula" role="math" aria-label="Adjusted balance equals previous balance times one plus the reference rate">adjusted balance = previous balance × (1 + period TR)</div>

TR is therefore not simply added to interest. It changes the base on which interest and amortization are processed.

<h2 id="reference">Official reference</h2>

The build reads official SGS 226 observations with start date, end date and rate, then selects the highest rate in a rolling twelve-month window. The simulator repeats it monthly as a conservative estimate and labels the selected period.

<h2 id="comparison">With and without TR</h2>

Both variants keep amount, term, SAC and the BCB median for TR-indexed mortgages. Only adjustment changes.

{% scenarioModule "with-without-tr", generatedPage %}

The accumulated path is not a forecast. Actual TR varies and each contract determines how observations reach the balance.
