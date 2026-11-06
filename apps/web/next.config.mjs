/** @type {import('next').NextConfig} */
// The marketing site lives at /site. On its own domain (aiventra.com.au) it is served from the root:
// / -> /site, /privacy -> /site/privacy, /terms -> /site/terms. Other hosts (the app) are unchanged.
export const siteHosts = ['aiventra.com.au', 'www.aiventra.com.au'];
const onSite = (source, destination) => siteHosts.map(host => ({ source, destination, has: [{ type: 'host', value: host }] }));
const nextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    return { beforeFiles: [...onSite('/', '/site'), ...onSite('/privacy', '/site/privacy'), ...onSite('/terms', '/site/terms')] };
  },
};
export default nextConfig;
