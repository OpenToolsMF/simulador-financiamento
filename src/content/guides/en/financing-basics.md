---
layout: layouts/guide.njk
contentKind: guide
contentId: financing-basics
locale: en
order: 1
category: fundamentals
title: "How interest, amortization and outstanding balance work"
description: "See how each payment is split, why interest changes and how the outstanding balance evolves through a mortgage."
tags: [interest, amortization, outstanding balance, payments]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: components, label: "The three components" }
  - { id: example, label: "Calculated example" }
  - { id: reading, label: "Reading the schedule" }
contractNotes:
  - "A contract may adjust the balance by TR or another index before calculating interest and amortization."
  - "Insurance, fees and monthly charges may increase the payment without reducing principal."
limitations:
  - "The example excludes MIP and DFI insurance, fees, taxes, arrears and renegotiation."
  - "Actual dates may create proportional interest; this model uses regular monthly periods."
sources:
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [sac-table, price-table, bank-payment-difference]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="components">The three components</h2>

**Interest** is charged on capital still owed. **Amortization** is the part that actually reduces principal. The **outstanding balance** is what remains after the period's adjustment and payments.

<div class="content-formula" role="math" aria-label="Payment equals interest plus amortization plus costs">Payment = interest + amortization + costs</div>

If the monthly rate is `i` and the opening balance is `OB`, basic interest is `I = OB × i`. A larger payment does not necessarily reduce more debt: insurance and fees do not amortize principal.

<h2 id="example">Calculated example</h2>

The module uses BRL 300,000, 360 months and the current median BCB fixed-rate mortgage observation. Its first, middle and final rows are generated at build time by the simulator's own engine.

{% scenarioModule "sac-300k-360", generatedPage %}

<h2 id="reading">Reading the schedule</h2>

Under SAC, scheduled amortization stays approximately constant. As the balance falls, interest and the payment decline. Read the balance chart with the table: cent rounding may place a small adjustment in the final payment.

To reconcile a lender statement, separate opening balance, monetary adjustment, interest, amortization, costs and closing balance. That prevents an insurance or indexation difference from being assigned to the wrong line.
