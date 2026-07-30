---
layout: layouts/simulation.njk
contentKind: simulation
contentId: with-without-tr
scenarioId: with-without-tr
locale: pt-BR
order: 6
title: "Cenário com e sem correção pela TR"
description: "Compare um SAC com correção zero e com a maior referência TR da janela anual repetida mensalmente."
tags: [TR, correção monetária, comparação]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
limitations:
  - "Repetir a maior observação mensalmente é uma hipótese conservadora, não uma previsão."
  - "Não reproduz aniversários, defasagens e demais critérios do contrato."
sources:
  - { label: "Banco Central — série SGS 226 da TR", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
  - { label: "Banco Central — taxas de juros de operações de crédito", url: "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosMensalPorMes", reviewed: "2026-07-27" }
relatedGuideIds: [tr-balance, compare-proposals, bank-payment-difference]
---
<h2>O cenário</h2>

Ambas as variantes usam R$ 300 mil, 360 meses, SAC e a mediana BCB da modalidade pós-fixada em TR. A segunda repete a maior observação da série SGS 226 na janela anual.

<h2>Como interpretar</h2>

A diferença acumulada mostra sensibilidade à hipótese de correção. Não a leia como custo futuro garantido: substitua a série quando quiser explorar outro caminho.
