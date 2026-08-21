'use strict';

const contentRegistry = require('./contentRegistry.cjs');
const scenarios = require('./scenarios.cjs');
const site = require('./site.cjs');

function maxDate(values) {
  return values.filter(Boolean).sort().at(-1);
}

function dependencyDate(dependency) {
  if (dependency === 'bcb') return scenarios.references.bcb.generatedAt.slice(0, 10);
  if (dependency === 'tr') return scenarios.references.tr.generatedAt.slice(0, 10);
  return null;
}

function normalizedSocialImage(value) {
  if (!value) return null;
  const image = typeof value === 'string' ? { path: value } : value;
  if (!image.path) throw new Error('socialImage requires a path.');
  return {
    path: String(image.path).replace(/^\//, ''),
    alt: image.alt || '',
    type: image.type || 'image/png',
    width: Number(image.width) || 1200,
    height: Number(image.height) || 630,
  };
}

function contentGeneratedPage(data) {
  if (!data.contentId || !['guide', 'simulation'].includes(data.contentKind)) {
    return data.generatedPage;
  }

  const publicPath = contentRegistry.publicPathFor(data.contentKind, data.contentId, data.locale);
  const dependencies = Array.isArray(data.dataDependencies) ? data.dataDependencies : [];
  const dateModified = maxDate([
    data.updated,
    ...dependencies.map(dependencyDate),
  ]);
  const eyebrowKey = data.contentKind === 'guide'
    ? 'guides.articleEyebrow'
    : 'guides.simulationEyebrow';
  const socialImage = normalizedSocialImage(data.socialImage);

  return {
    pageKey: 'guides',
    contentKind: data.contentKind,
    contentId: data.contentId,
    locale: data.locale,
    htmlLang: site.languageConfig[data.locale].htmlLang,
    ogLocale: site.languageConfig[data.locale].locale.replace('-', '_'),
    publicPath,
    outputPath: contentRegistry.outputPathFor(data.contentKind, data.contentId, data.locale),
    title: `${data.seoTitle || data.title} | ${site.dictionaries[data.locale]['header.title']}`,
    description: data.description,
    headerEyebrow: site.dictionaries[data.locale][eyebrowKey],
    headerTitle: data.title,
    headerLead: data.description,
    headerPadding: 'py-4',
    bodyClass: 'content-page-body',
    footerClass: '',
    scripts: [
      'assets/js/i18n.js?v=20260812-amortization-timing',
      'assets/js/static-content.js?v=20260812-amortization-timing',
    ],
    styleVersion: '20260812-amortization-timing',
    adsense: true,
    ogType: 'article',
    socialImage,
    alternates: contentRegistry.alternatesFor(data.contentKind, data.contentId),
    datePublished: data.published,
    dateModified,
    lastmod: dateModified,
  };
}

module.exports = {
  generatedPage: contentGeneratedPage,
  permalink(data) {
    if (!data.contentId || !['guide', 'simulation'].includes(data.contentKind)) {
      return data.permalink;
    }
    return contentRegistry.outputPathFor(data.contentKind, data.contentId, data.locale);
  },
};
