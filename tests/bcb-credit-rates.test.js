'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const {
    REAL_ESTATE_SOURCE_URL,
    VEHICLE_SOURCE_URL,
    SOURCE_URLS,
    buildBcbCreditRatesData,
    updateBcbCreditRates,
  } = await import('../scripts/update-bcb-credit-rates.mjs');

  const realEstatePayload = {
    value: [
      {
        Mes: 'Mai-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Prefixado',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO ANTIGO S.A.',
        TaxaJurosAoMes: 0.5,
        TaxaJurosAoAno: 6.2,
        cnpj8: '11111111',
        anoMes: '2026-05',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Prefixado',
        Posicao: 3,
        InstituicaoFinanceira: 'BANCO C S.A.',
        TaxaJurosAoMes: 1.2,
        TaxaJurosAoAno: 15.39,
        cnpj8: '33333333',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Prefixado',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO A S.A.',
        TaxaJurosAoMes: '0,90',
        TaxaJurosAoAno: '11,35',
        cnpj8: '11111111',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Prefixado',
        Posicao: 2,
        InstituicaoFinanceira: 'BANCO B S.A.',
        TaxaJurosAoMes: 0,
        TaxaJurosAoAno: 0,
        cnpj8: '22222222',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Pós-fixado referenciado em TR',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO TR S.A.',
        TaxaJurosAoMes: 0.75,
        TaxaJurosAoAno: 9.38,
        cnpj8: '44444444',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Pós-fixado referenciado em TR',
        Posicao: 2,
        InstituicaoFinanceira: 'BANCO TR MEDIANA S.A.',
        TaxaJurosAoMes: 0.91,
        TaxaJurosAoAno: 11.51,
        cnpj8: '47474747',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Pós-fixado referenciado em TR',
        Posicao: 3,
        InstituicaoFinanceira: 'BANCO TR ALTO S.A.',
        TaxaJurosAoMes: 1.13,
        TaxaJurosAoAno: 14.38,
        cnpj8: '48484848',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas de mercado - Pós-fixado referenciado em IPCA',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO IPCA S.A.',
        TaxaJurosAoMes: 0.65,
        TaxaJurosAoAno: 8.08,
        cnpj8: '55555555',
        anoMes: '2026-06',
      },
      {
        Mes: 'Jun-2026',
        Modalidade: 'Financiamento imobiliário com taxas reguladas - Prefixado',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO REGULADO S.A.',
        TaxaJurosAoMes: 0.4,
        TaxaJurosAoAno: 4.91,
        cnpj8: '66666666',
        anoMes: '2026-06',
      },
    ],
  };

  const vehiclePayload = {
    value: [
      {
        InicioPeriodo: '2026-06-24',
        FimPeriodo: '2026-06-30',
        Segmento: 'PESSOA FÍSICA',
        Modalidade: 'Aquisição de veículos - Prefixado',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO VEICULAR ANTIGO S.A.',
        TaxaJurosAoMes: 0.6,
        TaxaJurosAoAno: 7.44,
        cnpj8: '77777777',
      },
      {
        InicioPeriodo: '2026-07-01',
        FimPeriodo: '2026-07-07',
        Segmento: 'PESSOA FÍSICA',
        Modalidade: 'Aquisição de veículos - Prefixado',
        Posicao: 2,
        InstituicaoFinanceira: 'BANCO VEICULAR B S.A.',
        TaxaJurosAoMes: '0,83',
        TaxaJurosAoAno: '10,46',
        cnpj8: '88888888',
      },
      {
        InicioPeriodo: '2026-07-01',
        FimPeriodo: '2026-07-07',
        Segmento: 'PESSOA FÍSICA',
        Modalidade: 'Aquisição de veículos - Prefixado',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO VEICULAR A S.A.',
        TaxaJurosAoMes: 0.68,
        TaxaJurosAoAno: 8.45,
        cnpj8: '99999999',
      },
      {
        InicioPeriodo: '2026-07-01',
        FimPeriodo: '2026-07-07',
        Segmento: 'PESSOA FÍSICA',
        Modalidade: 'Aquisição de veículos - Prefixado',
        Posicao: 3,
        InstituicaoFinanceira: 'BANCO VEICULAR ZERO S.A.',
        TaxaJurosAoMes: 0,
        TaxaJurosAoAno: 0,
        cnpj8: '10101010',
      },
      {
        InicioPeriodo: '2026-07-01',
        FimPeriodo: '2026-07-07',
        Segmento: 'PESSOA FÍSICA',
        Modalidade: 'Arrendamento mercantil de veículos - Prefixado',
        Posicao: 1,
        InstituicaoFinanceira: 'BANCO LEASING S.A.',
        TaxaJurosAoMes: 0.5,
        TaxaJurosAoAno: 6.17,
        cnpj8: '12121212',
      },
    ],
  };

  const data = buildBcbCreditRatesData(realEstatePayload, vehiclePayload, '2026-07-21T12:00:00.000Z');

  assert.deepEqual(data.sourceUrls, SOURCE_URLS, 'registra as URLs de origem');
  assert.equal(data.sourceUrl, REAL_ESTATE_SOURCE_URL, 'mantém URL principal compatível');
  assert.equal(data.generatedAt, '2026-07-21T12:00:00.000Z', 'permite generatedAt determinístico');
  assert.equal(data.referencePeriod, '2026-06', 'seleciona o período imobiliário mais recente');
  assert.equal(data.creditTypes.realEstate.modalities.length, 3, 'separa as três modalidades imobiliárias de mercado');
  assert.equal(data.creditTypes.vehicle.modalities.length, 1, 'separa a modalidade veicular prefixada');

  const fixed = data.creditTypes.realEstate.modalities.find((modality) => modality.key === 'marketFixed');
  assert.deepEqual(
    fixed.institutions.map((institution) => institution.institution),
    ['BANCO A S.A.', 'BANCO C S.A.'],
    'ordena imóveis por taxa mensal e ignora taxa zerada',
  );
  assert.equal(fixed.institutions[0].monthlyRatePercent, 0.9, 'normaliza vírgula decimal em imóveis');

  const vehicle = data.creditTypes.vehicle;
  assert.deepEqual(
    vehicle.referencePeriod,
    { startDate: '2026-07-01', endDate: '2026-07-07' },
    'seleciona o período diário veicular mais recente',
  );
  assert.deepEqual(
    vehicle.modalities[0].institutions.map((institution) => institution.institution),
    ['BANCO VEICULAR A S.A.', 'BANCO VEICULAR B S.A.'],
    'ordena veículos por taxa mensal e ignora taxa zerada/modalidade fora do escopo',
  );
  assert.equal(vehicle.modalities[0].institutions[1].monthlyRatePercent, 0.83, 'normaliza vírgula decimal em veículos');

  assert.deepEqual(
    data.defaultInterestRate,
    {
      creditType: 'realEstate',
      modalityKey: 'marketTr',
      method: 'median-market-tr-annual',
      referencePeriod: '2026-06',
      institutionCount: 3,
      monthlyRatePercent: 0.912001,
      annualEquivalentRatePercent: 11.51,
    },
    'calcula default pela mediana anual das taxas imobiliárias pós-fixadas TR válidas',
  );

  assert.throws(
    () => buildBcbCreditRatesData({ value: [] }, vehiclePayload, '2026-07-21T12:00:00.000Z'),
    /Nenhuma taxa imobiliária de mercado válida/,
    'falha quando a resposta imobiliária não contém dados válidos',
  );

  assert.throws(
    () => buildBcbCreditRatesData(realEstatePayload, { value: [] }, '2026-07-21T12:00:00.000Z'),
    /Nenhuma taxa veicular válida/,
    'falha quando a resposta veicular não contém dados válidos',
  );

  const outputDirectory = await mkdtemp(join(tmpdir(), 'bcb-credit-rates-test-'));
  const outputPath = join(outputDirectory, 'bcb-credit-rates.json');
  const requestedUrls = [];
  await updateBcbCreditRates({
    outputPath,
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      if (url === REAL_ESTATE_SOURCE_URL) {
        return {
          ok: true,
          json: async () => realEstatePayload,
        };
      }
      if (url === VEHICLE_SOURCE_URL) {
        return {
          ok: true,
          json: async () => vehiclePayload,
        };
      }
      throw new Error(`URL inesperada: ${url}`);
    },
  });

  assert.deepEqual(
    requestedUrls.sort(),
    [REAL_ESTATE_SOURCE_URL, VEHICLE_SOURCE_URL].sort(),
    'baixa as fontes imobiliária e veicular',
  );

  const generated = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(generated.referencePeriod, data.referencePeriod, 'grava período imobiliário no JSON gerado');
  assert.equal(generated.creditTypes.vehicle.referencePeriod.startDate, '2026-07-01', 'grava período veicular no JSON gerado');
  assert.equal(typeof generated.defaultInterestRate.monthlyRatePercent, 'number', 'grava taxa default como número');

  console.log('Testes das taxas médias BCB concluídos com sucesso.');
})();
