// next.config.mjs
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@chain': path.resolve('./src/chain.ts'), // Ensure this path matches the actual location
      '@walletclient': path.resolve('./src/walletclient.ts'), // Ensure this path matches the actual location
    };
    return config;
  },
};

export default nextConfig;

