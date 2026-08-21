'use strict';

const assert = require('node:assert/strict');
const i18n = require('../assets/js/i18n.js');

const languages = i18n.getSupportedLanguages();
const expectedPrivacyTitles = {
  'pt-BR': 'Política de Privacidade | Mapa das Parcelas',
  en: 'Privacy Policy | Installment Map',
  es: 'Política de Privacidad | Mapa de cuotas',
};
const expectedAboutTitles = {
  'pt-BR': 'Sobre | Mapa das Parcelas',
  en: 'About | Installment Map',
  es: 'Acerca de | Mapa de cuotas',
};
const expectedContactTitles = {
  'pt-BR': 'Fale conosco | Mapa das Parcelas',
  en: 'Contact | Installment Map',
  es: 'Contacto | Mapa de cuotas',
};
const expectedComparisonTitles = {
  'pt-BR': 'Comparar financiamentos por banco | Mapa das Parcelas',
  en: 'Compare financing by bank | Installment Map',
  es: 'Comparar financiación por banco | Mapa de cuotas',
};
assert.deepEqual(languages, ['pt-BR', 'en', 'es'], 'expõe os três idiomas suportados');

const referenceKeys = Object.keys(i18n.dictionaries['pt-BR']).sort();
for (const language of languages) {
  const keys = Object.keys(i18n.dictionaries[language]).sort();
  assert.deepEqual(keys, referenceKeys, `${language}: mantém o mesmo conjunto de chaves`);
}

const faqEditorialExpectations = {
  'pt-BR': {
    amortizationQuestion: 'O que são amortização e amortização extra?',
    simulatorChoice: 'No simulador, você escolhe como cada amortização extra será usada:',
    removedSacPriceNote: 'Correção monetária, seguros, taxas e pagamentos extras',
    removedTrQualifier: 'conservadora',
  },
  en: {
    amortizationQuestion: 'What are amortization and extra amortization?',
    simulatorChoice: 'In the simulator, you choose how each extra amortization is used:',
    removedSacPriceNote: 'Monetary correction, insurance, fees, and extra payments',
    removedTrQualifier: 'conservative',
  },
  es: {
    amortizationQuestion: '¿Qué son la amortización y la amortización extra?',
    simulatorChoice: 'En el simulador, eliges cómo se usa cada amortización extra:',
    removedSacPriceNote: 'La corrección monetaria, los seguros, las tasas y los pagos extra',
    removedTrQualifier: 'conservadora',
  },
};
for (const [language, expectation] of Object.entries(faqEditorialExpectations)) {
  const dictionary = i18n.dictionaries[language];
  assert.equal(dictionary['faq.2.question'], expectation.amortizationQuestion, `${language}: explica amortização antes do uso extra`);
  assert.ok(dictionary['faq.2.answer'].includes('extra'), `${language}: diferencia amortização extra`);
  assert.ok(dictionary['faq.3.answer'].includes(expectation.simulatorChoice), `${language}: explica a escolha por amortização`);
  assert.ok(!dictionary['faq.1.answer'].includes(expectation.removedSacPriceNote), `${language}: remove observação adicional de SAC e Price`);
  assert.ok(!dictionary['faq.6.answer'].includes(expectation.removedTrQualifier), `${language}: não chama a estimativa da TR de conservadora`);
}

for (const language of languages) {
  i18n.setLanguage(language);
  assert.equal(i18n.getLanguage(), language, `${language}: troca idioma`);
  assert.notEqual(i18n.t('metadata.title'), 'metadata.title', `${language}: encontra chave crítica`);
  assert.notEqual(i18n.t('results.exportCsv'), 'results.exportCsv', `${language}: traduz exportação CSV`);
  assert.notEqual(i18n.t('results.exportCsvFormatted'), 'results.exportCsvFormatted', `${language}: traduz opção de CSV formatado`);
  assert.notEqual(i18n.t('results.exportCsvRaw'), 'results.exportCsvRaw', `${language}: traduz opção de CSV raw`);
  assert.notEqual(i18n.t('extras.orderHelp'), 'extras.orderHelp', `${language}: explica a ordem das amortizações`);
  assert.notEqual(i18n.t('extras.moveUpAria', { number: 2 }), 'extras.moveUpAria', `${language}: traduz controle de ordenação`);
  assert.ok(i18n.t('extras.mixedWarning', { months: '12, 24' }).includes('12, 24'), `${language}: lista meses com objetivos mistos`);
  assert.ok(i18n.t('extras.restoredAnnouncement', { count: 2 }).includes('2'), `${language}: anuncia quantidade de regras restauradas`);
  assert.ok(i18n.t('faq.14.answer').includes(language === 'en' ? 'current horizon' : language === 'es' ? 'horizonte vigente' : 'horizonte vigente'), `${language}: redução de parcela preserva o horizonte vigente`);
  assert.notEqual(i18n.t('bcb.title'), 'bcb.title', `${language}: traduz modal de taxas médias BCB`);
  assert.notEqual(i18n.t('bcb.openComparison'), 'bcb.openComparison', `${language}: traduz atalho para comparação no modal BCB`);
  assert.notEqual(i18n.t('footer.simulator'), 'footer.simulator', `${language}: traduz link do simulador no footer`);
  assert.notEqual(i18n.t('footer.copyright'), 'footer.copyright', `${language}: traduz copyright do footer`);
  assert.equal(
    i18n.t('privacy.metadata.title'),
    expectedPrivacyTitles[language],
    `${language}: mantém título específico da página de privacidade`,
  );
  assert.equal(
    i18n.t('about.metadata.title'),
    expectedAboutTitles[language],
    `${language}: mantém título específico da página sobre`,
  );
  assert.equal(
    i18n.t('contact.metadata.title'),
    expectedContactTitles[language],
    `${language}: mantém título específico da página de contato`,
  );
  assert.equal(
    i18n.t('comparison.metadata.title'),
    expectedComparisonTitles[language],
    `${language}: mantém título específico da página de comparação`,
  );
  assert.notEqual(i18n.t('faq.1.question'), 'faq.1.question', `${language}: traduz perguntas frequentes`);
  assert.notEqual(i18n.t('faq.15.answer'), 'faq.15.answer', `${language}: traduz todas as respostas do FAQ`);
  assert.ok(i18n.t('validation.monthBetween', { term: 360 }).includes('360'), `${language}: interpola parâmetros`);
  assert.ok(i18n.formatCurrency(123456).includes('1'), `${language}: formata moeda`);
  assert.ok(i18n.formatDate('2026-07-15').length > 0, `${language}: formata data`);
  assert.ok(i18n.formatPercent(0.001664).includes('%'), `${language}: formata percentual`);
  assert.ok(i18n.formatRatePercent(0.1664).length > 0, `${language}: formata taxa de input`);
}

assert.equal(i18n.normalizeLanguage('pt'), 'pt-BR', 'normaliza português');
assert.equal(i18n.normalizeLanguage('en-US'), 'en', 'normaliza inglês');
assert.equal(i18n.normalizeLanguage('es-ES'), 'es', 'normaliza espanhol');
assert.equal(i18n.normalizeLanguage('fr-FR'), 'pt-BR', 'usa fallback pt-BR');
assert.equal(i18n.detectLanguage(), 'pt-BR', 'usa pt-BR como idioma inicial quando não há idioma salvo');

const routeCases = [
  ['/', { language: 'pt-BR', page: 'simulator', basePath: '' }],
  ['/index.html', { language: 'pt-BR', page: 'simulator', basePath: '' }],
  ['/en/', { language: 'en', page: 'simulator', basePath: '' }],
  ['/en', { language: 'en', page: 'simulator', basePath: '' }],
  ['/es/', { language: 'es', page: 'simulator', basePath: '' }],
  ['/es', { language: 'es', page: 'simulator', basePath: '' }],
  ['/privacidade.html', { language: 'pt-BR', page: 'privacy', basePath: '' }],
  ['/en/privacy.html', { language: 'en', page: 'privacy', basePath: '' }],
  ['/es/privacidad.html', { language: 'es', page: 'privacy', basePath: '' }],
  ['/sobre/', { language: 'pt-BR', page: 'about', basePath: '' }],
  ['/fale-conosco/', { language: 'pt-BR', page: 'contact', basePath: '' }],
  ['/en/about/', { language: 'en', page: 'about', basePath: '' }],
  ['/en/contact/', { language: 'en', page: 'contact', basePath: '' }],
  ['/en/compare/', { language: 'en', page: 'comparison', basePath: '' }],
  ['/es/acerca-de/', { language: 'es', page: 'about', basePath: '' }],
  ['/es/contacto/', { language: 'es', page: 'contact', basePath: '' }],
  ['/es/comparar/', { language: 'es', page: 'comparison', basePath: '' }],
  ['/comparar/', { language: 'pt-BR', page: 'comparison', basePath: '' }],
  ['/repo/en/', { language: 'en', page: 'simulator', basePath: '/repo' }],
  ['/repo/es/privacidad.html', { language: 'es', page: 'privacy', basePath: '/repo' }],
  ['/repo/en/about/', { language: 'en', page: 'about', basePath: '/repo' }],
  ['/repo/es/contacto/', { language: 'es', page: 'contact', basePath: '/repo' }],
  ['/repo/en/compare/', { language: 'en', page: 'comparison', basePath: '/repo' }],
  ['/repo/es/comparar/', { language: 'es', page: 'comparison', basePath: '/repo' }],
];
for (const [pathname, expected] of routeCases) {
  assert.deepEqual(i18n.routeInfoForPathname(pathname), expected, `detecta rota ${pathname}`);
}

const originalLocation = globalThis.location;
globalThis.location = { pathname: '/repo/en/privacy.html', origin: 'https://example.test' };
assert.equal(i18n.detectLanguage(), 'en', 'idioma explícito na rota vence a detecção padrão');
assert.equal(i18n.localizedPathForLanguage('pt-BR'), '/repo/privacidade.html', 'gera URL equivalente de privacidade em pt-BR');
assert.equal(i18n.localizedPathForLanguage('es'), '/repo/es/privacidad.html', 'gera URL equivalente de privacidade em es');
assert.equal(i18n.localizedUrlForLanguage('es'), 'https://example.test/repo/es/privacidad.html', 'gera URL absoluta equivalente');
globalThis.location = { pathname: '/repo/es/acerca-de/', origin: 'https://example.test' };
assert.equal(i18n.localizedPathForLanguage('pt-BR'), '/repo/sobre/', 'gera URL equivalente sobre em pt-BR');
assert.equal(i18n.localizedPathForLanguage('en'), '/repo/en/about/', 'gera URL equivalente sobre em en');
globalThis.location = { pathname: '/repo/fale-conosco/', origin: 'https://example.test' };
assert.equal(i18n.localizedPathForLanguage('en'), '/repo/en/contact/', 'gera URL equivalente contato em en');
assert.equal(i18n.localizedPathForLanguage('es'), '/repo/es/contacto/', 'gera URL equivalente contato em es');
globalThis.location = { pathname: '/repo/comparar/', origin: 'https://example.test' };
assert.equal(i18n.localizedPathForLanguage('en'), '/repo/en/compare/', 'gera URL equivalente comparação em en');
assert.equal(i18n.localizedPathForLanguage('es'), '/repo/es/comparar/', 'gera URL equivalente comparação em es');
if (originalLocation) globalThis.location = originalLocation;
else delete globalThis.location;

const numberCases = [
  ['1.234,56', 1234.56],
  ['1,234.56', 1234.56],
  ['1234,56', 1234.56],
  ['1234.56', 1234.56],
  ['1.000', 1000],
  ['0,1664', 0.1664],
  ['0.1664', 0.1664],
  ['R$ 1.000,00', 1000],
];
for (const [input, expected] of numberCases) {
  assert.equal(i18n.parseLocalizedNumber(input), expected, `parse ${input}`);
}

console.log('Testes de i18n concluídos com sucesso.');
