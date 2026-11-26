// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { vi } from 'vitest'

/** The two knowledge files the Assistant may fetch, and nothing else. */
export const KNOWLEDGE_URLS = ['/data/knowledge-core.json', '/data/knowledge-text.json']

export interface FetchLog {
  urls: string[]
}

/**
 * Stands in for the browser's `fetch`: serves the knowledge files from `public/data/` of the checkout the tests run in
 * (or from the given bodies), records every URL asked for, and answers anything else with a failure, so a test fails
 * if the Assistant ever asks for something it should not. `fail` makes every request fail (the data-not-loading case).
 */
export function stubKnowledgeFetch(
  options: { bodies?: Record<string, unknown>; fail?: () => boolean } = {}
): FetchLog {
  const log: FetchLog = { urls: [] }
  vi.stubGlobal('fetch', (url: string) => {
    log.urls.push(url)
    if (options.fail?.() || !KNOWLEDGE_URLS.includes(url)) {
      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('no')),
      })
    }
    const body = options.bodies?.[url]
    const parsed: unknown =
      body !== undefined
        ? body
        : JSON.parse(readFileSync(join(process.cwd(), 'public', url), 'utf8'))
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(parsed) })
  })
  return log
}
