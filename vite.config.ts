// SPDX-License-Identifier: GPL-3.0-only
/// <reference types="vitest" />
import { defineConfig, configDefaults } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { VitePWA } from 'vite-plugin-pwa'

import tailwindcss from '@tailwindcss/vite'

// Plugin to inject build-time constants
function buildTimestampPlugin(): Plugin {
  return {
    name: 'build-timestamp',
    config() {
      return {
        define: {
          __BUILD_TIMESTAMP__: JSON.stringify(
            new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Chicago',
              timeZoneName: 'short',
            })
          ),
          __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
          __WASM_HASH__: JSON.stringify(
            (() => {
              const p = path.resolve(__dirname, 'public/wasm/softhsm.wasm')
              if (!existsSync(p)) return Date.now().toString()
              return createHash('md5').update(readFileSync(p)).digest('hex').slice(0, 8)
            })()
          ),
        },
      }
    },
  }
}

import path from 'path'
import { createHash } from 'crypto'
import { readFileSync, existsSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    buildTimestampPlugin(),
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-1024x1024.png',
        'data/rag-corpus.json',
        'data/compliance-data.json',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,json}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MB — accommodate WASM files
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Cache WASM files with cache-first strategy
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Cache data files (JSON/CSV) with stale-while-revalidate
            urlPattern: /\/(data|dist)\/.+\.(json|csv)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'PQC Today',
        short_name: 'PQC Today',
        description:
          'Post-Quantum Cryptography education, migration planning, and interactive cryptographic operations',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'pwa-1024x1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    strictPort: false,
    proxy: {
      '/api/nist-search': {
        target: 'https://csrc.nist.gov',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/nist-search/,
            '/projects/cryptographic-module-validation-program/validated-modules/search/all'
          ),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/api/nist-cert': {
        target: 'https://csrc.nist.gov',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/nist-cert/,
            '/projects/cryptographic-module-validation-program/certificate'
          ),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/api/acvp-search': {
        target: 'https://csrc.nist.gov',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/acvp-search/,
            '/projects/cryptographic-algorithm-validation-program/validation-search'
          ),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/api/acvp-details': {
        target: 'https://csrc.nist.gov',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/acvp-details/,
            '/projects/cryptographic-algorithm-validation-program/details'
          ),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/api/bsi-search': {
        target: 'https://www.bsi.bund.de',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/bsi-search/,
            '/SharedDocs/Downloads/EN/BSI/Zertifizierung/Report_eIDAS_Table.html'
          ),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/api/anssi-search': {
        target: 'https://cyber.gouv.fr',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/anssi-search/, '/en/products-and-services-certified-anssi'),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/api/cc-data': {
        target: 'https://www.commoncriteriaportal.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cc-data/, '/products/certified_products.csv'),
      },
    },
    headers: {
      // credentialless allows cross-origin fetches (HuggingFace model downloads)
      // while still enabling SharedArrayBuffer for WASM
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://csrc.nist.gov https://cyber.gouv.fr https://www.bsi.bund.de https://www.commoncriteriaportal.org https://*.google-analytics.com https://*.analytics.google.com https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://*.huggingface.co https://huggingface.co https://*.hf.co https://raw.githubusercontent.com; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' https://accounts.google.com",
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://csrc.nist.gov https://cyber.gouv.fr https://www.bsi.bund.de https://www.commoncriteriaportal.org https://*.google-analytics.com https://*.analytics.google.com https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://*.huggingface.co https://huggingface.co https://*.hf.co https://raw.githubusercontent.com; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' https://accounts.google.com",
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/wasm/',
        'e2e/',
      ],
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 48,
        statements: 60,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@oqs/liboqs-js', '@pqctoday/softhsm-wasm'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx'],
          'vendor-pqc': ['@oqs/liboqs-js', '@noble/hashes'],
          'vendor-zip': ['jszip'],
          'vendor-csv': ['papaparse'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-chat': ['minisearch'],
        },
      },
    },
  },
})
