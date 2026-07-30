'use strict';

const assert = require('node:assert/strict');
const { access, readFile, readdir } = require('node:fs/promises');
const { join, relative } = require('node:path');
const site = require('../src/_data/site.cjs');
const contentRegistry = require('../src/_data/contentRegistry.cjs');

const repositoryRoot = join(__dirname, '..');
const siteRoot = join(repositoryRoot, '_site');

const expectedHtmlFiles = [
  ...site.pages.map((page) => page.outputPath),
  ...contentRegistry.guides.flatMap((guide) => (
    contentRegistry.locales.map((locale) => contentRegistry.outputPathFor('guide', guide.id, locale))
  )),
  ...contentRegistry.simulations.flatMap((simulation) => (
    contentRegistry.locales.map((locale) => contentRegistry.outputPathFor('simulation', simulation.id, locale))
  )),
].sort();

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(absolutePath));
    } else if (entry.name.endsWith('.html')) {
      files.push(relative(siteRoot, absolutePath));
    }
  }
  return files;
}

(async () => {
  assert.deepEqual(
    (await collectHtmlFiles(siteRoot)).sort(),
    expectedHtmlFiles,
    'o build gera exatamente as 72 páginas públicas registradas',
  );

  for (const file of ['CNAME', 'ads.txt', 'robots.txt', 'sitemap.xml']) {
    await assert.doesNotReject(access(join(siteRoot, file)), `${file} existe na raiz do artifact`);
  }

  for (const file of [...expectedHtmlFiles, 'robots.txt', 'sitemap.xml']) {
    await assert.rejects(
      access(join(repositoryRoot, file)),
      { code: 'ENOENT' },
      `${file} não permanece como saída gerada versionada`,
    );
  }

  const cname = (await readFile(join(siteRoot, 'CNAME'), 'utf8')).trim();
  assert.equal(cname, 'mapadasparcelas.com.br', 'artifact preserva o domínio personalizado');

  for (const asset of [
    'assets/css/styles.css',
    'assets/js/app.js',
    'assets/js/comparison.js',
    'assets/js/finance.js',
    'assets/js/i18n.js',
    'assets/js/privacy.js',
    'assets/js/simulation-state.js',
    'assets/js/static-content.js',
    'assets/js/content-index.js',
    'assets/data/tr-bacen.json',
    'assets/data/bcb-credit-rates.json',
    'assets/vendor/bootstrap/css/bootstrap.min.css',
    'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
    'assets/vendor/chartjs/chart.umd.min.js',
  ]) {
    await assert.doesNotReject(access(join(siteRoot, asset)), `${asset} foi copiado para o artifact`);
  }

  const appScript = await readFile(join(siteRoot, 'assets/js/app.js'), 'utf8');
  assert.match(
    appScript,
    /const DEFAULT_FINANCED_VALUE_CENTS = 40_000_000;/,
    'simulador começa com R$ 400 mil financiados',
  );
  assert.match(
    appScript,
    /const DEFAULT_MONTHLY_EXTRA_COST_CENTS = 19_500;/,
    'simulador começa com R$ 195 de custos extras mensais',
  );
  assert.equal(
    (appScript.match(/setDefaultSimulationValues\(\);/g) || []).length,
    2,
    'valores padrão são usados na primeira visita e ao limpar os dados',
  );

  console.log('Testes do site gerado concluídos com sucesso.');
})();
