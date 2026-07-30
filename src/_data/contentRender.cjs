'use strict';

const path = require('node:path');
const i18n = require('../../assets/js/i18n.js');
const scenariosData = require('./scenarios.cjs');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function translated(locale, key, params = {}) {
  const template = i18n.dictionaries[locale]?.[key];
  if (template === undefined) throw new Error(`Missing content translation: ${locale}.${key}`);
  return String(template).replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  ));
}

function localeName(locale) {
  return i18n.languageConfig[locale].locale;
}

function formatCurrency(cents, locale) {
  return new Intl.NumberFormat(localeName(locale), {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatNumber(value, locale, options = {}) {
  return new Intl.NumberFormat(localeName(locale), options).format(value);
}

function formatDate(value, locale) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Intl.DateTimeFormat(localeName(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day, 12));
}

function directoryForPublicPath(publicPath) {
  return publicPath.endsWith('/') ? publicPath : path.posix.dirname(publicPath);
}

function relativeHref(fromPublicPath, targetPath) {
  const fromDirectory = directoryForPublicPath(fromPublicPath).replace(/^\/|\/$/g, '');
  const normalizedTarget = targetPath.replace(/^\//, '');
  const relative = path.posix.relative(fromDirectory, normalizedTarget);
  const href = targetPath.endsWith('/') ? relative.replace(/\/?$/, '/') : relative;
  return href.startsWith('.') ? href : `./${href}`;
}

function variantLabel(variantId, locale) {
  return translated(locale, `guides.variant.${variantId}`);
}

function referenceHtml(scenario, locale) {
  if (scenario.referenceType === 'illustrative') {
    return `<p class="scenario-reference"><span>${escapeHtml(translated(locale, 'guides.reference.illustrative'))}</span></p>`;
  }
  if (scenario.referenceType === 'mixed-bcb') {
    const text = translated(locale, 'guides.reference.bcbMixed', {
      period: scenariosData.fixedRate.referencePeriod,
      fixedCount: scenariosData.fixedRate.institutionCount,
      trCount: scenariosData.marketTrRate.institutionCount,
    });
    const trText = translated(locale, 'guides.reference.tr', {
      rate: formatNumber(scenariosData.trReference.ratePercent, locale, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      date: formatDate(scenariosData.trReference.selectedDate, locale),
    });
    return `<p class="scenario-reference"><span>${escapeHtml(text)}</span><br><span>${escapeHtml(trText)}</span></p>`;
  }
  const usesTr = scenario.variants.some((variant) => variant.state.correction.mode === 'fixed');
  const rate = usesTr ? scenariosData.marketTrRate : scenariosData.fixedRate;
  const bcbText = translated(locale, 'guides.reference.bcb', {
    period: rate.referencePeriod,
    count: rate.institutionCount,
  });
  const parts = [`<span>${escapeHtml(bcbText)}</span>`];
  if (usesTr) {
    const trText = translated(locale, 'guides.reference.tr', {
      rate: formatNumber(scenariosData.trReference.ratePercent, locale, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      date: formatDate(scenariosData.trReference.selectedDate, locale),
    });
    parts.push(`<span>${escapeHtml(trText)}</span>`);
  }
  return `<p class="scenario-reference">${parts.join('<br>')}</p>`;
}

function parametersHtml(scenario, locale) {
  const state = scenario.state;
  const correction = state.correction.mode === 'fixed'
    ? `${formatNumber(state.correction.monthlyRatePercent, locale, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })}%`
    : translated(locale, 'common.none');
  const extraCents = state.extraPayments.reduce((sum, item) => sum + item.valueCents, 0);
  const items = [
    ['guides.field.amount', formatCurrency(state.amountCents, locale)],
    ['guides.field.term', `${formatNumber(state.term, locale)} ${translated(locale, 'unit.months')}`],
    ['guides.field.rate', `${formatNumber(state.ratePercent, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}%`],
    ['guides.field.system', state.system.toUpperCase()],
    ['guides.field.correction', correction],
    ['guides.field.extra', extraCents ? formatCurrency(extraCents, locale) : translated(locale, 'common.none')],
  ];
  return `<dl class="scenario-parameters">${items.map(([key, value]) => (
    `<div><dt>${escapeHtml(translated(locale, key))}</dt><dd>${escapeHtml(value)}</dd></div>`
  )).join('')}</dl>`;
}

function statsComparisonHtml(scenario, locale) {
  const statRows = [
    ['guides.stat.initialPayment', 'initialTotalPaymentCents', 'currency'],
    ['guides.stat.finalPayment', 'finalTotalPaymentCents', 'currency'],
    ['guides.stat.totalInterest', 'totalInterestCents', 'currency'],
    ['guides.stat.totalPaid', 'totalPaidCents', 'currency'],
    ['guides.stat.effectiveTerm', 'effectiveTerm', 'months'],
    ['guides.stat.totalCorrection', 'totalCorrectionCents', 'currency'],
  ];
  const header = scenario.variants.map((variant) => (
    `<th scope="col">${escapeHtml(variantLabel(variant.id, locale))}</th>`
  )).join('');
  const rows = statRows.map(([labelKey, field, type]) => {
    const values = scenario.variants.map((variant) => {
      const value = variant.result.stats[field];
      const formatted = type === 'currency'
        ? formatCurrency(value, locale)
        : `${formatNumber(value, locale)} ${translated(locale, 'unit.months')}`;
      return `<td>${escapeHtml(formatted)}</td>`;
    }).join('');
    return `<tr><th scope="row">${escapeHtml(translated(locale, labelKey))}</th>${values}</tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table comparison-table content-comparison-table"><thead><tr><th scope="col">${escapeHtml(translated(locale, 'guides.table.variant'))}</th>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function sampleInstallments(result) {
  const wanted = [1, 12, 60, 180, result.installments.length];
  return [...new Set(wanted)]
    .filter((number) => number >= 1 && number <= result.installments.length)
    .map((number) => result.installments[number - 1]);
}

function installmentTableHtml(scenario, locale) {
  const primary = scenario.variants.find((variant) => variant.id === scenario.primaryVariantId);
  const rows = sampleInstallments(primary.result).map((row) => (
    `<tr><th scope="row">${formatNumber(row.number, locale)}</th><td>${escapeHtml(formatCurrency(row.totalPaymentCents, locale))}</td><td>${escapeHtml(formatCurrency(row.interestCents, locale))}</td><td>${escapeHtml(formatCurrency(row.regularAmortizationCents + row.extraPaymentCents, locale))}</td><td>${escapeHtml(formatCurrency(row.closingBalanceCents, locale))}</td></tr>`
  )).join('');
  return `<div class="table-responsive"><table class="table comparison-table scenario-sample-table"><thead><tr><th scope="col">${escapeHtml(translated(locale, 'guides.table.installment'))}</th><th scope="col">${escapeHtml(translated(locale, 'guides.table.payment'))}</th><th scope="col">${escapeHtml(translated(locale, 'guides.table.interest'))}</th><th scope="col">${escapeHtml(translated(locale, 'guides.table.amortization'))}</th><th scope="col">${escapeHtml(translated(locale, 'guides.table.balance'))}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function chartPoints(installments, width, height, padding) {
  const maxBalance = Math.max(...installments.map((row) => row.closingBalanceCents), 1);
  const step = Math.max(1, Math.floor(installments.length / 36));
  const sampled = installments.filter((row, index) => index % step === 0 || index === installments.length - 1);
  return sampled.map((row, index) => {
    const x = padding + (index / Math.max(1, sampled.length - 1)) * (width - padding * 2);
    const y = padding + (1 - row.closingBalanceCents / maxBalance) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function chartHtml(scenario, locale) {
  const width = 800;
  const height = 260;
  const padding = 34;
  const lines = scenario.variants.map((variant, index) => {
    const className = index === 0 ? 'scenario-chart-line-primary' : 'scenario-chart-line-secondary';
    return `<polyline class="${className}" points="${chartPoints(variant.result.installments, width, height, padding)}"/>`;
  }).join('');
  const legend = scenario.variants.map((variant, index) => (
    `<span><i class="${index === 0 ? 'primary' : 'secondary'}" aria-hidden="true"></i>${escapeHtml(variantLabel(variant.id, locale))}</span>`
  )).join('');
  const title = translated(locale, 'guides.chart');
  return `<figure class="scenario-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="scenario-chart-title-${escapeHtml(scenario.id)} scenario-chart-desc-${escapeHtml(scenario.id)}"><title id="scenario-chart-title-${escapeHtml(scenario.id)}">${escapeHtml(title)}</title><desc id="scenario-chart-desc-${escapeHtml(scenario.id)}">${escapeHtml(scenario.variants.map((variant) => variantLabel(variant.id, locale)).join(' / '))}</desc><line class="scenario-chart-axis" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"/><line class="scenario-chart-axis" x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"/>${lines}</svg><figcaption><strong>${escapeHtml(title)}</strong><span class="scenario-chart-legend">${legend}</span></figcaption></figure>`;
}

function simulatorHref(scenario, generatedPage) {
  const simulatorPath = i18n.publicRoutes.simulator[generatedPage.locale];
  return `${relativeHref(generatedPage.publicPath, simulatorPath)}${scenario.simulationSearch}`;
}

function scenarioModule(scenarioId, generatedPage) {
  const scenario = scenariosData.scenarios[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario module: ${scenarioId}`);
  const locale = generatedPage.locale;
  return `<div class="scenario-module" data-scenario-id="${escapeHtml(scenarioId)}">${referenceHtml(scenario, locale)}<h3>${escapeHtml(translated(locale, 'guides.parameters'))}</h3>${parametersHtml(scenario, locale)}<h3>${escapeHtml(translated(locale, 'guides.results'))}</h3>${statsComparisonHtml(scenario, locale)}<h3>${escapeHtml(translated(locale, 'guides.installmentSamples'))}</h3>${installmentTableHtml(scenario, locale)}${chartHtml(scenario, locale)}<a class="btn btn-primary" href="${escapeHtml(simulatorHref(scenario, generatedPage))}">${escapeHtml(translated(locale, 'guides.openSimulator'))}</a></div>`;
}

module.exports = {
  escapeHtml,
  translated,
  formatCurrency,
  formatNumber,
  formatDate,
  relativeHref,
  variantLabel,
  scenarioModule,
  simulatorHref,
};
