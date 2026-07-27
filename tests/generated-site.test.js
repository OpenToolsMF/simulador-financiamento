'use strict';

const assert = require('node:assert/strict');
const { access, readFile, readdir } = require('node:fs/promises');
const { join, relative } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const siteRoot = join(repositoryRoot, '_site');

const expectedHtmlFiles = [
  'index.html',
  'en/index.html',
  'es/index.html',
  'comparar/index.html',
  'en/compare/index.html',
  'es/comparar/index.html',
  'privacidade.html',
  'en/privacy.html',
  'es/privacidad.html',
  'sobre/index.html',
  'en/about/index.html',
  'es/acerca-de/index.html',
  'fale-conosco/index.html',
  'en/contact/index.html',
  'es/contacto/index.html',
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
    'o build gera exatamente as quinze páginas públicas',
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
    'assets/data/tr-bacen.json',
    'assets/data/bcb-credit-rates.json',
    'assets/vendor/bootstrap/css/bootstrap.min.css',
    'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
    'assets/vendor/chartjs/chart.umd.min.js',
  ]) {
    await assert.doesNotReject(access(join(siteRoot, asset)), `${asset} foi copiado para o artifact`);
  }

  console.log('Testes do site gerado concluídos com sucesso.');
})();
