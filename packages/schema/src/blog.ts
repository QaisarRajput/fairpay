import { z } from 'zod';

export const BlogFrontmatter = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.string().date(),
  tags: z.array(z.string().min(1)).min(1),
  ogImage: z.string().default(''),
});

export type BlogFrontmatter = z.infer<typeof BlogFrontmatter>;
