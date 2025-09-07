/** @type {import('next').NextConfig} */
const nextConfig = {
  // Conditional output for different deployment environments
  // For Firebase deployment with Cloud Functions, don't export
  // For static deployment, use 'export'
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      };
    }
    
    // Exclude undici from webpack processing entirely
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        undici: 'undici',
      });
    }

    // Ignore undici parsing entirely
    config.module.rules.push({
      test: /\.m?js$/,
      include: [/node_modules\/undici/, /node_modules\/@firebase/],
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
      parser: {
        requireEnsure: false,
      },
    });

    return config;
  },
};

module.exports = nextConfig;