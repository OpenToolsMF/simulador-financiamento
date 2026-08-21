---
layout: layouts/guide.njk
contentKind: guide
contentId: fgts-amortization
locale: es
order: 12
category: amortization
title: "Cómo simular una amortización con FGTS"
description: "Modele FGTS como amortización extraordinaria y compare plazo y cuota sin confundir simulación con elegibilidad."
tags: [FGTS, amortización, plazo, cuota]
published: "2026-07-27"
updated: "2026-07-27"
dataDependencies: [bcb]
toc:
  - { id: modelo, label: "Cómo modelarlo" }
  - { id: ejemplo, label: "Ejemplo con R$ 20 mil" }
  - { id: elegibilidad, label: "Elegibilidad fuera del alcance" }
contractNotes:
  - "CAIXA publica opciones y requisitos; la institución operadora confirma elegibilidad, intervalos y documentos."
  - "El importe liberado y la fecha efectiva pueden diferir del saldo informado."
limitations:
  - "El simulador no verifica reglas laborales, del inmueble, intervalos o documentación FGTS."
  - "El aporte se trata como dinero aplicado íntegramente al saldo en el mes elegido."
sources:
  - { label: "CAIXA — preguntas frecuentes de contratos habitacionales", url: "https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-contrato/Paginas/default.aspx", reviewed: "2026-07-27" }
  - { label: "Banco Central de Brasil — Calculadora del Ciudadano", url: "https://www.bcb.gov.br/meubc/calculadoradocidadao", reviewed: "2026-07-27" }
relatedGuideIds: [term-or-payment, financing-basics, simulator-mistakes]
relatedSimulationIds: [extra-20k-year-five, term-vs-payment]
---
<h2 id="modelo">Cómo modelarlo</h2>

Registre el importe que podría liberarse, el mes de procesamiento y el objetivo. Cree una amortización única:

<div class="content-formula" role="math" aria-label="Nuevo saldo igual al saldo del mes menos el valor FGTS">nuevo saldo = saldo del mes − valor FGTS</div>

Esto responde solo qué pasaría con el flujo si ese importe entrara en ese mes.

<h2 id="ejemplo">Ejemplo con R$ 20 mil</h2>

{% scenarioModule "term-vs-payment", generatedPage %}

<h2 id="elegibilidad">Elegibilidad fuera del alcance</h2>

Consulte la orientación actual y la entidad responsable. Los requisitos personales, del inmueble y del contrato, los intervalos y usos permitidos no se calculan aquí.

Después del procesamiento real, reemplace el escenario por el nuevo saldo y plazo del extracto.
