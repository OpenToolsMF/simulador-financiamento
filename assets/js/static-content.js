(function initializeStaticContentPage() {
  'use strict';

  const languageSelect = document.querySelector('#language-select');
  if (!languageSelect) return;

  function alternateUrl(language) {
    const alternateHref = document.querySelector(`link[rel="alternate"][hreflang="${language}"]`)?.href;
    const canonicalHref = document.querySelector('link[rel="canonical"]')?.href;
    if (!alternateHref || !canonicalHref) return null;

    const alternate = new URL(alternateHref);
    const canonical = new URL(canonicalHref);
    const currentPath = window.location.pathname;
    const basePath = currentPath.endsWith(canonical.pathname)
      ? currentPath.slice(0, -canonical.pathname.length)
      : '';
    const targetPath = `${basePath}${alternate.pathname}`.replace(/\/{2,}/g, '/');
    return `${window.location.origin}${targetPath}${alternate.search}${alternate.hash}`;
  }

  languageSelect.addEventListener('change', () => {
    const target = alternateUrl(languageSelect.value);
    if (target && target !== window.location.href) window.location.assign(target);
  });
}());
