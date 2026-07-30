---
layout: layouts/simulation.njk
contentKind: simulation
contentId: with-without-tr
scenarioId: with-without-tr
locale: en
order: 6
title: "Scenario with and without TR adjustment"
description: "Compare SAC with zero adjustment and with the highest annual-window TR reference repeated monthly."
tags: [TR, monetary adjustment, comparison]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
limitations:
  - "Repeating the highest observation monthly is a conservative assumption, not a forecast."
  - "Does not reproduce anniversaries, lags and other contract criteria."
sources:
  - { label: "Central Bank of Brazil — TR series SGS 226", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
  - { label: "Central Bank of Brazil — credit operation interest rates", url: "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes", reviewed: "2026-07-27" }
relatedGuideIds: [tr-balance, compare-proposals, bank-payment-difference]
---
<h2>The scenario</h2>

Both variants use BRL 300,000, 360 months, SAC and the BCB median for TR-indexed mortgages. The second repeats the highest SGS 226 observation in the annual window.

<h2>How to interpret</h2>

The accumulated difference shows sensitivity to the adjustment assumption. It is not a guaranteed future cost; replace the series to explore another path.
