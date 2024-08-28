import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@chain': path.resolve(__dirname, 'src'),
      '@walletclient': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
