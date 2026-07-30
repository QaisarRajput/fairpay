import Link from 'next/link';

import { config } from '../../lib/site';

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Footer">
      <nav className="footer-nav">
        <Link href="/">Home</Link>
        <Link href="/#calculator">Calculator</Link>
        <Link href="/inflation">Explorer</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/cookies">Cookies</Link>
        <Link href={`mailto:${config.site.contactEmail}`}>Contact</Link>
      </nav>
    </footer>
  );
}
