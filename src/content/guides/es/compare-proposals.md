---
layout: layouts/guide.njk
contentKind: guide
contentId: compare-proposals
locale: es
order: 10
category: contracts
title: "Cómo comparar dos propuestas de financiación inmobiliaria"
description: "Cree un cuadro para tasa, CET, índice, costos, primera cuota y total estimado de dos propuestas."
tags: [propuestas, CET, índice, comparación]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb, tr]
toc:
  - { id: normalizar, label: "Normalice las propuestas" }
  - { id: cuadro, label: "Cuadro comparativo" }
  - { id: interpretar, label: "Interprete sin atajos" }
contractNotes:
  - "Propuesta y contrato pueden tener vigencia, aprobación y costos diferentes; compare documentos de la misma etapa."
  - "Índices, seguros y tarifas pueden cambiar y necesitan reglas explícitas."
limitations:
  - "El escenario usa propuestas hipotéticas y no recomienda entidad ni producto."
  - "Los totales futuros con TR repetida son estimaciones, no garantías."
sources:
  - { label: "Banco Central de Brasil — orientación sobre crédito y CET", url: "https://www.bcb.gov.br/meubc/faqs/p/cuidados-na-hora-de-contratar-uma-operacao-de-credito", reviewed: "2026-07-27" }
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [cet, tr-balance, sac-or-price]
relatedSimulationIds: [with-without-tr, sac-300k-360]
---
<h2 id="normalizar">Normalice las propuestas</h2>

Compare el mismo valor del inmueble, entrada, principal y plazo. Registre por separado intereses, tipo anual, sistema, índice, CET, seguros, tarifas, primer vencimiento y reglas de amortización.

<h2 id="cuadro">Cuadro comparativo</h2>

| Campo | Propuesta A | Propuesta B |
|---|---|---|
| Principal y plazo | iguales | iguales |
| Intereses | mediana prefijada BCB | mediana posfijada TR BCB |
| Corrección | ninguna | referencia TR repetida |
| Costo mensual hipotético | R$ 0 | R$ 120 |
| CET | consultar documento | consultar documento |

{% scenarioModule "proposal-comparison", generatedPage %}

<h2 id="interpretar">Interprete sin atajos</h2>

<div class="content-formula" role="math" aria-label="Costo comparable incluye cuotas, gastos iniciales y costos accesorios">costo comparable = cuotas + gastos iniciales + costos accesorios</div>

Una primera cuota menor puede venir con indexación, plazo mayor u otro cargo. El total estimado tampoco sustituye al CET.
