// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static scan of the journey's own source tree */
/**
 * Nothing the learner writes leaves the device (design note section 10, decisions J2 and J5): the
 * journey code sends no analytics event, makes no network call and uses no language model. A scan
 * of its files, so a later change that adds one fails here.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const DIRS = ['src/components/Journey', 'src/services/journey']
const FILES = ['src/store/useJourneyStore.ts', 'src/hooks/useJourney.ts']

function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((e) => {
    const rel = join(dir, e)
    if (statSync(join(ROOT, rel)).isDirectory()) return walk(rel)
    return /\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e) ? [rel] : []
  })
}

const sources = [...DIRS.flatMap(walk), ...FILES].map(
  (f) => [f, readFileSync(join(ROOT, f), 'utf8')] as const
)

describe('the journey code', () => {
  it('scans the journey files (guards against a broken scan)', () => {
    expect(sources.length).toBeGreaterThan(15)
  })

  it.each(sources)('%s sends no analytics event', (_f, src) => {
    expect(src).not.toMatch(/utils\/analytics|react-ga4|logEvent|gtag\(/)
  })

  it.each(sources)('%s makes no network call and names no model service', (_f, src) => {
    expect(src).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/)
    expect(src).not.toMatch(/services\/chat|WebLLM|Gemini|useChatStore/)
  })

  it.each(sources)('%s copies nothing to the clipboard', (_f, src) => {
    expect(src).not.toMatch(/clipboard/i)
  })
})
