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

/**
 * The set of JS chunks the app needs in order to BOOT and render the landing page.
 * Everything else — ~700 route chunks — is served by the `chunk-cache` CacheFirst
 * route in src/sw.ts and becomes offline-capable after first use.
 *
 * Computed from rollup's own chunk graph, never from a hand-written list: the
 * filenames are content-hashed and change on every build.
 *
 * SEEDS. The entry chunk alone is NOT sufficient for this app. `AppRoot.tsx` loads
 * App via `lazy(() => import('./App.tsx'))`, and App loads the landing route via
 * `lazyWithRetry(() => import('./components/Landing/LandingView'))`. Both are
 * dynamic edges, so a pure static closure from the entry excludes App and
 * LandingView — which would leave a cold offline start showing the "Initializing
 * application modules…" splash forever. They are therefore seeded explicitly, by
 * locating the chunk that CONTAINS each source module rather than by guessing at
 * an output filename.
 *
 * WHY an allow-list and not a deny-list: a deny-list names the oversized chunks to
 * exclude, which silently rots — every new heavy route chunk is opted INTO the
 * precache by default and nobody notices until the install is huge again. That is
 * exactly how this codebase reached a 289 MB precache. An allow-list fails safe.
 */
const shellChunks = new Set<string>()

/**
 * The boot chunks as workbox manifest entries, injected via
 * `injectManifest.additionalManifestEntries`.
 *
 * This array is passed BY REFERENCE into the VitePWA options below and filled
 * during `generateBundle`; workbox reads it later, at `closeBundle`.
 *
 * `revision: null` is correct and required here: these filenames contain a content
 * hash, so the URL already identifies the exact bytes. Giving them a revision would
 * make workbox cache-bust a URL that can never change contents.
 *
 * WHY NOT just glob `js` and filter with manifestTransforms: workbox applies
 * `maximumFileSizeToCacheInBytes` to globbed files BEFORE any transform runs, so a
 * 15.7 MB route chunk that the transform was about to discard still trips the size
 * warning — and vite-plugin-pwa escalates that warning to a build error. Not
 * globbing JS at all avoids the spurious check entirely, and keeps the size limit
 * meaningful for the assets it still governs.
 */
const shellManifestEntries: { url: string; revision: string | null }[] = []

/** Matches only the entries THIS plugin adds — hashed JS chunks under /assets/. */
const SHELL_ENTRY_RE = /^\/assets\/.+\.js$/

/** Source modules that must boot offline even though they are reached dynamically. */
const SHELL_SEED_MODULES = [
  '/src/App.tsx',
  '/src/AppRoot.tsx',
  '/src/components/Landing/LandingView.tsx',
]

function precacheShellAllowlist(): Plugin {
  return {
    name: 'precache-shell-allowlist',
    apply: 'build',
    generateBundle(_options, bundle) {
      shellChunks.clear()
      const visit = (fileName: string) => {
        if (shellChunks.has(fileName)) return
        const chunk = bundle[fileName]
        if (!chunk || chunk.type !== 'chunk') return
        shellChunks.add(fileName)
        // Static imports only. `dynamicImports` is deliberately NOT followed —
        // those edges are what keep the ~700 route chunks out of the install.
        for (const imported of chunk.imports) visit(imported)
      }

      const seedsFound = new Set<string>()
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue
        if (chunk.isEntry) visit(fileName)
        for (const seed of SHELL_SEED_MODULES) {
          if (chunk.moduleIds.some((id) => id.endsWith(seed))) {
            seedsFound.add(seed)
            visit(fileName)
          }
        }
      }

      // A seed that no longer resolves means the file was renamed or moved. Failing
      // loudly beats shipping a precache that cannot boot offline.
      const missing = SHELL_SEED_MODULES.filter((s) => !seedsFound.has(s))
      if (missing.length) {
        this.error(
          `precache-shell-allowlist: seed module(s) not found in any chunk: ${missing.join(', ')}. ` +
            `Update SHELL_SEED_MODULES in vite.config.ts — otherwise the app cannot boot offline.`
        )
      }
      // Remove only OUR previous entries, never the whole array. vite-plugin-pwa
      // resolves `additionalManifestEntries` at config time and pushes the
      // `includeAssets` icons into this same array before the build starts — a
      // blanket `length = 0` here silently dropped all 7 launcher icons from the
      // precache, which the build reported as success.
      for (let i = shellManifestEntries.length - 1; i >= 0; i--) {
        if (SHELL_ENTRY_RE.test(shellManifestEntries[i].url)) shellManifestEntries.splice(i, 1)
      }
      for (const fileName of shellChunks) {
        shellManifestEntries.push({ url: `/${fileName}`, revision: null })
      }
      this.info(`precache shell: ${shellChunks.size} boot chunks`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    buildTimestampPlugin(),
    precacheShellAllowlist(),
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // `png` left globPatterns in Phase 4 (the 72 infographics, 51 MB, now go to
      // the runtime `image-cache`), so the launcher icons need an explicit source
      // again. This is that source — and it is the ONLY one: includeManifestIcons
      // stays false, otherwise the plugin injects the same 8 files a second time,
      // which is what produced the duplicate entries this branch removed earlier.
      includeAssets: [
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-1024x1024.png',
        'pwa-maskable-192.png',
        'pwa-maskable-512.png',
        'apple-touch-icon.png',
        'favicon-32x32.png',
      ],
      includeManifestIcons: false,
      injectManifest: {
        // WHAT IS PRECACHED AT INSTALL: only what the app needs to BOOT.
        //
        // `png` and `wasm` were removed in Phase 4. Together they were 144 MB of the
        // install payload — 13 WASM engines (86 MB) and 72 infographics (51 MB) —
        // none of which is needed to render a page. Both are served by CacheFirst
        // runtime routes in src/sw.ts instead, so they become offline-capable after
        // first use rather than before it.
        //
        // `js` is NOT globbed. Globbing cannot express "the entry chunk plus its
        // boot closure" — the filenames are content-hashed — so the boot chunks are
        // injected explicitly via `additionalManifestEntries` below, and the other
        // ~700 route chunks are served by the `chunk-cache` runtime route.
        //
        // `woff2` was missing entirely, so the site's only web font was never
        // precached and failed offline (measured against production:
        // `net::ERR_ABORTED font /fonts/inter-latin-wght-normal.woff2`).
        globPatterns: ['**/*.{css,html,svg,json,woff2}'],
        additionalManifestEntries: shellManifestEntries,
        globIgnores: [
          // data/ and dist/ JSON is UNREACHABLE from the precache. The fetch handler
          // in src/sw.ts routes /(data|dist)/*.{json,csv} to the StaleWhileRevalidate
          // `data-cache` BEFORE it ever consults the precache, so these files could
          // not be served from the precache under any code path. Measured on
          // production: after the worker activated, the origin fetched a further
          // 19 MB into data-cache — rag-corpus.json, re-downloaded despite already
          // sitting in the precache, i.e. stored twice and paid for twice.
          //
          // Worth 26 MB of unique files (49.5 MB of manifest entries, since
          // rag-corpus.json and compliance-data.json were each listed twice).
          //
          // Scoped to data/ and dist/ ON PURPOSE. The other 30 precached JSON files
          // — workshop fixtures, kmip-corpus, and the per-source manifest.json
          // files, 1.95 MB in total — live outside those directories, so the
          // data-cache route does NOT match them and they ARE served from the
          // precache. A blanket removal of `json` would silently break them offline.
          'data/**/*.json',
          'dist/**/*.json',
          // pyodide-lock.json (dev-tabs-pkcs11-kmip plan P1, G7) — the same
          // blanket `json` glob swept this in too, missed until G7 first ran
          // gate:precache against a build containing it. pyRuntime.ts's own
          // header comment already documents the intent this closes the gap
          // on: the Developer tabs are online-only by design, so Pyodide's
          // non-.wasm assets (this lockfile included) belong on the
          // network-fallback path, not precached at install.
          'pyodide/**/*.json',
          // migrate-proofs are archived vendor evidence documents — 161 files,
          // 55 MB — reachable only by following a proof link. They are the
          // entire reason this budget blew from the 2026-08-07 baseline of
          // 16.6 MB / 103 entries to 53.64 MB / 264: `**/*.html` swept up every
          // one of them as the archive grew, and the count lines up exactly
          // (264 - 161 = 103).
          //
          // Precaching them never even worked. The fetch handler answers
          // `request.mode === 'navigate'` with the SPA shell BEFORE it consults
          // the precache, and a proof link is a navigation — so these entries
          // were downloaded at install and then never served to anyone. They
          // now go to the network, with a narrow pass-through in src/sw.ts so
          // the shell stops shadowing them.
          'migrate-proofs/**/*.html',
        ],
        /**
         * Fail-safe. If the allow-list were ever empty — plugin removed, rollup
         * internals changed, a seed module renamed — the precache would contain no
         * JS at all and the app could not boot offline. That must break the build,
         * not ship silently.
         *
         * The assertion is on `shellManifestEntries`, NOT on the entries this
         * transform receives: workbox applies `additionalManifestEntriesTransform`
         * LAST, after every manifestTransform, so the boot chunks are not visible
         * here yet (workbox-build/build/lib/transform-manifest.js).
         */
        manifestTransforms: [
          async (entries) => {
            const icons = shellManifestEntries.filter((e) => !SHELL_ENTRY_RE.test(e.url))
            if (icons.length === 0) {
              throw new Error(
                'No launcher icons in the precache manifest. `includeAssets` populates ' +
                  'the same additionalManifestEntries array this plugin writes to — check ' +
                  'that the generateBundle hook is not clearing it wholesale.'
              )
            }
            if (shellManifestEntries.filter((e) => SHELL_ENTRY_RE.test(e.url)).length === 0) {
              throw new Error(
                'precache-shell-allowlist contributed no boot chunks — refusing to emit a ' +
                  'precache manifest with no JS. Check the generateBundle hook in vite.config.ts.'
              )
            }
            return { manifest: entries, warnings: [] }
          },
        ],
        // 12 MB. The largest precachable file is now the ~9.5 MB entry chunk; nothing
        // else in the boot set comes close.
        //
        // RAISING THIS IS NOT THE FIX. This ceiling was raised three times
        // (15 → 20 → 32 → 48 MB) between 2026-04 and 2026-06, each time to clear a
        // build failure, and each time it hid the real problem: the install payload
        // reached 289 MB across 927 files while a PER-FILE limit reported nothing
        // wrong. If this fires, split the chunk or move the asset to a runtime cache.
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
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
    // Budgets, raised from the 5s/10s defaults on 2026-08-11 after measuring
    // rather than guessing. Several suites build a genuinely expensive fixture:
    //   • 5 test files each load public/data/rag-corpus.json and build a
    //     MiniSearch index over it — read 41ms, JSON.parse 53ms, INDEX 1,926ms.
    //     The file I/O is nothing; the index build is the cost, and it is paid
    //     once per file that needs it.
    //   • LibraryViewRedesign renders the full 1,026-row library grid:
    //     1.4-2.2s per test measured in isolation.
    // Against the old 5s/10s that left barely a 2-3x margin, and `npm run test`
    // runs 561 files in parallel with no concurrency cap — so on a loaded
    // machine those suites intermittently timed out while passing every time
    // in isolation. The failing SET moved between runs, which is the tell.
    // These are timeouts, never assertions: nothing is being masked, the same
    // things are still asserted. If a suite ever needs more than this, that is
    // a real signal worth chasing rather than raising again.
    testTimeout: 30_000,
    hookTimeout: 30_000,
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
          'vendor-three': ['three'],
        },
      },
    },
  },
})
