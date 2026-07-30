'use strict';

const assert = require('node:assert/strict');
const simulationState = require('../assets/js/simulation-state.js');
const scenarios = require('../src/_data/scenarios.cjs');

const base = scenarios.scenarios['term-vs-payment'].state;
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

function invalidParam(mutator) {
  const value = JSON.parse(JSON.stringify(base));
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
  ['conflito de objetivos', invalidParam((value) => {
    value.extraPayments = [
      {
        type: 'single',
        valueCents: 100,
        month: 10,
        startMonth: null,
        endMonth: null,
        frequencyMonths: null,
        goal: 'term',
      },
      {
        type: 'single',
        valueCents: 100,
        month: 10,
        startMonth: null,
        endMonth: null,
        frequencyMonths: null,
        goal: 'payment',
      },
    ];
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
