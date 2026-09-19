/**
 * Exercises worker/index.js without Cloudflare: node worker/index.test.mjs
 *
 * The endpoint takes text from strangers and turns it into an API call with a token, so the
 * paths that matter are the ones that refuse. GitHub and Turnstile are stubbed.
 */
import worker, { __test } from './index.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';

const ASSETS = { fetch: async () => new Response('static', { status: 200 }) };
// Generated per run rather than committed: a private key in the repository, even a
// throwaway one, is the kind of thing secret scanners and future readers rightly distrust.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PKCS1 = privateKey.export({ type: 'pkcs1', format: 'pem' });
const PKCS8 = privateKey.export({ type: 'pkcs8', format: 'pem' });
const FULL = { ASSETS, GITHUB_APP_ID: '123456', GITHUB_APP_PRIVATE_KEY: PKCS1,
               TURNSTILE_SECRET: 's', FEEDBACK_REPO: 'owner/repo' };
const post = (fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request('https://xebecstudios.org/research/digital-estate-roles/feedback/', { method: 'POST', body: fd });
};
const statusOf = (res) => new URL(res.headers.get('location')).pathname.split('/').filter(Boolean).pop();
const BODY = 'In New South Wales an enduring guardian may also consent to a medical procedure.';

const real = globalThis.fetch;
let calls = [];
const stub = ({ turnstile = true, github = true, install = true }) => {
  __test.resetTokenCache();
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.includes('turnstile')) return new Response(JSON.stringify({ success: turnstile }));
    if (u.endsWith('/installation')) {
      return install ? new Response(JSON.stringify({ id: 42 })) : new Response('{}', { status: 404 });
    }
    if (u.includes('/access_tokens')) {
      return new Response(JSON.stringify({ token: 'ghs_installation', expires_at: new Date(Date.now() + 3.6e6).toISOString() }));
    }
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
  'missing configuration refuses, and names what is absent': async () => {
    const r = await worker.fetch(post({ body: BODY }), { ASSETS });
    assert.equal(statusOf(r), 'unconfigured');
    const missing = new URL(r.headers.get('location')).searchParams.get('missing').split(',');
    assert.deepEqual(missing.sort(), ['app_id', 'feedback_repo', 'private_key', 'turnstile_secret']);
  },
  'one absent value is named on its own': async () => {
    const { GITHUB_APP_ID, ...rest } = FULL;
    const r = await worker.fetch(post({ body: BODY }), rest);
    assert.equal(new URL(r.headers.get('location')).searchParams.get('missing'), 'app_id');
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
    const gh = calls.find((c) => c.url.endsWith('/issues'));
    assert.ok(gh, 'GitHub should have been called');
    assert.equal(gh.url, 'https://api.github.com/repos/owner/repo/issues');
    assert.equal(gh.init.headers.Authorization, 'Bearer ghs_installation',
                 'the issue must be created with the installation token, not the app JWT');
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
    const gh = calls.filter((c) => c.url.endsWith('/issues'));
    assert.equal(gh.length, 2, 'should retry without the label');
    assert.ok(!JSON.parse(gh[1].init.body).labels);
  },
  'the key GitHub actually gives you (PKCS#1) can sign': async () => {
    const jwt = await __test.appJwt({ GITHUB_APP_ID: '123456', GITHUB_APP_PRIVATE_KEY: PKCS1 });
    const [h, b, sig] = jwt.split('.');
    assert.ok(sig && sig.length > 300, 'RS256 signature expected');
    const claims = JSON.parse(Buffer.from(b, 'base64url').toString());
    assert.equal(claims.iss, '123456');
    assert.ok(claims.iat < Math.floor(Date.now() / 1000), 'iat must be backdated');
    assert.ok(claims.exp - claims.iat <= 600, 'GitHub rejects a life over ten minutes');
    assert.equal(JSON.parse(Buffer.from(h, 'base64url').toString()).alg, 'RS256');
  },
  'a PKCS#8 key works too, for anyone who converted theirs': async () => {
    const jwt = await __test.appJwt({ GITHUB_APP_ID: '1', GITHUB_APP_PRIVATE_KEY: PKCS8 });
    assert.equal(jwt.split('.').length, 3);
  },
  'however the key was pasted, it parses to the same thing': async () => {
    // A PEM pasted into a one-line field arrives with literal backslash-n, and some
    // fields add quotes. Neither is the reader's fault, and both used to throw deep
    // inside a catch that reported nothing more useful than "error".
    const good = Buffer.from(__test.pemToKeyData(PKCS1));
    for (const [name, form] of [
      ['flattened', PKCS1.replace(/\n/g, '\\n')],
      ['quoted', `"${PKCS1}"`],
      ['quoted and flattened', `"${PKCS1.replace(/\n/g, '\\n')}"`],
      ['padded with whitespace', `  ${PKCS1}  `],
    ]) {
      assert.ok(Buffer.from(__test.pemToKeyData(form)).equals(good), `${name} should parse the same`);
    }
  },
  'an empty key says so rather than failing obscurely': async () => {
    assert.throws(() => __test.pemToKeyData('   '), /empty private key/);
  },
  'both key formats produce the same key': async () => {
    const a = __test.pemToKeyData(PKCS1);
    const b = __test.pemToKeyData(PKCS8);
    assert.deepEqual(Buffer.from(a).toString('hex'), Buffer.from(b).toString('hex'),
                     'the PKCS#1 wrap must reproduce what openssl produces');
  },
  'the installation token is reused rather than minted per issue': async () => {
    calls = []; stub({});
    for (let i = 0; i < 3; i++) {
      await worker.fetch(post({ body: BODY, 'cf-turnstile-response': 'x' }), FULL);
    }
    assert.equal(calls.filter((c) => c.url.includes('/access_tokens')).length, 1);
    assert.equal(calls.filter((c) => c.url.endsWith('/issues')).length, 3);
  },
  'an App not installed on the repo files nothing': async () => {
    calls = []; stub({ install: false });
    const r = await worker.fetch(post({ body: BODY, 'cf-turnstile-response': 'x' }), FULL);
    assert.equal(statusOf(r), 'error');
    assert.ok(!calls.some((c) => c.url.endsWith('/issues')));
  },
  'a GitHub failure is reported, not swallowed': async () => {
    stub({ github: false });
    const r = await worker.fetch(post({ body: BODY, 'cf-turnstile-response': 'x' }), FULL);
    assert.equal(statusOf(r), 'error');
  },
  'the issue names the jurisdiction and keeps the id beside it': async () => {
    calls = []; stub({});
    await worker.fetch(post({
      body: BODY, jurisdiction: 'Finland', jurisdiction_id: 'fi-national',
      role: 'Edunvalvontavaltuutettu — Attorney under a continuing power of attorney',
      role_id: 'fi-edunvalvontavaltuutettu', 'cf-turnstile-response': 'x',
    }), FULL);
    const payload = JSON.parse(calls.find((c) => c.url.endsWith('/issues')).init.body);
    assert.match(payload.body, /\*\*Jurisdiction:\*\* Finland \(fi-national\)/);
    assert.match(payload.body, /\*\*Role:\*\* Edunvalvontavaltuutettu .* \(fi-edunvalvontavaltuutettu\)/);
    assert.match(payload.title, /^Finland:/, 'the title should read as the name, not the id');
  },
  'a jurisdiction we do not cover is filed under no id at all': async () => {
    calls = []; stub({});
    await worker.fetch(post({ body: BODY, jurisdiction: 'Fiji', 'cf-turnstile-response': 'x' }), FULL);
    const payload = JSON.parse(calls.find((c) => c.url.endsWith('/issues')).init.body);
    assert.match(payload.body, /\*\*Jurisdiction:\*\* Fiji\n/, 'no id, and no empty parentheses');
    assert.ok(!/\(\)/.test(payload.body));
  },
  'oversized input is truncated before it reaches the API': async () => {
    calls = []; stub({});
    await worker.fetch(post({ body: 'x'.repeat(50000), 'cf-turnstile-response': 'x' }), FULL);
    const gh = calls.find((c) => c.url.endsWith('/issues'));
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
