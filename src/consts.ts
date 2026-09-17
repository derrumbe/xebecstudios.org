export const SITE = {
  title: 'Xebec Studios',
  author: 'Mike Kiser',
  where: 'Austin, Texas',
  url: 'https://xebecstudios.org',
  description:
    'Mike Kiser on identity: who you are, who gets to say so, and what it costs. Technology, history and philosophy.',
  // Giscus. Fill these in from https://giscus.app after enabling Discussions
  // on the repo. Comments render only when repoId and categoryId are set.
  giscus: {
    repo: '',            // e.g. 'mkiser/xebecstudios.org'
    repoId: '',
    category: 'Responses',
    categoryId: '',
  },
} as const;

export const NAV = [
  { href: '/essays/', label: 'Essays' },
  { href: '/speaking/', label: 'Speaking' },
  { href: '/media/', label: 'Media' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
];

export const fmtDate = (d: Date, long = false) =>
  d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: long ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const readingMinutes = (body: string) =>
  Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
