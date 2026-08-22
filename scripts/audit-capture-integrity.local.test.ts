// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-capture-integrity.local.test.ts
 *
 * Local-gate suite (directive 2026-07-01: new suites run via `npm run
 * test:local`, not CI). Every fixture is built in a fresh tmpdir — this suite
 * never reads `src/data/`, the committed manifests, or the real evidence
 * cache, and never writes anywhere but its own tmpdir. The audit under test is
 * read-only by construction; the tests assert that too (see "never overwrites
 * a capture").
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createHash } from 'crypto'
import {
  run,
  rotatingSlice,
  probeUpstream,
  highCount,
  normalizeUrl,
  type Capture,
  type Collection,
  type ManifestEntry,
  type UpstreamFetchImpl,
} from './audit-capture-integrity'

const sha = (s: string | Buffer): string => createHash('sha256').update(s).digest('hex')

let root: string

interface FixtureEntry {
  refId: string
  filename: string
  /** bytes written to the cache */
  content: string
  /** hash recorded in the manifest — defaults to the hash of `content` */
  manifestSha?: string
  /** omit the file from disk entirely */
  omitFile?: boolean
  url: string
  csvUrl?: string
  status?: string
}

function writeFixture(entries: FixtureEntry[], collection: Collection = 'library'): void {
  const publicDir = path.join(root, 'public', collection)
  const cacheDir = path.join(root, 'cache', collection)
  const dataDir = path.join(root, 'src', 'data')
  fs.mkdirSync(publicDir, { recursive: true })
  fs.mkdirSync(cacheDir, { recursive: true })
  fs.mkdirSync(dataDir, { recursive: true })

  const manifestEntries: ManifestEntry[] = entries.map((e) => ({
    refId: e.refId,
    title: e.refId,
    url: e.url,
    status: 'downloaded',
    filename: e.filename,
    sha256: e.manifestSha ?? sha(e.content),
  }))
  fs.writeFileSync(
    path.join(publicDir, 'manifest.json'),
    JSON.stringify({ entries: manifestEntries }, null, 2)
  )
  for (const e of entries) {
    if (e.omitFile) continue
    fs.writeFileSync(path.join(cacheDir, e.filename), e.content)
  }
  const header = 'reference_id,download_url,status\n'
  const body = entries
    .map((e) => `${e.refId},${e.csvUrl ?? e.url},${e.status ?? 'active'}`)
    .join('\n')
  fs.writeFileSync(path.join(dataDir, 'library_08212026.csv'), `${header}${body}\n`)
}

const runAudit = (collection: Collection = 'library') =>
  run({
    publicDir: path.join(root, 'public'),
    dataDir: path.join(root, 'src', 'data'),
    cacheRoot: path.join(root, 'cache'),
    collections: [collection],
    quiet: true,
  })

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'capture-integrity-'))
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('clean catalogue', () => {
  it('stays completely quiet when every capture matches its recorded hash', async () => {
    writeFixture([
      { refId: 'DOC-A', filename: 'a.pdf', content: 'alpha', url: 'https://example.org/a.pdf' },
      { refId: 'DOC-B', filename: 'b.pdf', content: 'bravo', url: 'https://example.org/b.pdf' },
    ])
    const report = await runAudit()
    expect(report.findings).toEqual([])
    expect(highCount(report)).toBe(0)
  })
})

describe('on-disk drift', () => {
  it('flags a capture whose bytes were replaced under the manifest', async () => {
    writeFixture([
      { refId: 'DOC-A', filename: 'a.pdf', content: 'alpha', url: 'https://example.org/a.pdf' },
      { refId: 'DOC-B', filename: 'b.pdf', content: 'bravo', url: 'https://example.org/b.pdf' },
    ])
    // Something overwrites the capture without touching the manifest.
    fs.writeFileSync(path.join(root, 'cache', 'library', 'a.pdf'), 'TAMPERED')

    const report = await runAudit()
    const drift = report.findings.filter((f) => f.kind === 'disk-drift')
    expect(drift).toHaveLength(1)
    expect(drift[0].refIds).toEqual(['DOC-A'])
    expect(drift[0].severity).toBe('high')
    expect(drift[0].observedSha256).toBe(sha('TAMPERED'))
    expect(drift[0].storedSha256).toBe(sha('alpha'))
  })

  it('flags a manifest hash rewritten without the file — the other direction', async () => {
    writeFixture([
      {
        refId: 'DOC-A',
        filename: 'a.pdf',
        content: 'alpha',
        manifestSha: sha('something else entirely'),
        url: 'https://example.org/a.pdf',
      },
    ])
    const report = await runAudit()
    expect(report.findings.map((f) => f.kind)).toContain('disk-drift')
  })

  it('reports a missing capture as medium, not as drift', async () => {
    writeFixture([
      {
        refId: 'DOC-A',
        filename: 'a.pdf',
        content: 'alpha',
        omitFile: true,
        url: 'https://example.org/a.pdf',
      },
    ])
    const report = await runAudit()
    expect(report.findings).toHaveLength(1)
    expect(report.findings[0].kind).toBe('capture-missing')
    expect(report.findings[0].severity).toBe('medium')
  })
})

describe('duplicate-capture collision (the GRI signature)', () => {
  it('flags two active rows with different URLs backed by one byte-identical file', async () => {
    writeFixture([
      {
        refId: 'GRI-Quantum-Threat-Timeline-2024',
        filename: 'gri-2024.pdf',
        content: 'THE 2025 EDITION',
        url: 'https://globalriskinstitute.org/mp-files/quantum-threat-timeline-report-2024.pdf',
      },
      {
        refId: 'GRI-Quantum-Threat-Timeline-2025',
        filename: 'gri-2025.pdf',
        content: 'THE 2025 EDITION',
        url: 'https://globalriskinstitute.org/mp-files/pdf-quantum-threat-timeline-report-2025',
      },
    ])
    const report = await runAudit()
    const dup = report.findings.filter((f) => f.kind === 'duplicate-capture')
    expect(dup).toHaveLength(1)
    expect(dup[0].severity).toBe('high')
    expect(dup[0].refIds).toEqual([
      'GRI-Quantum-Threat-Timeline-2024',
      'GRI-Quantum-Threat-Timeline-2025',
    ])
    expect(dup[0].urls).toHaveLength(2)
  })

  it('sees the collision from the MANIFEST alone, before any file is hashed', async () => {
    // The GRI defect was visible as two manifest entries carrying one sha256
    // even while the files on disk had already diverged.
    writeFixture([
      {
        refId: 'DOC-2024',
        filename: 'a.pdf',
        content: 'genuinely different bytes',
        manifestSha: sha('shared'),
        url: 'https://example.org/2024.pdf',
      },
      {
        refId: 'DOC-2025',
        filename: 'b.pdf',
        content: 'shared',
        url: 'https://example.org/2025.pdf',
      },
    ])
    const report = await runAudit()
    expect(report.findings.filter((f) => f.kind === 'duplicate-capture')).toHaveLength(1)
  })

  it('downgrades to INFO when the sharing rows declare the SAME url', async () => {
    // Four threats rows all citing CNSA 2.0 share a capture by design. Flagging
    // that would bury the real signal.
    writeFixture([
      { refId: 'GOV-001', filename: 'a.pdf', content: 'cnsa', url: 'https://nsa.gov/cnsa.pdf' },
      { refId: 'GOV-002', filename: 'b.pdf', content: 'cnsa', url: 'https://nsa.gov/cnsa.pdf/' },
    ])
    const report = await runAudit()
    expect(highCount(report)).toBe(0)
    const info = report.findings.filter((f) => f.kind === 'duplicate-capture-same-url')
    expect(info).toHaveLength(1)
    expect(info[0].severity).toBe('info')
  })

  it('ignores a deprecated row sharing bytes with its successor', async () => {
    writeFixture([
      {
        refId: 'OLD',
        filename: 'a.pdf',
        content: 'same',
        url: 'https://example.org/old.pdf',
        status: 'deprecated',
      },
      { refId: 'NEW', filename: 'b.pdf', content: 'same', url: 'https://example.org/new.pdf' },
    ])
    const report = await runAudit()
    expect(report.findings.filter((f) => f.kind.startsWith('duplicate'))).toHaveLength(0)
  })

  it('prefers the CSV url over the manifest url — the GRI rewrite hid the difference', async () => {
    // Both manifest entries were rewritten to the 2025 URL by the bad refresh;
    // only the catalogue row still recorded what each row claims to cite.
    writeFixture([
      {
        refId: 'DOC-2024',
        filename: 'a.pdf',
        content: 'shared',
        url: 'https://example.org/2025.pdf',
        csvUrl: 'https://example.org/2024.pdf',
      },
      {
        refId: 'DOC-2025',
        filename: 'b.pdf',
        content: 'shared',
        url: 'https://example.org/2025.pdf',
        csvUrl: 'https://example.org/2025.pdf',
      },
    ])
    const report = await runAudit()
    expect(report.findings.filter((f) => f.kind === 'duplicate-capture')).toHaveLength(1)
  })

  it('normalizeUrl treats a trailing slash and case as the same url', () => {
    expect(normalizeUrl('https://Example.org/a.pdf/')).toBe(
      normalizeUrl('https://example.org/a.pdf')
    )
  })
})

describe('combined fixture', () => {
  it('flags a tampered capture AND a duplicate pair in one run', async () => {
    writeFixture([
      { refId: 'DOC-A', filename: 'a.pdf', content: 'alpha', url: 'https://example.org/a.pdf' },
      { refId: 'DUP-1', filename: 'd1.pdf', content: 'same', url: 'https://example.org/one.pdf' },
      { refId: 'DUP-2', filename: 'd2.pdf', content: 'same', url: 'https://example.org/two.pdf' },
    ])
    fs.writeFileSync(path.join(root, 'cache', 'library', 'a.pdf'), 'TAMPERED')
    const report = await runAudit()
    const kinds = report.findings
      .filter((f) => f.severity === 'high')
      .map((f) => f.kind)
      .sort()
    expect(kinds).toEqual(['disk-drift', 'duplicate-capture'])
  })
})

describe('rotation', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map((refId) => ({ refId }))

  it('makes forward progress instead of re-checking the head of the list', () => {
    const first = rotatingSlice(items, {}, 2)
    expect(first.sample.map((s) => s.refId)).toEqual(['a', 'b'])
    const second = rotatingSlice(
      items,
      { cumulative_checked_ids: first.rotation.newCumulative, last_checked_id: 'b' },
      2
    )
    expect(second.sample.map((s) => s.refId)).toEqual(['c', 'd'])
  })

  it('selects by membership, not position, so a reordered list still progresses', () => {
    const reordered = [...items].reverse()
    const next = rotatingSlice(
      reordered,
      { cumulative_checked_ids: ['a', 'b'], last_checked_id: 'b' },
      2
    )
    expect(next.sample.map((s) => s.refId)).toEqual(['e', 'd'])
  })

  it('starts a fresh lap once every id has been seen', () => {
    const next = rotatingSlice(items, { cumulative_checked_ids: ['a', 'b', 'c', 'd', 'e'] }, 2)
    expect(next.sample).toHaveLength(2)
    expect(next.rotation.cumulativeCount).toBe(2)
  })
})

describe('upstream probe', () => {
  function capture(overrides: Partial<Capture> = {}): Capture {
    return {
      collection: 'library',
      refId: 'DOC-A',
      entry: { refId: 'DOC-A', sha256: sha('captured'), status: 'downloaded', filename: 'a.pdf' },
      cachedPath: path.join(root, 'cache', 'library', 'a.pdf'),
      diskSha256: sha('captured'),
      declaredUrl: 'https://example.org/a.pdf',
      active: true,
      ...overrides,
    }
  }

  const stub =
    (body: string | null): UpstreamFetchImpl =>
    () =>
      body === null
        ? { ok: false, bytes: null, tier: 'stub', error: 'blocked' }
        : { ok: true, bytes: Buffer.from(body), tier: 'stub', error: null }

  it('reports upstream drift and never overwrites the capture', async () => {
    fs.mkdirSync(path.join(root, 'cache', 'library'), { recursive: true })
    const file = path.join(root, 'cache', 'library', 'a.pdf')
    fs.writeFileSync(file, 'captured')

    const findings = await probeUpstream([capture()], {
      limit: 5,
      checkpointPath: path.join(root, 'cp.json'),
      checkpointKey: 'library',
      delayMs: 0,
      fetcher: stub('THE FEBRUARY 2026 EDITION'),
      persist: true,
      log: () => {},
    })
    expect(findings).toHaveLength(1)
    expect(findings[0].kind).toBe('upstream-drift')
    expect(findings[0].severity).toBe('high')
    // The capture is untouched — this is the whole point of the design.
    expect(fs.readFileSync(file, 'utf8')).toBe('captured')
    expect(sha(fs.readFileSync(file))).toBe(sha('captured'))
  })

  it('stays quiet when upstream still serves the captured bytes', async () => {
    const findings = await probeUpstream([capture()], {
      limit: 5,
      checkpointPath: path.join(root, 'cp.json'),
      checkpointKey: 'library',
      delayMs: 0,
      fetcher: stub('captured'),
      persist: false,
      log: () => {},
    })
    expect(findings).toEqual([])
  })

  it('does not call a site-chrome change drift', async () => {
    // The RFC-Editor lesson, inherited from audit-reference-cache-drift.ts: one
    // website deploy changed a footer build string and re-flagged every cached
    // RFC. A raw-hash mismatch alone is not evidence the DOCUMENT changed.
    fs.mkdirSync(path.join(root, 'cache', 'library'), { recursive: true })
    const file = path.join(root, 'cache', 'library', 'a.html')
    const cached = '<html><main><h1>RFC 5869</h1></main><footer>Version 1.69.0</footer></html>'
    const live = '<html><main><h1>RFC 5869</h1></main><footer>Version 1.71.3</footer></html>'
    fs.writeFileSync(file, cached)

    const findings = await probeUpstream(
      [
        capture({
          cachedPath: file,
          entry: { refId: 'DOC-A', sha256: sha(cached), status: 'downloaded', filename: 'a.html' },
        }),
      ],
      {
        limit: 5,
        checkpointPath: path.join(root, 'cp.json'),
        checkpointKey: 'library',
        delayMs: 0,
        fetcher: stub(live),
        persist: false,
        log: () => {},
      }
    )
    expect(findings).toEqual([])
  })

  it('classifies an unreachable URL as low, never as drift', async () => {
    const findings = await probeUpstream([capture()], {
      limit: 5,
      checkpointPath: path.join(root, 'cp.json'),
      checkpointKey: 'library',
      delayMs: 0,
      fetcher: stub(null),
      persist: false,
      log: () => {},
    })
    expect(findings.map((f) => f.kind)).toEqual(['upstream-unreachable'])
    expect(findings[0].severity).toBe('low')
  })

  it('is bounded and checkpoints forward across runs', async () => {
    const cp = path.join(root, 'cp.json')
    const caps = ['a', 'b', 'c', 'd'].map((id) =>
      capture({ refId: id, entry: { refId: id, sha256: sha('captured'), status: 'downloaded' } })
    )
    const opts = {
      limit: 2,
      checkpointPath: cp,
      checkpointKey: 'library',
      delayMs: 0,
      persist: true,
      log: () => {},
    }
    const seen: string[] = []
    await probeUpstream(caps, {
      ...opts,
      fetcher: (u: string) => {
        seen.push(u)
        return { ok: true, bytes: Buffer.from('captured'), tier: 'stub', error: null }
      },
    })
    expect(seen).toHaveLength(2)
    const state = JSON.parse(fs.readFileSync(cp, 'utf8'))
    expect(state.library.cumulative_checked_ids).toEqual(['a', 'b'])

    await probeUpstream(caps, {
      ...opts,
      fetcher: () => ({ ok: true, bytes: Buffer.from('captured'), tier: 'stub', error: null }),
    })
    // The second run advanced to c+d rather than re-checking a+b — forward
    // progress, which is the whole point. Completing the lap then RESETS the
    // cumulative set to just this lap's sample (inherited deliberately from
    // rotation_util.py, so coverage % stays meaningful instead of pinning at
    // 100% forever), so the checkpoint now reads c+d, not a+b+c+d.
    const state2 = JSON.parse(fs.readFileSync(cp, 'utf8'))
    expect(state2.library.cumulative_checked_ids).toEqual(['c', 'd'])
  })
})
