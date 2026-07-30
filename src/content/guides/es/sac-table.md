---
layout: layouts/guide.njk
contentKind: guide
contentId: sac-table
locale: es
order: 2
category: fundamentals
title: "Tabla SAC: cómo funciona y cómo calcularla"
description: "Entienda la amortización constante del SAC, calcule intereses y cuotas y siga la curva del saldo pendiente."
tags: [SAC, fórmula, cuota decreciente, saldo pendiente]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: formula, label: "Fórmula del SAC" }
  - { id: calculo, label: "Cálculo de muestra" }
  - { id: interpretacion, label: "Qué muestra la curva" }
contractNotes:
  - "La amortización solo permanece constante sin corrección, carencia, capitalización de cargos o eventos extraordinarios."
  - "La cuota cobrada puede sumar seguros y tarifas que no pertenecen a la fórmula SAC."
limitations:
  - "El escenario excluye mora, obra, carencia y renegociación."
  - "Una tasa fija de corrección repetida es una hipótesis, no un pronóstico."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, price-table, sac-or-price]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="formula">Fórmula del SAC</h2>

El Sistema de Amortización Constante divide el principal por el plazo. Para valor financiado `PV` y `n` cuotas:

<div class="content-formula" role="math" aria-label="Amortización igual al valor financiado dividido por el número de cuotas">A = PV ÷ n</div>

Cada mes, `Jₜ = SIₜ₋₁ × i` y `Pₜ = A + Jₜ + costos`. Sin corrección ni eventos extra, la reducción de intereses hace disminuir la cuota.

<h2 id="calculo">Cálculo de muestra</h2>

Para R$ 300 mil en 360 meses, la amortización teórica antes de ajustes de centavos es R$ 833,33 mensuales.

{% scenarioModule "sac-300k-360", generatedPage %}

<h2 id="interpretacion">Qué muestra la curva</h2>

Sin corrección, el saldo baja casi linealmente. La cuota cae más al inicio porque cada reducción del saldo retira más intereses del período siguiente. El motor ajusta centavos al final para liquidar la deuda.

El SAC no garantiza el menor costo en cualquier contrato: hay que considerar tasa, índice, seguros y demás cargos.
