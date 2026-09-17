# xebecstudios.org

Astro, markdown in git, static hosting on Cloudflare. No CMS, no database, no
server. Writing a post is a commit.

## Running it

```
npm install
npm run dev        # localhost:4321
npm run build      # → dist/
```

## The content model

Four collections in `src/content/`, all schema-checked at build time. A typo in
a frontmatter field fails the build rather than silently rendering wrong.

| Collection | What goes in it |
|---|---|
| `essays/` | The writing. Markdown with frontmatter. |
| `speaking/` | Talks. Event, venue, date, slides, video, length. |
| `media/` | Podcasts, interviews, quotes, outside articles. |
| `projects/` | Spartacus, the ethics work, Mistaken Identity. |

**Subjects are Technology, History, Philosophy.** Defined once in
`src/content.config.ts`; the filter rows and `/subjects/*` pages generate from
that list. Add a fourth and everything picks it up — but four is about the
ceiling before the filter row stops being scannable.

Essays live at the site root (`/death-of-authenticity/`), not under `/essays/`.
That is deliberate: it is exactly where Ghost served them, so old inbound links
survive the move untouched.

## The margin

The structural bet of this design. Every essay has one, and it is never empty —
it falls back to date, subject and reading time, all of which come free from
frontmatter you are writing anyway.

Glosses are written **inline in the body**, as Obsidian callouts:

```markdown
Some paragraph about provenance.

> [!gloss]
> Iron gall ink was itself a provenance technology.

> [!aside]
> The Ship of Theseus is this argument in better weather.
```

A gloss attaches to the paragraph immediately above it. `plugins/remark-glosses.mjs`
lifts them out of the flow at build time and hands them to the layout, which
puts them in the margin beside that paragraph.

`gloss` gets the red rule (a note on a specific claim), `aside` the green one
(a remark about the passage). Same wind hierarchy as the rhumb lines — one
system, not two.

**Why not frontmatter?** An earlier version used `at: 3`, meaning "beside the
fourth paragraph, counted by hand." Insert one paragraph and every gloss below
it silently points somewhere else. Positional anchoring can't drift.

Ordinary blockquotes are untouched — only `[!gloss]` and `[!aside]` are lifted.

Alignment is done by a small script in `Essay.astro`. With no JS the notes stack
in document order, which still reads as a proper apparatus. Below 880px the
margin moves above the text and alignment switches off.

## Writing in Obsidian

The vault config is committed: open this repo folder as a vault and it is
already set up. `.obsidian/workspace.json` is gitignored, so per-machine
window state does not travel.

What is configured:

- **Wikilinks off.** Obsidian's `[[double brackets]]` are not markdown and
  Astro renders them literally. Standard `[text](path)` links instead.
- **Attachments** go to `public/images`, which is where Astro serves them from
  at `/images/`. You will still have to fix the path by hand after pasting —
  Obsidian writes a relative path, the site wants an absolute one.
- **Ignore filters** for `node_modules`, `dist`, `.astro` and the Ghost export,
  so Obsidian is not indexing thirty thousand files.
- **A CSS snippet** (`.obsidian/snippets/xebec.css`) styling `[!gloss]` and
  `[!aside]` callouts to look roughly like margin notes — italic, muted, with
  the right rule colour. Enable under Settings → Appearance if it is off.
- **A template** at `_templates/essay.md` with the frontmatter pre-filled.
  Core Templates plugin, folder already pointed at it.

Obsidian will **not** show you the site — no margin column, no rose, no drop
cap. For that, run `npm run dev` in a browser window beside it. Astro
hot-reloads on save.

### From an iPad

There is no way to run Node on iPadOS, so `npm run dev` is off the table there.
The workable shape:

- Write in Obsidian. Obsidian Git is unreliable on iOS — use **Working Copy**
  for the git side, editing the files in place.
- Push to a `draft` branch and let **Cloudflare preview deployments** build it.
  You get a real URL with the real layout in about a minute. Slow for CSS work,
  fine for prose.
- `npm run dev:lan` binds the dev server to your network, so if a laptop is
  awake on the same wifi you can point Safari at it directly.

## Cross-references

An essay can point at the talk it came from:

```yaml
talk: "mistaken-identity-six-stories"   # the filename in src/content/speaking/
```

That renders the "Said aloud, first" block, pulling the event and date from the
speaking entry. Change the talk's date in one place and the essay follows.

## Migrating from Ghost

```
mkdir _ghost-export
# Ghost admin → Settings → Migration → Export, drop the .json in there
npm run migrate
```

It converts each published post to markdown, downloads every image off
`storage.ghost.io` into `public/images/`, rewrites the paths, strips Ghost's
`?ref=` tracking params from outbound links, and preserves slugs exactly.

**Do this before cancelling Ghost Pro.** Those image URLs die with the account
and the archive gets holes in it.

If it fails to find your posts, run:

```
npm run inspect
```

That prints the file's structure, how many posts it holds, and which body
field (`html`, `mobiledoc`, `lexical`) is actually populated — without
changing anything. Paste the output somewhere and the fix is usually obvious.

Note: if Ghost gave you a **.zip**, unzip it first. The JSON is inside,
alongside a `content/` folder of your images.

Re-running is safe: existing files are **skipped**, so the subjects you filed
by hand are not clobbered. Pass `--force` if you really want to reconvert.

Anything in `_ghost-export/` beginning with `_` is ignored — that folder is
input only, and the script writes its slug list to `dist-redirects/` instead.

It does *not* pick subjects. Everything lands as `Technology` with a `TODO
re-file` comment. Search for that string and go through them by hand — there
are about thirty, and the taxonomy is the one thing worth your own eyes.

Ghost *pages* (About, Contact, Speaking, Projects, Media) are skipped. They were
hand-maintained lists; they become collection entries and real pages here.

## Redirects from mikekiser.org

```
npm run redirects     # → dist-redirects/
```

Emits a Cloudflare Bulk Redirects CSV, one 301 per essay, path for path. Plus
`catch-all-rule.txt` describing a lower-priority dynamic rule that catches
anything the list misses, so nothing 404s even if the list drifts.

Point mikekiser.org's nameservers at Cloudflare, import the CSV under Bulk
Redirects, add the catch-all beneath it. Free on the free plan.

Old pages that have no path-for-path equivalent (`/`, `/contact/`, `/rss/`) are
mapped by hand in `scripts/build-redirects.mjs`.

## Comments

Giscus, storing threads in GitHub Discussions. No trackers, no third-party
cookies. Enable Discussions on the repo, run through https://giscus.app, and
paste the four values into `SITE.giscus` in `src/consts.ts`. The comments
section renders only once `repoId` is filled in, so it stays invisible until
you are ready.

## Newsletter, later

Nothing to do now. `/rss.xml` carries **full post content**, not teasers, which
is the only requirement for Buttondown to ingest the feed and mail it out
whenever you want that. Paid subscriptions are a Buttondown setting, not a site
change.

## Deploying

Cloudflare Pages, connected to the repo:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20 or later

Static assets are unmetered. There are no Pages Functions in this project, so
the Workers request cap never applies. 500 builds/month is the only real limit
and an Astro build of this size takes well under a minute.

`public/_headers` sets security headers and immutable caching for hashed assets.

## Design notes

The palette is the portolan wind hierarchy: black for the eight principal
winds, green for the eight half-winds, red for the sixteen quarter-winds. Red
doubles as the active state and the drop cap. **Resist adding a fourth colour** —
the discipline is what makes it look considered rather than decorated.

The compass rose (`src/components/CompassRose.astro`) computes its own geometry.
Eight points, each split lengthwise into a filled and an outlined half so it
reads as faceted brass rather than as a symbol; north is red, which is a
navigational convention rather than a decorative choice. The bezel carries the
same 32 divisions as the bearings, so the rose and the rhumb lines are visibly
the same instrument.

The bearing lines are a fixed-size SVG centred on the rose element with
`z-index: -1`. **Do not try to align them with viewBox coordinates** — that
drifts with the viewport and lands on top of the margin text at some widths.
That bug has been fixed once already.

Type is Instrument Serif for display, Spectral for body. Dates use old-style
figures so they sit into the line rather than shouting.

## Still to write

- `src/pages/speaking.astro`, `media.astro`, `projects.astro` — index pages over
  the collections. Same `.item` grid as the essay list.
- `src/pages/about.astro` — with `#contact`, which the redirect map points at.
- `src/pages/colophon.astro` — linked in the footer as "Sources".
- `src/pages/404.astro`.

## Gotchas

- **Don't start an essay's first paragraph with a quote mark or a numeral.** It
  gets the drop cap, and punctuation drop caps look like a mistake.
- **Run the migration before cancelling Ghost Pro.** Image URLs die with the
  account.
- **Check `git diff` the first few times you edit frontmatter in Obsidian's
  Properties panel.** It generally leaves unknown keys alone, but confirm it
  rather than trust it.
