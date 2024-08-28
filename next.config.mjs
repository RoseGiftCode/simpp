// next.config.mjs
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@chain': path.resolve(__dirname, 'src/chain'),
      '@walletclient': path.resolve(__dirname, 'src/walletclient'),
    };
    return config;
  },
};

export default nextConfig;
