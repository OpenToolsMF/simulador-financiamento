---
layout: layouts/simulation.njk
contentKind: simulation
contentId: with-without-tr
scenarioId: with-without-tr
locale: es
order: 6
title: "Escenario con y sin corrección por TR"
description: "Compare SAC con corrección cero y con la mayor referencia TR de la ventana anual repetida mensualmente."
tags: [TR, corrección monetaria, comparación]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
limitations:
  - "Repetir la mayor observación mensualmente es una hipótesis conservadora, no un pronóstico."
  - "No reproduce aniversarios, desfases ni otros criterios contractuales."
sources:
  - { label: "Banco Central de Brasil — serie TR SGS 226", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
  - { label: "Banco Central de Brasil — tasas de operaciones de crédito", url: "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes", reviewed: "2026-07-27" }
relatedGuideIds: [tr-balance, compare-proposals, bank-payment-difference]
---
<h2>El escenario</h2>

Ambas variantes usan R$ 300 mil, 360 meses, SAC y la mediana BCB de la modalidad indexada por TR. La segunda repite la mayor observación SGS 226 de la ventana anual.

<h2>Cómo interpretar</h2>

La diferencia acumulada muestra sensibilidad a la corrección. No es un costo futuro garantizado; sustituya la serie para explorar otro camino.
