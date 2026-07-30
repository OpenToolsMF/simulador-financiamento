---
layout: layouts/simulation.njk
contentKind: simulation
contentId: term-vs-payment
scenarioId: term-vs-payment
locale: es
order: 5
title: "Comparación entre reducir plazo y reducir cuota"
description: "Aplique los mismos R$ 20 mil en el mes 60 y compare los dos objetivos de amortización."
tags: [reducir plazo, reducir cuota, comparación]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
limitations:
  - "Ambas variantes suponen el procesamiento integral del aporte en el mismo mes."
  - "El contrato puede imponer reglas de recálculo, valor mínimo y fechas."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [term-or-payment, fgts-amortization, simulator-mistakes]
---
<h2>El escenario</h2>

El saldo recibe R$ 20 mil en el mes 60. Una variante elimina cuotas finales; la otra mantiene 360 meses y recalcula la cuota.

<h2>Cómo interpretar</h2>

Reducir plazo prioriza retirar períodos con intereses. Reducir cuota prioriza aliviar el flujo mensual. Los indicadores cuantifican ese intercambio solo para este escenario.
