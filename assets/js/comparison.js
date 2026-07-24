(function exposeFinancialComparison(globalScope) {
  'use strict';

  const DEFAULT_FINANCED_CENTS = 100000;
  const DEFAULT_TERM = 360;
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

  function buildComparisonRows({
    bcbData,
    creditType = 'realEstate',
    financedCents,
    term,
    monthlyCorrectionRate,
    system = 'sac',
    finance,
  }) {
    if (!finance?.simulate || !finance?.monthlyRateFromPercent) {
      throw new Error('FinanceSimulator indisponível.');
    }

    const rows = [];
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
        rows.push({
          ...entry,
          totalPaidCents: simulation.stats.totalPaidCents,
          firstPaymentCents: simulation.stats.initialTotalPaymentCents,
          lastPaymentCents: simulation.stats.finalTotalPaymentCents,
          totalInterestCents: simulation.stats.totalInterestCents,
          effectiveTerm: simulation.stats.effectiveTerm,
        });
      } catch (error) {
        ignoredCount += 1;
      }
    }

    rows.sort((left, right) => (
      left.totalPaidCents - right.totalPaidCents
      || left.annualRatePercent - right.annualRatePercent
      || left.institution.localeCompare(right.institution, 'pt-BR')
    ));

    return {
      rows,
      ignoredCount,
      referencePeriod: comparisonReferencePeriod(bcbData, creditType),
    };
  }

  const api = {
    DEFAULT_FINANCED_CENTS,
    DEFAULT_TERM,
    highestRecentTrRate,
    creditRateEntries,
    comparisonReferencePeriod,
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

  const languageSelect = document.querySelector('#language-select');
  const financedValueInput = document.querySelector('#comparison-financed-value');
  const termInput = document.querySelector('#comparison-term');
  const correctionRateInput = document.querySelector('#comparison-correction-rate');
  const systemInput = document.querySelector('#comparison-system');
  const creditTypeInput = document.querySelector('#comparison-credit-type');
  const resultsBody = document.querySelector('#comparison-rates-body');
  const status = document.querySelector('#comparison-status');
  const table = document.querySelector('#comparison-table');

  let bcbData = null;
  let autoCalculationTimer = null;

  function t(key, params) {
    return i18n.t(key, params);
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
    setText('#comparison-charts-placeholder', 'comparison.chartsPlaceholder');
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

  function renderRows(result) {
    resultsBody.innerHTML = result.rows.map((row) => `
      <tr>
        <th scope="row">${escapeHtml(row.institution)}</th>
        <td>${escapeHtml(t(`bcb.modality.${row.modalityKey}`) || row.modalityLabel)}</td>
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
      return;
    }

    const result = buildComparisonRows({ ...config, bcbData, finance });
    renderRows(result);
    renderStatus(result);
    table.classList.toggle('d-none', result.rows.length === 0);
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
