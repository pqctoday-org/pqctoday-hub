// SPDX-License-Identifier: GPL-3.0-only
/** Verify that production serves the same complete static route set this checkout declares. */
import { SEARCH_ROUTES, indexableRoutes } from '../../src/seo/searchRoutes'
import { validateSnapshot } from '../lib/prerenderChecks'

const arg = (name: string) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3)
const BASE = (arg('base') ?? 'https://www.pqctoday.com').replace(/\/$/, '')
const WAIT_MINUTES = Number(arg('wait') ?? 0)

async function fetchText(
  path: string
): Promise<{ status: number; location: string | null; text: string }> {
  const response = await fetch(`${BASE}${path}`, {
    redirect: 'manual',
    headers: { 'cache-control': 'no-cache' },
  })
  return {
    status: response.status,
    location: response.headers.get('location'),
    text: await response.text(),
  }
}

async function checkOnce(): Promise<string[]> {
  const problems: string[] = []
  const sitemapResponse = await fetchText('/sitemap.xml')
  if (sitemapResponse.status !== 200) return [`/sitemap.xml: HTTP ${sitemapResponse.status}`]

  const livePaths = new Set(
    [...sitemapResponse.text.matchAll(/<loc>https:\/\/www\.pqctoday\.com([^<]*)<\/loc>/g)].map(
      (match) => match[1] || '/'
    )
  )
  const expectedPaths = new Set(indexableRoutes().map((route) => route.path))
  for (const path of expectedPaths)
    if (!livePaths.has(path)) problems.push(`${path}: missing from sitemap`)
  for (const path of livePaths)
    if (!expectedPaths.has(path)) problems.push(`${path}: stale in sitemap`)

  for (let offset = 0; offset < SEARCH_ROUTES.length; offset += 12) {
    const batch = SEARCH_ROUTES.slice(offset, offset + 12)
    const responses = await Promise.all(
      batch.map(async (route) => ({ route, response: await fetchText(route.path) }))
    )
    for (const { route, response } of responses) {
      if (response.status !== 200) {
        problems.push(
          `${route.path}: HTTP ${response.status}${response.location ? ` → ${response.location}` : ''}`
        )
        continue
      }
      const result = validateSnapshot(response.text, route)
      for (const error of result.errors) problems.push(`${route.path}: ${error}`)
    }
  }

  return problems
}

const deadline = Date.now() + WAIT_MINUTES * 60_000
let problems: string[]
try {
  problems = await checkOnce()
  while (problems.length > 0 && Date.now() < deadline) {
    console.log(`… ${problems.length} SEO difference(s); waiting for edge propagation`)
    await new Promise((resolve) => setTimeout(resolve, 30_000))
    problems = await checkOnce()
  }
} catch (error) {
  problems = [error instanceof Error ? error.message : String(error)]
}

if (problems.length > 0) {
  console.error(`✗ live SEO verification failed (${problems.length})`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`✓ ${BASE} serves ${SEARCH_ROUTES.length} complete routes and the exact sitemap set`)
