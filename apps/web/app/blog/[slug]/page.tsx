import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ShareLinkButton } from '../../components/share-link-button';
import { getAllBlogPosts, getBlogPostBySlug } from '../../../lib/blog';
import { config, externalUrls } from '../../../lib/site';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post not found',
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${config.site.url}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      images: [post.ogImage || config.seo.defaultOgImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': externalUrls.schemaOrg,
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    mainEntityOfPage: `${config.site.url}/blog/${post.slug}`,
    author: {
      '@type': 'Organization',
      name: config.site.name,
    },
  };

  return (
    <main className="shell legal-shell">
      <article className="panel legal-panel blog-post">
        <h1>{post.title}</h1>
        <p className="subtle">Published {post.publishedAt}</p>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        <ShareLinkButton title={post.title} text={post.description} />
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
