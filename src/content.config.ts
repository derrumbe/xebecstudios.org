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
    title: z.string(),
    date: z.coerce.date(),
    event: z.string(),
    location: opt(z.string()),
    format: z.enum(['Keynote', 'Talk', 'Panel', 'Workshop', 'Interview']).default('Talk'),
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
    repo: opt(z.string().url()),
    url: opt(z.string().url()),
    // Sort key for /projects/ and the homepage, ascending. The numbers run
    // newest-first, so a project left at the default 0 lands at the top —
    // which is where a project you have just started belongs.
    order: z.number().int().default(0),
  }),
});

export const collections = { essays, speaking, media, projects };
