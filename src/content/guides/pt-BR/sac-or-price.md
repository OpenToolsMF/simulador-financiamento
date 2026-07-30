---
layout: layouts/guide.njk
contentKind: guide
contentId: sac-or-price
locale: pt-BR
order: 4
category: fundamentals
title: "SAC ou Price: comparação com o mesmo financiamento"
description: "Compare SAC e Price lado a lado mantendo exatamente o mesmo valor, prazo e taxa de juros."
tags: [SAC, Price, comparação, custo total]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: comparacao-justa, label: "Como comparar de forma justa" }
  - { id: resultados, label: "Resultados lado a lado" }
  - { id: escolha, label: "Como interpretar" }
contractNotes:
  - "Propostas reais raramente diferem apenas pelo sistema; confirme taxa, CET, indexador, seguros e prazo."
  - "Alguns contratos chamados Price têm atualização monetária ou encargos que alteram a parcela total."
limitations:
  - "O resultado não indica qual sistema é adequado a uma pessoa nem prevê renda futura."
  - "Não inclui correção, custos acessórios, impostos ou condições de aprovação."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [sac-table, price-table, compare-proposals]
relatedSimulationIds: [sac-300k-360, price-300k-360]
---
<h2 id="comparacao-justa">Como comparar de forma justa</h2>

Trocar ao mesmo tempo sistema, taxa e prazo impede descobrir o que causou a diferença. A comparação abaixo fixa `PV = R$ 300.000`, `n = 360` e a mesma taxa BCB. Só o método de amortização muda.

| Aspecto | SAC | Price |
|---|---|---|
| Amortização inicial | Maior e aproximadamente constante | Menor e crescente |
| Parcela financeira | Decrescente | Nivelada sem correção |
| Saldo no início | Cai mais depressa | Cai mais devagar |

<h2 id="resultados">Resultados lado a lado</h2>

{% scenarioModule "sac-vs-price", generatedPage %}

<h2 id="escolha">Como interpretar</h2>

No SAC, a primeira parcela tende a ser maior e os juros totais menores porque o principal cai mais cedo. Na Price, a parcela inicial tende a ser menor, mas o saldo permanece maior durante mais tempo. A diferença exata depende da taxa e do prazo — por isso os números são derivados, não escritos na prosa.

Uma decisão de contratação exige comparar o CET, o indexador, os custos e as regras de amortização antecipada. Este quadro isola apenas a mecânica matemática.
