export const SITE = {
  title: 'Xebec Studios',
  author: 'Mike Kiser',
  url: 'https://xebecstudios.org',
  description:
    'Mike Kiser on identity: who you are, who gets to say so, and what it costs. Technology, history and philosophy.',
  // Giscus. Fill these in from https://giscus.app after enabling Discussions
  // on the repo. Comments render only when repoId and categoryId are set.
  // Discussions live in the Announcements category: only maintainers can open
  // a thread there, so every discussion is one giscus created for an essay
  // rather than a stray thread sitting alongside them.
  giscus: {
    repo: 'derrumbe/xebecstudios.org',
    repoId: 'R_kgDOUeNOgA',
    category: 'Announcements',
    categoryId: 'DIC_kwDOUeNOgM4DFxz8',
  },
} as const;

export const NAV = [
  { href: '/essays/', label: 'Essays' },
  { href: '/research/', label: 'Research' },
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

/**
 * A talk date that is exactly 1 January is a year Ghost recorded without a
 * month — the speaking archive is full of them. Printing "01 January 2019"
 * claims a precision the source never had, so those print as the year alone.
 * A talk genuinely given on New Year's Day gets caught by this, and would also
 * be a strange talk to have given.
 */
export const fmtWhen = (d: Date, long = false) =>
  d.getUTCMonth() === 0 && d.getUTCDate() === 1 ? String(d.getUTCFullYear()) : fmtDate(d, long);

/**
 * A date span, for events that run more than a day: "07–09 Dec 2026",
 * "28 Jun – 01 Jul 2027". Collapses to a single date when there is no end,
 * and goes through fmtWhen so a bare-year talk still prints as the year.
 */
export const fmtSpan = (start: Date, end?: Date) => {
  if (!end || end.valueOf() <= start.valueOf()) return fmtWhen(start);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const day = (d: Date) => String(d.getUTCDate()).padStart(2, '0');
  if (sameMonth) return `${day(start)}–${day(end)} ${fmtDate(end).slice(3)}`;
  if (sameYear) return `${fmtDate(start).slice(0, 6)} – ${fmtDate(end)}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
};

export const readingMinutes = (body: string) =>
  Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
