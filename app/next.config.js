const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  webpack5: true,
  webpack: (config) => {
    // Add fallbacks for certain Node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
    }

    // Configure .mjs files to be treated as JavaScript
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    })

    // Custom alias for the Solana wallet adapter package
    config.resolve.alias = {
      ...config.resolve.alias,
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
