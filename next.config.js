const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  //webpack5: true,
  webpack: (config) => {
    // Add fallbacks for certain Node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: require.resolve('path-browserify'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
    }

    // Configure .mjs files to be treated as JavaScript
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    })

    // Custom alias for '@' to map to the root directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'), // Add this line to resolve '@' to root
      '@solana/wallet-adapter-react': path.resolve(
        './node_modules/@solana/wallet-adapter-react'
      ),
    }

    return config
  },

  // Set up environment variables
  env: {
    NEXT_PUBLIC_RPC_HOST: 'https://metaplex.devnet.rpcpool.com/',
    // NEXT_PUBLIC_RPC_HOST: 'https://api.metaplex.solana.com/',
  },
}
