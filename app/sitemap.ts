import type { MetadataRoute } from 'next';
import { site } from '../lib/aimp/site-config';

// Public marketing pages only.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${site.domain}`;
  return ['/', '/how-it-works', '/faq', '/about', '/signup'].map((path) => ({ url: `${base}${path}` }));
}
