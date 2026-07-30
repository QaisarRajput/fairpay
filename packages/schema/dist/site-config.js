import { z } from 'zod';
export const siteConfigSchema = z.object({
    site: z.object({
        name: z.string().min(1),
        tagline: z.string().min(1),
        domain: z.string().min(1),
        url: z.string().url(),
        locale: z.string().default('en-US'),
        contactEmail: z.string().email(),
    }),
    social: z.object({
        twitter: z.string().default(''),
        github: z.string().default(''),
        linkedin: z.string().default(''),
        instagram: z.string().default(''),
        tiktok: z.string().default(''),
    }),
    seo: z.object({
        googleSiteVerification: z.string().default(''),
        searchConsolePropertyUrl: z.string().default(''),
        defaultOgImage: z.string().default('/og/default.png'),
    }),
    analytics: z.object({
        provider: z.enum(['cloudflare', 'ga4', 'none']).default('cloudflare'),
        gaMeasurementId: z.string().default(''),
        cloudflareToken: z.string().default(''),
    }),
    monetization: z.object({
        tipUrl: z.string().default(''),
        stripePaymentLink: z.string().default(''),
        newsletterEmbedUrl: z.string().default(''),
        consultancyEmail: z.string().default(''),
        calendlyUrl: z.string().default(''),
    }),
    adsense: z.object({
        publisherId: z
            .string()
            .regex(/^\d*$/, 'adsense.publisherId must be empty or raw numeric characters only')
            .default(''),
        ready: z.boolean().default(false),
    }),
    giscus: z.object({
        repo: z.string().default(''),
        repoId: z.string().default(''),
        category: z.string().default(''),
        categoryId: z.string().default(''),
    }),
});
//# sourceMappingURL=site-config.js.map