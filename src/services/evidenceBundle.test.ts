// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import type { ExecutiveDocument } from '@/services/storage/types'
import { buildRunManifest, MODE_TEXT, type RunManifest } from './runManifest'
import {
  readRunManifest,
  runManifestSaveRequest,
  runManifestSummaryMarkdown,
  storedRunManifest,
  VECTOR_MATCH_SENTENCE,
} from './runEvidence'
import {
  buildEvidenceBundle,
  EVIDENCE_BUNDLE_LIBRARY_PATH,
  EVIDENCE_BUNDLE_STATEMENT,
  evidenceBundleFiles,
  recordRevision,
  recordsForBookmarks,
  type EvidenceRecord,
} from './evidenceBundle'

const SITE: RunManifest['site'] = {
  appVersion: '4.163.0',
  commit: 'f74fe1d17aaaabbbbccccddddeeeeffff0000111',
  wasmHash: 'abc123def4567890',
  buildTimestamp: '2026-10-16T09:00:00Z',
}
const NOW = new Date('2026-10-16T12:00:00Z')

const record = (over: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  referenceId: 'FIPS 203',
  documentTitle: 'Module-Lattice-Based Key-Encapsulation Mechanism Standard',
  downloadUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
  initialPublicationDate: '2024-08-13',
  lastUpdateDate: '2024-08-13',
  authorsOrOrganization: 'NIST',
  documentType: 'Standard',
  documentStatus: 'Final',
  lifecycleLabel: 'Released',
  lastVerified: '2026-09-30',
  ...over,
})

const DRAFT = record({
  referenceId: 'draft-ietf-lamps-kyber-certificates-07',
  documentTitle: 'Algorithm Identifiers for ML-KEM',
  downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-kyber-certificates/07/',
  documentType: 'Internet-Draft',
  documentStatus: 'Internet-Draft',
  lifecycleLabel: 'Draft',
  lastVerified: undefined,
  supersededByRefs: ['RFC 9935'],
})

const manifest = (finishedAt: string, withControls = true): RunManifest =>
  buildRunManifest(
    {
      tool: { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1.0.4' },
      executionMode: 'in-browser-implementation',
      inputs: { mechanism: 'HMAC_DRBG', samples: Array.from({ length: 1000 }, (_, i) => i) },
      cases: [
        { id: 'case-1', expected: 'sha256:aa (128 bytes)', actual: 'ab'.repeat(2048), pass: true },
        {
          id: 'case-2',
          expected: 'sha256:bb (128 bytes)',
          actual: 'sha256:bb (128 bytes)',
          pass: false,
        },
      ],
      limitations: ['Not an entropy-source test.'],
      startedAt: finishedAt,
      finishedAt,
      vectors: {
        source: 'NIST ACVP-Server sample set',
        url: 'https://example.org/vectors.json',
        sha256: '266d70080bf5f3a633ee05e29bc3d0d66cf33219934c0b3499b5782f45544b80',
        count: 2,
      },
      ...(withControls
        ? {
            negativeControls: [
              { id: 'nc-1', mutation: 'flip one bit of the entropy input', pass: true },
            ],
          }
        : {}),
    },
    SITE,
    'test-agent'
  )

async function savedDoc(m: RunManifest, at: number): Promise<ExecutiveDocument> {
  const req = await runManifestSaveRequest(m)
  return {
    id: `run-manifest-${at}`,
    moduleId: req.moduleId,
    type: req.type,
    title: req.title,
    data: req.data,
    inputs: req.inputs,
    output: req.output,
    createdAt: at,
    updatedAt: at,
  }
}

describe('evidence bundle: empty state', () => {
  const bundle = buildEvidenceBundle({ records: [], documents: [], site: SITE, now: NOW })

  it('still produces a bundle with the cover, the notice and the methods', () => {
    expect(bundle.markdown).toContain(EDUCATION_NOTICE)
    expect(bundle.markdown).toContain('# Evidence bundle')
    expect(bundle.markdown).toContain('- Generated: 2026-10-16')
    expect(bundle.markdown).toContain('Site version 4.163.0 · commit f74fe1d17aaa')
    expect(bundle.markdown).toContain(EVIDENCE_BUNDLE_STATEMENT)
    expect(bundle.markdown).toContain('## 8. Methods and limitations')
  })

  it('lists every missing section with a link to the tool that produces it', () => {
    const labels = bundle.missing.map((m) => m.label)
    expect(labels).toEqual([
      'Library Collection',
      'Claim Matrix',
      'Saved Run Record',
      'Reproduction Record',
      'Research question',
      'Bookmarked Library records',
      'References',
    ])
    expect(bundle.missing.every((m) => m.toolPath)).toBe(true)
    const missingPart = bundle.markdown.slice(bundle.markdown.indexOf('## What is missing'))
    expect(missingPart).toContain('Produce it with /playground/drbg-demo')
    expect(missingPart).toContain('**Bookmarked Library records**')
    expect(missingPart).toContain('Bookmark records in the Library at /library')
  })

  it('zips empty citation files and no runs', () => {
    const files = evidenceBundleFiles(bundle, { today: '2026-10-16' })
    const paths = files.map((f) => f.path)
    expect(paths).toEqual([
      'evidence-bundle/README.md',
      'evidence-bundle/bundle.md',
      'evidence-bundle/references.bib',
      'evidence-bundle/references.csl.json',
      'evidence-bundle/records.csv',
      'evidence-bundle/collections.json',
      'evidence-bundle/research.json',
    ])
    const csl = files.find((f) => f.path.endsWith('.csl.json'))?.content as string
    expect(JSON.parse(csl)).toEqual([])
  })
})

describe('evidence bundle: with bookmarks and two saved runs', async () => {
  const older = await savedDoc(manifest('2026-10-15T08:00:00.000Z'), 1000)
  const newer = await savedDoc(manifest('2026-10-16T08:00:00.000Z'), 2000)
  const records = [record(), DRAFT]
  const bundle = buildEvidenceBundle({
    records,
    // The store order is not the reading order: runs come oldest first.
    documents: [newer, older],
    title: 'ML-KEM certificate drafts',
    author: 'A. Researcher',
    origin: 'https://pqctoday.com',
    site: SITE,
    now: NOW,
  })
  const md = bundle.markdown

  it('puts the sections in the fixed order', () => {
    const order = [
      '# ML-KEM certificate drafts',
      '## 2. Bookmarked Library records',
      '## 3. References',
      '## 6. Saved Run Record',
      '## 8. Methods and limitations',
      '## What is missing',
    ].map((h) => md.indexOf(h))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(md).toContain('- Author: A. Researcher')
  })

  it('shows each record with revision, lifecycle, superseded-by, last verified and URL', () => {
    expect(md).toContain(
      '| FIPS 203 | Module-Lattice-Based Key-Encapsulation Mechanism Standard | 2024-08-13 | Released | — | 2026-09-30 | https://csrc.nist.gov/pubs/fips/203/final |'
    )
    expect(md).toContain('| draft -07 | Draft | RFC 9935 | not re-verified |')
  })

  it('has one citation per bookmark', () => {
    const files = evidenceBundleFiles(bundle, { today: '2026-10-16' })
    const bib = files.find((f) => f.path.endsWith('.bib'))?.content as string
    const csl = files.find((f) => f.path.endsWith('.csl.json'))?.content as string
    expect(bib.match(/^@misc\{/gm)).toHaveLength(records.length)
    expect(JSON.parse(csl)).toHaveLength(records.length)
    const csv = files.find((f) => f.path.endsWith('records.csv'))?.content as string
    expect(csv.trim().split('\n')).toHaveLength(records.length + 1)
  })

  it('writes each run as JSON, oldest first, with build, vectors and per-case results', () => {
    const files = evidenceBundleFiles(bundle, { today: '2026-10-16', pdf: new Blob(['%PDF']) })
    expect(files.map((f) => f.path)).toContain('evidence-bundle/bundle.pdf')
    const runs = files.filter((f) => f.path.startsWith('evidence-bundle/runs/'))
    expect(runs.map((f) => f.path)).toEqual([
      'evidence-bundle/runs/drbg-demo-1.json',
      'evidence-bundle/runs/drbg-demo-2.json',
    ])
    const first = JSON.parse(runs[0].content as string)
    expect(Object.keys(first)[0]).toBe('notice')
    expect(first.runtime.finishedAt).toBe('2026-10-15T08:00:00.000Z')
    expect(first.site).toMatchObject({ appVersion: '4.163.0', wasmHash: SITE.wasmHash })
    expect(first.site.commit).toBe(SITE.commit)
    expect(first.vectors.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(first.cases).toHaveLength(2)
  })

  it('says how each run was produced and that a vector match is not a validation', () => {
    const runPart = md.slice(md.indexOf('## 6. Saved Run Record'), md.indexOf('## 8.'))
    expect(runPart.split(MODE_TEXT['in-browser-implementation']).length - 1).toBe(2)
    expect(runPart.split(VECTOR_MATCH_SENTENCE).length - 1).toBe(2)
    expect(runPart).toContain('Negative controls: 1 of 1 passed')
    expect(runPart).toContain('Result: 1 passed, 1 failed (2 cases)')
    // The section is the saved record's own text.
    expect(runPart).toContain(older.data)
    expect(runPart).toContain('Full record: `runs/drbg-demo-1.json`')
  })

  it('lists superseded bookmarks under what is missing, with a link', () => {
    const missingPart = md.slice(md.indexOf('## What is missing'))
    expect(missingPart).toContain('**1 bookmarked record is superseded**')
    expect(missingPart).toContain('https://pqctoday.com/revisions')
    expect(missingPart).not.toContain('Saved Run Record')
  })
})

describe('evidence bundle: other gaps', () => {
  it('names bookmarks no longer in the Library and runs without a negative control', async () => {
    const doc = await savedDoc(manifest('2026-10-16T08:00:00.000Z', false), 1)
    const bundle = buildEvidenceBundle({
      records: [record()],
      missingBookmarkIds: ['OLD-1'],
      documents: [doc],
      site: SITE,
      now: NOW,
    })
    const labels = bundle.missing.map((m) => m.label).filter((l) => /bookmark|negative/.test(l))
    expect(labels).toEqual(['1 bookmark is no longer in the Library', 'No negative control saved'])
    expect(bundle.missing.find((m) => m.label === 'No negative control saved')?.toolPath).toBe(
      '/playground/drbg-demo'
    )
  })
})

describe('saved run records', () => {
  it('stores digests, not the full outputs or sample arrays', async () => {
    const m = manifest('2026-10-16T08:00:00.000Z')
    const stored = await storedRunManifest(m)
    expect(stored.cases[0].actual).toMatch(/^sha256:[0-9a-f]{64} \(4096 chars\)$/)
    expect(stored.inputs.samples).toMatch(/^sha256:[0-9a-f]{64} \(array of 1000\)$/)
    expect(stored.cases[1].actual).toBe('sha256:bb (128 bytes)')
    expect(JSON.stringify(stored).length).toBeLessThan(JSON.stringify(m).length / 3)
    expect(JSON.stringify(stored)).not.toContain('abab'.repeat(100))
  })

  it('saves a run-manifest artifact whose text is the summary of its output', async () => {
    const req = await runManifestSaveRequest(manifest('2026-10-16T08:00:00.000Z'))
    expect(req.type).toBe('run-manifest')
    expect(req.moduleId).toBe('run-manifest:drbg-demo:2026-10-16T08:00:00.000Z')
    expect(readRunManifest(req)).toBe(req.output)
    expect(req.data).toBe(runManifestSummaryMarkdown(req.output))
    expect(readRunManifest({ output: { schema: 'other' } })).toBeNull()
  })
})

describe('Library helpers', () => {
  it('finds bookmarks in children and reports ids no longer present', () => {
    const tree = [
      { referenceId: 'A', children: [{ referenceId: 'A-1' }] },
      { referenceId: 'B' },
    ] as Array<{ referenceId: string; children?: Array<{ referenceId: string }> }>
    const { records, missingIds } = recordsForBookmarks(tree, ['A-1', 'Z', 'B'])
    expect(records.map((r) => r.referenceId)).toEqual(['A-1', 'B'])
    expect(missingIds).toEqual(['Z'])
  })

  it('reads a draft revision from the id, else the last update date', () => {
    expect(recordRevision(DRAFT)).toBe('draft -07')
    expect(recordRevision(record())).toBe('2024-08-13')
  })

  it('links "Download the evidence bundle" to the bookmarks view', () => {
    expect(EVIDENCE_BUNDLE_LIBRARY_PATH).toBe('/library?qv=bookmarked')
  })
})
