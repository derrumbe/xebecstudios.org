/**
 * Obsidian callouts → margin glosses.
 *
 *     > [!gloss]
 *     > Iron gall ink was itself a provenance technology.
 *
 *     > [!aside]
 *     > The Ship of Theseus is this argument in better weather.
 *
 * Obsidian renders these natively as callout boxes, inline, right where you
 * typed them. This plugin lifts them out of the flow at build time and hands
 * them to the layout, which puts them in the margin column beside the
 * paragraph they followed.
 *
 * The anchor is positional rather than numeric on purpose. An earlier version
 * used `at: 3` in frontmatter, which meant "beside the fourth paragraph,
 * counted by hand" — insert one paragraph and every gloss below it silently
 * points at the wrong place. Here the gloss lives next to its paragraph in the
 * source, so moving the text moves the note.
 *
 * `gloss` gets the red rule (a note on a specific claim), `aside` the green
 * one (a remark about the passage). Same wind hierarchy as the rhumb lines.
 */

const MARKER = /^\s*\[!(gloss|aside)\]\s*(.*)$/is;

const toText = (node) => {
  if (node.value !== undefined) return node.value;
  if (node.type === 'break') return ' ';
  if (node.children) return node.children.map(toText).join('');
  return '';
};

export default function remarkGlosses() {
  return (tree, file) => {
    const glosses = [];
    const kept = [];
    let paragraphs = 0;

    for (const node of tree.children) {
      if (node.type === 'paragraph') {
        kept.push(node);
        paragraphs++;
        continue;
      }

      if (node.type === 'blockquote') {
        const text = node.children.map(toText).join(' ').replace(/\s+/g, ' ').trim();
        const m = text.match(MARKER);
        if (m) {
          const [, kind, body] = m;
          if (body.trim()) {
            glosses.push({
              note: body.trim(),
              // Anchor to the paragraph just above. Zero if the gloss opens
              // the essay, which is unusual but shouldn't throw.
              at: Math.max(0, paragraphs - 1),
              tone: kind.toLowerCase() === 'aside' ? 'aside' : 'claim',
            });
          }
          continue; // drop it from the body
        }
      }

      kept.push(node);
    }

    tree.children = kept;

    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.glosses = glosses;
  };
}
