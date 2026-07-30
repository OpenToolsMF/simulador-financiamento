'use strict';

const path = require('node:path');
const site = require('./src/_data/site.cjs');
const contentRegistry = require('./src/_data/contentRegistry.cjs');
const contentRender = require('./src/_data/contentRender.cjs');
const scenarios = require('./src/_data/scenarios.cjs');

function directoryForPublicPath(publicPath) {
  if (publicPath.endsWith('/')) return publicPath;
  return path.posix.dirname(publicPath);
}

function relativeHref(fromPage, targetPath) {
  const fromDirectory = directoryForPublicPath(fromPage.publicPath).replace(/^\/|\/$/g, '');
  const normalizedTarget = targetPath.replace(/^\//, '');
  const relative = path.posix.relative(fromDirectory, normalizedTarget);

  if (!relative) return './';
  const href = targetPath.endsWith('/') ? relative.replace(/\/?$/, '/') : relative;
  return href.startsWith('.') ? href : `./${href}`;
}

module.exports = function configureEleventy(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ assets: 'assets' });
  eleventyConfig.addPassthroughCopy('CNAME');
  eleventyConfig.addPassthroughCopy('ads.txt');

  eleventyConfig.addFilter('t', (key, locale) => {
    const value = site.dictionaries[locale]?.[key];
    if (value === undefined) throw new Error(`Missing translation: ${locale}.${key}`);
    return value;
  });
  eleventyConfig.addFilter('assetHref', (assetPath, fromPage) => (
    relativeHref(fromPage, `/${assetPath.replace(/^\//, '')}`)
  ));
  eleventyConfig.addFilter('pageHref', (pageKey, fromPage) => {
    return relativeHref(fromPage, site.publicRoutes[pageKey][fromPage.locale]);
  });
  eleventyConfig.addFilter('contentHref', (contentId, kind, fromPage) => (
    relativeHref(fromPage, contentRegistry.publicPathFor(kind, contentId, fromPage.locale))
  ));
  eleventyConfig.addFilter('contentPublicPath', (contentId, kind, locale) => (
    contentRegistry.publicPathFor(kind, contentId, locale)
  ));
  eleventyConfig.addFilter('contentDate', (value, locale) => (
    contentRender.formatDate(value, locale)
  ));
  eleventyConfig.addFilter('contentCurrency', (value, locale) => (
    contentRender.formatCurrency(value, locale)
  ));
  eleventyConfig.addFilter('contentNumber', (value, locale) => (
    contentRender.formatNumber(value, locale)
  ));
  eleventyConfig.addFilter('scenarioFor', (scenarioId) => scenarios.scenarios[scenarioId]);
  eleventyConfig.addFilter('contentByLocale', (items, locale) => (
    items.filter((item) => item.data.locale === locale)
  ));
  eleventyConfig.addFilter('contentById', (items, contentId, locale) => (
    items.find((item) => item.data.contentId === contentId && item.data.locale === locale)
  ));
  eleventyConfig.addFilter('startsWith', (value, prefix) => String(value).startsWith(prefix));
  eleventyConfig.addFilter('comparisonBackHref', (fromPage) => {
    if (fromPage.locale === 'pt-BR') return '../';
    return `../../${fromPage.locale}/`;
  });
  eleventyConfig.addFilter('homeComparisonHref', (fromPage) => {
    if (fromPage.locale === 'pt-BR') return './comparar/';
    return `../${fromPage.locale}/${site.publicRoutes.comparison[fromPage.locale].split('/').filter(Boolean).at(-1)}/`;
  });
  eleventyConfig.addFilter('canonicalUrl', (publicPath) => `${site.origin}${publicPath}`);
  eleventyConfig.addFilter('json', (value) => JSON.stringify(value, null, 2));
  eleventyConfig.addFilter('structuredData', (page) => site.structuredData(page));
  eleventyConfig.addFilter('numberPlaceholder', (locale) => (locale === 'en' ? '0.00' : '0,00'));
  eleventyConfig.addFilter('correctionSeriesPlaceholder', (locale) => (
    locale === 'en' ? '0.30&#10;0.25&#10;0.20' : '0,30&#10;0,25&#10;0,20'
  ));
  eleventyConfig.addShortcode('scenarioModule', (scenarioId, generatedPage) => (
    contentRender.scenarioModule(scenarioId, generatedPage)
  ));

  eleventyConfig.addCollection('guides', (collectionApi) => (
    collectionApi.getFilteredByGlob('src/content/guides/**/*.md')
      .sort((left, right) => left.data.order - right.data.order)
  ));
  eleventyConfig.addCollection('simulations', (collectionApi) => (
    collectionApi.getFilteredByGlob('src/content/simulations/**/*.md')
      .sort((left, right) => left.data.order - right.data.order)
  ));

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md'],
  };
};
