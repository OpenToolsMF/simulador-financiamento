(function exposeFinancialComparison(globalScope) {
  'use strict';

  const DEFAULT_FINANCED_CENTS = 100000;
  const DEFAULT_TERM = 360;
  const BEST_CHART_LIMIT = 5;
  const CHART_HIGHLIGHT_COLORS = [
    '#176b3a',
    '#2563eb',
    '#b45309',
    '#7c3aed',
    '#0f766e',
  ];
  const WORST_CHART_COLOR = '#b42318';
  const TR_CACHE_KEY = 'financing-simulator:tr-cache:v1';
  const BCB_CREDIT_RATES_CACHE_KEY = 'financing-simulator:bcb-credit-rates-cache:v2';

  function sourceRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rates)) return payload.rates;
    return [];
  }

  function highestRecentTrRate(rates, months = 12) {
    const recentRates = sourceRows(rates)
      .filter((rate) => typeof rate?.month === 'string' && typeof rate?.date === 'string' && Number.isFinite(Number(rate?.ratePercent)))
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-months);

    if (recentRates.length === 0) return null;

    const selectedRate = recentRates.reduce((highest, rate) => (
      Number(rate.ratePercent) > Number(highest.ratePercent) ? rate : highest
    ), recentRates[0]);

    return {
      ratePercent: Number(selectedRate.ratePercent),
      startMonth: recentRates[0].month,
      endMonth: recentRates.at(-1).month,
      selectedMonth: selectedRate.month,
      months: recentRates.length,
    };
  }

  function validInstitution(institution) {
    return (
      institution
      && typeof institution.institution === 'string'
      && institution.institution.trim()
      && Number.isFinite(Number(institution.annualRatePercent))
      && Number(institution.annualRatePercent) >= 0
    );
  }

  function creditRateEntries(bcbData, creditType) {
    const type = bcbData?.creditTypes?.[creditType];
    if (!type || !Array.isArray(type.modalities)) return [];

    return type.modalities.flatMap((modality) => (
      Array.isArray(modality.institutions)
        ? modality.institutions.filter(validInstitution).map((institution) => ({
          creditType,
          institution: institution.institution,
          cnpj8: institution.cnpj8 || '',
          position: institution.position || null,
          modalityKey: modality.key || '',
          modalityLabel: modality.label || modality.sourceName || '',
          annualRatePercent: Number(institution.annualRatePercent),
          monthlyRatePercent: Number(institution.monthlyRatePercent),
          referencePeriod: type.referencePeriod,
        }))
        : []
    ));
  }

  function comparisonReferencePeriod(bcbData, creditType) {
    const reference = bcbData?.creditTypes?.[creditType]?.referencePeriod;
    if (!reference) return '';
    if (typeof reference === 'string') return reference;
    if (reference.startDate && reference.endDate) return `${reference.startDate} a ${reference.endDate}`;
    return '';
  }

  function buildSimulationConfig({ entry, financedCents, term, monthlyCorrectionRate, system, finance }) {
    return {
      financedCents,
      term,
      monthlyRate: finance.monthlyRateFromPercent(entry.annualRatePercent, 'annual', 'effective'),
      system,
      correctionMode: 'fixed',
      monthlyCorrectionRate,
      monthlyExtraCostCents: 0,
      extraPayments: [],
      firstDueDate: null,
    };
  }

  function monthlyChartSeries(installments) {
    let accumulatedPaidCents = 0;

    return installments.map((installment) => {
      accumulatedPaidCents += installment.totalPaymentCents;
      return {
        number: installment.number,
        paymentCents: installment.totalPaymentCents,
        accumulatedPaidCents,
      };
    });
  }

  function highlightedChartRow(row, { role, color, dash = [] }) {
    return {
      institution: row.institution,
      modalityKey: row.modalityKey,
      modalityLabel: row.modalityLabel,
      annualRatePercent: row.annualRatePercent,
      effectiveTerm: row.effectiveTerm,
      tableRank: row.tableRank,
      highlightRole: role,
      highlightRank: row.tableRank,
      highlightColor: color,
      highlightDash: dash,
      series: row.series || [],
    };
  }

  function highlightChartRows(rows, bestLimit = BEST_CHART_LIMIT) {
    const bestRows = rows.slice(0, bestLimit).map((row, index) => highlightedChartRow(row, {
      role: 'best',
      color: CHART_HIGHLIGHT_COLORS[index % CHART_HIGHLIGHT_COLORS.length],
    }));

    if (rows.length <= bestLimit) return bestRows;

    return [
      ...bestRows,
      highlightedChartRow(rows.at(-1), {
        role: 'worst',
        color: WORST_CHART_COLOR,
        dash: [7, 5],
      }),
    ];
  }

  function buildComparisonRows({
    bcbData,
    creditType = 'realEstate',
    financedCents,
    term,
    monthlyCorrectionRate,
    system = 'sac',
    finance,
    bestChartLimit = BEST_CHART_LIMIT,
  }) {
    if (!finance?.simulate || !finance?.monthlyRateFromPercent) {
      throw new Error('FinanceSimulator indisponível.');
    }

    const simulatedRows = [];
    let ignoredCount = 0;

    for (const entry of creditRateEntries(bcbData, creditType)) {
      try {
        const simulation = finance.simulate(buildSimulationConfig({
          entry,
          financedCents,
          term,
          monthlyCorrectionRate,
          system,
          finance,
        }));
        simulatedRows.push({
          ...entry,
          totalPaidCents: simulation.stats.totalPaidCents,
          firstPaymentCents: simulation.stats.initialTotalPaymentCents,
          lastPaymentCents: simulation.stats.finalTotalPaymentCents,
          totalInterestCents: simulation.stats.totalInterestCents,
          effectiveTerm: simulation.stats.effectiveTerm,
          series: monthlyChartSeries(simulation.installments),
        });
      } catch (error) {
        ignoredCount += 1;
      }
    }

    simulatedRows.sort((left, right) => (
      left.totalPaidCents - right.totalPaidCents
      || left.annualRatePercent - right.annualRatePercent
      || left.institution.localeCompare(right.institution, 'pt-BR')
    ));

    simulatedRows.forEach((row, index) => {
      row.tableRank = index + 1;
    });

    const chartRows = highlightChartRows(simulatedRows, bestChartLimit);
    const highlightByRank = new Map(chartRows.map((row) => [row.tableRank, row]));
    const rows = simulatedRows.map(({ series, ...row }) => {
      const highlight = highlightByRank.get(row.tableRank);
      return highlight
        ? {
          ...row,
          highlightRole: highlight.highlightRole,
          highlightRank: highlight.highlightRank,
          highlightColor: highlight.highlightColor,
          highlightDash: highlight.highlightDash,
        }
        : row;
    });

    return {
      rows,
      chartRows,
      ignoredCount,
      referencePeriod: comparisonReferencePeriod(bcbData, creditType),
    };
  }

  const api = {
    DEFAULT_FINANCED_CENTS,
    DEFAULT_TERM,
    BEST_CHART_LIMIT,
    highestRecentTrRate,
    creditRateEntries,
    comparisonReferencePeriod,
    monthlyChartSeries,
    highlightChartRows,
    buildComparisonRows,
  };

  globalScope.FinancialComparison = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (!globalScope.document) return;

  const document = globalScope.document;
  const form = document.querySelector('#comparison-form');
  if (!form) return;

  const finance = globalScope.FinanceSimulator;
  const i18n = globalScope.FinancingI18n;
  if (!finance || !i18n) return;

  const comparisonScriptUrl = document.currentScript?.src || document.querySelector('script[src*="assets/js/comparison.js"]')?.src;
  const ASSET_BASE_URL = comparisonScriptUrl ? new URL('../', comparisonScriptUrl).href : new URL('./assets/', document.baseURI).href;
  const assetUrl = (path) => new URL(path, ASSET_BASE_URL).href;
  const TR_DATA_URL = assetUrl('data/tr-bacen.json');
  const BCB_CREDIT_RATES_DATA_URL = assetUrl('data/bcb-credit-rates.json');
  const CHART_JS_URL = assetUrl('vendor/chartjs/chart.umd.min.js');
  const CHART_PRELOAD_ROOT_MARGIN = '700px 0px';

  const languageSelect = document.querySelector('#language-select');
  const financedValueInput = document.querySelector('#comparison-financed-value');
  const termInput = document.querySelector('#comparison-term');
  const correctionRateInput = document.querySelector('#comparison-correction-rate');
  const systemInput = document.querySelector('#comparison-system');
  const creditTypeInput = document.querySelector('#comparison-credit-type');
  const resultsBody = document.querySelector('#comparison-rates-body');
  const status = document.querySelector('#comparison-status');
  const table = document.querySelector('#comparison-table');
  const chartSection = document.querySelector('.comparison-chart-section');
  const chartDescription = document.querySelector('#comparison-charts-description');
  const chartStatus = document.querySelector('#comparison-charts-status');
  const chartCanvases = {
    accumulated: document.querySelector('#comparison-accumulated-chart'),
    payment: document.querySelector('#comparison-payment-chart'),
  };

  let bcbData = null;
  let autoCalculationTimer = null;
  let currentResult = null;
  let charts = {};
  let chartJsLoadPromise = null;
  let chartObserver = null;
  let chartsRequested = false;
  let chartRenderVersion = 0;
  let latestRenderedChartVersion = 0;
  let chartStatusState = 'idle';

  function t(key, params) {
    return i18n.t(key, params);
  }

  function renderChartStatus() {
    if (!chartStatus) return;

    chartStatus.classList.toggle('chart-status-error', chartStatusState === 'error');
    chartStatus.setAttribute('aria-busy', chartStatusState === 'loading' ? 'true' : 'false');

    if (chartStatusState === 'loading') {
      chartStatus.setAttribute('role', 'status');
      chartStatus.textContent = t('comparison.chartsLoading');
      return;
    }

    if (chartStatusState === 'error') {
      chartStatus.setAttribute('role', 'alert');
      chartStatus.innerHTML = `${escapeHtml(t('comparison.chartsLoadError'))} <button type="button" class="btn btn-link btn-sm p-0" data-action="retry-comparison-charts">${escapeHtml(t('comparison.chartsRetry'))}</button>`;
      return;
    }

    chartStatus.setAttribute('role', 'status');
    chartStatus.textContent = '';
  }

  function setChartStatus(state) {
    chartStatusState = state;
    renderChartStatus();
  }

  function loadChartJs() {
    if (globalScope.Chart) return Promise.resolve(globalScope.Chart);
    if (chartJsLoadPromise) return chartJsLoadPromise;

    chartJsLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-chartjs-loader="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (globalScope.Chart) resolve(globalScope.Chart);
          else reject(new Error(`Chart.js loaded but window.Chart is unavailable from ${CHART_JS_URL}`));
        }, { once: true });
        existingScript.addEventListener('error', () => reject(new Error(`Unable to load Chart.js from ${CHART_JS_URL}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = CHART_JS_URL;
      script.async = true;
      script.dataset.chartjsLoader = 'true';

      script.onload = () => {
        script.onload = null;
        script.onerror = null;
        if (globalScope.Chart) {
          resolve(globalScope.Chart);
          return;
        }
        script.remove();
        reject(new Error(`Chart.js loaded but window.Chart is unavailable from ${CHART_JS_URL}`));
      };

      script.onerror = () => {
        script.onload = null;
        script.onerror = null;
        script.remove();
        reject(new Error(`Unable to load Chart.js from ${CHART_JS_URL}`));
      };

      document.body.appendChild(script);
    }).catch((error) => {
      chartJsLoadPromise = null;
      throw error;
    });

    return chartJsLoadPromise;
  }

  function disconnectChartObserver() {
    if (!chartObserver) return;
    chartObserver.disconnect();
    chartObserver = null;
  }

  function nextLocalMidnightIso() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return midnight.toISOString();
  }

  function readCache(key, validator) {
    try {
      const cache = JSON.parse(globalScope.localStorage?.getItem(key) || 'null');
      if (!cache || typeof cache.expiresAt !== 'string' || Date.parse(cache.expiresAt) <= Date.now()) return null;
      return validator(cache) ? cache : null;
    } catch (error) {
      return null;
    }
  }

  function writeCache(key, payload) {
    try {
      globalScope.localStorage?.setItem(key, JSON.stringify({
        ...payload,
        fetchedAt: new Date().toISOString(),
        expiresAt: nextLocalMidnightIso(),
      }));
    } catch (error) {
      // Comparison remains functional without localStorage.
    }
  }

  function validateTrReference(reference) {
    return reference && Number.isFinite(Number(reference.ratePercent));
  }

  function validateBcbData(data) {
    return data?.creditTypes?.realEstate?.modalities && data?.creditTypes?.vehicle?.modalities;
  }

  async function loadTrReference() {
    const cached = readCache(TR_CACHE_KEY, (cache) => cache.version === 2 && validateTrReference(cache.reference));
    if (cached) return cached.reference;

    const response = await fetch(TR_DATA_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const reference = highestRecentTrRate(data.rates, 12);
    if (!reference) throw new Error('TR inválida.');
    writeCache(TR_CACHE_KEY, {
      version: 2,
      reference,
      generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : '',
      sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : '',
    });
    return reference;
  }

  async function loadBcbData() {
    const cached = readCache(BCB_CREDIT_RATES_CACHE_KEY, (cache) => cache.version === 2 && validateBcbData(cache.data));
    if (cached) return cached.data;

    const response = await fetch(BCB_CREDIT_RATES_DATA_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!validateBcbData(data)) throw new Error('BCB inválido.');
    writeCache(BCB_CREDIT_RATES_CACHE_KEY, { version: 2, data });
    return data;
  }

  function parseNumber(value) {
    return i18n.parseLocalizedNumber(value);
  }

  function centsFromInput(input) {
    const value = parseNumber(input.value);
    return Number.isFinite(value) ? Math.round(value * 100) : Number.NaN;
  }

  function formatMoneyInput(input) {
    const cents = centsFromInput(input);
    if (Number.isFinite(cents)) input.value = i18n.formatNumber(cents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatMoneyWhileTyping(input) {
    const digits = input.value.replace(/\D/g, '');
    const cents = digits ? Number(digits) : 0;
    input.value = i18n.formatNumber(cents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatRateInput(value) {
    return i18n.formatRatePercent(value, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  function formatCurrency(cents) {
    return i18n.formatCurrency(cents);
  }

  function centsToReais(cents) {
    return Math.round(cents) / 100;
  }

  function bcbModalityLabel(modalityKey, fallback = '') {
    const label = t(`bcb.modality.${modalityKey}`);
    return label === `bcb.modality.${modalityKey}` ? fallback : label;
  }

  function chartRows(result = currentResult) {
    return Array.isArray(result?.chartRows) ? result.chartRows : [];
  }

  function renderChartDescription(result = currentResult) {
    if (!chartDescription) return;
    const rowCount = Array.isArray(result?.rows) ? result.rows.length : 0;
    if (!rowCount) {
      chartDescription.textContent = t('comparison.chartsDescriptionEmpty');
      return;
    }
    chartDescription.textContent = t(
      rowCount <= BEST_CHART_LIMIT ? 'comparison.chartsDescriptionCount' : 'comparison.chartsDescription',
      {
        count: i18n.formatNumber(rowCount),
        limit: i18n.formatNumber(BEST_CHART_LIMIT),
      },
    );
  }

  function chartDatasetLabel(row) {
    return t('comparison.chartDatasetLabel', {
      rank: i18n.formatNumber(row.tableRank || row.highlightRank || 0),
      institution: row.institution,
      modality: bcbModalityLabel(row.modalityKey, row.modalityLabel),
    });
  }

  function chartLabels(rows) {
    const maxLength = rows.reduce((largest, row) => Math.max(largest, row.series.length), 0);
    return Array.from({ length: maxLength }, (_, index) => String(index + 1));
  }

  function chartData(rows, field) {
    return rows.map((row) => ({
      label: chartDatasetLabel(row),
      data: chartLabels(rows).map((_, pointIndex) => {
        const point = row.series[pointIndex];
        return point ? centsToReais(point[field]) : null;
      }),
      borderColor: row.highlightColor,
      borderDash: row.highlightDash || [],
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.18,
      spanGaps: false,
      comparisonRow: row,
    }));
  }

  function chartMoneyLabel(context) {
    const value = context.parsed.y ?? context.parsed;
    const row = context.dataset.comparisonRow;
    if (!row) return `${context.dataset.label}: ${formatCurrency(Math.round(value * 100))}`;
    return t('comparison.chartTooltipLabel', {
      rank: i18n.formatNumber(row.tableRank || row.highlightRank || 0),
      institution: row.institution,
      modality: bcbModalityLabel(row.modalityKey, row.modalityLabel),
      value: formatCurrency(Math.round(value * 100)),
    });
  }

  function commonChartOptions(yTitle) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => t('comparison.chartInstallmentTooltip', { number: items[0]?.label || '' }),
            label: chartMoneyLabel,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: t('charts.installmentAxis') },
          ticks: { maxTicksLimit: 12 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: yTitle },
          ticks: { callback: (value) => formatCurrency(Math.round(value * 100)) },
        },
      },
    };
  }

  function destroyCharts() {
    Object.values(charts).forEach((chart) => chart.destroy());
    charts = {};
  }

  function renderCharts(result) {
    if (!globalScope.Chart) return;
    const rows = chartRows(result);
    destroyCharts();

    if (!rows.length) return;

    const labels = chartLabels(rows);
    charts.accumulated = new globalScope.Chart(chartCanvases.accumulated, {
      type: 'line',
      data: {
        labels,
        datasets: chartData(rows, 'accumulatedPaidCents'),
      },
      options: commonChartOptions(t('comparison.accumulatedChartAxis')),
    });

    charts.payment = new globalScope.Chart(chartCanvases.payment, {
      type: 'line',
      data: {
        labels,
        datasets: chartData(rows, 'paymentCents'),
      },
      options: commonChartOptions(t('comparison.paymentChartAxis')),
    });
  }

  async function renderPendingChartsWhenReady() {
    if (!currentResult || !chartCanvases.accumulated || !chartCanvases.payment) return;

    const renderVersion = chartRenderVersion;
    const result = currentResult;
    setChartStatus('loading');

    try {
      await loadChartJs();
    } catch (error) {
      if (renderVersion === chartRenderVersion) setChartStatus('error');
      return;
    }

    if (renderVersion !== chartRenderVersion || result !== currentResult) return;
    if (latestRenderedChartVersion === renderVersion) {
      setChartStatus('idle');
      return;
    }

    try {
      renderCharts(result);
      latestRenderedChartVersion = renderVersion;
      setChartStatus('idle');
    } catch (error) {
      destroyCharts();
      if (renderVersion === chartRenderVersion) setChartStatus('error');
    }
  }

  function observeChartsWhenNeeded() {
    if (chartsRequested || chartObserver || !chartSection) return;

    if (!('IntersectionObserver' in globalScope)) {
      chartsRequested = true;
      renderPendingChartsWhenReady();
      return;
    }

    chartObserver = new globalScope.IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) return;
      chartsRequested = true;
      disconnectChartObserver();
      renderPendingChartsWhenReady();
    }, {
      root: null,
      rootMargin: CHART_PRELOAD_ROOT_MARGIN,
      threshold: 0,
    });

    chartObserver.observe(chartSection);
  }

  function requestChartRender(result) {
    currentResult = result;
    chartRenderVersion += 1;
    renderChartDescription(result);

    if (!result?.chartRows?.length) {
      destroyCharts();
      setChartStatus('idle');
      return;
    }

    if (globalScope.Chart || chartsRequested) {
      chartsRequested = true;
      renderPendingChartsWhenReady();
      return;
    }

    observeChartsWhenNeeded();
  }

  function retryChartRender() {
    if (!currentResult) return;
    chartsRequested = true;
    renderPendingChartsWhenReady();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function requiredLabel(key) {
    return `${escapeHtml(t(key))} <span class="required-marker" aria-hidden="true">*</span>`;
  }

  function updateLocalizedLinks() {
    document.querySelectorAll('[data-route]').forEach((link) => {
      link.setAttribute('href', i18n.localizedPathForLanguage(i18n.getLanguage(), link.dataset.route));
    });
  }

  function setText(selector, key) {
    const element = document.querySelector(selector);
    if (element) element.textContent = t(key);
  }

  function setAttr(selector, attribute, key) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, t(key));
  }

  function setOptionText(selector, value, key) {
    const option = document.querySelector(`${selector} option[value="${value}"]`);
    if (option) option.textContent = t(key);
  }

  function applyTranslations() {
    i18n.setLanguage(i18n.getLanguage());
    const title = t('comparison.metadata.title');
    const description = t('comparison.metadata.description');
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', t('header.title'));
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', i18n.getLocale().replace('-', '_'));

    if (languageSelect) languageSelect.value = i18n.getLanguage();
    updateLocalizedLinks();
    setText('.site-header .eyebrow', 'comparison.header.eyebrow');
    setText('.site-header h1', 'comparison.header.title');
    setText('.site-header .lead', 'comparison.header.lead');
    setText('.language-switcher label', 'language.label');
    setAttr('#language-select', 'aria-label', 'language.label');
    setOptionText('#language-select', 'pt-BR', 'language.pt-BR');
    setOptionText('#language-select', 'en', 'language.en');
    setOptionText('#language-select', 'es', 'language.es');
    setText('.comparison-back-link', 'comparison.back');
    setText('#comparison-config-kicker', 'comparison.configKicker');
    setText('#comparison-config-title', 'comparison.configTitle');
    setText('#comparison-results-kicker', 'comparison.resultsKicker');
    setText('#comparison-results-title', 'comparison.resultsTitle');
    setText('#comparison-results-description', 'comparison.resultsDescription');
    setText('#comparison-charts-kicker', 'comparison.chartsKicker');
    setText('#comparison-charts-title', 'comparison.chartsTitle');
    setText('#comparison-accumulated-chart-title', 'comparison.accumulatedChartTitle');
    setText('#comparison-payment-chart-title', 'comparison.paymentChartTitle');
    setAttr('#comparison-accumulated-chart', 'aria-label', 'comparison.accumulatedChartAria');
    setAttr('#comparison-payment-chart', 'aria-label', 'comparison.paymentChartAria');
    setText('#footer-copyright', 'footer.copyright');
    setText('#footer-comparison-link', 'footer.comparison');
    setText('#footer-about-link', 'footer.about');
    setText('#footer-contact-link', 'footer.contact');
    setText('#footer-privacy-link', 'footer.privacy');

    document.querySelector('label[for="comparison-credit-type"]').textContent = t('comparison.creditType');
    document.querySelector('label[for="comparison-financed-value"]').innerHTML = requiredLabel('comparison.financedValue');
    document.querySelector('label[for="comparison-term"]').innerHTML = requiredLabel('comparison.term');
    document.querySelector('label[for="comparison-correction-rate"]').innerHTML = requiredLabel('comparison.monthlyCorrectionRate');
    document.querySelector('label[for="comparison-system"]').textContent = t('comparison.system');
    setOptionText('#comparison-credit-type', 'realEstate', 'comparison.realEstate');
    setOptionText('#comparison-credit-type', 'vehicle', 'comparison.vehicle');
    setOptionText('#comparison-system', 'sac', 'option.systemSac');
    setOptionText('#comparison-system', 'price', 'option.systemPrice');
    document.querySelector('#comparison-term + .input-group-text').textContent = t('unit.months');

    const headers = document.querySelectorAll('#comparison-table thead th');
    [
      'comparison.col.institution',
      'comparison.col.modality',
      'comparison.col.annualRate',
      'comparison.col.totalPaid',
      'comparison.col.firstPayment',
      'comparison.col.lastPayment',
      'comparison.col.totalInterest',
    ].forEach((key, index) => {
      if (headers[index]) headers[index].textContent = t(key);
    });

    const notice = document.querySelector('.estimate-notice');
    if (notice) {
      notice.setAttribute('aria-label', t('notice.aria'));
      notice.innerHTML = `<strong>${escapeHtml(t('notice.strong'))}</strong> ${escapeHtml(t('notice.text'))}`;
    }

    renderChartDescription();
    renderChartStatus();
    if (globalScope.Chart && currentResult?.chartRows?.length) renderCharts(currentResult);
  }

  function readFormConfig() {
    const financedCents = centsFromInput(financedValueInput);
    const term = Number(termInput.value);
    const correctionRatePercent = parseNumber(correctionRateInput.value);

    if (!Number.isFinite(financedCents) || financedCents <= 0) return null;
    if (!Number.isInteger(term) || term < 1 || term > 600) return null;
    if (!Number.isFinite(correctionRatePercent) || correctionRatePercent < 0) return null;

    return {
      financedCents,
      term,
      monthlyCorrectionRate: correctionRatePercent / 100,
      system: systemInput.value === 'price' ? 'price' : 'sac',
      creditType: creditTypeInput.value === 'vehicle' ? 'vehicle' : 'realEstate',
    };
  }

  function chartHighlightLabel(row) {
    if (row.highlightRole === 'worst') {
      return t('comparison.chartHighlightWorst', { rank: i18n.formatNumber(row.highlightRank) });
    }
    if (row.highlightRole === 'best') {
      return t('comparison.chartHighlightBest', { rank: i18n.formatNumber(row.highlightRank) });
    }
    return '';
  }

  function renderInstitutionCell(row) {
    if (!row.highlightRole) return escapeHtml(row.institution);

    const label = chartHighlightLabel(row);
    return `
      <span class="comparison-institution-cell">
        <span
          class="comparison-chart-marker comparison-chart-marker-${escapeHtml(row.highlightRole)}"
          style="--comparison-chart-color: ${escapeHtml(row.highlightColor)}"
          role="img"
          aria-label="${escapeHtml(label)}"
          title="${escapeHtml(label)}"
        ></span>
        <span>${escapeHtml(row.institution)}</span>
      </span>
    `;
  }

  function renderRows(result) {
    resultsBody.innerHTML = result.rows.map((row) => `
      <tr>
        <th scope="row">${renderInstitutionCell(row)}</th>
        <td>${escapeHtml(bcbModalityLabel(row.modalityKey, row.modalityLabel))}</td>
        <td>${escapeHtml(formatRateInput(row.annualRatePercent))}%</td>
        <td>${escapeHtml(i18n.formatCurrency(row.totalPaidCents))}</td>
        <td>${escapeHtml(i18n.formatCurrency(row.firstPaymentCents))}</td>
        <td>${escapeHtml(i18n.formatCurrency(row.lastPaymentCents))}</td>
        <td>${escapeHtml(i18n.formatCurrency(row.totalInterestCents))}</td>
      </tr>
    `).join('');
  }

  function renderStatus(result) {
    if (!result.rows.length) {
      status.textContent = t('comparison.statusEmpty');
      return;
    }

    status.textContent = `${t('comparison.statusReady', {
      count: i18n.formatNumber(result.rows.length),
      period: result.referencePeriod || t('common.none'),
    })}${result.ignoredCount ? t('comparison.statusIgnored', { count: i18n.formatNumber(result.ignoredCount) }) : ''}`;
  }

  function recalculate() {
    const config = readFormConfig();
    if (!config || !bcbData) {
      resultsBody.innerHTML = '';
      status.textContent = t('comparison.statusError');
      table.classList.add('d-none');
      currentResult = null;
      destroyCharts();
      renderChartDescription(null);
      setChartStatus('idle');
      return;
    }

    const result = buildComparisonRows({ ...config, bcbData, finance });
    renderRows(result);
    renderStatus(result);
    table.classList.toggle('d-none', result.rows.length === 0);
    requestChartRender(result);
  }

  function scheduleRecalculation() {
    globalScope.clearTimeout(autoCalculationTimer);
    autoCalculationTimer = globalScope.setTimeout(recalculate, 300);
  }

  async function initializeDefaults() {
    financedValueInput.value = i18n.formatNumber(DEFAULT_FINANCED_CENTS / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    termInput.value = String(DEFAULT_TERM);
    status.textContent = t('comparison.statusLoading');

    const [trReference, loadedBcbData] = await Promise.all([
      loadTrReference(),
      loadBcbData(),
    ]);

    correctionRateInput.value = formatRateInput(trReference.ratePercent);
    bcbData = loadedBcbData;
    recalculate();
  }

  languageSelect?.addEventListener('change', () => {
    const nextLanguage = languageSelect.value;
    const nextUrl = i18n.localizedUrlForLanguage(nextLanguage, 'comparison');
    i18n.setLanguage(nextLanguage);
    if (nextUrl && nextUrl !== globalScope.location.href) {
      globalScope.location.assign(nextUrl);
      return;
    }
    applyTranslations();
    formatMoneyInput(financedValueInput);
    correctionRateInput.value = formatRateInput(parseNumber(correctionRateInput.value));
    recalculate();
  });

  form.addEventListener('beforeinput', (event) => {
    if (event.target === financedValueInput) {
      event.target.dataset.replaceMoneyDigits = String(
        event.target.selectionStart === 0 && event.target.selectionEnd === event.target.value.length,
      );
    }
  });

  form.addEventListener('input', (event) => {
    if (event.target === financedValueInput) formatMoneyWhileTyping(financedValueInput);
    scheduleRecalculation();
  });

  form.addEventListener('change', scheduleRecalculation);
  chartStatus?.addEventListener('click', (event) => {
    if (!event.target.closest('[data-action="retry-comparison-charts"]')) return;
    retryChartRender();
  });
  financedValueInput.addEventListener('blur', () => formatMoneyInput(financedValueInput));
  correctionRateInput.addEventListener('blur', () => {
    const rate = parseNumber(correctionRateInput.value);
    if (Number.isFinite(rate)) correctionRateInput.value = formatRateInput(rate);
  });

  applyTranslations();
  initializeDefaults().catch(() => {
    status.textContent = t('comparison.statusError');
    table.classList.add('d-none');
  });
}(typeof window !== 'undefined' ? window : globalThis));
