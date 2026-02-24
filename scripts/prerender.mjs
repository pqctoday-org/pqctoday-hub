/**
 * Prerender script — generates static HTML for all routes using Playwright.
 *
 * Runs after `vite build` to produce crawlable HTML pages.
 * Uses Playwright (already a devDependency) to visit each route in a real browser,
 * wait for content to render, and save the resulting HTML.
 *
 * WASM-heavy content loads client-side after hydration; the prerendered HTML
 * captures the page shell (navigation, headings, text content) for SEO.
 */

import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')

/** All routes to prerender */
const ROUTES = [
  '/',
  '/timeline',
  '/algorithms',
  '/playground',
  '/openssl',
  '/compliance',
  '/migrate',
  '/assess',
  '/threats',
  '/leaders',
  '/library',
  '/about',
  '/changelog',
  '/learn',
  '/learn/pqc-101',
  '/learn/quantum-threats',
  '/learn/hybrid-crypto',
  '/learn/crypto-agility',
  '/learn/tls-basics',
  '/learn/vpn-ssh-pqc',
  '/learn/email-signing',
  '/learn/pki-workshop',
  '/learn/key-management',
  '/learn/stateful-signatures',
  '/learn/merkle-tree-certs',
  '/learn/digital-assets',
  '/learn/5g-security',
  '/learn/digital-id',
  '/learn/entropy-randomness',
  '/learn/qkd',
  '/learn/quiz',
]

/**
 * Minimal static file server for the dist directory.
 * Serves files from dist/ and falls back to index.html for SPA routing.
 */
function createStaticServer(distDir) {
  const mimeTypes = new Map([
    ['.html', 'text/html'],
    ['.js', 'application/javascript'],
    ['.css', 'text/css'],
    ['.json', 'application/json'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.wasm', 'application/wasm'],
  ])

  return createServer((req, res) => {
    let filePath = join(distDir, req.url === '/' ? 'index.html' : req.url)

    // SPA fallback — serve index.html for paths without file extensions
    if (!filePath.includes('.')) {
      filePath = join(distDir, 'index.html')
    }

    try {
      const content = readFileSync(filePath)
      const ext = '.' + filePath.split('.').pop()
      res.writeHead(200, {
        'Content-Type': mimeTypes.get(ext) ?? 'application/octet-stream',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      })
      res.end(content)
    } catch {
      // Fallback to index.html for SPA routes
      try {
        const indexContent = readFileSync(join(distDir, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(indexContent)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    }
  })
}

async function prerender() {
  console.log(`\n🔍 Prerendering ${ROUTES.length} routes...\n`)

  // Start static server
  const server = createStaticServer(DIST_DIR)
  const port = 4173 + Math.floor(Math.random() * 1000)
  await new Promise((resolve) => server.listen(port, resolve))
  console.log(`  Static server on http://localhost:${port}`)

  // Launch browser
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    // Block WASM and heavy assets to speed up prerendering
    javaScriptEnabled: true,
  })

  let successCount = 0
  let errorCount = 0

  for (const route of ROUTES) {
    const url = `http://localhost:${port}${route}`
    const page = await context.newPage()

    try {
      // Navigate and wait for the main content area to appear
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })

      // Wait for meaningful content — the main layout renders quickly,
      // WASM-heavy interactive elements load asynchronously after this
      await page
        .waitForSelector('main, [role="main"], .glass-panel, h1', {
          timeout: 10000,
        })
        .catch(() => {
          // Some pages may not have these selectors — still capture the shell
        })

      // Brief additional wait for React to finish rendering text content
      await page.waitForTimeout(1500)

      // Extract the full HTML
      const html = await page.content()

      // Determine output path
      const outputDir =
        route === '/' ? DIST_DIR : join(DIST_DIR, ...route.split('/').filter(Boolean))

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
      }

      const outputPath = join(outputDir, 'index.html')
      writeFileSync(outputPath, html, 'utf-8')

      successCount++
      console.log(`  ✓ ${route}`)
    } catch (err) {
      errorCount++
      console.error(`  ✗ ${route}: ${err.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  server.close()

  console.log(`\n✅ Prerendered ${successCount}/${ROUTES.length} routes (${errorCount} errors)\n`)

  if (errorCount > 0) {
    process.exit(1)
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
