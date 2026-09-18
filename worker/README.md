# The one Worker route

The site is prebuilt files served from `[assets]`. This script exists for a single POST
route — `/research/digital-estate-roles/feedback/` — and hands everything else to
`env.ASSETS` untouched.

It takes a form submission from a reader and files it as a GitHub issue using a token it
holds, so that **GitHub is the destination and never the interface**. The people most
likely to spot a gap in, say, New South Wales succession law are practitioners, not
developers; requiring a GitHub account would filter out exactly the audience worth hearing
from.

## Before it can work

Two secrets and one var. The var is in `wrangler.toml`; the secrets are not, and must never
be committed:

```sh
wrangler secret put GITHUB_TOKEN       # fine-grained PAT: Issues → read and write, on FEEDBACK_REPO only
wrangler secret put TURNSTILE_SECRET   # the secret key of the Turnstile widget
```

The form also needs the widget's **site key**, which is public but is read at build time,
not at run time. Set `PUBLIC_TURNSTILE_SITEKEY` in the Workers Builds environment
variables. Until it is set the form renders without the widget and the endpoint refuses
every submission with `unconfigured` — deliberately, because a form that silently swallows
what somebody wrote is worse than one that admits it is not ready.

The token should be scoped to the single repository that receives the issues. It needs no
access to code, and the repository can stay private: the reader never sees GitHub.

## What it refuses

`worker/index.test.mjs` covers the paths that matter, which are the ones that say no.
Run it with `node worker/index.test.mjs` — no Cloudflare account needed, GitHub and
Turnstile are stubbed.

- no Turnstile token, or a failed check → nothing is filed
- a body under 20 characters → nothing is filed
- the honeypot field filled → accepted to the reader, discarded silently
- missing configuration → refused, and says so
- input is truncated before it reaches the API, so a 50 KB paste cannot become a 50 KB issue

Each outcome redirects to its own prerendered page under `feedback/`, rather than a query
parameter on one page, because the site is prerendered: `?status=sent` would be invisible
to a reader with JavaScript off, and they are part of who this is for.

## What lands in the issue

The jurisdiction, role and page the reader came from, what they wrote, any source they
offered, and a contact if they gave one. Every issue ends with a line saying the text is a
reader's own words and not a sourced claim — it has to be checked against primary law
before anything in `research/` changes.
