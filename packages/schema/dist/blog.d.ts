import { z } from 'zod';
export declare const BlogFrontmatter: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    description: z.ZodString;
    publishedAt: z.ZodString;
    tags: z.ZodArray<z.ZodString>;
    ogImage: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type BlogFrontmatter = z.infer<typeof BlogFrontmatter>;
//# sourceMappingURL=blog.d.ts.map