(function initializeContentIndex() {
  'use strict';

  const searchInput = document.querySelector('#guide-search');
  const filterButtons = [...document.querySelectorAll('[data-guide-filter]')];
  const guideCards = [...document.querySelectorAll('[data-guide-card]')];
  const emptyState = document.querySelector('#guide-search-empty');
  if (!searchInput || filterButtons.length === 0 || guideCards.length === 0) return;

  let currentCategory = 'all';

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
  }

  function applyFilter() {
    const query = normalize(searchInput.value.trim());
    let visibleCount = 0;

    guideCards.forEach((card) => {
      const matchesCategory = currentCategory === 'all' || card.dataset.category === currentCategory;
      const matchesQuery = !query || normalize(card.dataset.search).includes(query);
      const visible = matchesCategory && matchesQuery;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    emptyState?.classList.toggle('d-none', visibleCount > 0);
  }

  searchInput.addEventListener('input', applyFilter);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentCategory = button.dataset.guideFilter;
      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      applyFilter();
    });
  });
}());
