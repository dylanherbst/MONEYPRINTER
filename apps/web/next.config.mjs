/** @type {import('next').NextConfig} */
// The marketing site lives at /site. On its own domain (aiventra.com.au) it is served from the root:
// / -> /site, /privacy -> /site/privacy, /terms -> /site/terms. Other hosts (the app) are unchanged.
export const siteHosts = ['aiventra.com.au', 'www.aiventra.com.au'];
const onSite = (source, destination) => siteHosts.map(host => ({ source, destination, has: [{ type: 'host', value: host }] }));
// AiMoneyPrinter's own domain shows its public home page (the seed-to-tree page at /plant-lab) at the root.
export const homeHosts = ['aimoneyprinter.com', 'www.aimoneyprinter.com'];
// The public home page is the cells page (owner approved, 16 Nov 2026); the earlier plant page stays at /plant-lab.
const onHome = homeHosts.map(host => ({ source: '/', destination: '/cells', has: [{ type: 'host', value: host }] }));
const nextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    return { beforeFiles: [...onSite('/', '/site'), ...onSite('/privacy', '/site/privacy'), ...onSite('/terms', '/site/terms'), ...onHome] };
  },
};
export default nextConfig;
