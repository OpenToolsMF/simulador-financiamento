---
layout: layouts/guide.njk
contentKind: guide
contentId: fgts-amortization
locale: pt-BR
order: 11
category: amortization
title: "Como simular uma amortização com FGTS"
description: "Modele o FGTS como uma amortização extraordinária e compare reduzir prazo e parcela sem confundir simulação com elegibilidade."
tags: [FGTS, amortização, prazo, parcela]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: modelo, label: "Como modelar" }
  - { id: exemplo, label: "Exemplo com R$ 20 mil" }
  - { id: elegibilidade, label: "Elegibilidade fica fora" }
contractNotes:
  - "A CAIXA publica opções e requisitos de uso; a instituição operadora deve confirmar elegibilidade, intervalo e documentação."
  - "O valor liberado e a data efetiva podem diferir do saldo informado pelo trabalhador."
limitations:
  - "O simulador não verifica regras do FGTS, vínculo, imóvel, intervalo de uso ou documentação."
  - "O aporte é tratado como dinheiro aplicado integralmente ao saldo no mês escolhido."
sources:
  - { label: "CAIXA — perguntas frequentes de contratos habitacionais", url: "https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-contrato/Paginas/default.aspx", reviewed: "2026-07-27" }
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [term-or-payment, financing-basics, simulator-mistakes]
relatedSimulationIds: [extra-20k-year-five, term-vs-payment]
---
<h2 id="modelo">Como modelar</h2>

Para estudar o efeito financeiro, registre o valor que seria liberado, o mês de processamento e o objetivo. No simulador, crie uma amortização única:

<div class="content-formula" role="math" aria-label="Novo saldo igual ao saldo do mês menos o valor usado do FGTS">novo saldo = saldo do mês − valor do FGTS</div>

Essa representação não transforma o simulador em verificador de regras. Ela responde apenas “o que aconteceria com o fluxo se esse valor entrasse neste mês?”.

<h2 id="exemplo">Exemplo com R$ 20 mil</h2>

O cenário usa um SAC de R$ 300 mil e aplica R$ 20 mil no mês 60. As duas variantes isolam reduzir prazo e reduzir parcela.

{% scenarioModule "term-vs-payment", generatedPage %}

<h2 id="elegibilidade">Elegibilidade fica fora</h2>

Consulte a orientação atual e a instituição responsável antes de planejar a operação. Requisitos pessoais, do imóvel e do contrato, intervalos mínimos e modalidades permitidas não são calculados aqui.

Depois do processamento real, substitua o cenário pelo saldo e prazo do novo demonstrativo; não continue usando a projeção antiga como se fosse o contrato atualizado.
