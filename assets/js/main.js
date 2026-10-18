/* ==========================================================================
   VSNM PRINTCARE SOLUTIONS - MAIN INTERACTIVE LOGIC
   Owner: Velayutham M | Heidelberg, POLAR & Stahl Specialist
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initBrandIntro();
  initHeaderScroll();
  initMobileNav();
  initHeroSlider();
  initScrollAnimations();
  initSearchModal();
  initFilterTabs();
  initSmoothScroll();
});

/* --------------------------------------------------------------------------
   BRAND INTRO CONTROLLER
   - Shows short elegant reveal on initial load
   - Auto-fades out after 1.8 seconds or immediately on Skip click / Esc key
   - Stores flag in sessionStorage so navigation across pages is frictionless
   -------------------------------------------------------------------------- */
function initBrandIntro() {
  const introEl = document.getElementById('brandIntro');
  if (!introEl) return;

  const skipBtn = document.getElementById('introSkipBtn');
  const hasSeenIntro = sessionStorage.getItem('vsnm_intro_seen');

  // If user has already seen the intro during this browser session, skip immediately
  if (hasSeenIntro && !window.location.hash.includes('replay-intro')) {
    introEl.classList.add('hidden');
    introEl.remove();
    return;
  }

  function dismissIntro() {
    introEl.classList.add('hidden');
    sessionStorage.setItem('vsnm_intro_seen', 'true');
    setTimeout(() => {
      if (introEl.parentNode) {
        introEl.parentNode.removeChild(introEl);
      }
    }, 500);
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', dismissIntro);
  }

  // Dismiss on clicking anywhere on the overlay
  introEl.addEventListener('click', dismissIntro);

  // Dismiss on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !introEl.classList.contains('hidden')) {
      dismissIntro();
    }
  });

  // Automatically fade out after 1.8s
  setTimeout(dismissIntro, 1800);
}

/* --------------------------------------------------------------------------
   HEADER SCROLL DETECTOR
   Adds shadow & backdrop blur when page is scrolled
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   MOBILE NAVIGATION DRAWER
   Smooth accessible drawer for smaller screens
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileNavDrawer');
  const closeBtn = document.getElementById('mobileDrawerClose');

  if (!toggleBtn || !drawer) return;

  function openMenu() {
    drawer.classList.add('open');
    toggleBtn.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.classList.remove('open');
    toggleBtn.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', () => {
    if (drawer.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Close when clicking background backdrop
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) {
      closeMenu();
    }
  });

  // Close when clicking any nav link inside drawer
  const drawerLinks = drawer.querySelectorAll('.mobile-nav-item');
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   INTERACTIVE SITE SEARCH MODAL
   - Searches headings, services, machines, parts, and experience
   - Live query matching with informative snippets
   -------------------------------------------------------------------------- */
function initSearchModal() {
  const searchTriggers = document.querySelectorAll('[data-search-trigger]');
  const modal = document.getElementById('searchModal');
  const closeBtn = document.getElementById('searchCloseBtn');
  const input = document.getElementById('siteSearchInput');
  const resultsContainer = document.getElementById('searchResultsArea');

  if (!modal || !input || !resultsContainer) return;

  function openSearch() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
    renderResults(input.value.trim());
  }

  function closeSearch() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  searchTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSearch);
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSearch();
    }
  });

  // Keyboard shortcut: '/' or 'Ctrl+K' or 'Cmd+K' opens search; Escape closes
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeSearch();
    } else if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !modal.classList.contains('open')) {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        e.preventDefault();
        openSearch();
      }
    }
  });

  // Real-time live filtering
  input.addEventListener('input', () => {
    renderResults(input.value.trim());
  });

  function renderResults(query) {
    if (!window.SITE_SEARCH_INDEX) {
      resultsContainer.innerHTML = '<div class="search-empty-state">Search index loading...</div>';
      return;
    }

    if (!query) {
      // Show default top recommendations
      const sampleItems = SITE_SEARCH_INDEX.slice(0, 4);
      resultsContainer.innerHTML = `
        <div style="padding: 0.5rem 1rem 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--c-slate-400);">
          Suggested Searches & Quick Links
        </div>
        ${sampleItems.map(item => `
          <a href="${item.url}" class="search-result-item" onclick="document.getElementById('searchModal').classList.remove('open'); document.body.style.overflow='';">
            <span class="result-badge">${item.category}</span>
            <div class="result-title">${escapeHTML(item.title)}</div>
            <div class="result-snippet">${escapeHTML(item.snippet)}</div>
          </a>
        `).join('')}
      `;
      return;
    }

    const q = query.toLowerCase();
    const matches = SITE_SEARCH_INDEX.filter(item => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inSnippet = item.snippet.toLowerCase().includes(q);
      const inCategory = item.category.toLowerCase().includes(q);
      const inKeywords = item.keywords.some(k => k.toLowerCase().includes(q));
      return inTitle || inSnippet || inCategory || inKeywords;
    });

    if (matches.length === 0) {
      const waUrl = `https://wa.me/918056359121?text=${encodeURIComponent(`Hello Velayutham, I was searching on your website for "${query}" and would like to ask about this.`)}`;
      resultsContainer.innerHTML = `
        <div class="search-empty-state">
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--c-navy-900); margin-bottom: 0.5rem;">No direct matches found for "${escapeHTML(query)}"</p>
          <p style="font-size: 0.9rem; margin-bottom: 1.25rem;">Would you like to ask Velayutham directly about this machinery or service?</p>
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
            Ask on WhatsApp about "${escapeHTML(query)}"
          </a>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div style="padding: 0.5rem 1rem 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--c-slate-400);">
        ${matches.length} matching result${matches.length > 1 ? 's' : ''}
      </div>
      ${matches.map(item => `
        <a href="${item.url}" class="search-result-item" onclick="document.getElementById('searchModal').classList.remove('open'); document.body.style.overflow='';">
          <span class="result-badge">${item.category}</span>
          <div class="result-title">${escapeHTML(item.title)}</div>
          <div class="result-snippet">${highlightQuery(item.snippet, query)}</div>
        </a>
      `).join('')}
    `;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function highlightQuery(text, query) {
    if (!query) return escapeHTML(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapeHTML(text).replace(regex, '<mark style="background-color: rgba(0, 163, 224, 0.25); color: inherit; padding-inline: 2px; border-radius: 2px;">$1</mark>');
  }
}

/* --------------------------------------------------------------------------
   FILTER TABS (For Sales & Parts pages)
   -------------------------------------------------------------------------- */
function initFilterTabs() {
  const tabContainers = document.querySelectorAll('[data-filter-group]');

  tabContainers.forEach(container => {
    const tabs = container.querySelectorAll('.tab-btn');
    const targetSelector = container.getAttribute('data-target-cards');
    const cards = document.querySelectorAll(targetSelector);

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filterValue = tab.getAttribute('data-filter');

        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue || (category && category.includes(filterValue))) {
            card.style.display = '';
            card.style.animation = 'fadeIn 0.3s ease forwards';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  });
}

/* --------------------------------------------------------------------------
   SMOOTH SCROLL HELPER
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.length <= 1) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   HERO AUTO-MOVING SLIDER (Images 1-4)
   - Auto moves 1 by 1 every 3.8s through images 1-4
   - Smooth cross-fade transition
   - Interactive dots and next/prev controls
   - Pauses on user hover/touch to avoid interrupting reading
   -------------------------------------------------------------------------- */
function initHeroSlider() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const counter = document.getElementById('heroSlideCounter');
  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');

  if (slides.length <= 1) return;

  let currentIdx = 0;
  let autoTimer = null;
  const slideInterval = 3800; // 3.8 seconds per slide

  function showSlide(index) {
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.classList.remove('active');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
        dot.setAttribute('aria-selected', 'true');
      } else {
        dot.classList.remove('active');
        dot.setAttribute('aria-selected', 'false');
      }
    });

    if (counter) {
      counter.textContent = `0${index + 1} / 0${slides.length}`;
    }

    currentIdx = index;
  }

  function nextSlide() {
    showSlide(currentIdx + 1);
  }

  function prevSlide() {
    showSlide(currentIdx - 1);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoTimer = setInterval(nextSlide, slideInterval);
  }

  function stopAutoPlay() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  // Dot clicks
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      showSlide(idx);
      startAutoPlay();
    });
  });

  // Next / Prev button clicks
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
      startAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
      startAutoPlay();
    });
  }

  // Pause on hover or touch
  const heroSection = slider.closest('.hero-section') || slider;
  heroSection.addEventListener('mouseenter', stopAutoPlay);
  heroSection.addEventListener('mouseleave', startAutoPlay);
  heroSection.addEventListener('touchstart', stopAutoPlay, { passive: true });
  heroSection.addEventListener('touchend', startAutoPlay, { passive: true });

  // Initialize first slide and start auto-advance
  showSlide(0);
  startAutoPlay();
}

/* --------------------------------------------------------------------------
   SCROLL-TRIGGERED REVEAL ANIMATIONS
   - IntersectionObserver triggers smooth reveals when scrolling down
   - Staggered and performant
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');
  if (animatedElements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: make immediately visible
    animatedElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  animatedElements.forEach(el => {
    observer.observe(el);
  });
}

