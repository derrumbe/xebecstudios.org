/**
 * The site is static assets plus one endpoint.
 *
 * Readers of the Digital Estate Roles section are the people most likely to spot a gap in
 * their own jurisdiction, and least likely to have a GitHub account. This takes a form post
 * and files the issue on their behalf, so GitHub is the destination and never the interface.
 * Everything other than that one path falls through to the built files, exactly as before.
 *
 * Required secrets (wrangler secret put <NAME>):
 *   GITHUB_TOKEN      fine-grained PAT, Issues: read and write, on FEEDBACK_REPO only
 *   TURNSTILE_SECRET  secret key of the Turnstile widget whose site key the form renders
 * Required var (wrangler.toml [vars]):
 *   FEEDBACK_REPO     "owner/name" of the repository that receives the issues
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
const back = (url, result) => {
  const where = RESULTS.has(result) ? result : 'error';
  return Response.redirect(new URL(`${FEEDBACK_PATH}/${where}/`, url.origin).toString(), 303);
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

  if (!env.TURNSTILE_SECRET || !env.GITHUB_TOKEN || !env.FEEDBACK_REPO) {
    // Better a plain refusal than a form that silently swallows what someone wrote.
    return back(url, 'unconfigured');
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

async function createIssue(f, env) {
  const title = f.subject
    || `${f.jurisdiction || 'Digital Estate Roles'}: ${f.body.slice(0, 60).replace(/\s+\S*$/, '')}…`;
  const post = (payload) => fetch(`https://api.github.com/repos/${env.FEEDBACK_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify(payload),
  });
  const base = { title, body: issueBody(f) };
  try {
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
