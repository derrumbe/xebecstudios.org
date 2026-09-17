// Digital Estate Roles viewer. Copied from the digital-estate-roles repo
// (site/app.js) with one change: its own theme toggle is removed, because the
// Xebec masthead already owns document.documentElement.dataset.theme and two
// toggles writing different localStorage keys would fight over it.
//
// The data directory comes from data-base on the script tag, and every colour
// resolves through CSS variables defined in src/styles/der.css.

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
    jur: 'us-model',
    tab: 'lanes',
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
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('j') && state.merged[p.get('j')]) state.jur = p.get('j');
    if (p.get('tab')) state.tab = p.get('tab');
    if (p.get('role')) state.role = p.get('role');
  }
  function writeHash() {
    const p = new URLSearchParams();
    p.set('j', state.jur); p.set('tab', state.tab);
    if (state.role) p.set('role', state.role);
    history.replaceState(null, '', '#' + p.toString());
  }

  // ---------- chrome ----------
  function renderChrome() {
    const sel = $('#jur');
    const countries = state.manifest.countries || [{ name: 'Jurisdictions', jurisdictions: state.manifest.jurisdictions }];
    sel.innerHTML = countries.map((c) => `<optgroup label="${esc(c.name)}">${
      c.jurisdictions.map((j) => `<option value="${esc(j.id)}">${esc(j.name)}</option>`).join('')}</optgroup>`).join('');
    sel.value = state.jur;
    sel.onchange = () => { state.jur = sel.value; render(); };
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.onclick = () => { state.tab = b.dataset.tab; render(); };
    });
  }

  function render() {
    const m = state.merged[state.jur];
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === state.tab)));
    document.querySelectorAll('.tab').forEach((s) => { s.hidden = s.id !== 'tab-' + state.tab; });
    const j = state.manifest.jurisdictions.find((x) => x.id === state.jur);
    $('#jur-note').textContent = m.note || j.note || '';
    if (state.tab === 'lanes') renderLanes(m);
    if (state.tab === 'role') renderRole(m);
    if (state.tab === 'compare') renderCompare();
    if (state.tab === 'trends') renderTrends();
    if (state.tab === 'sources') renderSources(m);
    writeHash();
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

  function renderLanes(m) {
    renderGroupChips(m);
    const host = $('#lanes');
    host.innerHTML = '';
    const W = 1200, LABEL = 320, HEAD = 62, GH = 30;
    const ROW = m.roles.some((r) => nameEn(r)) ? 48 : 38;
    const colW = (W - LABEL - 10) / PHASES.length;
    const colX = (i) => LABEL + i * colW;
    const groups = rolesByGroup(m).filter(([g]) => !state.hiddenGroups.has(g));
    const H = HEAD + groups.reduce((a, [, rs]) => a + GH + rs.length * ROW, 0) + 10;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lanes-svg', role: 'img',
      'aria-label': `Authority lifecycle lanes for ${m.name}: for each role, when it is assigned, when authority starts, and when it ends, across the principal's phases from capable to estate closed.` });
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'ph-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'currentColor' }, mk);

    // phase columns
    PHASES.forEach((p, i) => {
      el('rect', { x: colX(i), y: 0, width: colW, height: H, fill: i % 2 ? 'var(--phase-b)' : 'var(--phase-a)' }, svg);
      txt(svg, colX(i) + colW / 2, 23, PHASE_LABEL[p], { 'text-anchor': 'middle', 'font-size': 14.5, 'font-weight': 600, fill: 'currentColor' });
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
    host.appendChild(svg);
  }

  function drawLane(svg, m, r, y, g) {
    const row = el('g', { class: 'lane-row' }, svg);
    el('rect', { class: 'lane-bg', x: 0, y, width: g.LABEL, height: g.ROW, fill: 'transparent' }, row);
    el('line', { x1: 0, y1: y + g.ROW, x2: g.W, y2: y + g.ROW, stroke: 'var(--line)', 'stroke-width': 0.6 }, row);
    const cy = y + g.ROW / 2;
    const L = r.lane;

    const link = el('a', { class: 'role-link', href: `#j=${state.jur}&tab=role&role=${encodeURIComponent(r.id)}`, tabindex: 0 }, row);
    link.addEventListener('click', (e) => { e.preventDefault(); state.role = r.id; state.tab = 'role'; render(); });
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
    sel.onchange = () => { state.role = sel.value; render(); };
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

  function wrapWords(label, width, maxLines) {
    const lines = [];
    let cur = '';
    for (const w of String(label).split(/\s+/)) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= width) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = trunc(kept[maxLines - 1] + ' ' + lines[maxLines], width);
      if (!kept[maxLines - 1].endsWith('…')) kept[maxLines - 1] = trunc(kept[maxLines - 1], width - 1) + '…';
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

    const NW = 210, GX = 314, PX = 24;
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
        const cap = trunc(pr.ts[0].event, 34);
        // Centred captions near the first/last layer would spill past the viewBox.
        const capHalf = cap.length * 3.2;
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
    const scopeSel = `<label class="field"><span>Compare</span><select id="cmp-scope">
      ${countries.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
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
      e.preventDefault(); state.jur = a.dataset.j; state.role = a.dataset.role; state.tab = 'role'; $('#jur').value = state.jur; render();
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
  load().then(() => {
    readHash();
    renderChrome();
    render();
    window.addEventListener('hashchange', () => { readHash(); $('#jur').value = state.jur; render(); });
  }).catch((e) => {
    document.querySelector('main').innerHTML = `<p>Could not load data: ${esc(e.message)}</p>`;
    console.error(e);
  });
})();
