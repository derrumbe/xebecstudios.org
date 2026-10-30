import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGlosses from './plugins/remark-glosses.mjs';

export default defineConfig({
  site: 'https://xebecstudios.org',
  // Trailing slashes matter here: Ghost served /slug/ with a slash, and the
  // redirect map from mikekiser.org preserves paths exactly. Keep this.
  trailingSlash: 'always',
  // The Digital Estate Standards section is reachable by URL but not advertised:
  // it is unlinked from /research/ and its pages set noindex. Keep it out of the
  // sitemap too, so we are not submitting pages we have asked not to be indexed.
  // Remove this filter and the noindex props together when the section is announced.
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/research/digital-estate-standards/'),
    }),
  ],
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [remarkGlosses],
    shikiConfig: { theme: 'github-light', wrap: true },
    smartypants: true,
  },
});
