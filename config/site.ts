import { siteConfigSchema, type SiteConfig } from '../packages/schema/src/site-config';

export { siteConfigSchema };
export type { SiteConfig };

export const siteConfigValues: SiteConfig = {
  site: {
    name: 'FairPay',
    tagline: 'Did You Actually Get a Raise?',
    domain: 'fairpay.hubs.dpdns.org',
    url: 'https://fairpay.hubs.dpdns.org',
    locale: 'en-US',
    contactEmail: 'contact@fairpay.hubs.dpdns.org',
  },
  social: {
    twitter: '',
    github: '',
    linkedin: '',
    instagram: '',
    tiktok: '',
  },
  seo: {
    googleSiteVerification: '',
    searchConsolePropertyUrl: '',
    defaultOgImage: '/og/default.svg',
  },
  analytics: {
    provider: 'cloudflare',
    gaMeasurementId: '',
    cloudflareToken: '',
  },
  monetization: {
    tipUrl: '',
    stripePaymentLink: '',
    newsletterEmbedUrl: '',
    consultancyEmail: '',
    calendlyUrl: '',
  },
  adsense: {
    publisherId: '',
    ready: false,
  },
  giscus: {
    repo: '',
    repoId: '',
    category: '',
    categoryId: '',
  },
};

export const config: SiteConfig = siteConfigSchema.parse(siteConfigValues);

export const adsenseIds = {
  metaAndScript: config.adsense.publisherId ? `ca-pub-${config.adsense.publisherId}` : '',
  adsTxt: config.adsense.publisherId ? `pub-${config.adsense.publisherId}` : '',
};

export const externalUrls = {
  schemaOrg: 'https://schema.org',
  cloudflareBeaconScript: 'https://static.cloudflareinsights.com/beacon.min.js',
  cloudflareBeaconConnect: 'https://cloudflareinsights.com',
  adsenseScriptBase: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  adsenseScriptOrigin: 'https://pagead2.googlesyndication.com',
  adsFrameDoubleClick: 'https://googleads.g.doubleclick.net',
  adsFrameSyndication: 'https://tpc.googlesyndication.com',
  fredObservationsBase: 'https://api.stlouisfed.org/fred/series/observations',
  workboxCdn: 'https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js',
} as const;
