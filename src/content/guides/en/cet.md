---
layout: layouts/guide.njk
contentKind: guide
contentId: cet
locale: en
order: 8
category: rates
title: "What CET is and why it matters more than the advertised rate"
description: "Understand Total Effective Cost, which cash flows enter it and why this simulator does not calculate regulatory CET."
tags: [CET, costs, insurance, fees, proposal]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: concept, label: "What CET brings together" }
  - { id: example, label: "Hypothetical proposal" }
  - { id: coverage, label: "What the simulator covers" }
contractNotes:
  - "The lender calculates and discloses CET from the proposal's actual cash flows, dates and costs."
  - "Insurance, optional services and third-party expenses must be identified in the documents."
limitations:
  - "Mapa das Parcelas does not calculate or reproduce regulatory CET."
  - "The module only shows a hypothetical monthly cost and does not replace the lender's worksheet."
sources:
  - { label: "Central Bank of Brazil — credit contracting and CET guidance", url: "https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito", reviewed: "2026-07-27" }
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [compare-proposals, bank-payment-difference, annual-to-monthly-rate]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="concept">What CET brings together</h2>

Total Effective Cost expresses the charges and expenses tied to a credit operation as a single rate. Interest is only one component; the regulatory calculation uses actual cash flows and dates.

<div class="content-formula" role="math" aria-label="Net amount received equals present value of payments and expenses">net amount received = present value of payments + expenses</div>

<h2 id="example">Hypothetical proposal</h2>

| Item | Base scenario | With cost |
|---|---:|---:|
| Principal | BRL 300,000 | BRL 300,000 |
| Term and interest | equal | equal |
| Extra monthly cost | BRL 0 | BRL 150 |

{% scenarioModule "monthly-cost-impact", generatedPage %}

<h2 id="coverage">What the simulator covers</h2>

The monthly cost field shows higher nominal outflows but **does not calculate regulatory CET**. It omits some initial expenses, exact dates, taxes, net funds released and regulatory rules.

Use the CET disclosed by the lender and inspect its composition. Do not try to reconstruct it by simply adding percentages.
