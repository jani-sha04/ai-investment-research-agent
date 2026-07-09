/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@langchain/langgraph", "@langchain/core"]
  }
};

module.exports = nextConfig;
