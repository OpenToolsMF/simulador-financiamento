'use strict';

const locales = ['pt-BR', 'en', 'es'];

const roots = {
  hub: {
    'pt-BR': '/guias/',
    en: '/en/guides/',
    es: '/es/guias/',
  },
  guide: {
    'pt-BR': '/guias/',
    en: '/en/guides/',
    es: '/es/guias/',
  },
  simulation: {
    'pt-BR': '/guias/simulacoes/',
    en: '/en/guides/examples/',
    es: '/es/guias/simulaciones/',
  },
};

const guides = [
  {
    id: 'financing-basics',
    category: 'fundamentals',
    order: 1,
    slugs: {
      'pt-BR': 'juros-amortizacao-saldo-devedor',
      en: 'interest-amortization-balance',
      es: 'intereses-amortizacion-saldo',
    },
  },
  {
    id: 'sac-table',
    category: 'fundamentals',
    order: 2,
    slugs: { 'pt-BR': 'tabela-sac', en: 'sac-table', es: 'tabla-sac' },
  },
  {
    id: 'price-table',
    category: 'fundamentals',
    order: 3,
    slugs: { 'pt-BR': 'tabela-price', en: 'price-table', es: 'tabla-price' },
  },
  {
    id: 'sac-or-price',
    category: 'fundamentals',
    order: 4,
    slugs: { 'pt-BR': 'sac-ou-price', en: 'sac-or-price', es: 'sac-o-price' },
  },
  {
    id: 'term-or-payment',
    category: 'amortization',
    order: 5,
    slugs: {
      'pt-BR': 'amortizar-prazo-ou-parcela',
      en: 'reduce-term-or-payment',
      es: 'reducir-plazo-o-cuota',
    },
  },
  {
    id: 'best-amortization-day',
    category: 'amortization',
    order: 6,
    slugs: {
      'pt-BR': 'melhor-dia-amortizar-financiamento',
      en: 'best-day-to-make-an-extra-payment',
      es: 'mejor-dia-para-amortizar-financiacion',
    },
  },
  {
    id: 'annual-to-monthly-rate',
    category: 'rates',
    order: 7,
    slugs: {
      'pt-BR': 'converter-taxa-anual-em-mensal',
      en: 'convert-annual-rate-to-monthly',
      es: 'convertir-tasa-anual-a-mensual',
    },
  },
  {
    id: 'cet',
    category: 'rates',
    order: 8,
    slugs: {
      'pt-BR': 'custo-efetivo-total-cet',
      en: 'total-effective-cost-cet',
      es: 'costo-efectivo-total-cet',
    },
  },
  {
    id: 'tr-balance',
    category: 'rates',
    order: 9,
    slugs: {
      'pt-BR': 'tr-no-saldo-devedor',
      en: 'tr-on-outstanding-balance',
      es: 'tr-en-el-saldo-pendiente',
    },
  },
  {
    id: 'bank-payment-difference',
    category: 'contracts',
    order: 10,
    slugs: {
      'pt-BR': 'parcela-do-banco-diferente',
      en: 'why-bank-payment-differs',
      es: 'por-que-la-cuota-del-banco-es-diferente',
    },
  },
  {
    id: 'compare-proposals',
    category: 'contracts',
    order: 11,
    slugs: {
      'pt-BR': 'comparar-propostas-financiamento-imobiliario',
      en: 'compare-mortgage-proposals',
      es: 'comparar-propuestas-financiacion-inmobiliaria',
    },
  },
  {
    id: 'fgts-amortization',
    category: 'amortization',
    order: 12,
    slugs: {
      'pt-BR': 'simular-amortizacao-fgts',
      en: 'simulate-fgts-amortization',
      es: 'simular-amortizacion-fgts',
    },
  },
  {
    id: 'simulator-mistakes',
    category: 'contracts',
    order: 13,
    slugs: {
      'pt-BR': 'erros-comuns-simulador-financiamento',
      en: 'common-financing-simulator-mistakes',
      es: 'errores-comunes-simulador-financiacion',
    },
  },
];

const simulations = [
  {
    id: 'sac-300k-360',
    order: 1,
    slugs: {
      'pt-BR': '300-mil-360-meses-sac',
      en: '300-thousand-360-months-sac',
      es: '300-mil-360-meses-sac',
    },
  },
  {
    id: 'price-300k-360',
    order: 2,
    slugs: {
      'pt-BR': '300-mil-360-meses-price',
      en: '300-thousand-360-months-price',
      es: '300-mil-360-meses-price',
    },
  },
  {
    id: 'extra-20k-year-five',
    order: 3,
    slugs: {
      'pt-BR': 'amortizar-20-mil-quinto-ano',
      en: 'amortize-20-thousand-fifth-year',
      es: 'amortizar-20-mil-quinto-ano',
    },
  },
  {
    id: 'monthly-extra-500',
    order: 4,
    slugs: {
      'pt-BR': 'amortizacao-mensal-500',
      en: '500-monthly-amortization',
      es: 'amortizacion-mensual-500',
    },
  },
  {
    id: 'term-vs-payment',
    order: 5,
    slugs: {
      'pt-BR': 'reduzir-prazo-ou-parcela',
      en: 'reduce-term-or-payment',
      es: 'reducir-plazo-o-cuota',
    },
  },
  {
    id: 'with-without-tr',
    order: 6,
    slugs: {
      'pt-BR': 'com-e-sem-tr',
      en: 'with-and-without-tr',
      es: 'con-y-sin-tr',
    },
  },
];

const guideById = Object.fromEntries(guides.map((guide) => [guide.id, guide]));
const simulationById = Object.fromEntries(simulations.map((simulation) => [simulation.id, simulation]));

function entryFor(kind, id) {
  const entry = kind === 'guide' ? guideById[id] : simulationById[id];
  if (!entry) throw new Error(`Unknown ${kind} content id: ${id}`);
  return entry;
}

function publicPathFor(kind, id, locale) {
  const entry = entryFor(kind, id);
  if (!locales.includes(locale)) throw new Error(`Unknown content locale: ${locale}`);
  return `${roots[kind][locale]}${entry.slugs[locale]}/`;
}

function outputPathFor(kind, id, locale) {
  return `${publicPathFor(kind, id, locale).slice(1)}index.html`;
}

function alternatesFor(kind, id) {
  return locales.map((locale) => ({
    locale,
    publicPath: publicPathFor(kind, id, locale),
  }));
}

function itemPublicPaths(locale) {
  return [
    ...guides.map((guide) => publicPathFor('guide', guide.id, locale)),
    ...simulations.map((simulation) => publicPathFor('simulation', simulation.id, locale)),
  ];
}

module.exports = {
  locales,
  roots,
  guides,
  simulations,
  guideById,
  simulationById,
  publicPathFor,
  outputPathFor,
  alternatesFor,
  itemPublicPaths,
};
