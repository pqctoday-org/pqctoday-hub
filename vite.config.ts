/// <reference types="vitest" />
import { defineConfig, configDefaults } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

import tailwindcss from '@tailwindcss/vite'

// Plugin to update build timestamp on every build
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
        },
      }
    },
  }
}

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [buildTimestampPlugin(), react(), tailwindcss(), wasm(), topLevelAwait()],
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
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
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
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@openforge-sh/liboqs'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx'],
          'vendor-pqc': ['@openforge-sh/liboqs', 'pqcrypto', '@noble/hashes'],
        },
      },
    },
  },
})
