import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppBar } from './components/app-bar';
import { SiteFooter } from './components/site-footer';
import { SwRegister } from './components/sw-register';
import './globals.css';
import { adsenseIds, config, externalUrls } from '../lib/site';
import { buildCsp } from '../lib/csp';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(config.site.url),
  title: {
    default: `${config.site.name} - ${config.site.tagline}`,
    template: `%s | ${config.site.name}`,
  },
  description: 'A personalized inflation-adjusted wage reality check.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: config.site.url,
    siteName: config.site.name,
    title: `${config.site.name} - ${config.site.tagline}`,
    description: 'A personalized inflation-adjusted wage reality check.',
    images: [config.seo.defaultOgImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.site.name} - ${config.site.tagline}`,
    description: 'A personalized inflation-adjusted wage reality check.',
    images: [config.seo.defaultOgImage],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: config.seo.googleSiteVerification || undefined,
  },
  other: adsenseIds.metaAndScript
    ? {
        'google-adsense-account': adsenseIds.metaAndScript,
      }
    : undefined,
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const csp = buildCsp();
  const shouldEmitCsp = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {shouldEmitCsp ? <meta httpEquiv="Content-Security-Policy" content={csp} /> : null}
        {/* No-FOUC: apply theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('fairpay.theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light')}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppBar />
        <div id="main-content">{children}</div>
        <SwRegister />
        <SiteFooter />
        {config.analytics.provider === 'cloudflare' && config.analytics.cloudflareToken ? (
          <script
            defer
            src={externalUrls.cloudflareBeaconScript}
            data-cf-beacon={JSON.stringify({ token: config.analytics.cloudflareToken })}
          />
        ) : null}
        {config.adsense.ready && adsenseIds.metaAndScript ? (
          <script
            async
            src={`${externalUrls.adsenseScriptBase}?client=${adsenseIds.metaAndScript}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </body>
    </html>
  );
}
