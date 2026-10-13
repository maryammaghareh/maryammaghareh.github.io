/* Progressive enhancement: the document and its links work without this file. */
(() => {
  'use strict';
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('[data-progress]');
  const sections = [...document.querySelectorAll('main > section[id]')];
  const navLinks = [...document.querySelectorAll('.site-nav a, .brand')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let stickyHeight = header ? header.getBoundingClientRect().height : 0;
  let navFrame = 0;

  function updateNavigation() {
    navFrame = 0;
    const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
    const position = clamp(window.scrollY, 0, scrollable);
    const probe = stickyHeight + 44;
    const thresholds = sections.map(section => Math.max(0, section.getBoundingClientRect().top + window.scrollY - probe));

    // On tall screens the last section can be shorter than the remaining viewport.
    // Compress only unreachable thresholds so every section can still activate.
    const unreachable = thresholds.findIndex(point => point > scrollable);
    if (unreachable !== -1) {
      let start = Math.max(0, unreachable - 1);
      const minStep = Math.min(150, Math.max(70, (window.innerHeight - stickyHeight) * .12));
      while (start > 0 && scrollable - thresholds[start] < (thresholds.length - 1 - start) * minStep) start--;
      const first = thresholds[start];
      const span = thresholds[thresholds.length - 1] - first;
      if (span > 0) {
        for (let i = start + 1; i < thresholds.length; i++) {
          thresholds[i] = first + (thresholds[i] - first) / span * (scrollable - first);
        }
      }
    }
    let active = sections[0];
    thresholds.forEach((point, index) => { if (point <= position + 2) active = sections[index]; });
    navLinks.forEach(link => {
      if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (progress) progress.style.transform = `scaleX(${position / scrollable})`;
  }

  function requestNavigation() {
    if (!navFrame) navFrame = window.requestAnimationFrame(updateNavigation);
  }

  function measureHeader() {
    stickyHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    root.style.setProperty('--header-height', `${stickyHeight}px`);
    requestNavigation();
  }

  window.addEventListener('scroll', requestNavigation, {passive: true});
  window.addEventListener('resize', measureHeader, {passive: true});
  window.addEventListener('load', measureHeader);
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', requestNavigation));
  if ('ResizeObserver' in window) {
    try { new ResizeObserver(measureHeader).observe(header); } catch (_) { /* Resize listener is the fallback. */ }
  }
  measureHeader();

  // Native buttons with the WAI-ARIA tab keyboard model; there is no autoplay.
  const atlas = document.querySelector('[data-atlas]');
  const tablist = document.querySelector('.atlas-tabs');
  const tabs = [...document.querySelectorAll('[data-lens]')];
  const panels = [...document.querySelectorAll('.atlas-panel')];
  const motionButton = document.querySelector('[data-motion]');
  const motionLabel = document.querySelector('[data-motion-label]');
  let motionRequested = !reduceMotion.matches;
  let atlasInView = true;
  let printing = false;

  function syncMotion() {
    if (!atlas || !motionButton) return;
    const playing = motionRequested && !reduceMotion.matches;
    atlas.classList.toggle('is-playing', playing && atlasInView && !document.hidden && !printing);
    motionButton.setAttribute('aria-pressed', String(playing));
    motionButton.disabled = reduceMotion.matches;
    motionLabel.textContent = reduceMotion.matches ? 'Motion reduced' : (playing ? 'Pause motion' : 'Play motion');
  }

  function selectLens(tab, focus = false) {
    const panelId = tab.getAttribute('aria-controls');
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== panelId; });
    if (focus) tab.focus();
  }

  if (atlas && tablist && tabs.length === panels.length) {
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectLens(tab));
      tab.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectLens(tabs[next], true);
      });
    });
    tablist.hidden = false;
    motionButton.hidden = false;
    motionButton.addEventListener('click', () => { motionRequested = !motionRequested; syncMotion(); });
    document.addEventListener('visibilitychange', syncMotion);
    if ('IntersectionObserver' in window) {
      try {
        const atlasObserver = new IntersectionObserver(entries => {
          atlasInView = entries.some(entry => entry.isIntersecting);
          syncMotion();
        }, {threshold: 0});
        atlasObserver.observe(atlas);
      } catch (_) { /* Artwork remains usable if visibility observation fails. */ }
    }
    syncMotion();
  }

  // Elements are visible in the base CSS. Reveal is a finite, optional effect;
  // a script/observer failure can never strand content at opacity: 0.
  const activeReveals = new Set();
  let revealObserver;
  if ('IntersectionObserver' in window) {
    try {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          revealObserver.unobserve(entry.target);
          if (reduceMotion.matches || !entry.target.animate || printing) return;
          try {
            const animation = entry.target.animate(
              [{opacity: .25, transform: 'translateY(16px)'}, {opacity: 1, transform: 'translateY(0)'}],
              {duration: 560, easing: 'cubic-bezier(.2,.6,.25,1)', fill: 'none'}
            );
            activeReveals.add(animation);
            animation.onfinish = animation.oncancel = () => activeReveals.delete(animation);
          } catch (_) { /* The original, visible element is the fallback. */ }
        });
      }, {threshold: 0, rootMargin: '0px 0px -30px 0px'});
      document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
    } catch (_) { /* Leave content visible. */ }
  }

  function cancelReveals() {
    activeReveals.forEach(animation => animation.cancel());
    activeReveals.clear();
  }

  function motionPreferenceChanged() {
    if (reduceMotion.matches) cancelReveals();
    syncMotion();
  }
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionPreferenceChanged);
  else if (reduceMotion.addListener) reduceMotion.addListener(motionPreferenceChanged);
  window.addEventListener('beforeprint', () => { printing = true; cancelReveals(); syncMotion(); });
  window.addEventListener('afterprint', () => { printing = false; syncMotion(); });
})();
