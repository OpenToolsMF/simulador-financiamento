---
layout: layouts/guide.njk
contentKind: guide
contentId: annual-to-monthly-rate
locale: es
order: 6
category: rates
title: "Convertir tasa anual nominal y efectiva en tasa mensual"
description: "Diferencie tasa nominal y efectiva y convierta correctamente porcentajes anuales a periodicidad mensual."
tags: [tasa anual, tasa mensual, nominal, efectiva]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: []
toc:
  - { id: efectiva, label: "Tasa efectiva equivalente" }
  - { id: nominal, label: "Tasa nominal" }
  - { id: impacto, label: "Impacto en las cuotas" }
contractNotes:
  - "La propuesta debe indicar periodicidad y tipo; no suponga que todo porcentaje anual es efectivo."
  - "El CET anual contiene otros flujos y no se convierte como una tasa de interés aislada."
limitations:
  - "Las fórmulas suponen capitalización mensual regular."
  - "No cubren tasas diarias, días hábiles, carencia ni flujos irregulares."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [cet, bank-payment-difference, simulator-mistakes]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="efectiva">Tasa efectiva equivalente</h2>

Una tasa anual efectiva `iₐ` ya incorpora capitalización:

<div class="content-formula" role="math" aria-label="Tasa mensual equivalente igual a uno más tasa anual elevado a un doceavo menos uno">iₘ = (1 + iₐ)<sup>1/12</sup> − 1</div>

El 12% anual efectivo equivale aproximadamente al 0,9489% mensual, no al 1%.

<h2 id="nominal">Tasa nominal</h2>

Si 12% anual es **nominal con capitalización mensual**, se divide por 12. Esa tasa del 1% mensual produce cerca del 12,6825% efectivo anual.

<h2 id="impacto">Impacto en las cuotas</h2>

{% scenarioModule "nominal-rate-example", generatedPage %}

Seleccione período y tipo anual exactamente como constan en la propuesta. “12% a.a.” por sí solo no basta.
