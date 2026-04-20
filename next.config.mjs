/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Dev: disable persistent webpack filesystem cache — on Windows, partial deletes / concurrent
  // access to `.next` can leave pack files missing (ENOENT on *.pack.gz) and break chunk
  // resolution (e.g. Cannot find module './276.js'). Production builds keep default caching.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
