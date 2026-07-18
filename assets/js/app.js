(function initializeApplication() {
  'use strict';

  const finance = window.FinanceSimulator;
  const i18n = window.FinancingI18n;
  const STORAGE_KEY = 'financing-simulator:form-state:v1';
  const TR_CACHE_KEY = 'financing-simulator:tr-cache:v1';
  const SELIC_CACHE_KEY = 'financing-simulator:selic-cache:v1';
  const PRIVACY_NOTICE_STORAGE_KEY = 'financing-simulator:privacy-notice-dismissed:v1';
  const SELIC_DATA_URL = './assets/data/selic-bcb.json';
  const PRINT_CHART_WIDTH = 1200;
  const PRINT_CHART_HEIGHT = 680;
  const PRINT_REPORT_CLEANUP_DELAY_MS = 300000;
  const PRINT_CHART_ORDER = ['debt', 'composition', 'payment', 'costs'];

  const languageSelect = document.querySelector('#language-select');
  const form = document.querySelector('#simulation-form');
  const privacyNotice = document.querySelector('#privacy-notice');
  const privacyNoticeDismissButton = document.querySelector('#privacy-notice-dismiss');
  const resetFormButton = document.querySelector('#reset-form');
  const exportPdfButton = document.querySelector('#export-pdf');
  const financedValueInput = document.querySelector('#financed-value');
  const monthlyExtraCostInput = document.querySelector('#monthly-extra-cost');
  const termInput = document.querySelector('#term');
  const interestRateInput = document.querySelector('#interest-rate');
  const ratePeriodInput = document.querySelector('#rate-period');
  const annualRateTypeField = document.querySelector('#annual-rate-type-field');
  const annualRateTypeInput = document.querySelector('#annual-rate-type');
  const annualRateTypeHelp = document.querySelector('#annual-rate-type-help');
  const firstDueDateInput = document.querySelector('#first-due-date');
  const correctionModeInput = document.querySelector('#correction-mode');
  const fixedCorrectionField = document.querySelector('#fixed-correction-field');
  const monthlyCorrectionRateInput = document.querySelector('#monthly-correction-rate');
  const monthlyCorrectionRateHelp = document.querySelector('#monthly-correction-rate-help');
  const trAverageInfoButton = document.querySelector('#tr-average-info');
  const useLatestTrButton = document.querySelector('#use-latest-tr');
  const customCorrectionField = document.querySelector('#custom-correction-field');
  const monthlyCorrectionSeriesInput = document.querySelector('#monthly-correction-series');
  const extrasList = document.querySelector('#extras-list');
  const extrasEmpty = document.querySelector('#extras-empty');
  const extraTemplate = document.querySelector('#extra-template');
  const formAlert = document.querySelector('#form-alert');
  const results = document.querySelector('#results');
  const printReportRoot = document.querySelector('#print-report-root');
  const simulationWarning = document.querySelector('#simulation-warning');
  const printParametersBody = document.querySelector('#print-parameters-body');
  const printSummaryBody = document.querySelector('#print-summary-body');
  const summaryGrid = document.querySelector('#summary-grid');
  const summaryDetailBody = document.querySelector('#summary-detail-body');
  const projectionNote = document.querySelector('#projection-note');
  const chartCanvases = {
    debt: document.querySelector('#debt-chart'),
    payment: document.querySelector('#payment-chart'),
    composition: document.querySelector('#composition-chart'),
    costs: document.querySelector('#costs-chart'),
  };
  const comparisonBody = document.querySelector('#comparison-body');
  const tableEmpty = document.querySelector('#table-empty');
  const tableContent = document.querySelector('#table-content');
  const installmentsBody = document.querySelector('#installments-body');
  const installmentFilter = document.querySelector('#installment-filter');
  const goToInstallment = document.querySelector('#go-to-installment');
  const pageSizeSelect = document.querySelector('#page-size');
  const pageStatus = document.querySelector('#page-status');
  const previousPage = document.querySelector('#previous-page');
  const nextPage = document.querySelector('#next-page');

  let extraSequence = 0;
  let simulatedRows = [];
  let currentPage = 1;
  let autoCalculationTimer = null;
  let hasCalculated = false;
  let charts = {};
  let isPreparingPrint = false;
  let currentComparison = null;
  let currentConfig = null;
  let printCleanupTimer = null;
  let currentTrReferenceInfo = null;

  function t(key, params) {
    return i18n.t(key, params);
  }

  function formatCurrency(cents) {
    return i18n.formatCurrency(cents);
  }

  function formatSignedCurrency(cents) {
    if (cents === 0) return formatCurrency(0);
    return `${cents > 0 ? '+' : '−'} ${formatCurrency(Math.abs(cents))}`;
  }

  function formatDate(isoDate) {
    return i18n.formatDate(isoDate);
  }

  function formatPercent(value) {
    return i18n.formatPercent(value);
  }

  function formatMonths(count) {
    return `${count} ${t(count === 1 ? 'unit.month' : 'unit.months')}`;
  }

  function formatRateInput(ratePercent) {
    return i18n.formatRatePercent(ratePercent, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  function formatInterestRateInput(ratePercent) {
    return i18n.formatRatePercent(ratePercent, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  function formatTrMonth(month) {
    return i18n.formatMonth(month);
  }

  function validateTrData(data) {
    const rates = data?.rates;
    return Boolean(
      Array.isArray(rates)
      && rates.length > 0
      && rates.every((rate) => (
        typeof rate.month === 'string'
        && typeof rate.date === 'string'
        && Number.isFinite(rate.ratePercent)
        && rate.ratePercent >= 0
      )),
    );
  }

  function validateTrReference(reference) {
    return Boolean(
      reference
      && Number.isFinite(reference.ratePercent)
      && reference.ratePercent >= 0
      && typeof reference.startMonth === 'string'
      && typeof reference.endMonth === 'string'
      && typeof reference.selectedMonth === 'string'
      && Number.isInteger(reference.months)
      && reference.months > 0
    );
  }

  function parseSelicRate(data) {
    const latest = data?.latest;
    const ratePercent = latest?.ratePercent;
    if (!Number.isFinite(ratePercent) || ratePercent < 0 || typeof latest?.date !== 'string') return null;
    return {
      date: latest.date,
      ratePercent,
    };
  }

  function nextLocalMidnightIso() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  }

  function readSelicCache() {
    let cache;
    try {
      cache = JSON.parse(window.localStorage.getItem(SELIC_CACHE_KEY));
    } catch (error) {
      return null;
    }

    if (
      !cache
      || cache.version !== 1
      || !Number.isFinite(cache.ratePercent)
      || cache.ratePercent < 0
      || typeof cache.expiresAt !== 'string'
      || Date.parse(cache.expiresAt) <= Date.now()
    ) {
      return null;
    }

    return cache;
  }

  function writeSelicCache(selic) {
    try {
      window.localStorage.setItem(SELIC_CACHE_KEY, JSON.stringify({
        version: 1,
        ratePercent: selic.ratePercent,
        sourceDate: selic.date,
        fetchedAt: new Date().toISOString(),
        expiresAt: nextLocalMidnightIso(),
      }));
    } catch (error) {
      // The simulator remains fully functional when storage is unavailable.
    }
  }

  function readTrCache() {
    let cache;
    try {
      cache = JSON.parse(window.localStorage.getItem(TR_CACHE_KEY));
    } catch (error) {
      return null;
    }

    if (
      !cache
      || cache.version !== 2
      || !validateTrReference(cache.reference)
      || typeof cache.expiresAt !== 'string'
      || Date.parse(cache.expiresAt) <= Date.now()
    ) {
      return null;
    }

    return cache;
  }

  function writeTrCache({ reference, generatedAt, sourceUrl }) {
    try {
      window.localStorage.setItem(TR_CACHE_KEY, JSON.stringify({
        version: 2,
        reference,
        generatedAt: typeof generatedAt === 'string' ? generatedAt : '',
        sourceUrl: typeof sourceUrl === 'string' ? sourceUrl : '',
        fetchedAt: new Date().toISOString(),
        expiresAt: nextLocalMidnightIso(),
      }));
    } catch (error) {
      // The simulator remains fully functional when storage is unavailable.
    }
  }

  function highestRecentTrRate(rates, months = 12) {
    const recentRates = [...rates]
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-months);
    const selectedRate = recentRates.reduce((highest, rate) => (
      rate.ratePercent > highest.ratePercent ? rate : highest
    ), recentRates[0]);
    return {
      ratePercent: selectedRate.ratePercent,
      startMonth: recentRates[0].month,
      endMonth: recentRates.at(-1).month,
      selectedMonth: selectedRate.month,
      months: recentRates.length,
    };
  }

  function setTooltipText(element, message) {
    if (!element) return;
    element.setAttribute('data-bs-title', message);
    element.setAttribute('title', message);
    element.setAttribute('aria-label', message);

    const tooltip = window.bootstrap?.Tooltip?.getOrCreateInstance(element);
    if (tooltip?.setContent) {
      tooltip.setContent({ '.tooltip-inner': message });
    }
  }

  function setTrReferenceHelp(reference, generatedAt) {
    currentTrReferenceInfo = { reference, generatedAt };
    const rateText = formatRateInput(reference.ratePercent);
    const periodText = reference.startMonth === reference.endMonth
      ? formatTrMonth(reference.endMonth)
      : `${formatTrMonth(reference.startMonth)} ${t('common.rangeSeparator')} ${formatTrMonth(reference.endMonth)}`;
    const updatedText = typeof generatedAt === 'string' ? t('tr.updatedAt', { date: formatDate(generatedAt.slice(0, 10)) }) : '';
    const message = t('tr.highestTooltip', {
      months: reference.months,
      period: periodText,
      selectedMonth: formatTrMonth(reference.selectedMonth),
      rate: rateText,
      updated: updatedText,
    });
    setTooltipText(trAverageInfoButton, message);
    monthlyCorrectionRateHelp.textContent = '';
  }

  function parseCurrencyToCents(rawValue) {
    const value = i18n.parseLocalizedNumber(rawValue);
    return Number.isFinite(value) ? Math.round(value * 100) : Number.NaN;
  }

  function parseDecimal(rawValue) {
    const value = i18n.parseLocalizedNumber(rawValue);
    return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
  }

  function parseCorrectionSeries(rawValue) {
    const value = String(rawValue).trim();
    if (!value) return null;
    const tokenPattern = /\d+(?:[,.]\d+)?/g;
    const tokens = value.match(tokenPattern) || [];
    const leftover = value.replace(tokenPattern, '').replace(/[\s,;]+/g, '');
    if (tokens.length === 0 || leftover) return null;
    const rates = tokens.map((token) => parseDecimal(token) / 100);
    return rates.every(Number.isFinite) ? rates : null;
  }

  function formatMoneyInput(input) {
    const cents = parseCurrencyToCents(input.value);
    if (Number.isFinite(cents)) input.value = i18n.formatNumber(cents / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatMoneyWhileTyping(input, event) {
    const storedDigits = input.dataset.moneyDigits;
    const insertedDigits = String(event.data ?? '').replace(/\D/g, '');
    const replacingAll = input.dataset.replaceMoneyDigits === 'true';
    let digits;

    if (storedDigits !== undefined && event.inputType?.startsWith('delete')) {
      digits = replacingAll ? '' : storedDigits.slice(0, -1);
    } else if (storedDigits !== undefined && insertedDigits) {
      digits = `${replacingAll ? '' : storedDigits}${insertedDigits}`;
    } else {
      digits = input.value.replace(/\D/g, '');
    }

    delete input.dataset.replaceMoneyDigits;
    digits = digits.replace(/^0+(?=\d)/, '').slice(0, 15);
    input.dataset.moneyDigits = digits;

    if (!digits) {
      input.value = '';
      return;
    }

    input.value = i18n.formatNumber(Number(digits) / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach((field) => {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    });
    document.querySelectorAll('.invalid-feedback').forEach((message) => { message.textContent = ''; });
    formAlert.classList.add('d-none');
    formAlert.textContent = '';
  }

  function setFieldError(field, message, errorElement) {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    if (errorElement) errorElement.textContent = message;
  }

  function showGeneralError(message) {
    formAlert.textContent = message;
    formAlert.classList.remove('d-none');
  }

  function setText(selector, key, root = document) {
    const element = root.querySelector(selector);
    if (element) element.textContent = t(key);
  }

  function setAttr(selector, attribute, key, root = document) {
    const element = root.querySelector(selector);
    if (element) element.setAttribute(attribute, t(key));
  }

  function setRequiredLabel(selector, key) {
    const element = document.querySelector(selector);
    if (!element) return;
    element.innerHTML = `${escapeHtml(t(key))} <span class="required-marker" aria-hidden="true">*</span>`;
  }

  function setOptionText(selector, value, key, root = document) {
    const option = root.querySelector(`${selector} option[value="${value}"]`);
    if (option) option.textContent = t(key);
  }

  function updateSelectOptions() {
    setOptionText('#language-select', 'pt-BR', 'language.pt-BR');
    setOptionText('#language-select', 'en', 'language.en');
    setOptionText('#language-select', 'es', 'language.es');
    setOptionText('#rate-period', 'annual', 'option.rateAnnual');
    setOptionText('#rate-period', 'monthly', 'option.rateMonthly');
    setOptionText('#annual-rate-type', 'effective', 'option.annualEffective');
    setOptionText('#annual-rate-type', 'nominal', 'option.annualNominal');
    setOptionText('#correction-mode', 'fixed', 'option.correctionFixed');
    setOptionText('#correction-mode', 'custom', 'option.correctionCustom');
    setOptionText('#correction-mode', 'none', 'option.correctionNone');
    setOptionText('#system', 'sac', 'option.systemSac');
    setOptionText('#system', 'price', 'option.systemPrice');
    setOptionText('#installment-filter', 'all', 'installments.filterAll');
    setOptionText('#installment-filter', 'extras', 'installments.filterExtras');
    setOptionText('#page-size', 'all', 'installments.pageSizeAll');
  }

  function translateExtraCard(card) {
    setText('.extra-card-header h3', 'extras.cardTitle', card);
    setText('[data-action="remove-extra"]', 'extras.remove', card);

    const labelKeys = {
      type: 'extras.type',
      value: 'extras.value',
      month: 'extras.month',
      startMonth: 'extras.startMonth',
      frequency: 'extras.frequency',
      customFrequency: 'extras.customFrequency',
      endMonth: 'extras.endMonth',
      goal: 'extras.goal',
    };
    Object.entries(labelKeys).forEach(([name, key]) => {
      const label = card.querySelector(`[data-label="${name}"]`);
      if (label) label.textContent = t(key);
    });

    const typeSelect = card.querySelector('[data-field="type"]');
    if (typeSelect) {
      typeSelect.querySelector('option[value="single"]').textContent = t('extras.typeSingle');
      typeSelect.querySelector('option[value="recurring"]').textContent = t('extras.typeRecurring');
    }

    const frequencySelect = card.querySelector('[data-field="frequency"]');
    if (frequencySelect) {
      ['1', '2', '3', '6', '12'].forEach((value) => {
        frequencySelect.querySelector(`option[value="${value}"]`).textContent = t(`extras.frequency${value}`);
      });
      frequencySelect.querySelector('option[value="custom"]').textContent = t('extras.frequencyCustom');
    }

    const goalSelect = card.querySelector('[data-field="goal"]');
    if (goalSelect) {
      goalSelect.querySelector('option[value="term"]').textContent = t('extras.goalTerm');
      goalSelect.querySelector('option[value="payment"]').textContent = t('extras.goalPayment');
    }

    const valueInput = card.querySelector('[data-field="value"]');
    if (valueInput) valueInput.setAttribute('placeholder', moneyPlaceholder());
    const customFrequencyUnit = card.querySelector('.custom-frequency-field .input-group-text');
    if (customFrequencyUnit) customFrequencyUnit.textContent = t('unit.months');
  }

  function installmentColumnKeys() {
    return [
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
    ];
  }

  function updateInstallmentTableHeader() {
    const headerCells = document.querySelectorAll('.installments-table thead tr:last-child th');
    const keys = installmentColumnKeys();
    headerCells.forEach((cell, index) => {
      cell.textContent = t(keys[index]);
      if (keys[index] === 'installments.col.regularAmortization') {
        cell.setAttribute('title', t('installments.regularAmortizationTitle'));
      }
    });
  }

  function reinitializeTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      window.bootstrap?.Tooltip?.getInstance(element)?.dispose();
      window.bootstrap?.Tooltip?.getOrCreateInstance(element);
    });
  }

  function moneyPlaceholder() {
    return i18n.formatNumber(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function applyStaticTranslations() {
    i18n.setLanguage(i18n.getLanguage());
    if (languageSelect) languageSelect.value = i18n.getLanguage();

    setText('.site-header .eyebrow', 'header.eyebrow');
    setText('.site-header h1', 'header.title');
    setText('.site-header .lead', 'header.lead');
    setText('.language-switcher label', 'language.label');
    setAttr('#language-select', 'aria-label', 'language.label');
    setText('#financing-title', 'config.title');
    setText('[aria-labelledby="financing-title"] .section-kicker', 'config.kicker');
    setText('#reset-form', 'config.reset');
    setText('#privacy-notice-title', 'privacyNotice.title');
    setText('#privacy-notice-text', 'privacyNotice.text');
    setAttr('#privacy-notice-dismiss', 'aria-label', 'privacyNotice.dismissAria');
    setText('#footer-copyright', 'footer.copyright');
    setText('#footer-privacy-link', 'footer.privacy');
    setRequiredLabel('label[for="financed-value"]', 'form.financedValue');
    setRequiredLabel('label[for="term"]', 'form.term');
    setRequiredLabel('label[for="interest-rate"]', 'form.interestRate');
    setText('label[for="rate-period"]', 'form.ratePeriod');
    setText('label[for="annual-rate-type"]', 'form.annualRateType');
    setText('label[for="monthly-extra-cost"]', 'form.monthlyExtraCost');
    setText('#monthly-extra-cost-help', 'form.monthlyExtraCostHelp');
    setText('label[for="correction-mode"]', 'form.correctionMode');
    setText('label[for="monthly-correction-rate"]', 'form.monthlyCorrectionRate');
    setText('#use-latest-tr', 'form.useTr12m');
    setText('#fixed-correction-field a.small', 'form.viewTr');
    setText('label[for="first-due-date"]', 'form.firstDueDate');
    setText('label[for="system"]', 'form.system');
    setText('label[for="monthly-correction-series"]', 'form.customSeries');
    setText('#monthly-correction-series-help', 'form.customSeriesHelp');
    setAttr('#monthly-correction-series', 'placeholder', 'form.customSeriesPlaceholder');
    setAttr('#system + .form-select', 'aria-label', 'form.system');
    setAttr('[data-bs-target="#system-info-modal"]', 'aria-label', 'form.systemInfoAria');
    document.querySelector('#financed-value')?.setAttribute('placeholder', moneyPlaceholder());
    document.querySelector('#monthly-extra-cost')?.setAttribute('placeholder', moneyPlaceholder());
    document.querySelector('#monthly-correction-rate')?.setAttribute('placeholder', moneyPlaceholder());
    const termUnit = document.querySelector('#term + .input-group-text');
    if (termUnit) termUnit.textContent = t('unit.months');

    setText('#extras-title', 'extras.title');
    setText('[aria-labelledby="extras-title"] .section-kicker', 'extras.kicker');
    setText('[aria-labelledby="extras-title"] .section-description', 'extras.description');
    setText('#add-extra', 'extras.add');
    setText('#extras-empty p', 'extras.empty');

    setAttr('#results .print-report-header', 'aria-label', 'print.reportHeaderLabel');
    setText('.print-report-header h2', 'print.brandTitle');
    setText('#print-parameters .section-kicker', 'print.parametersKicker');
    setText('#print-parameters-title', 'print.parametersTitle');
    setText('#summary-title', 'results.title');
    setText('[aria-labelledby="summary-title"] .section-kicker', 'results.kicker');
    setText('#summary-detail-title', 'summary.detailsTitle');
    setText('[aria-labelledby="summary-detail-title"] .section-kicker', 'results.kicker');
    const summaryDetailHeaders = document.querySelectorAll('#summary-detail-table thead th');
    ['comparison.indicator', 'summary.value', 'comparison.indicator', 'summary.value'].forEach((key, index) => {
      if (summaryDetailHeaders[index]) summaryDetailHeaders[index].textContent = t(key);
    });
    setText('#export-pdf', 'results.exportPdf');
    setText('#projection-note', 'results.projectionNote');

    setText('#charts-title', 'charts.title');
    setText('[aria-labelledby="charts-title"] .section-kicker', 'charts.kicker');
    setText('.chart-panel:nth-child(1) h3', 'charts.debtTitle');
    setText('.chart-panel:nth-child(2) h3', 'charts.compositionTitle');
    setText('.chart-panel:nth-child(3) h3', 'charts.paymentTitle');
    setText('.chart-panel:nth-child(4) h3', 'charts.costsTitle');
    setAttr('#debt-chart', 'aria-label', 'charts.debtAria');
    setAttr('#payment-chart', 'aria-label', 'charts.paymentAria');
    setAttr('#composition-chart', 'aria-label', 'charts.compositionAria');
    setAttr('#costs-chart', 'aria-label', 'charts.costsAria');

    setText('#comparison-title', 'comparison.title');
    setText('[aria-labelledby="comparison-title"] .section-kicker', 'comparison.kicker');
    const comparisonHeaders = document.querySelectorAll('[aria-labelledby="comparison-title"] .comparison-table thead th');
    ['comparison.indicator', 'comparison.withoutExtras', 'comparison.withExtras', 'comparison.difference'].forEach((key, index) => {
      if (comparisonHeaders[index]) comparisonHeaders[index].textContent = t(key);
    });

    setText('#installments-title', 'installments.title');
    setText('[aria-labelledby="installments-title"] .section-kicker', 'installments.kicker');
    setText('label[for="installment-filter"]', 'installments.show');
    setText('label[for="go-to-installment"]', 'installments.goTo');
    setText('#go-button', 'installments.go');
    setText('label[for="page-size"]', 'installments.pageSize');
    setAttr('.installments-table-wrap', 'aria-label', 'installments.tableAria');
    setAttr('.pagination-bar .btn-group', 'aria-label', 'installments.paginationAria');
    setText('#previous-page', 'installments.previous');
    setText('#next-page', 'installments.next');
    tableEmpty.textContent = hasCalculated ? t('installments.emptyStale') : t('installments.emptyPrompt');
    setText('.print-table-brand span:last-child', 'print.brandTitle');
    setText('.print-table-title-row .section-kicker', 'installments.kicker');
    setText('.print-table-title', 'installments.title');
    updateInstallmentTableHeader();

    const notice = document.querySelector('.estimate-notice');
    if (notice) {
      notice.setAttribute('aria-label', t('notice.aria'));
      notice.innerHTML = `<strong>${escapeHtml(t('notice.strong'))}</strong> ${escapeHtml(t('notice.text'))}`;
    }

    setText('#system-info-title', 'modal.title');
    setAttr('#system-info-modal .btn-close', 'aria-label', 'modal.close');
    setText('#system-info-modal .modal-body h3:nth-of-type(1)', 'modal.sacTitle');
    setText('#system-info-modal .modal-body p:nth-of-type(1)', 'modal.sacBody');
    setText('#system-info-modal .modal-body h3:nth-of-type(2)', 'modal.priceTitle');
    setText('#system-info-modal .modal-body p:nth-of-type(2)', 'modal.priceBody');
    setText('#system-info-modal .modal-body p:nth-of-type(3)', 'modal.note');
    setText('#system-info-modal .modal-footer .btn', 'modal.ok');

    updateSelectOptions();
    extrasList.querySelectorAll('[data-extra-card]').forEach(translateExtraCard);

    if (currentTrReferenceInfo) {
      setTrReferenceHelp(currentTrReferenceInfo.reference, currentTrReferenceInfo.generatedAt);
    } else {
      setTooltipText(trAverageInfoButton, t('form.trInfoDefault'));
    }
    updateCorrectionRateHelp();
    reinitializeTooltips();
  }

  function updateRatePeriod() {
    annualRateTypeField.classList.toggle('d-none', ratePeriodInput.value !== 'annual');
    updateAnnualRateTypeHelp();
  }

  function updateAnnualRateTypeHelp() {
    annualRateTypeHelp.textContent = '';
  }

  function updateCorrectionFields() {
    fixedCorrectionField.classList.toggle('d-none', correctionModeInput.value !== 'fixed');
    customCorrectionField.classList.toggle('d-none', correctionModeInput.value !== 'custom');
    updateCorrectionRateHelp();
  }

  function updateCorrectionRateHelp() {
    if (correctionModeInput.value !== 'fixed') return;
    const monthlyCorrectionPercent = parseDecimal(monthlyCorrectionRateInput.value);
    if (!Number.isFinite(monthlyCorrectionPercent) || monthlyCorrectionPercent < 0) {
      monthlyCorrectionRateHelp.textContent = t('form.monthlyCorrectionHelp');
      return;
    }
    const annualEquivalent = (Math.pow(1 + monthlyCorrectionPercent / 100, 12) - 1) * 100;
    monthlyCorrectionRateHelp.textContent = t('form.monthlyCorrectionEquivalent', {
      monthly: formatRateInput(monthlyCorrectionPercent),
      annual: formatRateInput(annualEquivalent),
    });
  }

  function assignExtraFieldIds(card, id) {
    card.dataset.extraId = id;
    card.querySelector('.extra-number').textContent = id;
    card.querySelectorAll('[data-field]').forEach((field) => {
      const name = field.dataset.field;
      if (name === 'goal') {
        field.name = `extra-${id}-goal`;
        field.id = `extra-${id}-goal-${field.value}`;
        return;
      }
      field.id = `extra-${id}-${name}`;
      const label = card.querySelector(`[data-label="${name}"]`);
      if (label) label.htmlFor = field.id;
      const error = card.querySelector(`[data-error="${name}"]`);
      if (error) {
        error.id = `${field.id}-error`;
        field.setAttribute('aria-describedby', error.id);
      }
    });
  }

  function updateExtraVisibility(card) {
    const recurring = card.querySelector('[data-field="type"]').value === 'recurring';
    card.querySelectorAll('.single-fields').forEach((element) => element.classList.toggle('d-none', recurring));
    card.querySelectorAll('.recurring-fields').forEach((element) => element.classList.toggle('d-none', !recurring));
    const custom = recurring && card.querySelector('[data-field="frequency"]').value === 'custom';
    card.querySelector('.custom-frequency-field').classList.toggle('d-none', !custom);
  }

  function updateExtrasEmptyState() {
    extrasEmpty.classList.toggle('d-none', Boolean(extrasList.children.length));
  }

  function syncMoneyDigits(input) {
    const cents = parseCurrencyToCents(input.value);
    input.dataset.moneyDigits = Number.isFinite(cents) ? String(cents) : '';
  }

  function clearMoneyDigits(input) {
    delete input.dataset.moneyDigits;
    delete input.dataset.replaceMoneyDigits;
  }

  function setFirstDueDateToToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    firstDueDateInput.value = `${year}-${month}-${day}`;
  }

  function setDefaultFinancedValue() {
    financedValueInput.value = i18n.formatNumber(1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    syncMoneyDigits(financedValueInput);
  }

  function applySelicToInterestField(selic) {
    ratePeriodInput.value = 'annual';
    annualRateTypeInput.value = 'effective';
    updateRatePeriod();
    interestRateInput.value = formatInterestRateInput(selic.ratePercent);
    interestRateInput.classList.remove('is-invalid');
    interestRateInput.removeAttribute('aria-invalid');
    document.querySelector('#interest-rate-error').textContent = '';
  }

  function applyTrReferenceToCorrectionField(reference, generatedAt) {
    correctionModeInput.value = 'fixed';
    updateCorrectionFields();
    monthlyCorrectionRateInput.value = formatRateInput(reference.ratePercent);
    monthlyCorrectionRateInput.classList.remove('is-invalid');
    monthlyCorrectionRateInput.removeAttribute('aria-invalid');
    document.querySelector('#monthly-correction-rate-error').textContent = '';
    setTrReferenceHelp(reference, generatedAt);
  }

  function addExtraPayment(initialValues = null, { focus = true, schedule = true } = {}) {
    extraSequence += 1;
    const fragment = extraTemplate.content.cloneNode(true);
    const card = fragment.querySelector('[data-extra-card]');
    assignExtraFieldIds(card, extraSequence);
    translateExtraCard(card);
    extrasList.append(fragment);

    if (initialValues) {
      const field = (name) => card.querySelector(`[data-field="${name}"]`);
      field('type').value = initialValues.type === 'recurring' ? 'recurring' : 'single';
      field('value').value = typeof initialValues.value === 'string' ? initialValues.value : '';
      syncMoneyDigits(field('value'));
      field('month').value = initialValues.month ?? '';
      field('startMonth').value = initialValues.startMonth ?? '';
      field('endMonth').value = initialValues.endMonth ?? '';
      field('frequency').value = ['1', '2', '3', '6', '12', 'custom'].includes(initialValues.frequency) ? initialValues.frequency : '1';
      field('customFrequency').value = initialValues.customFrequency ?? '';
      field('goal').value = initialValues.goal === 'payment' ? 'payment' : 'term';
    }

    updateExtraVisibility(card);
    updateExtrasEmptyState();
    if (focus) card.querySelector('[data-field="value"]').focus();
    if (schedule) scheduleAutomaticCalculation();
    return card;
  }

  function captureFormState() {
    return {
      version: 1,
      financedValue: financedValueInput.value,
      monthlyExtraCost: monthlyExtraCostInput.value,
      term: termInput.value,
      interestRate: interestRateInput.value,
      ratePeriod: ratePeriodInput.value,
      annualRateType: annualRateTypeInput.value,
      firstDueDate: firstDueDateInput.value,
      correctionMode: correctionModeInput.value,
      monthlyCorrectionRate: monthlyCorrectionRateInput.value,
      monthlyCorrectionSeries: monthlyCorrectionSeriesInput.value,
      system: form.elements.system.value,
      extraPayments: [...extrasList.querySelectorAll('[data-extra-card]')].map((card) => {
        const field = (name) => card.querySelector(`[data-field="${name}"]`);
        return {
          type: field('type').value,
          value: field('value').value,
          month: field('month').value,
          startMonth: field('startMonth').value,
          endMonth: field('endMonth').value,
          frequency: field('frequency').value,
          customFrequency: field('customFrequency').value,
          goal: field('goal').value,
        };
      }),
    };
  }

  function persistFormState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(captureFormState()));
    } catch (error) {
      // The simulator remains fully functional when storage is unavailable.
    }
  }

  function isPrivacyNoticeDismissed() {
    try {
      return window.localStorage.getItem(PRIVACY_NOTICE_STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function dismissPrivacyNotice() {
    privacyNotice?.classList.add('d-none');
    try {
      window.localStorage.setItem(PRIVACY_NOTICE_STORAGE_KEY, 'true');
    } catch (error) {
      // The notice remains dismissed for the current page when storage is unavailable.
    }
  }

  function clearPersistedFormState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // The simulator remains fully functional when storage is unavailable.
    }
  }

  function restoreFormState() {
    let state;
    try {
      state = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return false;
    }
    if (!state || state.version !== 1) return false;

    financedValueInput.value = typeof state.financedValue === 'string' ? state.financedValue : '';
    syncMoneyDigits(financedValueInput);
    monthlyExtraCostInput.value = typeof state.monthlyExtraCost === 'string' ? state.monthlyExtraCost : '';
    syncMoneyDigits(monthlyExtraCostInput);
    termInput.value = typeof state.term === 'string' ? state.term : '360';
    interestRateInput.value = typeof state.interestRate === 'string' ? state.interestRate : '';
    ratePeriodInput.value = state.ratePeriod === 'monthly' ? 'monthly' : 'annual';
    annualRateTypeInput.value = state.annualRateType === 'nominal' ? 'nominal' : 'effective';
    firstDueDateInput.value = typeof state.firstDueDate === 'string' ? state.firstDueDate : '';
    correctionModeInput.value = ['none', 'fixed', 'custom'].includes(state.correctionMode) ? state.correctionMode : 'none';
    monthlyCorrectionRateInput.value = typeof state.monthlyCorrectionRate === 'string' ? state.monthlyCorrectionRate : '';
    monthlyCorrectionSeriesInput.value = typeof state.monthlyCorrectionSeries === 'string' ? state.monthlyCorrectionSeries : '';
    const system = state.system === 'price' ? 'price' : 'sac';
    form.elements.system.value = system;

    if (Array.isArray(state.extraPayments)) {
      state.extraPayments.slice(0, 100).forEach((extraPayment) => {
        if (extraPayment && typeof extraPayment === 'object') {
          addExtraPayment(extraPayment, { focus: false, schedule: false });
        }
      });
    }
    return true;
  }

  function readExtraPayments(term, errors, showErrors) {
    return [...extrasList.querySelectorAll('[data-extra-card]')].map((card) => {
      const field = (name) => card.querySelector(`[data-field="${name}"]`);
      const error = (name) => card.querySelector(`[data-error="${name}"]`);
      const addError = (target, message, errorElement) => {
        if (showErrors) setFieldError(target, message, errorElement);
        errors.push(target);
      };
      const type = field('type').value;
      const valueCents = parseCurrencyToCents(field('value').value);
      const goal = field('goal').value;

      if (!Number.isFinite(valueCents) || valueCents <= 0) {
        addError(field('value'), t('validation.positiveValue'), error('value'));
      }

      if (type === 'single') {
        const month = Number(field('month').value);
        if (!Number.isInteger(month) || month < 1 || month > term) {
          addError(field('month'), t('validation.monthBetween', { term: term || 600 }), error('month'));
        }
        return { id: card.dataset.extraId, type, valueCents, goal, month };
      }

      const startMonth = Number(field('startMonth').value);
      const rawEndMonth = field('endMonth').value;
      const endMonth = rawEndMonth === '' ? null : Number(rawEndMonth);
      const frequency = field('frequency').value === 'custom' ? Number(field('customFrequency').value) : Number(field('frequency').value);

      if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > term) {
        addError(field('startMonth'), t('validation.monthBetween', { term: term || 600 }), error('startMonth'));
      }
      if (endMonth !== null && (!Number.isInteger(endMonth) || endMonth < startMonth || endMonth > term)) {
        addError(field('endMonth'), t('validation.monthBetweenStart', { term: term || 600 }), error('endMonth'));
      }
      if (!Number.isInteger(frequency) || frequency < 1) {
        const frequencyField = field('frequency').value === 'custom' ? field('customFrequency') : field('frequency');
        addError(frequencyField, t('validation.frequency'), error('customFrequency'));
      }

      return { id: card.dataset.extraId, type, valueCents, goal, startMonth, endMonth, frequency };
    });
  }

  function readConfiguration({ showErrors = true, focusOnError = true } = {}) {
    if (showErrors) clearErrors();
    const errors = [];
    const addError = (field, message, errorElement) => {
      if (showErrors) setFieldError(field, message, errorElement);
      errors.push(field);
    };
    const financedCents = parseCurrencyToCents(financedValueInput.value);
    const monthlyExtraCostCents = monthlyExtraCostInput.value === '' ? 0 : parseCurrencyToCents(monthlyExtraCostInput.value);
    const term = Number(termInput.value);
    const ratePercent = parseDecimal(interestRateInput.value);
    const correctionMode = correctionModeInput.value;
    const monthlyCorrectionRatePercent = parseDecimal(monthlyCorrectionRateInput.value);
    const monthlyCorrectionRates = parseCorrectionSeries(monthlyCorrectionSeriesInput.value);

    if (!Number.isFinite(financedCents) || financedCents <= 0) {
      addError(financedValueInput, t('validation.financedValue'), document.querySelector('#financed-value-error'));
    }
    if (!Number.isFinite(monthlyExtraCostCents) || monthlyExtraCostCents < 0) {
      addError(monthlyExtraCostInput, t('validation.monthlyExtraCost'), document.querySelector('#monthly-extra-cost-error'));
    }
    if (!Number.isInteger(term) || term < 1 || term > 600) {
      addError(termInput, t('validation.term'), document.querySelector('#term-error'));
    }
    if (!Number.isFinite(ratePercent) || ratePercent < 0) {
      addError(interestRateInput, t('validation.rate'), document.querySelector('#interest-rate-error'));
    }
    if (correctionMode === 'fixed' && (!Number.isFinite(monthlyCorrectionRatePercent) || monthlyCorrectionRatePercent < 0)) {
      addError(monthlyCorrectionRateInput, t('validation.monthlyCorrection'), document.querySelector('#monthly-correction-rate-error'));
    }
    if (correctionMode === 'custom' && (!monthlyCorrectionRates || monthlyCorrectionRates.some((rate) => rate < 0))) {
      addError(monthlyCorrectionSeriesInput, t('validation.correctionSeries'), document.querySelector('#monthly-correction-series-error'));
    }

    const extraPayments = readExtraPayments(term, errors, showErrors);
    if (errors.length === 0) {
      const conflictMonth = finance.findGoalConflict(extraPayments, term);
      if (conflictMonth) {
        if (showErrors) showGeneralError(t('validation.extraGoalConflictWithMonth', { month: conflictMonth }));
        errors.push(formAlert);
      }
    }

    if (errors.length > 0) {
      if (showErrors) {
        if (formAlert.classList.contains('d-none')) showGeneralError(t('validation.reviewFields'));
        if (focusOnError) {
          const focusTarget = errors.find((item) => typeof item.focus === 'function');
          if (focusTarget) focusTarget.focus();
          else formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return null;
    }

    return {
      financedCents,
      monthlyExtraCostCents,
      term,
      system: form.elements.system.value,
      ratePercent,
      ratePeriod: ratePeriodInput.value,
      annualRateType: annualRateTypeInput.value,
      monthlyRate: finance.monthlyRateFromPercent(ratePercent, ratePeriodInput.value, annualRateTypeInput.value),
      firstDueDate: firstDueDateInput.value || null,
      correctionMode,
      monthlyCorrectionRate: correctionMode === 'fixed' ? monthlyCorrectionRatePercent / 100 : 0,
      monthlyCorrectionRates: correctionMode === 'custom' ? monthlyCorrectionRates : [],
      extraPayments,
    };
  }

  function summaryHighlightItems(stats) {
    return [
      [t('summary.initialTotalPayment'), formatCurrency(stats.initialTotalPaymentCents), 'primary'],
      [t('summary.finalTotalPayment'), formatCurrency(stats.finalTotalPaymentCents), ''],
      [t('summary.highestPayment'), formatCurrency(stats.highestPaymentCents), ''],
      [t('summary.totalPaid'), formatCurrency(stats.totalPaidCents), ''],
      [t('summary.effectiveTerm'), formatMonths(stats.effectiveTerm), ''],
      [t('summary.reducedMonths'), formatMonths(stats.reducedMonths), stats.reducedMonths > 0 ? 'positive' : ''],
      [t('summary.interestSavings'), formatCurrency(stats.interestSavingsCents), stats.interestSavingsCents > 0 ? 'positive' : ''],
      [t('summary.totalInterest'), formatCurrency(stats.totalInterestCents), ''],
    ];
  }

  function summaryDetailItems(stats) {
    return [
      [t('summary.initialPayment'), formatCurrency(stats.initialPaymentCents)],
      [t('summary.finalPayment'), formatCurrency(stats.finalPaymentCents)],
      [t('summary.averagePayment'), formatCurrency(stats.averagePaymentCents)],
      [t('summary.totalAmortized'), formatCurrency(stats.totalAmortizedCents)],
      [t('summary.totalCorrection'), formatCurrency(stats.totalCorrectionCents)],
      [t('summary.totalExtras'), formatCurrency(stats.totalExtraCents)],
      [t('summary.totalMonthlyExtraCosts'), formatCurrency(stats.totalMonthlyExtraCostsCents)],
      [t('summary.originalTerm'), formatMonths(stats.originalTerm)],
    ];
  }

  function summaryAllItems(stats) {
    return [...summaryHighlightItems(stats), ...summaryDetailItems(stats)];
  }

  function printSummaryItems(stats) {
    return summaryAllItems(stats).filter(([label]) => label !== t('summary.originalTerm'));
  }

  function renderSummary(stats) {
    if (stats.correctionAboveAmortizationMonth) {
      simulationWarning.textContent = t('results.warningCorrectionAbove', { month: stats.correctionAboveAmortizationMonth });
      simulationWarning.classList.remove('d-none');
    } else {
      simulationWarning.classList.add('d-none');
      simulationWarning.textContent = '';
    }

    const cards = summaryHighlightItems(stats);
    summaryGrid.innerHTML = cards.map(([label, value, variant]) => `<div class="col-6 col-lg-4 col-xl-3"><div class="stat-card ${variant}"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div></div>`).join('');
    summaryDetailBody.innerHTML = renderSummaryDetailRows(summaryDetailItems(stats));
    renderPrintKeyValueRows(printSummaryItems(stats), printSummaryBody, 3);
    projectionNote.classList.toggle('d-none', !(stats.totalCorrectionCents > 0 || stats.totalMonthlyExtraCostsCents > 0));
  }

  function renderSummaryDetailRows(items) {
    const rows = [];
    for (let index = 0; index < items.length; index += 2) {
      const first = items[index];
      const second = items[index + 1] || ['', ''];
      rows.push(`<tr><th scope="row">${escapeHtml(first[0])}</th><td>${escapeHtml(first[1])}</td><th scope="row">${escapeHtml(second[0])}</th><td>${escapeHtml(second[1])}</td></tr>`);
    }
    return rows.join('');
  }

  function comparisonRows(base, current) {
    const moneyRows = [
      [t('summary.totalInterest'), base.totalInterestCents, current.totalInterestCents],
      [t('summary.totalPaid'), base.totalPaidCents, current.totalPaidCents],
      [t('summary.initialPayment'), base.initialPaymentCents, current.initialPaymentCents],
      [t('summary.finalPayment'), base.finalPaymentCents, current.finalPaymentCents],
    ];
    const rows = moneyRows.map(([label, baseValue, currentValue]) => [
      label,
      formatCurrency(baseValue),
      formatCurrency(currentValue),
      formatSignedCurrency(currentValue - baseValue),
    ]);
    rows.splice(2, 0, [
      t('comparison.term'),
      formatMonths(base.effectiveTerm),
      formatMonths(current.effectiveTerm),
      formatMonths(current.effectiveTerm - base.effectiveTerm),
    ]);
    return rows;
  }

  function renderComparisonRows(rows) {
    return rows.map(([label, baseValue, currentValue, difference]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(baseValue)}</td><td>${escapeHtml(currentValue)}</td><td>${escapeHtml(difference)}</td></tr>`).join('');
  }

  function renderComparison(base, current) {
    comparisonBody.innerHTML = renderComparisonRows(comparisonRows(base, current));
  }

  function destroyCharts() {
    Object.values(charts).forEach((chart) => chart.destroy());
    charts = {};
  }

  function centsToReais(cents) {
    return Math.round(cents) / 100;
  }

  function chartLabel(month) {
    return month === 0 ? t('charts.initial') : String(month);
  }

  function rowForMonth(rows, month) {
    return rows.find((row) => row.number === month) || null;
  }

  function cumulativeValues(rows, field) {
    let total = 0;
    return rows.map((row) => {
      total += row[field];
      return centsToReais(total);
    });
  }

  function chartMoneyLabel(context, label = context.dataset.label) {
    const value = context.parsed.y ?? context.parsed;
    return `${label}: ${i18n.formatCurrency(Math.round(value * 100))}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function printParameterItems(config) {
    const ratePeriodLabel = config.ratePeriod === 'monthly' ? t('option.rateMonthly') : t('option.rateAnnual');
    const annualRateTypeLabel = config.annualRateType === 'nominal' ? t('option.annualNominal') : t('option.annualEffective');
    const systemLabel = config.system === 'price' ? t('option.systemPrice') : t('option.systemSac');
    const correctionLabel = (() => {
      if (config.correctionMode === 'none') return t('option.correctionNone');
      if (config.correctionMode === 'fixed') {
        const monthlyPercent = config.monthlyCorrectionRate * 100;
        const annualPercent = (Math.pow(1 + config.monthlyCorrectionRate, 12) - 1) * 100;
        return t('print.correctionFixed', {
          monthly: formatRateInput(monthlyPercent),
          annual: formatRateInput(annualPercent),
        });
      }
      return t('print.correctionCustom', { count: config.monthlyCorrectionRates.length });
    })();
    const extraPaymentsLabel = config.extraPayments.length === 1 ? t('print.extraRule') : t('print.extraRules', { count: config.extraPayments.length });
    return [
      [t('form.financedValue'), formatCurrency(config.financedCents)],
      [t('form.term'), formatMonths(config.term)],
      [t('form.interestRate'), `${formatInterestRateInput(config.ratePercent)}%`],
      [t('form.ratePeriod'), ratePeriodLabel],
      ...(config.ratePeriod === 'annual' ? [[t('form.annualRateType'), annualRateTypeLabel]] : []),
      [t('form.firstDueDate'), formatDate(config.firstDueDate)],
      [t('form.system'), systemLabel],
      [t('form.monthlyExtraCost'), formatCurrency(config.monthlyExtraCostCents)],
      [t('form.correctionMode'), correctionLabel],
      [t('extras.title'), extraPaymentsLabel],
    ];
  }

  function renderPrintParameters(config) {
    const items = printParameterItems(config);
    renderPrintKeyValueRows(items, printParametersBody, 3);
  }

  function clearPrintParameters() {
    printParametersBody.innerHTML = '';
  }

  function reformatFormValuesForCurrentLanguage() {
    [financedValueInput, monthlyExtraCostInput, ...extrasList.querySelectorAll('[data-field="value"]')].forEach((input) => {
      if (!input.value) return;
      formatMoneyInput(input);
      syncMoneyDigits(input);
    });

    const interestRate = parseDecimal(interestRateInput.value);
    if (Number.isFinite(interestRate)) interestRateInput.value = formatInterestRateInput(interestRate);

    const monthlyCorrectionRate = parseDecimal(monthlyCorrectionRateInput.value);
    if (Number.isFinite(monthlyCorrectionRate)) monthlyCorrectionRateInput.value = formatRateInput(monthlyCorrectionRate);

    const correctionRates = parseCorrectionSeries(monthlyCorrectionSeriesInput.value);
    if (correctionRates) {
      monthlyCorrectionSeriesInput.value = correctionRates.map((rate) => formatRateInput(rate * 100)).join('\n');
    }
  }

  function handleLanguageChange() {
    i18n.setLanguage(languageSelect.value);
    applyStaticTranslations();
    reformatFormValuesForCurrentLanguage();
    updateCorrectionRateHelp();
    persistFormState();
    if (hasCalculated) performCalculation({ automatic: true });
  }

  function renderKeyValueRowCells(items, start, pairsPerRow) {
    const cells = [];
    for (let offset = 0; offset < pairsPerRow; offset += 1) {
      const item = items[start + offset] || ['', ''];
      cells.push(`<th scope="row">${escapeHtml(item[0])}</th><td>${escapeHtml(item[1])}</td>`);
    }
    return cells.join('');
  }

  function renderPrintKeyValueRows(items, target, pairsPerRow = 2) {
    const rows = [];
    for (let index = 0; index < items.length; index += pairsPerRow) {
      rows.push(`<tr>${renderKeyValueRowCells(items, index, pairsPerRow)}</tr>`);
    }
    target.innerHTML = rows.join('');
  }

  function renderKeyValueRowsHtml(items, pairsPerRow = 2) {
    const rows = [];
    for (let index = 0; index < items.length; index += pairsPerRow) {
      rows.push(`<tr>${renderKeyValueRowCells(items, index, pairsPerRow)}</tr>`);
    }
    return rows.join('');
  }

  function commonChartOptions({ stacked = false, yTitle = t('charts.valueAxis'), staticImage = false } = {}) {
    return {
      responsive: !staticImage,
      maintainAspectRatio: false,
      animation: staticImage ? false : undefined,
      devicePixelRatio: staticImage ? 1 : undefined,
      events: staticImage ? [] : undefined,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12, boxHeight: 12 },
        },
        tooltip: staticImage
          ? { enabled: false }
          : {
            callbacks: {
              title: (items) => {
                const label = items[0]?.label;
                return label === t('charts.initial') ? t('charts.initialBalance') : t('charts.installmentTooltip', { number: label });
              },
              label: chartMoneyLabel,
            },
          },
      },
      scales: {
        x: {
          stacked,
          title: { display: true, text: t('charts.installmentAxis') },
          ticks: { maxTicksLimit: 12 },
          grid: { display: false },
        },
        y: {
          stacked,
          beginAtZero: true,
          title: { display: true, text: yTitle },
          ticks: { callback: (value) => i18n.formatCurrency(Math.round(value * 100)) },
        },
      },
    };
  }

  function chartOptionsForKey(key, { staticImage = false } = {}) {
    const options = {
      debt: () => commonChartOptions({ yTitle: t('charts.debtAxis'), staticImage }),
      payment: () => commonChartOptions({ yTitle: t('charts.paymentAxis'), staticImage }),
      composition: () => commonChartOptions({ stacked: true, yTitle: t('charts.compositionAxis'), staticImage }),
      costs: () => commonChartOptions({ yTitle: t('charts.costsAxis'), staticImage }),
    };
    return options[key]?.() || commonChartOptions({ staticImage });
  }

  function cloneChartData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function clearChartInteraction(chart) {
    if (!chart) return;
    chart.setActiveElements?.([]);
    chart.tooltip?.setActiveElements?.([], { x: 0, y: 0 });
    chart.update('none');
  }

  function createPrintChartImages() {
    if (!window.Chart) return [];

    return PRINT_CHART_ORDER.map((key) => {
      const chart = charts[key];
      const sourceCanvas = chartCanvases[key];
      if (!chart || !sourceCanvas) return null;

      clearChartInteraction(chart);

      const printCanvas = document.createElement('canvas');
      printCanvas.width = PRINT_CHART_WIDTH;
      printCanvas.height = PRINT_CHART_HEIGHT;
      const printChart = new window.Chart(printCanvas, {
        type: chart.config.type,
        data: cloneChartData(chart.data),
        options: chartOptionsForKey(key, { staticImage: true }),
      });

      printChart.update('none');
      const image = {
        key,
        title: t(`charts.${key}Title`),
        alt: sourceCanvas.getAttribute('aria-label') || '',
        src: printCanvas.toDataURL('image/png'),
      };

      printChart.destroy();
      return image;
    }).filter(Boolean);
  }

  function renderCharts(comparison) {
    if (!window.Chart) return;
    destroyCharts();

    const baseRows = comparison.base.installments;
    const currentRows = comparison.current.installments;
    const maxTerm = Math.max(baseRows.length, currentRows.length);
    const monthLabels = Array.from({ length: maxTerm }, (_, index) => String(index + 1));
    const debtLabels = Array.from({ length: maxTerm + 1 }, (_, index) => chartLabel(index));
    const color = {
      green: '#176b3a',
      greenSoft: 'rgba(23, 107, 58, 0.12)',
      blue: '#2563eb',
      blueSoft: 'rgba(37, 99, 235, 0.12)',
      amber: '#b45309',
      red: '#b42318',
      purple: '#7c3aed',
      slate: '#475467',
      teal: '#0f766e',
    };

    const baseDebt = [comparison.base.stats.financedCents, ...Array.from({ length: maxTerm }, (_, index) => {
      const row = rowForMonth(baseRows, index + 1);
      return row ? row.closingBalanceCents : 0;
    })].map(centsToReais);
    const currentDebt = [comparison.current.stats.financedCents, ...Array.from({ length: maxTerm }, (_, index) => {
      const row = rowForMonth(currentRows, index + 1);
      return row ? row.closingBalanceCents : 0;
    })].map(centsToReais);

    charts.debt = new window.Chart(chartCanvases.debt, {
      type: 'line',
      data: {
        labels: debtLabels,
        datasets: [
          { label: t('charts.debtWithoutExtras'), data: baseDebt, borderColor: color.slate, backgroundColor: 'rgba(71, 84, 103, 0.08)', borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
          { label: t('charts.debtWithExtras'), data: currentDebt, borderColor: color.green, backgroundColor: color.greenSoft, borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
        ],
      },
      options: chartOptionsForKey('debt'),
    });

    charts.payment = new window.Chart(chartCanvases.payment, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [
          { label: t('charts.paymentWithoutExtras'), data: monthLabels.map((_, index) => rowForMonth(baseRows, index + 1)?.totalPaymentCents ?? null).map((value) => value === null ? null : centsToReais(value)), borderColor: color.slate, borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
          { label: t('charts.paymentWithExtras'), data: monthLabels.map((_, index) => rowForMonth(currentRows, index + 1)?.totalPaymentCents ?? null).map((value) => value === null ? null : centsToReais(value)), borderColor: color.green, borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
          { label: t('charts.extraPayments'), data: monthLabels.map((_, index) => centsToReais(rowForMonth(currentRows, index + 1)?.extraPaymentCents ?? 0)), borderColor: color.amber, backgroundColor: 'rgba(180, 83, 9, 0.12)', borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
        ],
      },
      options: chartOptionsForKey('payment'),
    });

    charts.composition = new window.Chart(chartCanvases.composition, {
      type: 'bar',
      data: {
        labels: currentRows.map((row) => String(row.number)),
        datasets: [
          { label: t('charts.interest'), data: currentRows.map((row) => centsToReais(row.interestCents)), backgroundColor: color.red, stack: 'payment' },
          { label: t('charts.regularAmortization'), data: currentRows.map((row) => centsToReais(row.regularAmortizationCents)), backgroundColor: color.green, stack: 'payment' },
          { label: t('charts.correction'), data: currentRows.map((row) => centsToReais(row.correctionCents)), backgroundColor: color.purple, stack: 'payment' },
          { label: t('charts.extraAmortization'), data: currentRows.map((row) => centsToReais(row.extraPaymentCents)), backgroundColor: color.amber, stack: 'payment' },
          { label: t('charts.monthlyExtraCosts'), data: currentRows.map((row) => centsToReais(row.monthlyExtraCostCents)), backgroundColor: color.blue, stack: 'payment' },
        ],
      },
      options: chartOptionsForKey('composition'),
    });

    const totalPaidAccumulated = cumulativeValues(currentRows, 'totalPaymentCents');
    charts.costs = new window.Chart(chartCanvases.costs, {
      type: 'line',
      data: {
        labels: currentRows.map((row) => String(row.number)),
        datasets: [
          { label: t('charts.accumulatedInterest'), data: cumulativeValues(currentRows, 'interestCents'), borderColor: color.red, borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
          { label: t('charts.accumulatedCorrection'), data: cumulativeValues(currentRows, 'correctionCents'), borderColor: color.purple, borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
          { label: t('charts.accumulatedExtraCosts'), data: cumulativeValues(currentRows, 'monthlyExtraCostCents'), borderColor: color.blue, borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18 },
          { label: t('charts.accumulatedTotalPaid'), data: totalPaidAccumulated, borderColor: color.teal, backgroundColor: 'rgba(15, 118, 110, 0.1)', borderWidth: 2, pointRadius: 0, pointHitRadius: 8, tension: 0.18, fill: true },
        ],
      },
      options: chartOptionsForKey('costs'),
    });
  }

  function waitForPrintLayout() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  function filteredRows() {
    return installmentFilter.value === 'extras' ? simulatedRows.filter((row) => row.extraPaymentCents > 0) : simulatedRows;
  }

  function renderInstallments() {
    const rows = filteredRows();
    const pageSize = pageSizeSelect.value === 'all' ? Math.max(1, rows.length) : Number(pageSizeSelect.value);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    if (pageRows.length === 0) {
      installmentsBody.innerHTML = `<tr><td colspan="14" class="text-center text-secondary py-4">${t('installments.noRows')}</td></tr>`;
    } else {
      installmentsBody.innerHTML = pageRows.map((row) => {
        const goal = row.extraGoal === 'term' ? t('installments.goalTermShort') : row.extraGoal === 'payment' ? t('installments.goalPaymentShort') : '';
        return `<tr class="${row.extraPaymentCents > 0 ? 'has-extra' : ''}" data-installment="${row.number}"><th scope="row">${row.number}</th><td>${formatDate(row.dueDate)}</td><td>${formatCurrency(row.openingBalanceCents)}</td><td>${formatPercent(row.correctionRate)}</td><td>${formatCurrency(row.correctionCents)}</td><td>${formatCurrency(row.correctedBalanceCents)}</td><td>${formatCurrency(row.interestCents)}</td><td>${formatCurrency(row.regularAmortizationCents)}</td><td>${formatCurrency(row.regularPaymentCents)}</td><td>${formatCurrency(row.extraPaymentCents)}</td><td>${formatCurrency(row.monthlyExtraCostCents)}</td><td><strong>${formatCurrency(row.totalPaymentCents)}</strong></td><td>${formatCurrency(row.closingBalanceCents)}</td><td>${goal ? `<span class="badge goal-badge">${goal}</span>` : ''}</td></tr>`;
      }).join('');
    }

    const shownStart = rows.length ? start + 1 : 0;
    const shownEnd = Math.min(start + pageRows.length, rows.length);
    pageStatus.textContent = t('installments.pageStatus', { start: shownStart, end: shownEnd, total: rows.length });
    previousPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
  }

  function installmentGoalLabel(row) {
    if (row.extraGoal === 'term') return t('installments.goalTermShort');
    if (row.extraGoal === 'payment') return t('installments.goalPaymentShort');
    return '';
  }

  function installmentRowHtml(row) {
    const goal = installmentGoalLabel(row);
    const cells = [
      row.number,
      formatDate(row.dueDate),
      formatCurrency(row.openingBalanceCents),
      formatPercent(row.correctionRate),
      formatCurrency(row.correctionCents),
      formatCurrency(row.correctedBalanceCents),
      formatCurrency(row.interestCents),
      formatCurrency(row.regularAmortizationCents),
      formatCurrency(row.regularPaymentCents),
      formatCurrency(row.extraPaymentCents),
      formatCurrency(row.monthlyExtraCostCents),
      formatCurrency(row.totalPaymentCents),
      formatCurrency(row.closingBalanceCents),
      goal,
    ];
    return `<tr class="${row.extraPaymentCents > 0 ? 'has-extra' : ''}"><th scope="row">${escapeHtml(cells[0])}</th>${cells.slice(1).map((cell, index) => (index === 10 ? `<td><strong>${escapeHtml(cell)}</strong></td>` : `<td>${escapeHtml(cell)}</td>`)).join('')}</tr>`;
  }

  function installmentHeaderHtml() {
    return installmentColumnKeys().map((key) => {
      const title = key === 'installments.col.regularAmortization' ? ` title="${escapeHtml(t('installments.regularAmortizationTitle'))}"` : '';
      return `<th scope="col"${title}>${escapeHtml(t(key))}</th>`;
    }).join('');
  }

  function printSectionHtml({ kicker, title, body, className = 'surface-card mb-4' }) {
    return `
      <section class="${className}">
        <div class="section-heading">
          <div>
            ${kicker ? `<span class="section-kicker">${escapeHtml(kicker)}</span>` : ''}
            <h2>${escapeHtml(title)}</h2>
          </div>
        </div>
        ${body}
      </section>
    `;
  }

  function printChartsHtml(images) {
    if (images.length === 0) return '';
    const panels = images.map((image) => `
      <div class="chart-panel">
        <h3>${escapeHtml(image.title)}</h3>
        <img class="print-chart-image" src="${image.src}" alt="${escapeHtml(image.alt)}" width="${PRINT_CHART_WIDTH}" height="${PRINT_CHART_HEIGHT}">
      </div>
    `).join('');
    return printSectionHtml({
      kicker: '',
      title: t('charts.title'),
      className: 'surface-card chart-section mb-4',
      body: `<div class="print-charts-grid">${panels}</div>`,
    });
  }

  function comparisonTableHtml(comparison) {
    const headers = ['comparison.indicator', 'comparison.withoutExtras', 'comparison.withExtras', 'comparison.difference']
      .map((key) => `<th scope="col">${escapeHtml(t(key))}</th>`)
      .join('');
    return `
      <div class="table-responsive">
        <table class="table comparison-table align-middle mb-0">
          <thead><tr>${headers}</tr></thead>
          <tbody>${renderComparisonRows(comparisonRows(comparison.base.stats, comparison.current.stats))}</tbody>
        </table>
      </div>
    `;
  }

  function installmentsTableHtml(rows) {
    return `
      <div class="installments-table-wrap">
        <table class="table installments-table align-middle mb-0">
          <thead>
            <tr class="print-table-brand-row">
              <th colspan="14" scope="colgroup">
                <span class="print-table-brand">
                  <img src="./assets/image/logo.png" alt="" class="print-table-brand-logo">
                  <span>${escapeHtml(t('print.brandTitle'))}</span>
                </span>
              </th>
            </tr>
            <tr class="print-table-title-row">
              <th colspan="14" scope="colgroup">
                <span class="print-table-title">${escapeHtml(t('installments.title'))}</span>
              </th>
            </tr>
            <tr>${installmentHeaderHtml()}</tr>
          </thead>
          <tbody>${rows.map(installmentRowHtml).join('')}</tbody>
        </table>
      </div>
    `;
  }

  function buildPrintReportHtml(comparison, config, chartImages) {
    const stats = comparison.current.stats;
    const projectionNoteHtml = stats.totalCorrectionCents > 0 || stats.totalMonthlyExtraCostsCents > 0
      ? `<p class="text-secondary small mt-3 mb-0">${escapeHtml(t('results.projectionNote'))}</p>`
      : '';
    return `
      <section class="print-report-header" aria-label="${escapeHtml(t('print.reportHeaderLabel'))}">
        <img src="./assets/image/logo.png" alt="Logo" class="print-report-logo">
        <div><h2>${escapeHtml(t('print.brandTitle'))}</h2></div>
      </section>

      <aside class="estimate-notice print-legal-notice" aria-label="${escapeHtml(t('print.legalNoticeAria'))}">
        ${escapeHtml(t('print.legalNoticeText'))}
      </aside>

      ${printSectionHtml({
        kicker: '',
        title: t('print.parametersTitle'),
        body: `<table class="table print-parameters-table mb-0"><tbody>${renderKeyValueRowsHtml(printParameterItems(config), 3)}</tbody></table>`,
      })}

      ${printSectionHtml({
        kicker: '',
        title: t('results.title'),
        body: `<table class="table print-summary-table mb-0"><tbody>${renderKeyValueRowsHtml(printSummaryItems(stats), 3)}</tbody></table>${projectionNoteHtml}`,
      })}

      ${printChartsHtml(chartImages)}

      ${printSectionHtml({
        kicker: '',
        title: t('comparison.title'),
        body: comparisonTableHtml(comparison),
      })}

      ${printSectionHtml({
        kicker: '',
        title: t('installments.title'),
        className: 'surface-card installments-section mb-4',
        body: installmentsTableHtml(comparison.current.installments),
      })}

      <aside class="estimate-notice" aria-label="${escapeHtml(t('notice.aria'))}">
        <strong>${escapeHtml(t('notice.strong'))}</strong> ${escapeHtml(t('notice.text'))}
      </aside>
    `;
  }

  function clearPrintReport() {
    window.clearTimeout(printCleanupTimer);
    printCleanupTimer = null;
    if (printReportRoot) {
      printReportRoot.innerHTML = '';
      printReportRoot.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('is-printing-report');
    isPreparingPrint = false;
    exportPdfButton.disabled = !hasCalculated;
  }

  function schedulePrintReportCleanup() {
    window.clearTimeout(printCleanupTimer);
    printCleanupTimer = window.setTimeout(clearPrintReport, PRINT_REPORT_CLEANUP_DELAY_MS);
  }

  async function preparePrintReport() {
    if (!hasCalculated || !currentComparison || !currentConfig || currentComparison.current.installments.length === 0 || !printReportRoot) return false;
    window.clearTimeout(printCleanupTimer);
    printCleanupTimer = null;
    const chartImages = createPrintChartImages();
    printReportRoot.innerHTML = buildPrintReportHtml(currentComparison, currentConfig, chartImages);
    printReportRoot.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-printing-report');
    await waitForPrintLayout();
    return true;
  }

  function restorePrintReport() {
    isPreparingPrint = false;
    exportPdfButton.disabled = !hasCalculated;
    schedulePrintReportCleanup();
  }

  async function exportResultsToPdf() {
    if (isPreparingPrint) return;
    isPreparingPrint = true;
    exportPdfButton.disabled = true;
    try {
      if (!await preparePrintReport()) {
        clearPrintReport();
        return;
      }
      window.print();
      restorePrintReport();
    } catch (error) {
      clearPrintReport();
    }
  }

  function hideSimulation() {
    clearPrintReport();
    results.classList.add('d-none');
    tableContent.classList.add('d-none');
    tableEmpty.classList.remove('d-none');
    exportPdfButton.disabled = true;
    tableEmpty.textContent = hasCalculated
      ? t('installments.emptyStale')
      : t('installments.emptyPrompt');
    simulatedRows = [];
    currentComparison = null;
    currentConfig = null;
    clearPrintParameters();
    printSummaryBody.innerHTML = '';
    destroyCharts();
  }

  function showSimulation(comparison, { scrollToResults = false } = {}, config = null) {
    clearPrintReport();
    currentComparison = comparison;
    currentConfig = config;
    if (config) renderPrintParameters(config);
    renderSummary(comparison.current.stats);
    renderCharts(comparison);
    renderComparison(comparison.base.stats, comparison.current.stats);
    simulatedRows = comparison.current.installments;
    if (!hasCalculated) {
      currentPage = 1;
      installmentFilter.value = 'all';
    }
    renderInstallments();
    results.classList.remove('d-none');
    tableEmpty.classList.add('d-none');
    tableContent.classList.remove('d-none');
    hasCalculated = true;
    exportPdfButton.disabled = false;
    if (scrollToResults) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function performCalculation({ automatic = false } = {}) {
    window.clearTimeout(autoCalculationTimer);
    autoCalculationTimer = null;
    const config = readConfiguration({ showErrors: true, focusOnError: !automatic });
    if (!config) {
      if (automatic) hideSimulation();
      return;
    }
    try {
      showSimulation(finance.simulateComparison(config), { scrollToResults: !automatic }, config);
    } catch (error) {
      if (automatic) {
        hideSimulation();
        return;
      }
      showGeneralError(error.code === 'EXTRA_GOAL_CONFLICT'
        ? t('validation.extraGoalConflictWithMonth', { month: error.month })
        : t('validation.calculationFailed'));
      formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function scheduleAutomaticCalculation() {
    persistFormState();
    window.clearTimeout(autoCalculationTimer);
    autoCalculationTimer = window.setTimeout(() => performCalculation({ automatic: true }), 300);
  }

  async function applyLatestTrRate({ schedule = true, updateButton = true, persist = true } = {}) {
    const originalText = useLatestTrButton.textContent;
    if (updateButton) {
      useLatestTrButton.disabled = true;
      useLatestTrButton.textContent = t('tr.loading');
    }

    const cachedTr = readTrCache();
    if (cachedTr) {
      applyTrReferenceToCorrectionField(cachedTr.reference, cachedTr.generatedAt);
      if (schedule) scheduleAutomaticCalculation();
      else if (persist) persistFormState();
      if (updateButton) {
        useLatestTrButton.disabled = false;
        useLatestTrButton.textContent = originalText || t('form.useTr12m');
      }
      return true;
    }

    try {
      const response = await fetch('./assets/data/tr-bacen.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!validateTrData(data)) throw new Error(t('tr.invalidJson'));
      const reference = highestRecentTrRate(data.rates, 12);

      writeTrCache({ reference, generatedAt: data.generatedAt, sourceUrl: data.sourceUrl });
      applyTrReferenceToCorrectionField(reference, data.generatedAt);
      if (schedule) scheduleAutomaticCalculation();
      else if (persist) persistFormState();
      return true;
    } catch (error) {
      monthlyCorrectionRateHelp.textContent = t('tr.failure');
      return false;
    } finally {
      if (updateButton) {
        useLatestTrButton.disabled = false;
        useLatestTrButton.textContent = originalText || t('form.useTr12m');
      }
    }
  }

  async function applyLatestSelicRate({ schedule = true, persist = true } = {}) {
    const cachedSelic = readSelicCache();
    if (cachedSelic) {
      applySelicToInterestField(cachedSelic);
      if (schedule) scheduleAutomaticCalculation();
      else if (persist) persistFormState();
      return true;
    }

    try {
      const response = await fetch(SELIC_DATA_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const selic = parseSelicRate(await response.json());
      if (!selic) throw new Error(t('selic.invalidResponse'));

      writeSelicCache(selic);
      applySelicToInterestField(selic);
      if (schedule) scheduleAutomaticCalculation();
      else if (persist) persistFormState();
      return true;
    } catch (error) {
      interestRateInput.value = '';
      return false;
    }
  }

  async function resetFormState() {
    window.clearTimeout(autoCalculationTimer);
    autoCalculationTimer = null;
    clearPersistedFormState();
    clearErrors();

    setDefaultFinancedValue();
    monthlyExtraCostInput.value = '';
    clearMoneyDigits(monthlyExtraCostInput);
    termInput.value = '360';
    interestRateInput.value = '';
    ratePeriodInput.value = 'annual';
    annualRateTypeInput.value = 'effective';
    setFirstDueDateToToday();
    correctionModeInput.value = 'fixed';
    monthlyCorrectionRateInput.value = '';
    monthlyCorrectionSeriesInput.value = '';
    form.elements.system.value = 'sac';

    extrasList.innerHTML = '';
    extraSequence = 0;
    simulatedRows = [];
    currentPage = 1;
    hasCalculated = false;
    exportPdfButton.disabled = true;
    installmentFilter.value = 'all';
    goToInstallment.value = '';
    pageSizeSelect.value = '12';

    updateRatePeriod();
    updateCorrectionFields();
    updateExtrasEmptyState();
    hideSimulation();

    const [trLoaded, selicLoaded] = await Promise.all([
      applyLatestTrRate({ schedule: false, updateButton: false, persist: false }),
      applyLatestSelicRate({ schedule: false, persist: false }),
    ]);
    if (trLoaded && selicLoaded) performCalculation({ automatic: true });
    clearPersistedFormState();
  }

  document.querySelector('#add-extra').addEventListener('click', () => addExtraPayment());
  privacyNoticeDismissButton?.addEventListener('click', dismissPrivacyNotice);
  languageSelect.addEventListener('change', handleLanguageChange);
  resetFormButton.addEventListener('click', resetFormState);
  exportPdfButton.addEventListener('click', exportResultsToPdf);
  window.addEventListener('afterprint', restorePrintReport);
  useLatestTrButton.addEventListener('click', () => applyLatestTrRate());
  ratePeriodInput.addEventListener('change', updateRatePeriod);
  annualRateTypeInput.addEventListener('change', updateAnnualRateTypeHelp);
  correctionModeInput.addEventListener('change', updateCorrectionFields);
  financedValueInput.addEventListener('blur', () => formatMoneyInput(financedValueInput));
  monthlyExtraCostInput.addEventListener('blur', () => formatMoneyInput(monthlyExtraCostInput));

  form.addEventListener('beforeinput', (event) => {
    if (!event.target.matches('#financed-value, #monthly-extra-cost, [data-field="value"]')) return;
    event.target.dataset.replaceMoneyDigits = String(
      event.target.selectionStart === 0 && event.target.selectionEnd === event.target.value.length,
    );
  });

  form.addEventListener('input', (event) => {
    if (event.target.matches('#financed-value, #monthly-extra-cost, [data-field="value"]')) formatMoneyWhileTyping(event.target, event);
    if (event.target === monthlyCorrectionRateInput) updateCorrectionRateHelp();
    scheduleAutomaticCalculation();
  });

  form.addEventListener('change', scheduleAutomaticCalculation);

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
    window.bootstrap?.Tooltip?.getOrCreateInstance(element);
  });

  extrasList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-action="remove-extra"]');
    if (!removeButton) return;
    removeButton.closest('[data-extra-card]').remove();
    updateExtrasEmptyState();
    scheduleAutomaticCalculation();
  });

  extrasList.addEventListener('change', (event) => {
    const card = event.target.closest('[data-extra-card]');
    if (card && ['type', 'frequency'].includes(event.target.dataset.field)) updateExtraVisibility(card);
  });

  extrasList.addEventListener('focusout', (event) => {
    if (event.target.dataset.field === 'value') formatMoneyInput(event.target);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    performCalculation({ automatic: false });
  });

  installmentFilter.addEventListener('change', () => { currentPage = 1; renderInstallments(); });
  pageSizeSelect.addEventListener('change', () => { currentPage = 1; renderInstallments(); });
  previousPage.addEventListener('click', () => { currentPage -= 1; renderInstallments(); });
  nextPage.addEventListener('click', () => { currentPage += 1; renderInstallments(); });
  document.querySelector('#go-button').addEventListener('click', () => {
    const installment = Number(goToInstallment.value);
    if (!Number.isInteger(installment) || installment < 1 || installment > simulatedRows.length) {
      goToInstallment.classList.add('is-invalid');
      goToInstallment.focus();
      return;
    }
    goToInstallment.classList.remove('is-invalid');
    installmentFilter.value = 'all';
    const pageSize = pageSizeSelect.value === 'all' ? simulatedRows.length : Number(pageSizeSelect.value);
    currentPage = Math.ceil(installment / pageSize);
    renderInstallments();
    const row = installmentsBody.querySelector(`[data-installment="${installment}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  i18n.setLanguage(i18n.getLanguage());
  applyStaticTranslations();
  if (isPrivacyNoticeDismissed()) privacyNotice?.classList.add('d-none');

  const restoredState = restoreFormState();
  if (!restoredState) {
    setDefaultFinancedValue();
    setFirstDueDateToToday();
  }
  reformatFormValuesForCurrentLanguage();
  updateRatePeriod();
  updateCorrectionFields();
  updateExtrasEmptyState();
  if (restoredState) {
    persistFormState();
    scheduleAutomaticCalculation();
  } else {
    Promise.all([
      applyLatestTrRate({ schedule: false, updateButton: false, persist: false }),
      applyLatestSelicRate({ schedule: false, persist: false }),
    ]).then(([trLoaded, selicLoaded]) => {
      if (trLoaded && selicLoaded) scheduleAutomaticCalculation();
    });
  }
}());
