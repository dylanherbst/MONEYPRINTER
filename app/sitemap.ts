import type { MetadataRoute } from 'next';
import { siteUrl } from '../lib/aimp/site-config';

// Public marketing pages only; empty until the public domain is set.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl()) return [];
  return ['/', '/how-it-works', '/ecosystem', '/faq', '/about', '/signup', '/policies'].map((path) => ({ url: siteUrl(path) as string }));
}
