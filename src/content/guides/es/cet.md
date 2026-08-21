---
layout: layouts/guide.njk
contentKind: guide
contentId: cet
locale: es
order: 8
category: rates
title: "Qué es el CET y por qué importa más que la tasa anunciada"
description: "Entienda el Costo Efectivo Total, qué flujos incluye y por qué este simulador no calcula el CET regulatorio."
tags: [CET, costos, seguros, tarifas, propuesta]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: concepto, label: "Qué reúne el CET" }
  - { id: ejemplo, label: "Propuesta hipotética" }
  - { id: alcance, label: "Qué cubre el simulador" }
contractNotes:
  - "La entidad calcula e informa el CET con los flujos, fechas y costos reales de la propuesta."
  - "Seguros, servicios opcionales y gastos de terceros deben identificarse en los documentos."
limitations:
  - "Mapa das Parcelas no calcula ni reproduce el CET regulatorio."
  - "El módulo solo muestra un costo mensual hipotético y no sustituye la planilla de la entidad."
sources:
  - { label: "Banco Central de Brasil — orientación sobre crédito y CET", url: "https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito", reviewed: "2026-07-27" }
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [compare-proposals, bank-payment-difference, annual-to-monthly-rate]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="concepto">Qué reúne el CET</h2>

El Costo Efectivo Total expresa en una sola tasa los cargos y gastos vinculados a la operación. El interés es solo un componente; el cálculo regulatorio utiliza flujos y fechas efectivos.

<div class="content-formula" role="math" aria-label="Valor neto recibido igual al valor presente de cuotas y gastos">valor neto recibido = valor presente de cuotas + gastos</div>

<h2 id="ejemplo">Propuesta hipotética</h2>

| Ítem | Escenario básico | Con costo |
|---|---:|---:|
| Principal | R$ 300.000 | R$ 300.000 |
| Plazo e intereses | iguales | iguales |
| Costo mensual extra | R$ 0 | R$ 150 |

{% scenarioModule "monthly-cost-impact", generatedPage %}

<h2 id="alcance">Qué cubre el simulador</h2>

El campo de costos mensuales muestra salidas mayores, pero **no calcula el CET regulatorio**. No modela todos los gastos iniciales, fechas exactas, tributos, importe neto liberado ni reglas normativas.

Use el CET informado por la entidad y revise su composición; no intente reconstruirlo sumando porcentajes.
