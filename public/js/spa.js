/**
 * Bourse Chamber — Unified Single-Page Continuous Landing & Scroll Controller (js/spa.js)
 * Enables smooth scrolling to any section from the header, updates active nav indicator (ScrollSpy),
 * and supports deep linking, instant ticker launching, and interactive verdict inspection.
 */

const BourseSPA = (() => {
  const VIEWS = ['hero', 'chamber', 'bench', 'ledger', 'verdict', 'method'];
  let currentView = 'hero';
  let isManualScrolling = false;
  let scrollTimeout = null;

  function init() {
    setupNavListeners();
    setupScrollSpy();
    setupHeroQuickInput();
    setupInitialHash();
  }

  function setupNavListeners() {
    // Handle all data-view clicks across navbars, buttons, tiles, and links
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-view]');
      if (!target) return;

      e.preventDefault();
      const viewName = target.getAttribute('data-view');
      const paramId = target.getAttribute('data-id');

      if (viewName === 'verdict' && paramId) {
        showVerdict(paramId);
      } else {
        scrollToView(viewName);
      }

      // Close mobile menu if open
      const navLinks = document.querySelector('.nav-links');
      if (navLinks && navLinks.classList.contains('mobile-active')) {
        navLinks.classList.remove('mobile-active');
      }
    });
  }

  function scrollToView(viewName, params = {}, updateHash = true) {
    if (!VIEWS.includes(viewName)) viewName = 'hero';
    currentView = viewName;

    // View-specific actions before/during scroll
    if (viewName === 'chamber' && params.q) {
      const chamberInput = document.getElementById('composer-input');
      if (chamberInput) {
        chamberInput.value = params.q;
        chamberInput.focus();
      }
    } else if (viewName === 'verdict') {
      if (typeof BourseVerdict !== 'undefined' && BourseVerdict.loadSession) {
        if (params.id) {
          BourseVerdict.loadSession(params.id);
        } else {
          const all = (typeof BourseStorage !== 'undefined') ? BourseStorage.getSessions() : [];
          if (all && all.length > 0) {
            BourseVerdict.loadSession(all[0].id);
          }
        }
      }
    }

    const targetEl = document.getElementById(`view-${viewName}`);
    if (!targetEl) return;

    // Temporarily lock scrollspy so auto scroll doesn't jitter active button
    isManualScrolling = true;
    updateActiveNav(viewName);

    if (viewName === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const header = document.querySelector('header.site-header');
      const headerHeight = header ? header.offsetHeight : 56;
      const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    }

    if (updateHash && history.pushState) {
      let hashStr = `#${viewName}`;
      if (params.id) hashStr += `?id=${params.id}`;
      else if (params.q) hashStr += `?q=${encodeURIComponent(params.q)}`;
      if (window.location.hash !== hashStr) {
        history.pushState(null, '', hashStr);
      }
    }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isManualScrolling = false;
    }, 750);
  }

  function updateActiveNav(activeView) {
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
      const v = link.getAttribute('data-view');
      if (v === activeView) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function setupScrollSpy() {
    let ticking = false;

    function checkPosition() {
      if (isManualScrolling) return;

      const scrollPos = window.scrollY;
      const header = document.querySelector('header.site-header');
      const headerOffset = (header ? header.offsetHeight : 56) + 120;

      // Check if near bottom of page -> activate last section
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 60) {
        updateActiveNav('method');
        currentView = 'method';
        return;
      }

      // Check sections from bottom to top
      let detectedView = 'hero';
      for (let i = VIEWS.length - 1; i >= 0; i--) {
        const v = VIEWS[i];
        const el = document.getElementById(`view-${v}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos + headerOffset >= top) {
            detectedView = v;
            break;
          }
        }
      }

      if (detectedView !== currentView) {
        currentView = detectedView;
        updateActiveNav(detectedView);
      }
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkPosition();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    checkPosition();
  }

  function setupInitialHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const [viewPart, queryPart] = hash.split('?');
    const viewName = viewPart.toLowerCase();

    if (VIEWS.includes(viewName)) {
      const params = {};
      if (queryPart) {
        const qParams = new URLSearchParams(queryPart);
        if (qParams.get('id')) params.id = qParams.get('id');
        if (qParams.get('q')) params.q = qParams.get('q');
      }
      setTimeout(() => {
        scrollToView(viewName, params, false);
      }, 200);
    }
  }

  function setupHeroQuickInput() {
    const quickInput = document.getElementById('hero-quick-input');
    const quickBtn = document.getElementById('hero-quick-btn');

    function submitQuick() {
      if (!quickInput) return;
      const val = quickInput.value.trim();
      if (!val) {
        if (typeof BourseUtils !== 'undefined') BourseUtils.showToast('Please enter an asset ticker or thesis.');
        return;
      }

      scrollToView('chamber', { q: val });
      quickInput.value = '';
    }

    if (quickBtn) quickBtn.addEventListener('click', submitQuick);
    if (quickInput) {
      quickInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitQuick();
        }
      });
    }
  }

  function showVerdict(id) {
    scrollToView('verdict', { id });
  }

  return {
    init,
    scrollToView,
    switchView: scrollToView, // backward compatibility
    showVerdict,
    getCurrentView: () => currentView
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  BourseSPA.init();
  window.BourseSPA = BourseSPA;
});
