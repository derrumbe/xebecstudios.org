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
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('j') && jMeta(p.get('j'))) state.jur = p.get('j');
    if (p.get('t')) state.tab = p.get('t');
    if (p.get('f') && FEATURES[p.get('f')]) state.feature = p.get('f');
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.jur) p.set('j', state.jur);
    p.set('t', state.tab);
    if (state.tab === 'map') p.set('f', state.feature);
    history.replaceState(null, '', '#' + p.toString());
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
    </article>`;
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
    const rank = (s) => (s.mode === 'automatic' ? 0 : s.obligation === 'mandatory' ? 1 : s.obligation === 'service' ? 2 : 3);
    const ordered = [...rows.entries()].sort((a, b) => Math.min(...a[1].map(rank)) - Math.min(...b[1].map(rank)));
    const how = (s) => {
      if (s.mode === 'automatic') return ['auto', 'told automatically'];
      if (s.from === 'informant') {
        if (s.obligation === 'service') return ['svc', 'family, through an official service'];
        return ['fam', s.obligation === 'mandatory' ? 'family must tell them' : 'only if the family tells them'];
      }
      if (s.mode === 'on-request') return ['req', 'can check on request'];
      if (s.obligation === 'mandatory') return ['duty', `${ACTORS[s.from] || s.from} must tell them`];
      return ['opt', `${ACTORS[s.from] || s.from} may tell them`];
    };
    const box = $('#who-knows');
    if (!ordered.length) { box.innerHTML = '<p class="muted">No onward notification recorded yet.</p>'; return; }
    box.innerHTML = `<table class="who"><thead><tr><th>Who learns of the death</th><th>How</th><th>When</th><th>Source</th></tr></thead><tbody>${
      ordered.map(([to, ss]) => ss.map((s, i) => {
        const [cls, label] = how(s);
        return `<tr class="${s.unverified ? 'unv' : ''}">${i === 0 ? `<td rowspan="${ss.length}"><b>${esc(ACTORS[to] || to)}</b></td>` : ''}
          <td><span class="how how-${cls}">${esc(label)}</span><div class="small muted">${esc(s.title)}</div></td>
          <td class="small">${esc(s.deadline?.text || '—')}</td>
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

  // ---------- trends ----------
  function renderTrends() {
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
  function bar(label, n, total, op, js) {
    const pct = total ? (n / total) * 100 : 0;
    const names = js.map((j) => j.name).join(', ');
    return `<div class="bar" title="${esc(names)}"><span class="l">${esc(label)}</span><span class="track"><span style="width:${pct}%;--o:${op || 0.12}"></span></span><span class="num">${n}</span></div>`;
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
    state.jur = first?.id;
    readHash();
    renderPicker();
    root.querySelectorAll('.tabs [data-tab]').forEach((b) => b.onclick = () => { state.tab = b.dataset.tab; render(); });
    window.addEventListener('hashchange', () => { readHash(); render(); });
    render();
  }
  load().catch((e) => { root.querySelector('#jur-note').textContent = `Could not load the data: ${e.message}`; });
})();
