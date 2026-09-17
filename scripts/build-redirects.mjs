#!/usr/bin/env node
/**
 * Build the mikekiser.org → xebecstudios.org redirect map.
 *
 * Reads the slugs the migration found and emits a Cloudflare Bulk Redirects
 * CSV. Every essay redirects path-for-path; the root and the old section pages
 * go to their nearest equivalent.
 *
 *   node scripts/build-redirects.mjs
 *   → dist-redirects/mikekiser-bulk.csv
 *
 * Upload at: Cloudflare dashboard → Bulk Redirects → create list → import CSV,
 * then attach it to a rule. All on the free plan.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OLD = 'https://mikekiser.org';
const NEW = 'https://xebecstudios.org';
const OUT = path.join(ROOT, 'dist-redirects');

// Old Ghost pages that have no path-for-path equivalent.
const PAGE_MAP = {
  '/': '/about/',
  '/about/': '/about/',
  '/speaking/': '/speaking/',
  '/projects/': '/projects/',
  '/media/': '/media/',
  '/contact/': '/about/#contact',
  '/rss/': '/rss.xml',
  '/tag/': '/essays/',
};

async function main() {
  let slugs = [];
  for (const p of ['dist-redirects/_slugs.json', '_ghost-export/_slugs.json']) {
    try {
      const raw = JSON.parse(await fs.readFile(path.join(ROOT, p), 'utf8'));
      slugs = raw.essays ?? [];
      break;
    } catch { /* try the next */ }
  }
  if (!slugs.length) {
    console.warn('! No _slugs.json yet — run npm run migrate first. Emitting page map only.\n');
  }

  const rows = [['source', 'target', 'status', 'preserve_query_string']];

  for (const [from, to] of Object.entries(PAGE_MAP)) {
    rows.push([`${OLD}${from}`, `${NEW}${to}`, '301', 'true']);
  }
  for (const slug of slugs) {
    rows.push([`${OLD}/${slug}/`, `${NEW}/${slug}/`, '301', 'true']);
  }

  await fs.mkdir(OUT, { recursive: true });
  const csv = rows.map((r) => r.join(',')).join('\n') + '\n';
  await fs.writeFile(path.join(OUT, 'mikekiser-bulk.csv'), csv, 'utf8');

  // A catch-all Redirect Rule for anything the list misses. Add this by hand
  // in Cloudflare with LOWER priority than the bulk list, so specific wins.
  const fallback = `
Cloudflare → Rules → Redirect Rules → Create

  Name:   mikekiser.org catch-all
  When:   (http.host eq "mikekiser.org") or (http.host eq "www.mikekiser.org")
  Then:   Dynamic redirect
          Expression: concat("${NEW}", http.request.uri.path)
          Status: 301
          Preserve query string: on

Set this BELOW the bulk redirect list in priority. The list handles the
renamed pages; this catches every essay slug and anything forgotten, so
nothing 404s even if the list drifts.
`.trim();

  await fs.writeFile(path.join(OUT, 'catch-all-rule.txt'), fallback + '\n', 'utf8');

  console.log(`${rows.length - 1} redirects → dist-redirects/mikekiser-bulk.csv`);
  console.log(`Catch-all rule    → dist-redirects/catch-all-rule.txt`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
