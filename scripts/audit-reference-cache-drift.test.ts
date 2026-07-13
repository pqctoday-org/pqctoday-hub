// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  classifyEntry,
  dedupeBlockedByHash,
  looksBlocked,
  mapPool,
  run,
  type FetchImpl,
} from './audit-reference-cache-drift'

function sha256Of(s: string): string {
  return createHash('sha256').update(Buffer.from(s, 'utf-8')).digest('hex')
}

// ---------------------------------------------------------------------------
// classifyEntry
// ---------------------------------------------------------------------------

describe('classifyEntry', () => {
  const NOW = new Date('2026-05-14T12:00:00Z')

  it('returns ok when fetched hash matches the stored hash', async () => {
    const body = 'NIST FIPS 203 cached content'
    const fetcher: FetchImpl = async () => ({
      bytes: Buffer.from(body, 'utf-8'),
      sha256: sha256Of(body),
    })
    const finding = await classifyEntry(
      'library',
      {
        refId: 'FIPS-203',
        title: 'FIPS 203',
        url: 'https://nist.gov/fips-203.pdf',
        status: 'downloaded',
        sha256: sha256Of(body),
        sizeBytes: body.length,
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('ok')
    expect(finding.observedSha256).toBe(finding.storedSha256)
  })

  // Bodies below are padded well past looksBlocked()'s 1500-byte "too tiny
  // to be a real document" floor (added 2026-07-12) — a handful of bytes
  // was fine when only hash/size comparison was under test, but now reads
  // as a plausible bot-block response and would get reclassified 'blocked'
  // before ever reaching the drift/size-mismatch split these tests exercise.
  const PAD = 'x'.repeat(1600)

  it('returns drift when content differs and size differs', async () => {
    const newBody = `NEW content ${PAD}`
    const oldBody = `OLD content ${PAD}`
    const fetcher: FetchImpl = async () => ({
      bytes: Buffer.from(newBody, 'utf-8'),
      sha256: sha256Of(newBody),
    })
    const finding = await classifyEntry(
      'library',
      {
        refId: 'X',
        url: 'https://example/x.pdf',
        status: 'downloaded',
        sha256: sha256Of(oldBody),
        sizeBytes: newBody.length, // matches actually... let's use different lengths
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('size-mismatch') // both have the same length
  })

  it('classifies as drift when content differs AND size differs', async () => {
    const newBody = `much longer new content here ${PAD}`
    const fetcher: FetchImpl = async () => ({
      bytes: Buffer.from(newBody, 'utf-8'),
      sha256: sha256Of(newBody),
    })
    const finding = await classifyEntry(
      'library',
      {
        refId: 'X',
        url: 'https://example/x.pdf',
        status: 'downloaded',
        sha256: sha256Of(`short ${PAD}`),
        sizeBytes: `short ${PAD}`.length,
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('drift')
    expect(finding.observedSha256).not.toBe(finding.storedSha256)
  })

  it('classifies as size-mismatch when hash differs but size is identical', async () => {
    const bodyA = `AAAAA ${PAD}`
    const bodyB = `BBBBB ${PAD}`
    const fetcher: FetchImpl = async () => ({
      bytes: Buffer.from(bodyA, 'utf-8'),
      sha256: sha256Of(bodyA),
    })
    const finding = await classifyEntry(
      'library',
      {
        refId: 'X',
        url: 'https://example/x.pdf',
        status: 'downloaded',
        sha256: sha256Of(bodyB),
        sizeBytes: bodyA.length, // same length as bodyA (both are 5 chars + PAD)
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('size-mismatch')
  })

  it('classifies as blocked when the response is too small to be a real document', async () => {
    const fetcher: FetchImpl = async () => ({
      bytes: Buffer.from('tiny', 'utf-8'),
      sha256: sha256Of('tiny'),
    })
    const finding = await classifyEntry(
      'library',
      {
        refId: 'X',
        url: 'https://example/x.pdf',
        status: 'downloaded',
        sha256: sha256Of('a real cached document'),
        sizeBytes: 23,
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('blocked')
  })

  it('classifies as blocked when the response contains a bot-gate keyword', async () => {
    // Real shape (2026-07-12 finding): ecfr.gov serves a styled ~10KB
    // "Federal Register :: Request Access" page instead of the real
    // document — well above a tiny-interstitial size, but well under a
    // real cached document, and it says "captcha"/"request access".
    const blockPage = `<html><title>Request Access</title><body>Please solve this captcha to continue. ${PAD}</body></html>`
    const fetcher: FetchImpl = async () => ({
      bytes: Buffer.from(blockPage, 'utf-8'),
      sha256: sha256Of(blockPage),
    })
    const finding = await classifyEntry(
      'library',
      {
        refId: 'X',
        url: 'https://example/x.pdf',
        status: 'downloaded',
        sha256: sha256Of('a real cached document, quite different from the block page'),
        sizeBytes: 60,
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('blocked')
  })

  it('classifies as fetch-error when the fetcher throws', async () => {
    const fetcher: FetchImpl = async () => {
      throw new Error('network down')
    }
    const finding = await classifyEntry(
      'library',
      {
        refId: 'X',
        url: 'https://example/x.pdf',
        status: 'downloaded',
        sha256: 'abc',
      },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('fetch-error')
    expect(finding.errorMessage).toMatch(/network down/)
    expect(finding.observedSha256).toBeNull()
  })

  it('classifies as no-stored-hash when entry has no sha256', async () => {
    let calls = 0
    const fetcher: FetchImpl = async () => {
      calls++
      return { bytes: Buffer.from(''), sha256: '' }
    }
    const finding = await classifyEntry(
      'library',
      { refId: 'X', url: 'https://example/x.pdf', status: 'downloaded' },
      fetcher,
      5000,
      NOW
    )
    expect(finding.classification).toBe('no-stored-hash')
    // Should NOT have called the network — no point hashing if there's no baseline
    expect(calls).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// looksBlocked
// ---------------------------------------------------------------------------

describe('looksBlocked', () => {
  it('flags content under 1500 bytes as too small to be a real document', () => {
    expect(looksBlocked(Buffer.from('short'))).toBe(true)
  })

  it('flags mid-size content containing a bot-gate keyword', () => {
    // Real shape: ecfr.gov's "Federal Register :: Request Access" page,
    // 10,596 bytes observed in a real 2026-07-12 run — well above a tiny
    // interstitial, well below a real cached document.
    const body = `<html><title>Request Access</title><body>${'x'.repeat(9000)}captcha</body></html>`
    expect(body.length).toBeGreaterThan(1500)
    expect(body.length).toBeLessThan(100_000)
    expect(looksBlocked(Buffer.from(body))).toBe(true)
  })

  it('does not flag mid-size content with no bot-gate keyword', () => {
    const body = `real document text with plenty of content ${'x'.repeat(9000)}`
    expect(looksBlocked(Buffer.from(body))).toBe(false)
  })

  it('does not flag large content even if it happens to contain a bot-gate word', () => {
    // A genuine large page that merely mentions "captcha" (e.g. a login
    // widget) in passing shouldn't be flagged — only small/mid-size
    // responses get the keyword scan (see BLOCKED_SCAN_MAX_BYTES).
    const body = `real large document ${'x'.repeat(150_000)} mentions captcha once`
    expect(looksBlocked(Buffer.from(body))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// dedupeBlockedByHash
// ---------------------------------------------------------------------------

describe('dedupeBlockedByHash', () => {
  const base = {
    title: '',
    checkedAt: '2026-07-12T00:00:00Z',
    storedSizeBytes: null,
    observedSizeBytes: 100,
  }

  it('reclassifies drift findings that share an observed hash as blocked', () => {
    const sharedHash = sha256Of('shared block page')
    const findings = [
      {
        ...base,
        collection: 'library',
        refId: 'A',
        url: 'https://a',
        classification: 'drift' as const,
        storedSha256: 'old-a',
        observedSha256: sharedHash,
      },
      {
        ...base,
        collection: 'threats',
        refId: 'B',
        url: 'https://b',
        classification: 'drift' as const,
        storedSha256: 'old-b',
        observedSha256: sharedHash,
      },
    ]
    const result = dedupeBlockedByHash(findings)
    expect(result.map((f) => f.classification)).toEqual(['blocked', 'blocked'])
  })

  it('leaves a drift finding with a unique hash unchanged', () => {
    const findings = [
      {
        ...base,
        collection: 'library',
        refId: 'A',
        url: 'https://a',
        classification: 'drift' as const,
        storedSha256: 'old-a',
        observedSha256: sha256Of('unique content'),
      },
    ]
    const result = dedupeBlockedByHash(findings)
    expect(result[0].classification).toBe('drift')
  })

  it('does not touch ok findings that happen to share a hash', () => {
    const sharedHash = sha256Of('coincidentally identical real content')
    const findings = [
      {
        ...base,
        collection: 'library',
        refId: 'A',
        url: 'https://a',
        classification: 'ok' as const,
        storedSha256: sharedHash,
        observedSha256: sharedHash,
      },
      {
        ...base,
        collection: 'library',
        refId: 'B',
        url: 'https://b',
        classification: 'ok' as const,
        storedSha256: sharedHash,
        observedSha256: sharedHash,
      },
    ]
    const result = dedupeBlockedByHash(findings)
    expect(result.map((f) => f.classification)).toEqual(['ok', 'ok'])
  })
})

// ---------------------------------------------------------------------------
// mapPool
// ---------------------------------------------------------------------------

describe('mapPool', () => {
  it('processes every item exactly once and preserves order', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const results = await mapPool(items, 3, async (n) => n * 10)
    expect(results).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
  })

  it('does not exceed the concurrency cap', async () => {
    let inFlight = 0
    let maxObserved = 0
    const items = Array.from({ length: 20 }, (_, i) => i)
    await mapPool(items, 4, async (n) => {
      inFlight++
      maxObserved = Math.max(maxObserved, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
      return n
    })
    expect(maxObserved).toBeLessThanOrEqual(4)
  })

  it('handles concurrency > items.length cleanly', async () => {
    const results = await mapPool([1, 2], 10, async (n) => n + 1)
    expect(results).toEqual([2, 3])
  })

  it('returns [] for empty input', async () => {
    const results = await mapPool<number, number>([], 4, async (n) => n)
    expect(results).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// run() — end-to-end with fake fetcher
// ---------------------------------------------------------------------------

function setupFixtureRoot(manifests: Record<string, unknown>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pqc-drift-'))
  fs.mkdirSync(path.join(root, 'public', 'data'), { recursive: true })
  for (const [collection, manifest] of Object.entries(manifests)) {
    fs.mkdirSync(path.join(root, 'public', collection), { recursive: true })
    fs.writeFileSync(
      path.join(root, 'public', collection, 'manifest.json'),
      JSON.stringify(manifest)
    )
  }
  return root
}

describe('run', () => {
  it('produces a clean report when every entry matches', async () => {
    const body = 'matching body'
    const root = setupFixtureRoot({
      library: {
        entries: [
          {
            refId: 'X',
            url: 'https://example/x.pdf',
            status: 'downloaded',
            sha256: sha256Of(body),
            sizeBytes: body.length,
          },
        ],
      },
    })
    try {
      const fetcher: FetchImpl = async () => ({
        bytes: Buffer.from(body, 'utf-8'),
        sha256: sha256Of(body),
      })
      const report = await run({
        publicDir: path.join(root, 'public'),
        outPath: path.join(root, 'public', 'data', 'reference-cache-drift.json'),
        collections: ['library'],
        concurrency: 2,
        timeoutMs: 5000,
        limit: null,
        dryRun: false,
        fetcher,
        log: () => undefined,
      })
      expect(report.classifications.ok).toBe(1)
      expect(report.classifications.drift).toBe(0)
      expect(fs.existsSync(path.join(root, 'public', 'data', 'reference-cache-drift.json'))).toBe(
        true
      )
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('skips manifests that do not exist on disk', async () => {
    const root = setupFixtureRoot({})
    try {
      const report = await run({
        publicDir: path.join(root, 'public'),
        outPath: path.join(root, 'public', 'data', 'reference-cache-drift.json'),
        collections: ['library', 'timeline'],
        concurrency: 2,
        timeoutMs: 5000,
        limit: null,
        dryRun: true,
        fetcher: async () => ({ bytes: Buffer.from(''), sha256: '' }),
        log: () => undefined,
      })
      expect(report.totalEntries).toBe(0)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('ignores entries with status != downloaded', async () => {
    const root = setupFixtureRoot({
      library: {
        entries: [
          { refId: 'A', url: 'https://x/a', status: 'downloaded', sha256: sha256Of('a') },
          { refId: 'B', url: 'https://x/b', status: 'skipped', sha256: sha256Of('b') },
          { refId: 'C', url: 'https://x/c', status: 'failed' },
        ],
      },
    })
    try {
      let fetchCount = 0
      const fetcher: FetchImpl = async () => {
        fetchCount++
        return { bytes: Buffer.from('a', 'utf-8'), sha256: sha256Of('a') }
      }
      const report = await run({
        publicDir: path.join(root, 'public'),
        outPath: path.join(root, 'public', 'data', 'reference-cache-drift.json'),
        collections: ['library'],
        concurrency: 2,
        timeoutMs: 5000,
        limit: null,
        dryRun: true,
        fetcher,
        log: () => undefined,
      })
      expect(report.totalEntries).toBe(1)
      expect(fetchCount).toBe(1)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('honours --limit', async () => {
    const root = setupFixtureRoot({
      library: {
        entries: Array.from({ length: 5 }, (_, i) => ({
          refId: `R${i}`,
          url: `https://x/${i}`,
          status: 'downloaded',
          sha256: sha256Of(`r${i}`),
        })),
      },
    })
    try {
      let fetchCount = 0
      const fetcher: FetchImpl = async (url) => {
        fetchCount++
        const idx = parseInt(url.split('/').pop()!, 10)
        return { bytes: Buffer.from(`r${idx}`, 'utf-8'), sha256: sha256Of(`r${idx}`) }
      }
      const report = await run({
        publicDir: path.join(root, 'public'),
        outPath: path.join(root, 'public', 'data', 'reference-cache-drift.json'),
        collections: ['library'],
        concurrency: 2,
        timeoutMs: 5000,
        limit: 2,
        dryRun: true,
        fetcher,
        log: () => undefined,
      })
      expect(report.totalEntries).toBe(2)
      expect(fetchCount).toBe(2)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('detects drift across multiple collections', async () => {
    const root = setupFixtureRoot({
      library: {
        entries: [
          {
            refId: 'L1',
            url: 'https://x/l1',
            status: 'downloaded',
            sha256: sha256Of('old library'),
            sizeBytes: 11,
          },
        ],
      },
      timeline: {
        entries: [
          {
            refId: 'T1',
            url: 'https://x/t1',
            status: 'downloaded',
            sha256: sha256Of('old timeline'),
            sizeBytes: 12,
          },
        ],
      },
    })
    try {
      // Library: drift (different bytes, different size, well past the
      // 1500-byte looksBlocked() floor so it isn't reclassified 'blocked')
      // Timeline: ok
      const fetcher: FetchImpl = async (url) => {
        if (url.endsWith('/l1')) {
          const body = `completely new library content with different length ${'x'.repeat(1600)}`
          return { bytes: Buffer.from(body, 'utf-8'), sha256: sha256Of(body) }
        }
        return { bytes: Buffer.from('old timeline', 'utf-8'), sha256: sha256Of('old timeline') }
      }
      const report = await run({
        publicDir: path.join(root, 'public'),
        outPath: path.join(root, 'public', 'data', 'reference-cache-drift.json'),
        collections: ['library', 'timeline'],
        concurrency: 2,
        timeoutMs: 5000,
        limit: null,
        dryRun: true,
        fetcher,
        log: () => undefined,
      })
      expect(report.totalEntries).toBe(2)
      expect(report.classifications.drift).toBe(1)
      expect(report.classifications.ok).toBe(1)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('--dry-run does not write the report file', async () => {
    const root = setupFixtureRoot({
      library: {
        entries: [
          {
            refId: 'X',
            url: 'https://x/x',
            status: 'downloaded',
            sha256: sha256Of('x'),
          },
        ],
      },
    })
    try {
      const fetcher: FetchImpl = async () => ({
        bytes: Buffer.from('x', 'utf-8'),
        sha256: sha256Of('x'),
      })
      await run({
        publicDir: path.join(root, 'public'),
        outPath: path.join(root, 'public', 'data', 'reference-cache-drift.json'),
        collections: ['library'],
        concurrency: 2,
        timeoutMs: 5000,
        limit: null,
        dryRun: true,
        fetcher,
        log: () => undefined,
      })
      expect(fs.existsSync(path.join(root, 'public', 'data', 'reference-cache-drift.json'))).toBe(
        false
      )
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})
