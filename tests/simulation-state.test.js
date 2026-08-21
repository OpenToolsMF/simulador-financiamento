'use strict';

const assert = require('node:assert/strict');
const simulationState = require('../assets/js/simulation-state.js');
const scenarios = require('../src/_data/scenarios.cjs');

const base = scenarios.scenarios['term-vs-payment'].state;
const clone = (value) => JSON.parse(JSON.stringify(value));
const singleExtra = (goal, month, valueCents = 100_000) => ({
  type: 'single',
  valueCents,
  month,
  startMonth: null,
  endMonth: null,
  frequencyMonths: null,
  goal,
});
const recurringExtra = (goal, startMonth, endMonth, frequencyMonths, valueCents = 100_000) => ({
  type: 'recurring',
  valueCents,
  month: null,
  startMonth,
  endMonth,
  frequencyMonths,
  goal,
});

const encoded = simulationState.encodeSimulationState(base);
assert.ok(encoded.startsWith('1.'), 'payload usa versão 1');
assert.deepEqual(
  simulationState.decodeSimulationParam(encoded),
  base,
  'payload faz round-trip sem resultados calculados',
);
assert.deepEqual(
  simulationState.readSimulationStateFromSearch(`?utm_source=test&sim=${encodeURIComponent(encoded)}`),
  { status: 'valid', state: base, error: null },
  'leitor encontra um payload válido junto de outros parâmetros',
);
assert.deepEqual(
  simulationState.readSimulationStateFromSearch(''),
  { status: 'absent', state: null, error: null },
  'distingue ausência de payload',
);

const mixedSameMonth = clone(base);
mixedSameMonth.extraPayments = [
  singleExtra('term', 12, 1_000_000),
  singleExtra('payment', 12, 500_000),
];
const mixedSameMonthEncoded = simulationState.encodeSimulationState(mixedSameMonth);
assert.deepEqual(
  simulationState.decodeSimulationParam(mixedSameMonthEncoded),
  mixedSameMonth,
  'aceita objetivos mistos no mesmo mês e preserva a ordem no round-trip v1',
);

const mixedSameMonthReversed = clone(mixedSameMonth);
mixedSameMonthReversed.extraPayments.reverse();
const mixedSameMonthReversedEncoded = simulationState.encodeSimulationState(mixedSameMonthReversed);
assert.notEqual(
  mixedSameMonthReversedEncoded,
  mixedSameMonthEncoded,
  'ordens diferentes geram payloads distintos',
);
assert.deepEqual(
  simulationState.decodeSimulationParam(mixedSameMonthReversedEncoded).extraPayments,
  mixedSameMonthReversed.extraPayments,
  'a ordem inversa também é preservada na decodificação',
);

const mixedRecurringAndSingle = clone(base);
mixedRecurringAndSingle.extraPayments = [
  recurringExtra('payment', 6, 30, 6, 250_000),
  singleExtra('term', 12, 750_000),
];
assert.deepEqual(
  simulationState.decodeSimulationParam(
    simulationState.encodeSimulationState(mixedRecurringAndSingle),
  ),
  mixedRecurringAndSingle,
  'aceita regra recorrente e pontual de objetivos distintos que coincidem no mesmo mês',
);

function invalidParam(mutator) {
  const value = clone(base);
  mutator(value);
  return `1.${Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')}`;
}

for (const [label, payload] of [
  ['versão desconhecida', encoded.replace(/^1\./, '2.')],
  ['base64 inválido', '1.%%%'],
  ['campo ausente', invalidParam((value) => { delete value.term; })],
  ['valor não finito', invalidParam((value) => { value.ratePercent = 'NaN'; })],
  ['prazo acima de 600', invalidParam((value) => { value.term = 601; })],
  ['campo desconhecido', invalidParam((value) => { value.result = { total: 1 }; })],
  ['série de correção longa', invalidParam((value) => {
    value.correction = {
      mode: 'custom',
      monthlyRatePercent: 0,
      monthlyRatesPercent: Array.from({ length: 601 }, () => 0.1),
    };
  })],
  ['mais de cem amortizações', invalidParam((value) => {
    value.extraPayments = Array.from({ length: 101 }, (_, index) => ({
      type: 'single',
      valueCents: 100,
      month: (index % value.term) + 1,
      startMonth: null,
      endMonth: null,
      frequencyMonths: null,
      goal: 'term',
    }));
  })],
  ['objetivo de amortização inválido', invalidParam((value) => {
    value.extraPayments = [singleExtra('mixed', 10)];
  })],
  ['campo desconhecido em amortização mista', invalidParam((value) => {
    value.extraPayments = [
      { ...singleExtra('term', 10), order: 1 },
      singleExtra('payment', 10),
    ];
  })],
  ['frequência recorrente inválida', invalidParam((value) => {
    value.extraPayments = [recurringExtra('payment', 1, 12, 0)];
  })],
]) {
  const decoded = simulationState.readSimulationStateFromSearch(`?sim=${encodeURIComponent(payload)}`);
  assert.equal(decoded.status, 'invalid', `rejeita ${label}`);
  assert.equal(decoded.state, null, `${label} não é aplicado parcialmente`);
}

const oversized = `1.${Buffer.alloc(simulationState.MAX_PAYLOAD_BYTES + 1, 32).toString('base64url')}`;
assert.equal(
  simulationState.readSimulationStateFromSearch(`?sim=${oversized}`).status,
  'invalid',
  'rejeita payload acima de 16 KiB',
);

for (const [scenarioId, scenario] of Object.entries(scenarios.scenarios)) {
  const decoded = simulationState.decodeSimulationParam(
    new URLSearchParams(scenario.simulationSearch).get('sim'),
  );
  assert.deepEqual(decoded, scenario.state, `${scenarioId}: CTA codifica somente o estado canônico`);
}

console.log('Testes dos links de simulação concluídos com sucesso.');
