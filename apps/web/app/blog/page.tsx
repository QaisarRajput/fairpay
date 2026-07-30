import type { Metadata } from 'next';
import Link from 'next/link';

import { getAllBlogPosts } from '../../lib/blog';
import { config } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical guides on raises, CPI, and inflation-adjusted salary decisions.',
  alternates: { canonical: `${config.site.url}/blog` },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  return (
    <main className="shell legal-shell">
      <section className="panel legal-panel">
        <h1>Blog</h1>
        <p className="subtle">Insights focused on wages, inflation, and real purchasing power.</p>

        <div className="blog-list">
          {posts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.description}</p>
              <p className="subtle">Published {post.publishedAt}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
