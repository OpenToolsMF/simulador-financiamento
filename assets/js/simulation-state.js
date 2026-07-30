(function exposeSimulationState(globalScope) {
  'use strict';

  const VERSION = 1;
  const MAX_PAYLOAD_BYTES = 16 * 1024;
  const MAX_TERM = 600;
  const MAX_EXTRA_PAYMENTS = 100;
  const ROOT_KEYS = new Set([
    'amountCents',
    'term',
    'ratePercent',
    'ratePeriod',
    'annualRateType',
    'monthlyExtraCostCents',
    'firstDueDate',
    'correction',
    'system',
    'extraPayments',
  ]);
  const CORRECTION_KEYS = new Set(['mode', 'monthlyRatePercent', 'monthlyRatesPercent']);
  const EXTRA_KEYS = new Set([
    'type',
    'valueCents',
    'month',
    'startMonth',
    'endMonth',
    'frequencyMonths',
    'goal',
  ]);

  function isPlainObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  function assertExactKeys(value, allowed, label) {
    if (!isPlainObject(value)) throw new Error(`${label}_INVALID`);
    if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error(`${label}_UNKNOWN_FIELD`);
  }

  function safeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER, label }) {
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label}_INVALID`);
    return value;
  }

  function finiteNumber(value, { min = 0, label }) {
    if (!Number.isFinite(value) || value < min) throw new Error(`${label}_INVALID`);
    return value;
  }

  function validIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function normalizeCorrection(value) {
    assertExactKeys(value, CORRECTION_KEYS, 'CORRECTION');
    const mode = ['none', 'fixed', 'custom'].includes(value.mode) ? value.mode : null;
    if (!mode) throw new Error('CORRECTION_MODE_INVALID');

    const monthlyRatePercent = finiteNumber(value.monthlyRatePercent, {
      label: 'CORRECTION_RATE',
    });
    if (!Array.isArray(value.monthlyRatesPercent) || value.monthlyRatesPercent.length > MAX_TERM) {
      throw new Error('CORRECTION_SERIES_INVALID');
    }
    const monthlyRatesPercent = value.monthlyRatesPercent.map((rate) => finiteNumber(rate, {
      label: 'CORRECTION_SERIES_RATE',
    }));
    if (mode === 'custom' && monthlyRatesPercent.length === 0) {
      throw new Error('CORRECTION_SERIES_EMPTY');
    }

    return {
      mode,
      monthlyRatePercent: mode === 'fixed' ? monthlyRatePercent : 0,
      monthlyRatesPercent: mode === 'custom' ? monthlyRatesPercent : [],
    };
  }

  function normalizeExtraPayment(value, term) {
    assertExactKeys(value, EXTRA_KEYS, 'EXTRA');
    const type = ['single', 'recurring'].includes(value.type) ? value.type : null;
    const goal = ['term', 'payment'].includes(value.goal) ? value.goal : null;
    if (!type || !goal) throw new Error('EXTRA_TYPE_OR_GOAL_INVALID');

    const normalized = {
      type,
      valueCents: safeInteger(value.valueCents, { min: 1, label: 'EXTRA_VALUE' }),
      month: null,
      startMonth: null,
      endMonth: null,
      frequencyMonths: null,
      goal,
    };

    if (type === 'single') {
      normalized.month = safeInteger(value.month, { min: 1, max: term, label: 'EXTRA_MONTH' });
      return normalized;
    }

    normalized.startMonth = safeInteger(value.startMonth, {
      min: 1,
      max: term,
      label: 'EXTRA_START_MONTH',
    });
    normalized.endMonth = value.endMonth === null
      ? null
      : safeInteger(value.endMonth, {
        min: normalized.startMonth,
        max: term,
        label: 'EXTRA_END_MONTH',
      });
    normalized.frequencyMonths = safeInteger(value.frequencyMonths, {
      min: 1,
      max: MAX_TERM,
      label: 'EXTRA_FREQUENCY',
    });
    return normalized;
  }

  function ruleApplies(rule, month) {
    if (rule.type === 'single') return rule.month === month;
    const endMonth = rule.endMonth ?? Number.MAX_SAFE_INTEGER;
    return month >= rule.startMonth
      && month <= endMonth
      && (month - rule.startMonth) % rule.frequencyMonths === 0;
  }

  function assertNoGoalConflict(rules, term) {
    for (let month = 1; month <= term; month += 1) {
      const goals = new Set(rules.filter((rule) => ruleApplies(rule, month)).map((rule) => rule.goal));
      if (goals.size > 1) throw new Error('EXTRA_GOAL_CONFLICT');
    }
  }

  function normalizeSimulationState(value) {
    assertExactKeys(value, ROOT_KEYS, 'STATE');
    const term = safeInteger(value.term, { min: 1, max: MAX_TERM, label: 'TERM' });
    const ratePeriod = ['annual', 'monthly'].includes(value.ratePeriod) ? value.ratePeriod : null;
    const annualRateType = ['effective', 'nominal'].includes(value.annualRateType)
      ? value.annualRateType
      : null;
    const system = ['sac', 'price'].includes(value.system) ? value.system : null;
    if (!ratePeriod || !annualRateType || !system) throw new Error('STATE_ENUM_INVALID');
    if (
      value.firstDueDate !== null
      && !validIsoDate(value.firstDueDate)
    ) {
      throw new Error('FIRST_DUE_DATE_INVALID');
    }
    if (!Array.isArray(value.extraPayments) || value.extraPayments.length > MAX_EXTRA_PAYMENTS) {
      throw new Error('EXTRA_PAYMENTS_INVALID');
    }

    const extraPayments = value.extraPayments.map((rule) => normalizeExtraPayment(rule, term));
    assertNoGoalConflict(extraPayments, term);

    return {
      amountCents: safeInteger(value.amountCents, { min: 1, label: 'AMOUNT' }),
      term,
      ratePercent: finiteNumber(value.ratePercent, { label: 'RATE' }),
      ratePeriod,
      annualRateType,
      monthlyExtraCostCents: safeInteger(value.monthlyExtraCostCents, {
        min: 0,
        label: 'MONTHLY_EXTRA_COST',
      }),
      firstDueDate: value.firstDueDate,
      correction: normalizeCorrection(value.correction),
      system,
      extraPayments,
    };
  }

  function utf8ToBase64Url(value) {
    if (typeof Buffer !== 'undefined') return Buffer.from(value, 'utf8').toString('base64url');
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return globalScope.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function base64UrlToUtf8(value) {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('PAYLOAD_ENCODING_INVALID');
    if (typeof Buffer !== 'undefined') {
      const bytes = Buffer.from(value, 'base64url');
      if (bytes.length > MAX_PAYLOAD_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
      return bytes.toString('utf8');
    }
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const binary = globalScope.atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
    if (binary.length > MAX_PAYLOAD_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeSimulationState(value) {
    const state = normalizeSimulationState(value);
    const json = JSON.stringify(state);
    const byteLength = typeof Buffer !== 'undefined'
      ? Buffer.byteLength(json, 'utf8')
      : new TextEncoder().encode(json).length;
    if (byteLength > MAX_PAYLOAD_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
    return `${VERSION}.${utf8ToBase64Url(json)}`;
  }

  function decodeSimulationParam(value) {
    const [rawVersion, encoded, ...rest] = String(value || '').split('.');
    if (rest.length > 0 || rawVersion !== String(VERSION) || !encoded) {
      throw new Error('PAYLOAD_VERSION_INVALID');
    }
    let parsed;
    try {
      parsed = JSON.parse(base64UrlToUtf8(encoded));
    } catch (error) {
      if (error.message?.startsWith('PAYLOAD_')) throw error;
      throw new Error('PAYLOAD_JSON_INVALID');
    }
    return normalizeSimulationState(parsed);
  }

  function readSimulationStateFromSearch(search) {
    const params = new URLSearchParams(String(search || ''));
    if (!params.has('sim')) return { status: 'absent', state: null, error: null };
    try {
      return {
        status: 'valid',
        state: decodeSimulationParam(params.get('sim')),
        error: null,
      };
    } catch (error) {
      return { status: 'invalid', state: null, error: error.message || 'PAYLOAD_INVALID' };
    }
  }

  function simulationSearch(value) {
    return `?sim=${encodeURIComponent(encodeSimulationState(value))}`;
  }

  const api = {
    VERSION,
    MAX_PAYLOAD_BYTES,
    MAX_TERM,
    MAX_EXTRA_PAYMENTS,
    normalizeSimulationState,
    encodeSimulationState,
    decodeSimulationParam,
    readSimulationStateFromSearch,
    simulationSearch,
  };

  globalScope.FinancingSimulationState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
