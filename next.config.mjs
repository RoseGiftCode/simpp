import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path and directory equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@chain': path.resolve(__dirname, 'src'), // Resolves to 'src' directory
      '@walletclient': path.resolve(__dirname, 'src'), // Resolves to 'src' directory
    };
    return config;
  },
};

export default nextConfig;
