'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const finance = require('../assets/js/finance.js');
const chartData = require('../assets/js/chart-data.js');

function config(system, extraPayments = [], overrides = {}) {
  return {
    financedCents: 10000000,
    term: 12,
    system,
    monthlyRate: 0.01,
    monthlyExtraCostCents: 19500,
    correctionMode: 'none',
    firstDueDate: '2027-01-31',
    extraPayments,
    ...overrides,
  };
}

function everySeries(prepared) {
  return [
    ...Object.values(prepared.debt),
    ...Object.values(prepared.payment),
    ...Object.values(prepared.composition),
    ...Object.values(prepared.costs),
  ];
}

test('soma somente valores finitos dos itens do tooltip', () => {
  assert.equal(chartData.sumTooltipItems([
    { parsed: { y: 1200.5 } },
    { parsed: { y: 300 } },
    { parsed: { y: null } },
    { parsed: { y: Number.NaN } },
  ]), 1500.5);
  assert.equal(chartData.sumTooltipItems(), 0);
});

for (const system of ['sac', 'price']) {
  test(`${system}: mantém um eixo compartilhado sem amortização extra`, () => {
    const prepared = chartData.build(finance.simulateComparison(config(system)));

    assert.equal(prepared.horizon, 12);
    assert.deepEqual(prepared.months, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    everySeries(prepared).forEach((series) => assert.equal(series.length, prepared.months.length));
    assert.equal(prepared.debt.base[0], 10000000);
    assert.equal(prepared.debt.current[0], 10000000);
    assert.equal(prepared.payment.current[0], null);
    assert.equal(prepared.composition.interest[0], null);
    assert.equal(prepared.costs.totalPaid[0], 0);
  });

  test(`${system}: preserva o prazo original quando a amortização reduz o prazo`, () => {
    const comparison = finance.simulateComparison(config(system, [
      { type: 'single', month: 2, valueCents: 2000000, goal: 'term' },
    ]));
    const prepared = chartData.build(comparison);
    const payoffMonth = comparison.current.stats.effectiveTerm;
    const monthAfterPayoff = payoffMonth + 1;

    assert.ok(payoffMonth < comparison.base.stats.effectiveTerm);
    assert.equal(prepared.horizon, comparison.base.stats.originalTerm);
    assert.equal(prepared.months.at(-1), comparison.base.stats.originalTerm);
    everySeries(prepared).forEach((series) => assert.equal(series.length, prepared.months.length));
    assert.equal(prepared.debt.current[payoffMonth], 0);
    assert.equal(prepared.debt.current[monthAfterPayoff], 0);
    assert.equal(prepared.payment.current[monthAfterPayoff], null);
    assert.equal(prepared.payment.extras[monthAfterPayoff], null);
    assert.equal(prepared.composition.interest[monthAfterPayoff], null);
    assert.equal(prepared.composition.extraAmortization[monthAfterPayoff], null);
    assert.equal(prepared.costs.interest[monthAfterPayoff], prepared.costs.interest[payoffMonth]);
    assert.equal(prepared.costs.correction.at(-1), prepared.costs.correction[payoffMonth]);
    assert.equal(prepared.costs.monthlyExtraCosts.at(-1), prepared.costs.monthlyExtraCosts[payoffMonth]);
    assert.equal(prepared.costs.totalPaid.at(-1), prepared.costs.totalPaid[payoffMonth]);
    assert.equal(prepared.costs.interest.at(-1), comparison.current.stats.totalInterestCents);
    assert.equal(prepared.costs.correction.at(-1), comparison.current.stats.totalCorrectionCents);
    assert.equal(prepared.costs.monthlyExtraCosts.at(-1), comparison.current.stats.totalMonthlyExtraCostsCents);
    assert.equal(prepared.costs.totalPaid.at(-1), comparison.current.stats.totalPaidCents);
  });

  test(`${system}: mantém dados mensais até o fim ao reduzir a parcela`, () => {
    const comparison = finance.simulateComparison(config(system, [
      { type: 'single', month: 2, valueCents: 2000000, goal: 'payment' },
    ]));
    const prepared = chartData.build(comparison);

    assert.equal(comparison.current.stats.effectiveTerm, 12);
    assert.equal(prepared.horizon, 12);
    assert.notEqual(prepared.payment.current.at(-1), null);
    assert.notEqual(prepared.composition.regularAmortization.at(-1), null);
    assert.equal(prepared.debt.current.at(-1), 0);
  });
}

test('quitação no primeiro mês encerra séries mensais e mantém acumulados constantes', () => {
  const comparison = finance.simulateComparison(config('sac', [
    { type: 'single', month: 1, valueCents: 999999999, goal: 'term' },
  ]));
  const prepared = chartData.build(comparison);

  assert.equal(comparison.current.stats.effectiveTerm, 1);
  assert.equal(prepared.debt.current[1], 0);
  assert.ok(prepared.payment.current[1] > 0);
  assert.equal(prepared.payment.current[2], null);
  assert.equal(prepared.composition.regularAmortization[2], null);
  assert.equal(prepared.costs.totalPaid[1], prepared.costs.totalPaid.at(-1));
});
