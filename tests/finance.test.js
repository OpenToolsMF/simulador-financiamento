'use strict';

const assert = require('node:assert/strict');
const finance = require('../assets/js/finance.js');

function config(system, extraPayments = [], overrides = {}) {
  return {
    financedCents: 10000000,
    term: 120,
    system,
    monthlyRate: 0.01,
    monthlyExtraCostCents: 0,
    correctionMode: 'none',
    firstDueDate: '2027-01-31',
    extraPayments,
    ...overrides,
  };
}

function financialSchedule(result) {
  return result.installments.map(({ extraApplications, ...row }) => row);
}

function assertApplicationTotals(result, message) {
  for (const row of result.installments) {
    assert.equal(
      row.extraApplications.reduce((total, application) => total + application.appliedCents, 0),
      row.extraPaymentCents,
      `${message}: aplicações fecham no mês ${row.number}`,
    );
    assert.equal(
      row.correctedBalanceCents - row.regularAmortizationCents - row.extraPaymentCents,
      row.closingBalanceCents,
      `${message}: saldo fecha no mês ${row.number}`,
    );
    assert.equal(
      row.regularPaymentCents + row.extraPaymentCents + row.monthlyExtraCostCents,
      row.totalPaymentCents,
      `${message}: pagamento total fecha no mês ${row.number}`,
    );
    assert.ok(row.closingBalanceCents >= 0, `${message}: saldo não fica negativo no mês ${row.number}`);
  }
  const sum = (field) => result.installments.reduce((total, row) => total + row[field], 0);
  assert.equal(
    sum('extraPaymentCents'),
    result.stats.totalExtraCents,
    `${message}: estatística totaliza as aplicações`,
  );
  assert.equal(sum('totalPaymentCents'), result.stats.totalPaidCents, `${message}: estatística totaliza pagamentos`);
  assert.equal(sum('interestCents'), result.stats.totalInterestCents, `${message}: estatística totaliza juros`);
  assert.equal(sum('correctionCents'), result.stats.totalCorrectionCents, `${message}: estatística totaliza correção`);
  assert.equal(
    sum('monthlyExtraCostCents'),
    result.stats.totalMonthlyExtraCostsCents,
    `${message}: estatística totaliza custos mensais`,
  );
  assert.equal(
    sum('regularAmortizationCents') + sum('extraPaymentCents'),
    result.stats.totalAmortizedCents,
    `${message}: estatística totaliza amortização regular e extra`,
  );
}

for (const system of ['sac', 'price']) {
  const comparison = finance.simulateComparison(config(system));
  assert.equal(comparison.current.installments.length, 120, `${system}: mantém o prazo sem extras`);
  assert.equal(comparison.current.installments.at(-1).closingBalanceCents, 0, `${system}: encerra o saldo`);
  assert.equal(comparison.current.stats.interestSavingsCents, 0, `${system}: não inventa economia`);
}

const sacWithoutCorrection = finance.simulate(config('sac'));
assert.deepEqual(
  {
    firstInterest: sacWithoutCorrection.installments[0].interestCents,
    firstAmortization: sacWithoutCorrection.installments[0].regularAmortizationCents,
    firstPayment: sacWithoutCorrection.installments[0].regularPaymentCents,
    finalPayment: sacWithoutCorrection.installments.at(-1).regularPaymentCents,
    totalInterest: sacWithoutCorrection.stats.totalInterestCents,
    totalCorrection: sacWithoutCorrection.stats.totalCorrectionCents,
  },
  {
    firstInterest: 100000,
    firstAmortization: 83333,
    firstPayment: 183333,
    finalPayment: 84207,
    totalInterest: 6050024,
    totalCorrection: 0,
  },
  'SAC sem correção mantém os valores atuais',
);

const priceWithoutCorrection = finance.simulate(config('price'));
assert.deepEqual(
  {
    firstInterest: priceWithoutCorrection.installments[0].interestCents,
    firstAmortization: priceWithoutCorrection.installments[0].regularAmortizationCents,
    firstPayment: priceWithoutCorrection.installments[0].regularPaymentCents,
    finalPayment: priceWithoutCorrection.installments.at(-1).regularPaymentCents,
    totalInterest: priceWithoutCorrection.stats.totalInterestCents,
    totalCorrection: priceWithoutCorrection.stats.totalCorrectionCents,
  },
  {
    firstInterest: 100000,
    firstAmortization: 43471,
    firstPayment: 143471,
    finalPayment: 143457,
    totalInterest: 7216506,
    totalCorrection: 0,
  },
  'Price sem correção mantém os valores atuais',
);

const reduceTerm = [{ type: 'single', month: 2, valueCents: 2000000, goal: 'term' }];
const reducePayment = [{ type: 'single', month: 2, valueCents: 2000000, goal: 'payment' }];

for (const system of ['sac', 'price']) {
  const base = finance.simulate(config(system));
  const shorter = finance.simulateComparison(config(system, reduceTerm)).current;
  const lowerPayment = finance.simulateComparison(config(system, reducePayment)).current;
  assert.ok(shorter.installments.length < 120, `${system}: reduz o prazo`);
  assert.equal(lowerPayment.installments.length, 120, `${system}: preserva o prazo contratual`);
  assert.ok(lowerPayment.installments[2].regularPaymentCents < base.installments[2].regularPaymentCents, `${system}: reduz a parcela seguinte`);
}

const monthlyExtra = [{ type: 'recurring', startMonth: 1, endMonth: null, frequency: 1, valueCents: 10000, goal: 'term' }];
const annualExtra = [{ type: 'recurring', startMonth: 1, endMonth: 120, frequency: 12, valueCents: 10000, goal: 'payment' }];
assert.ok(finance.simulate(config('sac', monthlyExtra)).stats.totalExtraCents > 0, 'aplica recorrência mensal');
assert.equal(finance.simulate(config('price', annualExtra)).installments.filter((row) => row.extraPaymentCents > 0).length, 10, 'aplica recorrência anual');

const combinedExtras = [
  { type: 'single', month: 1, valueCents: 10000, goal: 'term' },
  { type: 'single', month: 1, valueCents: 20000, goal: 'term' },
];
assert.equal(finance.simulate(config('sac', combinedExtras)).installments[0].extraPaymentCents, 30000, 'soma extras compatíveis no mesmo mês');

for (const system of ['sac', 'price']) {
  for (const goal of ['term', 'payment']) {
    const splitRules = combinedExtras.map((rule) => ({ ...rule, month: 12, goal }));
    const summedRule = [{ type: 'single', month: 12, valueCents: 30000, goal }];
    const splitResult = finance.simulate(config(system, splitRules));
    const summedResult = finance.simulate(config(system, summedRule));
    assert.deepEqual(
      financialSchedule(splitResult),
      financialSchedule(summedResult),
      `${system}/${goal}: regras consecutivas recalculam uma vez e preservam os valores anteriores`,
    );
    assert.deepEqual(splitResult.stats, summedResult.stats, `${system}/${goal}: agregação preserva estatísticas`);
    assert.deepEqual(
      splitResult.installments[11].extraApplications,
      [
        { goal, requestedCents: 10000, appliedCents: 10000 },
        { goal, requestedCents: 20000, appliedCents: 20000 },
      ],
      `${system}/${goal}: mantém o detalhamento individual após agregar o recálculo`,
    );
  }
}

const mixedTermThenPayment = [
  { type: 'single', month: 12, valueCents: 10000, goal: 'term' },
  { type: 'single', month: 12, valueCents: 10000, goal: 'payment' },
];
const mixedPaymentThenTerm = [...mixedTermThenPayment].reverse();

for (const system of ['sac', 'price']) {
  const termThenPayment = finance.simulate(config(system, mixedTermThenPayment));
  const paymentThenTerm = finance.simulate(config(system, mixedPaymentThenTerm));
  const termThenPaymentRow = termThenPayment.installments[11];
  const paymentThenTermRow = paymentThenTerm.installments[11];

  assert.equal(termThenPaymentRow.extraGoal, 'mixed', `${system}: identifica objetivos efetivamente mistos`);
  assert.deepEqual(
    termThenPaymentRow.extraApplications.map((application) => application.goal),
    ['term', 'payment'],
    `${system}: aplica prazo e depois parcela na ordem das regras`,
  );
  assert.deepEqual(
    paymentThenTermRow.extraApplications.map((application) => application.goal),
    ['payment', 'term'],
    `${system}: aplica parcela e depois prazo na ordem inversa`,
  );
  assert.notDeepEqual(
    {
      effectiveTerm: termThenPayment.stats.effectiveTerm,
      nextPaymentCents: termThenPayment.installments[12].regularPaymentCents,
      totalInterestCents: termThenPayment.stats.totalInterestCents,
    },
    {
      effectiveTerm: paymentThenTerm.stats.effectiveTerm,
      nextPaymentCents: paymentThenTerm.installments[12].regularPaymentCents,
      totalInterestCents: paymentThenTerm.stats.totalInterestCents,
    },
    `${system}: a ordem produz cronogramas determinísticos e distintos`,
  );
  assertApplicationTotals(termThenPayment, `${system}: prazo seguido de parcela`);
  assertApplicationTotals(paymentThenTerm, `${system}: parcela seguida de prazo`);
}

const recurringMixedRules = [
  { type: 'recurring', startMonth: 1, endMonth: 13, frequency: 6, valueCents: 10000, goal: 'term' },
  { type: 'recurring', startMonth: 1, endMonth: 13, frequency: 6, valueCents: 20000, goal: 'payment' },
];
assert.deepEqual(finance.findMixedGoalMonths(recurringMixedRules, 24), [1, 7, 13], 'lista todos os cruzamentos recorrentes');
assert.equal(finance.findGoalConflict(recurringMixedRules, 24), 1, 'mantém o detector do primeiro cruzamento para aviso não bloqueante');
const recurringMixed = finance.simulate(config('price', recurringMixedRules));
for (const month of [1, 7, 13]) {
  assert.deepEqual(
    recurringMixed.installments[month - 1].extraApplications.map((application) => application.goal),
    ['term', 'payment'],
    `recorrências preservam a ordem no mês ${month}`,
  );
}

const payoffApplications = [
  { type: 'single', month: 1, valueCents: 4000000, goal: 'term' },
  { type: 'single', month: 1, valueCents: 999999999, goal: 'payment' },
  { type: 'single', month: 1, valueCents: 1000000, goal: 'term' },
];
const payoffResult = finance.simulate(config('price', payoffApplications));
const payoffRow = payoffResult.installments[0];
assert.equal(payoffRow.closingBalanceCents, 0, 'limita cada aplicação ao saldo e quita sem saldo negativo');
assert.equal(payoffRow.extraApplications[0].appliedCents, 4000000, 'aplica integralmente o primeiro aporte');
assert.equal(
  payoffRow.extraApplications[1].appliedCents,
  payoffRow.correctedBalanceCents - payoffRow.regularAmortizationCents - 4000000,
  'limita o segundo aporte ao saldo disponível',
);
assert.equal(payoffRow.extraApplications[2].appliedCents, 0, 'registra com zero a aplicação posterior à quitação');
assert.equal(payoffRow.extraGoal, 'mixed', 'resume apenas os dois objetivos efetivamente aplicados');
assertApplicationTotals(payoffResult, 'quitação com aplicações ordenadas');

const termPayoff = finance.simulate(config('sac', [
  { type: 'single', month: 1, valueCents: 999999999, goal: 'term' },
  { type: 'single', month: 1, valueCents: 10000, goal: 'payment' },
]));
assert.equal(termPayoff.installments[0].extraApplications[1].appliedCents, 0, 'mantém a aplicação mista posterior à quitação');
assert.equal(termPayoff.installments[0].extraGoal, 'term', 'não marca como misto o objetivo que aplicou valor zero');

assert.equal(finance.simulate(config('price', [], { monthlyRate: 0 })).stats.totalInterestCents, 0, 'aceita taxa zero');
const zeroRateMixed = finance.simulate(config('price', mixedTermThenPayment, { monthlyRate: 0 }));
assert.equal(zeroRateMixed.stats.totalInterestCents, 0, 'taxa zero permanece válida com objetivos mistos');
assert.equal(zeroRateMixed.installments.at(-1).closingBalanceCents, 0, 'taxa zero mista quita o saldo');
assertApplicationTotals(zeroRateMixed, 'taxa zero com objetivos mistos');
assert.equal(
  finance.simulate(config('price', [{ type: 'single', month: 1, valueCents: 999999999, goal: 'term' }])).installments.length,
  1,
  'limita o extra ao saldo e quita o contrato',
);
assert.equal(finance.simulate(config('sac', [], { term: 420 })).installments.length, 420, 'suporta prazo de 420 meses');
assert.equal(finance.addMonthsClamped('2027-01-31', 1), '2027-02-28', 'ajusta fevereiro');
assert.equal(finance.addMonthsClamped('2027-01-31', 2), '2027-03-31', 'preserva o dia-base quando possível');
assert.ok(Math.abs(finance.monthlyRateFromPercent(12, 'annual', 'effective') - (Math.pow(1.12, 1 / 12) - 1)) < 1e-12, 'converte taxa anual efetiva');
assert.equal(finance.monthlyRateFromPercent(12, 'annual', 'nominal'), 0.01, 'converte taxa anual nominal');

const withMonthlyCosts = finance.simulate(config('sac', [], { monthlyExtraCostCents: 12345 }));
assert.equal(withMonthlyCosts.installments[0].monthlyExtraCostCents, 12345, 'inclui custos no pagamento mensal');
assert.equal(withMonthlyCosts.stats.totalMonthlyExtraCostsCents, 12345 * 120, 'totaliza custos durante o contrato');
assert.equal(
  withMonthlyCosts.stats.totalPaidCents,
  10000000 + withMonthlyCosts.stats.totalInterestCents + withMonthlyCosts.stats.totalMonthlyExtraCostsCents,
  'inclui custos extras no total pago sem amortizar o saldo',
);

const sacFixedCorrection = finance.simulate(config('sac', [], { term: 3, correctionMode: 'fixed', monthlyCorrectionRate: 0.005 }));
assert.equal(sacFixedCorrection.installments[0].correctionRate, 0.005, 'SAC aplica percentual fixo no mês');
assert.equal(sacFixedCorrection.installments[0].correctionCents, 50000, 'SAC calcula correção sobre saldo inicial');
assert.equal(sacFixedCorrection.installments[0].correctedBalanceCents, 10050000, 'SAC usa saldo corrigido');
assert.equal(sacFixedCorrection.installments[0].interestCents, 100500, 'SAC calcula juros sobre saldo corrigido');
assert.equal(sacFixedCorrection.installments[0].regularAmortizationCents, 3350000, 'SAC recalcula amortização pelo saldo corrigido e parcelas restantes');
assert.equal(sacFixedCorrection.stats.totalCorrectionCents, 100334, 'SAC totaliza correção mensal fixa');

const sacLongFixedCorrection = finance.simulate(config('sac', [], {
  financedCents: 40000000,
  term: 360,
  monthlyRate: finance.monthlyRateFromPercent(10.654, 'annual', 'effective'),
  correctionMode: 'fixed',
  monthlyCorrectionRate: 0.01,
}));
assert.equal(sacLongFixedCorrection.installments[0].correctionCents, 400000, 'SAC longo calcula a primeira correção sobre o saldo inicial');
assert.equal(sacLongFixedCorrection.installments[0].regularAmortizationCents, 112222, 'SAC longo usa saldo corrigido dividido pelas parcelas restantes');
assert.equal(sacLongFixedCorrection.installments[0].interestCents, 342276, 'SAC longo calcula juros sobre saldo corrigido');
assert.equal(sacLongFixedCorrection.installments[0].closingBalanceCents, 40287778, 'SAC longo evita amortização nominal fixa artificial');
assert.equal(sacLongFixedCorrection.stats.correctionAboveAmortizationMonth, 1, 'detecta quando a correção supera a amortização regular');

const priceFixedCorrection = finance.simulate(config('price', [], { term: 3, correctionMode: 'fixed', monthlyCorrectionRate: 0.005 }));
assert.equal(priceFixedCorrection.installments[0].correctionCents, 50000, 'Price calcula correção sobre saldo inicial');
assert.equal(priceFixedCorrection.installments[0].regularPaymentCents, 3417222, 'Price usa saldo corrigido no pagamento regular');
assert.equal(priceFixedCorrection.stats.totalCorrectionCents, 100668, 'Price totaliza correção mensal fixa');

const customCorrection = finance.simulate(config('sac', [], { term: 4, correctionMode: 'custom', monthlyCorrectionRates: [0.001, 0.002, 0.003, 0.004] }));
assert.deepEqual(
  customCorrection.installments.map((row) => row.correctionRate),
  [0.001, 0.002, 0.003, 0.004],
  'aplica série mensal personalizada',
);

const shortCustomCorrection = finance.simulate(config('sac', [], { term: 4, correctionMode: 'custom', monthlyCorrectionRates: [0.001, 0.002] }));
assert.deepEqual(
  shortCustomCorrection.installments.map((row) => row.correctionRate),
  [0.001, 0.002, 0.002, 0.002],
  'repete o último percentual quando a série é menor que o prazo',
);

const correctionWithExtra = finance.simulateComparison(config(
  'sac',
  [{ type: 'single', month: 1, valueCents: 500000, goal: 'term' }],
  { term: 12, correctionMode: 'fixed', monthlyCorrectionRate: 0.005 },
));
assert.equal(correctionWithExtra.base.installments[0].correctionRate, correctionWithExtra.current.installments[0].correctionRate, 'usa a mesma taxa de correção na comparação');
assert.equal(correctionWithExtra.current.installments[0].extraPaymentCents, 500000, 'aplica amortização extra junto com correção monetária');
assert.ok(correctionWithExtra.current.stats.totalCorrectionCents > 0, 'mantém correção com amortização extra');

for (const system of ['sac', 'price']) {
  const correctedBase = finance.simulateComparison(config(system, [], { correctionMode: 'fixed', monthlyCorrectionRate: 0.005 })).current;
  const correctedTermExtra = finance.simulateComparison(config(
    system,
    [{ type: 'single', month: 1, valueCents: 1000000, goal: 'term' }],
    { correctionMode: 'fixed', monthlyCorrectionRate: 0.005 },
  )).current;
  const correctedPaymentExtra = finance.simulateComparison(config(
    system,
    [{ type: 'single', month: 1, valueCents: 1000000, goal: 'payment' }],
    { correctionMode: 'fixed', monthlyCorrectionRate: 0.005 },
  )).current;

  assert.ok(correctedTermExtra.stats.effectiveTerm < correctedBase.stats.effectiveTerm, `${system}: extra com correção reduz o prazo quando esse é o objetivo`);
  assert.equal(correctedPaymentExtra.stats.effectiveTerm, correctedBase.stats.effectiveTerm, `${system}: extra com correção preserva o prazo quando reduz parcela`);
  assert.ok(correctedPaymentExtra.installments[1].regularPaymentCents < correctedBase.installments[1].regularPaymentCents, `${system}: extra com correção reduz a parcela seguinte quando esse é o objetivo`);
}

const mixedCorrectionCases = [
  ['fixa', { correctionMode: 'fixed', monthlyCorrectionRate: 0.002 }],
  ['personalizada', { correctionMode: 'custom', monthlyCorrectionRates: [0.001, 0.002, 0.0015] }],
];
for (const system of ['sac', 'price']) {
  for (const [correctionLabel, overrides] of mixedCorrectionCases) {
    for (const [orderLabel, rules] of [
      ['prazo-parcela', mixedTermThenPayment],
      ['parcela-prazo', mixedPaymentThenTerm],
    ]) {
      const result = finance.simulate(config(system, rules, overrides));
      assert.equal(result.installments[11].extraGoal, 'mixed', `${system}/${correctionLabel}/${orderLabel}: mantém objetivos mistos`);
      assert.equal(result.installments.at(-1).closingBalanceCents, 0, `${system}/${correctionLabel}/${orderLabel}: quita o saldo corrigido`);
      assertApplicationTotals(result, `${system}/${correctionLabel}/${orderLabel}`);
    }
  }
}

const termRule = [{ type: 'single', month: 12, valueCents: 1000000, goal: 'term' }];
const termThenLaterPaymentRules = [
  ...termRule,
  { type: 'single', month: 24, valueCents: 500000, goal: 'payment' },
];
const horizonCases = [
  ['sem correção', {}],
  ['com correção fixa', { correctionMode: 'fixed', monthlyCorrectionRate: 0.002 }],
  ['com correção personalizada', {
    correctionMode: 'custom',
    monthlyCorrectionRates: Array.from({ length: 120 }, (_, index) => 0.001 + (index % 3) * 0.0002),
  }],
];

for (const system of ['sac', 'price']) {
  for (const [label, overrides] of horizonCases) {
    const termOnly = finance.simulate(config(system, termRule, overrides));
    const termThenLaterPayment = finance.simulate(config(system, termThenLaterPaymentRules, overrides));
    assert.ok(termOnly.stats.effectiveTerm < 120, `${system}/${label}: primeiro aporte reduz o horizonte`);
    assert.equal(
      termThenLaterPayment.stats.effectiveTerm,
      termOnly.stats.effectiveTerm,
      `${system}/${label}: redução posterior de parcela preserva o horizonte já encurtado`,
    );
    assert.ok(
      termThenLaterPayment.installments[24].regularPaymentCents < termOnly.installments[24].regularPaymentCents,
      `${system}/${label}: aporte posterior reduz a parcela dentro do horizonte encurtado`,
    );
    assert.equal(
      termThenLaterPayment.installments.at(-1).closingBalanceCents,
      0,
      `${system}/${label}: quita no horizonte preservado`,
    );
    assertApplicationTotals(termThenLaterPayment, `${system}/${label}: objetivos em meses distintos`);
  }
}

const tinySacTerm = [{ type: 'single', month: 12, valueCents: 1, goal: 'term' }];
const tinySacMixed = [...tinySacTerm, { type: 'single', month: 24, valueCents: 1, goal: 'payment' }];
assert.equal(
  finance.simulate(config('sac', tinySacMixed)).stats.effectiveTerm,
  finance.simulate(config('sac', tinySacTerm)).stats.effectiveTerm,
  'SAC preserva o horizonte efetivo mesmo quando o arredondamento adiciona um mês ao horizonte estimado',
);

const reportedCorrectionScenario = finance.simulateComparison({
  financedCents: 40000000,
  term: 360,
  system: 'sac',
  monthlyRate: finance.monthlyRateFromPercent(11, 'annual', 'nominal'),
  monthlyExtraCostCents: 195,
  correctionMode: 'fixed',
  monthlyCorrectionRate: 0.001664,
  firstDueDate: '2026-07-15',
  extraPayments: [{ type: 'single', month: 1, valueCents: 5000000, goal: 'term' }],
}).current;
assert.ok(reportedCorrectionScenario.stats.effectiveTerm < 360, 'cenário reportado reduz o prazo efetivo com correção monetária');
assert.ok(reportedCorrectionScenario.stats.reducedMonths > 0, 'cenário reportado informa meses reduzidos');

const caixaLikeSacTermScenario = finance.simulateComparison({
  financedCents: 43500000,
  term: 360,
  system: 'sac',
  monthlyRate: finance.monthlyRateFromPercent(10.654, 'annual', 'nominal'),
  monthlyExtraCostCents: 19500,
  correctionMode: 'fixed',
  monthlyCorrectionRate: 0.001742,
  firstDueDate: '2026-07-15',
  extraPayments: [{ type: 'single', month: 3, valueCents: 4100000, goal: 'term' }],
}).current;
assert.equal(caixaLikeSacTermScenario.stats.effectiveTerm, 252, 'SAC com extra para prazo recalcula prazo próximo ao comportamento Caixa');
assert.equal(caixaLikeSacTermScenario.stats.reducedMonths, 108, 'SAC com extra para prazo reduz aproximadamente 9 anos no cenário de referência');
assert.equal(caixaLikeSacTermScenario.installments[3].regularPaymentCents, 507159, 'SAC com extra para prazo preserva aproximadamente o encargo financeiro de referência');
assert.ok(
  caixaLikeSacTermScenario.installments[3].regularAmortizationCents > caixaLikeSacTermScenario.installments[2].regularAmortizationCents,
  'SAC com extra para prazo aumenta a amortização regular seguinte',
);

const caixaLikeSacTermScenarioWithoutCorrection = finance.simulateComparison({
  financedCents: 43500000,
  term: 360,
  system: 'sac',
  monthlyRate: finance.monthlyRateFromPercent(10.654, 'annual', 'nominal'),
  monthlyExtraCostCents: 19500,
  correctionMode: 'none',
  firstDueDate: '2026-07-15',
  extraPayments: [{ type: 'single', month: 3, valueCents: 4100000, goal: 'term' }],
}).current;
assert.equal(caixaLikeSacTermScenarioWithoutCorrection.stats.effectiveTerm, 250, 'SAC sem correção recalcula prazo no cenário de referência');
assert.equal(caixaLikeSacTermScenarioWithoutCorrection.stats.reducedMonths, 110, 'SAC sem correção reduz cerca de 110 meses no cenário de referência');

const caixaLikeSacPaymentScenario = finance.simulateComparison({
  financedCents: 43500000,
  term: 360,
  system: 'sac',
  monthlyRate: finance.monthlyRateFromPercent(10.654, 'annual', 'nominal'),
  monthlyExtraCostCents: 19500,
  correctionMode: 'fixed',
  monthlyCorrectionRate: 0.001742,
  firstDueDate: '2026-07-15',
  extraPayments: [{ type: 'single', month: 3, valueCents: 4100000, goal: 'payment' }],
}).current;
assert.equal(caixaLikeSacPaymentScenario.stats.effectiveTerm, 360, 'SAC com extra para parcela preserva o prazo no cenário de referência');
assert.ok(
  caixaLikeSacPaymentScenario.installments[3].regularPaymentCents < caixaLikeSacTermScenario.installments[3].regularPaymentCents,
  'SAC com extra para parcela reduz a parcela seguinte em vez do prazo',
);

const unchangedPriceTermScenario = finance.simulateComparison({
  financedCents: 43500000,
  term: 360,
  system: 'price',
  monthlyRate: finance.monthlyRateFromPercent(10.654, 'annual', 'nominal'),
  monthlyExtraCostCents: 19500,
  correctionMode: 'fixed',
  monthlyCorrectionRate: 0.001742,
  firstDueDate: '2026-07-15',
  extraPayments: [{ type: 'single', month: 3, valueCents: 4100000, goal: 'term' }],
}).current;
assert.equal(unchangedPriceTermScenario.stats.effectiveTerm, 232, 'Price com extra para prazo preserva o comportamento anterior');

for (const result of [
  sacFixedCorrection,
  priceFixedCorrection,
  customCorrection,
  shortCustomCorrection,
  correctionWithExtra.current,
  reportedCorrectionScenario,
  caixaLikeSacTermScenario,
  caixaLikeSacTermScenarioWithoutCorrection,
  caixaLikeSacPaymentScenario,
  unchangedPriceTermScenario,
]) {
  assert.equal(result.installments.at(-1).closingBalanceCents, 0, 'quita o saldo final sem saldo negativo');
}

console.log('Testes financeiros concluídos com sucesso.');
