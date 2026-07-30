---
layout: layouts/guide.njk
contentKind: guide
contentId: simulator-mistakes
locale: es
order: 12
category: contracts
title: "Errores comunes al usar un simulador de financiación"
description: "Evite mezclar tasas mensuales y anuales, ignorar TR y costos o elegir el objetivo incorrecto de una amortización."
tags: [simulador, errores, tasa, TR, costos]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: []
toc:
  - { id: entradas, label: "Entradas incorrectas" }
  - { id: ejemplo, label: "Tasas nominal y efectiva" }
  - { id: lista, label: "Lista antes de confiar" }
contractNotes:
  - "Los nombres de la propuesta pueden no coincidir con los campos; use la memoria de cálculo y no solo el anuncio."
  - "Saldo actual y plazo restante son mejores datos para un contrato vigente que los valores originales."
limitations:
  - "La lista reduce errores de entrada, pero no valida un contrato ni ofrece asesoramiento."
  - "Los resultados dependen del sistema, fechas y costos modelados."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
  - { label: "Banco Central de Brasil — serie TR SGS 226", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
relatedGuideIds: [annual-to-monthly-rate, tr-balance, bank-payment-difference]
relatedSimulationIds: [term-vs-payment, with-without-tr]
---
<h2 id="entradas">Entradas incorrectas</h2>

| Entrada problemática | Entrada verificable |
|---|---|
| “12” mensual porque el anuncio dice 12% a.a. | 12% anual con tipo nominal o efectivo confirmado |
| Precio del inmueble | Importe efectivamente financiado |
| Corrección cero sin leer el índice | TR o serie contractual |
| Cuota financiera como cuota total | Añadir seguros y tarifas |
| Aporte sin objetivo | Reducción explícita de plazo o cuota |

<h2 id="ejemplo">Tasas nominal y efectiva</h2>

<div class="content-formula" role="math" aria-label="Doce por ciento efectivo anual no es uno por ciento mensual">12% efectivo anual ≠ 1% mensual</div>

{% scenarioModule "nominal-rate-example", generatedPage %}

<h2 id="lista">Lista antes de confiar</h2>

Confirme principal, plazo restante, período y tipo de tasa, sistema, corrección, primer vencimiento, costos y objetivo de cada amortización. Compare las primeras líneas con el extracto.

Trate el resultado como estimación y registre toda entrada desconocida como hipótesis.
