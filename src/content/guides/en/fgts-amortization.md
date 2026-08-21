---
layout: layouts/guide.njk
contentKind: guide
contentId: fgts-amortization
locale: en
order: 12
category: amortization
title: "How to simulate an FGTS amortization"
description: "Model FGTS as an extra amortization and compare term and payment reduction without confusing simulation with eligibility."
tags: [FGTS, amortization, term, payment]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: model, label: "How to model it" }
  - { id: example, label: "BRL 20,000 example" }
  - { id: eligibility, label: "Eligibility is outside scope" }
contractNotes:
  - "CAIXA publishes options and requirements; the operating institution must confirm eligibility, intervals and documents."
  - "The released amount and effective date may differ from the worker's reported balance."
limitations:
  - "The simulator does not verify FGTS employment, property, interval or documentation rules."
  - "The contribution is treated as cash applied entirely to principal in the chosen month."
sources:
  - { label: "CAIXA — housing contract frequently asked questions", url: "https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-contrato/Paginas/default.aspx", reviewed: "2026-07-27" }
  - { label: "Central Bank of Brazil — Citizen Calculator", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [term-or-payment, financing-basics, simulator-mistakes]
relatedSimulationIds: [extra-20k-year-five, term-vs-payment]
---
<h2 id="model">How to model it</h2>

To study the financial effect, record the amount that could be released, processing month and goal. Create a one-time amortization:

<div class="content-formula" role="math" aria-label="New balance equals monthly balance minus the FGTS amount">new balance = monthly balance − FGTS amount</div>

This answers only what the payment flow would do if that amount entered in that month.

<h2 id="example">BRL 20,000 example</h2>

{% scenarioModule "term-vs-payment", generatedPage %}

<h2 id="eligibility">Eligibility is outside scope</h2>

Consult current official guidance and the responsible institution. Personal, property and contract requirements, minimum intervals and permitted uses are not calculated here.

After actual processing, replace the scenario with the new statement's balance and term.
