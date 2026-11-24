import type { MetadataRoute } from 'next';
import { indexable, siteUrl } from '../lib/aimp/site-config';

// Previews and anything without the confirmed domain stay out of search engines.
export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: siteUrl('/sitemap.xml') };
}
