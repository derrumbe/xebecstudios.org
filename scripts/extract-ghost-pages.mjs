#!/usr/bin/env node
/**
 * Pull the Ghost *pages* out of the export and stage them for hand-finishing.
 *
 *   node scripts/extract-ghost-pages.mjs        (npm run extract-pages)
 *
 * migrate-ghost.mjs deliberately skips pages: About, Contact, Speaking,
 * Projects and Media were hand-maintained lists on Ghost, and here they are
 * two different things — real .astro pages, and entries in the speaking /
 * media / projects collections. Neither is a mechanical conversion, so this
 * script does not pretend to finish the job. It stages.
 *
 * What it writes, all under _staged/ and none of it under src/:
 *
 *   _staged/pages/<slug>.md      the page's prose as markdown, plus any embed
 *                                URLs found in it, for folding into the
 *                                corresponding .astro page by hand
 *   _staged/speaking/<n>-<slug>.md   one stub per talk found on the speaking
 *                                page, frontmatter roughed in, TODOs where the
 *                                export simply does not say
 *   _staged/projects/<slug>.md   likewise, from the projects page
 *
 * Nothing lands in src/content/ because the stubs carry TODOs and the
 * collection schemas would (correctly) fail the build on them. Promote them
 * yourself: that is the step where you supply the dates and venues Ghost never
 * recorded.
 *
 * Re-running skips files that already exist. --force overwrites.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import TurndownService from 'turndown';

const FORCE = process.argv.includes('--force');

const ROOT = path.resolve(import.meta.dirname, '..');
const EXPORT_DIR = path.join(ROOT, '_ghost-export');
const STAGE_DIR = path.join(ROOT, '_staged');
const IMG_DIR = path.join(ROOT, 'public/images');

const ORIGIN = (process.env.GHOST_ORIGIN ?? 'https://mikekiser.org').replace(/\/$/, '');

/* ---------------------------------------------------------------- markdown */

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Same figure handling as the post migration, so a page's images survive.
td.addRule('figure', {
  filter: 'figure',
  replacement: (content, node) => {
    const img = node.querySelector?.('img');
    const cap = node.querySelector?.('figcaption');
    if (!img) return content;
    const alt = img.getAttribute('alt') || '';
    const src = img.getAttribute('src') || '';
    const caption = cap?.textContent?.trim();
    return caption ? `\n\n![${alt}](${src})\n_${caption}_\n\n` : `\n\n![${alt}](${src})\n\n`;
  },
});

// Turndown drops iframes and <video> on the floor, and on the speaking page
// those tags ARE the content — they are the recordings. Keep them as links so
// a video URL is not silently lost between Ghost and here.
td.addRule('embeds', {
  filter: ['iframe', 'video'],
  replacement: (_content, node) => {
    const src = node.getAttribute?.('src') || node.querySelector?.('source')?.getAttribute('src');
    return src ? `\n\n[embed](${watchUrl(src)})\n\n` : '';
  },
});

// Ghost sprinkles ?ref=mikekiser.org onto outbound links.
const stripRef = (s) => s.replace(/([?&])ref=[^&"')\s]*/g, '').replace(/\?(&|$)/g, '');

// A YouTube *embed* URL is not a URL anyone wants in frontmatter.
const watchUrl = (u) => {
  const m = /youtube\.com\/embed\/([\w-]+)/.exec(u);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : u.replace(/\?feature=oembed$/, '');
};

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);

/* ------------------------------------------------------------------ export */

function extractPages(raw) {
  const direct = raw?.db?.[0]?.data ?? raw?.data ?? raw;
  let posts = Array.isArray(direct?.posts) ? direct.posts : null;
  if (!posts) {
    // Same defensive walk the migration does — the export shape has moved
    // between Ghost versions more than once.
    const seen = new Set();
    const walk = (n) => {
      if (posts || !n || typeof n !== 'object' || seen.has(n)) return;
      seen.add(n);
      if (Array.isArray(n)) {
        if (n.some((x) => x?.slug && x?.title && 'type' in x)) { posts = n; return; }
        n.forEach(walk);
        return;
      }
      Object.values(n).forEach(walk);
    };
    walk(raw);
  }
  if (!posts) {
    throw new Error('Could not find a posts array. Run  npm run inspect  to see the file shape.');
  }
  return posts.filter((p) => p.type === 'page');
}

async function findExport() {
  let files;
  try {
    files = await fs.readdir(EXPORT_DIR);
  } catch {
    throw new Error(`No _ghost-export/ directory. Create it and drop the Ghost export JSON in.`);
  }
  // Leading-underscore files are ours, not Ghost's.
  const candidates = files.filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (!candidates.length) throw new Error('No Ghost export .json in _ghost-export/.');
  for (const f of candidates) {
    try {
      const raw = JSON.parse(await fs.readFile(path.join(EXPORT_DIR, f), 'utf8'));
      extractPages(raw);
      return path.join(EXPORT_DIR, f);
    } catch { /* try the next one */ }
  }
  throw new Error('No file in _ghost-export/ looks like a Ghost export.');
}

/* ------------------------------------------------------------------ images */

const seenImages = new Map();

async function downloadImage(url) {
  if (seenImages.has(url)) return seenImages.get(url);
  const clean = url.split('?')[0];
  const base = path.basename(new URL(clean).pathname) || `img-${seenImages.size}`;
  const year = clean.match(/\/(\d{4})\/(\d{2})\//);
  const name = year ? `${year[1]}-${year[2]}-${base}` : base;
  const local = `/images/${name}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    await fs.mkdir(IMG_DIR, { recursive: true });
    await pipeline(res.body, createWriteStream(path.join(IMG_DIR, name)));
    console.log(`  ↓ ${name}`);
    seenImages.set(url, local);
    return local;
  } catch (err) {
    console.warn(`  ! failed ${url} — ${err.message}`);
    seenImages.set(url, url);
    return url;
  }
}

async function rewriteImages(md) {
  md = md.split('__GHOST_URL__').join(ORIGIN);
  md = md.replace(/(!\[[^\]]*\]\()(\/content\/images\/)/g, `$1${ORIGIN}$2`);
  const urls = new Set();
  const re = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  let m;
  while ((m = re.exec(md))) urls.add(m[1]);
  for (const url of urls) md = md.split(url).join(await downloadImage(url));
  return md;
}

/* ------------------------------------------------------------------ stubs */

/**
 * Talks off the speaking page. Ghost recorded them in two shapes and neither
 * is structured data:
 *
 *   **Title (Event, Year)**            a featured talk, often with a recording
 *   - [Title (Event Year)](url)        a past talk, sometimes with nested
 *       - [Venue Year](url)            deliveries beneath it
 *
 * So: parse what is there, guess the event and year out of the trailing
 * parenthesis when it looks like one, and mark everything else TODO. The dates
 * especially — Ghost stored a year at best, and the schema wants a real date.
 */
function talkStubs(md) {
  const out = [];
  const lines = md.split('\n');

  // Featured: a bold-only paragraph, with any [embed](url) that follows it
  // before the next featured talk. That adjacency is the only thing tying a
  // recording to its talk on this page.
  lines.forEach((line, i) => {
    const m = /^\*\*(.+?)\*\*\s*$/.exec(line.trim());
    if (!m) return;
    let video = null;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      if (/^\*\*.+\*\*\s*$/.test(lines[j].trim())) break;
      const e = /\[embed\]\(([^)]+)\)/.exec(lines[j]);
      if (e) { video = e[1]; break; }
    }
    out.push({ ...splitTitle(m[1]), video, featured: true });
  });

  // Past: top-level bullets. Nested bullets are further deliveries of the same
  // talk, so they are collected onto the parent rather than becoming stubs of
  // their own — you decide whether they earn separate entries.
  let current = null;
  for (const raw of lines) {
    const top = /^-\s+(.*)$/.exec(raw);
    const nested = /^\s+-\s+(.*)$/.exec(raw);
    if (top) {
      current = { ...splitTitle(unlink(top[1])), ...linkOf(top[1]), also: [], featured: false };
      out.push(current);
    } else if (nested && current) {
      const text = unlink(nested[1]).trim();
      if (text) current.also.push({ where: text, ...linkOf(nested[1]) });
    } else if (raw.trim() === '') {
      current = null;
    }
  }
  return out;
}

const unlink = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '').trim();
const linkOf = (s) => {
  const m = /\[[^\]]*\]\(([^)]+)\)/.exec(s);
  return m ? { url: m[1] } : {};
};

/** "New Face, Who Dis? (EIC 2022)" → title, event, year. Trailing paren only. */
function splitTitle(raw) {
  const text = unlink(raw);
  const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(text);
  if (!m) return { title: text, event: null, year: null };
  const inner = m[2];
  const y = /(19|20)\d{2}/.exec(inner);
  return {
    title: m[1].trim(),
    event: inner.replace(/,?\s*(19|20)\d{2}\s*$/, '').trim() || null,
    year: y ? y[0] : null,
  };
}

/** Projects: `### [Name](url)` followed by its paragraph. */
function projectStubs(md) {
  const out = [];
  const lines = md.split('\n');
  lines.forEach((line, i) => {
    const h = /^###\s+(.+)$/.exec(line.trim());
    if (!h) return;
    const title = unlink(h[1]);
    if (!title) return;                     // the export has one empty heading
    const { url } = linkOf(h[1]);
    const summary = lines.slice(i + 1, i + 8).find((l) => l.trim() && !/^#{1,6}\s/.test(l));
    out.push({ title, url, summary: summary ? unlink(summary).replace(/\s+/g, ' ') : null });
  });
  return out;
}

/* ------------------------------------------------------------------- write */

async function write(rel, body) {
  const full = path.join(STAGE_DIR, rel);
  if (!FORCE) {
    try { await fs.access(full); console.log(`  = ${rel} (exists)`); return false; } catch { /* new */ }
  }
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body, 'utf8');
  console.log(`  ✓ ${rel}`);
  return true;
}

async function main() {
  const file = await findExport();
  console.log(`Reading ${path.relative(ROOT, file)}\n`);
  const pages = extractPages(JSON.parse(await fs.readFile(file, 'utf8')));

  const published = pages.filter((p) => p.status === 'published');
  const drafts = pages.filter((p) => p.status !== 'published');
  console.log(`${pages.length} pages (${published.length} published, ${drafts.length} draft)\n`);

  let talks = [];
  let projects = [];

  for (const page of published) {
    const html = page.html ?? '';
    if (!html) {
      console.warn(`! ${page.slug}: no rendered html (mobiledoc/lexical only) — skipped`);
      continue;
    }
    let md = td.turndown(stripRef(html)).trim();
    md = await rewriteImages(md);

    const embeds = [...md.matchAll(/\[embed\]\(([^)]+)\)/g)].map((m) => m[1]);
    const date = (page.published_at ?? page.created_at ?? '').slice(0, 10);

    const head = [
      '---',
      `title: ${yamlStr(page.title)}`,
      `ghostSlug: ${yamlStr(page.slug)}`,
      `ghostPath: ${yamlStr(`/${page.slug}/`)}`,
      `published: ${date}`,
      embeds.length ? `# embeds found: ${embeds.join(' , ')}` : null,
      '# Staged, not live. Fold this into the matching src/pages/*.astro by hand.',
      '---',
    ].filter(Boolean).join('\n') + '\n\n';

    await write(`pages/${page.slug}.md`, head + md + '\n');

    if (page.slug === 'speaking') talks = talkStubs(md);
    if (page.slug === 'projects') projects = projectStubs(md);
  }

  for (const p of drafts) {
    console.log(`  · ${p.slug} is a draft in Ghost — not staged`);
  }

  /* ------------------------------------------------------ speaking stubs */
  if (talks.length) {
    console.log(`\n${talks.length} talks found on the speaking page:`);
    let n = 0;
    for (const t of talks) {
      n += 1;
      const id = `${String(n).padStart(2, '0')}-${slugify(t.title) || 'untitled'}`;
      const body = [
        '---',
        `title: ${yamlStr(t.title)}`,
        t.year ? `date: ${t.year}-01-01  # TODO real date — Ghost recorded the year only`
               : `date: TODO  # not recorded anywhere in the export`,
        t.event ? `event: ${yamlStr(t.event)}` : `event: TODO`,
        `location: TODO`,
        `format: Talk  # Keynote | Talk | Panel | Workshop | Interview`,
        t.video ? `video: ${yamlStr(t.video)}` : t.url ? `video: ${yamlStr(t.url)}  # TODO confirm this is a recording, not a listing` : `# video:`,
        `# subject: Technology | History | Philosophy`,
        `# essay: <id in src/content/essays/>`,
        t.featured ? '# was a FEATURED talk on the Ghost page' : null,
        t.also?.length ? `# also delivered at: ${t.also.map((a) => a.where).join(' ; ')}` : null,
        t.also?.length ? `# ${t.also.filter((a) => a.url).map((a) => `${a.where} → ${a.url}`).join('\n# ')}` : null,
        '---',
      ].filter(Boolean).join('\n') + '\n';
      await write(`speaking/${id}.md`, body);
    }
  }

  /* ------------------------------------------------------- project stubs */
  if (projects.length) {
    console.log(`\n${projects.length} projects found:`);
    for (const p of projects) {
      const isRepo = p.url && /github\.com/.test(p.url);
      const body = [
        '---',
        `title: ${yamlStr(p.title)}`,
        `summary: ${yamlStr(p.summary ?? 'TODO one or two sentences')}`,
        `status: Active  # Active | Dormant | Complete`,
        `# started: YYYY-MM-DD`,
        `# ended: YYYY-MM-DD`,
        p.url ? `${isRepo ? 'repo' : 'url'}: ${yamlStr(p.url)}` : '# repo:',
        `order: 0  # TODO`,
        '---',
      ].filter(Boolean).join('\n') + '\n';
      await write(`projects/${slugify(p.title)}.md`, body);
    }
  }

  console.log(`
Staged under _staged/. Nothing in src/ has been touched.

Next:
  1. _staged/pages/*.md   → fold the prose into src/pages/*.astro
  2. _staged/speaking/*.md, _staged/projects/*.md → fill the TODOs, then move
     them into src/content/<collection>/ with a real filename. The filename
     becomes the entry id, which is what essays cross-reference in \`talk:\`.
  3. npm run build — the schemas will tell you what is still missing.

The media page had no list to parse; it was prose pointing at outlets. Those
entries have to be reconstructed from the outlets themselves.`);
}

main().catch((err) => { console.error(`\n${err.message}`); process.exit(1); });
