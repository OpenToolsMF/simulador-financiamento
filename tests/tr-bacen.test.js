'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const { buildTrData, parseTrRates, SOURCE_URL, updateTrBacen } = await import('../scripts/update-tr-bacen.mjs');
  const html = await readFile(join(__dirname, 'fixtures/tr-bacen.html'), 'utf8');

  const rates = parseTrRates(html);
  assert.equal(rates.length, 5, 'extrai apenas taxas TR válidas');
  assert.deepEqual(
    rates.map((rate) => rate.month),
    ['2025-04', '2025-05', '2025-06', '2025-08', '2026-07'],
    'ordena as taxas por mês e ignora acumulados sem TR mensal',
  );
  assert.equal(rates.find((rate) => rate.month === '2025-07'), undefined, 'ignora valores acumulados maiores que faixa de TR mensal');
  assert.equal(rates.at(-1).ratePercent, 0.1729, 'mantém percentual como número');

  const data = buildTrData(html, '2026-07-15T12:00:00.000Z');
  assert.equal(data.sourceUrl, SOURCE_URL, 'registra a URL de origem');
  assert.equal(data.generatedAt, '2026-07-15T12:00:00.000Z', 'permite generatedAt determinístico');
  assert.deepEqual(data.latest, {
    month: '2026-07',
    date: '2026-07-01',
    ratePercent: 0.1729,
  }, 'define latest pelo mês mais recente');
  assert.equal(data.rates.length, rates.length, 'inclui todas as taxas extraídas');

  assert.throws(
    () => buildTrData('<html></html>', '2026-07-15T12:00:00.000Z'),
    /Nenhuma taxa TR válida/,
    'falha quando a página não contém taxas válidas',
  );

  const outputDirectory = await mkdtemp(join(tmpdir(), 'tr-bacen-test-'));
  const outputPath = join(outputDirectory, 'tr-bacen.json');
  await updateTrBacen({
    outputPath,
    fetchImpl: async (url) => {
      assert.equal(url, SOURCE_URL, 'baixa a URL configurada como fonte');
      return {
        ok: true,
        text: async () => html,
      };
    },
  });

  const generated = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.deepEqual(generated.latest, data.latest, 'grava latest no JSON gerado');
  assert.deepEqual(
    generated.rates.map((rate) => rate.month),
    data.rates.map((rate) => rate.month),
    'grava as taxas ordenadas no JSON gerado',
  );
  assert.equal(typeof generated.latest.ratePercent, 'number', 'grava ratePercent como número');

  console.log('Testes da TR Bacen concluídos com sucesso.');
})();
