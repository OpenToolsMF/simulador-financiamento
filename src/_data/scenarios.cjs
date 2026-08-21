'use strict';

const bcbData = require('../../assets/data/bcb-credit-rates.json');
const trData = require('../../assets/data/tr-bacen.json');
const finance = require('../../assets/js/finance.js');
const simulationState = require('../../assets/js/simulation-state.js');

const AMOUNT_CENTS = 30_000_000;
const TERM = 360;

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) throw new Error('No valid BCB rates available for guide scenarios.');
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function modality(key) {
  const value = bcbData.creditTypes.realEstate.modalities.find((item) => item.key === key);
  if (!value) throw new Error(`Missing BCB real-estate modality: ${key}`);
  return value;
}

function currentRateReference(modalityKey) {
  const currentModality = modality(modalityKey);
  const monthlyRatePercent = median(
    currentModality.institutions.map((institution) => institution.monthlyRatePercent),
  );
  const annualEffectiveRatePercent = (Math.pow(1 + monthlyRatePercent / 100, 12) - 1) * 100;
  return {
    modalityKey,
    monthlyRatePercent,
    annualEffectiveRatePercent,
    institutionCount: currentModality.institutions.length,
    referencePeriod: bcbData.creditTypes.realEstate.referencePeriod,
  };
}

function trObservationDate(rate) {
  return rate.startDate || rate.date;
}

function currentTrReference() {
  const rates = trData.rates
    .filter((rate) => trObservationDate(rate) && Number.isFinite(rate.ratePercent))
    .sort((left, right) => trObservationDate(left).localeCompare(trObservationDate(right)));
  if (rates.length === 0) throw new Error('No valid TR observations available for guide scenarios.');

  const latestDate = trObservationDate(rates.at(-1));
  const threshold = new Date(`${latestDate}T00:00:00Z`);
  threshold.setUTCFullYear(threshold.getUTCFullYear() - 1);
  const thresholdIso = threshold.toISOString().slice(0, 10);
  const recentRates = rates.filter((rate) => trObservationDate(rate) >= thresholdIso);
  const selected = recentRates.reduce((highest, rate) => (
    rate.ratePercent > highest.ratePercent ? rate : highest
  ), recentRates[0]);

  return {
    ratePercent: selected.ratePercent,
    selectedDate: trObservationDate(selected),
    selectedEndDate: selected.endDate || null,
    startDate: trObservationDate(recentRates[0]),
    endDate: latestDate,
    observationCount: recentRates.length,
  };
}

const fixedRate = currentRateReference('marketFixed');
const marketTrRate = currentRateReference('marketTr');
const trReference = currentTrReference();

function baseState({
  system = 'sac',
  rate = fixedRate,
  correctionMode = 'none',
  correctionRatePercent = 0,
  extraPayments = [],
  monthlyExtraCostCents = 0,
} = {}) {
  return {
    amountCents: AMOUNT_CENTS,
    term: TERM,
    ratePercent: Number(rate.annualEffectiveRatePercent.toFixed(6)),
    ratePeriod: 'annual',
    annualRateType: 'effective',
    monthlyExtraCostCents,
    firstDueDate: null,
    correction: {
      mode: correctionMode,
      monthlyRatePercent: correctionMode === 'fixed' ? correctionRatePercent : 0,
      monthlyRatesPercent: [],
    },
    system,
    extraPayments,
  };
}

function oneTimeExtra(goal = 'term', month = 60, valueCents = 2_000_000) {
  return {
    type: 'single',
    valueCents,
    month,
    startMonth: null,
    endMonth: null,
    frequencyMonths: null,
    goal,
  };
}

function recurringExtra() {
  return {
    type: 'recurring',
    valueCents: 50_000,
    month: null,
    startMonth: 1,
    endMonth: null,
    frequencyMonths: 1,
    goal: 'term',
  };
}

function financeConfig(state) {
  return {
    financedCents: state.amountCents,
    monthlyExtraCostCents: state.monthlyExtraCostCents,
    term: state.term,
    system: state.system,
    ratePercent: state.ratePercent,
    ratePeriod: state.ratePeriod,
    annualRateType: state.annualRateType,
    monthlyRate: finance.monthlyRateFromPercent(
      state.ratePercent,
      state.ratePeriod,
      state.annualRateType,
    ),
    firstDueDate: state.firstDueDate,
    correctionMode: state.correction.mode,
    monthlyCorrectionRate: state.correction.monthlyRatePercent / 100,
    monthlyCorrectionRates: state.correction.monthlyRatesPercent.map((rate) => rate / 100),
    extraPayments: state.extraPayments.map((extra) => ({
      type: extra.type,
      valueCents: extra.valueCents,
      month: extra.month,
      startMonth: extra.startMonth,
      endMonth: extra.endMonth,
      frequency: extra.frequencyMonths,
      goal: extra.goal,
    })),
  };
}

function variant(id, state) {
  const normalizedState = simulationState.normalizeSimulationState(state);
  const config = financeConfig(normalizedState);
  return {
    id,
    state: normalizedState,
    config,
    result: finance.simulate(config, config.extraPayments),
    simulationSearch: simulationState.simulationSearch(normalizedState),
  };
}

function scenario(id, variants, primaryVariantId = variants.at(-1).id) {
  const primary = variants.find((item) => item.id === primaryVariantId);
  if (!primary) throw new Error(`Missing primary variant ${primaryVariantId} for scenario ${id}`);
  return {
    id,
    variants,
    primaryVariantId,
    state: primary.state,
    result: primary.result,
    simulationSearch: primary.simulationSearch,
  };
}

const sacBaseState = baseState({ system: 'sac' });
const priceBaseState = baseState({ system: 'price' });
const extraTermState = baseState({ system: 'sac', extraPayments: [oneTimeExtra('term')] });
const extraPaymentState = baseState({ system: 'sac', extraPayments: [oneTimeExtra('payment')] });
const amortizeMonth60State = baseState({
  system: 'sac',
  extraPayments: [oneTimeExtra('payment', 60)],
});
const amortizeMonth61State = baseState({
  system: 'sac',
  extraPayments: [oneTimeExtra('payment', 61)],
});
const monthlyExtraState = baseState({ system: 'sac', extraPayments: [recurringExtra()] });
const marketTrBaseState = baseState({ system: 'sac', rate: marketTrRate });
const marketTrCorrectedState = baseState({
  system: 'sac',
  rate: marketTrRate,
  correctionMode: 'fixed',
  correctionRatePercent: trReference.ratePercent,
});
const monthlyCostState = baseState({ system: 'sac', monthlyExtraCostCents: 15_000 });
const proposalBState = baseState({
  system: 'sac',
  rate: marketTrRate,
  correctionMode: 'fixed',
  correctionRatePercent: trReference.ratePercent,
  monthlyExtraCostCents: 12_000,
});

const scenarios = {
  'sac-300k-360': scenario('sac-300k-360', [
    variant('sac', sacBaseState),
  ]),
  'price-300k-360': scenario('price-300k-360', [
    variant('price', priceBaseState),
  ]),
  'extra-20k-year-five': scenario('extra-20k-year-five', [
    variant('without-extra', sacBaseState),
    variant('with-extra', extraTermState),
  ]),
  'monthly-extra-500': scenario('monthly-extra-500', [
    variant('without-extra', sacBaseState),
    variant('monthly-extra', monthlyExtraState),
  ]),
  'term-vs-payment': scenario('term-vs-payment', [
    variant('reduce-term', extraTermState),
    variant('reduce-payment', extraPaymentState),
  ], 'reduce-term'),
  'amortization-timing': {
    ...scenario('amortization-timing', [
      variant('amortize-month-60', amortizeMonth60State),
      variant('amortize-month-61', amortizeMonth61State),
    ], 'amortize-month-60'),
    renderType: 'timing-comparison',
    comparisonMonths: [59, 60, 61, 62],
    zoomMonths: [58, 59, 60, 61, 62],
  },
  'with-without-tr': scenario('with-without-tr', [
    variant('without-tr', marketTrBaseState),
    variant('with-tr', marketTrCorrectedState),
  ], 'with-tr'),
  'monthly-cost-impact': scenario('monthly-cost-impact', [
    variant('without-monthly-cost', sacBaseState),
    variant('with-monthly-cost', monthlyCostState),
  ], 'with-monthly-cost'),
  'nominal-rate-example': {
    ...scenario('nominal-rate-example', [
    variant('annual-effective', {
      ...sacBaseState,
      ratePercent: 12,
      annualRateType: 'effective',
    }),
    variant('annual-nominal', {
      ...sacBaseState,
      ratePercent: 12,
      annualRateType: 'nominal',
    }),
    ], 'annual-effective'),
    referenceType: 'illustrative',
  },
  'sac-vs-price': scenario('sac-vs-price', [
    variant('sac', sacBaseState),
    variant('price', priceBaseState),
  ], 'sac'),
  'proposal-comparison': {
    ...scenario('proposal-comparison', [
    variant('proposal-a', sacBaseState),
    variant('proposal-b', proposalBState),
    ], 'proposal-a'),
    referenceType: 'mixed-bcb',
  },
};

module.exports = {
  amountCents: AMOUNT_CENTS,
  term: TERM,
  fixedRate,
  marketTrRate,
  trReference,
  scenarios,
  references: {
    bcb: {
      generatedAt: bcbData.generatedAt,
      sourceUrl: bcbData.sourceUrl,
      referencePeriod: bcbData.referencePeriod,
    },
    tr: {
      generatedAt: trData.generatedAt,
      sourceUrl: trData.sourceUrl,
      referencePeriod: {
        startDate: trReference.startDate,
        endDate: trReference.endDate,
      },
    },
  },
  financeConfig,
};
