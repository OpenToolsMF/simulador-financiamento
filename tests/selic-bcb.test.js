'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const { buildSelicData, parseSelicRate, SOURCE_URL, updateSelicBcb } = await import('../scripts/update-selic-bcb.mjs');

  const payloadWithComma = [{ data: '17/07/2026', valor: '15,00' }];
  assert.deepEqual(
    parseSelicRate(payloadWithComma),
    { date: '2026-07-17', ratePercent: 15 },
    'normaliza data e valor decimal com vírgula',
  );

  const payloadWithDot = [{ data: '18/07/2026', valor: '14.75' }];
  assert.deepEqual(
    parseSelicRate(payloadWithDot),
    { date: '2026-07-18', ratePercent: 14.75 },
    'normaliza valor decimal com ponto',
  );

  assert.equal(parseSelicRate([]), null, 'rejeita payload vazio');
  assert.equal(parseSelicRate([{ data: '2026-07-17', valor: '15,00' }]), null, 'rejeita data fora do formato do BCB');
  assert.equal(parseSelicRate([{ data: '17/07/2026', valor: 'abc' }]), null, 'rejeita taxa inválida');

  const data = buildSelicData(payloadWithComma, '2026-07-17T12:00:00.000Z');
  assert.equal(data.sourceUrl, SOURCE_URL, 'registra a URL de origem');
  assert.equal(data.generatedAt, '2026-07-17T12:00:00.000Z', 'permite generatedAt determinístico');
  assert.deepEqual(data.latest, { date: '2026-07-17', ratePercent: 15 }, 'define latest normalizado');

  assert.throws(
    () => buildSelicData([], '2026-07-17T12:00:00.000Z'),
    /Nenhuma taxa Selic válida/,
    'falha quando a resposta não contém Selic válida',
  );

  const outputDirectory = await mkdtemp(join(tmpdir(), 'selic-bcb-test-'));
  const outputPath = join(outputDirectory, 'selic-bcb.json');
  await updateSelicBcb({
    outputPath,
    fetchImpl: async (url) => {
      assert.equal(url, SOURCE_URL, 'baixa a URL configurada como fonte');
      return {
        ok: true,
        json: async () => payloadWithComma,
      };
    },
  });

  const generated = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.deepEqual(generated.latest, data.latest, 'grava latest no JSON gerado');
  assert.equal(typeof generated.latest.ratePercent, 'number', 'grava ratePercent como número');

  console.log('Testes da Selic BCB concluídos com sucesso.');
})();
