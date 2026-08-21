---
layout: layouts/guide.njk
contentKind: guide
contentId: bank-payment-difference
locale: pt-BR
order: 10
category: contracts
title: "Por que a parcela calculada pelo banco pode ser diferente"
description: "Reconcilie taxa, datas, seguros, tarifas, correção e arredondamento quando a prestação do contrato não coincide com a simulação."
tags: [parcela, contrato, seguros, datas, arredondamento]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: diagnostico, label: "Roteiro de diagnóstico" }
  - { id: reconciliacao, label: "Reconciliação numérica" }
  - { id: conferir, label: "O que conferir" }
contractNotes:
  - "MIP, DFI, tarifa de administração e outros encargos podem variar por idade, saldo, imóvel e mês."
  - "Primeiro vencimento irregular e convenções de dias podem produzir juros proporcionais."
limitations:
  - "O exemplo não tenta reproduzir a metodologia interna de uma instituição."
  - "Não inclui atraso, cobrança judicial, carência de obra ou alteração contratual."
sources:
  - { label: "Banco Central — Calculadora do Cidadão", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, cet, tr-balance, simulator-mistakes]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="diagnostico">Roteiro de diagnóstico</h2>

Comece pelas entradas, não pelo resultado. Confirme valor efetivamente financiado, prazo remanescente, sistema, taxa, natureza anual, data do primeiro vencimento e indexador. Depois separe a prestação financeira dos custos.

<div class="content-formula" role="math" aria-label="Diferença observada igual a correção mais seguros mais tarifas mais diferença de juros e arredondamento">diferença = correção + seguros + tarifas + datas + arredondamento</div>

<h2 id="reconciliacao">Reconciliação numérica</h2>

O exemplo mantém a dívida e os juros e adiciona R$ 150 de custo mensal. A prestação cresce, mas juros, amortização e saldo não mudam por causa desse custo.

{% scenarioModule "monthly-cost-impact", generatedPage %}

<h2 id="conferir">O que conferir</h2>

Use o demonstrativo do contrato para preencher uma linha por componente:

| Linha | Pergunta |
|---|---|
| Juros | A taxa e o período coincidem? |
| Correção | Qual observação e data foram usadas? |
| Amortização | O sistema e o saldo anterior coincidem? |
| Custos | Há MIP, DFI, tarifa ou serviço? |
| Ajustes | Existem centavos, pro rata ou atraso? |

Se a soma ainda não fechar, peça à instituição a memória de cálculo. Uma diferença não demonstra automaticamente erro do banco ou do simulador.
