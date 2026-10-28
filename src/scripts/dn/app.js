// Death Notification viewer. No dependencies.
//
// Driven by the element carrying data-dn: every element it fills is looked up
// inside that root, and data-base says where the built data lives. The same file
// runs standalone (site/index.html) and as the XebecStudios copy
// (src/scripts/dn/app.js), so keep it free of anything page-specific.
(() => {
  const root = document.querySelector('[data-dn]');
  if (!root) return;
  const BASE = root.dataset.base || 'data/';
  const $ = (s) => root.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STAGES = {
    pronounce: ['Pronounce', 'Death is verified or pronounced'],
    certify: ['Certify', 'Cause of death certified, or referred'],
    register: ['Register', 'The death is registered'],
    certificate: ['Certificate', 'Proof of death is issued'],
    government: ['Government', 'Other public bodies learn of it'],
    private: ['Private sector', 'Banks, insurers and platforms learn of it'],
    public: ['Public notice', 'Notice to the world'],
  };
  const ACTORS = {
    informant: 'Family / informant', physician: 'Physician', nurse: 'Nurse / paramedic',
    'medical-examiner': 'Medical examiner (scrutiny)', coroner: 'Coroner / ME / prosecutor', police: 'Police',
    hospital: 'Hospital / care home', 'funeral-director': 'Funeral director', registrar: 'Registrar',
    'vital-records': 'Vital records office', 'population-register': 'Population register', statistics: 'Statistics office',
    'social-security': 'Social security / pensions', tax: 'Tax authority', 'health-insurance': 'Health insurance / service',
    electoral: 'Electoral roll', passport: 'Passport office', 'vehicle-licensing': 'Driver & vehicle licensing',
    'local-government': 'Local government', 'other-government': 'Other government', courts: 'Courts / probate',
    banks: 'Banks', insurers: 'Insurers & pension funds', 'credit-bureaus': 'Credit bureaus', employer: 'Employer',
    'online-platforms': 'Online platforms', 'private-verifiers': 'Private data subscribers', public: 'The public',
  };
  const MODES = {
    automatic: 'automatic', electronic: 'electronic', 'in-person': 'in person', paper: 'on paper',
    'on-request': 'on request', mixed: 'mixed',
  };
  // Each feature: label, a one-line question, and its values in order from the most
  // to the least "the signal travels by itself". Rank drives the map's shading.
  const FEATURES = {
    governmentPropagation: ['Government propagation', 'Does registering the death tell the rest of government?',
      [['automatic', 'Automatic from registration'], ['single-request', 'One request tells many (if used)'], ['manual', 'Family tells each body']]],
    privateSectorVerification: ['Private-sector verification', 'Can banks and insurers check a death against an official source?',
      [['yes', 'Yes — general official route'], ['limited', 'Limited or sector-specific'], ['no', 'No — certificate from the family']]],
    centralPopulationRegister: ['Central population register', 'Is there a population register other bodies read from?',
      [[true, 'Yes'], [false, 'No']]],
    electronicRegistration: ['Electronic registration', 'Can a death be registered electronically?',
      [['full', 'Fully electronic'], ['partial', 'Partly'], ['none', 'Paper / in person']]],
    registrationDeadlineDays: ['Registration deadline', 'How many days after death must it be registered?', null],
    informantDuty: ['Who must register', 'Who carries the primary legal duty to register?',
      [['institution', 'Institution'], ['physician', 'Physician'], ['funeral-director', 'Funeral director'], ['relatives', 'Relatives'], ['anyone-present', 'Anyone present'], ['mixed', 'Mixed']]],
    certificateAccess: ['Certificate access', 'Who may obtain a copy of the death certificate?',
      [['open', 'Anyone'], ['tiered', 'Tiered (informational copy open)'], ['restricted', 'Restricted to relatives / interest']]],
    medicalExaminerScrutiny: ['Independent scrutiny', 'Is every certificate independently reviewed?',
      [[true, 'Yes'], [false, 'No']]],
  };
  const ADDITIVE = { privateSectorVerification: ['no', 'limited', 'yes'] };
  // How the death crosses an onward hop, and how soon a push arrives (research/SCHEMA.md).
  const DIRECTIONS = { push: 'pushed', pull: 'recipient must ask', family: 'only if the family acts', unknown: 'not recorded how' };
  const LATENCIES = { days: 'within 2 days', week: 'within a week', month: 'within a month', quarter: 'within a quarter', year: 'within a year', asap: 'as soon as practicable', unspecified: 'no cadence set in law' };
  const route = (s) => (s.needsFamily ? 'family' : s.direction);
  const DEADLINE_BINS = [[1, '1 day or less'], [3, '2–3 days'], [7, '4–7 days'], [14, '8–14 days'], [31, '15–31 days'], [Infinity, 'over a month']];

  const state = { manifest: null, world: null, cache: new Map(), jur: null, tab: 'map', feature: 'governmentPropagation', cmp: 'all' };

  async function getJSON(path) {
    const r = await fetch(BASE + path);
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.json();
  }
  async function jurisdiction(id) {
    if (!state.cache.has(id)) state.cache.set(id, getJSON(`jurisdictions/${id}.json`));
    return state.cache.get(id);
  }
  const jMeta = (id) => state.manifest.jurisdictions.find((j) => j.id === id);
  const country = (cc) => state.manifest.countries.find((c) => c.id === cc);

  // ---------- values ----------
  function valueLabel(key, v) {
    if (v === null || v === undefined) return 'not established';
    if (key === 'registrationDeadlineDays') return v === 1 ? '1 day' : `${v} days`;
    const opts = FEATURES[key]?.[2];
    const hit = opts && opts.find(([x]) => x === v);
    return hit ? hit[1] : String(v);
  }
  // 0 (least) .. 1 (most) for shading; null when not established.
  function valueRank(key, v) {
    if (v === null || v === undefined) return null;
    if (key === 'registrationDeadlineDays') {
      const i = DEADLINE_BINS.findIndex(([max]) => v <= max);
      return 1 - i / (DEADLINE_BINS.length - 1);
    }
    const opts = FEATURES[key][2];
    const i = opts.findIndex(([x]) => x === v);
    if (i < 0 || key === 'informantDuty') return i < 0 ? null : 0.6;
    return opts.length === 1 ? 1 : 1 - i / (opts.length - 1);
  }
  const shade = (rank) => (rank === null ? null : 0.18 + 0.8 * rank);

  // A country's value for a feature: one value if every jurisdiction agrees, else 'varies'.
  function countryValue(c, key) {
    const js = c.jurisdictions.map(jMeta).filter((j) => j.level !== 'model');
    const own = js.filter((j) => j.level !== 'federal');
    const vals = (own.length ? own : js).map((j) => j.features[key]).filter((v) => v !== null && v !== undefined);
    if (!vals.length) return { v: null };
    const uniq = [...new Set(vals.map((v) => JSON.stringify(v)))];
    return uniq.length === 1 ? { v: vals[0] } : { varies: true, vals };
  }

  // ---------- hash ----------
  // The hash holds only what differs from the defaults, so a plain visit keeps a plain URL
  // (writing the defaults back made /research/death-notification/ look like a redirect).
  const DEFAULTS = { tab: 'map', feature: 'governmentPropagation', jur: null };
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.jur = p.get('j') && jMeta(p.get('j')) ? p.get('j') : DEFAULTS.jur;
    state.tab = p.get('t') || DEFAULTS.tab;
    state.feature = p.get('f') && FEATURES[p.get('f')] ? p.get('f') : DEFAULTS.feature;
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.jur && state.jur !== DEFAULTS.jur) p.set('j', state.jur);
    if (state.tab !== DEFAULTS.tab) p.set('t', state.tab);
    if (state.tab === 'map' && state.feature !== DEFAULTS.feature) p.set('f', state.feature);
    const h = p.toString();
    if (h !== location.hash.slice(1)) history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }

  // ---------- chrome ----------
  function renderPicker() {
    const sel = $('#jur');
    sel.innerHTML = state.manifest.countries.map((c) => {
      const js = c.jurisdictions.map(jMeta);
      if (js.length === 1) return `<option value="${esc(js[0].id)}">${esc(c.name)}</option>`;
      return `<optgroup label="${esc(c.name)}">${js.map((j) => `<option value="${esc(j.id)}">${esc(j.name)}</option>`).join('')}</optgroup>`;
    }).join('');
    sel.value = state.jur;
    sel.onchange = () => { state.jur = sel.value; if (state.tab === 'map' || state.tab === 'trends') state.tab = 'chain'; render(); };
  }
  function render() {
    root.querySelectorAll('.tabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === state.tab)));
    root.querySelectorAll('section.tab').forEach((s) => { s.hidden = s.id !== `tab-${state.tab}`; });
    $('#jur').value = state.jur;
    writeHash();
    const r = { map: renderMap, chain: renderChain, compare: renderCompare, trends: renderTrends, sources: renderSources }[state.tab];
    if (r) Promise.resolve(r()).catch((e) => { console.error(e); });
    renderNote();
  }
  async function renderNote() {
    const box = $('#jur-note');
    if (state.tab === 'map' || state.tab === 'trends' || state.tab === 'compare') { box.textContent = ''; return; }
    const j = await jurisdiction(state.jur);
    box.textContent = j.note || '';
  }

  // ---------- map ----------
  function pathExtent(d) {
    const n = d.match(/-?\d+/g) || [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i + 1 < n.length; i += 2) {
      const x = +n[i], y = +n[i + 1];
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return x0 === Infinity ? null : { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  function mainRing(d) {
    let best = null;
    for (const seg of String(d).split('M')) {
      const e = seg && pathExtent(seg);
      if (e && (!best || e.w * e.h > best.w * best.h)) best = e;
    }
    return best;
  }
  function el(name, attrs = {}, parent) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  }

  function renderMap() {
    const key = state.feature;
    const fsel = $('#map-feature');
    fsel.innerHTML = Object.entries(FEATURES).map(([k, f]) => `<option value="${k}">${esc(f[0])}</option>`).join('');
    fsel.value = key;
    fsel.onchange = () => { state.feature = fsel.value; render(); };
    $('#map-question').textContent = FEATURES[key][1];

    const covered = state.manifest.countries;
    const readout = $('#map-readout');
    const idle = `${covered.length} countries · ${state.manifest.jurisdictions.length} jurisdictions. Select one to open its signal chain.`;
    const describe = (c) => {
      const cv = countryValue(c, key);
      if (cv.varies) {
        const parts = c.jurisdictions.map(jMeta).filter((j) => j.level === 'subnational' || j.level === 'national')
          .map((j) => `${j.name}: ${valueLabel(key, j.features[key])}`);
        return `${c.name} — varies. ${parts.join('; ')}`;
      }
      return `${c.name} — ${valueLabel(key, cv.v)}`;
    };
    const say = (s) => { readout.textContent = s || idle; };
    say();

    // Legend
    const opts = key === 'registrationDeadlineDays' ? DEADLINE_BINS.map(([max, l]) => [max === Infinity ? 365 : max, l]) : FEATURES[key][2];
    $('#map-legend').innerHTML = opts.map(([v, l]) => {
      const op = shade(valueRank(key, v));
      return `<span><i class="sw" style="--o:${op}"></i>${esc(l)}</span>`;
    }).join('') + '<span><i class="sw sw-varies"></i>varies within the country</span><span><i class="sw sw-null"></i>not established</span>';

    const box = $('#map');
    box.innerHTML = '';
    const w = state.world;
    if (w) {
      const svg = el('svg', { viewBox: w.viewBox, class: 'worldmap', role: 'group', 'aria-label': `Map: ${FEATURES[key][0]}` }, box);
      const defs = el('defs', {}, svg);
      const pat = el('pattern', { id: 'dn-varies', width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      el('rect', { width: 18, height: 18, class: 'm-varies-bg' }, pat);
      el('line', { x1: 0, y1: 0, x2: 0, y2: 18, class: 'm-varies-line' }, pat);
      const byIso = new Set(covered.map((c) => c.iso));
      const rest = Object.entries(w.paths).filter(([iso]) => !byIso.has(iso)).map(([, v]) => v.d).join('');
      if (rest) el('path', { d: rest, class: 'm-rest' }, svg);
      for (const c of covered) {
        const shape = w.paths[c.iso], pt = w.points[c.iso];
        if (!shape && !pt) continue;
        const cv = countryValue(c, key);
        const g = el('g', { class: 'm-country', tabindex: '0', role: 'link', 'aria-label': describe(c) }, svg);
        el('title', {}, g).textContent = describe(c);
        const fillAttrs = cv.varies ? { class: 'm-fill m-var' }
          : cv.v === null ? { class: 'm-fill m-null' }
          : { class: 'm-fill', style: `fill-opacity:${shade(valueRank(key, cv.v))}` };
        let ring = null;
        if (shape) { el('path', { d: shape.d, ...fillAttrs }, g); ring = mainRing(shape.d); }
        if (!ring || ring.w < 35 || ring.h < 35) {
          el('circle', { cx: pt ? pt.x : ring.cx, cy: pt ? pt.y : ring.cy, r: 26, ...fillAttrs, class: fillAttrs.class + ' m-dot' }, g);
        }
        const open = () => openCountry(c);
        g.addEventListener('click', open);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        const hi = () => say(describe(c));
        g.addEventListener('mouseenter', hi); g.addEventListener('mouseleave', () => say());
        g.addEventListener('focusin', hi); g.addEventListener('focusout', () => say());
      }
    }
    // The list: several covered countries are a dot at this scale.
    const regions = [];
    for (const c of covered) {
      let g = regions.find((x) => x.region === c.region);
      if (!g) regions.push((g = { region: c.region, items: [] }));
      g.items.push(c);
    }
    const list = $('#map-list');
    list.innerHTML = regions.map((g) => `<div class="map-region"><h3>${esc(g.region)}</h3><div class="chips">${
      g.items.map((c) => `<button type="button" class="chip" data-country="${esc(c.id)}">${esc(c.name)}${
        c.jurisdictions.length > 1 ? `<span class="n">${c.jurisdictions.length}</span>` : ''}</button>`).join('')}</div></div>`).join('');
    list.querySelectorAll('button[data-country]').forEach((b) => {
      const c = country(b.dataset.country);
      b.onclick = () => openCountry(c);
      b.onmouseenter = () => say(describe(c));
      b.onmouseleave = () => say();
    });
  }
  function openCountry(c) {
    const js = c.jurisdictions.map(jMeta);
    // Open a place where deaths are actually registered, not the federal layer.
    state.jur = (js.find((j) => j.level === 'subnational' || j.level === 'national') || js[0]).id;
    state.tab = 'chain';
    render();
  }

  // ---------- signal chain ----------
  async function chainData(id) {
    const j = await jurisdiction(id);
    const layer = j.layer && jMeta(j.layer) ? await jurisdiction(j.layer) : null;
    const cites = new Map();
    for (const c of (layer?.citations || [])) cites.set(`${layer.jurisdiction}:${c.id}`, c);
    for (const c of (j.citations || [])) cites.set(`${j.jurisdiction}:${c.id}`, c);
    const steps = [
      ...(j.steps || []).map((s) => ({ ...s, origin: j.jurisdiction, originName: j.name })),
      ...(layer?.steps || []).map((s) => ({ ...s, origin: layer.jurisdiction, originName: layer.name, fromLayer: true })),
    ];
    const features = { ...(layer?.features || {}) };
    for (const [k, v] of Object.entries(j.features || {})) {
      const order = ADDITIVE[k], base = features[k];
      // A state adds to a national route, never removes one (mirrors combine() in build.py).
      const keepLayer = base && (v.value === null || v.value === undefined
        || (order && order.includes(base.value) && order.includes(v.value) && order.indexOf(base.value) > order.indexOf(v.value)));
      if (!keepLayer) features[k] = { ...v, origin: j.jurisdiction };
    }
    for (const [k, v] of Object.entries(features)) if (!v.origin) v.origin = layer.jurisdiction;
    return { j, layer, steps, cites, features };
  }
  const citeFor = (d, origin, id) => d.cites.get(`${origin}:${id}`);
  function citeLinks(d, origin, ids) {
    return (ids || []).map((id) => {
      const c = citeFor(d, origin, id);
      if (!c) return esc(id);
      return `<a href="${esc(c.url)}" target="_blank" rel="noopener" title="${esc(c.title || '')}">${esc(c.cite)}</a>`;
    }).join('; ');
  }

  async function renderChain() {
    const id = state.jur;
    const d = await chainData(id);
    if (id !== state.jur) return;
    const byStage = Object.keys(STAGES).map((st) => ({ st, steps: d.steps.filter((s) => s.stage === st) }));

    // Pipeline strip: one box per stage, with the shortest deadline and whether anything moves on its own.
    $('#pipeline').innerHTML = byStage.map(({ st, steps }) => {
      const dls = steps.map((s) => s.deadline?.days).filter((x) => typeof x === 'number');
      const auto = steps.some((s) => s.mode === 'automatic');
      const empty = !steps.length;
      return `<a class="stage${empty ? ' empty' : ''}${auto ? ' auto' : ''}" href="#" data-stage="${st}">
        <span class="k">${esc(STAGES[st][0])}</span>
        <span class="n">${steps.length ? `${steps.length} step${steps.length > 1 ? 's' : ''}` : 'none recorded'}</span>
        ${dls.length ? `<span class="dl">within ${Math.min(...dls)} d</span>` : ''}
        ${auto ? '<span class="dl">automatic</span>' : ''}
      </a>`;
    }).join('<span class="arrow" aria-hidden="true">→</span>');
    $('#pipeline').querySelectorAll('[data-stage]').forEach((a) => a.onclick = (e) => {
      e.preventDefault();
      root.querySelector(`#st-${a.dataset.stage}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    renderWhoKnows(d);

    $('#chain').innerHTML = byStage.map(({ st, steps }) => `
      <section class="stage-block" id="st-${st}">
        <h3>${esc(STAGES[st][0])} <span class="muted">· ${esc(STAGES[st][1])}</span></h3>
        ${steps.length ? steps.map((s) => stepCard(d, s)).join('') : '<p class="muted">Nothing recorded for this stage.</p>'}
      </section>`).join('');
  }

  function stepCard(d, s) {
    const badges = [
      `<span class="badge mode-${esc(s.mode)}">${esc(MODES[s.mode] || s.mode)}</span>`,
      `<span class="badge ob-${esc(s.obligation)}">${esc({ mandatory: 'legal duty', optional: 'permitted', service: 'official service' }[s.obligation] || s.obligation)}</span>`,
      s.direction ? `<span class="badge dir-${esc(route(s))}">${esc(s.needsFamily ? 'pushed, once the family uses the service' : DIRECTIONS[s.direction] || s.direction)}</span>` : '',
      s.latency ? `<span class="badge">${esc(LATENCIES[s.latency] || s.latency)}</span>` : '',
      s.deadline ? `<span class="badge dl">${esc(s.deadline.text)}</span>` : '',
      s.fromLayer ? `<span class="badge layer">${esc(s.originName)}</span>` : '',
      s.unverified ? '<span class="badge unv">unverified</span>' : '',
    ].join('');
    return `<article class="step${s.unverified ? ' unv' : ''}${s.mode === 'automatic' ? ' auto' : ''}">
      <div class="hop"><span class="actor">${esc(ACTORS[s.from] || s.from)}</span><span class="arr" aria-label="tells">→</span><span class="actor">${esc(ACTORS[s.to] || s.to)}</span></div>
      <h4>${esc(s.title)}${s.localName ? ` <span class="local">${esc(s.localName)}</span>` : ''}</h4>
      <div class="badges">${badges}</div>
      ${s.summary ? `<p>${esc(s.summary)}</p>` : ''}
      ${s.who ? `<p class="small"><span class="lbl">Who</span> ${esc(s.who)}</p>` : ''}
      ${s.trigger ? `<p class="small"><span class="lbl">Trigger</span> ${esc(s.trigger)}</p>` : ''}
      ${s.citations?.length ? `<p class="small cites"><span class="lbl">Source</span> ${citeLinks(d, s.origin, s.citations)}</p>` : ''}
      ${s.latencyNote ? `<p class="small"><span class="lbl">Cadence</span> ${esc(LATENCIES[s.latency] || s.latency)}: ${latencyNote(d, s)}</p>` : ''}
    </article>`;
  }
  // A latencyNote ends with its citation id in brackets; link it when the id is the step's own.
  function latencyNote(d, s) {
    const m = s.latencyNote.match(/^(.*)\(([^()]+)\)\s*$/);
    if (m && citeFor(d, s.origin, m[2].trim())) return `“${esc(m[1].trim())}” (${citeLinks(d, s.origin, [m[2].trim()])})`;
    return esc(s.latencyNote);
  }

  // Who ends up knowing, and how: one row per recipient in the government, private and
  // public stages. This is the question the project exists for.
  function renderWhoKnows(d) {
    const rows = new Map();
    for (const s of d.steps) {
      if (!['government', 'private', 'public'].includes(s.stage)) continue;
      if (!rows.has(s.to)) rows.set(s.to, []);
      rows.get(s.to).push(s);
    }
    const rank = (s) => ({ push: 0, pull: 1, family: 2, unknown: 3 }[route(s)] ?? 4);
    const ordered = [...rows.entries()].sort((a, b) => Math.min(...a[1].map(rank)) - Math.min(...b[1].map(rank)));
    const how = (s) => {
      if (s.needsFamily) return ['svc', 'sent, once the family uses the service'];
      if (s.direction === 'push') return ['auto', 'sent to them'];
      if (s.direction === 'pull') return ['req', 'must ask or check'];
      if (s.direction === 'family') {
        if (s.obligation === 'service') return ['svc', 'family, through an official service'];
        return ['fam', s.obligation === 'mandatory' ? 'family must tell them' : 'only if the family tells them'];
      }
      return ['opt', 'not recorded how'];
    };
    const box = $('#who-knows');
    if (!ordered.length) { box.innerHTML = '<p class="muted">No onward notification recorded yet.</p>'; return; }
    box.innerHTML = `<table class="who"><thead><tr><th>Who learns of the death</th><th>How</th><th>When</th><th>Source</th></tr></thead><tbody>${
      ordered.map(([to, ss]) => ss.map((s, i) => {
        const [cls, label] = how(s);
        return `<tr class="${s.unverified ? 'unv' : ''}">${i === 0 ? `<td rowspan="${ss.length}"><b>${esc(ACTORS[to] || to)}</b></td>` : ''}
          <td><span class="how how-${cls}">${esc(label)}</span><div class="small muted">${esc(s.title)}</div></td>
          <td class="small">${esc(s.deadline?.text || LATENCIES[s.latency] || '—')}</td>
          <td class="small cites">${citeLinks(d, s.origin, s.citations) || (s.unverified ? '<i>unverified</i>' : '')}</td></tr>`;
      }).join('')).join('')}</tbody></table>`;
  }

  // ---------- compare ----------
  function renderCompare() {
    const sel = $('#cmp-country');
    sel.innerHTML = '<option value="all">All countries</option>' + state.manifest.countries
      .filter((c) => c.jurisdictions.length > 1).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    sel.value = state.cmp;
    sel.onchange = () => { state.cmp = sel.value; renderCompare(); };
    const js = state.manifest.jurisdictions.filter((j) => j.level !== 'model' && j.level !== 'federal' && (state.cmp === 'all' || j.country === state.cmp));
    const keys = Object.keys(FEATURES);
    $('#compare').innerHTML = `<table class="cmp"><thead><tr><th>Jurisdiction</th>${keys.map((k) => `<th title="${esc(FEATURES[k][1])}">${esc(FEATURES[k][0])}</th>`).join('')}<th>Steps</th></tr></thead><tbody>${
      js.map((j) => `<tr><td><a href="#" data-j="${j.id}">${esc(j.name)}</a>${j.country !== 'us' && country(j.country).jurisdictions.length > 1 ? '' : ''}</td>${
        keys.map((k) => {
          const v = j.features[k];
          const r = valueRank(k, v);
          return `<td class="${v === null || v === undefined ? 'muted' : ''}"><span class="cell" style="--o:${r === null ? 0 : shade(r)}"></span>${esc(valueLabel(k, v))}</td>`;
        }).join('')}<td class="num">${j.steps}</td></tr>`).join('')}</tbody></table>`;
    $('#compare').querySelectorAll('a[data-j]').forEach((a) => a.onclick = (e) => { e.preventDefault(); state.jur = a.dataset.j; state.tab = 'chain'; render(); });
  }

  // ---------- pop-ups ----------
  // One pop-up serves every chart on the Trends tab. A bar carries data-pop="<key>"; its
  // content lives in POPS, so the markup stays small and nothing is escaped twice. Hover,
  // keyboard focus and tap all open it, so it works on touch screens as well.
  const POPS = new Map();
  let popSeq = 0;
  function popAttr(html) {
    const k = `p${++popSeq}`;
    POPS.set(k, html);
    return `data-pop="${k}" tabindex="0"`;
  }
  const jName = (id) => jMeta(id)?.name || id;
  function popNames(title, js) {
    const names = js.map((j) => (typeof j === 'string' ? jName(j) : j.name)).sort((a, b) => a.localeCompare(b));
    return `<b>${esc(title)}</b> <span class="muted">· ${names.length}</span>${names.length ? `<p>${esc(names.join(', '))}</p>` : ''}`;
  }
  function popSteps(title, rows, cap = 12) {
    const sorted = rows.slice().sort((a, b) => jName(a[0]).localeCompare(jName(b[0])));
    const shown = sorted.slice(0, cap).map(([j, t]) => `<li><b>${esc(jName(j))}</b> ${esc(t)}</li>`).join('');
    return `<b>${esc(title)}</b> <span class="muted">· ${rows.length}</span><ul>${shown}</ul>${rows.length > cap ? `<p class="muted">and ${rows.length - cap} more; each jurisdiction's signal chain lists its own</p>` : ''}`;
  }
  function setupPop() {
    const box = document.createElement('div');
    box.className = 'dn-pop';
    box.setAttribute('role', 'tooltip');
    box.hidden = true;
    root.appendChild(box);
    let current = null;
    const place = (x, y) => {
      const r = box.getBoundingClientRect();
      box.style.left = `${Math.max(8, Math.min(x + 14, innerWidth - r.width - 8))}px`;
      box.style.top = `${y + 18 + r.height > innerHeight ? Math.max(8, y - r.height - 12) : y + 18}px`;
    };
    const show = (el, x, y) => {
      const html = POPS.get(el.dataset.pop);
      if (!html) return;
      current = el;
      box.innerHTML = html;
      box.hidden = false;
      if (x === undefined) { const r = el.getBoundingClientRect(); x = r.left + Math.min(r.width / 2, 120); y = r.bottom - 10; }
      place(x, y);
    };
    const hide = () => { box.hidden = true; current = null; };
    root.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-pop]'); if (el && e.pointerType === 'mouse') show(el, e.clientX, e.clientY); });
    root.addEventListener('pointermove', (e) => { if (current && e.pointerType === 'mouse') place(e.clientX, e.clientY); });
    root.addEventListener('pointerout', (e) => { const el = e.target.closest('[data-pop]'); if (el && el === current && !el.contains(e.relatedTarget)) hide(); });
    root.addEventListener('focusin', (e) => { const el = e.target.closest('[data-pop]'); if (el) show(el); });
    root.addEventListener('focusout', (e) => { if (e.target.closest('[data-pop]')) hide(); });
    // A tap focuses the bar (which opens the pop-up) before its click arrives, so decide
    // the toggle from whether it was open when the finger came down, not when the click lands.
    let openAtDown = null;
    root.addEventListener('pointerdown', (e) => { openAtDown = current; });
    root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-pop]');
      if (!el) { if (current) hide(); return; }
      if (e.pointerType !== 'mouse' && openAtDown === el) hide(); else show(el, e.clientX || undefined, e.clientY || undefined);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    addEventListener('scroll', hide, { passive: true });
  }

  // ---------- trends ----------
  function renderTrends() {
    POPS.clear();
    const js = state.manifest.jurisdictions.filter((j) => j.level === 'national' || j.level === 'subnational');
    const total = js.length;
    const steps = state.manifest.jurisdictions.reduce((a, j) => a + j.steps, 0);
    const cites = state.manifest.jurisdictions.reduce((a, j) => a + j.citations, 0);
    const auto = js.filter((j) => j.features.governmentPropagation === 'automatic').length;
    const priv = js.filter((j) => j.features.privateSectorVerification === 'yes').length;
    let html = `<div class="stat-row">
      <div class="stat"><div class="v">${total}</div><div class="muted">jurisdictions where deaths are registered</div></div>
      <div class="stat"><div class="v">${auto}</div><div class="muted">where registering the death is enough to tell the rest of government</div></div>
      <div class="stat"><div class="v">${priv}</div><div class="muted">with a general official route for the private sector to check a death</div></div>
      <div class="stat"><div class="v">${steps}</div><div class="muted">recorded steps, from ${cites} citations</div></div>
    </div>`;
    html += pushPull(js);
    for (const [k, f] of Object.entries(FEATURES)) {
      if (k === 'registrationDeadlineDays') continue;
      const counts = f[2].map(([v, l]) => ({ v, l, n: js.filter((j) => j.features[k] === v).length }));
      const none = js.filter((j) => j.features[k] === null || j.features[k] === undefined).length;
      html += `<div class="card"><h3>${esc(f[0])}</h3><p class="muted small">${esc(f[1])}</p><div class="bars">${
        counts.map((c) => bar(c.l, c.n, total, shade(valueRank(k, c.v)), js.filter((j) => j.features[k] === c.v))).join('')}${
        none ? bar('not established', none, total, 0, js.filter((j) => j.features[k] === null || j.features[k] === undefined)) : ''}</div></div>`;
    }
    // Deadline: one dot per jurisdiction on a log-ish day axis.
    const dl = js.filter((j) => typeof j.features.registrationDeadlineDays === 'number')
      .sort((a, b) => a.features.registrationDeadlineDays - b.features.registrationDeadlineDays);
    html += `<div class="card"><h3>Registration deadline</h3><p class="muted small">Days from death by which the death must be registered, where the law sets a general deadline.</p>
      <table class="dl-table">${dl.map((j) => {
        const v = j.features.registrationDeadlineDays;
        const pct = Math.min(100, (Math.log(v + 1) / Math.log(61)) * 100);
        return `<tr><td class="small"><a href="#" data-j="${j.id}">${esc(j.name)}</a></td><td class="num small">${v} d</td><td class="dl-track"><span style="width:${pct}%"></span></td></tr>`;
      }).join('')}</table></div>`;
    const box = $('#trends');
    box.innerHTML = html;
    box.querySelectorAll('a[data-j]').forEach((a) => a.onclick = (e) => { e.preventDefault(); state.jur = a.dataset.j; state.tab = 'chain'; render(); });
  }
  // Pushed, pulled or left to the family. Everything here is computed from the manifest
  // (flow.recipients per jurisdiction, meta.flowTotals over unique steps), so it cannot go stale.
  const ROUTE_LABEL = { push: 'pushed to them', pull: 'they must ask or check', family: 'only if the family acts', unknown: 'not recorded how' };
  const ROUTE_OP = { push: 0.95, pull: 0.55, family: 0.22, unknown: 0.08 };
  function pushPull(js) {
    const T = state.manifest.meta.flowTotals;
    if (!T) return '';
    const PRIV = new Set(state.manifest.meta.privateActors);
    const pct = (o, k) => { const n = Object.values(o).reduce((a, b) => a + b, 0); return n ? Math.round((100 * o[k]) / n) : 0; };
    const reach = (to) => {
      const c = { push: [], pull: [], family: [], unknown: [], none: [] };
      for (const j of js) c[j.flow?.recipients?.[to] || 'none'].push(j);
      return c;
    };
    const privRoute = (j) => {
      const rs = Object.entries(j.flow?.recipients || {}).filter(([to]) => PRIV.has(to)).map(([, r]) => r);
      return ['push', 'pull', 'family', 'unknown'].find((r) => rs.includes(r)) || 'none';
    };
    const pr = { push: [], pull: [], family: [], unknown: [], none: [] };
    for (const j of js) pr[privRoute(j)].push(j);
    const ss = reach('social-security'), el = reach('electoral'), tx = reach('tax');
    const names = (a) => a.map((j) => j.name).join(', ');
    const n = js.length;
    let h = `<div class="card"><h3>Pushed, pulled, or left to the family</h3>
      <p>Once a death is registered, the state mostly <b>sends</b> it to the rest of government: ${T.government.push} of the
      ${Object.values(T.government).reduce((a, b) => a + b, 0)} recorded hops into public bodies are pushes (${pct(T.government, 'push')}%).
      The private sector is the reverse. Of ${Object.values(T.private).reduce((a, b) => a + b, 0)} hops to banks, insurers and other private bodies,
      ${T.private.pull} are routes the recipient has to <b>pull</b>: a query, a register match or a purchased file (${pct(T.private, 'pull')}%).
      ${T.private.family} depend on the family presenting a certificate (${pct(T.private, 'family')}%), and only ${T.private.push} are pushes (${pct(T.private, 'push')}%).</p>
      <p>By jurisdiction: the pension or benefits agency is sent the death in ${ss.push.length} of ${n}; the electoral roll in ${el.push.length};
      the tax authority in only ${tx.push.length}. ${pr.push.length} push deaths to a private recipient at all${pr.push.length ? ` (${esc(names(pr.push))})` : ''}, mostly through
      subscriptions or systematic supply from the population register. ${pr.pull.length} offer the private sector only a pull route; in
      ${pr.family.length} it learns only from the family${pr.none.length ? `, and ${pr.none.length} record no route to private bodies at all (${esc(names(pr.none))})` : ''}.</p>
      <p class="muted small">A push here is a hop, and its cadence matters. Of the ${Object.values(T.pushLatency).reduce((a, b) => a + b, 0)} pushes,
      ${T.pushLatency.days} arrive within two days and ${T.pushLatency.asap} "as soon as practicable"; ${T.pushLatency.week} within a week;
      ${T.pushLatency.month} in a monthly batch; ${T.pushLatency.quarter + T.pushLatency.year} quarterly or yearly. For ${T.pushLatency.unspecified} the law
      obliges the sender to pass the death on but sets no time at all${T.pushLatency.none ? `, and ${T.pushLatency.none} could not be established because their sources were unreachable` : ''}.
      A push that only happens because the family used Tell Us Once or Québec's simplified transmission is counted as the family's.</p>`;
    h += '<h4>Who is sent the death, by jurisdiction</h4>';
    const row = (label, c) => `<div class="pp-row"><span class="l">${esc(label)}</span><span class="pp-bar">${
      ['push', 'pull', 'family', 'unknown', 'none'].map((k) => c[k].length ? `<span style="flex:${c[k].length};--o:${ROUTE_OP[k] ?? 0}" class="pp-${k}" ${popAttr(popNames(`${label}: ${ROUTE_LABEL[k] || 'no route recorded'}`, c[k]))}>${c[k].length}</span>` : '').join('')}</span></div>`;
    h += `<div class="pp">${row('Pension / benefits', ss)}${row('Electoral roll', el)}${row('Tax authority', tx)}${row('Health insurance / service', reach('health-insurance'))}${row('Passport office', reach('passport'))}${row('Driver & vehicle licensing', reach('vehicle-licensing'))}${row('Any private recipient', pr)}</div>
      <div class="map-legend">${['push', 'pull', 'family', 'unknown'].map((k) => `<span><i class="sw" style="--o:${ROUTE_OP[k]}"></i>${esc(ROUTE_LABEL[k])}</span>`).join('')}<span><i class="sw sw-null"></i>no route recorded</span></div>`;
    const lat = T.pushLatency, lt = Object.values(lat).reduce((a, b) => a + b, 0);
    h += `<h4>How soon a push arrives</h4><div class="bars">${
      [['days', 'within 2 days'], ['asap', 'as soon as practicable'], ['week', 'within a week'], ['month', 'within a month'], ['quarter', 'within a quarter'], ['year', 'within a year'], ['unspecified', 'law sets no cadence'], ['none', 'source could not be read']]
        .filter(([k]) => lat[k] || k !== 'none')
        .map(([k, l]) => bar(l, lat[k] || 0, lt, k === 'none' || k === 'unspecified' ? 0.1 : 0.95 - 0.13 * ['days', 'asap', 'week', 'month', 'quarter', 'year'].indexOf(k), null,
          popSteps({ asap: 'Pushes due "as soon as practicable"', unspecified: 'Pushes where the law sets no time', none: 'Pushes whose source could not be read' }[k] || `Pushes that arrive ${l}`, (T.pushLatencySteps || {})[k] || []))).join('')}</div></div>`;
    return h;
  }
  // A bar with a pop-up: the jurisdictions it counts, or (for the cadence chart) the steps.
  function bar(label, n, total, op, js, popHtml) {
    const pct = total ? (n / total) * 100 : 0;
    const pop = popHtml || (js ? popNames(label, js) : '');
    return `<div class="bar"${n && pop ? ` ${popAttr(pop)}` : ''}><span class="l">${esc(label)}</span><span class="track"><span style="width:${pct}%;--o:${op || 0.12}"></span></span><span class="num">${n}</span></div>`;
  }

  // ---------- sources ----------
  async function renderSources() {
    const id = state.jur;
    const d = await chainData(id);
    if (id !== state.jur) return;
    const block = (j) => {
      if (!j) return '';
      const list = (j.citations || []).slice().sort((a, b) => a.cite.localeCompare(b.cite));
      return `<h3>${esc(j.name)}</h3>
        <ol class="cite-list">${list.map((c) => `<li class="cite"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.cite)}</a>${c.title ? ` — ${esc(c.title)}` : ''}
          <span class="muted">(${esc(c.kind)}, retrieved ${esc(c.retrieved)})</span>${c.quote ? `<blockquote${c.lang ? ` lang="${esc(c.lang)}"` : ''}>${esc(c.quote)}</blockquote>` : ''}</li>`).join('')}</ol>
        ${(j.gaps || []).length ? `<h4>Gaps</h4><ul class="gaps">${j.gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}`;
    };
    const feats = Object.entries(FEATURES).map(([k, f]) => {
      const v = d.features[k];
      if (!v) return '';
      return `<tr class="${v.unverified ? 'unv' : ''}"><td>${esc(f[0])}</td><td>${esc(valueLabel(k, v.value))}${v.name ? ` <span class="muted">(${esc(v.name)})</span>` : ''}${v.note ? `<div class="small muted">${esc(v.note)}</div>` : ''}</td><td class="small cites">${citeLinks(d, v.origin, v.citations)}</td></tr>`;
    }).join('');
    $('#sources').innerHTML = `<h3>Features</h3><table class="feat"><tbody>${feats}</tbody></table>${block(d.j)}${block(d.layer)}`;
  }

  // ---------- boot ----------
  async function load() {
    state.manifest = await getJSON('manifest.json');
    try { state.world = await getJSON('world.json'); } catch (e) { console.warn('no map geometry', e); }
    const first = state.manifest.jurisdictions.find((j) => j.id === 'uk-ew') || state.manifest.jurisdictions[0];
    DEFAULTS.jur = first?.id;
    readHash();
    renderPicker();
    setupPop();
    root.querySelectorAll('.tabs [data-tab]').forEach((b) => b.onclick = () => { state.tab = b.dataset.tab; render(); });
    window.addEventListener('hashchange', () => { readHash(); render(); });
    render();
  }
  load().catch((e) => { root.querySelector('#jur-note').textContent = `Could not load the data: ${e.message}`; });
})();
