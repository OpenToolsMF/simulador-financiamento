---
layout: layouts/guide.njk
contentKind: guide
contentId: tr-balance
locale: pt-BR
order: 9
category: rates
title: "Como a TR altera o saldo devedor do financiamento"
description: "Compare o mesmo financiamento com e sem correção pela TR e entenda a hipótese conservadora usada pelo simulador."
tags: [TR, correção monetária, saldo devedor, SGS 226]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
toc:
  - { id: aplicacao, label: "Como a correção entra" }
  - { id: referencia, label: "Referência oficial usada" }
  - { id: comparacao, label: "Com e sem TR" }
contractNotes:
  - "Contratos podem aplicar a TR por aniversário, datas e critérios próprios; confirme a cláusula e o demonstrativo."
  - "A correção pode ocorrer antes dos juros e da amortização, alterando cada etapa do saldo."
limitations:
  - "O cenário repete como taxa mensal fixa a maior observação da janela anual; isso não é previsão da TR."
  - "Não reproduz datas de aniversário, defasagem, pro rata, mudança futura nem regras específicas do contrato."
sources:
  - { label: "Banco Central — série SGS 226 da TR", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/12?formato=json", reviewed: "2026-07-27" }
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, bank-payment-difference, compare-proposals]
relatedSimulationIds: [with-without-tr]
---
<h2 id="aplicacao">Como a correção entra</h2>

Em um modelo simplificado, o indexador atualiza o saldo antes do restante do cálculo:

<div class="content-formula" role="math" aria-label="Saldo corrigido igual ao saldo anterior multiplicado por um mais a taxa referencial">SD corrigido = SD anterior × (1 + TR do período)</div>

Isso significa que a TR não é simplesmente somada à taxa de juros. Ela modifica a base sobre a qual juros e amortização serão processados.

<h2 id="referencia">Referência oficial usada</h2>

O build lê a série oficial SGS 226, guarda início, fim e taxa de cada observação e seleciona a maior taxa na janela móvel de doze meses. Para uma estimativa conservadora, o simulador repete esse percentual em todos os meses e identifica o período selecionado no módulo.

<h2 id="comparacao">Com e sem TR</h2>

As duas variantes mantêm valor, prazo, SAC e mediana BCB pós-fixada em TR. Só a correção muda.

{% scenarioModule "with-without-tr", generatedPage %}

O gráfico evidencia a acumulação da hipótese. Ele não deve ser interpretado como trajetória provável: a TR real varia e cada contrato determina como as observações chegam ao saldo.
