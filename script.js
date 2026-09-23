(() => {
  document.documentElement.classList.add('js');
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const sections = [...document.querySelectorAll('[data-scene]')].filter(
    (element) => element.tagName === 'SECTION'
  );
  const revealItems = document.querySelectorAll('.reveal');
  const navLinks = [...document.querySelectorAll('[data-nav] a[href^="#"]')];
  const menuButton = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-nav]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const desktopNavigation = window.matchMedia('(min-width: 861px)');

  const setMenu = (open, restoreFocus = false) => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
    nav.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    if (open) {
      window.requestAnimationFrame(() => nav.querySelector('a')?.focus());
    } else if (restoreFocus) {
      menuButton.focus();
    }
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    const menuOpen = menuButton?.getAttribute('aria-expanded') === 'true';
    if (event.key === 'Escape' && menuOpen) {
      setMenu(false, true);
      return;
    }
    if (event.key === 'Tab' && menuOpen && menuButton && nav) {
      const focusable = [menuButton, ...nav.querySelectorAll('a')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const resetDesktopMenu = (event) => {
    if (event.matches) setMenu(false);
  };
  desktopNavigation.addEventListener?.('change', resetDesktopMenu);

  window.addEventListener(
    'scroll',
    () => header?.classList.toggle('is-scrolled', window.scrollY > 20),
    { passive: true }
  );

  const updateScene = (section) => {
    body.dataset.scene = section.dataset.scene || 'hero';
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${section.id}`;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: reducedMotion ? 0 : 0.14, rootMargin: '0px 0px -7% 0px' }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    const sceneObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) updateScene(visible[0].target);
      },
      { threshold: [0.25, 0.45, 0.65], rootMargin: '-18% 0px -35% 0px' }
    );

    sections.forEach((section) => sceneObserver.observe(section));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const portrait = document.querySelector('.portrait-image');
  const portraitFrame = document.querySelector('[data-portrait-frame]');

  const handlePortraitError = () => {
    if (!portrait) return;
    const remoteSource = portrait.dataset.remoteSrc;
    if (remoteSource && portrait.dataset.remoteAttempted !== 'true') {
      portrait.dataset.remoteAttempted = 'true';
      portrait.src = remoteSource;
      return;
    }
    portraitFrame?.classList.add('is-fallback');
  };

  portrait?.addEventListener('error', handlePortraitError);
  if (portrait?.complete && portrait.naturalWidth === 0) handlePortraitError();
})();
