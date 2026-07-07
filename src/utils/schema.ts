import type { CollectionEntry } from 'astro:content';
import { SITE } from '../data/site';

export function BlogPostSchema(post: CollectionEntry<'blog'>) {
  const { id, data } = post;
  const url = `${SITE.url}/${id}/`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    datePublished: data.pubDate.toISOString(),
    dateModified: data.updatedDate?.toISOString() || data.pubDate.toISOString(),
    author: {
      '@type': 'Person',
      name: data.author || SITE.author,
    },
    image: data.image ? `${SITE.url}${data.image}` : undefined,
    url,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export function BreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function WebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
  };
}
