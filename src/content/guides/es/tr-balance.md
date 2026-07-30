---
layout: layouts/guide.njk
contentKind: guide
contentId: tr-balance
locale: es
order: 8
category: rates
title: "Cómo la TR modifica el saldo pendiente"
description: "Compare la misma financiación con y sin corrección por TR y entienda la hipótesis conservadora del simulador."
tags: [TR, corrección monetaria, saldo pendiente, SGS 226]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
toc:
  - { id: aplicacion, label: "Dónde se aplica" }
  - { id: referencia, label: "Referencia oficial" }
  - { id: comparacion, label: "Con y sin TR" }
contractNotes:
  - "Los contratos pueden aplicar TR por aniversario y reglas de fecha propias; revise la cláusula y el extracto."
  - "La corrección puede ocurrir antes de intereses y amortización."
limitations:
  - "El escenario repite la mayor observación de la ventana anual como tasa mensual fija; no es un pronóstico."
  - "No reproduce aniversarios, desfases, pro rata ni cambios futuros."
sources:
  - { label: "Banco Central de Brasil — serie TR SGS 226", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, bank-payment-difference, compare-proposals]
relatedSimulationIds: [with-without-tr]
---
<h2 id="aplicacion">Dónde se aplica</h2>

En un modelo simplificado, el índice actualiza el saldo antes del resto:

<div class="content-formula" role="math" aria-label="Saldo corregido igual al saldo anterior por uno más la tasa referencial">saldo corregido = saldo anterior × (1 + TR del período)</div>

La TR no se suma simplemente a los intereses; cambia la base sobre la que se calculan intereses y amortización.

<h2 id="referencia">Referencia oficial</h2>

El build lee la serie SGS 226 con inicio, fin y tasa y elige la mayor observación de una ventana móvil de doce meses. El simulador repite ese porcentaje como estimación conservadora e identifica el período elegido.

<h2 id="comparacion">Con y sin TR</h2>

{% scenarioModule "with-without-tr", generatedPage %}

La trayectoria acumulada no es una previsión. La TR real varía y cada contrato define cómo llega al saldo.
