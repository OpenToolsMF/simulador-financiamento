---
layout: layouts/guide.njk
contentKind: guide
contentId: price-table
locale: es
order: 3
category: fundamentals
title: "Tabla Price: fórmula, ventajas y limitaciones"
description: "Calcule la cuota Price y entienda cómo cambian intereses y amortización dentro de una cuota financiera nivelada."
tags: [Price, cuota, fórmula, redondeo]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: formula, label: "Fórmula de la cuota" }
  - { id: evolucion, label: "Evolución calculada" }
  - { id: cuidados, label: "Ventajas y cuidados" }
contractNotes:
  - "La cuota total puede dejar de ser constante con corrección monetaria, seguros variables o recálculo contractual."
  - "Las entidades pueden usar convenciones de fecha y redondeo diferentes."
limitations:
  - "El cálculo supone períodos mensuales regulares y tasa constante."
  - "No incluye costos del CET, mora, carencia ni cambio de índice."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, sac-table, sac-or-price]
relatedSimulationIds: [price-300k-360]
---
<h2 id="formula">Fórmula de la cuota</h2>

En Price, una tasa periódica constante produce una cuota financiera nivelada. Para principal `PV`, tasa mensual `i` y plazo `n`:

<div class="content-formula" role="math" aria-label="Cuota igual al principal por la tasa dividido por uno menos uno más tasa elevado al plazo negativo">PMT = PV × i ÷ [1 − (1 + i)<sup>−n</sup>]</div>

Los intereses aún se calculan sobre el saldo. La amortización `Aₜ = PMT − Jₜ` comienza menor y crece.

<h2 id="evolucion">Evolución calculada</h2>

{% scenarioModule "price-300k-360", generatedPage %}

<h2 id="cuidados">Ventajas y cuidados</h2>

Una cuota financiera nivelada ayuda a visualizar el presupuesto sin índice ni costos variables. Como contrapartida, la amortización inicial es menor que en SAC con los mismos datos.

Redondear cada cuota acumula pequeñas diferencias. Este motor las liquida en la última; una entidad puede distribuirlas de otra forma.
