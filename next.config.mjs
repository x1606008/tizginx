/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  serverExternalPackages: ["node:sqlite"]
};

export default nextConfig;
