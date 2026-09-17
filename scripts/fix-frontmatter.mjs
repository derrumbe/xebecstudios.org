#!/usr/bin/env node
/**
 * Repair frontmatter fences glued to the body.
 *
 *   npm run fix-frontmatter
 *   npm run fix-frontmatter -- --dry
 *
 * An earlier migrate-ghost.mjs joined the frontmatter array with
 * `.filter(Boolean)`, which dropped the trailing empty string along with the
 * intended nulls. The result was:
 *
 *     ---
 *     title: "Houston, We Have a Problem"
 *     ---****On April 2, 2018, ...
 *
 * YAML never closes, so Obsidian shows the block as plain text and Astro sees
 * a file with no frontmatter at all. This inserts the missing break.
 *
 * Idempotent — files that are already correct are left alone.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry');

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
  let fixed = 0;
  let ok = 0;
  const odd = [];

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    const rel = path.relative(ROOT, file);

    if (!text.startsWith('---')) {
      odd.push(`${rel} — does not start with a fence`);
      continue;
    }

    // Opening fence, the block, then the closing fence wherever it lands.
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) {
      odd.push(`${rel} — no closing fence found`);
      continue;
    }

    const after = text.slice(m[0].length);
    if (after.startsWith('\n') || after.startsWith('\r\n') || after === '') {
      ok++;
      continue;
    }

    const repaired = `${m[0]}\n\n${after.replace(/^\s+/, '')}`;
    const preview = after.replace(/\s+/g, ' ').slice(0, 52);
    console.log(`  fixing ${rel}`);
    console.log(`          fence was glued to: ${preview}…`);

    if (!DRY) await fs.writeFile(file, repaired, 'utf8');
    fixed++;
  }

  console.log(`\n${fixed} ${DRY ? 'would be repaired' : 'repaired'}, ${ok} already fine.`);
  if (odd.length) {
    console.log(`\n${odd.length} need a look by hand:`);
    odd.forEach((o) => console.log(`  ${o}`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
