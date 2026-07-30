import { adsenseIds, config, externalUrls } from './site';

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function buildCsp(): string {
  const scriptSources = unique([
    "'self'",
    "'unsafe-inline'",
    config.analytics.provider === 'cloudflare' && config.analytics.cloudflareToken
      ? new URL(externalUrls.cloudflareBeaconScript).origin
      : '',
    config.adsense.ready && adsenseIds.metaAndScript
      ? externalUrls.adsenseScriptOrigin
      : '',
  ]);

  const connectSources = unique([
    "'self'",
    config.analytics.provider === 'cloudflare' && config.analytics.cloudflareToken
      ? externalUrls.cloudflareBeaconConnect
      : '',
  ]);

  const frameSources = unique([
    "'self'",
    config.adsense.ready && adsenseIds.metaAndScript ? externalUrls.adsFrameDoubleClick : '',
    config.adsense.ready && adsenseIds.metaAndScript ? externalUrls.adsFrameSyndication : '',
  ]);

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    `frame-src ${frameSources.join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  return directives.join('; ');
}
