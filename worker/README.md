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

Authentication is a **GitHub App**, not a personal access token. A token expires, and when
it does the failure is silent from our side — readers keep writing and nothing arrives,
which is the worst possible failure for a form whose whole purpose is catching what you
would otherwise never hear. An App mints an installation token per request, good for an
hour.

Create the App (Settings → Developer settings → GitHub Apps → New), give it **Repository
permissions → Issues: Read and write** and nothing else, install it on the repository that
receives the issues, and download its private key.

Then:

```sh
npx wrangler secret put GITHUB_APP_PRIVATE_KEY < path/to/app.private-key.pem
npx wrangler secret put TURNSTILE_SECRET
```

Piping the file avoids pasting a multi-line PEM into a prompt. The key is accepted in
whatever shape it arrives — PKCS#1 or PKCS#8, flattened to one line with literal `\n`,
quoted, or as downloaded.

**Check the Worker name first.** These commands target the `name` in `wrangler.toml`, and
if no Worker by that name exists wrangler creates an empty one and puts the secrets there,
where nothing will ever read them. The live Worker is `xebecstudios-org`; the config once
said `xebecstudios`, and that is exactly what happened. `wrangler secret list` will show
you what a given Worker actually holds.

and set `GITHUB_APP_ID` in `wrangler.toml` — the App's id is not a secret.

You do not need the installation id: the Worker asks GitHub which installation covers
`FEEDBACK_REPO`. The key can be pasted in either format — GitHub hands out PKCS#1
(`BEGIN RSA PRIVATE KEY`) and WebCrypto wants PKCS#8, so the Worker converts it, and a test
asserts that conversion is byte-identical to what `openssl pkcs8 -topk8` produces.

The form also needs the widget's **site key**, which is public but is read at build time,
not at run time. Set `PUBLIC_TURNSTILE_SITEKEY` in the Workers Builds environment
variables. Until it is set the form renders without the widget and the endpoint refuses
every submission with `unconfigured` — deliberately, because a form that silently swallows
what somebody wrote is worse than one that admits it is not ready.

The App needs no access to code, and the repository can stay private: the reader never sees
GitHub.

## Setting a secret is not enough on its own

This Worker records every change as a version, and the running code is whichever version is
*deployed*. `wrangler secret put` stores the secret and creates a new version — it does not
promote it. Until something deploys, the live Worker carries on with the version it had, and
reports the secret missing, which is true of the code that is actually running.

So after adding or rotating a secret:

```sh
npx wrangler versions deploy    # pick the newest, give it 100%
```

or merge anything to `main`, which makes Workers Builds deploy a fresh version carrying the
Worker's current secrets. Either way, confirm with a POST — `?missing=` on the redirect names
anything the running version still cannot see:

```sh
curl -si -X POST -d 'body=Checking which settings the running version can see' \
  https://xebecstudios.org/research/digital-estate-roles/feedback/ | grep -i location
```

`captcha` is the good answer there: it means every setting resolved and only Turnstile is
refusing, correctly, because curl has no widget token.

Two things that cost an evening, so they are worth stating plainly:

- **Check the Worker name before setting a secret.** `wrangler secret put` targets the `name`
  in `wrangler.toml`. If no Worker has that name it creates an empty one and puts the secret
  there, reporting success. The config said `xebecstudios` while the live Worker was
  `xebecstudios-org`, and that is exactly what happened. `wrangler secret list` shows what a
  given Worker actually holds.
- **A secret that is stored is not necessarily a secret that is live.** See above.

## What it refuses

`worker/index.test.mjs` covers the paths that matter, which are the ones that say no.
Run it with `node worker/index.test.mjs` — no Cloudflare account needed, GitHub and
Turnstile are stubbed.

- no Turnstile token, or a failed check → nothing is filed
- a body under 20 characters → nothing is filed
- the honeypot field filled → accepted to the reader, discarded silently
- missing configuration → refused, and says so
- input is truncated before it reaches the API, so a 50 KB paste cannot become a 50 KB issue
- an App that is not installed on the repository → nothing is filed

Each outcome redirects to its own prerendered page under `feedback/`, rather than a query
parameter on one page, because the site is prerendered: `?status=sent` would be invisible
to a reader with JavaScript off, and they are part of who this is for.

## What lands in the issue

The jurisdiction, role and page the reader came from, what they wrote, any source they
offered, and a contact if they gave one. Every issue ends with a line saying the text is a
reader's own words and not a sourced claim — it has to be checked against primary law
before anything in `research/` changes.
