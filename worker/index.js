/**
 * The site is static assets plus one endpoint.
 *
 * Readers of the Digital Estate Roles section are the people most likely to spot a gap in
 * their own jurisdiction, and least likely to have a GitHub account. This takes a form post
 * and files the issue on their behalf, so GitHub is the destination and never the interface.
 * Everything other than that one path falls through to the built files, exactly as before.
 *
 * Authentication is a GitHub App rather than a personal access token, because a token
 * expires and the failure is silent from our side: readers would keep writing and nothing
 * would arrive. An App's installation token is minted per request and lasts an hour.
 *
 * Required secrets (wrangler secret put <NAME>):
 *   GITHUB_APP_PRIVATE_KEY  the .pem the App gave you, pasted as-is
 *   TURNSTILE_SECRET        secret key of the Turnstile widget whose site key the form renders
 * Required vars (wrangler.toml [vars]):
 *   GITHUB_APP_ID           the App's id; not a secret
 *   FEEDBACK_REPO           "owner/name" of the repository that receives the issues
 */

const FEEDBACK_PATH = '/research/digital-estate-roles/feedback';
const LIMITS = { subject: 120, body: 4000, jurisdiction: 60, role: 80, page: 300, source: 500, contact: 120 };
const UA = 'xebecstudios.org feedback endpoint';
const LABEL = 'reader feedback';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    if (request.method === 'POST' && path === FEEDBACK_PATH) {
      return handleFeedback(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};

const clean = (v, n) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, n);
// One prerendered page per outcome. A query parameter would be invisible to a reader with
// JavaScript off, and they are exactly who this form is for.
const RESULTS = new Set(['sent', 'short', 'captcha', 'unconfigured', 'error']);
const back = (url, result, params) => {
  const where = RESULTS.has(result) ? result : 'error';
  const to = new URL(`${FEEDBACK_PATH}/${where}/`, url.origin);
  // The pages are prerendered and ignore this; it is for whoever is looking at the redirect.
  for (const [k, v] of Object.entries(params || {})) if (v) to.searchParams.set(k, v);
  return Response.redirect(to.toString(), 303);
};

async function handleFeedback(request, env, url) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return back(url, 'error');
  }

  // A hidden field no human fills in. It is not the spam defence, just the cheap half of it.
  if (clean(form.get('website'), 10)) return back(url, 'sent');

  const fields = {
    subject: clean(form.get('subject'), LIMITS.subject),
    body: clean(form.get('body'), LIMITS.body),
    jurisdiction: clean(form.get('jurisdiction'), LIMITS.jurisdiction),
    role: clean(form.get('role'), LIMITS.role),
    page: clean(form.get('page'), LIMITS.page),
    source: clean(form.get('source'), LIMITS.source),
    contact: clean(form.get('contact'), LIMITS.contact),
    kind: clean(form.get('kind'), 40) || 'gap',
  };
  if (fields.body.length < 20) return back(url, 'short');

  // Name what is absent. Which settings are unset is operational status rather than a
  // secret, and without it "unconfigured" is a dead end for whoever has to fix it.
  const missing = Object.entries({
    app_id: env.GITHUB_APP_ID,
    private_key: env.GITHUB_APP_PRIVATE_KEY,
    turnstile_secret: env.TURNSTILE_SECRET,
    feedback_repo: env.FEEDBACK_REPO,
  }).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    // Better a plain refusal than a form that silently swallows what someone wrote.
    return back(url, 'unconfigured', { missing: missing.join(',') });
  }
  if (!(await turnstileOk(form.get('cf-turnstile-response'), request, env))) {
    return back(url, 'captcha');
  }

  const created = await createIssue(fields, env);
  return back(url, created ? 'sent' : 'error');
}

async function turnstileOk(token, request, env) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = await r.json();
    return j.success === true;
  } catch {
    return false;
  }
}

function issueBody(f) {
  const line = (label, v) => (v ? `**${label}:** ${v}\n` : '');
  return [
    line('Jurisdiction', f.jurisdiction),
    line('Role', f.role),
    line('Page', f.page),
    line('Kind', f.kind),
    '\n---\n\n',
    f.body,
    f.source ? `\n\n**Source offered by the reader**\n\n${f.source}` : '',
    f.contact ? `\n\n**Contact**\n\n${f.contact}` : '',
    '\n\n---\n_Submitted through the feedback form on xebecstudios.org. '
      + 'The text above is a reader\'s own words and is not a sourced claim: '
      + 'it needs checking against primary law before anything changes._\n',
  ].join('');
}

// ---------- GitHub App authentication ----------

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function derLength(n) {
  if (n < 0x80) return [n];
  const bytes = [];
  for (let v = n; v > 0; v >>= 8) bytes.unshift(v & 0xff);
  return [0x80 | bytes.length, ...bytes];
}

/**
 * WebCrypto imports PKCS#8; GitHub hands out PKCS#1. Rather than make somebody run openssl
 * before they can paste the key, wrap it here: a PKCS#8 PrivateKeyInfo is just the version,
 * the rsaEncryption algorithm identifier, and the PKCS#1 body in an OCTET STRING.
 */
function pkcs1ToPkcs8(der) {
  const alg = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const inner = [0x02, 0x01, 0x00, ...alg, 0x04, ...derLength(der.length), ...der];
  return new Uint8Array([0x30, ...derLength(inner.length), ...inner]);
}

function pemToKeyData(pem) {
  // Be forgiving about how the key arrives. Pasting a PEM into a single-line field turns
  // the newlines into a literal backslash-n, and some fields add quotes; neither is the
  // reader's fault and both would otherwise fail deep inside a try/catch as a bare "error".
  const text = String(pem).trim().replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
  const isPkcs1 = /BEGIN RSA PRIVATE KEY/.test(text);
  const body = text.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  if (!body) throw new Error('empty private key');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return isPkcs1 ? pkcs1ToPkcs8(der) : der;
}

async function appJwt(env) {
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToKeyData(env.GITHUB_APP_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  // Backdated by a minute because GitHub rejects a JWT whose iat is in its future, and
  // clocks differ. Ten minutes is the longest life GitHub accepts.
  const claims = { iat: now - 60, exp: now + 540, iss: env.GITHUB_APP_ID };
  const enc = new TextEncoder();
  const head = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify(claims)));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}

const ghHeaders = (auth) => ({
  Authorization: `Bearer ${auth}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': UA,
});

// Installation tokens last an hour. Cache per isolate so a burst of submissions does not
// mint one each; the worst case on a cold isolate is two extra calls.
let cached = { token: null, expires: 0 };

async function installationToken(env) {
  if (cached.token && Date.now() < cached.expires - 60_000) return cached.token;
  const jwt = await appJwt(env);
  // Ask which installation covers the repository rather than making somebody look up an id.
  const inst = await fetch(`https://api.github.com/repos/${env.FEEDBACK_REPO}/installation`,
    { headers: ghHeaders(jwt) });
  if (!inst.ok) return null;
  const { id } = await inst.json();
  const tok = await fetch(`https://api.github.com/app/installations/${id}/access_tokens`,
    { method: 'POST', headers: ghHeaders(jwt) });
  if (!tok.ok) return null;
  const { token, expires_at } = await tok.json();
  cached = { token, expires: expires_at ? Date.parse(expires_at) : Date.now() + 3_600_000 };
  return token;
}

async function createIssue(f, env) {
  const title = f.subject
    || `${f.jurisdiction || 'Digital Estate Roles'}: ${f.body.slice(0, 60).replace(/\s+\S*$/, '')}…`;
  try {
    const auth = await installationToken(env);
    if (!auth) return false;
    const post = (payload) => fetch(`https://api.github.com/repos/${env.FEEDBACK_REPO}/issues`, {
      method: 'POST',
      headers: { ...ghHeaders(auth), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const base = { title, body: issueBody(f) };
    const r = await post({ ...base, labels: [LABEL] });
    if (r.ok) return true;
    // The label is a convenience for triage; losing what somebody wrote because it does not
    // exist in the repository would not be. Try again without it before giving up.
    if (r.status === 422) return (await post(base)).ok;
    return false;
  } catch {
    return false;
  }
}

export const __test = { pemToKeyData, appJwt, resetTokenCache: () => { cached = { token: null, expires: 0 }; } };
