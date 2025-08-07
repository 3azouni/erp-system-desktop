/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  webpack: (config, { isServer }) => {
    // Suppress punycode deprecation warning
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      /the `punycode` module is deprecated/,
    ];
    
    return config;
  },
}

export default nextConfig
