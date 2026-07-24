'use strict';

const assert = require('node:assert/strict');
const comparison = require('../assets/js/comparison.js');
const finance = require('../assets/js/finance.js');

const bcbData = {
  creditTypes: {
    realEstate: {
      referencePeriod: '2026-06',
      modalities: [
        {
          key: 'marketTr',
          label: 'Pós-fixado TR',
          institutions: [
            {
              institution: 'BANCO B',
              cnpj8: '22222222',
              position: 2,
              monthlyRatePercent: 0.9,
              annualRatePercent: 11.35,
            },
            {
              institution: 'BANCO A',
              cnpj8: '11111111',
              position: 1,
              monthlyRatePercent: 0.7,
              annualRatePercent: 8.73,
            },
          ],
        },
        {
          key: 'marketFixed',
          label: 'Prefixado',
          institutions: [
            {
              institution: 'BANCO C',
              cnpj8: '33333333',
              position: 3,
              monthlyRatePercent: 1.1,
              annualRatePercent: 14.03,
            },
          ],
        },
      ],
    },
    vehicle: {
      referencePeriod: {
        startDate: '2026-07-01',
        endDate: '2026-07-07',
      },
      modalities: [
        {
          key: 'vehicleFixed',
          label: 'Aquisição de veículos - Prefixado',
          institutions: [
            {
              institution: 'BANCO VEICULAR B',
              cnpj8: '55555555',
              position: 2,
              monthlyRatePercent: 1.2,
              annualRatePercent: 15.39,
            },
            {
              institution: 'BANCO VEICULAR A',
              cnpj8: '44444444',
              position: 1,
              monthlyRatePercent: 0.8,
              annualRatePercent: 10.03,
            },
          ],
        },
      ],
    },
  },
};

const trReference = comparison.highestRecentTrRate([
  { month: '2026-01', date: '2026-01-01', ratePercent: 0.11 },
  { month: '2026-02', date: '2026-02-01', ratePercent: 0.18 },
  { month: '2026-03', date: '2026-03-01', ratePercent: 0.14 },
], 12);

assert.deepEqual(
  trReference,
  {
    ratePercent: 0.18,
    startMonth: '2026-01',
    endMonth: '2026-03',
    selectedMonth: '2026-02',
    months: 3,
  },
  'seleciona a maior TR do período recente',
);

assert.deepEqual(
  comparison.creditRateEntries(bcbData, 'realEstate').map((entry) => `${entry.institution}:${entry.modalityKey}`),
  ['BANCO B:marketTr', 'BANCO A:marketTr', 'BANCO C:marketFixed'],
  'monta linhas imobiliárias com todas as modalidades disponíveis',
);

assert.deepEqual(
  comparison.creditRateEntries(bcbData, 'vehicle').map((entry) => `${entry.institution}:${entry.modalityKey}`),
  ['BANCO VEICULAR B:vehicleFixed', 'BANCO VEICULAR A:vehicleFixed'],
  'monta linhas veiculares disponíveis',
);

const annualRateCalls = [];
const financeSpy = {
  monthlyRateFromPercent(ratePercent, period, annualType) {
    annualRateCalls.push({ ratePercent, period, annualType });
    return ratePercent / 10_000;
  },
  simulate(config) {
    return {
      stats: {
        totalPaidCents: config.financedCents + Math.round(config.monthlyRate * 100_000_000),
        initialTotalPaymentCents: Math.round(config.financedCents / config.term),
        finalTotalPaymentCents: Math.round(config.financedCents / config.term) + 100,
        totalInterestCents: Math.round(config.monthlyRate * 50_000_000),
        effectiveTerm: config.term,
      },
    };
  },
};

const spyResult = comparison.buildComparisonRows({
  bcbData,
  creditType: 'realEstate',
  financedCents: 10000000,
  term: 120,
  monthlyCorrectionRate: 0.0018,
  system: 'sac',
  finance: financeSpy,
});

assert.deepEqual(
  annualRateCalls.map(({ period, annualType }) => `${period}:${annualType}`),
  ['annual:effective', 'annual:effective', 'annual:effective'],
  'usa taxa anual efetiva em todas as simulações',
);

assert.deepEqual(
  spyResult.rows.map((row) => row.institution),
  ['BANCO A', 'BANCO B', 'BANCO C'],
  'ordena pelo menor valor total pago',
);

const realEstateRows = comparison.buildComparisonRows({
  bcbData,
  creditType: 'realEstate',
  financedCents: 10000000,
  term: 120,
  monthlyCorrectionRate: trReference.ratePercent / 100,
  system: 'sac',
  finance,
});

const vehicleRows = comparison.buildComparisonRows({
  bcbData,
  creditType: 'vehicle',
  financedCents: 10000000,
  term: 120,
  monthlyCorrectionRate: trReference.ratePercent / 100,
  system: 'price',
  finance,
});

assert.equal(realEstateRows.rows.length, 3, 'simula todas as linhas imobiliárias válidas');
assert.equal(vehicleRows.rows.length, 2, 'simula todas as linhas veiculares válidas');
assert.ok(realEstateRows.rows[0].totalPaidCents <= realEstateRows.rows.at(-1).totalPaidCents, 'imobiliário fica ordenado por total pago');
assert.ok(vehicleRows.rows[0].totalPaidCents <= vehicleRows.rows.at(-1).totalPaidCents, 'veicular fica ordenado por total pago');
assert.equal(realEstateRows.referencePeriod, '2026-06', 'retorna referência imobiliária');
assert.equal(vehicleRows.referencePeriod, '2026-07-01 a 2026-07-07', 'retorna referência veicular');

const changedTermRows = comparison.buildComparisonRows({
  bcbData,
  creditType: 'realEstate',
  financedCents: 10000000,
  term: 240,
  monthlyCorrectionRate: trReference.ratePercent / 100,
  system: 'sac',
  finance,
});

assert.notEqual(
  changedTermRows.rows[0].totalPaidCents,
  realEstateRows.rows[0].totalPaidCents,
  'alterar prazo muda a simulação calculada',
);

console.log('Testes da comparação financeira concluídos com sucesso.');
