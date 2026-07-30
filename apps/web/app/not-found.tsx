import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="shell legal-shell">
      <section className="panel legal-panel not-found-panel">
        <p className="eyebrow">404</p>
        <h1>This page is off the pay scale</h1>
        <p>The URL you requested is not available. Head back to the calculator and continue your comparison.</p>
        <Link className="inline-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
