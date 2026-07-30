---
layout: layouts/guide.njk
contentKind: guide
contentId: term-or-payment
locale: es
order: 5
category: amortization
title: "Reducir el plazo o bajar la cuota: cuál es la diferencia"
description: "Compare usar R$ 20 mil en el mes 60 para acortar el contrato o reducir las cuotas restantes."
tags: [amortización extraordinaria, reducir plazo, reducir cuota]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: objetivos, label: "Dos objetivos" }
  - { id: comparacion, label: "R$ 20 mil en el mes 60" }
  - { id: cambios, label: "Qué cambia" }
contractNotes:
  - "El contrato define fecha de procesamiento, valor mínimo y recálculo de cuota o plazo."
  - "Los cargos vencidos pueden pagarse antes de que el resto reduzca el principal."
limitations:
  - "La comparación supone que todo el aporte llega al saldo en el mes 60."
  - "Excluye tarifas, penalizaciones, restricciones y elegibilidad FGTS."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [fgts-amortization, financing-basics, simulator-mistakes]
relatedSimulationIds: [term-vs-payment, extra-20k-year-five]
---
<h2 id="objetivos">Dos objetivos</h2>

Una amortización extraordinaria reduce el saldo por el mismo importe. Cambia el flujo siguiente:

- **reducir plazo:** mantiene la lógica de cuota y elimina meses finales;
- **reducir cuota:** conserva el plazo y distribuye el saldo menor.

<div class="content-formula" role="math" aria-label="Nuevo saldo igual al saldo anterior menos el aporte">nuevo saldo = saldo anterior − aporte</div>

<h2 id="comparacion">R$ 20 mil en el mes 60</h2>

{% scenarioModule "term-vs-payment", generatedPage %}

<h2 id="cambios">Qué cambia</h2>

Reducir plazo suele eliminar más períodos con intereses; reducir cuota libera más caja mensual. El ahorro y los meses eliminados son resultados del escenario, no reglas universales.

Confirme en el extracto que el aporte llegó al principal y qué fecha se utilizó.
