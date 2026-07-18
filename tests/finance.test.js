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
assert.throws(
  () => finance.simulate(config('sac', [combinedExtras[0], { ...combinedExtras[1], goal: 'payment' }])),
  (error) => error.code === 'EXTRA_GOAL_CONFLICT' && error.month === 1,
  'rejeita objetivos diferentes no mesmo mês por código de erro traduzível',
);

assert.equal(finance.simulate(config('price', [], { monthlyRate: 0 })).stats.totalInterestCents, 0, 'aceita taxa zero');
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
