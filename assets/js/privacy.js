(function initializePrivacyPage() {
  'use strict';

  const i18n = window.FinancingI18n;
  const languageSelect = document.querySelector('#language-select');

  if (!i18n || !languageSelect) return;

  function applyTranslations() {
    i18n.setLanguage(i18n.getLanguage());
    languageSelect.value = i18n.getLanguage();

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = i18n.t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', i18n.t(element.dataset.i18nAriaLabel));
    });

    document.title = i18n.t('privacy.metadata.title');
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      i18n.t('privacy.metadata.description'),
    );
  }

  languageSelect.addEventListener('change', () => {
    i18n.setLanguage(languageSelect.value);
    applyTranslations();
  });

  applyTranslations();
}());
