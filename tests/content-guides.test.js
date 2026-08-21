'use strict';

const assert = require('node:assert/strict');
const { readFile, readdir } = require('node:fs/promises');
const { join } = require('node:path');
const yaml = require('js-yaml');
const registry = require('../src/_data/contentRegistry.cjs');
const scenarios = require('../src/_data/scenarios.cjs');
const render = require('../src/_data/contentRender.cjs');
const simulationState = require('../assets/js/simulation-state.js');

const root = join(__dirname, '..');

async function markdownFiles(directory) {
  const locales = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const locale of locales) {
    if (!locale.isDirectory()) continue;
    const files = await readdir(join(directory, locale.name));
    result.push(...files.filter((file) => file.endsWith('.md')).map((file) => join(directory, locale.name, file)));
  }
  return result;
}

async function readContent(file) {
  const raw = await readFile(file, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, `${file}: possui front matter`);
  return { data: yaml.load(match[1]), body: match[2] };
}

(async () => {
  const guideFiles = await markdownFiles(join(root, 'src/content/guides'));
  const simulationFiles = await markdownFiles(join(root, 'src/content/simulations'));
  assert.equal(registry.guides.length, 13, 'registro contém exatamente 13 guias');
  assert.equal(registry.simulations.length, 6, 'registro mantém exatamente 6 simulações públicas');
  assert.equal(guideFiles.length, 39, 'existem 13 guias em cada um dos três idiomas');
  assert.equal(simulationFiles.length, 18, 'existem 6 exemplos em cada um dos três idiomas');

  const seen = new Set();
  const guideContent = await Promise.all(guideFiles.map(readContent));
  const simulationContent = await Promise.all(simulationFiles.map(readContent));
  for (const { data, body } of [...guideContent, ...simulationContent]) {
    assert.ok(registry.locales.includes(data.locale), `${data.contentId}: locale suportado`);
    const key = `${data.contentKind}:${data.contentId}:${data.locale}`;
    assert.ok(!seen.has(key), `${key}: conteúdo localizado é único`);
    seen.add(key);
    assert.ok(data.title && data.description, `${key}: possui título e descrição`);
    assert.match(data.published, /^\d{4}-\d{2}-\d{2}$/, `${key}: possui data de publicação`);
    assert.match(data.updated, /^\d{4}-\d{2}-\d{2}$/, `${key}: possui data de revisão`);
    assert.ok(Array.isArray(data.tags) && data.tags.length > 0, `${key}: possui tags`);
    assert.ok(Array.isArray(data.dataDependencies), `${key}: declara dados usados, ainda que nenhum seja dinâmico`);
    assert.ok(Array.isArray(data.limitations) && data.limitations.length > 0, `${key}: declara limitações`);
    assert.ok(Array.isArray(data.sources) && data.sources.length > 0, `${key}: declara fontes`);
    assert.ok(data.sources.every((source) => source.label && source.url && source.reviewed), `${key}: fontes têm URL e revisão`);
    assert.ok(body.trim().length > 200, `${key}: não é uma página vazia ou placeholder`);
  }

  for (const { data, body } of guideContent) {
    assert.equal(data.contentKind, 'guide', `${data.contentId}: usa tipo guide`);
    assert.ok(registry.guideById[data.contentId], `${data.contentId}: está no registro de guias`);
    assert.equal(data.order, registry.guideById[data.contentId].order, `${data.contentId}: ordem corresponde ao registro`);
    assert.equal(data.category, registry.guideById[data.contentId].category, `${data.contentId}: categoria corresponde ao registro`);
    assert.ok(Array.isArray(data.toc) && data.toc.length >= 3, `${data.contentId}: possui sumário`);
    assert.ok(Array.isArray(data.contractNotes) && data.contractNotes.length > 0, `${data.contentId}: registra diferenças contratuais`);
    assert.ok(Array.isArray(data.relatedSimulationIds) && data.relatedSimulationIds.length > 0, `${data.contentId}: aponta uma simulação`);
    assert.match(body, /\{%\s*scenarioModule\s+"[^"]+"/, `${data.contentId}: inclui módulo calculado`);
    assert.ok(/content-formula|^\|.+\|/m.test(body), `${data.contentId}: inclui fórmula ou tabela editorial`);
    data.relatedGuideIds.forEach((id) => assert.ok(registry.guideById[id], `${data.contentId}: guia relacionado existe`));
    data.relatedSimulationIds.forEach((id) => assert.ok(registry.simulationById[id], `${data.contentId}: simulação relacionada existe`));
  }

  for (const { data } of simulationContent) {
    assert.equal(data.contentKind, 'simulation', `${data.contentId}: usa tipo simulation`);
    assert.ok(registry.simulationById[data.contentId], `${data.contentId}: está no registro de exemplos`);
    assert.equal(data.scenarioId, data.contentId, `${data.contentId}: cenário e conteúdo têm identidade estável`);
    assert.ok(scenarios.scenarios[data.scenarioId], `${data.contentId}: cenário calculado existe`);
    data.relatedGuideIds.forEach((id) => assert.ok(registry.guideById[id], `${data.contentId}: guia relacionado existe`));
  }

  for (const entry of [...registry.guides.map((value) => ({ ...value, kind: 'guide' })), ...registry.simulations.map((value) => ({ ...value, kind: 'simulation' }))]) {
    for (const locale of registry.locales) {
      const file = registry.outputPathFor(entry.kind, entry.id, locale);
      const html = await readFile(join(root, '_site', file), 'utf8');
      assert.match(html, /<svg\b[^>]*role="img"[^>]*aria-labelledby=/, `${file}: gráfico SVG é acessível`);
      assert.match(html, /class="table comparison-table/, `${file}: possui tabela alternativa e comparativa`);
      assert.match(html, /class="btn btn-primary" href="[^"]+\?sim=/, `${file}: possui CTA com cenário`);
      assert.doesNotMatch(html, /<p><(?:div|tr)\b|<\/tr><\/p>/, `${file}: HTML calculado não é embrulhado em parágrafos inválidos`);

      const href = html.match(/class="btn btn-primary" href="([^"]+\?sim=[^"]+)"/)?.[1];
      assert.ok(href, `${file}: extrai link do simulador`);
      const state = simulationState.decodeSimulationParam(new URL(href, `https://example.test/${file}`).searchParams.get('sim'));
      const sourceData = entry.kind === 'simulation'
        ? simulationContent.find((item) => item.data.contentId === entry.id && item.data.locale === locale).data
        : guideContent.find((item) => item.data.contentId === entry.id && item.data.locale === locale);
      const scenarioId = entry.kind === 'simulation'
        ? sourceData.scenarioId
        : sourceData.body.match(/\{%\s*scenarioModule\s+"([^"]+)"/)[1];
      assert.deepEqual(state, scenarios.scenarios[scenarioId].state, `${file}: CTA corresponde ao cenário exibido`);
      const formattedTotal = render.formatCurrency(scenarios.scenarios[scenarioId].result.stats.totalPaidCents, locale);
      assert.ok(html.includes(formattedTotal), `${file}: números renderizados vêm do FinanceSimulator`);
    }
  }

  for (const locale of registry.locales) {
    const hubFile = `${registry.roots.hub[locale].slice(1)}index.html`;
    const html = await readFile(join(root, '_site', hubFile), 'utf8');
    assert.equal((html.match(/data-guide-card/g) || []).length, 13, `${hubFile}: exibe os 13 guias sem JavaScript`);
    assert.equal((html.match(/data-simulation-card/g) || []).length, 6, `${hubFile}: exibe as 6 simulações`);
    assert.match(html, /assets\/js\/content-index\.js/, `${hubFile}: carrega busca progressiva`);
  }

  console.log('Testes do catálogo de guias concluídos com sucesso.');
})();
