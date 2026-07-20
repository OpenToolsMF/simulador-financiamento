(function initializeInstitutionalPage() {
  'use strict';

  const i18n = window.FinancingI18n;
  const languageSelect = document.querySelector('#language-select');

  if (!i18n || !languageSelect) return;

  const currentPage = i18n.getCurrentPageKind();
  const supportedInstitutionalPages = new Set(['privacy', 'about', 'contact']);
  const pageKey = supportedInstitutionalPages.has(currentPage) ? currentPage : 'privacy';

  function updateLocalizedLinks() {
    const simulatorPath = i18n.localizedPathForLanguage(i18n.getLanguage(), 'simulator');
    const privacyPath = i18n.localizedPathForLanguage(i18n.getLanguage(), 'privacy');
    const aboutPath = i18n.localizedPathForLanguage(i18n.getLanguage(), 'about');
    const contactPath = i18n.localizedPathForLanguage(i18n.getLanguage(), 'contact');
    document.querySelector('.privacy-back-link')?.setAttribute('href', simulatorPath);
    document.querySelectorAll('[data-route="simulator"]').forEach((link) => link.setAttribute('href', simulatorPath));
    document.querySelectorAll('[data-route="privacy"]').forEach((link) => link.setAttribute('href', privacyPath));
    document.querySelectorAll('[data-route="about"]').forEach((link) => link.setAttribute('href', aboutPath));
    document.querySelectorAll('[data-route="contact"]').forEach((link) => link.setAttribute('href', contactPath));

    document.querySelectorAll('.site-footer a[data-route]').forEach((link) => {
      const isCurrentPage = link.dataset.route === pageKey;
      if (isCurrentPage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function applyTranslations() {
    i18n.setLanguage(i18n.getLanguage());
    languageSelect.value = i18n.getLanguage();
    updateLocalizedLinks();

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = i18n.t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', i18n.t(element.dataset.i18nAriaLabel));
    });

    const title = i18n.t(`${pageKey}.metadata.title`);
    const description = i18n.t(`${pageKey}.metadata.description`);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      description,
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:locale"]')?.setAttribute(
      'content',
      i18n.getLocale().replace('-', '_'),
    );
    document.querySelector('meta[property="og:site_name"]')?.setAttribute(
      'content',
      i18n.t('header.title'),
    );
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  }

  languageSelect.addEventListener('change', () => {
    const nextLanguage = languageSelect.value;
    const nextUrl = i18n.localizedUrlForLanguage(nextLanguage, pageKey);
    i18n.setLanguage(nextLanguage);
    if (nextUrl && nextUrl !== window.location.href) {
      window.location.assign(nextUrl);
      return;
    }
    applyTranslations();
  });

  applyTranslations();
}());
