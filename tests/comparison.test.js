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
    const firstPayment = Math.round(config.financedCents / config.term);
    const installments = Array.from({ length: config.term }, (_, index) => ({
      number: index + 1,
      totalPaymentCents: firstPayment + index,
    }));
    return {
      installments,
      stats: {
        totalPaidCents: config.financedCents + Math.round(config.monthlyRate * 100_000_000),
        initialTotalPaymentCents: installments[0].totalPaymentCents,
        finalTotalPaymentCents: installments.at(-1).totalPaymentCents,
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

const sampleSeries = comparison.monthlyChartSeries([
  { number: 1, totalPaymentCents: 1000 },
  { number: 2, totalPaymentCents: 2500 },
  { number: 3, totalPaymentCents: 500 },
]);

assert.deepEqual(
  sampleSeries,
  [
    { number: 1, paymentCents: 1000, accumulatedPaidCents: 1000 },
    { number: 2, paymentCents: 2500, accumulatedPaidCents: 3500 },
    { number: 3, paymentCents: 500, accumulatedPaidCents: 4000 },
  ],
  'gera série mensal e acumulada para os gráficos',
);

assert.equal(spyResult.chartRows.length, 3, 'inclui todas as linhas no gráfico enquanto houver até 5 resultados');
assert.equal(spyResult.chartRows[0].institution, 'BANCO A', 'destaques de gráfico usam a mesma ordenação da tabela');
assert.deepEqual(
  spyResult.chartRows.map((row) => row.highlightRole),
  ['best', 'best', 'best'],
  'até 5 resultados marca todas as linhas como melhores opções',
);
assert.deepEqual(
  spyResult.rows.map((row) => row.highlightRole),
  ['best', 'best', 'best'],
  'tabela recebe metadados de destaque para todas as linhas até 5 resultados',
);
assert.deepEqual(
  spyResult.chartRows[0].series.slice(0, 2),
  [
    { number: 1, paymentCents: 83333, accumulatedPaidCents: 83333 },
    { number: 2, paymentCents: 83334, accumulatedPaidCents: 166667 },
  ],
  'preserva série mensal apenas para uso dos gráficos',
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

const sixRowsBcbData = {
  creditTypes: {
    realEstate: {
      referencePeriod: '2026-06',
      modalities: [
        {
          key: 'marketTr',
          institutions: Array.from({ length: 6 }, (_, index) => ({
            institution: `BANCO SEIS ${String(index + 1).padStart(2, '0')}`,
            annualRatePercent: 6 + index,
          })),
        },
      ],
    },
  },
};

const sixRowsResult = comparison.buildComparisonRows({
  bcbData: sixRowsBcbData,
  creditType: 'realEstate',
  financedCents: 10000000,
  term: 12,
  monthlyCorrectionRate: 0,
  system: 'sac',
  finance: financeSpy,
});

assert.equal(sixRowsResult.chartRows.length, 6, 'com 6 resultados mostra 5 melhores + pior');
assert.deepEqual(
  sixRowsResult.chartRows.map((row) => row.highlightRole),
  ['best', 'best', 'best', 'best', 'best', 'worst'],
  'com 6 resultados diferencia exatamente a última linha como maior custo',
);

const manyRowsBcbData = {
  creditTypes: {
    realEstate: {
      referencePeriod: '2026-06',
      modalities: [
        {
          key: 'marketTr',
          institutions: Array.from({ length: 12 }, (_, index) => ({
            institution: `BANCO ${String(index + 1).padStart(2, '0')}`,
            annualRatePercent: 20 - index,
          })),
        },
      ],
    },
  },
};

const manyRowsResult = comparison.buildComparisonRows({
  bcbData: manyRowsBcbData,
  creditType: 'realEstate',
  financedCents: 10000000,
  term: 12,
  monthlyCorrectionRate: 0,
  system: 'sac',
  finance: financeSpy,
});

assert.equal(manyRowsResult.rows.length, 12, 'mantém todas as linhas na tabela');
assert.equal(manyRowsResult.chartRows.length, 6, 'limita os gráficos ao Top 5 mais barato + maior custo');
assert.deepEqual(
  manyRowsResult.chartRows.map((row) => row.institution),
  [...manyRowsResult.rows.slice(0, 5), manyRowsResult.rows.at(-1)].map((row) => row.institution),
  'gráficos usam as 5 primeiras linhas da tabela e a última linha como maior custo',
);
assert.equal(
  new Set(manyRowsResult.chartRows.map((row) => row.tableRank)).size,
  manyRowsResult.chartRows.length,
  'não duplica linhas nos gráficos',
);
assert.deepEqual(
  manyRowsResult.chartRows.map((row) => row.highlightRole),
  ['best', 'best', 'best', 'best', 'best', 'worst'],
  'marca Top 5 e maior custo com papéis distintos',
);
assert.deepEqual(
  manyRowsResult.chartRows.map((row) => row.highlightRank),
  [1, 2, 3, 4, 5, 12],
  'metadados preservam a posição da linha na tabela',
);
assert.deepEqual(
  manyRowsResult.chartRows.at(-1).highlightDash,
  [7, 5],
  'maior custo usa linha tracejada nos gráficos',
);
assert.ok(!('series' in manyRowsResult.rows[0]), 'linhas da tabela não carregam séries mensais');
assert.equal(manyRowsResult.rows[0].highlightRole, 'best', 'primeira linha da tabela recebe marcador de gráfico');
assert.equal(manyRowsResult.rows[5].highlightRole, undefined, 'linhas intermediárias fora dos destaques não recebem marcador');
assert.equal(manyRowsResult.rows.at(-1).highlightRole, 'worst', 'última linha da tabela recebe marcador de maior custo');

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

assert.notDeepEqual(
  changedTermRows.chartRows[0].series,
  realEstateRows.chartRows[0].series,
  'alterar prazo muda as séries usadas pelos gráficos',
);

console.log('Testes da comparação financeira concluídos com sucesso.');
