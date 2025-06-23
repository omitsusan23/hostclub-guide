/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@vercel/mcp-adapter']
  }
}

module.exports = nextConfig 