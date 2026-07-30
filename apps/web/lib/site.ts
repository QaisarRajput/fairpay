import { adsenseIds, config, externalUrls } from '../../../config/site';

export { adsenseIds, config, externalUrls };

export const canonical = {
  home: `${config.site.url}/`,
  about: `${config.site.url}/about`,
  privacy: `${config.site.url}/privacy`,
  terms: `${config.site.url}/terms`,
  cookies: `${config.site.url}/cookies`,
};

export const staticRoutes = ['/', '/about', '/privacy', '/terms', '/cookies', '/blog', '/inflation'];
