---
layout: layouts/guide.njk
contentKind: guide
contentId: financing-basics
locale: es
order: 1
category: fundamentals
title: "Cómo funcionan los intereses, la amortización y el saldo pendiente"
description: "Vea cómo se divide cada cuota, por qué cambian los intereses y cómo evoluciona el saldo de una financiación inmobiliaria."
tags: [intereses, amortización, saldo pendiente, cuotas]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: componentes, label: "Los tres componentes" }
  - { id: ejemplo, label: "Ejemplo calculado" }
  - { id: lectura, label: "Cómo leer la evolución" }
contractNotes:
  - "El contrato puede corregir el saldo por TR u otro índice antes de calcular intereses y amortización."
  - "Seguros, tarifas y cargos mensuales pueden aumentar la cuota sin reducir el principal."
limitations:
  - "El ejemplo no incluye seguros MIP y DFI, tarifas, impuestos, mora o renegociación."
  - "Las fechas reales pueden generar intereses proporcionales; aquí se usan períodos mensuales regulares."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [sac-table, price-table, bank-payment-difference]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="componentes">Los tres componentes</h2>

Los **intereses** se calculan sobre el capital todavía adeudado. La **amortización** reduce el principal. El **saldo pendiente** es lo que queda después de la corrección y los pagos del período.

<div class="content-formula" role="math" aria-label="Cuota igual a intereses más amortización más costos">Cuota = intereses + amortización + costos</div>

Si la tasa mensual es `i` y el saldo inicial `SI`, los intereses básicos son `J = SI × i`. Una cuota mayor no significa necesariamente más reducción: seguros y tarifas no amortizan el principal.

<h2 id="ejemplo">Ejemplo calculado</h2>

El módulo usa R$ 300 mil, 360 meses y la mediana vigente de la modalidad inmobiliaria prefijada del BCB. Las filas son calculadas durante el build por el mismo motor del simulador.

{% scenarioModule "sac-300k-360", generatedPage %}

<h2 id="lectura">Cómo leer la evolución</h2>

En SAC, la amortización programada permanece aproximadamente constante. Al caer el saldo, también disminuyen intereses y cuota. Los redondeos en centavos pueden concentrar un pequeño ajuste en la última cuota.

Para conciliar un extracto, separe saldo anterior, corrección, intereses, amortización, costos y saldo final.
