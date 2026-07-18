'use strict';

const assert = require('node:assert/strict');
const { readFile, readdir } = require('node:fs/promises');
const { join } = require('node:path');

const projectRoot = join(__dirname, '..');

function extractTagValue(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i'));
  return match?.[1].trim() ?? null;
}

function extractCanonical(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicalTag = linkTags.find((tag) => /\brel=["']canonical["']/i.test(tag));
  return canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
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

function publicUrlForFile(origin, fileName) {
  return fileName === 'index.html' ? `${origin}/` : `${origin}/${fileName}`;
}

function normalizeHtmlText(value) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

(async () => {
  const domain = (await readFile(join(projectRoot, 'CNAME'), 'utf8')).trim();
  assert.ok(domain, 'CNAME define o domínio canônico');
  const origin = `https://${domain}`;

  const rootEntries = await readdir(projectRoot, { withFileTypes: true });
  const publicHtmlFiles = rootEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name)
    .sort();
  assert.ok(publicHtmlFiles.includes('index.html'), 'encontra a página principal');

  const expectedUrls = publicHtmlFiles.map((fileName) => publicUrlForFile(origin, fileName));
  const canonicalUrls = [];
  for (const fileName of publicHtmlFiles) {
    const html = await readFile(join(projectRoot, fileName), 'utf8');
    const canonical = extractCanonical(html);
    assert.equal(
      canonical,
      publicUrlForFile(origin, fileName),
      `${fileName}: canonical corresponde à URL pública`,
    );
    canonicalUrls.push(canonical);
  }
  assert.equal(new Set(canonicalUrls).size, canonicalUrls.length, 'não existem canonicals duplicadas');

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
  assert.match(homeHtml, /<h2\b[^>]*>Perguntas frequentes<\/h2>/i, 'FAQ possui fallback indexável em português');
  const visibleFaqItems = [...homeHtml.matchAll(/<details\b[^>]*data-faq-item[^>]*>([\s\S]*?)<\/details>/gi)]
    .map((match) => {
      const question = match[1].match(/<summary\b[^>]*data-faq-question[^>]*>([\s\S]*?)<\/summary>/i)?.[1];
      const answer = match[1].match(/<p\b[^>]*data-faq-answer[^>]*>([\s\S]*?)<\/p>/i)?.[1];
      return {
        question: normalizeHtmlText(question ?? ''),
        answer: normalizeHtmlText(answer ?? ''),
      };
    });
  assert.equal(visibleFaqItems.length, 9, 'FAQ visível contém nove perguntas e respostas');
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
  assert.equal(urlBlocks.length, expectedUrls.length, 'sitemap tem uma entrada para cada página pública');

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
  assert.deepEqual([...sitemapUrls].sort(), [...expectedUrls].sort(), 'sitemap cobre exatamente as páginas públicas');

  const robots = await readFile(join(projectRoot, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent:\s*\*\s*$/im, 'robots.txt define regra para todos os agentes');
  assert.match(robots, /^Allow:\s*\/\s*$/im, 'robots.txt permite rastrear o site');
  const sitemapDirectives = [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((match) => match[1]);
  assert.deepEqual(sitemapDirectives, [`${origin}/sitemap.xml`], 'robots.txt aponta uma vez para o sitemap canônico');

  console.log('Testes dos arquivos de SEO concluídos com sucesso.');
})();
