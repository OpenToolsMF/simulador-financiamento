---
layout: layouts/guide.njk
contentKind: guide
contentId: bank-payment-difference
locale: es
order: 10
category: contracts
title: "Por qué la cuota del banco puede ser diferente"
description: "Concilie tasa, fechas, seguros, tarifas, corrección y redondeo cuando la cuota contractual no coincide con la simulación."
tags: [cuota, contrato, seguros, fechas, redondeo]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: diagnostico, label: "Secuencia de diagnóstico" }
  - { id: conciliacion, label: "Conciliación numérica" }
  - { id: verificar, label: "Qué verificar" }
contractNotes:
  - "MIP, DFI, tarifa administrativa y otros cargos pueden variar con edad, saldo, inmueble y mes."
  - "Un primer vencimiento irregular y las convenciones de días pueden generar intereses proporcionales."
limitations:
  - "El ejemplo no reproduce la metodología interna de una entidad."
  - "Excluye mora, litigio, carencia de obra y modificaciones contractuales."
sources:
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [financing-basics, cet, tr-balance, simulator-mistakes]
relatedSimulationIds: [sac-300k-360]
---
<h2 id="diagnostico">Secuencia de diagnóstico</h2>

Empiece por principal, plazo restante, sistema, tasa, tipo anual, primer vencimiento e índice. Después separe la cuota financiera de los costos.

<div class="content-formula" role="math" aria-label="Diferencia igual a corrección más seguros más tarifas más efectos de fechas y redondeo">diferencia = corrección + seguros + tarifas + fechas + redondeo</div>

<h2 id="conciliacion">Conciliación numérica</h2>

El ejemplo mantiene deuda e intereses y suma R$ 150 mensuales. La cuota aumenta, pero ese costo no altera intereses, amortización ni saldo.

{% scenarioModule "monthly-cost-impact", generatedPage %}

<h2 id="verificar">Qué verificar</h2>

| Línea | Pregunta |
|---|---|
| Intereses | ¿Coinciden tasa y período? |
| Corrección | ¿Qué observación y fecha se usaron? |
| Amortización | ¿Coinciden sistema y saldo anterior? |
| Costos | ¿Hay MIP, DFI o tarifas? |

Si todavía no concilia, solicite la memoria de cálculo. Una diferencia no prueba por sí sola que exista un error.
