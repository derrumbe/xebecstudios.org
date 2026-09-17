#!/usr/bin/env node
/**
 * Show exactly what Astro's content glob matches, and where duplicate ids come
 * from. Reads only; changes nothing.
 *
 *   node scripts/debug-glob.mjs
 *
 * Astro's glob loader derives an id from each file's path relative to the
 * collection base, minus the extension. Two files producing the same id
 * triggers "Duplicate id ... Later items with the same id will overwrite
 * earlier ones", and one of them silently wins.
 *
 * This prints every match with its real path, so a symlink, a case-only
 * difference, or a glob returning the same file twice all become visible.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const COLLECTIONS = ['essays', 'speaking', 'media', 'projects'];

// Astro globs with tinyglobby. Use it if present so we see identical results.
let tinyglobby = null;
try {
  tinyglobby = await import('tinyglobby');
} catch { /* fall back to a manual walk */ }

function manualWalk(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    // Follow symlinks deliberately: a self-referencing link is a real cause.
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) out.push(...manualWalk(full, base));
    else if (/\.(md|mdx)$/.test(e.name)) out.push(path.relative(base, full));
  }
  return out;
}

console.log(`Repo root: ${ROOT}`);
console.log(`Glob engine: ${tinyglobby ? 'tinyglobby (same as Astro)' : 'manual walk'}\n`);

let problems = 0;

for (const name of COLLECTIONS) {
  const base = path.join(ROOT, 'src/content', name);
  if (!fs.existsSync(base)) {
    console.log(`${name}: no such directory\n`);
    continue;
  }

  let matches;
  if (tinyglobby) {
    matches = await tinyglobby.glob('**/*.{md,mdx}', { cwd: base, absolute: false });
  } else {
    matches = manualWalk(base);
  }

  // Exactly how Astro derives the id.
  const byId = new Map();
  for (const rel of matches) {
    const id = rel.replace(/\.(md|mdx)$/, '');
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(rel);
  }

  const dupes = [...byId.entries()].filter(([, v]) => v.length > 1);
  console.log(`${name}: ${matches.length} matches, ${byId.size} unique ids${dupes.length ? `, ${dupes.length} COLLIDING` : ''}`);

  for (const [id, rels] of dupes) {
    problems++;
    console.log(`\n  id "${id}" claimed by ${rels.length} matches:`);
    for (const rel of rels) {
      const full = path.join(base, rel);
      let real = '(missing)';
      let size = '';
      try {
        real = fs.realpathSync(full);
        size = ` ${fs.statSync(full).size}B`;
      } catch { /* leave as missing */ }
      const same = real === full ? '' : `  → real: ${real}`;
      console.log(`    ${rel}${size}${same}`);
    }
    const identical = new Set(rels).size !== rels.length;
    if (identical) {
      console.log(`    ^ the glob returned the same path more than once — a glob bug, not your files.`);
    }
  }
  console.log();
}

// A symlink anywhere under src/content will do it, even without a name clash.
const links = [];
(function findLinks(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      let target = '?';
      try { target = fs.realpathSync(full); } catch { /* dangling */ }
      links.push(`${path.relative(ROOT, full)} → ${target}`);
    } else if (e.isDirectory()) findLinks(full);
  }
})(path.join(ROOT, 'src/content'));

if (links.length) {
  console.log(`Symlinks under src/content (any of these can cause duplicates):`);
  links.forEach((l) => console.log(`  ${l}`));
} else {
  console.log(`No symlinks under src/content.`);
}

console.log(`\n${problems ? `${problems} colliding id(s).` : 'No collisions from this side.'}`);
if (!problems) {
  console.log(`If Astro still warns, the second copy is outside these directories —`);
  console.log(`check for another content.config.ts or a second collection pointing here.`);
}
