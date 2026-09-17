#!/usr/bin/env node
/**
 * Repair image paths in already-migrated essays.
 *
 *   npm run fix-images              # uses https://mikekiser.org as the origin
 *   GHOST_ORIGIN=https://... npm run fix-images
 *   npm run fix-images -- --dry     # report only, change nothing
 *
 * Ghost writes `__GHOST_URL__/content/images/...` into exported content rather
 * than a real URL. The migration script only rewrote absolute http(s) links, so
 * those placeholders survived and Astro cannot resolve them.
 *
 * This finds every unresolvable image reference across src/content/, gets a
 * local copy, and rewrites the markdown in place. It prefers copying from an
 * unzipped Ghost export (which ships the images alongside the JSON) and only
 * falls back to downloading.
 *
 * Safe to re-run. Images already pointing at /images/ are left alone.
 */

import fs from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'src/content');
const IMG_OUT = path.join(ROOT, 'public/images');
const EXPORT_DIR = path.join(ROOT, '_ghost-export');
const ORIGIN = (process.env.GHOST_ORIGIN ?? 'https://mikekiser.org').replace(/\/$/, '');
const DRY = process.argv.includes('--dry');

/** Every way a Ghost image reference shows up in exported markdown. */
const PATTERNS = [
  /__GHOST_URL__(\/content\/images\/[^\s)"']+)/g,
  /https?:\/\/[^/\s)"']*ghost\.io(\/content\/images\/[^\s)"']+)/g,
  /https?:\/\/[^/\s)"']*mikekiser\.org(\/content\/images\/[^\s)"']+)/g,
  /(?<![\w/])(\/content\/images\/[^\s)"']+)/g,
];

const localName = (urlPath) => {
  const clean = urlPath.split('?')[0];
  const base = path.basename(clean);
  const ym = clean.match(/\/(\d{4})\/(\d{2})\//);
  return ym ? `${ym[1]}-${ym[2]}-${base}` : base;
};

/** Ghost's unzipped export carries the originals. Always cheaper than a fetch. */
async function fromLocalExport(urlPath) {
  const rel = urlPath.replace(/^\//, '').split('?')[0];
  const candidates = [
    path.join(EXPORT_DIR, rel),
    path.join(EXPORT_DIR, 'content', rel.replace(/^content\//, '')),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

const fetched = new Map();

async function materialise(urlPath) {
  if (fetched.has(urlPath)) return fetched.get(urlPath);
  const name = localName(urlPath);
  const dest = path.join(IMG_OUT, name);
  const webPath = `/images/${name}`;

  if (existsSync(dest)) {
    fetched.set(urlPath, webPath);
    return webPath;
  }
  if (DRY) {
    fetched.set(urlPath, webPath);
    return webPath;
  }

  await fs.mkdir(IMG_OUT, { recursive: true });

  const local = await fromLocalExport(urlPath);
  if (local) {
    await fs.copyFile(local, dest);
    console.log(`  ⊙ ${name}  (from export)`);
    fetched.set(urlPath, webPath);
    return webPath;
  }

  const url = `${ORIGIN}${urlPath}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    await pipeline(res.body, createWriteStream(dest));
    console.log(`  ↓ ${name}`);
    fetched.set(urlPath, webPath);
    return webPath;
  } catch (err) {
    console.warn(`  ! ${name} — ${err.message}`);
    console.warn(`    tried ${url}`);
    fetched.set(urlPath, null);
    return null;
  }
}

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(md|mdx)$/.test(e.name)) out.push(full);
  }
  return out;
}

async function main() {
  const files = await walk(CONTENT);
  console.log(`Scanning ${files.length} content files. Origin: ${ORIGIN}${DRY ? '  (dry run)' : ''}\n`);

  let changedFiles = 0;
  let refs = 0;
  const failed = [];

  for (const file of files) {
    let text = await fs.readFile(file, 'utf8');
    const before = text;

    // Collect first so downloads can be awaited outside the replace callback.
    const found = new Set();
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) found.add(m[1]);
    }
    if (!found.size) continue;

    const rel = path.relative(ROOT, file);
    console.log(`${rel}  (${found.size} image${found.size === 1 ? '' : 's'})`);

    for (const urlPath of found) {
      refs++;
      const webPath = await materialise(urlPath);
      if (!webPath) {
        failed.push(`${rel}: ${urlPath}`);
        continue;
      }
      // Replace the whole reference, prefix included, wherever it appears.
      text = text
        .split(`__GHOST_URL__${urlPath}`).join(webPath)
        .replace(new RegExp(`https?://[^/\\s)"']*(?:ghost\\.io|mikekiser\\.org)${urlPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), webPath);
      // Bare /content/images/... last, so it doesn't eat the prefixed forms.
      text = text.split(urlPath).join(webPath);
    }

    // Any remaining placeholder is a link, not an image. Point it at the origin.
    text = text.split('__GHOST_URL__').join(ORIGIN);

    if (text !== before) {
      changedFiles++;
      if (!DRY) await fs.writeFile(file, text, 'utf8');
    }
  }

  console.log(`\n${refs} references across ${changedFiles} files${DRY ? ' would be' : ''} rewritten.`);
  if (failed.length) {
    console.log(`\n${failed.length} could not be retrieved:`);
    failed.forEach((f) => console.log(`  ${f}`));
    console.log(`\nIf mikekiser.org is already down, set GHOST_ORIGIN to your`);
    console.log(`ghost.io subdomain, or unzip the Ghost export into _ghost-export/`);
    console.log(`so the originals can be copied instead of fetched.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
