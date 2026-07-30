'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const {
    buildTrData,
    parseTrRates,
    SERIES_CODE,
    SOURCE_URL,
    sourceUrlForDate,
    updateTrBacen,
  } = await import('../scripts/update-tr-bacen.mjs');
  const payload = JSON.parse(await readFile(join(__dirname, 'fixtures/tr-sgs-226.json'), 'utf8'));

  const rates = parseTrRates(payload);
  assert.equal(rates.length, 13, 'mantém apenas a janela móvel de doze meses');
  assert.deepEqual(
    rates[0],
    { startDate: '2025-07-01', endDate: '2025-07-31', ratePercent: 0.169 },
    'normaliza data, fim do período e percentual',
  );
  assert.equal(rates.at(-1).startDate, '2026-07-01', 'ordena os períodos por início');

  const data = buildTrData(payload, '2026-07-27T12:00:00.000Z');
  assert.equal(data.version, 2, 'versiona o novo formato oficial');
  assert.equal(data.seriesCode, SERIES_CODE, 'registra a série oficial');
  assert.equal(data.sourceUrl, SOURCE_URL, 'registra o endpoint oficial');
  assert.equal(data.generatedAt, '2026-07-27T12:00:00.000Z', 'aceita generatedAt determinístico');
  assert.deepEqual(data.latest, rates.at(-1), 'define latest pela observação mais recente');

  assert.throws(
    () => buildTrData([], '2026-07-27T12:00:00.000Z'),
    /Nenhuma observação válida/,
    'falha quando a API não contém observações válidas',
  );

  const outputDirectory = await mkdtemp(join(tmpdir(), 'tr-sgs-test-'));
  const outputPath = join(outputDirectory, 'tr-bacen.json');
  const now = new Date('2026-07-27T12:00:00.000Z');
  const fetchImpl = async (url) => {
    assert.equal(url, sourceUrlForDate(now), 'baixa a janela anual da série SGS configurada');
    return { ok: true, json: async () => payload };
  };

  const first = await updateTrBacen({ outputPath, fetchImpl, now });
  assert.equal(first.changed, true, 'grava a primeira atualização');
  const firstGenerated = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(firstGenerated.rates.length, 13, 'grava as observações normalizadas');

  firstGenerated.generatedAt = '2026-07-27T00:00:00.000Z';
  await writeFile(outputPath, `${JSON.stringify(firstGenerated, null, 2)}\n`);
  const second = await updateTrBacen({ outputPath, fetchImpl, now });
  assert.equal(second.changed, false, 'não regrava dados semanticamente iguais');
  assert.equal(second.data.generatedAt, '2026-07-27T00:00:00.000Z', 'preserva generatedAt quando não há mudança');

  console.log('Testes da TR SGS 226 concluídos com sucesso.');
})();
