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
