'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const {
    REAL_ESTATE_SOURCE_URL,
    VEHICLE_SOURCE_URL,
    SOURCE_URLS,
    FETCH_ATTEMPTS,
    buildBcbCreditRatesData,
    updateBcbCreditRates,
  } = await import('../scripts/update-bcb-credit-rates.mjs');

  const successfulResponse = (payload) => ({
    ok: true,
    json: async () => payload,
  });

  const failedResponse = (status) => ({
    ok: false,
    status,
    json: async () => ({}),
  });

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
    fetchImpl: async (url, options) => {
      requestedUrls.push(url);
      assert.equal(typeof options?.signal?.addEventListener, 'function', 'envia signal para permitir timeout por AbortController');
      if (url === REAL_ESTATE_SOURCE_URL) {
        return successfulResponse(realEstatePayload);
      }
      if (url === VEHICLE_SOURCE_URL) {
        return successfulResponse(vehiclePayload);
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
  generated.generatedAt = '2026-07-21T00:00:00.000Z';
  await writeFile(outputPath, `${JSON.stringify(generated, null, 2)}\n`);
  const stableData = await updateBcbCreditRates({
    outputPath,
    fetchImpl: async (url) => (
      url === REAL_ESTATE_SOURCE_URL
        ? successfulResponse(realEstatePayload)
        : successfulResponse(vehiclePayload)
    ),
  });
  assert.equal(
    stableData.generatedAt,
    '2026-07-21T00:00:00.000Z',
    'preserva generatedAt quando os dados BCB são semanticamente iguais',
  );

  const retryOutputDirectory = await mkdtemp(join(tmpdir(), 'bcb-credit-rates-retry-test-'));
  const retryOutputPath = join(retryOutputDirectory, 'bcb-credit-rates.json');
  const retryAttempts = { realEstate: 0, vehicle: 0 };
  await updateBcbCreditRates({
    outputPath: retryOutputPath,
    sleepImpl: async () => {},
    logger: { info() {} },
    onVehicleFallback: () => assert.fail('fonte recuperada não deve acionar fallback'),
    fetchImpl: async (url) => {
      if (url === REAL_ESTATE_SOURCE_URL) {
        retryAttempts.realEstate += 1;
        return successfulResponse(realEstatePayload);
      }

      if (url === VEHICLE_SOURCE_URL) {
        retryAttempts.vehicle += 1;
        return retryAttempts.vehicle < FETCH_ATTEMPTS
          ? failedResponse(504)
          : successfulResponse(vehiclePayload);
      }

      throw new Error(`URL inesperada: ${url}`);
    },
  });

  assert.deepEqual(
    retryAttempts,
    { realEstate: 1, vehicle: FETCH_ATTEMPTS },
    'repete fetch veicular com HTTP 504 e aceita sucesso na terceira tentativa',
  );

  const requiredRealEstateOutputDirectory = await mkdtemp(join(tmpdir(), 'bcb-credit-rates-required-test-'));
  const requiredRealEstateOutputPath = join(requiredRealEstateOutputDirectory, 'bcb-credit-rates.json');
  let realEstateFailures = 0;

  await assert.rejects(
    () => updateBcbCreditRates({
      outputPath: requiredRealEstateOutputPath,
      sleepImpl: async () => {},
      logger: { info() {} },
      fetchImpl: async (url) => {
        if (url === REAL_ESTATE_SOURCE_URL) {
          realEstateFailures += 1;
          return failedResponse(504);
        }

        if (url === VEHICLE_SOURCE_URL) {
          return successfulResponse(vehiclePayload);
        }

        throw new Error(`URL inesperada: ${url}`);
      },
    }),
    /imobiliário.*após 3 tentativas.*HTTP 504/,
    'falha quando o endpoint imobiliário obrigatório falha após três tentativas',
  );

  assert.equal(realEstateFailures, FETCH_ATTEMPTS, 'tenta baixar o endpoint imobiliário três vezes antes de falhar');
  await assert.rejects(readFile(requiredRealEstateOutputPath), { code: 'ENOENT' }, 'falha obrigatória inicial não cria arquivo');

  const fallbackOutputDirectory = await mkdtemp(join(tmpdir(), 'bcb-credit-rates-fallback-test-'));
  const fallbackOutputPath = join(fallbackOutputDirectory, 'bcb-credit-rates.json');
  const previousData = buildBcbCreditRatesData(realEstatePayload, vehiclePayload, '2026-07-20T12:00:00.000Z');
  await writeFile(fallbackOutputPath, `${JSON.stringify(previousData, null, 2)}\n`);
  const fallbackWarnings = [];
  const fallbackEvents = [];
  const previousBytes = await readFile(fallbackOutputPath);

  const fallbackData = await updateBcbCreditRates({
    outputPath: fallbackOutputPath,
    sleepImpl: async () => {},
    onVehicleFallback: (event) => fallbackEvents.push(event),
    logger: {
      warn: (message) => fallbackWarnings.push(message),
    },
    fetchImpl: async (url) => {
      if (url === REAL_ESTATE_SOURCE_URL) {
        return successfulResponse(realEstatePayload);
      }

      if (url === VEHICLE_SOURCE_URL) {
        return failedResponse(504);
      }

      throw new Error(`URL inesperada: ${url}`);
    },
  });

  assert.deepEqual(
    fallbackData.creditTypes.vehicle,
    previousData.creditTypes.vehicle,
    'preserva o bloco veicular anterior quando o endpoint veicular falha',
  );
  assert.match(
    fallbackWarnings[0],
    /Taxas veiculares BCB preservadas.*2026-07-01 a 2026-07-07.*HTTP 504/,
    'registra aviso com período preservado e causa do fallback veicular',
  );
  assert.equal(fallbackEvents.length, 1, 'informa o fallback exatamente uma vez');
  assert.deepEqual(fallbackEvents[0].referencePeriod, previousData.creditTypes.vehicle.referencePeriod);
  assert.match(fallbackEvents[0].reason, /HTTP 504/);
  assert.deepEqual(await readFile(fallbackOutputPath), previousBytes, 'fallback com dados iguais mantém bytes e generatedAt');

  const changedFallbackPath = join(fallbackOutputDirectory, 'changed-real-estate.json');
  await writeFile(changedFallbackPath, previousBytes);
  const changedRealEstatePayload = {
    value: realEstatePayload.value.map((row) => ({ ...row, TaxaJurosAoAno: row.TaxaJurosAoAno + 1 })),
  };
  const changedFallback = await updateBcbCreditRates({
    outputPath: changedFallbackPath,
    sleepImpl: async () => {},
    logger: { info() {}, warn() {} },
    fetchImpl: async (url) => (url === REAL_ESTATE_SOURCE_URL
      ? successfulResponse(changedRealEstatePayload)
      : failedResponse(504)),
  });
  assert.deepEqual(changedFallback.creditTypes.vehicle, previousData.creditTypes.vehicle, 'atualização imobiliária não substitui o bloco veicular preservado');
  assert.notDeepEqual(changedFallback.creditTypes.realEstate, previousData.creditTypes.realEstate, 'taxas imobiliárias novas são publicáveis junto ao bloco veicular anterior');
  assert.deepEqual(JSON.parse(await readFile(changedFallbackPath, 'utf8')), changedFallback);

  let invalidAttempts = 0;
  await assert.rejects(updateBcbCreditRates({
    outputPath: fallbackOutputPath,
    sleepImpl: async () => assert.fail('dados financeiros inválidos não devem gerar espera'),
    logger: { info() {}, warn() {} },
    onVehicleFallback: () => assert.fail('JSON veicular inválido não aciona fallback'),
    fetchImpl: async (url) => {
      invalidAttempts += 1;
      return successfulResponse(url === REAL_ESTATE_SOURCE_URL ? realEstatePayload : { value: [] });
    },
  }), /Nenhuma taxa veicular válida/);
  assert.equal(invalidAttempts, 2, 'consulta cada fonte uma vez quando a validação financeira falha');
  assert.deepEqual(await readFile(fallbackOutputPath), previousBytes, 'validação inválida não sobrescreve dados anteriores');

  let invalidRealEstateAttempts = 0;
  await assert.rejects(updateBcbCreditRates({
    outputPath: fallbackOutputPath,
    sleepImpl: async () => assert.fail('validação imobiliária não deve gerar espera'),
    logger: { info() {} },
    fetchImpl: async (url) => {
      invalidRealEstateAttempts += 1;
      return successfulResponse(url === REAL_ESTATE_SOURCE_URL ? { value: [] } : vehiclePayload);
    },
  }), /Nenhuma taxa imobiliária de mercado válida/);
  assert.equal(invalidRealEstateAttempts, 2);
  assert.deepEqual(await readFile(fallbackOutputPath), previousBytes);

  await assert.rejects(updateBcbCreditRates({
    outputPath: fallbackOutputPath,
    sleepImpl: async () => {},
    logger: { info() {} },
    fetchImpl: async (url) => (url === REAL_ESTATE_SOURCE_URL
      ? failedResponse(502)
      : successfulResponse(vehiclePayload)),
  }), /imobiliário.*após 3 tentativas.*HTTP 502/);
  assert.deepEqual(await readFile(fallbackOutputPath), previousBytes, 'falha imobiliária preserva o arquivo anterior byte a byte');

  const invalidFallbackPath = join(fallbackOutputDirectory, 'invalid-vehicle.json');
  const invalidPrevious = { ...previousData, creditTypes: { ...previousData.creditTypes, vehicle: {} } };
  await writeFile(invalidFallbackPath, JSON.stringify(invalidPrevious));
  const invalidPreviousBytes = await readFile(invalidFallbackPath);
  await assert.rejects(updateBcbCreditRates({
    outputPath: invalidFallbackPath,
    sleepImpl: async () => {},
    logger: { info() {} },
    onVehicleFallback: () => assert.fail('bloco anterior inválido não pode ser preservado'),
    fetchImpl: async (url) => (url === REAL_ESTATE_SOURCE_URL
      ? successfulResponse(realEstatePayload)
      : failedResponse(504)),
  }), /Não há bloco veicular anterior válido/);
  assert.deepEqual(await readFile(invalidFallbackPath), invalidPreviousBytes);

  const missingFallbackOutputDirectory = await mkdtemp(join(tmpdir(), 'bcb-credit-rates-missing-fallback-test-'));
  const missingFallbackOutputPath = join(missingFallbackOutputDirectory, 'bcb-credit-rates.json');

  await assert.rejects(
    () => updateBcbCreditRates({
      outputPath: missingFallbackOutputPath,
      sleepImpl: async () => {},
      logger: { info() {} },
      fetchImpl: async (url) => {
        if (url === REAL_ESTATE_SOURCE_URL) {
          return successfulResponse(realEstatePayload);
        }

        if (url === VEHICLE_SOURCE_URL) {
          const error = new Error('aborted');
          error.name = 'AbortError';
          throw error;
        }

        throw new Error(`URL inesperada: ${url}`);
      },
    }),
    /veicular.*após 3 tentativas.*tempo limite de 10s excedido.*Não há bloco veicular anterior válido/,
    'falha quando o endpoint veicular expira e não existe bloco anterior válido',
  );

  console.log('Testes das taxas médias BCB concluídos com sucesso.');
})();
