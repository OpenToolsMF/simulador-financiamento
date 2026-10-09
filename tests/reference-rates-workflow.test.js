'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, mkdir, readFile, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const summaryModule = import('../scripts/reference-rates-summary.mjs');

const references = {
  tr: { latest: { startDate: '2026-10-08' } },
  credit: {
    referencePeriod: '2026-09',
    creditTypes: { vehicle: { referencePeriod: { startDate: '2026-10-01', endDate: '2026-10-07' } } },
  },
};

test('resumo diferencia consulta concluída, preservação veicular e publicação', async () => {
  const { renderReferenceRatesSummary } = await summaryModule;
  const summary = renderReferenceRatesSummary({
    ...references,
    trOutcome: 'success',
    creditOutcome: 'success',
    commitOutcome: 'success',
    commitChanged: true,
    vehiclePreserved: true,
  });
  assert.match(summary, /TR SGS 226 \| Consulta e validação concluídas \| 2026-10-08/);
  assert.match(summary, /Taxas imobiliárias \| Consulta e validação concluídas \| 2026-09/);
  assert.match(summary, /Taxas veiculares \| Preservada do JSON anterior; API veicular indisponível \| 2026-10-01 a 2026-10-07/);
  assert.match(summary, /publicação é executada em um job separado/);
});

test('resumo de falha não apresenta referências anteriores como consultadas', async () => {
  const { renderReferenceRatesSummary } = await summaryModule;
  const summary = renderReferenceRatesSummary({ ...references, trOutcome: 'failure', creditOutcome: 'skipped' });
  assert.match(summary, /TR SGS 226 \| Falha; referência local não confirmada nesta execução/);
  assert.match(summary, /Taxas imobiliárias \| Não executada; referência local não confirmada nesta execução/);
  assert.match(summary, /Nenhum commit confirmado/);
  assert.doesNotMatch(summary, /Consulta e validação concluídas/);
  assert.match(renderReferenceRatesSummary({ trOutcome: 'cancelled' }), /Cancelada; referência local não confirmada/);
  assert.match(renderReferenceRatesSummary(), /Indisponível/);
});

test('resumo de sucesso sem mudanças informa ausência de commit e deploy', async () => {
  const { renderReferenceRatesSummary } = await summaryModule;
  const summary = renderReferenceRatesSummary({
    ...references,
    trOutcome: 'success',
    creditOutcome: 'success',
    commitOutcome: 'success',
    commitChanged: false,
  });
  assert.match(summary, /Sem mudanças semânticas; nenhum commit ou deploy necessário/);
  assert.doesNotMatch(summary, /Preservada do JSON anterior/);
});

test('CLI do resumo funciona sem arquivos de dados e grava GITHUB_STEP_SUMMARY', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'reference-summary-'));
  const summaryPath = join(directory, 'summary.md');
  const result = spawnSync(process.execPath, [resolve(__dirname, '../scripts/reference-rates-summary.mjs')], {
    cwd: directory,
    env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath, TR_OUTCOME: 'failure', CREDIT_OUTCOME: 'skipped', COMMIT_OUTCOME: 'skipped' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(await readFile(summaryPath, 'utf8'), /Indisponível/);
});

test('CLI BCB sinaliza preservação no GITHUB_OUTPUT e mantém bytes em falhas', async () => {
  const { buildBcbCreditRatesData, REAL_ESTATE_MARKET_MODALITIES, VEHICLE_MODALITIES } = await import('../scripts/update-bcb-credit-rates.mjs');
  const institution = { InstituicaoFinanceira: 'BANCO TESTE', cnpj8: '12345678', Posicao: 1, TaxaJurosAoMes: 1, TaxaJurosAoAno: 12.68 };
  const realEstate = { value: [{ ...institution, Modalidade: REAL_ESTATE_MARKET_MODALITIES[1].sourceName, anoMes: '2026-09' }] };
  const vehicle = { value: [{ ...institution, Modalidade: VEHICLE_MODALITIES[0].sourceName, InicioPeriodo: '2026-10-01', FimPeriodo: '2026-10-07' }] };
  const directory = await mkdtemp(join(tmpdir(), 'bcb-cli-'));
  await mkdir(join(directory, 'assets/data'), { recursive: true });
  const outputPath = join(directory, 'assets/data/bcb-credit-rates.json');
  const previous = `${JSON.stringify(buildBcbCreditRatesData(realEstate, vehicle, '2026-10-08T12:00:00Z'), null, 2)}\n`;
  await writeFile(outputPath, previous);
  const bootstrap = `
    import { pathToFileURL } from 'node:url';
    const payloads = JSON.parse(process.env.BCB_TEST_PAYLOADS);
    const scenario = process.env.BCB_TEST_SCENARIO;
    globalThis.fetch = async (url) => {
      const realEstate = url.includes('TaxasJurosMensalPorMes');
      if ((scenario === 'fallback' && !realEstate) || (scenario === 'failure' && realEstate)) {
        return new Response('Unavailable', { status: 400 });
      }
      return new Response(JSON.stringify(realEstate ? payloads.realEstate : payloads.vehicle), { headers: { 'content-type': 'application/json' } });
    };
    process.argv[1] = process.env.BCB_TEST_SCRIPT;
    await import(pathToFileURL(process.argv[1]));
  `;
  for (const scenario of ['success', 'fallback', 'failure']) {
    const githubOutput = join(directory, `output-${scenario}`);
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', bootstrap], {
      cwd: directory,
      env: {
        ...process.env,
        BCB_TEST_SCRIPT: resolve(__dirname, '../scripts/update-bcb-credit-rates.mjs'),
        BCB_TEST_PAYLOADS: JSON.stringify({ realEstate, vehicle }),
        BCB_TEST_SCENARIO: scenario,
        GITHUB_OUTPUT: githubOutput,
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, scenario === 'failure' ? 1 : 0, result.stderr);
    assert.equal(await readFile(outputPath, 'utf8'), previous);
    if (scenario === 'failure') {
      await assert.rejects(readFile(githubOutput), { code: 'ENOENT' });
    } else {
      assert.equal(await readFile(githubOutput, 'utf8'), `vehicle_preserved=${scenario === 'fallback'}\n`);
      if (scenario === 'fallback') assert.match(result.stdout, /veicular preservado do JSON anterior/);
    }
  }
});

test('workflow mantém falha obrigatória bloqueante e resumo sempre executado', async () => {
  const workflow = await readFile(resolve(__dirname, '../.github/workflows/update-reference-rates.yml'), 'utf8');
  assert.match(workflow, /timeout-minutes: 5/);
  assert.match(workflow, /group: reference-rates-\$\{\{ github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /Summarize reference rates update\s+if: \$\{\{ always\(\) \}\}/);
  assert.match(workflow, /VEHICLE_PRESERVED: \$\{\{ steps\.credit\.outputs\.vehicle_preserved \}\}/);
  assert.doesNotMatch(workflow, /continue-on-error/);
  assert.match(workflow, /needs: update-reference-rates/);
});
