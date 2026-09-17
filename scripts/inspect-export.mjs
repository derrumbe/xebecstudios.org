#!/usr/bin/env node
/**
 * Print the shape of whatever is in _ghost-export/, so a failed migration can
 * be diagnosed without guessing. Reads nothing, writes nothing, changes nothing.
 *
 *   node scripts/inspect-export.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '../_ghost-export');

let files;
try {
  files = fs.readdirSync(DIR);
} catch {
  console.error(`No _ghost-export/ directory here. Create it and drop the export in.`);
  process.exit(1);
}
console.log(`Files in _ghost-export/:`);
for (const f of files) {
  const { size } = fs.statSync(path.join(DIR, f));
  console.log(`  ${f}  (${(size / 1024).toFixed(0)} KB)`);
}

const json = files.filter((f) => f.endsWith('.json') && !f.startsWith('_'));
if (!json.length) {
  console.error(`\nNo Ghost export .json found. If you downloaded a .zip, unzip it first —` +
    ` the JSON is inside, alongside a content/ folder of images.`);
  process.exit(1);
}

for (const f of json) {
  console.log(`\n=== ${f} ===`);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  } catch (e) {
    console.log(`  not valid JSON: ${e.message}`);
    continue;
  }
  console.log(`  top-level keys: ${Object.keys(data).join(', ')}`);

  const seen = new Set();
  const walk = (node, p) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      const first = node.find((x) => x && typeof x === 'object');
      if (first) {
        const keys = Object.keys(first);
        const interesting = keys.includes('slug') || keys.includes('post_id') || keys.includes('name');
        if (interesting || node.length > 3) {
          console.log(`  ${p || 'root'}  [${node.length}]  keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? ' …' : ''}`);
        }
      }
      node.slice(0, 1).forEach((v, i) => walk(v, `${p}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(node)) walk(v, p ? `${p}.${k}` : k);
  };
  walk(data, '');

  // Which body field is actually populated? Ghost has used three.
  const posts = (() => {
    const d = data?.db?.[0]?.data ?? data?.data ?? data;
    if (Array.isArray(d?.posts)) return d.posts;
    let out = null;
    const w = (n) => {
      if (out || !n || typeof n !== 'object') return;
      if (Array.isArray(n)) { if (n.some((x) => x?.slug && x?.title)) { out = n; return; } n.forEach(w); return; }
      Object.values(n).forEach(w);
    };
    w(data);
    return out;
  })();

  if (posts?.length) {
    const p0 = posts[0];
    console.log(`\n  first post: "${p0.title ?? '(no title)'}"  slug=${p0.slug}  status=${p0.status} type=${p0.type}`);
    for (const field of ['html', 'plaintext', 'mobiledoc', 'lexical']) {
      const v = p0[field];
      console.log(`    ${field.padEnd(10)} ${v ? `${String(v).length} chars` : '— empty'}`);
    }
    const withHtml = posts.filter((p) => p.html).length;
    console.log(`\n  ${posts.length} posts total, ${withHtml} with rendered html.`);
    if (!withHtml) {
      console.log(`  ! No html anywhere. This export is mobiledoc/lexical only —` +
        ` tell me and I'll add a converter.`);
    }
  }
}
