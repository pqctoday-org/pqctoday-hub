// SPDX-License-Identifier: GPL-3.0-only
import { createHash } from 'crypto'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  auditRows,
  exitCode,
  loadEnrichmentLookup,
  summarize,
  type CsvRow,
} from './audit-timeline-enrichment-freshness'

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

function row(over: Partial<CsvRow> = {}): CsvRow {
  return {
    Country: 'France',
    OrgName: 'ANSSI',
    Title: 'Phase 1',
    SourceUrl: 'https://example.gov/doc',
    local_file: 'timeline/France_ANSSI_Phase_1.pdf',
    status: 'active',
    event_id: 'france-anssi-phase-1',
    ...over,
  }
}

describe('audit-timeline-enrichment-freshness', () => {
  let dir: string
  let cache: string
  let enrichDir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'tl-fresh-'))
    cache = join(dir, 'local-evidence-cache')
    enrichDir = join(dir, 'doc-enrichments')
    mkdirSync(join(cache, 'timeline'), { recursive: true })
    mkdirSync(enrichDir, { recursive: true })
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function enrich(label: string, extra = '', mtimeSec = 1_000_000) {
    const f = join(enrichDir, 'timeline_doc_enrichments_09012026.md')
    writeFileSync(f, `# Timeline\n\n## ${label}\n\n- **Title**: x\n${extra}\n## ---\n`)
    utimesSync(f, mtimeSec, mtimeSec)
  }

  it('resolves the real `timeline/foo.pdf` local_file form under the private cache', () => {
    writeFileSync(join(cache, 'timeline/France_ANSSI_Phase_1.pdf'), 'bytes')
    utimesSync(join(cache, 'timeline/France_ANSSI_Phase_1.pdf'), 500_000, 500_000)
    enrich('France:ANSSI — Phase 1')
    const reports = auditRows(
      [row()],
      { root: dir, evidenceRoot: cache },
      new Map(),
      {},
      loadEnrichmentLookup(enrichDir)
    )
    expect(reports[0].outcome).toBe('fresh')
    expect(reports[0].evidence_path).toBe('timeline/France_ANSSI_Phase_1.pdf')
    expect(reports[0].method).toBe('mtime')
  })

  it('falls back to the event_id-keyed manifest entry when local_file is blank', () => {
    writeFileSync(join(cache, 'timeline/other.html'), 'bytes')
    utimesSync(join(cache, 'timeline/other.html'), 500_000, 500_000)
    enrich('France:ANSSI — Phase 1')
    const reports = auditRows(
      [row({ local_file: '' })],
      { root: dir, evidenceRoot: cache },
      new Map([
        ['france-anssi-phase-1', { refId: 'france-anssi-phase-1', file: 'timeline/other.html' }],
      ]),
      {},
      loadEnrichmentLookup(enrichDir)
    )
    expect(reports[0].outcome).toBe('fresh')
    expect(reports[0].evidence_path).toBe('timeline/other.html')
  })

  it('flags a row whose evidence bytes changed since the recorded enrichment digest', () => {
    writeFileSync(join(cache, 'timeline/France_ANSSI_Phase_1.pdf'), 'new bytes')
    enrich('France:ANSSI — Phase 1', `- **Evidence SHA-256**: ${sha('old bytes')}\n`)
    const [r] = auditRows(
      [row()],
      { root: dir, evidenceRoot: cache },
      new Map(),
      {},
      loadEnrichmentLookup(enrichDir)
    )
    expect(r.outcome).toBe('stale')
    expect(r.method).toBe('digest')
  })

  it('treats a matching digest as fresh even when the file mtime is newer (a recache)', () => {
    writeFileSync(join(cache, 'timeline/France_ANSSI_Phase_1.pdf'), 'same bytes')
    utimesSync(join(cache, 'timeline/France_ANSSI_Phase_1.pdf'), 9_000_000, 9_000_000)
    enrich('France:ANSSI — Phase 1', `- **Evidence SHA-256**: ${sha('same bytes')}\n`, 1_000_000)
    const [r] = auditRows(
      [row()],
      { root: dir, evidenceRoot: cache },
      new Map(),
      {},
      loadEnrichmentLookup(enrichDir)
    )
    expect(r.outcome).toBe('fresh')
    expect(r.method).toBe('digest')
  })

  it('reports no-evidence and no-enrichment, and strict mode exits non-zero', () => {
    writeFileSync(join(cache, 'timeline/present.pdf'), 'x')
    const reports = auditRows(
      [
        row({ local_file: 'timeline/missing.pdf', event_id: 'a' }),
        row({ local_file: 'timeline/present.pdf', event_id: 'b', Title: 'Unenriched' }),
      ],
      { root: dir, evidenceRoot: cache },
      new Map(),
      {},
      loadEnrichmentLookup(enrichDir)
    )
    expect(reports.map((r) => r.outcome)).toEqual(['no-evidence', 'no-enrichment'])
    const s = summarize(reports)
    expect(exitCode(s, true)).toBe(1)
    expect(exitCode(s, false)).toBe(0)
  })

  it('an all-missing cache is `not-local`: report-only passes, strict fails', () => {
    const reports = auditRows(
      [row()],
      { root: dir, evidenceRoot: join(dir, 'absent') },
      new Map(),
      {},
      new Map()
    )
    expect(reports[0].outcome).toBe('not-local')
    const s = summarize(reports)
    expect(exitCode(s, false)).toBe(0)
    expect(exitCode(s, true)).toBe(1)
  })
})
