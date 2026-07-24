'use strict';

const assert = require('node:assert/strict');
const { access, readFile } = require('node:fs/promises');
const { join } = require('node:path');

const projectRoot = join(__dirname, '..');

function extractTagValue(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i'));
  return match?.[1].trim() ?? null;
}

function extractHtmlLang(html) {
  return html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? null;
}

function extractCanonical(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicalTag = linkTags.find((tag) => /\brel=["']canonical["']/i.test(tag));
  return canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
}

function extractManifest(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const manifestTag = linkTags.find((tag) => /\brel=["']manifest["']/i.test(tag));
  return manifestTag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
}

function extractAlternateLinks(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  return Object.fromEntries(linkTags
    .filter((tag) => /\brel=["']alternate["']/i.test(tag) && /\bhreflang=["']/i.test(tag))
    .map((tag) => [
      tag.match(/\bhreflang=["']([^"']+)["']/i)?.[1],
      tag.match(/\bhref=["']([^"']+)["']/i)?.[1],
    ])
    .filter(([language, href]) => language && href));
}

function extractMetaContent(html, attribute, value) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const metaTag = metaTags.find((tag) => new RegExp(`\\b${attribute}=["']${value}["']`, 'i').test(tag));
  return metaTag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? null;
}

function extractJsonLdNodes(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const block = JSON.parse(match[1]);
      return block['@graph'] ?? [block];
    });
}

function normalizeHtmlText(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function assetReferences(html) {
  return [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((reference) => reference.includes('assets/'));
}

(async () => {
  const domain = (await readFile(join(projectRoot, 'CNAME'), 'utf8')).trim();
  assert.ok(domain, 'CNAME define o domínio canônico');
  const origin = `https://${domain}`;

  const routeGroups = {
    simulator: {
      'pt-BR': `${origin}/`,
      en: `${origin}/en/`,
      es: `${origin}/es/`,
      'x-default': `${origin}/`,
    },
    privacy: {
      'pt-BR': `${origin}/privacidade.html`,
      en: `${origin}/en/privacy.html`,
      es: `${origin}/es/privacidad.html`,
      'x-default': `${origin}/privacidade.html`,
    },
    about: {
      'pt-BR': `${origin}/sobre/`,
      en: `${origin}/en/about/`,
      es: `${origin}/es/acerca-de/`,
      'x-default': `${origin}/sobre/`,
    },
    contact: {
      'pt-BR': `${origin}/fale-conosco/`,
      en: `${origin}/en/contact/`,
      es: `${origin}/es/contacto/`,
      'x-default': `${origin}/fale-conosco/`,
    },
    comparison: {
      'pt-BR': `${origin}/comparar/`,
      en: `${origin}/en/compare/`,
      es: `${origin}/es/comparar/`,
      'x-default': `${origin}/comparar/`,
    },
  };

  const publicPages = [
    { file: 'index.html', language: 'pt-BR', htmlLang: 'pt-BR', page: 'simulator' },
    { file: 'en/index.html', language: 'en', htmlLang: 'en', page: 'simulator' },
    { file: 'es/index.html', language: 'es', htmlLang: 'es', page: 'simulator' },
    { file: 'comparar/index.html', language: 'pt-BR', htmlLang: 'pt-BR', page: 'comparison' },
    { file: 'en/compare/index.html', language: 'en', htmlLang: 'en', page: 'comparison' },
    { file: 'es/comparar/index.html', language: 'es', htmlLang: 'es', page: 'comparison' },
    { file: 'privacidade.html', language: 'pt-BR', htmlLang: 'pt-BR', page: 'privacy' },
    { file: 'en/privacy.html', language: 'en', htmlLang: 'en', page: 'privacy' },
    { file: 'es/privacidad.html', language: 'es', htmlLang: 'es', page: 'privacy' },
    { file: 'sobre/index.html', language: 'pt-BR', htmlLang: 'pt-BR', page: 'about' },
    { file: 'en/about/index.html', language: 'en', htmlLang: 'en', page: 'about' },
    { file: 'es/acerca-de/index.html', language: 'es', htmlLang: 'es', page: 'about' },
    { file: 'fale-conosco/index.html', language: 'pt-BR', htmlLang: 'pt-BR', page: 'contact' },
    { file: 'en/contact/index.html', language: 'en', htmlLang: 'en', page: 'contact' },
    { file: 'es/contacto/index.html', language: 'es', htmlLang: 'es', page: 'contact' },
  ].map((page) => ({
    ...page,
    url: routeGroups[page.page][page.language],
  }));

  const canonicalUrls = [];
  const manifestUrls = [];
  const structuredDataByFile = new Map();
  for (const page of publicPages) {
    const html = await readFile(join(projectRoot, page.file), 'utf8');
    const expectedAlternates = routeGroups[page.page];

    structuredDataByFile.set(page.file, extractJsonLdNodes(html));

    assert.equal(extractHtmlLang(html), page.htmlLang, `${page.file}: html lang corresponde ao idioma da URL`);
    assert.equal(extractCanonical(html), page.url, `${page.file}: canonical corresponde à URL pública`);
    assert.deepEqual(extractAlternateLinks(html), expectedAlternates, `${page.file}: hreflang completo e recíproco`);
    assert.equal(extractMetaContent(html, 'property', 'og:url'), page.url, `${page.file}: og:url corresponde à canonical`);
    assert.equal(
      extractMetaContent(html, 'property', 'og:locale'),
      { 'pt-BR': 'pt_BR', en: 'en_US', es: 'es_ES' }[page.language],
      `${page.file}: og:locale corresponde ao idioma`,
    );

    const manifestReference = extractManifest(html);
    assert.ok(manifestReference, `${page.file}: referencia o manifesto da aplicação`);
    manifestUrls.push(new URL(manifestReference, page.url).href);

    const refs = assetReferences(html);
    assert.ok(refs.length > 0, `${page.file}: referencia assets locais`);
    if (page.file.includes('/')) {
      assert.ok(
        refs.every((reference) => !reference.startsWith('./assets/')),
        `${page.file}: assets em subdiretório usam caminho relativo ao nível correto`,
      );
    }
    for (const reference of refs) {
      const resolved = new URL(reference, page.url);
      if (resolved.origin !== origin || !resolved.pathname.includes('/assets/')) continue;
      const assetPath = resolved.pathname.replace(/^\//, '').replace(/\?.*$/, '');
      await assert.doesNotReject(
        access(join(projectRoot, assetPath)),
        `${page.file}: asset local existe (${reference})`,
      );
    }

    canonicalUrls.push(page.url);
  }

  assert.equal(new Set(canonicalUrls).size, canonicalUrls.length, 'não existem canonicals duplicadas');

  const websiteIdentity = {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: `${origin}/`,
    name: 'Mapa das Parcelas',
    alternateName: ['Installment Map', 'Mapa de cuotas'],
    inLanguage: ['pt-BR', 'en', 'es'],
  };
  const applicationNames = {
    'pt-BR': 'Mapa das Parcelas',
    en: 'Installment Map',
    es: 'Mapa de cuotas',
  };
  const comparisonApplicationNames = {
    'pt-BR': 'Comparar financiamentos por banco | Mapa das Parcelas',
    en: 'Compare financing by bank | Installment Map',
    es: 'Comparar financiación por banco | Mapa de cuotas',
  };

  for (const page of publicPages.filter(({ page: pageType }) => pageType === 'simulator')) {
    const nodes = structuredDataByFile.get(page.file);
    const websites = nodes.filter((node) => node['@type'] === 'WebSite');
    assert.equal(websites.length, 1, `${page.file}: define uma única entidade WebSite`);
    assert.deepEqual(websites[0], websiteIdentity, `${page.file}: usa a identidade global canônica do site`);

    const application = nodes.find((node) => node['@type'] === 'WebApplication');
    assert.ok(application, `${page.file}: possui WebApplication`);
    assert.equal(application['@id'], `${page.url}#application`, `${page.file}: aplicação possui @id localizado`);
    assert.equal(application.url, page.url, `${page.file}: aplicação possui URL localizada`);
    assert.equal(application.name, applicationNames[page.language], `${page.file}: aplicação possui nome localizado`);
    assert.equal(application.inLanguage, page.language, `${page.file}: aplicação possui idioma localizado`);
    assert.deepEqual(
      application.isPartOf,
      { '@id': websiteIdentity['@id'] },
      `${page.file}: aplicação referencia a identidade global do site`,
    );

    const faq = nodes.find((node) => node['@type'] === 'FAQPage');
    assert.ok(faq, `${page.file}: possui FAQPage`);
    assert.equal(faq['@id'], `${page.url}#faq`, `${page.file}: FAQ possui @id localizado`);
    assert.equal(faq.inLanguage, page.language, `${page.file}: FAQ possui idioma localizado`);
  }

  for (const page of publicPages.filter(({ page: pageType }) => pageType === 'comparison')) {
    const nodes = structuredDataByFile.get(page.file);
    const application = nodes.find((node) => node['@type'] === 'WebApplication');
    assert.ok(application, `${page.file}: possui WebApplication`);
    assert.equal(application['@id'], `${page.url}#application`, `${page.file}: aplicação possui @id localizado`);
    assert.equal(application.url, page.url, `${page.file}: aplicação possui URL localizada`);
    assert.equal(application.name, comparisonApplicationNames[page.language], `${page.file}: comparação possui nome localizado`);
    assert.equal(application.inLanguage, page.language, `${page.file}: comparação possui idioma localizado`);
    assert.deepEqual(
      application.isPartOf,
      { '@id': websiteIdentity['@id'] },
      `${page.file}: comparação referencia a identidade global do site`,
    );
  }

  for (const page of publicPages.filter(({ page: pageType }) => ['privacy', 'about', 'contact'].includes(pageType))) {
    const nodes = structuredDataByFile.get(page.file);
    const webPage = nodes.find((node) => node['@type'] === 'WebPage');
    assert.ok(webPage, `${page.file}: possui WebPage`);
    assert.equal(webPage['@id'], `${page.url}#webpage`, `${page.file}: página possui @id localizado`);
    assert.equal(webPage.url, page.url, `${page.file}: página possui URL localizada`);
    assert.equal(webPage.inLanguage, page.language, `${page.file}: página possui idioma localizado`);
    assert.deepEqual(
      webPage.isPartOf,
      { '@id': websiteIdentity['@id'] },
      `${page.file}: página referencia a identidade global sem redefini-la`,
    );
    assert.equal(
      webPage.about?.['@id'],
      `${routeGroups.simulator[page.language]}#application`,
      `${page.file}: página referencia a aplicação localizada`,
    );
  }

  assert.deepEqual(
    [...new Set(manifestUrls)],
    [`${origin}/assets/image/favicon/site.webmanifest`],
    'todas as páginas públicas usam o mesmo manifesto',
  );

  const manifestPath = join(projectRoot, 'assets/image/favicon/site.webmanifest');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.name, 'Mapa das Parcelas', 'manifesto usa o nome público do projeto');
  assert.equal(manifest.short_name, 'Mapa Parcelas', 'manifesto possui nome curto da marca');
  assert.ok(manifest.description, 'manifesto possui descrição');
  assert.equal(manifest.lang, 'pt-BR', 'manifesto declara o idioma padrão');
  assert.equal(manifest.start_url, '../../../', 'manifesto abre a raiz relativa do projeto');
  assert.equal(manifest.scope, '../../../', 'manifesto limita o escopo à raiz relativa do projeto');
  assert.equal(manifest.display, 'standalone', 'manifesto preserva exibição standalone');
  assert.equal(manifest.theme_color, '#176B3A', 'manifesto usa a cor primária do projeto');
  assert.equal(manifest.background_color, '#F4F8F5', 'manifesto usa o fundo visual do projeto');
  assert.deepEqual(
    manifest.icons.map(({ sizes }) => sizes),
    ['192x192', '512x512'],
    'manifesto oferece ícones nos tamanhos necessários',
  );

  const manifestPublicUrl = `${origin}/assets/image/favicon/site.webmanifest`;
  for (const icon of manifest.icons) {
    assert.ok(!icon.src.startsWith('/'), `${icon.src}: ícone usa caminho relativo`);
    assert.equal(icon.type, 'image/png', `${icon.src}: ícone declara o tipo PNG`);
    assert.equal(icon.purpose, 'any', `${icon.src}: ícone não declara suporte maskable não validado`);
    const iconUrl = new URL(icon.src, manifestPublicUrl);
    const iconPath = iconUrl.pathname.replace(/^\//, '');
    await assert.doesNotReject(
      access(join(projectRoot, iconPath)),
      `${icon.src}: arquivo de ícone existe`,
    );
  }

  const homeHtml = await readFile(join(projectRoot, 'index.html'), 'utf8');
  const privacyHtml = await readFile(join(projectRoot, 'privacidade.html'), 'utf8');
  const homeTitle = extractTagValue(homeHtml, 'title');
  const privacyTitle = extractTagValue(privacyHtml, 'title');
  assert.ok(homeTitle, 'home possui título');
  assert.ok(privacyTitle, 'privacidade possui título');
  assert.notEqual(privacyTitle, homeTitle, 'home e privacidade possuem títulos distintos');
  assert.doesNotMatch(
    privacyTitle,
    /\b(?:financiamento|financing|financiación)\b/i,
    'título da privacidade não disputa termos financeiros da home',
  );
  assert.equal(
    extractMetaContent(privacyHtml, 'property', 'og:title'),
    privacyTitle,
    'Open Graph da privacidade corresponde ao título da página',
  );
  assert.equal(
    extractMetaContent(privacyHtml, 'name', 'twitter:title'),
    privacyTitle,
    'Twitter da privacidade corresponde ao título da página',
  );
  const privacySchema = extractJsonLdNodes(privacyHtml).find((node) => node['@type'] === 'WebPage');
  assert.ok(privacySchema, 'privacidade possui JSON-LD WebPage');
  assert.equal(privacySchema.name, privacyTitle, 'JSON-LD da privacidade corresponde ao título da página');
  assert.equal(
    extractCanonical(privacyHtml),
    `${origin}/privacidade.html`,
    'privacidade possui canonical próprio',
  );
  assert.doesNotMatch(
    privacyHtml,
    /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i,
    'privacidade permanece indexável',
  );
  assert.match(
    homeHtml,
    /<section\b[^>]*class=["'][^"']*faq-section[^"']*no-print[^"']*["'][^>]*>/i,
    'FAQ existe no HTML e não integra o relatório impresso',
  );
  assert.match(
    homeHtml,
    /<h2\b[^>]*>Perguntas frequentes sobre o simulador<\/h2>/i,
    'FAQ possui fallback indexável em português',
  );
  const visibleFaqItems = [...homeHtml.matchAll(/<details\b[^>]*data-faq-item[^>]*>([\s\S]*?)<\/details>/gi)]
    .map((match) => {
      const question = match[1].match(/<summary\b[^>]*data-faq-question[^>]*>([\s\S]*?)<\/summary>/i)?.[1];
      const answer = match[1].match(/<([a-z][\w-]*)\b[^>]*data-faq-answer[^>]*>([\s\S]*?)<\/\1>/i)?.[2];
      return {
        question: normalizeHtmlText(question ?? ''),
        answer: normalizeHtmlText(answer ?? ''),
      };
    });
  assert.equal(visibleFaqItems.length, 15, 'FAQ visível contém quinze perguntas e respostas');
  assert.ok(
    visibleFaqItems.every(({ question, answer }) => question && answer),
    'todas as perguntas visíveis possuem resposta',
  );

  const schemaNodes = extractJsonLdNodes(homeHtml);
  const faqSchema = schemaNodes.find((node) => node['@type'] === 'FAQPage');
  assert.ok(faqSchema, 'JSON-LD contém FAQPage');
  const structuredFaqItems = faqSchema.mainEntity.map((item) => ({
    question: item.name,
    answer: item.acceptedAnswer?.text,
  }));
  assert.deepEqual(
    structuredFaqItems,
    visibleFaqItems,
    'FAQ estruturado corresponde exatamente ao conteúdo visível em português',
  );

  const sitemap = await readFile(join(projectRoot, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i);
  const urlBlocks = sitemap.match(/<url>\s*[\s\S]*?<\/url>/gi) ?? [];
  assert.equal(urlBlocks.length, publicPages.length, 'sitemap tem uma entrada para cada página pública');

  const sitemapUrls = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const block of urlBlocks) {
    const location = extractTagValue(block, 'loc');
    const lastModified = extractTagValue(block, 'lastmod');
    assert.ok(location, 'entrada do sitemap contém loc');
    assert.doesNotThrow(() => new URL(location), `${location}: loc é uma URL válida`);
    assert.equal(new URL(location).origin, origin, `${location}: usa domínio e HTTPS canônicos`);
    assert.match(lastModified ?? '', /^\d{4}-\d{2}-\d{2}$/, `${location}: lastmod usa YYYY-MM-DD`);
    assert.equal(
      new Date(`${lastModified}T00:00:00.000Z`).toISOString().slice(0, 10),
      lastModified,
      `${location}: lastmod representa uma data válida`,
    );
    assert.ok(lastModified <= today, `${location}: lastmod não está no futuro`);
    sitemapUrls.push(location);
  }

  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'sitemap não contém URLs duplicadas');
  assert.deepEqual(
    [...sitemapUrls].sort(),
    publicPages.map((page) => page.url).sort(),
    'sitemap cobre exatamente todas as páginas públicas',
  );

  const robots = await readFile(join(projectRoot, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent:\s*\*\s*$/im, 'robots.txt define regra para todos os agentes');
  assert.match(robots, /^Allow:\s*\/\s*$/im, 'robots.txt permite rastrear o site');
  const sitemapDirectives = [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((match) => match[1]);
  assert.deepEqual(sitemapDirectives, [`${origin}/sitemap.xml`], 'robots.txt aponta uma vez para o sitemap canônico');

  console.log('Testes dos arquivos de SEO concluídos com sucesso.');
})();
