---
layout: layouts/guide.njk
contentKind: guide
contentId: financing-basics
locale: pt-BR
order: 1
category: fundamentals
title: "Como funcionam juros, amortização e saldo devedor"
description: "Veja como cada parcela se divide, por que os juros mudam e como o saldo devedor percorre um financiamento imobiliário."
tags: [juros, amortização, saldo devedor, parcelas]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: componentes, label: "Os três componentes" }
  - { id: exemplo, label: "Exemplo calculado" }
  - { id: leitura, label: "Como ler a evolução" }
contractNotes:
  - "O contrato pode corrigir o saldo por TR ou outro indexador antes de calcular juros e amortização."
  - "Seguros, tarifas e encargos mensais podem aparecer na prestação sem reduzir o saldo devedor."
limitations:
  - "O exemplo não inclui seguros MIP e DFI, tarifas, impostos, atraso ou renegociação."
  - "As datas reais podem alterar juros proporcionais; aqui os períodos são mensais regulares."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [sac-table, price-table, bank-payment-difference]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="componentes">Os três componentes</h2>

Os **juros** remuneram o capital ainda devido. A **amortização** é a parte que efetivamente reduz a dívida. O **saldo devedor** é o valor que resta depois de aplicar correção, juros e pagamentos previstos para o período.

<div class="content-formula" role="math" aria-label="Parcela igual a juros mais amortização mais custos">Parcela = juros + amortização + custos</div>

Se a taxa mensal for `i` e o saldo antes da parcela for `SD`, os juros básicos do mês são `J = SD × i`. Uma parcela maior não significa, por si só, que a dívida caiu mais: seguros e tarifas não amortizam o principal.

<h2 id="exemplo">Exemplo calculado</h2>

O módulo abaixo usa R$ 300 mil, 360 meses e a mediana vigente da modalidade imobiliária prefixada do BCB. A tabela mostra a primeira parcela, pontos intermediários e a última, todos calculados no build pelo mesmo motor do simulador.

{% scenarioModule "sac-300k-360", generatedPage %}

<h2 id="leitura">Como ler a evolução</h2>

Compare juros e amortização em diferentes meses. No SAC, a amortização programada permanece aproximadamente constante; como o saldo diminui, os juros e a parcela caem. O gráfico do saldo deve ser lido junto com a tabela: arredondamentos em centavos podem concentrar um pequeno ajuste na última parcela.

Ao conferir um demonstrativo do banco, separe sempre: saldo anterior, correção monetária, juros, amortização, custos e saldo final. Essa reconciliação evita atribuir a seguros ou atualização monetária uma diferença que pertence a outra linha.
