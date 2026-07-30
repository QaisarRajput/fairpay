import { describe, expect, it } from 'vitest';

import { adsenseIds, config, siteConfigSchema } from './site';

describe('site config schema', () => {
  it('parses the configured values', () => {
    expect(config.site.domain).toBe('fairpay.hubs.dpdns.org');
    expect(config.analytics.provider).toBe('cloudflare');
  });

  it('fails fast on invalid required fields', () => {
    const result = siteConfigSchema.safeParse({
      ...config,
      site: {
        ...config.site,
        url: '',
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'site.url')).toBe(true);
    }
  });

  it('derives adsense IDs from one publisher ID source', () => {
    expect(adsenseIds.metaAndScript).toBe('');
    expect(adsenseIds.adsTxt).toBe('');
  });
});
