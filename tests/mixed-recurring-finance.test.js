'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const finance = require('../assets/js/finance.js');

const baseConfig = {
  financedCents: 10000000,
  term: 120,
  monthlyExtraCostCents: 0,
  firstDueDate: '2027-01-31',
};
const corrections = [
  { correctionMode: 'none' },
  { correctionMode: 'fixed', monthlyCorrectionRate: 0.002 },
  { correctionMode: 'custom', monthlyCorrectionRates: [0.001, 0.002, 0.0015] },
];
const recurring = (goal, valueCents = 1000, overrides = {}) => ({
  type: 'recurring', startMonth: 1, endMonth: null, frequency: 1, valueCents, goal, ...overrides,
});

function assertAccounting(result) {
  assert.equal(result.installments.at(-1).closingBalanceCents, 0);
  for (const row of result.installments) {
    assert.ok(row.closingBalanceCents >= 0);
    assert.equal(row.correctedBalanceCents - row.regularAmortizationCents - row.extraPaymentCents, row.closingBalanceCents);
    assert.equal(row.regularPaymentCents, row.regularAmortizationCents + row.interestCents);
    assert.equal(row.totalPaymentCents, row.regularPaymentCents + row.extraPaymentCents + row.monthlyExtraCostCents);
    assert.equal(row.extraApplications.reduce((sum, application) => sum + application.appliedCents, 0), row.extraPaymentCents);
    for (const application of row.extraApplications) {
      assert.ok(application.appliedCents >= 0 && application.appliedCents <= application.requestedCents);
    }
  }
  for (const [total, field] of [
    ['totalPaidCents', 'totalPaymentCents'],
    ['totalInterestCents', 'interestCents'],
    ['totalExtraCents', 'extraPaymentCents'],
    ['totalCorrectionCents', 'correctionCents'],
    ['totalMonthlyExtraCostsCents', 'monthlyExtraCostCents'],
  ]) {
    assert.equal(result.stats[total], result.installments.reduce((sum, row) => sum + row[field], 0));
  }
  assert.equal(result.stats.totalAmortizedCents, result.stats.financedCents + result.stats.totalCorrectionCents);
}

test('single-goal schedules retain every cent of the pre-fix reference', () => {
  const results = [];
  for (const system of ['sac', 'price']) {
    for (const goal of ['term', 'payment']) {
      for (const monthlyRate of [0, 0.01]) {
        for (const correction of corrections) {
          results.push(finance.simulate({ ...baseConfig, system, monthlyRate, ...correction }, [
            recurring(goal, 10000),
            { type: 'single', month: 12, valueCents: 20000, goal },
          ]));
        }
      }
    }
  }
  // Full rows and statistics for these 24 cases, captured at revision 8797957.
  assert.equal(createHash('sha256').update(JSON.stringify(results)).digest('hex'),
    '251a0ca7e714aacea9d3b30f0961debf52a1cd99a46577af137df5e695527013');
});

for (const system of ['sac', 'price']) {
  test(`${system}: payment reduction scales the preserved schedule, not the already reduced balance`, () => {
    const config = { ...baseConfig, financedCents: 12000000, system, monthlyRate: 0, correctionMode: 'none' };
    const termRule = { type: 'single', month: 1, valueCents: 1000, goal: 'term' };
    const termOnly = finance.simulate(config, [termRule]);
    const mixed = finance.simulate(config, [termRule,
      { type: 'single', month: 2, valueCents: 500000, goal: 'payment' },
    ]);
    const balanceBeforePayment = termOnly.installments[1].closingBalanceCents;
    const expectedPayment = Math.round(100000 * (balanceBeforePayment - 500000) / balanceBeforePayment);
    assert.equal(expectedPayment, 95762);
    assert.equal(mixed.installments[2].regularPaymentCents, expectedPayment);
    assertAccounting(mixed);
  });

  for (const correction of corrections) {
    test(`${system}/${correction.correctionMode}: consecutive payment groups preserve rounding after a term allocation`, () => {
      const config = { ...baseConfig, system, monthlyRate: 0.01, ...correction };
      const split = finance.simulate(config, [recurring('term'), recurring('payment', 2000), recurring('payment', 3000)]);
      const summed = finance.simulate(config, [recurring('term'), recurring('payment', 5000)]);
      const financialRows = (result) => result.installments.map(({ extraApplications, ...row }) => row);
      assert.deepEqual(financialRows(split), financialRows(summed));
      assert.deepEqual(split.stats, summed.stats);
      assertAccounting(split);
    });

    for (const monthlyRate of [0, 0.01]) {
      for (const order of [['term', 'payment'], ['payment', 'term']]) {
        test(`${system}/${correction.correctionMode}/${monthlyRate}/${order.join('-')}: small term gains accumulate`, () => {
          const config = { ...baseConfig, system, monthlyRate, ...correction };
          const rules = order.map((goal) => recurring(goal));
          const mixed = finance.simulate(config, rules);
          const paymentOnly = finance.simulate(config, [recurring('payment', 2000)]);
          assert.ok(mixed.stats.effectiveTerm < paymentOnly.stats.effectiveTerm);
          assert.ok(mixed.installments[1].regularPaymentCents > paymentOnly.installments[1].regularPaymentCents,
            'the term allocation must not also become a payment reduction');
          assert.deepEqual(finance.simulate(config, rules), mixed, 'the schedule is deterministic');
          for (const row of mixed.installments.filter((installment) => installment.extraPaymentCents > 0)) {
            assert.deepEqual(row.extraApplications.map((application) => application.goal), order);
          }
          assertAccounting(mixed);
        });
      }
    }

    test(`${system}/${correction.correctionMode}: a later payment reduction retains sub-month term gains`, () => {
      const config = { ...baseConfig, system, monthlyRate: 0.01, ...correction };
      const termRule = { type: 'single', month: 1, valueCents: 1000, goal: 'term' };
      const paymentRule = { type: 'single', month: 2, valueCents: 500000, goal: 'payment' };
      const termOnly = finance.simulate(config, [termRule]);
      const mixed = finance.simulate(config, [termRule, paymentRule]);
      const allPayment = finance.simulate(config, [{ ...termRule, goal: 'payment' }, paymentRule]);
      assert.equal(termOnly.stats.effectiveTerm, 120, 'the first allocation cannot yet remove a full month');
      assert.equal(mixed.stats.effectiveTerm, termOnly.stats.effectiveTerm);
      assert.ok(mixed.installments[2].regularPaymentCents > allPayment.installments[2].regularPaymentCents);
      assert.ok(mixed.installments[2].regularPaymentCents < termOnly.installments[2].regularPaymentCents);
      assertAccounting(mixed);
    });

    test(`${system}/${correction.correctionMode}: stopped, crossing and alternating rules retain their order`, () => {
      const config = { ...baseConfig, system, monthlyRate: 0.01, ...correction };
      const rules = [
        recurring('term'),
        recurring('payment', 2000, { endMonth: 60, frequency: 2 }),
        recurring('term', 3000, { startMonth: 3, frequency: 3 }),
        recurring('payment', 1000, { startMonth: 4, frequency: 4 }),
      ];
      const result = finance.simulate(config, rules);
      const allPayment = finance.simulate(config, rules.map((rule) => ({ ...rule, goal: 'payment' })));
      assert.ok(result.stats.effectiveTerm < allPayment.stats.effectiveTerm);
      for (const row of result.installments) {
        assert.deepEqual(row.extraApplications.map((application) => application.goal),
          rules.filter((rule) => finance.ruleApplies(rule, row.number)).map((rule) => rule.goal));
      }
      assertAccounting(result);
    });

    test(`${system}/${correction.correctionMode}: payoff caps applications after preserving a partial gain`, () => {
      const result = finance.simulate({ ...baseConfig, system, monthlyRate: 0.01, ...correction }, [
        { type: 'single', month: 1, valueCents: 1000, goal: 'term' },
        { type: 'single', month: 1, valueCents: 1000, goal: 'payment' },
        { type: 'single', month: 2, valueCents: 999999999, goal: 'payment' },
        { type: 'single', month: 2, valueCents: 1000, goal: 'term' },
      ]);
      assert.equal(result.stats.effectiveTerm, 2);
      assert.equal(result.installments[1].extraApplications[1].appliedCents, 0);
      assertAccounting(result);
    });
  }
}

test('reported SAC scenario preserves recurring term gains when followed by payment reductions', () => {
  const config = {
    financedCents: 38563919,
    term: 242,
    system: 'sac',
    monthlyRate: finance.monthlyRateFromPercent(10.93, 'annual', 'effective'),
    monthlyExtraCostCents: 19500,
    correctionMode: 'fixed',
    monthlyCorrectionRate: 0.001762,
    firstDueDate: '2026-10-15',
  };
  const termOnly = finance.simulateComparison({ ...config, extraPayments: [recurring('term', 10000)] }).current;
  const mixed = finance.simulateComparison({ ...config, extraPayments: [recurring('term', 10000), recurring('payment', 10000)] }).current;
  assert.equal(termOnly.stats.effectiveTerm, 198);
  assert.equal(termOnly.stats.totalPaidCents, 89173323);
  assert.equal(mixed.stats.effectiveTerm, 197);
  assert.equal(mixed.stats.reducedMonths, 45);
  assert.equal(mixed.stats.totalPaidCents, 87935242);
  assert.equal(mixed.stats.totalInterestCents, 37859436);
  assert.equal(mixed.stats.interestSavingsCents, 9322785);
  assert.equal(mixed.stats.initialTotalPaymentCents, 534521);
  assert.equal(mixed.stats.finalTotalPaymentCents, 152062);
  assert.ok(mixed.stats.totalPaidCents < termOnly.stats.totalPaidCents);
  assert.ok(mixed.stats.totalInterestCents < termOnly.stats.totalInterestCents);
});
