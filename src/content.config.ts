import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The three subjects. Deliberately short — a filter row stops being scannable
 * past four or five. Theology folds into Philosophy; humour lives in the
 * writing and the margin rather than in a bin of its own.
 */
export const SUBJECTS = ['Technology', 'History', 'Philosophy'] as const;
const subject = z.enum(SUBJECTS);

/**
 * The second axis. Subjects answer "what kind of thinking is this"; tags answer
 * "what is it about", which is the question the Ghost tags were really
 * answering. Deliberately a closed list and deliberately disjoint from
 * SUBJECTS: a free-text tag field drifts into Security/security/InfoSec within
 * a year, and a tag sharing a name with a subject would make /subjects/history
 * ambiguous the day anyone builds tag pages.
 *
 * Tags display on the essay and nowhere else — they are not a second filter
 * row. Three subjects is the navigation; this is provenance.
 */
export const TAGS = [
  'Identity',
  'Security',
  'Privacy',
  'Ethics',
  'Finance',
  'AI',
  'Satire',
  'Sport',
] as const;
const tag = z.enum(TAGS);

/**
 * Why he is at an event. The speaking collection started as a record of talks
 * given, where the format said everything; a calendar of what is coming has
 * to admit that turning up is not the same as being on the programme. Closed,
 * for the same reason the subjects and tags are.
 */
export const ROLES = ['Speaking', 'Facilitating', 'Hosting', 'Organising', 'Attending'] as const;
const role = z.enum(ROLES);

/**
 * Optional, and tolerant of an empty key.
 *
 * Clearing a value in Obsidian's Properties panel leaves the key behind with
 * nothing after it, which YAML reads as null — and plain `.optional()` rejects
 * null, so the build fails on a file that looks fine. This accepts null and
 * normalises it away.
 */
const opt = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => (v === null ? undefined : v));

const essays = defineCollection({
  loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: opt(z.coerce.date()),
    subject,
    // nullish, not .default([]): clearing the list in Obsidian's Properties
    // panel leaves `tags:` with nothing after it, and a bare default still
    // rejects the null that YAML reads there. Absent, null and empty all
    // normalise to [], so the layout never has to guard.
    tags: z.array(tag).nullish().transform((v) => v ?? []),
    /**
     * Secondary subjects. `subject` is where the argument lands and drives the
     * navigation; this is for the essay whose other reading is substantial
     * enough that someone browsing that subject would want it — Trafalgar in
     * the Nelson piece, the 1950s in the baseball one. It shows on the essay
     * and adds a subordinate group to those subjects' pages; it never changes
     * the primary filing.
     *
     * Not a licence to cross-file everything. Almost every essay here touches
     * two subjects glancingly; this is for the ones where the second reading
     * carries real weight, and it stops meaning anything if it goes on all
     * twenty.
     */
    crossFiled: z.array(subject).nullish().transform((v) => v ?? []),
    // Shown on the index and in meta tags. Keep it to one or two sentences.
    description: z.string(),
    draft: z.boolean().default(false),
    // Glosses are NOT frontmatter. Write them inline in the body as Obsidian
    // callouts — > [!gloss] / > [!aside] — and plugins/remark-glosses.mjs
    // lifts them into the margin at build time.
    // Cross-references into the other collections, by id.
    talk: opt(z.string()),
    project: opt(z.string()),
    // Loose ordering for multi-part arguments.
    series: opt(z.string()),
    seriesIndex: opt(z.number().int()),
    // Set by the migration script so old Ghost URLs keep resolving.
    legacySlug: opt(z.string()),
  })
    /**
     * Caught at build time rather than rendering as "Philosophy. Also filed
     * under Philosophy." — which is the shape the mistake takes, and it reads
     * as a bug in the site rather than a typo in the file.
     */
    .superRefine((d, ctx) => {
      if (d.crossFiled.includes(d.subject)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['crossFiled'],
          message: `crossFiled repeats the primary subject (${d.subject}). List only the other subjects.`,
        });
      }
      if (new Set(d.crossFiled).size !== d.crossFiled.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['crossFiled'],
          message: 'crossFiled lists the same subject twice.',
        });
      }
    }),
});

const speaking = defineCollection({
  loader: glob({ base: './src/content/speaking', pattern: '**/*.{md,yaml,yml}' }),
  schema: z.object({
    // Optional: a calendar entry for an event he is attending has no talk to
    // name, and the event is the heading instead.
    title: opt(z.string()),
    date: z.coerce.date(),
    // The last day, for an event that runs more than one. Omit for a talk,
    // which happens on its day.
    until: opt(z.coerce.date()),
    event: z.string(),
    location: opt(z.string()),
    format: z.enum(['Keynote', 'Talk', 'Panel', 'Workshop', 'Interview']).default('Talk'),
    // Shown in place of the format on upcoming entries. A talk already says
    // what it is; a conference he is going to does not.
    role: opt(role),
    minutes: opt(z.number().int()),
    slides: opt(z.string().url()),
    video: opt(z.string().url()),
    withOthers: z.array(z.string()).default([]),
    subject: opt(subject),
    // The essay this talk later became, if it became one.
    essay: opt(z.string()),
  }),
});

const media = defineCollection({
  loader: glob({ base: './src/content/media', pattern: '**/*.{md,yaml,yml}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    outlet: z.string(),
    format: z.enum(['Podcast', 'Article', 'Interview', 'Video', 'Quoted']),
    url: z.string().url(),
    note: opt(z.string()),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['Active', 'Dormant', 'Complete']).default('Active'),
    started: opt(z.coerce.date()),
    ended: opt(z.coerce.date()),
    // Either a full URL or a site-relative path, so a project that lives on
    // this site can be linked without hard-coding the domain.
    repo: opt(z.string().url()),
    url: opt(z.union([z.string().url(), z.string().startsWith('/')])),
    // Sort key for /projects/ and the homepage, ascending. The numbers run
    // newest-first, so a project left at the default 0 lands at the top —
    // which is where a project you have just started belongs.
    order: z.number().int().default(0),
  }),
});

/**
 * Research documents that are prose rather than data.
 *
 * The Digital Estate Roles viewer is driven by committed JSON and needs no
 * collection; these are the written pieces that sit beside it — the use-case
 * analysis, the standards landscape, the proposed event set. They are authored
 * in the digital-estate-roles repository and kept here as copies, the same
 * arrangement as src/scripts/der/app.js, because that repository is private and
 * these are the parts meant to be read.
 *
 * Deliberately a thin schema. These documents carry their own headings and
 * their own verification dates in their text; the frontmatter exists to order
 * them and to feed the section index.
 */
const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    // Shown on the section index and in meta tags.
    description: z.string(),
    // Which section of the research area this belongs to, so a second body of
    // work does not have to share an index with this one.
    section: z.enum(['digital-estate-standards']),
    // Ascending. These three read in order and the order is the argument:
    // the use cases, then what exists, then what is missing.
    order: z.number().int().default(0),
    // A one-line note for the index, where a document's status is not obvious
    // from its title — "a proposal, not a specification".
    standing: opt(z.string()),
    updated: opt(z.coerce.date()),
  }),
});

export const collections = { essays, speaking, media, projects, research };
