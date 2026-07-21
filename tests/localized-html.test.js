'use strict';

const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const i18n = require('../assets/js/i18n.js');

const projectRoot = join(__dirname, '..');

function normalizeHtmlText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBody(html) {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  assert.ok(match, 'documento possui body');
  return match[1];
}

function extractJsonLdNodes(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const block = JSON.parse(match[1]);
      return block['@graph'] ?? [block];
    });
}

function extractVisibleFaq(html) {
  return [...html.matchAll(/<details\b[^>]*data-faq-item[^>]*>([\s\S]*?)<\/details>/gi)]
    .map((match) => ({
      question: normalizeHtmlText(
        match[1].match(/<summary\b[^>]*data-faq-question[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ?? '',
      ),
      answer: normalizeHtmlText(
        match[1].match(/<p\b[^>]*data-faq-answer[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '',
      ),
    }));
}

function extractDataI18nEntries(html) {
  return [...html.matchAll(/<([a-z][\w-]*)\b[^>]*\bdata-i18n=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((match) => ({
      key: match[2],
      text: normalizeHtmlText(match[3]),
    }));
}

function assertSelectedLanguage(html, language, file) {
  const selectedOptions = [...html.matchAll(/<option\b[^>]*\bvalue=["']([^"']+)["'][^>]*\bselected\b[^>]*>/gi)]
    .map((match) => match[1]);
  assert.deepEqual(selectedOptions, [language], `${file}: somente o idioma da rota est\u00e1 selecionado`);
}

const simulatorTextKeys = [
  'language.label',
  'language.pt-BR',
  'language.en',
  'language.es',
  'header.eyebrow',
  'header.title',
  'header.lead',
  'config.kicker',
  'config.title',
  'config.reset',
  'privacyNotice.title',
  'privacyNotice.text',
  'footer.copyright',
  'footer.about',
  'footer.contact',
  'footer.privacy',
  'form.financedValue',
  'form.term',
  'form.interestRate',
  'form.ratePeriod',
  'form.annualRateType',
  'form.monthlyExtraCost',
  'form.monthlyExtraCostHelp',
  'form.correctionMode',
  'form.monthlyCorrectionRate',
  'form.useTr12m',
  'form.viewTr',
  'form.monthlyCorrectionHelp',
  'form.firstDueDate',
  'form.system',
  'form.customSeries',
  'form.customSeriesHelp',
  'option.rateAnnual',
  'option.rateMonthly',
  'option.annualEffective',
  'option.annualNominal',
  'option.correctionFixed',
  'option.correctionCustom',
  'option.correctionNone',
  'option.systemSac',
  'option.systemPrice',
  'extras.kicker',
  'extras.title',
  'extras.description',
  'extras.add',
  'extras.empty',
  'extras.cardTitle',
  'extras.remove',
  'extras.type',
  'extras.value',
  'extras.month',
  'extras.startMonth',
  'extras.frequency',
  'extras.customFrequency',
  'extras.endMonth',
  'extras.goal',
  'extras.typeSingle',
  'extras.typeRecurring',
  'extras.frequency1',
  'extras.frequency2',
  'extras.frequency3',
  'extras.frequency6',
  'extras.frequency12',
  'extras.frequencyCustom',
  'extras.goalTerm',
  'extras.goalPayment',
  'results.kicker',
  'results.title',
  'results.exportPdf',
  'results.exportCsv',
  'results.exportCsvFormatted',
  'results.exportCsvRaw',
  'results.projectionNote',
  'summary.detailsTitle',
  'summary.value',
  'charts.kicker',
  'charts.title',
  'charts.debtTitle',
  'charts.paymentTitle',
  'charts.compositionTitle',
  'charts.costsTitle',
  'comparison.kicker',
  'comparison.title',
  'comparison.indicator',
  'comparison.withoutExtras',
  'comparison.withExtras',
  'comparison.difference',
  'installments.kicker',
  'installments.title',
  'installments.emptyPrompt',
  'installments.show',
  'installments.filterAll',
  'installments.filterExtras',
  'installments.goTo',
  'installments.go',
  'installments.pageSize',
  'installments.pageSizeAll',
  'installments.previous',
  'installments.next',
  'installments.col.number',
  'installments.col.date',
  'installments.col.openingBalance',
  'installments.col.correctionRate',
  'installments.col.correction',
  'installments.col.correctedBalance',
  'installments.col.interest',
  'installments.col.regularAmortization',
  'installments.col.regularPayment',
  'installments.col.extraPayment',
  'installments.col.monthlyExtraCosts',
  'installments.col.totalPayment',
  'installments.col.closingBalance',
  'installments.col.extraGoal',
  'notice.strong',
  'notice.text',
  'print.brandTitle',
  'print.parametersKicker',
  'print.parametersTitle',
  'modal.title',
  'modal.sacTitle',
  'modal.sacBody',
  'modal.priceTitle',
  'modal.priceBody',
  'modal.note',
  'modal.ok',
  'unit.months',
];

const simulatorAttributeKeys = [
  'language.label',
  'privacyNotice.dismissAria',
  'form.trInfoDefault',
  'form.trInfoAria',
  'form.systemInfoAria',
  'charts.debtAria',
  'charts.paymentAria',
  'charts.compositionAria',
  'charts.costsAria',
  'installments.tableAria',
  'installments.paginationAria',
  'installments.regularAmortizationTitle',
  'notice.aria',
  'print.reportHeaderLabel',
  'modal.close',
];

const portugueseSentinels = [
  'Dados do financiamento',
  'Sua simula\u00e7\u00e3o \u00e9 privada.',
  'Valor financiado',
  'Taxa de juros',
  'Corre\u00e7\u00e3o monet\u00e1ria',
  'Amortiza\u00e7\u00f5es extras',
  'Resumo da simula\u00e7\u00e3o',
  'Perguntas frequentes',
  'Pol\u00edtica de Privacidade',
  'Sobre o Mapa das Parcelas',
  'Fale conosco',
];

(async () => {
  const defaultPages = [
    { file: 'index.html', language: 'pt-BR' },
    { file: 'privacidade.html', language: 'pt-BR' },
    { file: 'sobre/index.html', language: 'pt-BR' },
    { file: 'fale-conosco/index.html', language: 'pt-BR' },
  ];
  for (const { file, language } of defaultPages) {
    const html = await readFile(join(projectRoot, file), 'utf8');
    assertSelectedLanguage(extractBody(html), language, file);
  }

  const simulatorPages = [
    { file: 'en/index.html', language: 'en' },
    { file: 'es/index.html', language: 'es' },
  ];

  for (const { file, language } of simulatorPages) {
    const html = await readFile(join(projectRoot, file), 'utf8');
    const bodyHtml = extractBody(html);
    const visibleText = normalizeHtmlText(bodyHtml);
    const dictionary = i18n.dictionaries[language];

    assertSelectedLanguage(bodyHtml, language, file);
    for (const key of simulatorTextKeys) {
      assert.ok(
        visibleText.includes(normalizeHtmlText(dictionary[key])),
        `${file}: pr\u00e9-renderiza ${key}`,
      );
    }
    for (const key of simulatorAttributeKeys) {
      assert.ok(bodyHtml.includes(dictionary[key]), `${file}: pr\u00e9-renderiza atributo ${key}`);
    }
    for (const sentinel of portugueseSentinels) {
      assert.ok(!visibleText.includes(sentinel), `${file}: n\u00e3o mant\u00e9 fallback em portugu\u00eas (${sentinel})`);
    }

    const expectedFaq = Array.from({ length: 9 }, (_, index) => ({
      question: dictionary[`faq.${index + 1}.question`],
      answer: dictionary[`faq.${index + 1}.answer`],
    }));
    assert.deepEqual(extractVisibleFaq(bodyHtml), expectedFaq, `${file}: FAQ vis\u00edvel corresponde ao dicion\u00e1rio`);

    const faqSchema = extractJsonLdNodes(html).find((node) => node['@type'] === 'FAQPage');
    assert.ok(faqSchema, `${file}: possui FAQPage`);
    assert.deepEqual(
      faqSchema.mainEntity.map((item) => ({
        question: item.name,
        answer: item.acceptedAnswer?.text,
      })),
      expectedFaq,
      `${file}: FAQ vis\u00edvel e JSON-LD usam a mesma tradu\u00e7\u00e3o`,
    );
  }

  const institutionalPages = [
    { file: 'en/privacy.html', language: 'en', minimumEntries: 35 },
    { file: 'es/privacidad.html', language: 'es', minimumEntries: 35 },
    { file: 'en/about/index.html', language: 'en', minimumEntries: 18 },
    { file: 'es/acerca-de/index.html', language: 'es', minimumEntries: 18 },
    { file: 'en/contact/index.html', language: 'en', minimumEntries: 14 },
    { file: 'es/contacto/index.html', language: 'es', minimumEntries: 14 },
  ];

  for (const { file, language, minimumEntries } of institutionalPages) {
    const html = await readFile(join(projectRoot, file), 'utf8');
    const bodyHtml = extractBody(html);
    const dictionary = i18n.dictionaries[language];
    const entries = extractDataI18nEntries(bodyHtml);

    assertSelectedLanguage(bodyHtml, language, file);
    assert.ok(entries.length >= minimumEntries, `${file}: possui cobertura i18n do corpo`);
    for (const { key, text } of entries) {
      assert.equal(text, dictionary[key], `${file}: pr\u00e9-renderiza ${key}`);
    }

    const ariaTags = [...bodyHtml.matchAll(/<[^>]+\bdata-i18n-aria-label=["']([^"']+)["'][^>]*>/gi)];
    for (const match of ariaTags) {
      const ariaLabel = match[0].match(/\baria-label=["']([^"']+)["']/i)?.[1];
      assert.equal(ariaLabel, dictionary[match[1]], `${file}: pr\u00e9-renderiza aria-label ${match[1]}`);
    }
    for (const sentinel of portugueseSentinels) {
      assert.ok(!normalizeHtmlText(bodyHtml).includes(sentinel), `${file}: n\u00e3o mant\u00e9 ${sentinel}`);
    }
  }

  console.log('Testes de HTML localizado conclu\u00eddos com sucesso.');
})();
