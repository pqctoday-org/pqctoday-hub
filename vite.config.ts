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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // PWA icons only. `data/rag-corpus.json` and `data/compliance-data.json`
      // were removed here (WS3, 2026-08-02): sw.ts already serves both through
      // its StaleWhileRevalidate `data-cache` route, so search and the
      // assistant keep working from first use without paying 21 MB at install.
      includeAssets: [
        'favicon.svg',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-1024x1024.png',
        'pwa-maskable-192.png',
        'pwa-maskable-512.png',
      ],
      injectManifest: {
        // WS3 (2026-08-02) — install-time precache was 377 MB across 1,357
        // files, because the glob matched every WASM engine, every prerendered
        // route's JSON and every image. A cold first visit downloaded all of
        // it. Dropping wasm/json/png takes it to ~197 MB; `globIgnores` below
        // takes out the oversized JS chunks, which are the rest of the bulk.
        //
        // Runtime coverage for everything removed here already exists in
        // src/sw.ts: `.wasm` has a CacheFirst `wasm-cache` route plus network
        // fallback, and `/(data|dist)/*.{json,csv}` has `data-cache`. Nothing
        // becomes unreachable — it becomes offline-capable after first use
        // instead of before it.
        globPatterns: ['**/*.{js,css,html,svg}'],
        // The four largest JS chunks are 6–43 MB each and are route-specific:
        // precaching them at install buys nothing for a first visit that lands
        // on one route. They stay network-served and are picked up by the
        // browser's own HTTP cache.
        globIgnores: [
          '**/assets/useModalPosition-*.js',
          '**/assets/patentsData-*.js',
          '**/assets/index-*.js',
          '**/assets/App-*.js',
        ],
        // 48 MB stays. The ceiling is JS-bound, NOT WASM-bound: the largest
        // single precachable asset is the ~43 MB app chunk (was ~33.6 MB on
        // 2026-06-01, CI failed at 32 MB). Lowering this after taking WASM out
        // of the glob would fail the build on that chunk. Reducing it is a
        // code-splitting task — see the globIgnores note above.
        maximumFileSizeToCacheInBytes: 48 * 1024 * 1024,
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
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-1024x1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          {
            src: 'pwa-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // SDK map for shared learning modules
      '@sdk': path.resolve(__dirname, '../pqctoday-sdk/embed-test-site/src'),
    },
  },
  server: {
    port: 5175,
    host: true,
    strictPort: false,
    // Pre-transform the heavy HSM playground entry on server start so the first
    // navigation to /playground/hsm is warm instead of compiling ~hundreds of
    // lazy-route modules on demand (which made the cold load take 30–60s).
    warmup: {
      clientFiles: ['./src/components/Playground/HsmPlayground.tsx'],
    },
    fs: {
      // Allow importing test fixtures from pqc-tools sibling repo (dev only)
      allow: ['..'],
    },
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
      '/ttyd': {
        target: 'http://localhost:7681',
        changeOrigin: true,
        ws: true,
      },
    },
    headers: {
      // require-corp is required for Webkit/Safari. credentialless is ignored and breaks SAB.
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Content-Security-Policy':
        "default-src 'self'; frame-ancestors *; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://accounts.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:4000 ws://localhost:5175 http://localhost:8080 https://csrc.nist.gov https://cyber.gouv.fr https://www.bsi.bund.de https://www.commoncriteriaportal.org https://*.google-analytics.com https://*.analytics.google.com https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://*.huggingface.co https://huggingface.co https://*.hf.co https://cdn.jsdelivr.net https://raw.githubusercontent.com; img-src 'self' data: blob: https://flagcdn.com; font-src 'self'; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' https://accounts.google.com http://localhost:4000",
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Content-Security-Policy':
        "default-src 'self'; frame-ancestors *; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://accounts.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:4000 ws://localhost:5175 http://localhost:8080 https://csrc.nist.gov https://cyber.gouv.fr https://www.bsi.bund.de https://www.commoncriteriaportal.org https://*.google-analytics.com https://*.analytics.google.com https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://*.huggingface.co https://huggingface.co https://*.hf.co https://cdn.jsdelivr.net https://raw.githubusercontent.com; img-src 'self' data: blob: https://flagcdn.com; font-src 'self'; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' https://accounts.google.com http://localhost:4000",
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // `*.local.test.*` are local-gate-only suites (directive 2026-07-01: new
    // test suites run locally, not in CI) — excluded here, run via `test:local`.
    exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**', '**/*.local.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.md',
        'src/wasm/',
        'e2e/',
      ],
      thresholds: {
        lines: 59,
        functions: 50,
        branches: 47,
        statements: 59,
      },
    },
  },
  optimizeDeps: {
    // Scope dependency scanning to the real SPA entry. Without this, Vite's
    // scanner auto-globs every *.html — including the hundreds of static report
    // files under public/ (library, timeline, vendor-roadmaps) — and aborts
    // pre-bundling when it can't resolve their inlined <script> tags. That
    // forces on-demand optimization mid-session, whose reload kills in-flight
    // dynamic imports ("Failed to fetch dynamically imported module: App.tsx").
    entries: ['index.html'],
    // The @capacitor/* packages are native-only and intentionally not installed
    // for the web build (they're dynamically imported with /* @vite-ignore */
    // and listed in build.rollupOptions.external). They must also be excluded
    // here: the dep scanner ignores @vite-ignore, so without this it fails with
    // "imported but could not be resolved", aborts pre-bundling, and falls back
    // to on-demand optimization whose mid-session reloads kill in-flight dynamic
    // imports. @rhds/elements + @theme/section-hydration are referenced only by
    // static vendor-roadmap HTML and are excluded for the same reason.
    exclude: [
      '@oqs/liboqs-js',
      '@pqctoday/softhsm-wasm',
      '@peculiar/x509',
      '@capacitor/browser',
      '@capacitor/preferences',
      '@capacitor/share',
      '@capacitor/app',
      '@capacitor/haptics',
      '@rhds/elements',
      '@theme/section-hydration',
    ],
    // Pre-bundle the playground's heavy deps at server start so they aren't
    // discovered + optimized on first navigation (which forced a full page
    // reload mid-load). lucide-react alone is imported 82× across the playground
    // and, unbundled, serves each icon as its own module request.
    include: ['lucide-react', 'framer-motion', 'recharts', 'jszip', 'file-saver', 'clsx'],
  },
  build: {
    // Explicit target: esbuild >= 0.27.5 treats safari14 as lacking (buggy) destructuring
    // support and errors out, and vite-plugin-top-level-await falls back to an old Vite
    // default target list that includes safari14 when build.target is unset.
    // Same list, with the Safari floor raised to 14.1 (first version with correct destructuring).
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14.1'],
    rollupOptions: {
      external: [
        '@capacitor/haptics',
        '@capacitor/browser',
        '@capacitor/share',
        '@capacitor/app',
        '@capacitor/preferences',
      ],
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
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
