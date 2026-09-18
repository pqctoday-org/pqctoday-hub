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
 * missing/extra routes without forcing date churn on every run. <lastmod> is
 * per route from git history — see the resolver below for the shallow-clone rule.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { ROUTE_META, isNoindexRoute } from '../src/seo/routeMeta'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = join(__dirname, '..')
const BASE_URL = 'https://www.pqctoday.com'
const OUT = join(REPO, 'public', 'sitemap.xml')

interface Entry {
  loc: string
  lastmod: string
  priority: string
  changefreq: string
}

// ── <lastmod> ──────────────────────────────────────────────────────────────
// Per route, the date of the last commit that touched the files rendering it.
// Before 2026-09-17 this was one constant for every URL, and Google discounts a
// lastmod that never moves, so content updates were re-crawled slowly.
//
// Git history is only available locally: the deploy job is a depth-1 checkout
// (the object store is ~4 GB, so it stays that way). In a shallow clone every
// path resolves to HEAD's date — "everything changed today", the exact signal
// this exists to avoid — so a shallow checkout reuses the committed sitemap's
// dates instead; `npm run build` locally regenerates them with real history.

const MODULES_DIR = 'src/components/PKILearning/modules'

/** Paths whose git history dates each non-module route. Verified to match ≥1 tracked file. */
const ROUTE_SOURCES: Record<string, string[]> = {
  '/': ['src/components/Landing', 'src/components/RoleHome', 'src/data/role_board_content_*'],
  '/timeline': ['src/components/Timeline', 'src/data/timeline_*'],
  '/algorithms': ['src/components/Algorithms', 'src/data/pqc_complete_algorithm_reference_*'],
  '/playground': ['src/components/Playground', 'src/data/playground_content_*'],
  '/openssl': ['src/components/OpenSSLStudio', 'src/data/openssl_docs_map.csv'],
  '/compliance': ['src/components/Compliance', 'src/data/compliance_*'],
  '/migrate': ['src/components/Migrate', 'src/data/pqc_product_catalog_*'],
  '/business': ['src/components/BusinessCenter', 'src/data/business_tools_content_*'],
  '/business/tools': ['src/components/BusinessCenter', 'src/data/business_tools_content_*'],
  '/assess': ['src/components/Assess', 'src/data/pqcassessment_*'],
  '/report': ['src/components/Report'],
  '/threats': ['src/components/Threats', 'src/data/quantum_threats_hsm_industries_*'],
  '/leaders': ['src/components/Leaders', 'src/data/leaders_*'],
  '/library': ['src/components/Library', 'src/data/library_*'],
  '/faq': ['src/components/FAQ'],
  '/about': ['src/components/About'],
  '/terms': ['src/components/Terms'],
  '/simulation': ['src/components/Simulation', 'src/simulation'],
  '/sponsor': ['src/components/Sponsor'],
  '/editorial-independence': ['src/components/Editorial'],
  '/changelog': ['src/components/Changelog', 'CHANGELOG.md'],
  '/revisions': ['src/components/Revisions', 'public/data/revisions.jsonl'],
  '/learn': ['src/components/PKILearning'],
  '/explore': ['src/components/Explore'],
  '/patents': ['src/components/Patents', 'src/data/patents_*'],
  '/navigate': ['src/components/Navigate', 'src/data/forceClusterGraph.ts'],
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf-8' }).trim()
}

/** Learn module id → its module directory, read from each manifest.ts. */
function moduleDirs(): Map<string, string> {
  const out = new Map<string, string>()
  for (const dir of readdirSync(join(REPO, MODULES_DIR))) {
    let manifest: string
    try {
      manifest = readFileSync(join(REPO, MODULES_DIR, dir, 'manifest.ts'), 'utf-8')
    } catch {
      continue
    }
    const id = /^\s*id:\s*'([^']+)'/m.exec(manifest)?.[1]
    if (id) out.set(id, `${MODULES_DIR}/${dir}`)
  }
  return out
}

function sourcesFor(route: string, modules: Map<string, string>): string[] {
  if (route.startsWith('/learn/')) {
    const dir = modules.get(route.slice('/learn/'.length))
    if (!dir) throw new Error(`sitemap: no module directory found for ${route}`)
    return [dir]
  }
  const paths = ROUTE_SOURCES[route]
  if (!paths) throw new Error(`sitemap: no ROUTE_SOURCES entry for ${route} — add one`)
  return paths
}

function committedLastmods(): Map<string, string> {
  const out = new Map<string, string>()
  let current = ''
  try {
    current = readFileSync(OUT, 'utf-8')
  } catch {
    return out
  }
  for (const m of current.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
    out.set(m[1]!, m[2]!)
  }
  return out
}

function buildLastmodResolver(): (route: string, loc: string) => string {
  const today = new Date().toISOString().slice(0, 10)
  const committed = committedLastmods()
  const shallow = git('rev-parse', '--is-shallow-repository') === 'true'
  if (shallow) return (_route, loc) => committed.get(loc) ?? today

  const modules = moduleDirs()
  return (route, loc) => {
    const paths = sourcesFor(route, modules)
    for (const p of paths) {
      if (git('ls-files', '--', p) === '') {
        throw new Error(`sitemap: ${route} names ${p}, which matches no tracked file`)
      }
    }
    return git('log', '-1', '--format=%cs', '--', ...paths) || committed.get(loc) || today
  }
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

const lastmodFor = buildLastmodResolver()

const entries: Entry[] = Object.keys(ROUTE_META)
  .filter((r) => !isNoindexRoute(r))
  .sort()
  .map((route) => {
    const loc = `${BASE_URL}${route === '/' ? '/' : route}`
    return { loc, lastmod: lastmodFor(route, loc), ...priorityFor(route) }
  })

function render(): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n` +
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
  const newest = entries
    .map((e) => e.lastmod)
    .sort()
    .at(-1)
  console.log(`✅ Wrote ${entries.length} routes to public/sitemap.xml (newest lastmod ${newest}).`)
}
