---
layout: layouts/guide.njk
contentKind: guide
contentId: bank-payment-difference
locale: en
order: 10
category: contracts
title: "Why a lender's payment may differ from the simulator"
description: "Reconcile rates, dates, insurance, fees, indexation and rounding when a contract payment does not match an estimate."
tags: [payment, contract, insurance, dates, rounding]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: diagnosis, label: "Diagnostic sequence" }
  - { id: reconciliation, label: "Numerical reconciliation" }
  - { id: checks, label: "What to check" }
contractNotes:
  - "MIP, DFI, administration fees and other charges may vary with age, balance, property and month."
  - "An irregular first due date and day-count conventions may create proportional interest."
limitations:
  - "The example does not reproduce a lender's internal methodology."
  - "It excludes arrears, litigation, construction grace periods and contract amendments."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, cet, tr-balance, simulator-mistakes]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="diagnosis">Diagnostic sequence</h2>

Start with inputs: financed amount, remaining term, system, rate, annual type, first due date and index. Then separate the financial payment from costs.

<div class="content-formula" role="math" aria-label="Observed difference equals adjustment plus insurance plus fees plus date and rounding effects">difference = adjustment + insurance + fees + dates + rounding</div>

<h2 id="reconciliation">Numerical reconciliation</h2>

This example keeps debt and interest unchanged and adds BRL 150 monthly. The payment grows, while that cost does not change interest, amortization or balance.

{% scenarioModule "monthly-cost-impact", generatedPage %}

<h2 id="checks">What to check</h2>

| Line | Question |
|---|---|
| Interest | Do rate and period match? |
| Adjustment | Which observation and date were used? |
| Amortization | Do system and opening balance match? |
| Costs | Are MIP, DFI or fees present? |

If the sum still fails to reconcile, request the lender's calculation worksheet. A difference alone does not prove that either side is wrong.
