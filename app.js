/* The tangram engine, shared by every page.
   Each page carries its own static copy and names its figure on <body data-fig="…" data-shape="…">,
   so this file only draws, animates and wires the pieces — it never writes the page text. */
(() => {
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* =========================================================
   EVENT DATES
   ========================================================= */
// The event dates. The same dates are typed into each page's <head>, the header chip and the home
// facts list, which JavaScript can't rewrite — verifyEvent() checks those against this object and
// names any that are stale.
const EVENT = { date: '2027-01-23', regDue: '2027-01-08' };
const pretty = iso => {
  const d = new Date(iso + 'T12:00:00');
  return {
    long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    chip: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(', ', ' · ') + ' · ' + iso.slice(0, 4)
  };
};
const onDay = pretty(EVENT.date), dueDay = pretty(EVENT.regDue);

// Only checks what this page actually has: the four interior pages carry no JSON-LD and no facts list.
function verifyEvent() {
  const bad = [];
  const meta = s => { const el = $(s); return el ? el.content : ''; };
  const dd = $$('.facts dd');
  const ldEl = $('script[type="application/ld+json"]');
  const ld = ldEl ? JSON.parse(ldEl.textContent) : null;
  const chk = (what, ok) => { if (!ok) bad.push(what); };
  const desc = meta('meta[name="description"]'), ogDesc = meta('meta[property="og:description"]');
  if (desc) chk('meta description', desc.includes(onDay.long));
  if (ogDesc) chk('og:description', ogDesc.includes(onDay.long));
  chk('og:image:alt (the year must come out of it)', !/\d{4}/.test(meta('meta[property="og:image:alt"]')));
  if (ld) {
    chk('JSON-LD name', ld.name.includes(EVENT.date.slice(0, 4)));
    chk('JSON-LD description', ld.description.includes(dueDay.long));
    chk('JSON-LD startDate', ld.startDate.startsWith(EVENT.date));
    chk('JSON-LD endDate', ld.endDate.startsWith(EVENT.date));
  }
  const when = $('.when');
  if (when) chk('header date chip', when.textContent.trim() === onDay.chip);
  if (dd.length) {
    chk('home facts "When"', dd[0].textContent.includes(onDay.long));
    chk('home facts "Register by"', dd[1].textContent.includes(dueDay.long));
  }
  if (bad.length) console.warn(`JCMT: EVENT is set to ${EVENT.date}. These still need changing by hand:`, bad);
}

/* =========================================================
   TANGRAM ENGINE
   ========================================================= */
const E = {
  inOut: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  out: p => 1 - Math.pow(1 - p, 3),
  back: p => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
};
const tweens = [];
const tween = o => { o.t0 = performance.now() + (reduce ? 0 : (o.delay || 0)); tweens.push(o); };
function stepTweens(now) {
  const finished = [];                                  // a done callback may empty `tweens`
  for (let i = tweens.length - 1; i >= 0; i--) {         // (finishIntro does), so collect them
    const o = tweens[i], d = reduce ? 0 : o.dur;         // and run them after the walk
    if (now < o.t0) continue;
    const p = d ? Math.min(1, (now - o.t0) / d) : 1;
    o.set(o.from + (o.to - o.from) * (o.ease || E.inOut)(p), p);
    if (p >= 1) { tweens.splice(i, 1); if (o.done) finished.push(o); }
  }
  finished.forEach(o => o.done());
}

const svg = $('.stage svg'), gS = $('#shadows'), gP = $('#pieces'), copy = $('.copy'), copyIn = $('.copy-in'), nav = $('.nav');
const NS = 'http://www.w3.org/2000/svg';
if (!window.JCMT_TANGRAM) throw new Error('tangram.js failed to load');
const { IDS, COL, TYPE, RAW } = window.JCMT_TANGRAM;
const A2 = v => { let s = 0; for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; };
const cen = v => [v.reduce((s, p) => s + p[0], 0) / v.length, v.reduce((s, p) => s + p[1], 0) / v.length];
function centerFig(f) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  IDS.forEach(id => f[id].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return Object.fromEntries(IDS.map(id => [id, f[id].map(([x, y]) => [x - mx, y - my])]));
}
function norm(type, v) {
  v = v.map(p => p.slice());
  if (type !== 'pg' && A2(v) < 0) v.reverse();
  const rot = i => v.slice(i).concat(v.slice(0, i));
  if (type === 'tri') for (let i = 0; i < 3; i++) {
    const p = v[i], a = v[(i + 1) % 3], b = v[(i + 2) % 3];
    if (Math.abs((a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1])) < 1e-6) { v = rot(i); break; }
  }
  if (type === 'pg') { const L = i => Math.hypot(v[(i + 1) % 4][0] - v[i][0], v[(i + 1) % 4][1] - v[i][1]); if (L(0) > L(1) + 1e-6) v = rot(1); }
  return v;
}
const FIG = Object.fromEntries(Object.keys(RAW).map(k => [k, centerFig(RAW[k])]));
const BASE = Object.fromEntries(IDS.map(id => { const v = norm(TYPE[id], RAW.house[id]), c = cen(v); return [id, v.map(([x, y]) => [x - c[0], y - c[1]])]; }));
function pose(id, target) {
  const tv = norm(TYPE[id], target); let b = BASE[id], s = 1;
  if (TYPE[id] === 'pg' && Math.sign(A2(b)) !== Math.sign(A2(tv))) { s = -1; b = b.map(([x, y]) => [-x, y]); }
  const a1 = Math.atan2(b[1][1] - b[0][1], b[1][0] - b[0][0]), a2 = Math.atan2(tv[1][1] - tv[0][1], tv[1][0] - tv[0][0]);
  const c = cen(tv);
  return { x: c[0], y: c[1], r: (a2 - a1) * 180 / Math.PI, s };
}
const POSE = Object.fromEntries(Object.keys(FIG).map(f => [f, Object.fromEntries(IDS.map(id => [id, pose(id, FIG[f][id])]))]));

// The figure this page shows, named on <body>. Unknown values fall back to the square. The pair is
// reassigned when a navigation is upgraded to an in-place page change (see enhanceNavigation).
let fig = document.body.dataset.fig;
// One place to change the figure, its spoken description, and the body attributes that record them.
function setFigure(name, label) {
  fig = POSE[name] ? name : 'square';
  label = label || 'a square';
  document.body.dataset.fig = fig;
  document.body.dataset.shape = label;
  svg.setAttribute('aria-label', `Seven tangram pieces arranged as ${label}`);
}
setFigure(fig, document.body.dataset.shape);

const P = {};
IDS.forEach(id => {
  const pts = BASE[id].map(p => p.map(n => +n.toFixed(4)).join(',')).join(' ');
  const sh = document.createElementNS(NS, 'polygon'); sh.setAttribute('points', pts); sh.setAttribute('class', 'shp'); gS.appendChild(sh);
  const pg = document.createElementNS(NS, 'polygon'); pg.setAttribute('points', pts); pg.setAttribute('class', 'pc'); pg.setAttribute('fill', COL[id]); pg.dataset.id = id; gP.appendChild(pg);
  P[id] = { sh, pg, x: (Math.random() * 2 - 1) * 2.9, y: (Math.random() * 2 - 1) * 2, r: Math.random() * 360, s: 1, lift: 0 };
});

let breathe = 0, breatheOn = false, dragP = null, camX = 0, camY = 0;
function draw(t) {
  breathe += ((breatheOn && !reduce ? 1 : 0) - breathe) * .06;
  const br = breathe * (.5 - .5 * Math.cos(t * 1.3)) * .045;
  IDS.forEach(id => {
    const p = P[id], bx = p.x * (1 + br) + camX, by = p.y * (1 + br) + camY, sc = 1 + p.lift * .07, o = .05 + p.lift * .2;
    p.pg.setAttribute('transform', `translate(${bx.toFixed(4)} ${by.toFixed(4)}) rotate(${p.r.toFixed(3)}) scale(${(p.s * sc).toFixed(4)} ${sc.toFixed(4)})`);
    p.sh.setAttribute('transform', `translate(${(bx + o).toFixed(4)} ${(by + o * 1.3).toFixed(4)}) rotate(${p.r.toFixed(3)}) scale(${p.s.toFixed(4)} 1)`);
  });
}
function morph(figName, onDone) {
  breatheOn = false;
  IDS.forEach((id, j) => {
    const p = P[id], q = POSE[figName][id];
    const fx = p.x, fy = p.y, fr = p.r, fs = p.s, dr = ((q.r - p.r) % 360 + 540) % 360 - 180;
    tween({ from: 0, to: 1, dur: 950, delay: j * 70,
      set: (v, pp) => { p.x = fx + (q.x - fx) * v; p.y = fy + (q.y - fy) * v; p.r = fr + dr * v; p.s = fs + (q.s - fs) * v; p.lift = Math.sin(Math.PI * pp); },
      done: j === IDS.length - 1 ? () => { breatheOn = true; if (onDone) onDone(); } : null });
  });
}
// Line-by-line fade-and-lift for the copy, so arriving on a page looks the same however you got
// there. `fill:'backwards'` matters: without it each child would sit visible through its own delay
// and pop rather than reveal.
function revealCopy() {
  if (!copyIn || reduce) return;   // reduced motion: the text is simply already there
  const ins = Array.from(copyIn.children).map((el, i) => el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 440, delay: 60 + i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
  // Never leave the text hidden if the browser pauses animations (background tabs, battery saver).
  setTimeout(() => ins.forEach(a => a.finish()), 1300);
}

// The nav links are static so they work without JavaScript; the little tangram glyphs are decoration.
if (nav) $$('a', nav).forEach(a => {
  const f = FIG[a.dataset.fig]; if (!f) return;
  a.insertAdjacentHTML('afterbegin', `<svg viewBox="-2.7 -2.25 5.4 4.5" aria-hidden="true">${IDS.map(id => `<polygon points="${f[id].map(p => p.map(n => +n.toFixed(3)).join(',')).join(' ')}"/>`).join('')}</svg>`);
});

/* Opening animation, home page only. Nothing else is on screen while it plays: the pieces start
   scattered across the whole viewport, gather into the square at the centre of the screen, then
   slide into place in the stage, at which point the frame fades back in and the copy reveals line by
   line. `camX/camY` is a camera offset added to every piece in draw(), which lets the square form
   anywhere on screen and still settle at the origin in the end. The stacked layout has no "side" to
   slide to, so it converges in place and skips the slide. */
let introActive = document.documentElement.classList.contains('intro');
function runIntro() {
  const centre = toSvgPt(innerWidth / 2, innerHeight / 2);
  const stacked = innerWidth <= 780;
  camX = stacked ? 0 : centre.x;
  camY = stacked ? 0 : centre.y;
  const a = toSvgPt(0, 0), b = toSvgPt(innerWidth, innerHeight);
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const mx = (x1 - x0) * .18, my = (y1 - y0) * .18;   // let a few pieces start just off-screen
  IDS.forEach(id => {
    const p = P[id];
    p.x = x0 - mx + Math.random() * (x1 - x0 + 2 * mx) - camX;
    p.y = y0 - my + Math.random() * (y1 - y0 + 2 * my) - camY;
    p.r = Math.random() * 360; p.s = 1; p.lift = 0;
  });
  try { sessionStorage.setItem('jcmt-intro-seen', '1'); } catch (e) {}
  setTimeout(() => morph('square', () => {
    if (!introActive) return;
    if (stacked) { finishIntro(); return; }
    tween({ from: 0, to: 1, dur: 650, ease: E.inOut,
      set: v => { camX = centre.x * (1 - v); camY = centre.y * (1 - v); },
      done: () => finishIntro() });
  }), 250);
}
function finishIntro() {
  if (!introActive) return;
  introActive = false;
  tweens.length = 0;                                  // on a cold load only the intro is in flight
  IDS.forEach(id => { const p = P[id], q = POSE.square[id]; p.x = q.x; p.y = q.y; p.r = q.r; p.s = q.s; p.lift = 0; });
  camX = 0; camY = 0; breatheOn = true;
  // Removing the class fades the frame back in; the copy gets its own reveal, the same one a page
  // change uses, rather than a fade that would race it.
  document.documentElement.classList.remove('intro');
  revealCopy();
}

// Only a deliberate keypress or click skips it - not a scroll, which a trackpad nudge can fire.
['keydown', 'click'].forEach(ev => window.addEventListener(ev, () => finishIntro(), { passive: true, once: true }));

$('.fix').addEventListener('click', () => { if (introActive) { finishIntro(); return; } morph(fig); });

/* drag a piece, tap to turn it */
function toSvgPt(x, y) { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const m = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: m.x, y: m.y }; }
const toSvg = e => toSvgPt(e.clientX, e.clientY);
gP.addEventListener('pointerdown', e => {
  if (introActive) { finishIntro(); return; }
  const id = e.target.dataset && e.target.dataset.id; if (!id) return;
  e.preventDefault();
  const p = P[id]; gS.appendChild(p.sh); gP.appendChild(p.pg);
  const m = toSvg(e); breatheOn = false; breathe = 0;
  dragP = { id, dx: p.x - m.x, dy: p.y - m.y, moved: 0 };
  p.lift = 1; e.target.setPointerCapture(e.pointerId);
});
gP.addEventListener('pointermove', e => {
  if (!dragP) return;
  const m = toSvg(e), p = P[dragP.id], nx = m.x + dragP.dx, ny = m.y + dragP.dy;
  dragP.moved += Math.abs(nx - p.x) + Math.abs(ny - p.y);
  p.x = nx; p.y = ny;
});
const endDrag = () => {
  if (!dragP) return;
  const p = P[dragP.id];
  if (dragP.moved < .05) { const r0 = p.r; tween({ from: 0, to: 1, dur: 380, ease: E.back, set: v => p.r = r0 + 45 * v }); }
  tween({ from: 1, to: 0, dur: 260, ease: E.out, set: v => p.lift = v });
  dragP = null;
};
gP.addEventListener('pointerup', endDrag);
gP.addEventListener('pointercancel', endDrag);

/* ---------- in-place navigation ----------
   The five pages are ordinary documents so crawlers, link previews and visitors without JavaScript
   get a real page at a real URL. This upgrades a plain left-click on one of them: it fetches the
   target document, fades the copy, swaps it, updates the address bar and morphs the pieces — the
   way the site behaved when it was a single page. Anything unexpected (no `fetch`, an offline
   visitor, a modified click, a link that isn't one of the five) falls through to a normal page
   load, and the link keeps working. */
function enhanceNavigation() {
  if (!nav || !copyIn || !window.fetch || !window.DOMParser || !history.pushState) return;

  const norm = p => p.replace(/\/index\.html$/, '/');
  const here = () => norm(location.pathname);
  const routes = new Map();                 // pathname -> { anchor, href }
  $$('a', nav).forEach(a => {
    try {
      const u = new URL(a.getAttribute('href'), location.href);
      routes.set(norm(u.pathname), { a, href: u.href });
    } catch (e) {}
  });
  if (!routes.size) return;

  const cache = new Map();                  // pathname -> page record
  let seq = 0;                              // bumps on every navigation; stale swaps bail out

  const record = () => ({
    html: copyIn.innerHTML, title: document.title,
    acc: document.documentElement.style.getPropertyValue('--acc'),
    fig, shape: document.body.dataset.shape
  });
  cache.set(here(), record());

  const load = async href => {
    const res = await fetch(href, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const col = doc.querySelector('.copy-in'), body = doc.body;
    if (!col || !body) throw new Error('not one of our pages');
    return {
      html: col.innerHTML, title: doc.title,
      acc: doc.documentElement.style.getPropertyValue('--acc'),
      fig: body.dataset.fig || 'square', shape: body.dataset.shape || 'a square'
    };
  };

  // The five nav anchors are static, so the current one is marked here rather than in the markup.
  function markCurrent() {
    const h = here();
    routes.forEach((r, path) => {
      if (path === h) r.a.setAttribute('aria-current', 'page');
      else r.a.removeAttribute('aria-current');
    });
  }

  function apply(rec, path, push, mine) {
    setFigure(rec.fig, rec.shape);          // the pieces start moving straight away
    morph(fig);
    let out = null;
    const commit = () => {
      if (mine !== seq) return;             // a newer navigation won
      if (out) out.cancel();
      copyIn.innerHTML = rec.html;
      if (copy) copy.scrollTop = 0;
      document.title = rec.title;
      if (rec.acc) document.documentElement.style.setProperty('--acc', rec.acc);
      if (push) { try { history.pushState({ path }, '', path); } catch (e) {} }
      markCurrent();
      revealCopy();
    };
    if (reduce) { commit(); return; }
    out = copyIn.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' });
    out.onfinish = commit;
    setTimeout(commit, 260);                // in case the animation is paused in a background tab
  }

  async function go(href, path, push) {
    const mine = ++seq;
    let rec = cache.get(path);
    if (!rec) {
      try { rec = await load(href); } catch (e) { location.assign(href); return; }
      if (mine !== seq) return;
      cache.set(path, rec);
    }
    apply(rec, path, push, mine);
  }

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    if (u.origin !== location.origin || u.hash) return;
    const path = norm(u.pathname), route = routes.get(path);
    if (!route) return;
    e.preventDefault();
    if (introActive) finishIntro();
    if (path === here()) { morph(fig); return; }     // already here: just re-form the figure
    go(route.href, path, true).catch(() => location.assign(route.href));
  });

  window.addEventListener('popstate', () => {
    const path = here(), route = routes.get(path);
    if (!route) return;
    const rec = cache.get(path);
    if (rec) { apply(rec, path, false, ++seq); return; }
    load(route.href).then(r => { cache.set(path, r); apply(r, path, false, ++seq); },
                         () => location.reload());
  });

  // Warm the other four pages while the browser is idle, so the first click morphs immediately.
  const warm = () => routes.forEach((r, path) => {
    if (path === here() || cache.has(path)) return;
    load(r.href).then(rec => cache.set(path, rec), () => {});
  });
  if (window.requestIdleCallback) window.requestIdleCallback(warm, { timeout: 3000 });
  else setTimeout(warm, 1500);
}

function loop(now) { stepTweens(now); draw(now / 1000); requestAnimationFrame(loop); }
draw(0);
if (introActive) { runIntro(); }
else { revealCopy(); setTimeout(() => morph(fig), reduce ? 0 : 250); }
verifyEvent();
enhanceNavigation();
requestAnimationFrame(loop);
})();
