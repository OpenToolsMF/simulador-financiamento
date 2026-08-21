'use strict';

const assert = require('node:assert/strict');
const { access, readFile, readdir } = require('node:fs/promises');
const { join } = require('node:path');
const yaml = require('js-yaml');
const finance = require('../assets/js/finance.js');
const simulationState = require('../assets/js/simulation-state.js');
const registry = require('../src/_data/contentRegistry.cjs');
const scenarios = require('../src/_data/scenarios.cjs');
const render = require('../src/_data/contentRender.cjs');

const root = join(__dirname, '..');
const contentId = 'best-amortization-day';
const expected = {
  'pt-BR': {
    title: 'Qual é o melhor dia para amortizar um financiamento?',
    path: '/guias/melhor-dia-amortizar-financiamento/',
  },
  en: {
    title: 'What is the best day to make an extra payment on a loan?',
    path: '/en/guides/best-day-to-make-an-extra-payment/',
  },
  es: {
    title: '¿Cuál es el mejor día para amortizar una financiación?',
    path: '/es/guias/mejor-dia-para-amortizar-financiacion/',
  },
};

function parseMarkdown(raw, file) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, `${file}: possui front matter`);
  return { data: yaml.load(match[1]), body: match[2], raw };
}

async function newGuideSources() {
  const result = new Map();
  for (const locale of registry.locales) {
    const directory = join(root, 'src/content/guides', locale);
    const files = (await readdir(directory)).filter((file) => file.endsWith('.md'));
    for (const file of files) {
      const raw = await readFile(join(directory, file), 'utf8');
      const parsed = parseMarkdown(raw, file);
      if (parsed.data.contentId === contentId) result.set(locale, { ...parsed, file });
    }
  }
  return result;
}

function extractMetaContent(html, attribute, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find((item) => new RegExp(`\\b${attribute}=["']${value}["']`, 'i').test(item));
  return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? null;
}

function extractJsonLdNodes(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const block = JSON.parse(match[1]);
      return block['@graph'] ?? [block];
    });
}

function decodeEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeText(value) {
  return decodeEntities(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function elementsWithClass(markup, tagName, className) {
  const expression = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  return [...String(markup).matchAll(expression)]
    .filter((match) => {
      const classValue = match[1].match(/\bclass=["']([^"']*)["']/i)?.[1] || '';
      return classValue.split(/\s+/).includes(className);
    });
}

function scriptSources(html) {
  return [...String(html).matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => decodeEntities(match[1]));
}

function assertSituationComponent(markup, label) {
  const wrappers = elementsWithClass(markup, 'section', 'amortization-situation-guide');
  assert.equal(wrappers.length, 1, `${label}: contém exatamente um guia por situações`);

  const situationLists = elementsWithClass(wrappers[0][2], 'ul', 'amortization-situation-list');
  assert.equal(situationLists.length, 1, `${label}: contém uma lista de situações`);
  const cards = elementsWithClass(situationLists[0][2], 'li', 'amortization-situation-card');
  assert.equal(cards.length, 3, `${label}: contém exatamente três cartões de situação`);
  for (const [index, card] of cards.entries()) {
    assert.equal(
      elementsWithClass(card[2], 'p', 'amortization-situation-action').length,
      1,
      `${label}: cartão ${index + 1} contém exatamente uma ação`,
    );
  }

  const verificationBlocks = elementsWithClass(wrappers[0][2], 'div', 'amortization-verification');
  assert.equal(verificationBlocks.length, 1, `${label}: contém uma faixa de verificação`);
  const verificationLists = elementsWithClass(
    verificationBlocks[0][2],
    'ul',
    'amortization-verification-list',
  );
  assert.equal(verificationLists.length, 1, `${label}: faixa contém uma lista de verificação`);
  assert.equal(
    (verificationLists[0][2].match(/<li\b/gi) || []).length,
    3,
    `${label}: faixa contém exatamente três itens`,
  );

  for (const legacyClass of [
    'amortization-decision-flow',
    'amortization-decision-tree',
    'amortization-decision-answer',
    'amortization-decision-result',
  ]) {
    assert.doesNotMatch(
      markup,
      new RegExp(`class=["'][^"']*\\b${legacyClass}\\b`, 'i'),
      `${label}: não mantém a classe legada ${legacyClass}`,
    );
  }
}

function fixedTimingResult(month) {
  const state = {
    amountCents: 30_000_000,
    term: 360,
    ratePercent: 14.571181,
    ratePeriod: 'annual',
    annualRateType: 'effective',
    monthlyExtraCostCents: 0,
    firstDueDate: null,
    correction: {
      mode: 'none',
      monthlyRatePercent: 0,
      monthlyRatesPercent: [],
    },
    system: 'sac',
    extraPayments: [{
      type: 'single',
      valueCents: 2_000_000,
      month,
      startMonth: null,
      endMonth: null,
      frequencyMonths: null,
      goal: 'payment',
    }],
  };
  const config = scenarios.financeConfig(state);
  return finance.simulate(config, config.extraPayments);
}

function imagePathFromFrontMatter(socialImage) {
  if (typeof socialImage === 'string') return socialImage.replace(/^\//, '');
  return String(socialImage?.path || socialImage?.src || '').replace(/^\//, '');
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  assert.equal(signature, '89504e470d0a1a0a', 'arte social usa o formato PNG');
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG possui cabeçalho IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

(async () => {
  const entry = registry.guideById[contentId];
  assert.ok(entry, 'novo guia está registrado');
  assert.equal(entry.category, 'amortization', 'novo guia pertence à categoria Amortização');
  assert.equal(entry.order, 6, 'novo guia aparece imediatamente após prazo versus parcela');
  assert.deepEqual(
    Object.fromEntries(registry.locales.map((locale) => [locale, registry.publicPathFor('guide', contentId, locale)])),
    Object.fromEntries(registry.locales.map((locale) => [locale, expected[locale].path])),
    'slugs localizados preservam as três URLs aprovadas',
  );
  assert.equal(new Set(registry.guides.map((guide) => guide.id)).size, 13, 'contentIds dos guias são únicos');
  for (const locale of registry.locales) {
    assert.equal(
      new Set(registry.guides.map((guide) => guide.slugs[locale])).size,
      13,
      `${locale}: slugs dos guias são únicos`,
    );
  }

  const sourceByLocale = await newGuideSources();
  assert.equal(sourceByLocale.size, 3, 'o novo guia possui exatamente três traduções');
  const socialImagePaths = new Set();
  for (const locale of registry.locales) {
    const { data, body, raw } = sourceByLocale.get(locale);
    assert.equal(data.title, expected[locale].title, `${locale}: H1 editorial corresponde ao aprovado`);
    assert.ok(data.seoTitle && data.seoTitle !== data.title, `${locale}: título SEO é explícito e independente do H1`);
    assert.ok(data.cardDescription && data.cardDescription !== data.description, `${locale}: resumo do card é explícito e independente da meta description`);
    assert.equal(data.published, '2026-08-12', `${locale}: data de publicação correta`);
    assert.equal(data.updated, '2026-08-12', `${locale}: data de revisão correta`);
    assert.deepEqual(data.dataDependencies, ['bcb'], `${locale}: cenário declara somente a dependência BCB`);
    assert.deepEqual(
      [...data.relatedSimulationIds].sort(),
      ['extra-20k-year-five', 'term-vs-payment'].sort(),
      `${locale}: relaciona as duas simulações previstas`,
    );
    for (const relatedId of ['financing-basics', 'term-or-payment', 'tr-balance', 'bank-payment-difference']) {
      assert.ok(data.relatedGuideIds.includes(relatedId), `${locale}: relaciona o guia ${relatedId}`);
    }
    assert.match(body, /\{%\s*scenarioModule\s+"amortization-timing"/, `${locale}: usa o cenário temporal interno`);
    assert.match(body, /class="amortization-timeline"/, `${locale}: contém linha do tempo semântica`);
    assertSituationComponent(body, `${locale}: fonte Markdown`);
    assert.doesNotMatch(raw, /mermaid/i, `${locale}: fonte não incorpora Mermaid`);
    assert.doesNotMatch(body, /<script\b/i, `${locale}: conteúdo não adiciona scripts`);
    const localFaq = body.match(/<section\b[^>]*class="[^"]*guide-local-faq[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1];
    assert.ok(localFaq, `${locale}: FAQ local possui contêiner próprio`);
    assert.equal((localFaq.match(/<details\b/gi) || []).length, 4, `${locale}: FAQ local contém quatro dúvidas`);
    assert.doesNotMatch(
      raw,
      /(?:582[.\s]994[,\.]91|583[.\s]112[,\.]56|117[,\.]65|58\s?299\s?491|58\s?311\s?256|11\s?765)/,
      `${locale}: resultados calculados não estão hardcoded no Markdown`,
    );

    const socialImagePath = imagePathFromFrontMatter(data.socialImage);
    assert.ok(socialImagePath, `${locale}: declara imagem social própria`);
    assert.ok(data.socialImage.alt, `${locale}: imagem social possui texto alternativo localizado`);
    socialImagePaths.add(socialImagePath);
    const png = await readFile(join(root, socialImagePath));
    assert.deepEqual(pngDimensions(png), { width: 1200, height: 630 }, `${locale}: arte social mede 1200 x 630 px`);
    const svgPath = socialImagePath.replace(/\.png$/i, '.svg');
    await assert.doesNotReject(access(join(root, svgPath)), `${locale}: fonte SVG editável acompanha o PNG`);
    const svg = await readFile(join(root, svgPath), 'utf8');
    assert.match(svg, /<svg\b[^>]*\bwidth="1200"[^>]*\bheight="630"[^>]*\bviewBox="0 0 1200 630"/i, `${locale}: fonte SVG usa o canvas social exato`);
  }
  assert.equal(socialImagePaths.size, 3, 'cada idioma usa uma arte social localizada distinta');

  const scenario = scenarios.scenarios['amortization-timing'];
  assert.ok(scenario, 'cenário temporal interno é derivado no build');
  assert.equal(registry.simulationById['amortization-timing'], undefined, 'cenário interno não vira simulação pública');
  assert.ok(!registry.simulations.some(({ id }) => id === 'amortization-timing'), 'catálogo público mantém seis simulações');
  const month60 = scenario.variants.find((item) => item.state.extraPayments[0]?.month === 60);
  const month61 = scenario.variants.find((item) => item.state.extraPayments[0]?.month === 61);
  assert.ok(month60 && month61, 'cenário publicado compara aportes nos meses 60 e 61');
  for (const item of [month60, month61]) {
    assert.equal(item.state.amountCents, 30_000_000, 'cenário usa R$ 300 mil');
    assert.equal(item.state.term, 360, 'cenário usa 360 meses');
    assert.equal(item.state.system, 'sac', 'cenário usa SAC');
    assert.equal(item.state.correction.mode, 'none', 'cenário não usa correção');
    assert.equal(item.state.monthlyExtraCostCents, 0, 'cenário não usa custos extras');
    assert.equal(item.state.extraPayments[0].valueCents, 2_000_000, 'cenário usa aporte de R$ 20 mil');
    assert.equal(item.state.extraPayments[0].goal, 'payment', 'cenário reduz a parcela');
  }
  assert.equal(scenario.state.extraPayments[0].month, 60, 'CTA abre a variante de aporte no mês 60');

  const fixedMonth60 = fixedTimingResult(60);
  const fixedMonth61 = fixedTimingResult(61);
  assert.equal(fixedMonth60.stats.totalInterestCents, 58_299_491, 'regressão fixa: juros do aporte no mês 60');
  assert.equal(fixedMonth61.stats.totalInterestCents, 58_311_256, 'regressão fixa: juros do aporte no mês 61');
  assert.equal(
    fixedMonth61.stats.totalInterestCents - fixedMonth60.stats.totalInterestCents,
    11_765,
    'regressão fixa: esperar um mês custa R$ 117,65 em juros',
  );
  assert.ok(
    fixedMonth61.stats.totalInterestCents > fixedMonth60.stats.totalInterestCents,
    'regressão fixa: o aporte no mês 61 custa mais juros',
  );

  for (const locale of registry.locales) {
    const { data } = sourceByLocale.get(locale);
    const output = registry.outputPathFor('guide', contentId, locale);
    const html = await readFile(join(root, '_site', output), 'utf8');
    const expectedImagePath = imagePathFromFrontMatter(data.socialImage);
    const expectedImageUrl = `https://mapadasparcelas.com.br/${expectedImagePath}`;

    assert.match(html, new RegExp(`<h1[^>]*>${expected[locale].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`), `${locale}: H1 renderizado permanece editorial`);
    assert.ok(normalizeText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').startsWith(data.seoTitle), `${locale}: <title> usa seoTitle`);
    assert.equal(decodeEntities(extractMetaContent(html, 'name', 'description')), data.description, `${locale}: meta description permanece independente do card`);
    assert.equal(extractMetaContent(html, 'property', 'og:image'), expectedImageUrl, `${locale}: Open Graph usa arte localizada`);
    assert.equal(extractMetaContent(html, 'property', 'og:image:width'), '1200', `${locale}: Open Graph informa largura`);
    assert.equal(extractMetaContent(html, 'property', 'og:image:height'), '630', `${locale}: Open Graph informa altura`);
    assert.equal(decodeEntities(extractMetaContent(html, 'property', 'og:image:alt')), data.socialImage.alt, `${locale}: Open Graph possui alt localizado`);
    assert.equal(extractMetaContent(html, 'name', 'twitter:card'), 'summary_large_image', `${locale}: Twitter usa card amplo`);
    assert.equal(extractMetaContent(html, 'name', 'twitter:image'), expectedImageUrl, `${locale}: Twitter usa a mesma arte localizada`);
    const article = extractJsonLdNodes(html).find((node) => node['@type'] === 'Article');
    assert.ok(article, `${locale}: mantém JSON-LD Article`);
    const articleImageUrl = typeof article.image === 'string' ? article.image : article.image?.url;
    assert.equal(articleImageUrl, expectedImageUrl, `${locale}: Article.image usa a arte localizada`);

    assertSituationComponent(html, `${locale}: HTML gerado`);
    assert.doesNotMatch(html, /mermaid/i, `${locale}: HTML gerado não carrega Mermaid`);
    const baselineOutput = registry.outputPathFor('guide', 'financing-basics', locale);
    const baselineHtml = await readFile(join(root, '_site', baselineOutput), 'utf8');
    assert.deepEqual(
      scriptSources(html),
      scriptSources(baselineHtml),
      `${locale}: novo componente não acrescenta scripts à página editorial`,
    );

    assert.match(html, /data-scenario-id="amortization-timing"/, `${locale}: renderiza o módulo temporal`);
    assert.match(html, /class="[^"]*timing-comparison-table[^"]*"/, `${locale}: renderiza comparação completa`);
    assert.match(html, /class="[^"]*timing-installment-table[^"]*"/, `${locale}: renderiza parcelas dos meses 59 a 62`);
    assert.match(html, /class="[^"]*timing-chart-full[^"]*"/, `${locale}: renderiza gráfico dos 360 meses`);
    assert.match(html, /class="[^"]*timing-chart-zoom[^"]*"/, `${locale}: renderiza recorte ampliado`);
    assert.match(html, /class="[^"]*timing-cost-card[^"]*"/, `${locale}: renderiza cartão calculado do custo de esperar`);
    assert.ok((html.match(/<svg\b[^>]*role="img"[^>]*aria-labelledby=/g) || []).length >= 2, `${locale}: os dois SVGs são acessíveis`);
    assert.ok((html.match(/<title\b/g) || []).length >= 4, `${locale}: gráficos e pontos relevantes possuem títulos acessíveis`);
    const fullChart = html.match(/<figure\b[^>]*data-timing-chart="full"[^>]*>([\s\S]*?)<\/figure>/i)?.[1];
    const zoomChart = html.match(/<figure\b[^>]*data-timing-chart="zoom"[^>]*>([\s\S]*?)<\/figure>/i)?.[1];
    assert.ok(fullChart && zoomChart, `${locale}: extrai os dois gráficos temporais`);
    const fullLines = [...fullChart.matchAll(/<polyline\b[^>]*\bpoints="([^"]+)"/gi)];
    const zoomLines = [...zoomChart.matchAll(/<polyline\b[^>]*\bpoints="([^"]+)"/gi)];
    assert.deepEqual(fullLines.map((match) => match[1].trim().split(/\s+/).length), [361, 361], `${locale}: gráfico completo traz Início e 360 meses nas duas séries`);
    assert.deepEqual(zoomLines.map((match) => match[1].trim().split(/\s+/).length), [5, 5], `${locale}: zoom contém exatamente os meses 58 a 62`);
    assert.match(fullChart, />(?:R\$\s*0(?:,00)?|0\s*(?:BRL|R\$))</, `${locale}: eixo vertical completo começa em zero`);
    assert.equal((html.match(/<table\b[^>]*timing-installment-table[^>]*>[\s\S]*?<\/table>/i)?.[0].match(/<tbody>[\s\S]*?<\/tbody>/i)?.[0].match(/<tr>/g) || []).length, 4, `${locale}: tabela temporal traz as parcelas 59 a 62`);
    assert.doesNotMatch(html, /chart\.umd|chart\.js/i, `${locale}: página editorial não carrega Chart.js`);
    const publishedRate = render.formatNumber(scenario.state.ratePercent, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    assert.match(
      normalizeText(html),
      new RegExp(`${publishedRate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}% (?:a\\.a\\. efetivos|effective per year|anual efectiva)`),
      `${locale}: taxa BCB atual informa período anual e tipo efetivo`,
    );
    const currentCost = month61.result.stats.totalInterestCents - month60.result.stats.totalInterestCents;
    assert.ok(html.includes(render.formatCurrency(currentCost, locale)), `${locale}: custo de esperar vem do FinanceSimulator`);

    const href = html.match(/class="btn btn-primary" href="([^"]+\?sim=[^"]+)"/)?.[1];
    assert.ok(href, `${locale}: CTA do módulo aponta para o simulador`);
    const decoded = simulationState.decodeSimulationParam(new URL(href, `https://example.test/${output}`).searchParams.get('sim'));
    assert.deepEqual(decoded, scenario.state, `${locale}: CTA abre exatamente a variante do mês 60`);

    const hubFile = `${registry.roots.hub[locale].slice(1)}index.html`;
    const hub = await readFile(join(root, '_site', hubFile), 'utf8');
    const cardHref = registry.publicPathFor('guide', contentId, locale).split('/').filter(Boolean).at(-1);
    const card = [...hub.matchAll(/<article\b[^>]*data-guide-card[^>]*>[\s\S]*?<\/article>/gi)]
      .map((match) => match[0])
      .find((item) => item.includes(`${cardHref}/`));
    assert.ok(card, `${locale}: hub possui o card do novo guia`);
    assert.ok(normalizeText(card).includes(data.cardDescription), `${locale}: card usa cardDescription`);
    const searchValue = decodeEntities(card.match(/\bdata-search="([^"]*)"/i)?.[1] ?? '');
    assert.ok(searchValue.includes(data.title), `${locale}: busca indexa o título`);
    assert.ok(searchValue.includes(data.cardDescription), `${locale}: busca indexa o resumo do card`);
    for (const tag of data.tags) assert.ok(searchValue.includes(tag), `${locale}: busca indexa a tag ${tag}`);
  }

  const fallbackOutput = registry.outputPathFor('guide', 'financing-basics', 'pt-BR');
  const fallbackHtml = await readFile(join(root, '_site', fallbackOutput), 'utf8');
  const fallbackSource = parseMarkdown(
    await readFile(join(root, 'src/content/guides/pt-BR/financing-basics.md'), 'utf8'),
    'src/content/guides/pt-BR/financing-basics.md',
  );
  assert.equal(fallbackSource.data.seoTitle, undefined, 'guia antigo não precisa declarar seoTitle');
  assert.equal(fallbackSource.data.cardDescription, undefined, 'guia antigo não precisa declarar cardDescription');
  assert.equal(fallbackSource.data.socialImage, undefined, 'guia antigo não precisa declarar socialImage');
  assert.ok(
    normalizeText(fallbackHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').startsWith(fallbackSource.data.title),
    'guia antigo usa o título editorial como fallback de SEO',
  );
  assert.equal(
    extractMetaContent(fallbackHtml, 'property', 'og:image'),
    'https://mapadasparcelas.com.br/assets/image/logo.png',
    'guias antigos preservam fallback para o logo social',
  );
  assert.equal(
    extractMetaContent(fallbackHtml, 'name', 'twitter:card'),
    'summary',
    'guias antigos preservam o Twitter card compacto',
  );
  const fallbackHub = await readFile(join(root, '_site/guias/index.html'), 'utf8');
  const fallbackSlug = registry.guideById['financing-basics'].slugs['pt-BR'];
  const fallbackCard = [...fallbackHub.matchAll(/<article\b[^>]*data-guide-card[^>]*>[\s\S]*?<\/article>/gi)]
    .map((match) => match[0])
    .find((item) => item.includes(`${fallbackSlug}/`));
  assert.ok(fallbackCard, 'hub contém card de um guia sem os novos campos opcionais');
  assert.ok(
    normalizeText(fallbackCard).includes(fallbackSource.data.description),
    'card de guia antigo usa description como fallback',
  );

  for (const locale of registry.locales) {
    const hubPath = join(root, '_site', registry.roots.hub[locale].slice(1), 'index.html');
    const hubHtml = await readFile(hubPath, 'utf8');
    assert.match(hubHtml, /<meta\b[^>]*property="og:url"[^>]*>/i, `${locale}: hub localizado foi regenerado`);
  }
  const sitemap = await readFile(join(root, '_site/sitemap.xml'), 'utf8');
  const expectedHubLastmod = [
    '2026-08-12',
    scenarios.references.bcb.generatedAt.slice(0, 10),
    scenarios.references.tr.generatedAt.slice(0, 10),
  ].sort().at(-1);
  for (const locale of registry.locales) {
    const hubUrl = `https://mapadasparcelas.com.br${registry.roots.hub[locale]}`;
    const hubBlock = [...sitemap.matchAll(/<url>\s*[\s\S]*?<\/url>/gi)]
      .map((match) => match[0])
      .find((block) => block.includes(`<loc>${hubUrl}</loc>`));
    assert.match(
      hubBlock || '',
      new RegExp(`<lastmod>${expectedHubLastmod}<\\/lastmod>`),
      `${locale}: lastmod do hub respeita o piso editorial e as fontes atuais`,
    );
  }

  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const declaredDependencies = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ].sort();
  assert.deepEqual(
    declaredDependencies,
    ['@11ty/eleventy'],
    'o componente preserva Eleventy como única dependência do projeto',
  );

  console.log('Testes do guia de melhor dia para amortizar concluídos com sucesso.');
})();
