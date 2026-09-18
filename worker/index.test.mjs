/**
 * Exercises worker/index.js without Cloudflare: node worker/index.test.mjs
 *
 * The endpoint takes text from strangers and turns it into an API call with a token, so the
 * paths that matter are the ones that refuse. GitHub and Turnstile are stubbed.
 */
import worker from './index.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ASSETS = { fetch: async () => new Response('static', { status: 200 }) };
const FULL = { ASSETS, GITHUB_TOKEN: 't', TURNSTILE_SECRET: 's', FEEDBACK_REPO: 'owner/repo' };
const post = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request('https://xebecstudios.org/research/digital-estate-roles/feedback/', { method: 'POST', body: fd });
};
const statusOf = (res) => new URL(res.headers.get('location')).pathname.split('/').filter(Boolean).pop();
const BODY = 'In New South Wales an enduring guardian may also consent to a medical procedure.';

const real = globalThis.fetch;
let calls = [];
const stub = ({ turnstile = true, github = true }) => {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: turnstile }));
    if (github === 'no-label' && JSON.parse(init.body).labels) return new Response('{}', { status: 422 });
    return new Response('{}', { status: github ? 201 : 500 });
  };
};

const tests = {
  // Not a behaviour of the script but of the routing around it, and the reason the first
  // deploy answered POSTs with 405: static assets are matched before the Worker runs, and
  // the form's own page is an asset, so the script never saw the request.
  'the form path is configured to reach the Worker at all': async () => {
    const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
    const m = toml.match(/run_worker_first\s*=\s*\[([^\]]*)\]/);
    assert.ok(m, 'assets need run_worker_first, or POSTs are answered by the asset handler');
    assert.match(m[1], /\/research\/digital-estate-roles\/feedback\//);
  },
  'GET falls through to the built files': async () => {
    const r = await worker.fetch(new Request('https://xebecstudios.org/research/digital-estate-roles/'), FULL);
    assert.equal(await r.text(), 'static');
  },
  'GET of the feedback path is the page, not the handler': async () => {
    const r = await worker.fetch(new Request('https://xebecstudios.org/research/digital-estate-roles/feedback/'), FULL);
    assert.equal(await r.text(), 'static');
  },
  'missing configuration refuses rather than silently dropping': async () => {
    const r = await worker.fetch(post({ body: BODY }), { ASSETS });
    assert.equal(statusOf(r), 'unconfigured');
  },
  'too short to act on': async () => {
    stub({});
    const r = await worker.fetch(post({ body: 'wrong' }), FULL);
    assert.equal(statusOf(r), 'short');
  },
  'honeypot is accepted and discarded': async () => {
    calls = []; stub({});
    const r = await worker.fetch(post({ body: BODY, website: 'http://spam' }), FULL);
    assert.equal(statusOf(r), 'sent');
    assert.equal(calls.length, 0, 'nothing should be filed');
  },
  'a failed Turnstile check files nothing': async () => {
    calls = []; stub({ turnstile: false });
    const r = await worker.fetch(post({ body: BODY, 'cf-turnstile-response': 'x' }), FULL);
    assert.equal(statusOf(r), 'captcha');
    assert.ok(!calls.some((c) => c.url.includes('api.github.com')));
  },
  'a missing Turnstile token files nothing': async () => {
    calls = []; stub({});
    const r = await worker.fetch(post({ body: BODY }), FULL);
    assert.equal(statusOf(r), 'captcha');
    assert.ok(!calls.some((c) => c.url.includes('api.github.com')));
  },
  'each outcome lands on its own prerendered page': async () => {
    stub({});
    const r = await worker.fetch(post({ body: 'wrong' }), FULL);
    assert.equal(new URL(r.headers.get('location')).pathname,
                 '/research/digital-estate-roles/feedback/short/');
    assert.equal(r.status, 303);
  },
  'a good submission becomes an issue': async () => {
    calls = []; stub({});
    const r = await worker.fetch(post({
      body: BODY, jurisdiction: 'au-nsw', role: 'nsw-enduring-guardian',
      page: '/research/digital-estate-roles/roles/health-care-agent/',
      source: 'https://legislation.nsw.gov.au/view/html/inforce/current/act-1987-257',
      'cf-turnstile-response': 'x',
    }), FULL);
    assert.equal(statusOf(r), 'sent');
    const gh = calls.find((c) => c.url.includes('api.github.com'));
    assert.ok(gh, 'GitHub should have been called');
    assert.equal(gh.url, 'https://api.github.com/repos/owner/repo/issues');
    assert.match(gh.init.headers.Authorization, /^Bearer /);
    const payload = JSON.parse(gh.init.body);
    assert.match(payload.title, /au-nsw/);
    assert.match(payload.body, /New South Wales/);
    assert.match(payload.body, /legislation\.nsw\.gov\.au/);
    assert.match(payload.body, /not a sourced claim/, 'the issue must say it is unverified');
  },
  'a missing label does not lose the submission': async () => {
    calls = []; stub({ github: 'no-label' });
    const r = await worker.fetch(post({ body: BODY, 'cf-turnstile-response': 'x' }), FULL);
    assert.equal(statusOf(r), 'sent');
    const gh = calls.filter((c) => c.url.includes('api.github.com'));
    assert.equal(gh.length, 2, 'should retry without the label');
    assert.ok(!JSON.parse(gh[1].init.body).labels);
  },
  'a GitHub failure is reported, not swallowed': async () => {
    stub({ github: false });
    const r = await worker.fetch(post({ body: BODY, 'cf-turnstile-response': 'x' }), FULL);
    assert.equal(statusOf(r), 'error');
  },
  'oversized input is truncated before it reaches the API': async () => {
    calls = []; stub({});
    await worker.fetch(post({ body: 'x'.repeat(50000), 'cf-turnstile-response': 'x' }), FULL);
    const gh = calls.find((c) => c.url.includes('api.github.com'));
    assert.ok(JSON.parse(gh.init.body).body.length < 5000);
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { await fn(); console.log('  ok   ', name); }
  catch (e) { failed++; console.log('  FAIL ', name, '\n         ', e.message); }
}
globalThis.fetch = real;
console.log(failed ? `\n${failed} failing` : `\n${Object.keys(tests).length} passing`);
process.exit(failed ? 1 : 0);
