/** @type {import('next').NextConfig} */
// The public home page is the cells page; it is served at / on every host.
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return { beforeFiles: [{ source: '/', destination: '/cells' }] };
  },
};
export default nextConfig;
