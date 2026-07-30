import type { MetadataRoute } from 'next';

import { config } from '../lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.site.name,
    short_name: config.site.name,
    description: config.site.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#0E7C66',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  };
}
