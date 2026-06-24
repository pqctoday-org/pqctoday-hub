// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sitemap generator — emits public/sitemap.xml from ROUTE_META, the same source
 * of truth the prerender step uses, so the sitemap can never drift from the set
 * of real, indexable routes.
 *
 *   npm run generate:sitemap         # rewrite public/sitemap.xml
 *   npm run generate:sitemap -- --check   # fail if route coverage is stale (CI)
 *
 * `--check` compares only the URL set (not <lastmod>), so it gates against
 * missing/extra routes without forcing date churn on every run.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ROUTE_META, isNoindexRoute } from '../src/seo/routeMeta'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://www.pqctoday.com'
const OUT = join(__dirname, '..', 'public', 'sitemap.xml')

// Bump on a significant content release. Static (not the build date) so we don't
// tell crawlers every page changed on every deploy.
const LASTMOD = '2026-06-24'

interface Entry {
  loc: string
  priority: string
  changefreq: string
}

function priorityFor(route: string): { priority: string; changefreq: string } {
  if (route === '/') return { priority: '1.0', changefreq: 'weekly' }
  if (route.startsWith('/learn/')) return { priority: '0.6', changefreq: 'monthly' }
  const weekly = new Set(['/timeline', '/compliance', '/threats', '/changelog', '/library'])
  if (weekly.has(route)) return { priority: '0.9', changefreq: 'weekly' }
  const flagship = new Set([
    '/algorithms',
    '/playground',
    '/learn',
    '/migrate',
    '/assess',
    '/simulation',
  ])
  if (flagship.has(route)) return { priority: '0.9', changefreq: 'monthly' }
  return { priority: '0.7', changefreq: 'monthly' }
}

const entries: Entry[] = Object.keys(ROUTE_META)
  .filter((r) => !isNoindexRoute(r))
  .sort()
  .map((route) => ({ loc: `${BASE_URL}${route === '/' ? '/' : route}`, ...priorityFor(route) }))

function render(): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

const xml = render()

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(OUT, 'utf-8')
  } catch {
    console.error('sitemap.xml missing — run: npm run generate:sitemap')
    process.exit(1)
  }
  const locsOf = (s: string) => new Set([...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!))
  const want = locsOf(xml)
  const have = locsOf(current)
  const missing = [...want].filter((l) => !have.has(l))
  const extra = [...have].filter((l) => !want.has(l))
  if (missing.length || extra.length) {
    if (missing.length) console.error('Missing from sitemap:\n  ' + missing.join('\n  '))
    if (extra.length) console.error('Stale URLs in sitemap:\n  ' + extra.join('\n  '))
    console.error('\nRun: npm run generate:sitemap')
    process.exit(1)
  }
  console.log(`✅ sitemap.xml covers all ${want.size} indexable routes.`)
} else {
  writeFileSync(OUT, xml, 'utf-8')
  console.log(`✅ Wrote ${entries.length} routes to public/sitemap.xml (lastmod ${LASTMOD}).`)
}
