(function() {
  'use strict';

  // Determine if we are in a subdirectory (e.g. /posts/)
  const isPost = window.location.pathname.includes('/posts/');
  const basePath = isPost ? '../' : '';
  
  // Determine active page
  const currentPath = window.location.pathname;
  let activePage = 'index'; // Default
  if (currentPath.includes('posts.html') || currentPath.includes('/posts/')) activePage = 'posts';
  else if (currentPath.includes('notes.html')) activePage = 'notes';
  else if (currentPath.includes('apps.html')) activePage = 'apps';
  else if (currentPath.includes('contact.html')) activePage = 'contact';

  const navHtml = `
    <div class="nav__inner">
      <a href="${basePath}index.html" class="nav__logo">Random Thoughts of a Random Guy</a>
      <button class="nav__hamburger" id="nav-hamburger" aria-label="Toggle menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="nav__menu" id="nav-menu">
        <ul class="nav__links">
          <li><a href="${basePath}index.html" class="nav__link ${activePage === 'index' ? 'nav__link--active' : ''}">About</a></li>
          <li><a href="${basePath}posts.html" class="nav__link ${activePage === 'posts' ? 'nav__link--active' : ''}">Posts</a></li>
          <li><a href="${basePath}notes.html" class="nav__link ${activePage === 'notes' ? 'nav__link--active' : ''}">Notes</a></li>
          <li><a href="${basePath}apps.html" class="nav__link ${activePage === 'apps' ? 'nav__link--active' : ''}">Apps</a></li>
          <li><a href="${basePath}contact.html" class="nav__link ${activePage === 'contact' ? 'nav__link--active' : ''}">Contact</a></li>
          <li>
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  `;

  // Inject the nav
  const navEl = document.getElementById('main-nav');
  if (navEl) {
    navEl.innerHTML = navHtml;
  }

  // ---------- Mobile nav listeners ----------
  const hamburger = document.getElementById('nav-hamburger');
  const menu = document.getElementById('nav-menu');

  if (hamburger && menu) {
    hamburger.addEventListener('click', function () {
      menu.classList.toggle('nav__menu--open');
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('nav__menu--open');
      });
    });
  }
})();
