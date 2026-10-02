// Digital Estate Roles viewer. Copied from the digital-estate-roles repo
// (site/app.js) with two changes: its own theme toggle is removed, because the
// Xebec masthead already owns document.documentElement.dataset.theme and two
// toggles writing different localStorage keys would fight over it.
//
// The data directory comes from data-base on the mount element, and the base for the
// static per-role pages from data-roles-base on it, because Astro bundles this as a
// module where document.currentScript is null. Every colour resolves through CSS
// variables defined in src/styles/der.css.

/* Digital Estate Roles — static renderer. No dependencies.
 * Data: data/manifest.json -> jurisdiction files (base roles + overlay patches) + adoption.json
 */
(() => {
  'use strict';

  const PHASES = ['capable', 'incapacitated', 'deceased', 'administration', 'closed'];
  const PHASE_LABEL = {
    capable: 'Capable',
    incapacitated: 'Incapacitated',
    deceased: 'Deceased',
    administration: 'Estate administration',
    closed: 'Estate closed',
  };
  // Column headings have only their own column's width. 'Estate administration' does not fit
  // one on a narrower page, and shrinking it alone to fit left it a quarter smaller than its
  // neighbours; the column is unambiguous without the noun, and tooltips keep the full name.
  const PHASE_HEAD = { ...PHASE_LABEL, administration: 'Administration' };
  const GROUPS = [
    ['financial', 'Financial'],
    ['health', 'Health care'],
    ['court', 'Court-appointed'],
    ['estate', 'Estate'],
    ['trust', 'Trust'],
    ['digital', 'Digital assets'],
    ['federal', 'National / federal'],
    ['remains', 'Remains & gifts'],
  ];
  const GROUP_LABEL = Object.fromEntries(GROUPS);
  const SVGNS = 'http://www.w3.org/2000/svg';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const trunc = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  // English glosses for local-language names (merged from research/translations by the build).
  const nameEn = (r) => (r.nameEn && r.nameEn.en) || '';
  const termEn = (r, term) => (r.localNamesEn && r.localNamesEn[term] && r.localNamesEn[term].en) || '';
  const basisNote = (g) => !g ? '' : g.basis === 'official'
    ? `official translation${g.citation ? ': ' + (g.citation.cite || g.citation.title || '') : ''}`
    : 'descriptive translation (no official English version located)';
  function glossHtml(g, cls = 'en-gloss') {
    if (!g || !g.en) return '';
    const link = g.citation && g.citation.url ? ` <a class="basis" href="${esc(g.citation.url)}" target="_blank" rel="noopener">official</a>` : (g.basis === 'descriptive' ? ' <span class="basis">descriptive</span>' : '');
    return `<span class="${cls}" title="${esc(basisNote(g))}">${esc(g.en)}${link}</span>`;
  }

  const state = {
    manifest: null,
    raw: {},          // file path -> json
    merged: {},       // jurisdiction id -> { id, name, roles[], citations Map, principalStates, note, overlay }
    adoption: null,
    world: null,      // locator-map geometry (data/world.json), or null if absent
    jur: 'us-model',
    chosen: false,    // has the reader actually picked a jurisdiction, or is this just the default?
    tab: 'map',
    role: null,
    hiddenGroups: new Set(),
  };

  // ---------- data ----------
  // Data lives beside the page in data/ by default; a deploy can point elsewhere via <script data-base="...">.
  // Astro bundles this as a module, where document.currentScript is null, so the
  // data directory is read from the mount element and the script tag is a fallback.
  const MOUNT = document.querySelector('[data-der]');
  const DATA_BASE = (MOUNT && MOUNT.dataset.base)
    || (document.currentScript && document.currentScript.dataset.base) || 'data/';
  // Static per-canonical pages live on the host that has them. A deploy opts in by setting
  // data-roles-base; where it is absent — irisar, which has no such pages — no link is drawn.
  const ROLES_BASE = (MOUNT && MOUNT.dataset.rolesBase)
    || (document.currentScript && document.currentScript.dataset.rolesBase) || '';
  async function getJSON(path) {
    const r = await fetch(DATA_BASE + path, { cache: 'no-cache' });
    if (!r.ok) throw new Error(path + ': HTTP ' + r.status);
    return r.json();
  }

  function addCitations(map, list, origin) {
    for (const c of list || []) {
      if (c && c.id && !map.has(c.id)) map.set(c.id, { ...c, origin });
    }
  }

  function normalizeRole(r) {
    r.lane = r.lane || {};
    r.lane.ends = Array.isArray(r.lane.ends) ? r.lane.ends : (r.lane.ends ? [r.lane.ends] : []);
    r.lane.activePhases = r.lane.activePhases || [];
    r.stateMachine = r.stateMachine || { states: [], transitions: [] };
    r.stateMachine.states = r.stateMachine.states || [];
    r.stateMachine.transitions = r.stateMachine.transitions || [];
    r.localNames = r.localNames || [];
    r.citations = r.citations || [];
    return r;
  }

  function buildBase(j) {
    const cites = new Map();
    const roles = [];
    let principalStates = null;
    const notes = [];
    for (const f of j.files) {
      const d = state.raw[f];
      if (!d) continue;
      addCitations(cites, d.citations, d.name || f);
      if (d.principalStates && !principalStates) principalStates = d.principalStates;
      if (d.note) notes.push(d.note);
      for (const r of d.roles || []) {
        const nr = normalizeRole({ ...clone(r), layer: d.jurisdiction });
        const i = roles.findIndex((x) => x.id === nr.id);
        if (i >= 0) roles[i] = nr; else roles.push(nr);
      }
    }
    return { id: j.id, name: j.name, roles, citations: cites, principalStates, note: j.note || notes.join(' '), overlay: null };
  }

  function mergeLane(dst, src) {
    if (!src) return;
    for (const k of Object.keys(src)) {
      if (k === 'ends') dst.ends = Array.isArray(src.ends) ? src.ends : [src.ends];
      else dst[k] = src[k];
    }
  }

  function applyOverlay(base, j) {
    const m = {
      id: j.id, name: j.name, roles: base.roles.map((r) => ({ ...clone(r), diff: null, patched: false, differs: false })),
      citations: new Map(base.citations), principalStates: base.principalStates, note: j.note || '', overlay: null,
      adopted: null,
    };
    for (const f of j.files) {
      const d = state.raw[f];
      if (!d) continue;
      m.overlay = d;
      if (d.uniformActsAdopted) m.adopted = d.uniformActsAdopted;
      addCitations(m.citations, d.citations, d.name || f);
      for (const p of d.patches || []) {
        let r = m.roles.find((x) => x.id === p.role);
        if (!r) {
          r = normalizeRole({ id: p.role, canonical: p.canonical || p.role, group: p.group || guessGroup(p.role), name: p.name || titleize(p.role), stateSpecific: true });
          m.roles.push(r);
        }
        r.patched = true;
        if (p.differs !== false) r.differs = true;
        if (p.name) r.name = p.name;
        if (p.group) r.group = p.group;
        if (p.summary) r.summary = p.summary;
        if (p.localNames) r.localNames = p.localNames;
        if (p.diff) r.diff = r.diff ? r.diff + ' ' + p.diff : p.diff;
        if (p.unverified) r.unverified = true;
        r.stateCitations = (r.stateCitations || []).concat(p.citations || []);
        mergeLane(r.lane, p.lane);
        if (p.states || (p.stateMachine && p.stateMachine.states)) {
          const sts = p.states || p.stateMachine.states;
          for (const s of sts) {
            const i = r.stateMachine.states.findIndex((x) => x.id === s.id);
            if (i >= 0) r.stateMachine.states[i] = { ...r.stateMachine.states[i], ...s };
            else r.stateMachine.states.push(s);
          }
        }
        const trs = p.transitions || (p.stateMachine && p.stateMachine.transitions) || [];
        for (const t of trs) {
          const i = r.stateMachine.transitions.findIndex((x) => x.id === t.id);
          if (t.remove) { if (i >= 0) r.stateMachine.transitions.splice(i, 1); continue; }
          if (i >= 0) r.stateMachine.transitions[i] = { ...r.stateMachine.transitions[i], ...t, patched: true };
          else r.stateMachine.transitions.push({ ...t, patched: true });
        }
        normalizeRole(r);
      }
    }
    // Ensure any state referenced by transitions exists.
    for (const r of m.roles) ensureStates(r);
    return m;
  }

  function ensureStates(r) {
    const ids = new Set(r.stateMachine.states.map((s) => s.id));
    for (const t of r.stateMachine.transitions) {
      for (const s of [t.from, t.to]) {
        if (s && !ids.has(s)) { r.stateMachine.states.push({ id: s, label: titleize(s) }); ids.add(s); }
      }
    }
  }

  function guessGroup(id) {
    if (/remains|disposition|anatomical/.test(id)) return 'remains';
    if (/poa|financial/.test(id)) return 'financial';
    if (/health|surrogate|proxy/.test(id)) return 'health';
    if (/guardian|conservator/.test(id)) return 'court';
    if (/trust/.test(id)) return 'trust';
    if (/digital|rufadaa/.test(id)) return 'digital';
    if (/hipaa|ssa|va-|irs/.test(id)) return 'federal';
    return 'estate';
  }
  function titleize(id) { return String(id).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

  async function load() {
    state.manifest = await getJSON('manifest.json');
    const files = new Set();
    for (const j of state.manifest.jurisdictions) j.files.forEach((f) => files.add(f));
    await Promise.all([...files].map(async (f) => {
      try { state.raw[f] = await getJSON(f); } catch (e) { console.warn('missing', f, e); }
    }));
    if (state.manifest.adoption) {
      try { state.adoption = await getJSON(state.manifest.adoption); } catch (e) { console.warn(e); }
    }
    if (state.manifest.features) {
      try { state.features = await getJSON(state.manifest.features); } catch (e) { console.warn(e); }
    }
    try { state.world = await getJSON('world.json'); } catch (e) { console.warn('no map geometry', e); }
    const bases = {};
    for (const j of state.manifest.jurisdictions) {
      if (!j.extends) { bases[j.id] = buildBase(j); state.merged[j.id] = bases[j.id]; }
    }
    for (const j of state.manifest.jurisdictions) {
      if (j.extends) state.merged[j.id] = applyOverlay(bases[j.extends], j);
    }
  }

  // ---------- citations ----------
  function cite(m, idOrObj) {
    if (!idOrObj) return null;
    if (typeof idOrObj === 'object') return idOrObj;
    return m.citations.get(idOrObj) || { id: idOrObj, cite: idOrObj, missing: true };
  }
  function citeText(m, ids) {
    return (ids || []).map((i) => cite(m, i)).filter(Boolean).map((c) => c.cite || c.title || c.id).join('; ');
  }
  function citeLinks(m, ids) {
    const cs = (ids || []).map((i) => cite(m, i)).filter(Boolean);
    if (!cs.length) return '<span class="muted">—</span>';
    return cs.map((c) => c.url
      ? `<a class="cite" href="${esc(c.url)}" target="_blank" rel="noopener" title="${esc(c.title || '')}">${esc(c.cite || c.title || c.id)}</a>`
      : `<span class="cite">${esc(c.cite || c.title || c.id)}</span>`).join('; ');
  }

  // ---------- routing ----------
  // The hash is the whole route: readHash derives state from it rather than layering
  // onto whatever was there, so going back to an earlier entry — or to no hash at
  // all — restores that view instead of leaving the last one on screen.
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const j = p.get('j');
    state.chosen = !!(j && state.merged[j]);
    state.jur = state.chosen ? j : 'us-model';
    state.tab = p.get('tab') || 'map';
    state.role = p.get('role') || null;
  }
  // Set by anything the reader did on purpose, so it earns a history entry; an
  // implicit render (boot, or the re-render that back/forward itself triggers)
  // replaces instead, or Back would have to be pressed twice to leave a view.
  let pushNext = false;
  function writeHash() {
    // On the map with nothing chosen there is nothing to say: the landing view
    // keeps a clean URL, and Back from a jurisdiction returns to exactly it.
    let h = '';
    if (state.chosen || state.tab !== 'map') {
      const p = new URLSearchParams();
      p.set('j', state.jur); p.set('tab', state.tab);
      if (state.role) p.set('role', state.role);
      h = '#' + p.toString();
    }
    if (location.hash === h) return;
    const url = location.pathname + location.search + h;
    if (pushNext) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
    pushNext = false;
  }
  function syncPicker() {
    const sel = $('#jur');
    if (sel) sel.value = state.chosen ? state.jur : '';
  }

  // ---------- chrome ----------
  function renderChrome() {
    const sel = $('#jur');
    const countries = state.manifest.countries || [{ name: 'Jurisdictions', jurisdictions: state.manifest.jurisdictions }];
    // Group the picker by region, not by country: nine countries hold a single
    // jurisdiction, and those made optgroups with one identically named option in them.
    // The build orders countries by region then name, and labels each jurisdiction
    // with its country, so the order here is the order it supplies.
    const byRegion = [];
    for (const c of countries) {
      const region = c.region || 'Other';
      let g = byRegion.find((x) => x.region === region);
      if (!g) byRegion.push((g = { region, items: [] }));
      for (const j of c.jurisdictions) g.items.push(j);
    }
    // Until the reader picks one, the picker said "US — uniform/model law + federal",
    // which asserts a choice nobody made. It holds a placeholder instead.
    sel.innerHTML = '<option value="" disabled>Choose a jurisdiction…</option>'
      + byRegion.map((g) => `<optgroup label="${esc(g.region)}">${
        g.items.map((j) => `<option value="${esc(j.id)}">${esc(j.label || j.name)}</option>`).join('')}</optgroup>`).join('');
    syncPicker();
    sel.onchange = () => {
      if (!sel.value) return;
      pushNext = true;
      state.jur = sel.value;
      state.chosen = true;
      if (state.tab === 'map') state.tab = 'lanes';  // changing it means "show me that one"
      render();
    };
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.onclick = () => { pushNext = true; state.tab = b.dataset.tab; render(); };
    });
  }

  function render() {
    const m = state.merged[state.jur];
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === state.tab)));
    document.querySelectorAll('.tab').forEach((s) => { s.hidden = s.id !== 'tab-' + state.tab; });
    const j = state.manifest.jurisdictions.find((x) => x.id === state.jur);
    $('#jur-note').textContent = m.note || j.note || '';
    $('#jur-note').hidden = state.tab === 'map' || state.tab === 'findings';
    if (state.tab === 'map') renderMap();
    if (state.tab === 'lanes') renderLanes(m);
    if (state.tab === 'role') renderRole(m);
    if (state.tab === 'compare') renderCompare();
    if (state.tab === 'trends') renderTrends();
    if (state.tab === 'findings') renderFindings();
    if (state.tab === 'sources') renderSources(m);
    writeHash();
  }

  // ---------- map ----------
  // A locator map, not an atlas. The geometry is Natural Earth 110m, projected
  // equirectangular by scripts/make-world.py into data/world.json; coordinates are
  // tenths of a degree. It answers one question — which countries are covered — and
  // opens one. Everything it draws uses tokens the stylesheet already defines, so
  // the Xebec copy inherits its palette and gains no colour of its own.

  // Bounding box of a run of "x,y" integers, in viewBox units.
  function pathExtent(d) {
    const n = d.match(/-?\d+/g) || [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i + 1 < n.length; i += 2) {
      const x = +n[i], y = +n[i + 1];
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x0 === Infinity) return null;
    return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  // The largest ring of a multi-polygon country: the centroid of all of them together
  // puts the United States in the Pacific, because Alaska and Hawaii drag it there.
  function mainRing(d) {
    let best = null;
    for (const seg of String(d).split('M')) {
      if (!seg) continue;
      const e = pathExtent(seg);
      if (e && (!best || e.w * e.h > best.w * best.h)) best = e;
    }
    return best;
  }

  const MARKER_MIN = 35;  // 3.5 degrees: below this a country is a few pixels wide
  const MARKER_R = 26;

  function countrySummary(c) {
    const js = c.jurisdictions;
    if (js.length === 1) return '';           // the jurisdiction is the country; saying so twice says nothing
    if (js.length <= 4) return js.map((j) => j.name).join(', ');
    return `${js.length} jurisdictions`;
  }
  const countryLabel = (c) => {
    const s = countrySummary(c);
    return s ? `${c.name} — ${s}` : c.name;
  };
  function openCountry(c) {
    pushNext = true;
    state.jur = c.jurisdictions[0].id;
    state.chosen = true;
    state.role = null;
    state.tab = 'lanes';
    syncPicker();
    render();
  }

  function renderMap() {
    const covered = (state.manifest.countries || []).filter((c) => c.iso && c.jurisdictions.length);
    const byIso = new Map(covered.map((c) => [c.iso, c]));
    const readout = $('#map-readout');
    const idle = `${covered.length} countries · ${state.manifest.jurisdictions.length} jurisdictions. `
      + 'Select one to open its lifecycle.';
    const say = (s) => { readout.textContent = s || idle; };
    say();
    renderMapList(covered, say);

    const box = $('#map');
    box.innerHTML = '';
    const w = state.world;
    if (!w) return;  // the list below is the whole map then, and still works

    const svg = el('svg', {
      viewBox: w.viewBox, class: 'worldmap', role: 'group',
      'aria-label': 'Countries with a researched role set',
    }, box);

    // Everything not covered is scenery, so it is one path and no target.
    const rest = Object.entries(w.paths).filter(([iso]) => !byIso.has(iso)).map(([, v]) => v.d).join('');
    if (rest) el('path', { d: rest, class: 'm-rest' }, svg);

    for (const c of covered) {
      const shape = w.paths[c.iso];
      const pt = w.points[c.iso];
      if (!shape && !pt) continue;
      const g = el('g', {
        class: 'm-country', tabindex: '0', role: 'link',
        'aria-label': countryLabel(c),
      }, svg);
      el('title', {}, g).textContent = countryLabel(c);
      let ring = null;
      if (shape) {
        el('path', { d: shape.d, class: 'm-fill' }, g);
        ring = mainRing(shape.d);
      }
      // Denmark, Korea, Rwanda and the island states are a handful of pixels at this
      // scale, and Singapore and Mauritius have no polygon at all: give them a target.
      if (!ring || ring.w < MARKER_MIN || ring.h < MARKER_MIN) {
        const cx = pt ? pt.x : ring.cx, cy = pt ? pt.y : ring.cy;
        el('circle', { cx, cy, r: MARKER_R, class: 'm-dot' }, g);
      }
      const open = () => openCountry(c);
      g.addEventListener('click', open);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
      const hi = () => say(countryLabel(c));
      g.addEventListener('mouseenter', hi);
      g.addEventListener('mouseleave', () => say());
      // focus/blur on an SVG <g> do not reach a listener bound to the group in
      // Chromium; the bubbling pair does, and keyboard users need the readout.
      g.addEventListener('focusin', hi);
      g.addEventListener('focusout', () => say());
    }
  }

  // The list is not a fallback: at this scale several covered countries are a dot,
  // and a reader wants to see the whole set named.
  function renderMapList(covered, say) {
    const regions = [];
    for (const c of covered) {
      const r = c.region || 'Other';
      let g = regions.find((x) => x.region === r);
      if (!g) regions.push((g = { region: r, items: [] }));
      g.items.push(c);
    }
    const box = $('#map-list');
    box.innerHTML = regions.map((g) => `<div class="map-region"><h3>${esc(g.region)}</h3><div class="chips">${
      g.items.map((c) => `<button type="button" class="chip" data-country="${esc(c.id)}">${esc(c.name)}${
        c.jurisdictions.length > 1 ? `<span class="n">${c.jurisdictions.length}</span>` : ''}</button>`).join('')
    }</div></div>`).join('');
    box.querySelectorAll('button[data-country]').forEach((b) => {
      const c = covered.find((x) => x.id === b.dataset.country);
      b.onclick = () => openCountry(c);
      b.onmouseenter = () => say(countryLabel(c));
      b.onmouseleave = () => say();
    });
  }

  // ---------- lanes ----------
  function el(name, attrs = {}, parent) {
    const n = document.createElementNS(SVGNS, name);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs = {}) {
    const t = el('text', { x, y, ...attrs }, parent);
    t.textContent = s;
    return t;
  }

  // Shrink a centred label that would otherwise run into its neighbour. The lanes are laid
  // out to the width available, so their columns narrow on a narrower page while the text in
  // them does not. Measuring needs the node to be in the document, so callers draw into an
  // svg that is already attached.
  function fitText(node, max) {
    const w = node.getComputedTextLength();
    if (!w || w <= max) return node;
    const size = parseFloat(node.getAttribute('font-size'));
    node.setAttribute('font-size', Math.max(10.5, size * (max / w)));
    return node;
  }
  const phaseIdx = (p) => { const i = PHASES.indexOf(p); return i < 0 ? 0 : i; };

  function rolesByGroup(m) {
    const out = [];
    for (const [g] of GROUPS) {
      const rs = m.roles.filter((r) => (r.group || guessGroup(r.id)) === g);
      if (rs.length) out.push([g, rs]);
    }
    const known = new Set(GROUPS.map((g) => g[0]));
    const other = m.roles.filter((r) => !known.has(r.group || guessGroup(r.id)));
    if (other.length) out.push(['other', other]);
    return out;
  }

  function renderGroupChips(m) {
    const box = $('#groups');
    box.innerHTML = '';
    for (const [g, rs] of rolesByGroup(m)) {
      const b = document.createElement('button');
      b.className = 'chip'; b.type = 'button';
      b.textContent = `${GROUP_LABEL[g] || 'Other'} (${rs.length})`;
      b.setAttribute('aria-pressed', String(!state.hiddenGroups.has(g)));
      b.onclick = () => { state.hiddenGroups.has(g) ? state.hiddenGroups.delete(g) : state.hiddenGroups.add(g); renderLanes(m); };
      box.appendChild(b);
    }
  }

  // The lanes were drawn to a fixed 1200 and left to the viewBox to scale down to whatever
  // width the container had. That scaled the type along with the geometry: in a 1056px column
  // a 14px role name rendered at 12.3px, and on a phone nearer 10.5px. Drawing to the width
  // actually available keeps every label at the size it is set in. Below the floor the
  // container scrolls, as it always has — 900 is the floor the stylesheet used to set, now
  // here, because this is where the width is decided.
  const LANE_MIN = 900;
  const laneWidth = () => Math.max(Math.round($('#lanes').clientWidth) || 1200, LANE_MIN);

  function renderLanes(m) {
    renderGroupChips(m);
    const host = $('#lanes');
    host.innerHTML = '';
    const W = laneWidth(), LABEL = 320, HEAD = 62, GH = 30;
    const ROW = m.roles.some((r) => nameEn(r)) ? 48 : 38;
    const colW = (W - LABEL - 10) / PHASES.length;
    const colX = (i) => LABEL + i * colW;
    const groups = rolesByGroup(m).filter(([g]) => !state.hiddenGroups.has(g));
    const H = HEAD + groups.reduce((a, [, rs]) => a + GH + rs.length * ROW, 0) + 10;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, class: 'lanes-svg', role: 'img',
      'aria-label': `Authority lifecycle lanes for ${m.name}: for each role, when it is assigned, when authority starts, and when it ends, across the principal's phases from capable to estate closed.` });
    host.appendChild(svg);   // attached before it is drawn, so fitText can measure
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'ph-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'currentColor' }, mk);

    // phase columns
    PHASES.forEach((p, i) => {
      el('rect', { x: colX(i), y: 0, width: colW, height: H, fill: i % 2 ? 'var(--phase-b)' : 'var(--phase-a)' }, svg);
      fitText(txt(svg, colX(i) + colW / 2, 23, PHASE_HEAD[p], { 'text-anchor': 'middle', 'font-size': 14.5, 'font-weight': 600, fill: 'currentColor' }), colW - 12);
      if (i < PHASES.length - 1) {
        el('line', { x1: colX(i) + colW - 26, y1: 38, x2: colX(i) + colW + 26, y2: 38, stroke: 'var(--ink-2)', 'stroke-width': 1.2, 'marker-end': 'url(#ph-arrow)', color: 'var(--ink-2)' }, svg);
      }
    });
    const trig = ['', 'incapacity', 'death', 'probate opened', 'discharge'];
    PHASES.forEach((p, i) => { if (i) txt(svg, colX(i), 54, trig[i], { 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-2)' }); });
    txt(svg, 12, 23, 'Role', { 'font-size': 14.5, 'font-weight': 600, fill: 'currentColor' });
    txt(svg, 12, 43, 'Principal’s status →', { 'font-size': 12.5, fill: 'var(--ink-2)' });

    let y = HEAD;
    for (const [g, rs] of groups) {
      el('rect', { x: 0, y, width: W, height: GH, fill: 'var(--surface-2)' }, svg);
      txt(svg, 12, y + 20, (GROUP_LABEL[g] || 'Other').toUpperCase(), { 'font-size': 12.5, 'font-weight': 700, 'letter-spacing': '.06em', fill: 'var(--ink-2)' });
      y += GH;
      for (const r of rs) { drawLane(svg, m, r, y, { LABEL, ROW, colW, colX, W }); y += ROW; }
    }
  }

  function drawLane(svg, m, r, y, g) {
    const row = el('g', { class: 'lane-row' }, svg);
    el('rect', { class: 'lane-bg', x: 0, y, width: g.LABEL, height: g.ROW, fill: 'transparent' }, row);
    el('line', { x1: 0, y1: y + g.ROW, x2: g.W, y2: y + g.ROW, stroke: 'var(--line)', 'stroke-width': 0.6 }, row);
    const cy = y + g.ROW / 2;
    const L = r.lane;

    const link = el('a', { class: 'role-link', href: `#j=${state.jur}&tab=role&role=${encodeURIComponent(r.id)}`, tabindex: 0 }, row);
    link.addEventListener('click', (e) => { e.preventDefault(); pushNext = true; state.role = r.id; state.tab = 'role'; render(); });
    if (r.differs) el('rect', { x: 6, y: y + 5, width: 6, height: g.ROW - 10, rx: 2, fill: 'var(--diff-ink)' }, link);
    if (nameEn(r)) {
      txt(link, 18, cy - 4, trunc(r.name, 35), { 'font-size': 14, fill: 'currentColor' });
      txt(link, 18, cy + 13, trunc(nameEn(r), 41), { 'font-size': 12, 'font-style': 'italic', fill: 'var(--ink-2)' });
    } else {
      txt(link, 18, cy + 5, trunc(r.name, 35), { 'font-size': 14, fill: 'currentColor' });
    }
    const title = el('title', {}, link);
    title.textContent = r.name + (nameEn(r) ? ` — ${nameEn(r)}` : '') + (r.localNames.length ? ` (${r.localNames.map((t) => termEn(r, t) ? `${t} = ${termEn(r, t)}` : t).join(', ')})` : '');

    const col = g.colX, cw = g.colW;
    const ax = L.assigned ? col(phaseIdx(L.assigned.phase)) + cw * 0.14 : null;
    let sx = null;
    if (L.starts) {
      const si = phaseIdx(L.starts.phase);
      sx = col(si) + cw * 0.34;
      if (L.assigned && phaseIdx(L.assigned.phase) === si && /immediate|upon (execution|signing)|on (execution|signing)/i.test(L.starts.event || '')) sx = ax + 22;
      if (L.assigned && phaseIdx(L.assigned.phase) === si && sx <= ax + 14) sx = ax + 22;
    }

    // active bar spans
    const actives = (L.activePhases || []).map(phaseIdx).sort((a, b) => a - b);
    if (sx !== null && actives.length) {
      const last = actives[actives.length - 1];
      // bar runs through the last active phase, and on to a boundary end marked at the start of the following phase
      const nextEnds = L.ends.filter((e) => phaseIdx(e.phase) === last + 1).length;
      const barEnd = Math.max(sx + 8, nextEnds ? col(last + 1) + cw * 0.1 : col(last) + cw - 6);
      const dashed = r.unverified || (L.starts && L.starts.unverified);
      el('line', { x1: sx, y1: cy, x2: barEnd, y2: cy, stroke: 'var(--active)', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? '10 6' : null, opacity: 0.9 }, row);
    }
    if (ax !== null && sx !== null && sx - ax > 16) {
      el('line', { x1: ax + 7, y1: cy, x2: sx - 8, y2: cy, stroke: 'var(--dormant)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, row);
    }

    // ends. "Boundary" ends fall in a later phase than the one authority starts in (death, estate closing) and sit at
    // that phase's left edge. "Interrupting" ends (revocation, removal, restored capacity) can happen any time while
    // authority is running; they are spread along the active bar within the start phase.
    const startPhase = L.starts ? phaseIdx(L.starts.phase) : (L.assigned ? phaseIdx(L.assigned.phase) : 0);
    const boundary = L.ends.filter((e) => phaseIdx(e.phase) > startPhase);
    const interrupting = L.ends.filter((e) => phaseIdx(e.phase) <= startPhase);
    const perPhase = {};
    boundary.forEach((e) => {
      const i = phaseIdx(e.phase);
      const k = (perPhase[i] = (perPhase[i] || 0) + 1) - 1;
      drawEnd(row, m, r, e, col(i) + cw * 0.1 + k * 17, cy, 5);
    });
    if (interrupting.length) {
      const from = (sx !== null ? sx : col(startPhase)) + 26;
      const to = col(startPhase) + cw - 12;
      const step = interrupting.length > 1 ? Math.min(18, (to - from) / (interrupting.length - 1)) : 0;
      const x0 = interrupting.length > 1 ? to - step * (interrupting.length - 1) : (from + to) / 2;
      interrupting.forEach((e, k) => drawEnd(row, m, r, e, Math.max(from, x0 + k * step), cy, 4));
    }
    if (ax !== null) {
      const gm = marker(row, m, r, 'Assigned', L.assigned);
      el('rect', { x: ax - 6, y: cy - 6, width: 12, height: 12, transform: `rotate(45 ${ax} ${cy})`, fill: 'var(--assigned)', stroke: 'var(--surface)', 'stroke-width': 1.5, 'stroke-dasharray': L.assigned.unverified ? '2 2' : null }, gm);
    }
    if (sx !== null) {
      const gm = marker(row, m, r, 'Authority starts', L.starts);
      el('path', { d: `M${sx - 6},${cy - 8} L${sx + 8},${cy} L${sx - 6},${cy + 8} z`, fill: 'var(--start)', stroke: 'var(--surface)', 'stroke-width': 1.5 }, gm);
    }
  }

  function drawEnd(row, m, r, e, x, cy, d) {
    const gm = marker(row, m, r, 'Ends', e);
    el('rect', { x: x - 9, y: cy - 9, width: 18, height: 18, fill: 'transparent' }, gm);
    const path = `M${x - d},${cy - d} L${x + d},${cy + d} M${x + d},${cy - d} L${x - d},${cy + d}`;
    el('path', { d: path, stroke: 'var(--surface)', 'stroke-width': 6, 'stroke-linecap': 'round' }, gm);
    el('path', { d: path, stroke: 'var(--end)', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-dasharray': e.unverified ? '2 2' : null }, gm);
  }

  function marker(parent, m, r, kind, ev) {
    const gm = el('g', { class: 'mk', tabindex: 0, role: 'button', 'aria-label': `${r.name}: ${kind}: ${ev.event || ''}` }, parent);
    const show = (e) => showTip(e, m, r, kind, ev);
    gm.addEventListener('mouseenter', show);
    gm.addEventListener('mousemove', show);
    gm.addEventListener('focus', show);
    gm.addEventListener('click', show);
    gm.addEventListener('mouseleave', hideTip);
    gm.addEventListener('blur', hideTip);
    return gm;
  }

  function showTip(e, m, r, kind, ev) {
    const tip = $('#tip');
    const conds = ev.conditions && ev.conditions.length ? `<div>${ev.conditions.map(esc).join('<br>')}</div>` : '';
    tip.innerHTML = `<div class="k">${esc(kind)} · ${esc(PHASE_LABEL[ev.phase] || ev.phase || '')}</div>
      <div><b>${esc(r.name)}</b>${nameEn(r) ? `<br><i class="muted">${esc(nameEn(r))}</i>` : ''}</div>
      <div>${esc(ev.event || '')}${ev.unverified ? ' <span class="badge unv">unverified</span>' : ''}</div>${conds}
      <div class="cites">${esc(citeText(m, ev.citations) || 'No citation')}</div>`;
    tip.hidden = false;
    let x, y;
    if (e.clientX !== undefined && e.type !== 'focus') { x = e.clientX; y = e.clientY; }
    else { const b = e.currentTarget.getBoundingClientRect(); x = b.right; y = b.bottom; }
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    x = Math.min(x + 14, innerWidth - tw - 8); y = y + 14 + th > innerHeight ? y - th - 10 : y + 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { $('#tip').hidden = true; }

  // ---------- role detail ----------
  function renderRole(m) {
    const sel = $('#role-select');
    const groups = rolesByGroup(m);
    sel.innerHTML = groups.map(([g, rs]) => `<optgroup label="${esc(GROUP_LABEL[g] || 'Other')}">${
      rs.map((r) => `<option value="${esc(r.id)}">${esc(r.name)}${nameEn(r) ? ' — ' + esc(nameEn(r)) : ''}${r.differs ? ' •' : ''}</option>`).join('')}</optgroup>`).join('');
    if (!state.role || !m.roles.find((r) => r.id === state.role)) state.role = m.roles[0] && m.roles[0].id;
    sel.value = state.role;
    sel.onchange = () => { pushNext = true; state.role = sel.value; render(); };
    const r = m.roles.find((x) => x.id === state.role);
    const box = $('#role-detail');
    if (!r) { box.innerHTML = '<p>No roles loaded.</p>'; return; }
    const L = r.lane;
    const laneRow = (label, ev) => ev ? `<tr${ev.unverified ? ' class="unv"' : ''}><th scope="row">${label}</th><td>${esc(ev.event)}${
      ev.conditions && ev.conditions.length ? `<ul class="cite-list muted">${ev.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</td><td>${esc(PHASE_LABEL[ev.phase] || ev.phase || '')}</td><td>${citeLinks(m, ev.citations)}</td></tr>` : '';

    box.innerHTML = `
      <div class="role-head">
        <h2>${esc(r.name)}</h2>
        ${r.nameEn ? `<p class="en-title">${glossHtml(r.nameEn)}</p>` : ''}
        <div class="badges">
          <span class="badge">${esc(GROUP_LABEL[r.group] || r.group || '')}</span>
          ${r.localNames.map((n) => `<span class="badge">aka <b>${esc(n)}</b>${r.localNamesEn && r.localNamesEn[n] ? ` · ${glossHtml(r.localNamesEn[n], 'en-inline')}` : ''}</span>`).join('')}
          ${r.differs ? '<span class="badge diff">differs from model</span>' : (r.patched ? '<span class="badge">matches model</span>' : '')}
          ${r.unverified ? '<span class="badge unv">contains unverified claims</span>' : ''}
        </div>
        ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
        ${ROLES_BASE && r.canonical ? `<p class="canon-link"><a href="${esc(ROLES_BASE + r.canonical + '/')}">See this role in every jurisdiction</a></p>` : ''}
        ${r.diff ? `<div class="${r.differs ? 'diffbox' : 'card'}"><b>${esc(m.name)}${r.differs ? ' differs from the model baseline' : ''}:</b> ${esc(r.diff)}${
          r.stateCitations && r.stateCitations.length ? `<div class="cite">${citeLinks(m, r.stateCitations)}</div>` : ''}</div>` : ''}
      </div>
      <div class="card" style="padding:0;overflow-x:auto">
        <table><thead><tr><th>Milestone</th><th>Event</th><th>Principal’s phase</th><th>Authority</th></tr></thead>
        <tbody>${laneRow('Assigned', L.assigned)}${laneRow('Starts', L.starts)}${L.ends.map((e, i) => laneRow(i ? '' : 'Ends', e)).join('')}</tbody></table>
      </div>
      ${r.notes && r.notes.length ? `<div class="card"><h3 style="margin-top:0">Notes from the sources</h3><ul class="cite-list">${
        r.notes.map((n) => typeof n === 'string' ? `<li>${esc(n)}</li>` : `<li>${esc(n.text || n.note || '')} <span class="cite">${citeLinks(m, n.citations)}</span></li>`).join('')}</ul></div>` : ''}
      <h3>State machine</h3>
      <figure><div class="sm-wrap" id="sm"></div>
        <figcaption>States this role’s authority moves through. Each arrow carries the numbers of the transitions in the table below (several legal events can cause the same change); highlighted arrows are state-specific, dashed arrows unverified.</figcaption></figure>
      <h3>Transitions</h3>
      <div class="card" style="padding:0;overflow-x:auto">
        <table class="trans"><thead><tr><th>#</th><th>From → To</th><th>Triggering event and conditions</th><th>Authority</th></tr></thead><tbody>
        ${r.stateMachine.transitions.map((t, i) => `<tr id="tr-${i + 1}" class="${t.unverified ? 'unv' : ''} ${t.patched && state.jur !== 'us-model' ? 'diff' : ''}">
          <td>${i + 1}</td>
          <td>${esc(stateLabel(r, t.from))} → ${esc(stateLabel(r, t.to))}</td>
          <td>${esc(t.event)}${t.unverified ? ' <span class="badge unv">unverified</span>' : ''}${
            t.conditions && t.conditions.length ? `<ul class="cite-list muted">${t.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</td>
          <td>${citeLinks(m, t.citations)}</td></tr>`).join('')}
        </tbody></table>
      </div>`;
    $('#sm').appendChild(drawStateMachine(r));
  }

  function stateLabel(r, id) {
    const s = r.stateMachine.states.find((x) => x.id === id);
    return s ? (s.label || titleize(s.id)) : titleize(id);
  }

  // CJK and other full-width characters take about twice the room of a Latin one,
  // and Japanese writes without spaces, so a label arrives as a single unbreakable
  // token. Measure in half-width units and allow a break between characters.
  const WIDE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/;
  function dispWidth(s) {
    let n = 0;
    for (const ch of String(s)) n += WIDE.test(ch) ? 2 : 1;
    return n;
  }
  function splitWide(word, width) {
    // break an unspaced run so no piece exceeds the budget
    const out = [];
    let cur = '';
    for (const ch of String(word)) {
      if (cur && dispWidth(cur + ch) > width) { out.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  function truncWide(s, width) {
    // like trunc, but budgeting by display width so a CJK line is not twice too long
    if (dispWidth(s) <= width) return s;
    let out = '';
    for (const ch of String(s)) {
      if (dispWidth(out + ch) > width - 1) break;
      out += ch;
    }
    return out.replace(/\s+\S*$/, '').trim() + '…';
  }

  function wrapWords(label, width, maxLines) {
    const lines = [];
    let cur = '';
    const words = String(label).split(/\s+/).flatMap((w) =>
      dispWidth(w) > width ? splitWide(w, width) : [w]);
    for (const w of words) {
      if (!cur) cur = w;
      else if (dispWidth(cur + ' ' + w) <= width) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = truncWide(kept[maxLines - 1] + ' ' + lines[maxLines], width);
      return kept;
    }
    return lines;
  }

  function drawStateMachine(r) {
    const S = r.stateMachine.states, T = r.stateMachine.transitions;
    const hlJur = state.jur !== 'us-model';

    // Layer states left-to-right by BFS distance from the entry states.
    const layer = new Map();
    const roots = S.filter((s) => !T.some((t) => t.to === s.id && t.from !== s.id));
    const queue = (roots.length ? roots : S.slice(0, 1)).map((s) => s.id);
    queue.forEach((id) => layer.set(id, 0));
    while (queue.length) {
      const id = queue.shift();
      for (const t of T) {
        if (t.from === id && !layer.has(t.to)) { layer.set(t.to, layer.get(id) + 1); queue.push(t.to); }
      }
    }
    S.forEach((s) => { if (!layer.has(s.id)) layer.set(s.id, 0); });
    const layers = [];
    S.forEach((s) => { const l = layer.get(s.id); (layers[l] = layers[l] || []).push(s); });

    // Order rows within each layer by the mean row of their predecessors (one barycenter pass).
    const row = new Map();
    layers.forEach((l, li) => {
      if (!l) return;
      if (li > 0) {
        const score = (s) => {
          const preds = T.filter((t) => t.to === s.id && layer.get(t.from) < li && row.has(t.from)).map((t) => row.get(t.from));
          return preds.length ? preds.reduce((x, y) => x + y, 0) / preds.length : 0;
        };
        l.sort((x, y) => score(x) - score(y));
      }
      l.forEach((s, i) => row.set(s.id, i - (l.length - 1) / 2));
    });

    const NW = 216, GX = 320, PX = 24;
    // Wrap every label first: the node box is sized to the tallest label in this
    // diagram, so a role with short state names keeps compact boxes.
    const LINES = new Map(S.map((s) => [s.id, wrapWords(s.label || titleize(s.id), 21, 4)]));
    const maxLines = Math.max(...[...LINES.values()].map((l) => l.length), 1);
    const NH = Math.max(70, maxLines * 17 + 20);
    const GY = Math.max(142, NH + 54);
    const maxRows = Math.max(...layers.map((l) => (l ? l.length : 0)), 1);
    const top = 70;
    const W = PX * 2 + (layers.length - 1) * GX + NW;
    const H = top + (maxRows - 1) * GY + NH + 90;   // rows, the last box itself, then room for the arcs beneath
    const midY = top + ((maxRows - 1) * GY) / 2;
    const pos = new Map();
    S.forEach((s) => pos.set(s.id, { x: PX + layer.get(s.id) * GX, y: midY + row.get(s.id) * GY }));

    // Group parallel transitions (same from→to) into one arrow.
    const pairs = new Map();
    T.forEach((t, i) => {
      const k = t.from + '>' + t.to;
      if (!pairs.has(k)) pairs.set(k, { from: t.from, to: t.to, nums: [], ts: [] });
      pairs.get(k).nums.push(i + 1);
      pairs.get(k).ts.push(t);
    });

    const vbW = Math.max(W, 520);
    const svg = el('svg', { viewBox: `0 0 ${vbW} ${H}`, class: 'sm-svg', role: 'img', 'aria-label': `State machine for ${r.name}: ${T.map((t, i) => `${i + 1}. ${stateLabel(r, t.from)} to ${stateLabel(r, t.to)} on ${t.event}`).join('; ')}` });
    // Floor the width so the diagram stays legible on a phone (where the wrap scrolls),
    // but keep it low enough that a container narrower than the diagram scales it to fit
    // rather than slicing the last column off: Xebec's column is ~1050px.
    svg.style.minWidth = Math.min(vbW, 900) + 'px';
    const defs = el('defs', {}, svg);
    for (const [id, color] of [['sm-a', 'var(--ink-2)'], ['sm-d', 'var(--diff-ink)']]) {
      const mk = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, mk);
    }
    const edgesG = el('g', {}, svg);
    const nodesG = el('g', {}, svg);
    const labelsG = el('g', {}, svg);
    let backCount = 0;

    for (const pr of pairs.values()) {
      const a = pos.get(pr.from), b = pos.get(pr.to);
      if (!a || !b) continue;
      const hl = hlJur && pr.ts.some((t) => t.patched);
      const unv = pr.ts.every((t) => t.unverified);
      const stroke = hl ? 'var(--diff-ink)' : 'var(--ink-2)';
      const reverse = pairs.has(pr.to + '>' + pr.from);
      let d, lx, ly, back = false;
      if (pr.from === pr.to) {
        const x = a.x + NW / 2, y0 = a.y;
        d = `M${x - 24},${y0} C${x - 44},${y0 - 56} ${x + 44},${y0 - 56} ${x + 24},${y0}`;
        lx = x; ly = y0 - 44;
      } else if (layer.get(pr.to) > layer.get(pr.from)) {
        const off = reverse ? -9 : 0;
        const x1 = a.x + NW, y1 = a.y + NH / 2 + off, x2 = b.x, y2 = b.y + NH / 2 + off;
        const mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
        lx = mx; ly = (y1 + y2) / 2;
      } else if (layer.get(pr.to) === layer.get(pr.from)) {
        // same layer: vertical link between rows, bowed to the right when not adjacent
        const down = b.y > a.y;
        const x1 = a.x + NW * 0.7, y1 = down ? a.y + NH : a.y, x2 = b.x + NW * 0.7, y2 = down ? b.y : b.y + NH;
        const bow = Math.abs(b.y - a.y) > GY + 1 ? NW * 0.45 : (reverse ? (down ? 14 : -14) : 0);
        d = `M${x1},${y1} C${x1 + bow},${(y1 + y2) / 2} ${x2 + bow},${(y1 + y2) / 2} ${x2},${y2}`;
        lx = x1 + bow * 0.75; ly = (y1 + y2) / 2;
      } else {
        // backward: arc beneath both states
        const x1 = a.x + NW / 2 + 16, y1 = a.y + NH, x2 = b.x + NW / 2 - 16, y2 = b.y + NH;
        const base = Math.max(y1, y2);
        const dip = 34 + (backCount++ % 3) * 16;
        d = `M${x1},${y1} C${x1},${base + dip} ${x2},${base + dip} ${x2},${y2}`;
        lx = (x1 + x2) / 2; ly = base + dip * 0.75;
        back = true;
      }
      el('path', { d, fill: 'none', stroke, 'stroke-width': hl ? 2.2 : 1.5, 'stroke-dasharray': unv ? '5 4' : null, opacity: back ? 0.6 : null, 'marker-end': `url(#${hl ? 'sm-d' : 'sm-a'})` }, edgesG);

      const badge = el('g', {}, labelsG);
      // A long list of transition numbers makes a pill wider than the gap between two
      // boxes, which then covers their labels; past three, count the rest. The tooltip
      // and the click target still carry every transition.
      const label = pr.nums.length > 3 ? `${pr.nums[0]} · ${pr.nums[1]} +${pr.nums.length - 2}` : pr.nums.join(' · ');
      const bw = 12 + label.length * 6.6;
      // Nudge the pill off any box it lands on: a few pixels along the arrow is better
      // than sitting on a state's label.
      const hitsBox = (cx, cy) => S.some((s) => {
        const q = pos.get(s.id);
        return q && cx - bw / 2 < q.x + NW + 2 && cx + bw / 2 > q.x - 2
          && cy - 10 < q.y + NH + 2 && cy + 10 > q.y - 2;
      });
      let bx = lx, by = ly;
      if (hitsBox(bx, by)) {
        const vy = NH / 2 + 16, vy2 = NH / 2 + 34;   // clearing a box means clearing its height
        for (const [dx, dy] of [[0, -14], [0, 14], [-18, 0], [18, 0], [0, -vy], [0, vy], [-34, 0], [34, 0], [0, -vy2], [0, vy2]]) {
          if (!hitsBox(lx + dx, ly + dy)) { bx = lx + dx; by = ly + dy; break; }
        }
      }
      bx = Math.min(Math.max(bx, bw / 2 + 2), Math.max(vbW - bw / 2 - 2, bw / 2 + 2));
      el('rect', { x: bx - bw / 2, y: by - 10, width: bw, height: 20, rx: 10, fill: hl ? 'var(--diff)' : 'var(--surface)', stroke }, badge);
      txt(badge, bx, by + 4, label, { 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: hl ? 'var(--diff-ink)' : 'currentColor' });
      if (pairs.size <= 6 && pr.ts.length === 1 && pr.from !== pr.to) {
        const cap = truncWide(pr.ts[0].event, 34);
        // Centred captions near the first/last layer would spill past the viewBox.
        // measure by display width: a CJK caption is twice as wide as its length suggests
        const capHalf = dispWidth(cap) * 3.2;
        const capX = Math.min(Math.max(bx, capHalf + 6), Math.max(vbW - capHalf - 6, capHalf + 6));
        // A caption is wider than the gap between two boxes, so only draw it where it
        // clears every node: on the arcs that dip below the diagram there is room.
        const capY = by + 26;
        const clear = S.every((s) => {
          const q = pos.get(s.id);
          return !q || capX - capHalf > q.x + NW + 4 || capX + capHalf < q.x - 4
            || capY - 11 > q.y + NH + 4 || capY + 4 < q.y - 4;
        });
        if (clear) txt(badge, capX, capY, cap, { 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-2)', stroke: 'var(--surface)', 'stroke-width': 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      }
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', () => { const tr = document.getElementById('tr-' + pr.nums[0]); if (tr) { tr.scrollIntoView({ behavior: 'smooth', block: 'center' }); pr.nums.forEach((n) => { const x = document.getElementById('tr-' + n); if (x) { x.classList.add('flash'); setTimeout(() => x.classList.remove('flash'), 1600); } }); } });
      const ti = el('title', {}, badge);
      ti.textContent = pr.ts.map((t, k) => `${pr.nums[k]}. ${t.event}`).join('\n');
    }

    S.forEach((s) => {
      const p = pos.get(s.id); if (!p) return;
      const g = el('g', {}, nodesG);
      const kind = /terminat|revok|ended|end$|closed|discharg|ceased/.test(s.id) ? 'end' : /active/.test(s.id) ? 'active' : /suspend/.test(s.id) ? 'dormant' : /designat|nominat|pending|executed|named|appointed/.test(s.id) ? 'assigned' : 'plain';
      const edge = { end: 'var(--end)', active: 'var(--active)', dormant: 'var(--dormant)', assigned: 'var(--assigned)', plain: 'var(--ink-2)' }[kind];
      el('rect', { x: p.x, y: p.y, width: NW, height: NH, rx: 8, fill: 'var(--surface)', stroke: edge, 'stroke-width': 1.8 }, g);
      el('rect', { x: p.x, y: p.y, width: 7, height: NH, rx: 3, fill: edge }, g);
      const lines = LINES.get(s.id);
      const y0 = p.y + NH / 2 - ((lines.length - 1) * 17) / 2 + 5;
      lines.forEach((ln, i) => txt(g, p.x + NW / 2 + 4, y0 + i * 17, ln, { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: 'currentColor' }));
      const ti = el('title', {}, g); ti.textContent = (s.label || s.id) + (s.description ? ' — ' + s.description : '');
    });
    return svg;
  }

  // ---------- compare ----------
  const CANON_LABEL = {
    'financial-poa-durable': 'Financial attorney — durable / lasting / enduring / continuing',
    'financial-poa-nondurable': 'Financial attorney — ordinary (ends on incapacity)',
    'financial-poa-springing': 'Financial attorney — springing / contingent',
    'health-care-agent': 'Health / welfare / personal-care decision maker (appointed)',
    'default-surrogate': 'Default health-care decision maker (by statute)',
    'supported-decision-maker': 'Supporter / supported decision-making',
    'guardian-person': 'Court- or tribunal-appointed personal decision maker',
    'conservator-estate': 'Court- or tribunal-appointed financial manager',
    'personal-representative-executor': 'Executor / estate trustee / liquidator (named in will)',
    'personal-representative-administrator': 'Administrator (no will or no executor)',
    'small-estate-affiant': 'Small estate without a full grant',
    'successor-trustee': 'Successor trustee',
    'digital-assets-fiduciary': 'Fiduciary access to digital assets (statutory)',
    'online-tool-designee': 'Online-tool designee recognised in law',
    'anatomical-gift-agent': 'Organ / tissue donation decision maker',
    'disposition-of-remains-agent': 'Control of disposal of remains',
    'benefits-payee': 'Government benefits payee / appointee / nominee',
    'health-records-representative': 'Representative for health records / privacy',
    'veterans-fiduciary': 'Veterans benefits fiduciary',
    'tax-representative': 'Tax representative',
  };
  const CANON_ORDER = Object.keys(CANON_LABEL);

  function renderCompare() {
    const countries = state.manifest.countries || [{ id: 'all', name: 'All', jurisdictions: state.manifest.jurisdictions }];
    const cur = state.manifest.jurisdictions.find((j) => j.id === state.jur);
    if (!state.cmpScope) state.cmpScope = cur ? cur.country : 'all';
    // Same region grouping as the jurisdiction picker, so the country order here
    // reads as deliberate rather than arbitrary.
    const scopeRegions = [];
    for (const c of countries) {
      const region = c.region || 'Other';
      let g = scopeRegions.find((x) => x.region === region);
      if (!g) scopeRegions.push((g = { region, items: [] }));
      g.items.push(c);
    }
    const scopeSel = `<label class="field"><span>Compare</span><select id="cmp-scope">
      ${scopeRegions.map((g) => `<optgroup label="${esc(g.region)}">${
        g.items.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>`).join('')}
      <option value="all">All countries (wide)</option></select></label>`;
    const js = state.cmpScope === 'all' ? state.manifest.jurisdictions
      : (countries.find((c) => c.id === state.cmpScope) || countries[0]).jurisdictions;

    const canon = (r) => r.canonical || r.id;
    const keys = new Set();
    for (const j of js) for (const r of state.merged[j.id].roles) keys.add(canon(r));
    const ordered = CANON_ORDER.filter((k) => keys.has(k)).concat([...keys].filter((k) => !CANON_ORDER.includes(k)));

    const cell = (j, key) => {
      const m = state.merged[j.id];
      const rs = m.roles.filter((x) => canon(x) === key);
      if (!rs.length) return '<td class="muted">no equivalent found</td>';
      return `<td class="${rs.some((r) => r.differs) && j.extends ? 'diff' : ''}">${rs.map((r) => {
        const L = r.lane;
        const ends = L.ends.map((e) => e.event).filter(Boolean);
        return `<div class="e"><a href="#j=${esc(j.id)}&tab=role&role=${esc(r.id)}" data-j="${esc(j.id)}" data-role="${esc(r.id)}"><b>${esc(trunc(r.localNames[0] || r.name, 60))}</b></a>${(r.localNames[0] ? termEn(r, r.localNames[0]) : nameEn(r)) ? `<br><i class="muted">${esc(trunc(r.localNames[0] ? termEn(r, r.localNames[0]) : nameEn(r), 70))}</i>` : ''}</div>
          ${L.starts ? `<span class="e"><span class="lbl">Starts</span><br>${esc(trunc(L.starts.event, 110))}</span>` : ''}
          ${ends.length ? `<span class="e"><span class="lbl">Ends</span><br>${esc(trunc(ends[0], 80))}${ends.length > 1 ? ` <span class="muted">+${ends.length - 1} more</span>` : ''}</span>` : ''}`;
      }).join('<hr class="sep">')}</td>`;
    };
    $('#compare').innerHTML = `<div class="toolbar" style="padding:10px 12px 0">${scopeSel}</div>
      <table class="cmp"><thead><tr><th>Role (function)</th>${js.map((j) => `<th>${esc(j.short || j.name)}</th>`).join('')}</tr></thead><tbody>
      ${ordered.map((k) => `<tr><td><b>${esc(CANON_LABEL[k] || titleize(k))}</b></td>${js.map((j) => cell(j, k)).join('')}</tr>`).join('')}
    </tbody></table>`;
    const ss = $('#cmp-scope');
    ss.value = state.cmpScope;
    ss.onchange = () => { state.cmpScope = ss.value; renderCompare(); };
    $('#compare').querySelectorAll('a[data-j]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault(); pushNext = true; state.jur = a.dataset.j; state.chosen = true;
      state.role = a.dataset.role; state.tab = 'role'; syncPicker(); render();
    }));
  }

  // ---------- trends ----------
  const STATE_CODES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  const FEATURES = [
    ['poaDurableByDefault', 'Financial POA survives incapacity by default'],
    ['springingPoaAllowed', 'Springing (contingent) financial POA allowed'],
    ['poaRegistrationBeforeUse', 'POA must be registered before use'],
    ['healthAgentStartsOn', 'Appointed health decision maker’s authority starts on'],
    ['healthAgentPostDeathAuthority', 'Health decision maker has authority after death'],
    ['supportedDecisionMakingStatute', 'Statutory supported decision-making'],
    ['digitalAssetsFiduciaryStatute', 'Fiduciary access to digital assets statute'],
    ['onlineToolsRecognisedInLaw', 'Platform online tools recognised in law'],
    ['organDonationModel', 'Organ donation model'],
    ['smallEstateWithoutGrant', 'Small estate collectable without a full grant'],
    ['probateGrantName', 'Name of the court grant for executors'],
    ['deceasedPersonalDataProtected', 'Deceased persons’ personal data protected'],
  ];
  const fmtMoney = (n, cur) => { try { return new Intl.NumberFormat('en', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: 0 }).format(n); } catch (e) { return `${cur || ''} ${n}`; } };
  function featureShort(key, f) {
    if (!f) return { t: '—', cls: 'muted' };
    const v = f.value;
    const unv = f.unverified ? ' ?' : '';
    if (key === 'organDonationModel') return { t: (v === 'opt-out' ? `opt-out${f.optOutSinceYear ? ' ' + f.optOutSinceYear : ''}` : String(v ?? '—')) + unv, cls: v === 'opt-out' ? 'yes' : '' };
    if (key === 'smallEstateWithoutGrant') return { t: v === true ? `yes${f.threshold ? ' ≤ ' + fmtMoney(f.threshold, f.currency) : ''}${unv}` : v === false ? 'no' + unv : String(v ?? '—'), cls: v === true ? 'yes' : v === false ? 'no' : '' };
    if (key === 'supportedDecisionMakingStatute' || key === 'digitalAssetsFiduciaryStatute') return { t: v === true ? `yes${f.year ? ' ' + f.year : ''}${unv}` : v === false ? 'no' + unv : '—', cls: v === true ? 'yes' : v === false ? 'no' : 'muted' };
    if (v === true) return { t: 'yes' + unv, cls: 'yes' };
    if (v === false) return { t: 'no' + unv, cls: 'no' };
    if (v === null || v === undefined) return { t: '—', cls: 'muted' };
    return { t: String(v).replace(/-/g, ' ') + (f.valueEn && f.valueEn.en ? ` (${f.valueEn.en})` : '') + unv, cls: '' };
  }

  function renderFeatureTrends(box) {
    const F = Object.fromEntries(Object.entries(state.features || {}).filter(([, v]) => v && v.features && Object.keys(v.features).length));
    const countries = (state.manifest.countries || []).filter((c) => c.jurisdictions.some((j) => F[j.id]));
    const js = countries.flatMap((c) => c.jurisdictions.filter((j) => F[j.id]).map((j) => ({ ...j, cname: c.name })));
    if (!js.length) { box.innerHTML = ''; return; }
    const get = (j, k) => (F[j.id].features || {})[k];

    // headline counts for yes/no features
    const counted = ['supportedDecisionMakingStatute', 'digitalAssetsFiduciaryStatute', 'organDonationModel', 'poaRegistrationBeforeUse'];
    const stats = counted.map((k) => {
      const vals = js.map((j) => get(j, k)).filter((f) => f && f.value !== null && f.value !== undefined);
      const yes = vals.filter((f) => f.value === true || f.value === 'opt-out').length;
      return { k, yes, n: vals.length, label: FEATURES.find((x) => x[0] === k)[1] };
    });

    // timeline of dated legal changes
    const events = [];
    for (const j of js) {
      const sdm = get(j, 'supportedDecisionMakingStatute'); if (sdm && sdm.value === true && sdm.year) events.push({ j, k: 'Supported decision-making', y: +sdm.year });
      const dig = get(j, 'digitalAssetsFiduciaryStatute'); if (dig && dig.value === true && dig.year) events.push({ j, k: 'Digital assets statute', y: +dig.year });
      const org = get(j, 'organDonationModel'); if (org && org.value === 'opt-out' && org.optOutSinceYear) events.push({ j, k: 'Opt-out organ donation', y: +org.optOutSinceYear });
    }
    let timeline = '';
    if (events.length) {
      const kinds = ['Digital assets statute', 'Supported decision-making', 'Opt-out organ donation'];
      const colors = { 'Digital assets statute': 'var(--start)', 'Supported decision-making': 'var(--active)', 'Opt-out organ donation': 'var(--end)' };
      const y0 = Math.min(...events.map((e) => e.y)) - 1, y1 = Math.max(2026, ...events.map((e) => e.y)) + 1;
      const TW = 820, LBL = 150, rowH = 22, TH = js.length * rowH + 40;
      const xs = (y) => LBL + ((y - y0) / (y1 - y0)) * (TW - LBL - 20);
      const ticks = []; for (let y = Math.ceil(y0 / 5) * 5; y <= y1; y += 5) ticks.push(y);
      timeline = `<div class="card"><h3 style="margin-top:0">When jurisdictions enacted these reforms</h3>
        <div class="legend" style="margin-bottom:6px">${kinds.map((k) => `<span><i class="lg" style="background:${colors[k]};border-radius:50%;width:10px;height:10px"></i>${k}</span>`).join('')}</div>
        <div style="overflow-x:auto"><svg viewBox="0 0 ${TW} ${TH}" role="img" aria-label="Year each jurisdiction enacted a digital-assets fiduciary statute, a supported decision-making statute, or opt-out organ donation" style="width:100%;min-width:640px;height:auto;color:var(--ink)">
        ${ticks.map((y) => `<line x1="${xs(y)}" x2="${xs(y)}" y1="0" y2="${TH - 24}" stroke="var(--line)" stroke-width="0.6"/><text x="${xs(y)}" y="${TH - 8}" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">${y}</text>`).join('')}
        ${js.map((j, i) => {
          const y = i * rowH + 14;
          const ev = events.filter((e) => e.j.id === j.id);
          return `<text x="0" y="${y + 4}" font-size="11.5" fill="currentColor">${esc(trunc(j.name, 22))}</text>
            <line x1="${LBL}" x2="${TW - 20}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="0.6"/>
            ${ev.map((e, k) => `<circle cx="${xs(e.y)}" cy="${y}" r="5.5" fill="${colors[e.k]}" stroke="var(--surface)" stroke-width="1.5" transform="translate(${k * 0} 0)"><title>${esc(j.name)}: ${esc(e.k)} (${e.y})</title></circle>`).join('')}`;
        }).join('')}
        </svg></div></div>`;
    }

    const head = `<tr><th>Legal feature</th>${countries.map((c) => {
      const n = c.jurisdictions.filter((j) => F[j.id]).length;
      return `<th colspan="${n}" class="ctry">${esc(c.name)}</th>`;
    }).join('')}</tr><tr><th></th>${js.map((j) => `<th>${esc(j.short || j.name)}</th>`).join('')}</tr>`;
    const body = FEATURES.map(([k, label]) => `<tr><td><b>${esc(label)}</b></td>${js.map((j) => {
      const f = get(j, k); const sh = featureShort(k, f);
      return `<td class="fcell ${sh.cls}" ${f ? `data-j="${esc(j.id)}" data-k="${esc(k)}" tabindex="0" role="button"` : ''}>${esc(sh.t)}</td>`;
    }).join('')}</tr>`).join('');

    box.innerHTML = `
      <p class="lede">Each cell is a single legal fact about a jurisdiction, backed by a citation — click a cell for the rule and its source. Counts and the timeline are computed from those cells, not written by hand.</p>
      <div class="stat-row">${stats.map((st) => `<div class="stat"><div class="v">${st.yes}<span class="muted" style="font-size:16px">/${st.n}</span></div><div class="l">${esc(st.k === 'organDonationModel' ? 'Opt-out (deemed consent) organ donation' : st.label)}</div></div>`).join('')}</div>
      ${timeline}
      <div class="card" style="padding:0"><div style="padding:14px 16px 0"><h3 style="margin-top:0">Feature matrix</h3></div>
        <div class="scroll-x" style="border:0;border-radius:0"><table class="cmp fmatrix"><thead>${head}</thead><tbody>${body}</tbody></table></div>
        <div id="fdetail" class="fdetail" hidden></div></div>`;
    box.querySelectorAll('td.fcell[data-k]').forEach((td) => {
      const open = () => {
        const j = js.find((x) => x.id === td.dataset.j); const k = td.dataset.k;
        const f = get(j, k); const cites = new Map((F[j.id].citations || []).map((c) => [c.id, c]));
        const links = (f.citations || []).map((id) => cites.get(typeof id === 'object' ? id.id : id) || (typeof id === 'object' ? id : { cite: id }))
          .map((c) => c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.cite || c.id)}</a>` : esc(c.cite || c.id)).join('; ');
        const d = $('#fdetail');
        d.hidden = false;
        d.innerHTML = `<div class="k">${esc(j.name)} · ${esc(FEATURES.find((x) => x[0] === k)[1])}</div>
          <p><b>${esc(featureShort(k, f).t)}</b>${f.valueEn ? ` (${glossHtml(f.valueEn, 'en-inline')})` : ''}${f.name ? ` — ${esc(f.name)}` : ''}${f.nameEn ? ` (${glossHtml(f.nameEn, 'en-inline')})` : ''}${f.waitingDays ? ` · wait ${esc(f.waitingDays)} days` : ''}</p>
          ${f.note ? `<p>${esc(f.note)}</p>` : ''}<p class="cite">${links || '<span class="muted">No citation</span>'}</p>`;
        box.querySelectorAll('td.fcell.sel').forEach((x) => x.classList.remove('sel')); td.classList.add('sel');
      };
      td.addEventListener('click', open);
      td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function renderTrends() {
    const outer = $('#trends');
    outer.innerHTML = '<h2>Across jurisdictions</h2><div id="trends-features"></div><h2 style="margin-top:28px">United States: adoption of uniform acts</h2><div id="trends-us"></div>';
    renderFeatureTrends($('#trends-features'));
    const box = $('#trends-us');
    const ad = state.adoption;
    if (!ad || !ad.acts) { box.innerHTML = '<p>Adoption data not loaded.</p>'; return; }
    const SHORT = { upoaa: 'Power of Attorney (UPOAA 2006)', 'uhcda-1993': 'Health-Care Decisions (1993)', 'uhcda-2023': 'Health-Care Decisions (2023)',
      ugcopaa: 'Guardianship & Conservatorship (2017)', ugppa: 'Guardianship & Protective Proc. (1997)', upc: 'Uniform Probate Code', utc: 'Uniform Trust Code (2000)',
      rufadaa: 'Digital Assets (RUFADAA 2015)', ruaga: 'Anatomical Gift (Revised 2006)' };
    const all = ad.acts.map((a) => {
      const en = (a.enactments || []).filter((e) => STATE_CODES.includes(normCode(e.jurisdiction)));
      return { ...a, shortName: a.shortName || SHORT[a.id], incomplete: /^INCOMPLETE/i.test(a.note || ''),
        en, n: new Set(en.map((e) => normCode(e.jurisdiction))).size };
    });
    const acts = all.filter((a) => !a.incomplete);
    const top = [...acts].sort((a, b) => b.n - a.n);
    const incomplete = all.filter((a) => a.incomplete);
    const W = 760, rowH = 30, LBL = 250, H = top.length * rowH + 30;
    const bars = top.map((a, i) => {
      const w = ((W - LBL - 60) * a.n) / 51;
      const y = i * rowH + 8;
      return `<text x="0" y="${y + 15}" font-size="12.5" fill="currentColor">${esc(trunc(a.shortName || a.name, 36))}</text>
        <rect x="${LBL}" y="${y + 3}" width="${W - LBL - 60}" height="16" rx="3" fill="var(--surface-2)"/>
        <rect x="${LBL}" y="${y + 3}" width="${Math.max(w, 1)}" height="16" rx="3" fill="var(--accent)"/>
        <text x="${LBL + w + 6}" y="${y + 15.5}" font-size="12" fill="currentColor">${a.n}</text>`;
    }).join('');

    // cumulative enactments by year
    const years = acts.flatMap((a) => a.en.map((e) => +e.year).filter(Boolean));
    let timeline = '';
    if (years.length) {
      const y0 = Math.min(...years, ...acts.map((a) => +a.year || 9999)), y1 = Math.max(...years, 2026);
      const TW = 800, TH = 260, PL = 40, PR = 220, PT = 12, PB = 30;
      const xs = (y) => PL + ((y - y0) / Math.max(1, y1 - y0)) * (TW - PL - PR);
      const ys = (n) => PT + (1 - n / 51) * (TH - PT - PB);
      const palette = ['#2f5d8a', '#2f7d5b', '#b0412e', '#7a5a12', '#6a4c93', '#1f7a8c', '#a23b72', '#5c6b73', '#c26a00'];
      const series = top.filter((a) => a.en.some((e) => e.year)).map((a, i) => {
        const pts = []; let c = 0;
        const byYear = {};
        a.en.forEach((e) => { if (e.year) byYear[+e.year] = (byYear[+e.year] || 0) + 1; });
        for (let y = y0; y <= y1; y++) { c += byYear[y] || 0; pts.push([xs(y), ys(c)]); }
        const color = palette[i % palette.length];
        const lastY = pts[pts.length - 1][1];
        return { a, color, path: pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), lastY };
      });
      // de-overlap end labels
      const labels = series.map((s) => ({ s, y: s.lastY })).sort((p, q) => p.y - q.y);
      for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 13) labels[i].y = labels[i - 1].y + 13;
      const ticks = [];
      for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += 10) ticks.push(y);
      timeline = `<svg viewBox="0 0 ${TW} ${TH}" role="img" aria-label="Cumulative number of jurisdictions enacting each uniform act, by year" style="width:100%;height:auto;color:var(--ink)">
        ${[0, 10, 20, 30, 40, 51].map((n) => `<line x1="${PL}" x2="${TW - PR}" y1="${ys(n)}" y2="${ys(n)}" stroke="var(--line)" stroke-width="${n ? 0.6 : 1}"/><text x="${PL - 6}" y="${ys(n) + 4}" font-size="10.5" text-anchor="end" fill="var(--ink-2)">${n}</text>`).join('')}
        ${ticks.map((y) => `<text x="${xs(y)}" y="${TH - 10}" font-size="10.5" text-anchor="middle" fill="var(--ink-2)">${y}</text>`).join('')}
        ${series.map((s) => `<path d="${s.path}" fill="none" stroke="${s.color}" stroke-width="2"/>`).join('')}
        ${labels.map((l) => `<text x="${TW - PR + 6}" y="${l.y + 4}" font-size="11" fill="${l.s.color}">${esc(trunc(l.s.a.shortName || l.s.a.name, 38))}</text>`).join('')}
      </svg>`;
    }

    const keyStates = state.manifest.jurisdictions.filter((j) => j.code);
    const matrix = `<table><thead><tr><th>Uniform act</th><th>Year</th>${keyStates.map((j) => `<th>${esc(j.code)}</th>`).join('')}<th>Total</th></tr></thead><tbody>
      ${top.map((a) => `<tr><td>${a.sourceUrl ? `<a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name)}</td><td class="num">${esc(a.year || '')}</td>
        ${keyStates.map((j) => { const e = a.en.find((x) => normCode(x.jurisdiction) === j.code); return `<td class="num" title="${esc(e ? (e.billOrCite || '') : 'not enacted per source')}">${e ? '✓ ' + esc(e.year || '') : '<span class="muted">—</span>'}</td>`; }).join('')}
        <td class="num">${a.n}/51</td></tr>`).join('')}
      ${incomplete.map((a) => `<tr><td>${a.sourceUrl ? `<a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name)}</td><td class="num">${esc(a.year || '')}</td><td colspan="${keyStates.length + 1}" class="muted">Adoption data incomplete — the ULC tracker lists only amendment packages, not adoption of the code as a whole.</td></tr>`).join('')}
    </tbody></table>`;
    const retrieved = [...new Set(all.map((a) => a.retrieved).filter(Boolean))].join(', ');
    const noYears = top.filter((a) => a.en.length && !a.en.some((e) => e.year)).map((a) => a.shortName);

    const notes = (ad.trends || []).map((t) => `<li>${esc(t.text)} ${t.citations ? `<span class="cite muted">(${esc((t.citations || []).join('; '))})</span>` : ''}</li>`).join('');
    const most = top[0];
    box.innerHTML = `
      <p class="lede">Trends are computed from the Uniform Law Commission’s enactment records rather than editorial judgment: how widely each model act governing these roles has been adopted, and how quickly. Counts cover the 50 states and DC.</p>
      <div class="stat-row">
        ${top.slice(0, 4).map((a) => `<div class="stat"><div class="v">${a.n}<span class="muted" style="font-size:16px">/51</span></div><div class="l">${esc(a.shortName || a.name)}</div></div>`).join('')}
      </div>
      <div class="card"><h3 style="margin-top:0">Adoption of uniform acts</h3>
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Number of jurisdictions (of 51) enacting each uniform act; most widely adopted is ${esc(most ? most.name : '')}" style="width:100%;height:auto;color:var(--ink)">${bars}</svg>
      </div>
      ${timeline ? `<div class="card"><h3 style="margin-top:0">Cumulative enactments over time</h3>${timeline}</div>` : ''}
      <div class="card" style="overflow-x:auto"><h3 style="margin-top:0">Key states</h3>${matrix}
        <p class="muted cite">Source: ULC legislative bill tracking on each act page (“Enacted” and “Enacted – substantially similar”), retrieved ${esc(retrieved)}. ${noYears.length ? `Prior-version lists (${esc(noYears.join('; '))}) carry no enactment years, so they are omitted from the timeline.` : ''} A “—” means the ULC does not list the act as enacted; the state may have a non-uniform statute on the same subject (see each state’s role details).</p></div>
      ${notes ? `<div class="card"><h3 style="margin-top:0">Observed patterns in the sourced data</h3><ul>${notes}</ul></div>` : ''}`;
  }
  function normCode(j) {
    if (!j) return '';
    const s = String(j).trim();
    if (s.length === 2) return s.toUpperCase();
    const map = { 'district of columbia': 'DC' };
    const names = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
    const codes = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
    const i = names.findIndex((n) => n.toLowerCase() === s.toLowerCase());
    return i >= 0 ? codes[i] : (map[s.toLowerCase()] || s);
  }

  // ---------- findings ----------
  // Cross-jurisdiction prose, authored as docs/findings.md and copied into data/ by the
  // build so this tab and GitHub read the same file. The renderer below is deliberately
  // small: it handles only the constructs findings.md actually uses — ATX headings,
  // paragraphs, pipe tables, ordered and unordered lists, blockquotes, and inline
  // emphasis, code and links. It is not a general Markdown implementation, and anything it does not know it
  // escapes and shows as text rather than guessing.
  let findingsText = null;
  let findingsCanon = null;
  let findingsFeatures = null;

  function mdInline(s) {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) =>
      /^(https?:|#|\.|\/)/.test(href) ? `<a href="${href}" rel="noopener">${label}</a>` : label);
    t = t.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, href) => `<a href="${href}" rel="noopener">${href}</a>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
    return t;
  }

  // A pipe-table row, minus its outer pipes. Splits on | only.
  const mdCells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const isTableRule = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

  function mdToHtml(src) {
    const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${mdInline(para.join(' '))}</p>`); para = []; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) { flushPara(); continue; }
      const h = /^(#{1,4})\s+(.*)$/.exec(line);
      if (h) { flushPara(); const n = h[1].length; out.push(`<h${n}>${mdInline(h[2])}</h${n}>`); continue; }
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { flushPara(); out.push('<hr>'); continue; }
      // blockquote: consecutive '>' lines, joined into one paragraph
      if (/^\s*>/.test(line)) {
        flushPara();
        const q = [];
        for (; i < lines.length && /^\s*>/.test(lines[i]); i++) q.push(lines[i].replace(/^\s*>\s?/, ''));
        i--;
        out.push(`<blockquote><p>${mdInline(q.join(' ').trim())}</p></blockquote>`);
        continue;
      }
      // table: a header row whose next line is the delimiter
      if (line.includes('|') && i + 1 < lines.length && isTableRule(lines[i + 1])) {
        flushPara();
        const head = mdCells(line);
        const rows = [];
        i += 2;
        for (; i < lines.length && lines[i].includes('|'); i++) rows.push(mdCells(lines[i]));
        i--;
        out.push('<table class="findings-table"><thead><tr>'
          + head.map((c) => `<th>${mdInline(c)}</th>`).join('')
          + '</tr></thead><tbody>'
          + rows.map((r) => '<tr>' + head.map((_, k) => `<td>${mdInline(r[k] ?? '')}</td>`).join('') + '</tr>').join('')
          + '</tbody></table>');
        continue;
      }
      // list: consecutive items, each possibly wrapped onto following indented lines
      const li = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line);
      if (li) {
        flushPara();
        const ordered = /\d/.test(li[1]);
        const items = [];
        for (; i < lines.length; i++) {
          const m2 = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
          if (m2) { items.push(m2[2]); continue; }
          if (/^\s+\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); continue; }
          break;
        }
        i--;
        const tag = ordered ? 'ol' : 'ul';
        out.push(`<${tag}>` + items.map((t) => `<li>${mdInline(t)}</li>`).join('') + `</${tag}>`);
        continue;
      }
      para.push(line.trim());
    }
    flushPara();
    return out.join('\n');
  }

  // The headline band. Every figure is computed from canonicals.json and the manifest,
  // never written into the prose, because the counts move as jurisdictions are added and
  // a hardcoded headline is a headline that goes quietly wrong. The chart is an emphasis
  // form, not a categorical one: the story is that the roles are near-universal and the
  // digital ones are not, so the digital roles take the accent and everything else takes
  // the de-emphasis gray. One hue plus gray, both already in the token set.
  const DIGITAL_ROLES = ['online-tool-designee', 'digital-assets-fiduciary'];

  function statTile(value, label) {
    return `<div class="stat-tile"><div class="sv">${esc(value)}</div><div class="sl">${esc(label)}</div></div>`;
  }

  // Which countries hold a role, and how many jurisdictions each contributes. The counts come
  // from the role's own jurisdiction list, whose entries already carry a country display name,
  // so there is no join against the manifest to keep in step. A country contributing one
  // jurisdiction shows no count — the number would be noise on 20 of the 24.
  function countryPanel(role, countries) {
    const by = new Map();
    for (const j of role.jurisdictions || []) by.set(j.country, (by.get(j.country) || 0) + 1);
    const list = [...by.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const items = list.map(([name, n]) =>
      `<li>${esc(name)}${n > 1 ? `<span class="cp-n">${n} jurisdictions</span>` : ''}</li>`).join('');
    return `<div class="cp"><div class="cp-h">${esc(role.label)}</div>`
      + `<div class="cp-sub">${role.countryCount} of ${countries} countries · `
      + `${role.jurisdictionCount} jurisdiction${role.jurisdictionCount === 1 ? '' : 's'}</div>`
      + `<ul class="cp-l">${items}</ul></div>`;
  }

  function findingsBand(roles, manifest) {
    const ranked = [...roles].sort((a, b) => b.countryCount - a.countryCount || b.jurisdictionCount - a.jurisdictionCount);
    if (!ranked.length) return '';
    const countries = (manifest.countries || []).length;
    const jurisdictions = (manifest.jurisdictions || []).length;
    const rows = roles.reduce((n, r) => n + r.jurisdictionCount, 0);
    const top = ranked[0];
    // The contrast is deliberately the online-tool designee, not whatever role happens to
    // rank last. Successor trustee also sits at two countries, but only because the schema
    // records it "if materially relevant" — its rarity is an artifact of what we chose to
    // write down, not a finding, and hanging "the gap is digital" on it would be false.
    const bottom = roles.find((r) => r.id === 'online-tool-designee') || ranked[ranked.length - 1];
    const max = top.countryCount || 1;

    // Hero: the gap is the page's finding, so it leads as a contrast, not a single number.
    const hero = `<div class="hero-pair">
      <div class="hero-side">
        <div class="hero-n">${top.countryCount}<span class="hero-of"> / ${countries}</span></div>
        <div class="hero-l">countries recognise <b>${esc(top.label.toLowerCase())}</b> — the most universal role in the data</div>
      </div>
      <div class="hero-vs">but</div>
      <div class="hero-side">
        <div class="hero-n accent">${bottom.countryCount}<span class="hero-of"> / ${countries}</span></div>
        <div class="hero-l">recognise <b>${esc(bottom.label.toLowerCase())}</b>. The gap is not conceptual, it is digital.</div>
      </div>
    </div>`;

    const tiles = `<div class="kpi-row">
      ${statTile(countries, 'countries')}
      ${statTile(jurisdictions, 'jurisdictions')}
      ${statTile(roles.length, 'canonical roles')}
      ${statTile(rows.toLocaleString('en'), 'role/jurisdiction rows')}
    </div>`;

    // Ranked bars. Direct labels at the tip carry the values, so the chart needs no axis
    // and no gridlines; the same numbers are in the table inside section 1.
    //
    // Each bar opens the same panel the glossary terms use, listing which countries hold the
    // role. A bar height of 2 says "two countries" and nothing about which, and for the two
    // digital roles that is the whole question — online-tool-designee reaches 17 jurisdictions
    // and 2 countries, because 16 of the 17 are US states. The breakdown makes a bar that
    // looks like thin coverage legible as concentrated coverage, which is a different claim.
    const bars = ranked.map((r) => {
      const on = DIGITAL_ROLES.includes(r.id);
      const pct = Math.max(1.5, (r.countryCount / max) * 100);
      const label = `${r.label}: ${r.countryCount} of ${countries} countries, ${r.jurisdictionCount} jurisdictions`;
      return `<div class="bar-row${on ? ' on' : ''}" data-panel-html="${esc(countryPanel(r, countries))}"
        tabindex="0" role="button" aria-expanded="false" aria-label="${esc(label)}. Show the countries.">
        <div class="bar-k">${esc(r.label)}</div>
        <div class="bar-t"><div class="bar" style="width:${pct.toFixed(1)}%"></div></div>
        <div class="bar-v">${r.countryCount}</div>
      </div>`;
    }).join('');

    return `<div class="infographic">
      ${hero}
      ${tiles}
      <figure class="bar-fig">
        <figcaption>Countries recognising each role, of ${countries}. The two digital roles are highlighted. Select a row for the countries.</figcaption>
        <div class="bars">${bars}</div>
      </figure>
    </div>`;
  }

  // The page names things in two vocabularies a reader has no reason to know: camelCase
  // feature keys and kebab-case canonical role ids. Both are explained in place rather than
  // only in a glossary at the end — role ids from canonicals.json, which already carries a
  // definition for every one of them, and feature keys from the "Terms used here" section of
  // findings.md, so the prose stays the single source and a new key documented there starts
  // working here with no code change.
  function glossaryFromProse(md) {
    const out = {};
    const start = md.indexOf('## Terms used here');
    if (start < 0) return out;
    const body = md.slice(start);
    // Split on the bullets rather than lookahead-matching to their end: a definition wraps
    // over several lines, and in a multiline regex `$` matches each line break, which
    // silently truncated every entry to its first line.
    for (const chunk of body.split(/\n(?=- \*\*`)/).slice(1)) {
      const m = /^- \*\*`([^`]+)`\*\* — ([\s\S]*?)(?=\n\n|$)/.exec(chunk);
      if (!m) continue;
      // strip the markdown emphasis and backticks; a title attribute is plain text
      out[m[1]] = m[2].replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
    }
    return out;
  }

  // A `title` tooltip is a mouse-only affordance: touch devices never show one, so on a
  // phone every one of these terms was unexplained — and the role ids are not in the
  // glossary at all, since their definitions come from canonicals.json. The definition is
  // therefore shown in a panel this code owns, opened by tap, click, Enter or Space, and
  // on hover as well where the device actually has a pointer.
  function annotateTerms(root, canon, glossary) {
    const byId = new Map((canon || []).map((r) => [r.id, r]));
    const terms = [];
    for (const el of root.querySelectorAll('code')) {
      const key = el.textContent.trim();
      const role = byId.get(key);
      const def = role ? role.definition : glossary[key];
      if (!def) continue;
      const full = role ? `${role.label} — ${def}` : def;
      el.classList.add('term');
      el.dataset.def = full;
      // Reachable without a pointer, announced rather than silently decorative, and a
      // button rather than a note because it now does something when you activate it.
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-label', `${key}: ${full}`);
      terms.push(el);
    }
    // The ranked bars use the same panel: one element, one set of handlers, one thing that
    // closes on Escape. Attaching a second panel would duplicate the id and leave two
    // tooltips that do not know about each other.
    for (const el of root.querySelectorAll('.bar-row[data-panel-html]')) terms.push(el);
    if (terms.length) attachTermPanel(root, terms);
    return terms.length;
  }

  // One panel, reused. It is positioned against the findings container rather than the
  // viewport so it scrolls with the text, and clamped to that container's width so a long
  // definition cannot push a phone into horizontal scrolling.
  function attachTermPanel(root, terms) {
    const panel = document.createElement('div');
    panel.className = 'term-panel';
    panel.id = 'term-panel';
    panel.setAttribute('role', 'tooltip');
    panel.hidden = true;
    root.appendChild(panel);
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    let open = null;

    const close = () => {
      if (!open) return;
      open.setAttribute('aria-expanded', 'false');
      open = null;
      panel.hidden = true;
    };
    const show = (el) => {
      if (open === el) return close();
      close();
      // Glossary terms carry plain text; the bars carry markup this file generated, with every
      // value already through esc(). Nothing from the data reaches innerHTML unescaped.
      if (el.dataset.panelHtml) panel.innerHTML = el.dataset.panelHtml;
      else panel.textContent = el.dataset.def;
      panel.classList.toggle('wide', !!el.dataset.panelHtml);
      panel.hidden = false;
      const base = root.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // measure after it is laid out at full width, then clamp within the container
      const w = Math.min(panel.offsetWidth, base.width);
      let left = r.left - base.left + (r.width / 2) - (w / 2);
      left = Math.max(0, Math.min(left, base.width - w));
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(r.bottom - base.top + 8)}px`;
      el.setAttribute('aria-expanded', 'true');
      open = el;
    };

    for (const el of terms) {
      el.addEventListener('click', (e) => { e.stopPropagation(); show(el); });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(el); }
        else if (e.key === 'Escape') close();
      });
      // Hover is a convenience on top of the click, never the only way in. The listeners
      // attach everywhere and filter on the pointer that actually arrived, rather than
      // asking matchMedia('(hover: hover)') first: that query answers false in more places
      // than you would expect — headless Chromium among them — and gating on it would mean
      // hover silently not working for someone who does have a mouse. The pointerType test
      // already keeps a touch from triggering it, so the gate only added a failure mode.
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(el); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && open === el) close(); });
    }
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', close);
  }

  // ---------- findings figures ----------
  // One small drawing per finding. Each is hand-authored inline SVG: no library, no runtime,
  // sized by viewBox and scaled by CSS. Colour is var(--accent) for the thing the section is
  // about and var(--dormant) for its context, with text in currentColor, so the same markup
  // reads in both themes and introduces no colour the token set does not already have.
  //
  // The counts are computed from features.json and canonicals.json rather than written here,
  // for the same reason the headline band is: a figure with a number drawn into it is a
  // number that goes quietly wrong when the set grows.
  const FIG_W = 460;

  const svgOpen = (h, label) =>
    `<svg viewBox="0 0 ${FIG_W} ${h}" role="img" aria-label="${esc(label)}" class="fig-svg">`;
  const figWrap = (svg, caption) =>
    `<figure class="finding-fig">${svg}</figure>` +
    (caption ? `<p class="fig-cap">${esc(caption)}</p>` : '');

  // A grid of cells, `on` of them filled. The honest form for "x of n jurisdictions":
  // it shows the proportion and keeps the countable units countable.
  function figDots(on, total, label, perRow = 15) {
    const s = 11, gap = 5, rows = Math.ceil(total / perRow);
    const h = rows * (s + gap) - gap + 26;
    let cells = '';
    for (let i = 0; i < total; i++) {
      const x = (i % perRow) * (s + gap);
      const y = Math.floor(i / perRow) * (s + gap) + 22;
      const fill = i < on ? 'var(--accent)' : 'var(--dormant)';
      const op = i < on ? '1' : '.4';
      cells += `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="2" fill="${fill}" opacity="${op}"/>`;
    }
    return svgOpen(h, label)
      + `<text x="0" y="12" class="fig-t">${esc(`${on} of ${total}`)}</text>`
      + cells + '</svg>';
  }

  // Two quantities sharing one bar. For a split that is genuinely part-to-whole.
  function figSplit(a, b, aLabel, bLabel, label) {
    const w = FIG_W, barY = 24, hgt = 22, tot = a + b || 1;
    const aw = Math.round((a / tot) * w) - 1;
    return svgOpen(66, label)
      + `<text x="0" y="12" class="fig-t">${esc(aLabel)} ${a}</text>`
      + `<text x="${w}" y="12" text-anchor="end" class="fig-t">${esc(bLabel)} ${b}</text>`
      + `<rect x="0" y="${barY}" width="${aw}" height="${hgt}" rx="3" fill="var(--dormant)" opacity=".45"/>`
      + `<rect x="${aw + 2}" y="${barY}" width="${w - aw - 2}" height="${hgt}" rx="3" fill="var(--accent)"/>`
      + '</svg>';
  }

  // Paired bars: the same roles counted two ways, which is the whole point of section 7.
  function figPairs(rows, label) {
    const labelW = 150, barW = FIG_W - labelW - 34, rowH = 30;
    const max = Math.max(...rows.map((r) => Math.max(r.a, r.b)), 1);
    let out = svgOpen(rows.length * rowH + 20, label)
      + `<text x="${labelW}" y="10" class="fig-t">jurisdictions</text>`
      + `<text x="${FIG_W}" y="10" text-anchor="end" class="fig-t">countries</text>`;
    rows.forEach((r, i) => {
      const y = 20 + i * rowH;
      out += `<text x="${labelW - 8}" y="${y + 15}" text-anchor="end" class="fig-l">${esc(r.k)}</text>`
        + `<rect x="${labelW}" y="${y + 2}" width="${Math.max(2, (r.a / max) * barW)}" height="9" rx="2" fill="var(--dormant)" opacity=".45"/>`
        + `<rect x="${labelW}" y="${y + 14}" width="${Math.max(2, (r.b / max) * barW)}" height="9" rx="2" fill="var(--accent)"/>`
        + `<text x="${FIG_W}" y="${y + 20}" text-anchor="end" class="fig-l">${r.b}</text>`;
    });
    return out + '</svg>';
  }

  // A value range on a log scale, because the point of section 9 is the order of magnitude.
  function figRange(points, label) {
    const w = FIG_W - 10, y = 40;
    const vals = points.map((p) => p.v);
    const lo = Math.log10(Math.min(...vals)), hi = Math.log10(Math.max(...vals));
    const at = (v) => 5 + ((Math.log10(v) - lo) / (hi - lo || 1)) * w;
    let out = svgOpen(76, label)
      + `<line x1="5" y1="${y}" x2="${w + 5}" y2="${y}" stroke="var(--line)" stroke-width="2"/>`;
    for (const p of points) {
      const x = at(p.v), on = p.on;
      out += `<circle cx="${x.toFixed(1)}" cy="${y}" r="${on ? 7 : 5}" fill="${on ? 'var(--accent)' : 'var(--dormant)'}" opacity="${on ? 1 : .5}"/>`;
      if (p.t) out += `<text x="${x.toFixed(1)}" y="${p.below ? y + 24 : y - 14}" text-anchor="middle" class="fig-l">${esc(p.t)}</text>`;
    }
    return out + '</svg>';
  }

  // Arrow marker, defined once per drawing that needs one (ids are fragment-internal).
  const ARROW = (id, color) =>
    `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">`
    + `<path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker></defs>`;
  const box = (x, y, w, h, t, strong) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${strong ? 'var(--accent)' : 'var(--dormant)'}" stroke-width="${strong ? 2 : 1.5}" opacity="${strong ? 1 : .6}"/>`
    + `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" class="fig-l">${esc(t)}</text>`;

  // Section 2 — the three regimes disagree about what happens when the person said nothing.
  // One axis, three markers: the disagreement is the position, so position is the encoding.
  function figDefaults() {
    const y = 46, x0 = 70, x1 = FIG_W - 20;
    const at = (f) => x0 + f * (x1 - x0);
    const pt = (f, t, up) =>
      `<circle cx="${at(f)}" cy="${y}" r="6" fill="var(--accent)"/>`
      + `<text x="${at(f)}" y="${up ? y - 12 : y + 20}" text-anchor="middle" class="fig-l">${esc(t)}</text>`;
    return svgOpen(78, 'Where each regime lands when the person left no direction: the US at no access to content, France and Italy at access')
      + `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="var(--line)" stroke-width="2"/>`
      + `<text x="${x0}" y="14" class="fig-t">no access</text>`
      + `<text x="${x1}" y="14" text-anchor="end" class="fig-t">access</text>`
      + `<text x="0" y="${y + 4}" class="fig-l">silence →</text>`
      + pt(0.04, 'US', true) + pt(0.88, 'France', true) + pt(0.96, 'Italy', false)
      + '</svg>';
  }

  // Section 3 — the difference is the obligation, so draw the two arrows, not two boxes.
  function figCompel() {
    const a = ARROW('ar-compel', 'var(--accent)') + ARROW('ar-may', 'var(--dormant)');
    return svgOpen(112, 'France obliges every online service to offer the choice; elsewhere a custodian may offer one')
      + a
      + box(0, 14, 150, 30, 'online service', true)
      + box(FIG_W - 150, 14, 150, 30, 'user', true)
      + `<line x1="152" y1="29" x2="${FIG_W - 156}" y2="29" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar-compel)"/>`
      + `<text x="${FIG_W / 2}" y="22" text-anchor="middle" class="fig-l">must offer the choice</text>`
      + box(0, 68, 150, 30, 'custodian', false)
      + box(FIG_W - 150, 68, 150, 30, 'user', false)
      + `<line x1="152" y1="83" x2="${FIG_W - 156}" y2="83" stroke="var(--dormant)" stroke-width="2" stroke-dasharray="5 4" opacity=".7" marker-end="url(#ar-may)"/>`
      + `<text x="${FIG_W / 2}" y="76" text-anchor="middle" class="fig-l">may offer one</text>`
      + `<text x="0" y="60" class="fig-t">France</text>`
      + `<text x="0" y="112" class="fig-t">everywhere else</text>`
      + '</svg>';
  }

  // Section 10 — what a valid instrument must carry, against what it may.
  function figFormless() {
    const need = ['name', 'date of birth', 'phone', 'address', 'signature', 'date'];
    const opt = ['health care agent', 'notarisation', 'witnesses', 'instructions'];
    const rowH = 22;
    let out = svgOpen(Math.max(need.length, opt.length) * rowH + 30,
      'Six elements an Idaho advance care planning document must carry, against four it may');
    out += `<text x="0" y="12" class="fig-t">must carry</text>`
      + `<text x="${FIG_W / 2 + 10}" y="12" class="fig-t">may carry</text>`;
    need.forEach((t, i) => {
      const y = 22 + i * rowH;
      out += `<rect x="0" y="${y}" width="10" height="10" rx="2" fill="var(--accent)"/>`
        + `<text x="18" y="${y + 9}" class="fig-l">${esc(t)}</text>`;
    });
    opt.forEach((t, i) => {
      const y = 22 + i * rowH, x = FIG_W / 2 + 10;
      out += `<rect x="${x}" y="${y}" width="10" height="10" rx="2" fill="none" stroke="var(--dormant)" stroke-width="1.5" stroke-dasharray="3 2"/>`
        + `<text x="${x + 18}" y="${y + 9}" class="fig-l" opacity=".75">${esc(t)}</text>`;
    });
    return out + '</svg>';
  }

  // Section 11 — a mandate on each side of the same exchange.
  function figBothSides() {
    const a = ARROW('ar-fr', 'var(--accent)') + ARROW('ar-id', 'var(--accent)');
    return svgOpen(118, 'France compels the online service toward the user; Idaho compels the party asked to accept a document')
      + a
      + `<text x="0" y="12" class="fig-t">France · art. 85 III</text>`
      + box(0, 20, 170, 28, 'online service', true)
      + `<line x1="172" y1="34" x2="${FIG_W - 146}" y2="34" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar-fr)"/>`
      + box(FIG_W - 140, 20, 140, 28, 'user', false)
      + `<text x="0" y="78" class="fig-t">Idaho · §15-15-106</text>`
      + box(0, 86, 170, 28, 'document holder', false)
      + `<line x1="172" y1="100" x2="${FIG_W - 146}" y2="100" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar-id)"/>`
      + box(FIG_W - 140, 86, 140, 28, 'relying party', true)
      + '</svg>';
  }

  // Section 13 — the same destination, one route evidenced and one not. The dashed arrow is
  // the claim: standing without a prescribed way to prove it.
  function figProof() {
    const a = ARROW('ar-proof', 'var(--accent)') + ARROW('ar-noproof', 'var(--dormant)');
    return svgOpen(126, 'An heir proves standing with an acte de notoriete or livret de famille; the person the deceased designated has no prescribed proof')
      + a
      + `<text x="0" y="12" class="fig-t">heir \u2014 art. 85 II</text>`
      + box(0, 20, 150, 28, 'heir', false)
      + `<line x1="152" y1="34" x2="${FIG_W - 126}" y2="34" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar-proof)"/>`
      + `<text x="${(152 + FIG_W - 126) / 2}" y="28" text-anchor="middle" class="fig-l">acte de notori\u00e9t\u00e9</text>`
      + box(FIG_W - 120, 20, 120, 28, 'controller', true)
      + `<text x="0" y="86" class="fig-t">designated person \u2014 art. 85 I</text>`
      + box(0, 94, 150, 28, 'designee', false)
      + `<line x1="152" y1="108" x2="${FIG_W - 126}" y2="108" stroke="var(--dormant)" stroke-width="2" stroke-dasharray="5 4" opacity=".75" marker-end="url(#ar-noproof)"/>`
      + `<text x="${(152 + FIG_W - 126) / 2}" y="102" text-anchor="middle" class="fig-l">no prescribed proof</text>`
      + box(FIG_W - 120, 94, 120, 28, 'controller', true)
      + '</svg>';
  }

  // Section 12 — one statute book, two regimes, a date between them.
  function figInForce() {
    const x = Math.round(FIG_W * 0.62), y = 44;
    return svgOpen(96, 'Idaho chapter 5 carries the law in force and its enacted replacement, which takes effect on 1 January 2027')
      + `<rect x="0" y="${y - 14}" width="${x - 2}" height="28" rx="3" fill="var(--accent)"/>`
      + `<rect x="${x + 2}" y="${y - 14}" width="${FIG_W - x - 2}" height="28" rx="3" fill="var(--dormant)" opacity=".35"/>`
      + `<text x="10" y="${y + 5}" class="fig-l fig-on">in force</text>`
      + `<text x="${x + 12}" y="${y + 5}" class="fig-l">enacted, not yet in force</text>`
      + `<line x1="${x}" y1="${y - 24}" x2="${x}" y2="${y + 24}" stroke="currentColor" stroke-width="2"/>`
      + `<text x="${x}" y="${y + 40}" text-anchor="middle" class="fig-t">1 January 2027</text>`
      + `<text x="0" y="14" class="fig-t">Idaho title 15, chapter 5</text>`
      + '</svg>';
  }

  // Which drawing belongs to which finding. Keyed on the section number the heading opens
  // with, so renumbering the prose moves the figures with it; a section with no entry simply
  // gets none, which is the right answer for the closing argument.
  function findingFigure(n, ctx) {
    const { feat, canon, countries } = ctx;
    const count = (key, pred) => {
      let on = 0, total = 0;
      for (const j of Object.keys(feat)) {
        const v = ((feat[j] || {}).features || {})[key];
        if (!v || v.value === null || v.value === undefined) continue;
        total++; if (pred(v.value)) on++;
      }
      return { on, total };
    };
    const role = (id) => (canon || []).find((r) => r.id === id);

    switch (n) {
      case 1: {
        const top = role('personal-representative-executor'), bot = role('online-tool-designee');
        if (!top || !bot) return '';
        return figWrap(
          figDots(top.countryCount, countries, `${top.countryCount} of ${countries} countries recognise an executor`, countries)
          + figDots(bot.countryCount, countries, `${bot.countryCount} of ${countries} countries recognise an online-tool designee`, countries),
          'Countries recognising an executor, then an online-tool designee.');
      }
      case 2: return figWrap(figDefaults(), 'Where each regime lands when the person left no direction.');
      case 3: return figWrap(figCompel(), 'France obliges the service; elsewhere the custodian chooses.');
      case 4: {
        const c = count('poaDurableByDefault', (v) => v === true);
        return figWrap(figDots(c.on, c.total, `${c.on} of ${c.total} jurisdictions make a power of attorney durable by default`),
          'Jurisdictions where a power of attorney is durable without saying so.');
      }
      case 5: {
        const c = count('poaRegistrationBeforeUse', (v) => v === true);
        return figWrap(figDots(c.on, c.total, `${c.on} of ${c.total} jurisdictions require registration before the power may be used`),
          'Jurisdictions where an authority must act before the document works.');
      }
      case 6: {
        const i = count('organDonationModel', (v) => v === 'opt-in');
        return figWrap(figSplit(i.on, i.total - i.on, 'opt-in', 'opt-out',
          `${i.on} jurisdictions opt-in, ${i.total - i.on} opt-out`),
          'Donation model across the jurisdictions that record one.');
      }
      case 7: {
        const ids = ['health-records-representative', 'benefits-payee', 'tax-representative', 'veterans-fiduciary'];
        const rows = ids.map(role).filter(Boolean)
          .map((r) => ({ k: r.label, a: r.jurisdictionCount, b: r.countryCount }));
        if (!rows.length) return '';
        return figWrap(figPairs(rows, 'Four roles with a high jurisdiction count and a low country count'),
          'The same four roles, counted by jurisdiction and by country.');
      }
      case 8: {
        const c = count('supportedDecisionMakingStatute', (v) => v === true);
        return figWrap(figDots(c.on, c.total, `${c.on} of ${c.total} jurisdictions have a supported decision-making statute`),
          'Jurisdictions with a statute for supported decision making.');
      }
      case 9: return figWrap(figRange([
        { v: 20000, t: '$20k', on: false },
        { v: 25000, t: 'model $25k', on: false, below: true },
        { v: 100000, t: 'Idaho $100k', on: true },
        { v: 150000, on: false },
        { v: 208850, t: '$208,850', on: false, below: true },
      ], 'US small-estate ceilings from $20,000 to $208,850 on a log scale'),
        'US small-estate ceilings, log scale. One mechanism, an order of magnitude apart.');
      case 10: return figWrap(figFormless(), 'What an Idaho ACPD must carry, against what it may.');
      case 11: return figWrap(figBothSides(), 'A mandate on each side of the same exchange.');
      case 12: return figWrap(figInForce(), 'One chapter, two regimes, a date between them.');
      case 13: return figWrap(figProof(), 'Who can prove their standing to a French controller, and who cannot.');
      default: return '';
    }
  }

  // Split the rendered prose into sections at each h2, so each finding leads with its
  // heading and first paragraph and holds the rest behind a disclosure. The headings stay
  // real h2 elements rather than moving inside <summary>, so the document outline and the
  // reading order survive.
  function findingsSections(html, figureFor) {
    const src = document.createElement('div');
    src.innerHTML = html;
    const out = document.createElement('div');
    let lede = document.createElement('div');
    lede.className = 'findings-lede';
    let cur = null, body = null, teased = false;
    const flush = () => { if (cur) { out.appendChild(cur); cur = null; body = null; } };
    while (src.firstChild) {
      const node = src.firstChild;
      if (node.nodeType === 1 && node.tagName === 'H2') {
        flush();
        if (lede) { out.appendChild(lede); lede = null; }
        cur = document.createElement('section');
        cur.className = 'finding';
        cur.appendChild(node);
        // the section number the heading opens with is what keys its drawing
        const numMatch = /^\s*(\d+)\./.exec(node.textContent || '');
        cur.dataset.fig = numMatch ? numMatch[1] : '';
        const det = document.createElement('details');
        det.className = 'f-more';
        const sum = document.createElement('summary');
        sum.innerHTML = '<span class="f-open">Read more</span><span class="f-close">Show less</span>';
        det.appendChild(sum);
        body = document.createElement('div');
        body.className = 'f-body';
        det.appendChild(body);
        cur.appendChild(det);
        teased = false;
        continue;
      }
      if (!cur) { (lede || out).appendChild(node); continue; }
      // the first paragraph of a section stays visible as the teaser
      if (!teased && node.nodeType === 1 && node.tagName === 'P') {
        teased = true;
        node.classList.add('f-teaser');
        cur.insertBefore(node, cur.lastChild);
        continue;
      }
      body.appendChild(node);
    }
    if (lede) out.appendChild(lede);
    flush();
    // place each drawing after the teaser: heading, then the sentence, then the picture
    if (figureFor) {
      for (const sec of out.querySelectorAll('section.finding')) {
        const n = parseInt(sec.dataset.fig, 10);
        const markup = n ? figureFor(n) : '';
        if (!markup) continue;
        const anchor = sec.querySelector('p.f-teaser') || sec.querySelector('h2');
        anchor.insertAdjacentHTML('afterend', markup);
      }
    }
    return out;
  }

  async function renderFindings() {
    const host = $('#findings');
    if (findingsText === null) {
      host.innerHTML = '<p class="muted">Loading…</p>';
      try {
        const r = await fetch(DATA_BASE + 'findings.md', { cache: 'no-cache' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        findingsText = await r.text();
      } catch (e) {
        findingsText = '';
        host.innerHTML = `<p class="muted">Findings could not be loaded (${esc(e.message)}).</p>`;
        return;
      }
    }
    if (!findingsText) { host.innerHTML = '<p class="muted">No findings available.</p>'; return; }
    // canonicals.json is the build's own cross-jurisdiction tally; the viewer does not
    // otherwise need it, so it is fetched here and only once. If it cannot be read the
    // prose still renders — the band is an addition to the page, not a precondition.
    if (findingsCanon === null) {
      try { findingsCanon = (await getJSON('canonicals.json')).roles || []; }
      catch (e) { findingsCanon = []; }
    }
    host.textContent = '';
    const band = findingsCanon.length ? findingsBand(findingsCanon, state.manifest) : '';
    if (findingsFeatures === null) {
      try { findingsFeatures = await getJSON('features.json'); }
      catch (e) { findingsFeatures = {}; }
    }
    const figCtx = {
      feat: findingsFeatures,
      canon: findingsCanon,
      countries: (state.manifest.countries || []).length,
    };
    const sectioned = findingsSections(mdToHtml(findingsText), (n) => findingFigure(n, figCtx));
    const lede = sectioned.querySelector('.findings-lede');
    if (band && lede) lede.insertAdjacentHTML('afterend', band);
    else if (band) sectioned.insertAdjacentHTML('afterbegin', band);
    while (sectioned.firstChild) host.appendChild(sectioned.firstChild);
    annotateTerms(host, findingsCanon, glossaryFromProse(findingsText));
    const all = [...host.querySelectorAll('details.f-more')];
    if (all.length) {
      const bar = document.createElement('div');
      bar.className = 'f-allbar';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      const sync = () => { btn.textContent = all.every((d) => d.open) ? 'Collapse all' : 'Expand all'; };
      btn.onclick = () => { const open = !all.every((d) => d.open); all.forEach((d) => { d.open = open; }); sync(); };
      all.forEach((d) => d.addEventListener('toggle', sync));
      sync();
      bar.appendChild(btn);
      const first = host.querySelector('section.finding');
      if (first) host.insertBefore(bar, first);
    }
  }

  // ---------- sources ----------
  function renderSources(m) {
    const byOrigin = {};
    for (const c of m.citations.values()) (byOrigin[c.origin] = byOrigin[c.origin] || []).push(c);
    $('#sources').innerHTML = `<p class="lede">Every citation used for <b>${esc(m.name)}</b>. Links go to official legislature, eCFR, agency, or Uniform Law Commission sources.</p>` +
      Object.entries(byOrigin).map(([o, cs]) => `<div class="card src-group"><h3 style="margin-top:0">${esc(o)}</h3><ul class="cite-list">
        ${cs.sort((a, b) => String(a.cite).localeCompare(String(b.cite), undefined, { numeric: true })).map((c) => `<li>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.cite || c.id)}</a>` : esc(c.cite || c.id)}
          ${c.title ? ` — ${esc(c.title)}` : ''}<span class="kind">${esc(c.kind || '')}</span>
          ${c.retrieved ? ` <span class="muted cite">retrieved ${esc(c.retrieved)}</span>` : ''}
          ${c.quote ? `<div class="muted cite">“${esc(c.quote)}”</div>` : ''}</li>`).join('')}
      </ul></div>`).join('');
  }

  // ---------- boot ----------
  window.addEventListener('scroll', hideTip, { passive: true });
  // The lanes are laid out to the width they are given, so a resize needs a redraw. Nothing
  // else measures, and a redraw of the same width is a no-op, so only the lanes tab listens.
  let laneW = 0, resizeTimer = 0;
  window.addEventListener('resize', () => {
    if (state.tab !== 'lanes') return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = laneWidth();
      if (w === laneW) return;
      laneW = w;
      renderLanes(state.merged[state.jur]);
    }, 150);
  });
  load().then(() => {
    readHash();
    renderChrome();
    render();
    const fromHistory = () => { pushNext = false; readHash(); syncPicker(); render(); };
    window.addEventListener('hashchange', fromHistory);
    window.addEventListener('popstate', fromHistory);
  }).catch((e) => {
    document.querySelector('main').innerHTML = `<p>Could not load data: ${esc(e.message)}</p>`;
    console.error(e);
  });
})();
