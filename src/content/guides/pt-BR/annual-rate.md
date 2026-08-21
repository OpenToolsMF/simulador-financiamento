---
layout: layouts/guide.njk
contentKind: guide
contentId: annual-to-monthly-rate
locale: pt-BR
order: 7
category: rates
title: "Como converter taxa anual nominal e efetiva em taxa mensal"
description: "Diferencie taxa nominal de taxa efetiva e converta corretamente percentuais anuais para a periodicidade mensal."
tags: [taxa anual, taxa mensal, nominal, efetiva]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: []
toc:
  - { id: efetiva, label: "Taxa efetiva equivalente" }
  - { id: nominal, label: "Taxa nominal" }
  - { id: impacto, label: "Impacto nas parcelas" }
contractNotes:
  - "A proposta deve informar periodicidade e natureza da taxa; não presuma que todo percentual anual é efetivo."
  - "O CET anual inclui outros fluxos e não pode ser convertido como se fosse apenas a taxa de juros."
limitations:
  - "As fórmulas pressupõem capitalização mensal regular."
  - "Não tratam taxas diárias, dias úteis, carência ou fluxos irregulares."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [cet, bank-payment-difference, simulator-mistakes]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="efetiva">Taxa efetiva equivalente</h2>

Uma taxa anual efetiva de `iₐ` já incorpora a capitalização do ano. A taxa mensal equivalente é:

<div class="content-formula" role="math" aria-label="Taxa mensal equivalente igual a um mais a taxa anual elevado a um doze avos menos um">iₘ = (1 + iₐ)<sup>1/12</sup> − 1</div>

Para 12% ao ano efetivos, o resultado é aproximadamente 0,9489% ao mês — não 1%.

<h2 id="nominal">Taxa nominal</h2>

Quando 12% ao ano são declarados como **nominais com capitalização mensal**, divide-se por 12: `iₘ = 12% ÷ 12 = 1%`. Essa taxa mensal produz uma taxa efetiva anual de `(1,01¹² − 1)`, aproximadamente 12,6825%.

<h2 id="impacto">Impacto nas parcelas</h2>

O módulo aplica as duas interpretações ao mesmo principal e prazo. A diferença mensal parece pequena, mas se repete em centenas de parcelas.

{% scenarioModule "nominal-rate-example", generatedPage %}

No simulador, selecione o período e o tipo anual exatamente como constam na proposta. Se a origem só disser “12% a.a.”, falta informação para escolher a conversão com segurança.
