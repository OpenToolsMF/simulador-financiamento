'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const i18n = require('../../assets/js/i18n.js');
const contentRegistry = require('./contentRegistry.cjs');
const scenariosData = require('./scenarios.cjs');

const domain = readFileSync(join(__dirname, '..', '..', 'CNAME'), 'utf8').trim();
const origin = `https://${domain}`;
const locales = ['pt-BR', 'en', 'es'];
const publicRoutes = i18n.publicRoutes;
const dictionaries = i18n.dictionaries;
const languageConfig = i18n.languageConfig;
const guidesLastmod = [
  '2026-08-12',
  scenariosData.references.bcb.generatedAt.slice(0, 10),
  scenariosData.references.tr.generatedAt.slice(0, 10),
].sort().at(-1);

const pageDefinitions = {
  simulator: {
    bodyClass: '',
    headerKeys: ['header.eyebrow', 'header.title', 'header.lead'],
    headerPadding: 'py-4 py-lg-5',
    metadataPrefix: 'metadata',
    lastmod: '2026-08-21',
    styleVersion: '20260821-ordered-extras',
    footerClass: ' no-print',
    scripts: [
      'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
      'assets/js/i18n.js?v=20260821-ordered-extras',
      'assets/js/finance.js?v=20260821-ordered-extras',
      'assets/js/simulation-state.js?v=20260821-ordered-extras',
      'assets/js/chart-data.js?v=20260811-shared-chart-axis',
      'assets/js/app.js?v=20260821-ordered-extras',
    ],
    adsense: true,
    footerInContent: true,
  },
  comparison: {
    bodyClass: '',
    headerKeys: ['comparison.header.eyebrow', 'comparison.header.title', 'comparison.header.lead'],
    headerPadding: 'py-4 py-lg-5',
    metadataPrefix: 'comparison.metadata',
    lastmod: '2026-07-23',
    styleVersion: '20260727-guides',
    footerClass: '',
    scripts: [
      'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
      'assets/js/i18n.js?v=20260821-ordered-extras',
      'assets/js/finance.js?v=20260821-ordered-extras',
      'assets/js/comparison.js?v=20260724-comparison-charts',
    ],
    adsense: true,
  },
  guides: {
    bodyClass: 'content-index-body',
    headerKeys: ['guides.header.eyebrow', 'guides.header.title', 'guides.header.lead'],
    headerPadding: 'py-4 py-lg-5',
    metadataPrefix: 'guides.metadata',
    lastmod: guidesLastmod,
    styleVersion: '20260812-amortization-timing',
    footerClass: '',
    scripts: [
      'assets/js/i18n.js?v=20260727-guides',
      'assets/js/static-content.js?v=20260727-guides',
      'assets/js/content-index.js?v=20260727-guides',
    ],
    adsense: true,
    staticContent: true,
  },
  about: {
    bodyClass: 'privacy-page-body',
    headerKeys: ['about.header.eyebrow', 'about.header.title', 'about.header.lead'],
    headerPadding: 'py-4',
    metadataPrefix: 'about.metadata',
    lastmod: '2026-07-20',
    styleVersion: '20260720-institutional-pages',
    footerClass: '',
    scripts: [
      'assets/js/i18n.js?v=20260721-bcb-rates-annual',
      'assets/js/privacy.js?v=20260720-institutional-pages',
    ],
    institutional: true,
  },
  contact: {
    bodyClass: 'privacy-page-body',
    headerKeys: ['contact.header.eyebrow', 'contact.header.title', 'contact.header.lead'],
    headerPadding: 'py-4',
    metadataPrefix: 'contact.metadata',
    lastmod: '2026-07-20',
    styleVersion: '20260720-institutional-pages',
    footerClass: '',
    scripts: [
      'assets/js/i18n.js?v=20260721-bcb-rates-annual',
      'assets/js/privacy.js?v=20260720-institutional-pages',
    ],
    institutional: true,
  },
  privacy: {
    bodyClass: 'privacy-page-body',
    headerKeys: ['privacy.header.eyebrow', 'privacy.header.title', 'privacy.header.lead'],
    headerPadding: 'py-4',
    metadataPrefix: 'privacy.metadata',
    lastmod: '2026-07-27',
    styleVersion: '20260727-guides',
    footerClass: '',
    scripts: [
      'assets/js/i18n.js?v=20260727-guides',
      'assets/js/privacy.js?v=20260720-institutional-pages',
    ],
    institutional: true,
  },
};

function outputPathForPublicPath(publicPath) {
  if (publicPath === '/') return 'index.html';
  if (publicPath.endsWith('/')) return `${publicPath.slice(1)}index.html`;
  return publicPath.slice(1);
}

const pages = Object.entries(pageDefinitions).flatMap(([pageKey, definition]) => (
  locales.map((locale) => ({
    ...definition,
    pageKey,
    locale,
    htmlLang: languageConfig[locale].htmlLang,
    ogLocale: languageConfig[locale].locale.replace('-', '_'),
    publicPath: publicRoutes[pageKey][locale],
    outputPath: outputPathForPublicPath(publicRoutes[pageKey][locale]),
    titleKey: `${definition.metadataPrefix}.title`,
    descriptionKey: `${definition.metadataPrefix}.description`,
    title: translated(locale, `${definition.metadataPrefix}.title`),
    description: translated(locale, `${definition.metadataPrefix}.description`),
    headerEyebrow: translated(locale, definition.headerKeys[0]),
    headerTitle: translated(locale, definition.headerKeys[1]),
    headerLead: translated(locale, definition.headerKeys[2]),
    ogType: 'website',
    alternates: locales.map((alternateLocale) => ({
      locale: alternateLocale,
      publicPath: publicRoutes[pageKey][alternateLocale],
    })),
  }))
));

const pageGroups = Object.fromEntries(
  Object.keys(pageDefinitions).map((pageKey) => [
    pageKey,
    pages.filter((page) => page.pageKey === pageKey),
  ]),
);

const localizedSchema = {
  'pt-BR': {
    imageAlt: 'Logo do Mapa das Parcelas',
    footerAria: 'Links institucionais',
    operatingSystem: 'Qualquer sistema com navegador moderno',
    comparisonOperatingSystem: 'Qualquer sistema com navegador moderno',
    comparisonNoticeText: 'Esta ferramenta apresenta apenas uma simulação estimativa, sem validade jurídica, contratual ou financeira. Os resultados dependem exclusivamente dos dados informados e das premissas adotadas, como taxa fixa, períodos mensais, correção monetária projetada e custos extras preenchidos pelo usuário. A simulação não representa proposta de crédito, aprovação, oferta vinculante, recomendação financeira, consultoria jurídica ou as condições efetivamente praticadas por instituições financeiras. Para contratar ou comparar uma operação real, consulte o contrato, o Custo Efetivo Total (CET), tributos, tarifas, seguros, índices de correção e demais condições oficiais fornecidas pela instituição responsável.',
    browserRequirements: 'Requer JavaScript e um navegador moderno.',
    featureList: [
      'Simulação pelos sistemas SAC e Price',
      'Amortizações extras pontuais e recorrentes',
      'Correção monetária fixa ou personalizada',
      'Comparação de cenários',
      'Gráficos e cronograma de parcelas',
      'Exportação do relatório em PDF',
    ],
  },
  en: {
    imageAlt: 'Installment Map logo',
    footerAria: 'Institutional links',
    operatingSystem: 'Any system with a modern browser',
    comparisonOperatingSystem: 'Any system with a modern browser',
    comparisonNoticeText: 'This tool provides only an estimated simulation, with no legal, contractual, or financial validity. Results depend exclusively on the data entered and assumptions adopted, such as fixed rate, monthly periods, projected monetary correction, and extra costs filled in by the user. The simulation does not represent a credit proposal, approval, binding offer, financial recommendation, legal advice, or the conditions actually practiced by financial institutions. To contract or compare a real operation, review the contract, total effective cost, taxes, fees, insurance, correction indexes, and other official conditions provided by the responsible institution.',
    browserRequirements: 'Requires JavaScript and a modern browser.',
    featureList: [
      'SAC and Price financing simulation',
      'One-time and recurring extra amortizations',
      'Fixed or custom monetary correction',
      'Scenario comparison',
      'Charts and installment schedule',
      'PDF report export',
    ],
  },
  es: {
    imageAlt: 'Logo de Mapa de cuotas',
    footerAria: 'Enlaces institucionales',
    operatingSystem: 'Cualquier sistema con un navegador moderno',
    comparisonOperatingSystem: 'Cualquier sistema con navegador moderno',
    comparisonNoticeText: 'Esta herramienta presenta solo una simulación estimativa, sin validez jurídica, contractual ni financiera. Los resultados dependen exclusivamente de los datos informados y de las premisas adoptadas, como tasa fija, períodos mensuales, corrección monetaria proyectada y costos extra completados por el usuario. La simulación no representa propuesta de crédito, aprobación, oferta vinculante, recomendación financiera, consultoría jurídica ni las condiciones efectivamente practicadas por instituciones financieras. Para contratar o comparar una operación real, consulta el contrato, el costo efectivo total, tributos, tarifas, seguros, índices de corrección y demás condiciones oficiales proporcionadas por la institución responsable.',
    browserRequirements: 'Requiere JavaScript y un navegador moderno.',
    featureList: [
      'Simulación de financiación SAC y Price',
      'Amortizaciones extra puntuales y recurrentes',
      'Corrección monetaria fija o personalizada',
      'Comparación de escenarios',
      'Gráficos y calendario de cuotas',
      'Exportación del informe en PDF',
    ],
  },
};

function translated(locale, key) {
  const value = dictionaries[locale]?.[key];
  if (value === undefined) throw new Error(`Missing translation: ${locale}.${key}`);
  return value;
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function websiteIdentity() {
  return {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: `${origin}/`,
    name: 'Mapa das Parcelas',
    alternateName: ['Installment Map', 'Mapa de cuotas'],
    inLanguage: locales,
  };
}

function localizedApplicationNames(locale) {
  const names = locales.map((language) => translated(language, 'header.title'));
  const current = translated(locale, 'header.title');
  return names.filter((name) => name !== current);
}

function simulatorStructuredData(page) {
  const pageUrl = `${origin}${page.publicPath}`;
  const faq = Array.from({ length: 15 }, (_, index) => ({
    '@type': 'Question',
    name: translated(page.locale, `faq.${index + 1}.question`),
    acceptedAnswer: {
      '@type': 'Answer',
      text: stripHtml(translated(page.locale, `faq.${index + 1}.answer`)),
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteIdentity(),
      {
        '@type': 'WebApplication',
        '@id': `${pageUrl}#application`,
        name: translated(page.locale, 'header.title'),
        alternateName: localizedApplicationNames(page.locale),
        url: pageUrl,
        image: `${origin}/assets/image/logo.png`,
        description: translated(page.locale, 'metadata.description'),
        applicationCategory: 'FinanceApplication',
        operatingSystem: localizedSchema[page.locale].operatingSystem,
        browserRequirements: localizedSchema[page.locale].browserRequirements,
        inLanguage: page.locale,
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BRL',
        },
        featureList: localizedSchema[page.locale].featureList,
        isPartOf: {
          '@id': `${origin}/#website`,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        inLanguage: page.locale,
        mainEntity: faq,
      },
    ],
  };
}

function comparisonStructuredData(page) {
  const pageUrl = `${origin}${page.publicPath}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${pageUrl}#application`,
    name: translated(page.locale, 'comparison.metadata.title'),
    url: pageUrl,
    image: `${origin}/assets/image/logo.png`,
    description: translated(page.locale, 'comparison.metadata.description'),
    applicationCategory: 'FinanceApplication',
    operatingSystem: localizedSchema[page.locale].comparisonOperatingSystem,
    inLanguage: page.locale,
    isAccessibleForFree: true,
    isPartOf: {
      '@id': `${origin}/#website`,
    },
  };
}

function institutionalStructuredData(page) {
  const pageUrl = `${origin}${page.publicPath}`;
  const simulatorUrl = `${origin}${publicRoutes.simulator[page.locale]}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.title,
    description: page.description,
    inLanguage: page.locale,
    isPartOf: {
      '@id': `${origin}/#website`,
    },
    about: {
      '@type': 'WebApplication',
      '@id': `${simulatorUrl}#application`,
      name: translated(page.locale, 'header.title'),
      url: simulatorUrl,
    },
  };
}

function guidesStructuredData(page) {
  const pageUrl = `${origin}${page.publicPath}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteIdentity(),
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#collection`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        inLanguage: page.locale,
        isPartOf: {
          '@id': `${origin}/#website`,
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: contentRegistry.itemPublicPaths(page.locale).map((publicPath, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${origin}${publicPath}`,
          })),
        },
      },
    ],
  };
}

function contentStructuredData(page) {
  const pageUrl = `${origin}${page.publicPath}`;
  const hubUrl = `${origin}${publicRoutes.guides[page.locale]}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      websiteIdentity(),
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        url: pageUrl,
      headline: page.headerTitle || page.title,
        description: page.description,
        image: page.socialImage
          ? {
            '@type': 'ImageObject',
            url: `${origin}/${page.socialImage.path}`,
            width: page.socialImage.width,
            height: page.socialImage.height,
            caption: page.socialImage.alt,
          }
          : `${origin}/assets/image/logo.png`,
        inLanguage: page.locale,
        datePublished: page.datePublished,
        dateModified: page.dateModified,
        author: {
          '@type': 'Organization',
          name: 'Mapa das Parcelas',
          url: `${origin}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Mapa das Parcelas',
          url: `${origin}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/assets/image/logo.png`,
          },
        },
        isPartOf: {
          '@id': `${origin}/#website`,
        },
        about: {
          '@type': 'WebApplication',
          '@id': `${origin}${publicRoutes.simulator[page.locale]}#application`,
          name: translated(page.locale, 'header.title'),
          url: `${origin}${publicRoutes.simulator[page.locale]}`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: translated(page.locale, 'footer.simulator'),
            item: `${origin}${publicRoutes.simulator[page.locale]}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: translated(page.locale, 'footer.guides'),
            item: hubUrl,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: page.headerTitle || page.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}

function structuredData(page) {
  if (page.contentKind) return contentStructuredData(page);
  if (page.pageKey === 'simulator') return simulatorStructuredData(page);
  if (page.pageKey === 'comparison') return comparisonStructuredData(page);
  if (page.pageKey === 'guides') return guidesStructuredData(page);
  return institutionalStructuredData(page);
}

module.exports = {
  dictionaries,
  domain,
  languageConfig,
  locales,
  localizedSchema,
  origin,
  pageDefinitions,
  pageGroups,
  pages,
  publicRoutes,
  structuredData,
};
