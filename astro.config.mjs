import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGlosses from './plugins/remark-glosses.mjs';

export default defineConfig({
  site: 'https://xebecstudios.org',
  // Trailing slashes matter here: Ghost served /slug/ with a slash, and the
  // redirect map from mikekiser.org preserves paths exactly. Keep this.
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [remarkGlosses],
    shikiConfig: { theme: 'github-light', wrap: true },
    smartypants: true,
  },
});
