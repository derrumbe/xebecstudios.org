import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

/**
 * Full post content in the feed, deliberately. Buttondown can ingest an RSS
 * feed and turn it into a newsletter later without touching the site — but only
 * if the feed carries the whole essay rather than a teaser.
 */
export async function GET(context) {
  const essays = (await getCollection('essays', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: essays.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.description,
      link: `/${e.id}/`,
      categories: [e.data.subject],
      content: e.rendered?.html ?? '',
    })),
    customData: '<language>en-us</language>',
  });
}
