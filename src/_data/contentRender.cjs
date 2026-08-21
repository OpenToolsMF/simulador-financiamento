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
  const referenceKey = rate.modalityKey === 'marketFixed'
    ? 'guides.reference.bcbFixed'
    : 'guides.reference.bcb';
  const bcbText = translated(locale, referenceKey, {
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
    ['guides.field.rate', translated(locale, `guides.value.rate.${state.ratePeriod}.${state.annualRateType}`, {
      rate: formatNumber(state.ratePercent, locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
    })],
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

function timingBalance(variant, month) {
  if (month === 0) return variant.state.amountCents;
  return variant.result.installments[month - 1]?.closingBalanceCents ?? 0;
}

function timingInstallment(variant, month) {
  return variant.result.installments[month - 1] || null;
}

function timingChartPoint(value, index, count, minimum, maximum, dimensions) {
  const { width, height, left, right, top, bottom } = dimensions;
  const x = left + (index / Math.max(1, count - 1)) * (width - left - right);
  const ratio = (value - minimum) / Math.max(1, maximum - minimum);
  const y = top + (1 - ratio) * (height - top - bottom);
  return { x, y };
}

function timingChartHtml(scenario, locale, { zoom = false } = {}) {
  const width = 800;
  const height = zoom ? 320 : 360;
  const dimensions = { width, height, left: 92, right: 24, top: 24, bottom: 58 };
  const months = zoom
    ? scenario.zoomMonths
    : Array.from({ length: scenario.state.term + 1 }, (_, month) => month);
  const values = scenario.variants.flatMap((item) => (
    months.map((month) => timingBalance(item, month))
  ));
  const rawMinimum = zoom ? Math.min(...values) : 0;
  const rawMaximum = zoom ? Math.max(...values) : scenario.state.amountCents;
  const zoomPadding = zoom ? Math.max(1, Math.round((rawMaximum - rawMinimum) * 0.16)) : 0;
  const minimum = zoom ? Math.max(0, rawMinimum - zoomPadding) : 0;
  const maximum = zoom ? rawMaximum + zoomPadding : rawMaximum;
  const yTicks = Array.from({ length: 5 }, (_, index) => (
    minimum + ((maximum - minimum) * index) / 4
  ));
  const xTicks = zoom ? months : [0, 60, 120, 180, 240, 300, 360];
  const titleKey = zoom ? 'guides.timing.zoomChartTitle' : 'guides.timing.fullChartTitle';
  const descriptionKey = zoom
    ? 'guides.timing.zoomChartDescription'
    : 'guides.timing.fullChartDescription';
  const type = zoom ? 'zoom' : 'full';
  const id = `${scenario.id}-${type}-${locale.replace(/[^a-z0-9]/gi, '-')}`;
  const horizontalGrid = yTicks.map((value) => {
    const { y } = timingChartPoint(value, 0, months.length, minimum, maximum, dimensions);
    return `<g><line class="timing-chart-gridline" x1="${dimensions.left}" y1="${y.toFixed(1)}" x2="${width - dimensions.right}" y2="${y.toFixed(1)}"/><text class="timing-chart-tick" x="${dimensions.left - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeHtml(new Intl.NumberFormat(localeName(locale), {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value / 100))}</text></g>`;
  }).join('');
  const verticalTicks = xTicks.map((month) => {
    const index = months.indexOf(month);
    const { x } = timingChartPoint(0, index, months.length, minimum, maximum, dimensions);
    return `<g><line class="timing-chart-tick-mark" x1="${x.toFixed(1)}" y1="${height - dimensions.bottom}" x2="${x.toFixed(1)}" y2="${height - dimensions.bottom + 6}"/><text class="timing-chart-tick" x="${x.toFixed(1)}" y="${height - dimensions.bottom + 24}" text-anchor="middle">${formatNumber(month, locale)}</text></g>`;
  }).join('');
  const lines = scenario.variants.map((variant, variantIndex) => {
    const points = months.map((month, index) => {
      const point = timingChartPoint(
        timingBalance(variant, month),
        index,
        months.length,
        minimum,
        maximum,
        dimensions,
      );
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }).join(' ');
    const className = variantIndex === 0
      ? 'scenario-chart-line-primary'
      : 'scenario-chart-line-secondary';
    return `<polyline class="${className}" points="${points}"/>`;
  }).join('');
  const eventPoints = scenario.variants.map((variant, variantIndex) => {
    const month = variant.state.extraPayments[0].month;
    if (!months.includes(month)) return '';
    const point = timingChartPoint(
      timingBalance(variant, month),
      months.indexOf(month),
      months.length,
      minimum,
      maximum,
      dimensions,
    );
    const label = `${variantLabel(variant.id, locale)}: ${formatCurrency(timingBalance(variant, month), locale)}`;
    return `<circle class="timing-event-point ${variantIndex === 0 ? 'primary' : 'secondary'}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="6"><title>${escapeHtml(label)}</title></circle>`;
  }).join('');
  const legend = scenario.variants.map((variant, index) => (
    `<span><i class="${index === 0 ? 'primary' : 'secondary'}" aria-hidden="true"></i>${escapeHtml(variantLabel(variant.id, locale))}</span>`
  )).join('');

  return `<figure class="scenario-chart timing-chart timing-chart-${type}" data-timing-chart="${type}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${escapeHtml(translated(locale, titleKey))}</title><desc id="${id}-desc">${escapeHtml(translated(locale, descriptionKey))}</desc>${horizontalGrid}<line class="scenario-chart-axis" x1="${dimensions.left}" y1="${height - dimensions.bottom}" x2="${width - dimensions.right}" y2="${height - dimensions.bottom}"/><line class="scenario-chart-axis" x1="${dimensions.left}" y1="${dimensions.top}" x2="${dimensions.left}" y2="${height - dimensions.bottom}"/>${verticalTicks}${lines}${eventPoints}<text class="timing-chart-axis-label" x="${(dimensions.left + width - dimensions.right) / 2}" y="${height - 8}" text-anchor="middle">${escapeHtml(translated(locale, 'guides.timing.chartMonth'))}</text><text class="timing-chart-axis-label" x="18" y="${height / 2}" text-anchor="middle" transform="rotate(-90 18 ${height / 2})">${escapeHtml(translated(locale, 'guides.timing.chartBalance'))}</text></svg><figcaption><strong>${escapeHtml(translated(locale, titleKey))}</strong><span class="scenario-chart-legend">${legend}</span><span class="timing-chart-scroll-hint">${escapeHtml(translated(locale, 'guides.timing.scrollHint'))}</span></figcaption></figure>`;
}

function timingInstallmentsHtml(scenario, locale) {
  const headers = scenario.variants.map((variant) => (
    `<th scope="colgroup" colspan="2">${escapeHtml(variantLabel(variant.id, locale))}</th>`
  )).join('');
  const subheaders = scenario.variants.map(() => (
    `<th scope="col">${escapeHtml(translated(locale, 'guides.table.totalPayment'))}</th><th scope="col">${escapeHtml(translated(locale, 'guides.table.balance'))}</th>`
  )).join('');
  const rows = scenario.comparisonMonths.map((month) => {
    const cells = scenario.variants.map((variant) => {
      const installment = timingInstallment(variant, month);
      return `<td>${escapeHtml(formatCurrency(installment?.totalPaymentCents || 0, locale))}</td><td>${escapeHtml(formatCurrency(installment?.closingBalanceCents || 0, locale))}</td>`;
    }).join('');
    return `<tr><th scope="row">${formatNumber(month, locale)}</th>${cells}</tr>`;
  }).join('');
  return `<div class="table-responsive"><table class="table comparison-table scenario-sample-table timing-installment-table"><thead><tr><th scope="col" rowspan="2">${escapeHtml(translated(locale, 'guides.table.installment'))}</th>${headers}</tr><tr>${subheaders}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function timingChartDataTableHtml(scenario, locale) {
  const headers = scenario.variants.map((variant) => (
    `<th scope="col">${escapeHtml(variantLabel(variant.id, locale))}</th>`
  )).join('');
  const rows = Array.from({ length: scenario.state.term + 1 }, (_, month) => {
    const values = scenario.variants.map((variant) => (
      `<td>${escapeHtml(formatCurrency(timingBalance(variant, month), locale))}</td>`
    )).join('');
    return `<tr><th scope="row">${formatNumber(month, locale)}</th>${values}</tr>`;
  }).join('');
  return `<details class="timing-chart-data"><summary>${escapeHtml(translated(locale, 'guides.timing.chartData'))}</summary><div class="table-responsive"><table class="table comparison-table timing-chart-data-table"><thead><tr><th scope="col">${escapeHtml(translated(locale, 'guides.timing.chartMonth'))}</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function timingCostHtml(scenario, locale) {
  const earlier = scenario.variants[0];
  const later = scenario.variants[1];
  const earlierInterest = earlier.result.stats.totalInterestCents;
  const laterInterest = later.result.stats.totalInterestCents;
  const difference = laterInterest - earlierInterest;
  return `<aside class="timing-cost-card" aria-labelledby="timing-cost-title"><h3 class="content-card-category" id="timing-cost-title">${escapeHtml(translated(locale, 'guides.timing.costTitle'))}</h3><p class="timing-cost-value">${escapeHtml(formatCurrency(difference, locale))}</p><p class="timing-cost-formula">${escapeHtml(translated(locale, 'guides.timing.costFormula'))}</p><p>${escapeHtml(translated(locale, 'guides.timing.costDescription', {
    laterInterest: formatCurrency(laterInterest, locale),
    earlierInterest: formatCurrency(earlierInterest, locale),
    difference: formatCurrency(difference, locale),
  }))}</p><p class="timing-cost-same-scenario">${escapeHtml(translated(locale, 'guides.timing.sameScenario'))}</p><small>${escapeHtml(translated(locale, 'guides.timing.costNote'))}</small></aside>`;
}

function timingParametersHtml(scenario, locale) {
  const base = parametersHtml(scenario, locale).replace('</dl>', '');
  return `${base}<div><dt>${escapeHtml(translated(locale, 'guides.field.extraGoal'))}</dt><dd>${escapeHtml(translated(locale, 'guides.value.reducePayment'))}</dd></div></dl>`;
}

function timingComparisonModule(scenario, generatedPage) {
  const locale = generatedPage.locale;
  return `<div class="scenario-module timing-comparison-module" data-scenario-id="${escapeHtml(scenario.id)}">${referenceHtml(scenario, locale)}<h3>${escapeHtml(translated(locale, 'guides.parameters'))}</h3>${timingParametersHtml(scenario, locale)}<h3>${escapeHtml(translated(locale, 'guides.results'))}</h3><div class="timing-comparison-table">${statsComparisonHtml(scenario, locale)}</div>${timingCostHtml(scenario, locale)}<h3>${escapeHtml(translated(locale, 'guides.timing.installmentsTitle'))}</h3>${timingInstallmentsHtml(scenario, locale)}${timingChartHtml(scenario, locale)}${timingChartHtml(scenario, locale, { zoom: true })}<p class="timing-crossover-note">${escapeHtml(translated(locale, 'guides.timing.crossover'))}</p>${timingChartDataTableHtml(scenario, locale)}<a class="btn btn-primary" href="${escapeHtml(simulatorHref(scenario, generatedPage))}">${escapeHtml(translated(locale, 'guides.openSimulator'))}</a></div>`;
}

function scenarioModule(scenarioId, generatedPage) {
  const scenario = scenariosData.scenarios[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario module: ${scenarioId}`);
  if (scenario.renderType === 'timing-comparison') {
    return timingComparisonModule(scenario, generatedPage);
  }
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
  timingComparisonModule,
};
