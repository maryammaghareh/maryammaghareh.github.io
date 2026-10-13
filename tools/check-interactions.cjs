/* Interaction logic checks. This is a DOM simulation, not a browser renderer. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

class Element {
  constructor(id = '') {
    this.id = id; this.attrs = {}; this.events = {}; this.hidden = false;
    this.style = {setProperty(key, value) { this[key] = value; }};
    this.rect = {top: 0, height: 100};
    const classes = new Set();
    this.classList = {contains: name => classes.has(name), toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)};
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(name, handler) { (this.events[name] ??= []).push(handler); }
  fire(name, event = {}) { for (const handler of this.events[name] || []) handler({target: this, ...event}); }
  getBoundingClientRect() { return this.rect; }
  focus() { this.focused = true; }
}

function boot({reduced = false, observers = true, failObservers = false, legacyMedia = false} = {}) {
  const document = new Element(), window = new Element(), media = new Element();
  media.matches = reduced;
  if (legacyMedia) { media.addListener = handler => (media.events.change ??= []).push(handler); media.addEventListener = undefined; }
  const root = new Element(); root.scrollHeight = 5200;
  document.documentElement = root; document.hidden = false;
  const sectionNames = ['home', 'research', 'path', 'publications', 'beyond', 'contact'];
  const sections = sectionNames.map((name, i) => { const e = new Element(name); e.rect.top = 84 + i * 820; return e; });
  const links = sectionNames.map(name => { const e = new Element(); e.hash = '#' + name; return e; });
  const tabs = ['brain', 'cell', 'delivery'].map((name, i) => {
    const e = new Element('tab-' + name); e.setAttribute('aria-controls', 'panel-' + name);
    e.setAttribute('aria-selected', String(i === 0)); e.tabIndex = i === 0 ? 0 : -1; return e;
  });
  const panels = ['brain', 'cell', 'delivery'].map((name, i) => { const e = new Element('panel-' + name); e.hidden = i !== 0; return e; });
  const selectors = Object.fromEntries(['[data-header]', '[data-progress]', '[data-atlas]', '.atlas-tabs', '[data-motion]', '[data-motion-label]'].map(name => [name, new Element()]));
  selectors['[data-header]'].rect.height = 84;
  selectors['.atlas-tabs'].hidden = selectors['[data-motion]'].hidden = true;
  const reveal = new Element(), detail = new Element();
  const all = {'main > section[id]': sections, '.site-nav a, .brand': links, 'details': [detail], '[data-lens]': tabs, '.atlas-panel': panels, '[data-reveal]': [reveal]};
  document.querySelector = name => { assert(name in selectors, `Unknown selector ${name}`); return selectors[name]; };
  document.querySelectorAll = name => { assert(name in all, `Unknown selector ${name}`); return all[name]; };
  const frames = new Map(); let frameId = 0;
  window.matchMedia = () => media; window.innerHeight = 900; window.scrollY = 0;
  window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  const observed = [];
  class Observer {
    constructor(callback) { if (failObservers) throw new Error('Observer unavailable'); this.callback = callback; this.targets = []; observed.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve(target) { this.targets = this.targets.filter(item => item !== target); }
  }
  if (observers) window.IntersectionObserver = window.ResizeObserver = Observer;
  vm.runInNewContext(source, {window, document, IntersectionObserver: Observer, ResizeObserver: Observer});
  function flush() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); }
  flush();
  return {root, document, window, media, sections, links, tabs, panels, selectors, reveal, detail, observed, frames, flush};
}

const page = boot();
assert.equal(page.selectors['.atlas-tabs'].hidden, false);
assert.equal(page.selectors['[data-motion]'].hidden, false);
assert.equal(page.root.style['--header-height'], '84px');
assert.equal(page.links[0].attrs['aria-current'], 'location');
assert(page.selectors['[data-atlas]'].classList.contains('is-playing'));

function assertTab(page, expected) {
  assert.deepEqual(page.tabs.map(tab => tab.getAttribute('aria-selected')), [0, 1, 2].map(i => String(i === expected)));
  assert.deepEqual(page.tabs.map(tab => tab.tabIndex), [0, 1, 2].map(i => i === expected ? 0 : -1));
  assert.deepEqual(page.panels.map(panel => panel.hidden), [0, 1, 2].map(i => i !== expected));
}
page.tabs[2].fire('click'); assertTab(page, 2);
let prevented = false;
page.tabs[2].fire('keydown', {key: 'ArrowRight', preventDefault() { prevented = true; }});
assertTab(page, 0); assert(prevented); assert(page.tabs[0].focused);
for (const [index, key, target] of [[0, 'ArrowLeft', 2], [2, 'Home', 0], [0, 'End', 2], [2, 'ArrowLeft', 1]]) {
  page.tabs[index].fire('keydown', {key, preventDefault() {}}); assertTab(page, target);
}
page.tabs[1].fire('keydown', {key: 'Tab', preventDefault() { throw Error('Native Tab navigation was intercepted'); }});
console.log('PASS: research tabs support pointer, arrows, wrapping, Home/End, focus, and native Tab navigation.');

const atlas = page.selectors['[data-atlas]'];
const button = page.selectors['[data-motion]'];
button.fire('click'); assert(!atlas.classList.contains('is-playing'));
assert.equal(button.getAttribute('aria-pressed'), 'false');
assert.equal(page.selectors['[data-motion-label]'].textContent, 'Play motion');
button.fire('click'); assert(atlas.classList.contains('is-playing'));
page.document.hidden = true; page.document.fire('visibilitychange'); assert(!atlas.classList.contains('is-playing'));
page.document.hidden = false; page.document.fire('visibilitychange'); assert(atlas.classList.contains('is-playing'));
const atlasObserver = page.observed.find(observer => observer.targets.includes(atlas));
atlasObserver.callback([{isIntersecting: false}]); assert(!atlas.classList.contains('is-playing'));
atlasObserver.callback([{isIntersecting: true}]); assert(atlas.classList.contains('is-playing'));
page.window.fire('beforeprint'); assert(!atlas.classList.contains('is-playing'));
page.window.fire('afterprint'); assert(atlas.classList.contains('is-playing'));
button.fire('click');
page.document.hidden = true; page.document.fire('visibilitychange');
page.document.hidden = false; page.document.fire('visibilitychange');
assert(!atlas.classList.contains('is-playing'), 'User pause must survive visibility changes');
const reduced = boot({reduced: true, legacyMedia: true});
assert(!reduced.selectors['[data-atlas]'].classList.contains('is-playing'));
assert(reduced.selectors['[data-motion]'].disabled);
assert.equal(reduced.selectors['[data-motion-label]'].textContent, 'Motion reduced');
reduced.media.matches = false; reduced.media.fire('change');
assert(!reduced.selectors['[data-motion]'].disabled);
reduced.selectors['[data-motion]'].fire('click'); assert(reduced.selectors['[data-atlas]'].classList.contains('is-playing'));
console.log('PASS: play/pause, system reduced motion, offscreen suspension, hidden tabs, and printing.');

let cancelled = 0;
page.reveal.animate = () => ({cancel() { cancelled++; }});
const revealObserver = page.observed.find(observer => observer.targets.includes(page.reveal));
revealObserver.callback([{target: page.reveal, isIntersecting: true}]);
assert(!revealObserver.targets.includes(page.reveal));
page.media.matches = true; page.media.fire('change'); assert.equal(cancelled, 1);
assert(!atlas.classList.contains('is-playing'));
for (const options of [{observers: false}, {failObservers: true}]) {
  const fallback = boot(options);
  fallback.tabs[1].fire('click'); assertTab(fallback, 1);
  assert.equal(fallback.root.style['--header-height'], '84px');
}
page.selectors['[data-header]'].rect.height = 123;
page.window.fire('resize'); page.flush();
assert.equal(page.root.style['--header-height'], '123px');
page.detail.fire('toggle'); assert.equal(page.frames.size, 1); page.flush();
console.log('PASS: finite reveals, cancellation, unavailable observers, measured sticky offsets, and expanded details.');

for (const height of [700, 900, 1700, 2000]) {
  const p = boot();
  const starts = [84, 860, 1780, 2530, 3800, 4900];
  p.window.innerHeight = height; p.root.scrollHeight = 5600;
  const end = p.root.scrollHeight - height;
  function position(y) {
    p.window.scrollY = y;
    p.sections.forEach((section, i) => { section.rect.top = starts[i] - y; });
    p.window.fire('scroll'); p.flush();
    assert.equal(p.links.filter(link => link.attrs['aria-current']).length, 1);
    return p.links.find(link => link.attrs['aria-current']).hash.slice(1);
  }
  const down = [], up = [];
  for (let y = 0; y <= end; y = Math.min(end, y + 8)) {
    const id = position(y); if (down.at(-1) !== id) down.push(id); if (y === end) break;
  }
  assert.deepEqual(down, p.sections.map(section => section.id), `Skipped section at ${height}px`);
  assert.equal(p.selectors['[data-progress]'].style.transform, 'scaleX(1)');
  for (let y = end; y >= 0; y = Math.max(0, y - 8)) {
    const id = position(y); if (up.at(-1) !== id) up.push(id); if (y === 0) break;
  }
  assert.deepEqual(up, p.sections.map(section => section.id).reverse());
  assert.equal(p.selectors['[data-progress]'].style.transform, 'scaleX(0)');
}
console.log('PASS: all sections activate in order, in both scroll directions, at four viewport heights. These are geometry/DOM checks, not rendered browser tests.');
