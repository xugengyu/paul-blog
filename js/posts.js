/* ============================================
   posts.js — Tag & month filtering for Posts page
   ============================================ */

(function () {
  'use strict';

  const cards = Array.from(document.querySelectorAll('.post-card'));
  const tagContainer = document.getElementById('filter-tags');
  const monthContainer = document.getElementById('filter-months');
  const clearBtn = document.getElementById('filter-clear');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('post-search');

  if (!cards.length || !tagContainer || !monthContainer) return;

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      applyFilters();
    });
  }

  // ---- Build unique tags & months from DOM ----
  const tagSet = new Set();
  const monthSet = new Set();

  cards.forEach(function (card) {
    (card.dataset.tags || '').split(',').forEach(function (t) {
      if (t.trim()) tagSet.add(t.trim());
    });
    if (card.dataset.month) monthSet.add(card.dataset.month);
  });

  const allTags = Array.from(tagSet).sort();
  const allMonths = Array.from(monthSet).sort().reverse();

  // ---- Render tag pills ----
  allTags.forEach(function (tag) {
    const btn = document.createElement('button');
    btn.className = 'filter-tag';
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener('click', function () {
      btn.classList.toggle('filter-tag--active');
      applyFilters();
    });
    tagContainer.appendChild(btn);
  });

  // ---- Render month buttons ----
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  allMonths.forEach(function (m) {
    var parts = m.split('-');
    var label = monthNames[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    var btn = document.createElement('button');
    btn.className = 'filter-month';
    btn.textContent = label;
    btn.dataset.month = m;
    btn.addEventListener('click', function () {
      // Toggle — only one month active at a time
      var wasActive = btn.classList.contains('filter-month--active');
      document.querySelectorAll('.filter-month').forEach(function (b) {
        b.classList.remove('filter-month--active');
      });
      if (!wasActive) btn.classList.add('filter-month--active');
      applyFilters();
    });
    monthContainer.appendChild(btn);
  });

  // ---- Clear all ----
  clearBtn.addEventListener('click', function () {
    document.querySelectorAll('.filter-tag').forEach(function (b) {
      b.classList.remove('filter-tag--active');
    });
    document.querySelectorAll('.filter-month').forEach(function (b) {
      b.classList.remove('filter-month--active');
    });
    applyFilters();
  });

  // ---- Filter logic ----
  function applyFilters() {
    var activeTags = Array.from(document.querySelectorAll('.filter-tag--active')).map(function (b) {
      return b.dataset.tag;
    });
    var activeMonthBtn = document.querySelector('.filter-month--active');
    var activeMonth = activeMonthBtn ? activeMonthBtn.dataset.month : null;
    var searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

    var anyFilterActive = activeTags.length > 0 || activeMonth || searchQuery;
    clearBtn.style.display = anyFilterActive ? 'block' : 'none';

    var visibleCount = 0;

    cards.forEach(function (card) {
      var cardTags = (card.dataset.tags || '').split(',').map(function (t) { return t.trim(); });
      var cardMonth = card.dataset.month;
      var cardTitle = (card.querySelector('.post-card__title').textContent || '').toLowerCase();
      var cardExcerpt = (card.querySelector('.post-card__excerpt').textContent || '').toLowerCase();

      var tagMatch = activeTags.length === 0 || activeTags.some(function (t) {
        return cardTags.indexOf(t) !== -1;
      });
      var monthMatch = !activeMonth || cardMonth === activeMonth;
      var textMatch = !searchQuery || cardTitle.includes(searchQuery) || cardExcerpt.includes(searchQuery) || cardTags.some(t => t.toLowerCase().includes(searchQuery));

      if (tagMatch && monthMatch && textMatch) {
        card.classList.remove('post-card--hidden');
        visibleCount++;
      } else {
        card.classList.add('post-card--hidden');
      }
    });

    // Show/hide year groups based on visible children
    document.querySelectorAll('.year-group').forEach(function (group) {
      var visibleCards = group.querySelectorAll('.post-card:not(.post-card--hidden)');
      group.style.display = visibleCards.length ? '' : 'none';
    });

    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }
})();
