#!/usr/bin/env node
/**
 * Convert a Ghost JSON export into markdown content collections.
 *
 *   1. Ghost admin → Settings → Migration → Export
 *   2. Drop the .json file in ./_ghost-export/
 *   3. node scripts/migrate-ghost.mjs
 *
 * What it does:
 *   - writes src/content/essays/<slug>.md with frontmatter
 *   - downloads every image to public/images/ and rewrites the paths
 *   - preserves slugs exactly, so old URLs keep resolving
 *   - writes _slugs.json for the redirect builder
 *
 * What it does not do: pick subjects. Every post comes out as Technology and
 * you re-file by hand. There are only about thirty of them, and the taxonomy
 * is the one thing worth doing with your own eyes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import TurndownService from 'turndown';

// Re-running overwrites conversions. Since you will have hand-filed subjects
// by then, existing files are skipped unless you pass --force.
const FORCE = process.argv.includes('--force');

const ROOT = path.resolve(import.meta.dirname, '..');
const EXPORT_DIR = path.join(ROOT, '_ghost-export');
const OUT_DIR = path.join(ROOT, 'src/content/essays');
const IMG_DIR = path.join(ROOT, 'public/images');

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Ghost wraps figures in <figure><img><figcaption>. Keep the caption.
td.addRule('figure', {
  filter: 'figure',
  replacement: (_content, node) => {
    const img = node.querySelector?.('img');
    const cap = node.querySelector?.('figcaption');
    if (!img) return _content;
    const alt = img.getAttribute('alt') || '';
    const src = img.getAttribute('src') || '';
    const caption = cap?.textContent?.trim();
    return caption
      ? `\n\n![${alt}](${src})\n_${caption}_\n\n`
      : `\n\n![${alt}](${src})\n\n`;
  },
});

// Ghost sprinkles ?ref=mikekiser.org onto outbound links. Strip it.
const stripRef = (s) => s.replace(/([?&])ref=[^&"')\s]*/g, (m, p1) => (p1 === '?' ? '' : ''))
                         .replace(/\?(&|$)/g, '');

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

async function findExport() {
  let files;
  try {
    files = await fs.readdir(EXPORT_DIR);
  } catch {
    throw new Error(`No ${path.relative(ROOT, EXPORT_DIR)}/ directory. Create it and drop the Ghost export JSON in.`);
  }

  // Leading-underscore files are ours, not Ghost's. Skipping them matters:
  // `_` sorts before letters, so without this the script reads its own output.
  const candidates = files.filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (!candidates.length) {
    throw new Error(`No Ghost export .json in ${path.relative(ROOT, EXPORT_DIR)}/ (files beginning with _ are ignored).`);
  }

  // Try each until one actually parses as an export, so a stray JSON in the
  // folder doesn't stop the run.
  const failures = [];
  for (const f of candidates) {
    const full = path.join(EXPORT_DIR, f);
    try {
      const raw = JSON.parse(await fs.readFile(full, 'utf8'));
      extractPosts(raw);
      return full;
    } catch (err) {
      failures.push(`  ${f}: ${err.message}`);
    }
  }
  throw new Error(`No file in ${path.relative(ROOT, EXPORT_DIR)}/ looks like a Ghost export.\n${failures.join('\n')}`);
}

/**
 * Ghost nests the payload differently across versions, and the shape has moved
 * more than once. Rather than hard-coding a path, walk the whole object and
 * find the arrays that look like posts, tags and join rows.
 */
const looksLikePosts = (a) =>
  Array.isArray(a) && a.length > 0 && a.some((x) => x && typeof x === 'object' && 'slug' in x && 'title' in x);
const looksLikeTags = (a) =>
  Array.isArray(a) && a.length > 0 && a.every((x) => x && typeof x === 'object' && 'name' in x && 'id' in x);
const looksLikeJoin = (a) =>
  Array.isArray(a) && a.length > 0 && a.every((x) => x && typeof x === 'object' && 'post_id' in x && 'tag_id' in x);

function findAll(root) {
  const hits = { posts: null, tags: null, postTags: null };
  const seen = new Set();
  const walk = (node, key) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      if (!hits.posts && (key === 'posts' || looksLikePosts(node))) hits.posts = node;
      else if (!hits.postTags && (key === 'posts_tags' || looksLikeJoin(node))) hits.postTags = node;
      else if (!hits.tags && (key === 'tags' || looksLikeTags(node))) hits.tags = node;
      for (const v of node) walk(v, key);
      return;
    }
    for (const [k, v] of Object.entries(node)) walk(v, k);
  };
  walk(root, '');
  return hits;
}

function extractPosts(raw) {
  // Fast path: the shapes Ghost has actually shipped.
  const direct = raw?.db?.[0]?.data ?? raw?.data ?? raw;
  if (Array.isArray(direct?.posts)) {
    return { posts: direct.posts, tags: direct.tags ?? [], postTags: direct.posts_tags ?? [] };
  }

  const found = findAll(raw);
  if (Array.isArray(found.posts)) {
    return { posts: found.posts, tags: found.tags ?? [], postTags: found.postTags ?? [] };
  }

  const keys = raw && typeof raw === 'object' ? Object.keys(raw).join(', ') : typeof raw;
  throw new Error(
    `Could not find a posts array. Top-level keys were: ${keys}\n` +
    `Run  node scripts/inspect-export.mjs  to see the file's shape.`,
  );
}

const seenImages = new Map();

async function downloadImage(url) {
  if (seenImages.has(url)) return seenImages.get(url);

  const clean = url.split('?')[0];
  const base = path.basename(new URL(clean).pathname) || `img-${seenImages.size}`;
  // Ghost reuses filenames across years; prefix with the year segment if present.
  const yearMatch = clean.match(/\/(\d{4})\/(\d{2})\//);
  const name = yearMatch ? `${yearMatch[1]}-${yearMatch[2]}-${base}` : base;
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
    seenImages.set(url, url); // leave the remote URL rather than breaking the post
    return url;
  }
}

async function rewriteImages(markdown) {
  // Ghost writes __GHOST_URL__ as a placeholder rather than a real origin.
  // Resolve it before looking for images, or the paths survive the migration
  // and Astro fails at build time with ImageNotFound.
  const ORIGIN = (process.env.GHOST_ORIGIN ?? 'https://mikekiser.org').replace(/\/$/, '');
  markdown = markdown.split('__GHOST_URL__').join(ORIGIN);
  markdown = markdown.replace(/(!\[[^\]]*\]\()(\/content\/images\/)/g, `$1${ORIGIN}$2`);

  const urls = new Set();
  const re = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  let m;
  while ((m = re.exec(markdown))) urls.add(m[1]);
  for (const url of urls) {
    const local = await downloadImage(url);
    markdown = markdown.split(url).join(local);
  }
  return markdown;
}

function estimateMinutes(md) {
  const words = md.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

async function main() {
  const file = await findExport();
  console.log(`Reading ${path.relative(ROOT, file)}`);
  const raw = JSON.parse(await fs.readFile(file, 'utf8'));
  const { posts, tags, postTags } = extractPosts(raw);

  const tagById = new Map(tags.map((t) => [t.id, t.name]));
  const tagsForPost = new Map();
  for (const pt of postTags) {
    const list = tagsForPost.get(pt.post_id) ?? [];
    const name = tagById.get(pt.tag_id);
    if (name && !name.startsWith('#')) list.push(name);
    tagsForPost.set(pt.post_id, list);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const published = posts.filter((p) => p.status === 'published' && p.type !== 'page');
  const pages = posts.filter((p) => p.type === 'page');
  console.log(`${published.length} published posts, ${pages.length} pages (pages are skipped — write those by hand)\n`);

  const slugs = [];
  const skipped = [];

  for (const post of published) {
    const html = post.html ?? '';
    if (!html) {
      console.warn(`! ${post.slug} has no rendered html — check mobiledoc/lexical by hand`);
    }

    let md = td.turndown(stripRef(html)).trim();
    md = await rewriteImages(md);

    const date = (post.published_at ?? post.created_at ?? '').slice(0, 10);
    const description = (post.custom_excerpt ?? post.excerpt ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    const ghostTags = tagsForPost.get(post.id) ?? [];

    const outPath = path.join(OUT_DIR, `${post.slug}.md`);
    if (!FORCE) {
      try {
        await fs.access(outPath);
        skipped.push(post.slug);
        slugs.push(post.slug);
        continue;
      } catch { /* not there yet, carry on */ }
    }

    const fm = [
      '---',
      `title: ${yamlStr(post.title)}`,
      `date: ${date}`,
      `subject: Technology  # TODO re-file: Technology | History | Philosophy`,
      `description: ${yamlStr(description || 'TODO write a one-line description')}`,
      `legacySlug: ${yamlStr(post.slug)}`,
      ghostTags.length ? `# ghost tags were: ${ghostTags.join(', ')}` : null,
      post.feature_image ? `# feature image: ${post.feature_image}` : null,
      `# ~${estimateMinutes(md)} min`,
      '---',
      // NB: filter(Boolean) below drops the null entries above. Do not put the
      // trailing blank line in this array — '' is falsy and gets eaten too,
      // which glues the closing fence to the body and breaks the frontmatter.
    ].filter(Boolean).join('\n') + '\n\n';

    await fs.writeFile(outPath, fm + md + '\n', 'utf8');
    slugs.push(post.slug);
    console.log(`✓ ${post.slug}`);
  }

  // Deliberately NOT inside EXPORT_DIR — that folder is input only.
  await fs.mkdir(path.join(ROOT, 'dist-redirects'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'dist-redirects/_slugs.json'),
    JSON.stringify({ essays: slugs, pages: pages.map((p) => p.slug) }, null, 2),
  );

  if (skipped.length) {
    console.log(`\n${skipped.length} already existed and were left alone. Use --force to overwrite.`);
  }
  console.log(`\n${slugs.length - skipped.length} essays written to src/content/essays/`);
  console.log(`${seenImages.size} images handled.`);
  console.log(`\nNext: re-file subjects (search for "TODO re-file"), then npm run redirects.`);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
