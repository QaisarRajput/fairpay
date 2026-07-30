import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { BlogFrontmatter } from '@fairpay/schema';

export type BlogPost = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  tags: string[];
  ogImage: string;
  markdown: string;
  html: string;
};

const BLOG_DIR = resolve(process.cwd(), '..', '..', 'content', 'blog');

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('## ')) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      output.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      output.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        output.push('<ul>');
        inList = true;
      }
      output.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      output.push('</ul>');
      inList = false;
    }

    output.push(`<p>${escapeHtml(line)}</p>`);
  }

  if (inList) {
    output.push('</ul>');
  }

  return output.join('\n');
}

function parseFrontmatter(content: string): { frontmatter: string; markdown: string } {
  if (!content.startsWith('---\n')) {
    throw new Error('Markdown file missing frontmatter start delimiter.');
  }

  const closingIndex = content.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    throw new Error('Markdown file missing frontmatter end delimiter.');
  }

  const frontmatter = content.slice(4, closingIndex);
  const markdown = content.slice(closingIndex + 5).trim();
  return { frontmatter, markdown };
}

function parseFrontmatterObject(frontmatterRaw: string): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};

  for (const row of frontmatterRaw.split(/\r?\n/)) {
    const line = row.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf(':');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key === 'tags') {
      parsed.tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      continue;
    }

    parsed[key] = value;
  }

  return parsed;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const files = await readdir(BLOG_DIR);
  const posts: BlogPost[] = [];

  for (const fileName of files) {
    if (!fileName.endsWith('.md')) {
      continue;
    }

    const raw = await readFile(resolve(BLOG_DIR, fileName), 'utf8');
    const { frontmatter, markdown } = parseFrontmatter(raw);
    const frontmatterData = BlogFrontmatter.parse(parseFrontmatterObject(frontmatter));

    posts.push({
      ...frontmatterData,
      markdown,
      html: markdownToHtml(markdown),
    });
  }

  return posts.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
