import { google } from 'googleapis';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const rawServiceAccount = requiredEnv('GSC_SERVICE_ACCOUNT_JSON');
  const siteUrl = requiredEnv('GSC_SITE_URL');
  const sitemapUrl = process.env.GSC_SITEMAP_URL || `${siteUrl.replace(/\/$/, '')}/sitemap.xml`;

  const credentials = JSON.parse(rawServiceAccount) as {
    client_email?: string;
    private_key?: string;
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const client = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: client });

  await webmasters.sitemaps.submit({
    siteUrl,
    feedpath: sitemapUrl,
  });

  console.log(`Submitted sitemap ${sitemapUrl} for ${siteUrl}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
