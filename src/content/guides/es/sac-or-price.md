---
layout: layouts/guide.njk
contentKind: guide
contentId: sac-or-price
locale: es
order: 4
category: fundamentals
title: "SAC o Price: comparación con la misma financiación"
description: "Compare SAC y Price lado a lado manteniendo exactamente el mismo importe, plazo y tasa de interés."
tags: [SAC, Price, comparación, costo total]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: justa, label: "Comparación justa" }
  - { id: resultados, label: "Resultados lado a lado" }
  - { id: interpretar, label: "Cómo interpretar" }
contractNotes:
  - "Las propuestas reales rara vez difieren solo por el sistema; verifique tasa, CET, índice, seguros y plazo."
  - "Algunos contratos Price incluyen corrección o cargos que alteran la cuota total."
limitations:
  - "El resultado no elige un sistema adecuado ni pronostica ingresos."
  - "Excluye corrección, costos accesorios, impuestos y condiciones de aprobación."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [sac-table, price-table, compare-proposals]
relatedSimulationIds: [sac-300k-360, price-300k-360]
---
<h2 id="justa">Comparación justa</h2>

Cambiar sistema, tasa y plazo al mismo tiempo oculta la causa de la diferencia. Aquí se fijan `PV = R$ 300.000`, `n = 360` y la misma tasa BCB.

| Aspecto | SAC | Price |
|---|---|---|
| Amortización inicial | Mayor y casi constante | Menor y creciente |
| Cuota financiera | Decreciente | Nivelada sin corrección |
| Saldo inicial | Baja más rápido | Baja más lentamente |

<h2 id="resultados">Resultados lado a lado</h2>

{% scenarioModule "sac-vs-price", generatedPage %}

<h2 id="interpretar">Cómo interpretar</h2>

SAC suele tener una primera cuota mayor y menos intereses totales porque reduce antes el principal. Price suele comenzar más bajo, pero conserva un saldo mayor durante más tiempo.

La contratación también exige comparar CET, índice, costos y reglas de pago anticipado. Aquí se aísla solo la mecánica matemática.
