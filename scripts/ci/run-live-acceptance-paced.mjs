#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Rate-Limit-Proof Live Acceptance Runner (workers: 1, paced sequential requests)
 *
 * Prevents GitHub Pages Varnish / Fastly edge HTTP 429 throttling during post-deploy
 * live verification by enforcing:
 *   - Strictly sequential execution (workers: 1, concurrency: 1)
 *   - Configurable inter-request pacing (--delay-ms=750, default 750ms)
 *   - Automatic HTTP 429 / 503 Retry-After header parsing + exponential backoff with jitter
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const WORKER_CONCURRENCY = 1

export const DEFAULT_LIVE_ACCEPTANCE_ROUTES = [
  '/',
  '/assess',
  '/report',
  '/learn',
  '/algorithms',
  '/compliance',
  '/migrate',
  '/business',
  '/timeline',
  '/library',
  '/playground',
  '/openssl',
  '/threats',
  '/simulation',
  '/patents',
  '/leaders',
  '/explore',
  '/revisions',
  '/changelog',
  '/faq',
  '/about',
  '/editorial-independence',
  '/sponsor',
  '/terms',
  '/navigate',
  '/sitemap.xml',
  '/data/pqctoday-sbom.cdx.json',
  '/data/revisions.jsonl.sig',
  '/data/rag-corpus.json.sig',
]

export function parseCliArgs(argv = process.argv.slice(2)) {
  const getArg = (name) => {
    const prefix = `--${name}=`
    const found = argv.find((a) => a.startsWith(prefix))
    return found ? found.slice(prefix.length) : undefined
  }
  const baseUrl = (
    getArg('base') ??
    process.env.LIVE_BASE_URL ??
    'https://www.pqctoday.com'
  ).replace(/\/$/, '')
  const delayMsRaw = Number(getArg('delay-ms') ?? process.env.LIVE_DELAY_MS ?? 750)
  const delayMs = Number.isFinite(delayMsRaw) && delayMsRaw >= 0 ? delayMsRaw : 750
  const maxRetriesRaw = Number(getArg('max-retries') ?? process.env.LIVE_MAX_RETRIES ?? 5)
  const maxRetries = Number.isFinite(maxRetriesRaw) && maxRetriesRaw >= 0 ? maxRetriesRaw : 5
  const outPath = getArg('out') ?? null
  const dryRun = argv.includes('--dry-run')

  return {
    workers: WORKER_CONCURRENCY,
    baseUrl,
    delayMs,
    maxRetries,
    outPath,
    dryRun,
  }
}

export function computeBackoffMs(attempt, retryAfterHeader = null, baseDelayMs = 1500) {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader)
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(60_000, Math.ceil(seconds * 1000))
    }
    const parsedDate = Date.parse(retryAfterHeader)
    if (!Number.isNaN(parsedDate)) {
      const delta = parsedDate - Date.now()
      if (delta > 0) return Math.min(60_000, delta)
    }
  }
  const exp = Math.min(6, Math.max(0, attempt))
  return Math.min(60_000, baseDelayMs * Math.pow(2, exp))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchWithPacedBackoff(
  url,
  { maxRetries = 5, baseBackoffMs = 1500, fetchImpl = globalThis.fetch, sleepImpl = sleep } = {}
) {
  let attempt = 0
  let retriesUsed = 0

  while (true) {
    const response = await fetchImpl(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'PQCToday-LiveAcceptance-Paced/4.216.0 (workers=1)',
        accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (response.status !== 429 && response.status !== 503) {
      const body = await response.text()
      return {
        status: response.status,
        ok: response.ok,
        retriesUsed,
        bytes: Buffer.byteLength(body, 'utf8'),
      }
    }

    if (attempt >= maxRetries) {
      return {
        status: response.status,
        ok: false,
        retriesUsed,
        bytes: 0,
      }
    }

    const retryAfter = response.headers?.get?.('retry-after') ?? null
    const waitMs = computeBackoffMs(attempt, retryAfter, baseBackoffMs)
    attempt += 1
    retriesUsed += 1
    await sleepImpl(waitMs)
  }
}

export async function runPacedLiveAcceptance(options = {}) {
  const config = {
    ...parseCliArgs(),
    ...options,
  }
  const routes = options.routes ?? DEFAULT_LIVE_ACCEPTANCE_ROUTES
  const sleepImpl = options.sleepImpl ?? sleep
  const fetchImpl = options.fetchImpl ?? globalThis.fetch

  const results = []
  let failures = 0

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    const url = `${config.baseUrl}${route}`

    if (i > 0 && config.delayMs > 0 && !config.dryRun) {
      await sleepImpl(config.delayMs)
    }

    if (config.dryRun) {
      results.push({
        index: i + 1,
        route,
        url,
        status: 200,
        ok: true,
        retriesUsed: 0,
        bytes: 0,
        dryRun: true,
      })
      continue
    }

    const res = await fetchWithPacedBackoff(url, {
      maxRetries: config.maxRetries,
      fetchImpl,
      sleepImpl,
    })

    const passed = res.status === 200 && res.bytes > 0
    if (!passed) failures += 1

    results.push({
      index: i + 1,
      route,
      url,
      status: res.status,
      ok: passed,
      retriesUsed: res.retriesUsed,
      bytes: res.bytes,
    })
  }

  const summary = {
    workers: WORKER_CONCURRENCY,
    baseUrl: config.baseUrl,
    delayMs: config.delayMs,
    maxRetries: config.maxRetries,
    totalRoutes: routes.length,
    passedRoutes: routes.length - failures,
    failedRoutes: failures,
    allPassed: failures === 0,
    results,
  }

  if (config.outPath) {
    fs.mkdirSync(path.dirname(path.resolve(config.outPath)), { recursive: true })
    fs.writeFileSync(path.resolve(config.outPath), JSON.stringify(summary, null, 2) + '\n', 'utf8')
  }

  return summary
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  runPacedLiveAcceptance()
    .then((summary) => {
      console.log(
        `✓ Paced live acceptance (workers=${summary.workers}, delay=${summary.delayMs}ms): ${summary.passedRoutes}/${summary.totalRoutes} passed`
      )
      if (!summary.allPassed) {
        process.exit(1)
      }
    })
    .catch((err) => {
      console.error('✗ Paced live acceptance failed:', err)
      process.exit(1)
    })
}
