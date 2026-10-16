// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The researcher workspace inside the evidence bundle, end to end: build the
 * bundle from saved artifacts, zip it, and read the zip back read-only.
 */
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import type { ExecutiveDocument } from '@/services/storage/types'
import { buildEvidenceBundle, evidenceBundleFiles } from '@/services/evidenceBundle'
import { buildZipBundle } from '@/services/exportBundle'
import { buildRunManifest, type RunManifest } from '@/services/runManifest'
import { runManifestSaveRequest } from '@/services/runEvidence'
import { buildLibraryIndex } from './collectionChanges'
import { collectionFromRecords, collectionSaveRequest } from './libraryCollection'
import { emptyQuestion, questionSaveRequest } from './researchQuestion'
import { claimMatrixSaveRequest, emptyClaimMatrix, newClaim } from './claimMatrix'
import { compareRuns, REPRODUCTION_SCHEMA, reproductionSaveRequest } from './reproductionRecord'
import { asLibraryCollection, readEvidenceBundleZip } from './bundleImport'
import { collectionChanges } from './collectionChanges'

const SITE = { appVersion: '4.163.0', commit: 'f74fe1d17aaa', wasmHash: 'w', buildTimestamp: '' }
const NOW = new Date('2026-10-16T12:00:00Z')

const asDoc = (req: object, at: number): ExecutiveDocument =>
  ({
    ...req,
    id: `d${at}`,
    createdAt: at,
    updatedAt: at,
    approvalStatus: 'draft',
  }) as ExecutiveDocument

const run = (finishedAt: string): RunManifest =>
  buildRunManifest(
    {
      tool: { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1' },
      executionMode: 'in-browser-implementation',
      inputs: {},
      cases: [{ id: 'c1', expected: 'aa', actual: 'aa', pass: true }],
      limitations: ['Only HMAC_DRBG'],
      startedAt: finishedAt,
      finishedAt,
    },
    SITE,
    'test'
  )

// Saved before a Library release that moved the draft from -04 to -05.
const SAVED_DRAFT = {
  referenceId: 'draft-ietf-tls-mlkem',
  documentTitle: 'ML-KEM for TLS 1.3',
  downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem-04',
  lifecycleLabel: 'Draft',
}
const FIPS = {
  referenceId: 'FIPS 203',
  documentTitle: 'ML-KEM',
  lastUpdateDate: '2024-08-13',
  lifecycleLabel: 'Released',
  lastVerified: '2026-09-30',
}
const index = buildLibraryIndex([
  { ...SAVED_DRAFT, downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem-05' },
  FIPS,
])

async function documents(): Promise<ExecutiveDocument[]> {
  const a = run('2026-10-15T08:00:00.000Z')
  const b = run('2026-10-16T08:00:00.000Z')
  const runA = asDoc(await runManifestSaveRequest(a), 1)
  const runB = asDoc(await runManifestSaveRequest(b), 2)
  const question = asDoc(
    questionSaveRequest(
      {
        ...emptyQuestion(),
        question: 'Is the ML-KEM TLS codepoint stable?',
        type: 'protocol-binding',
      },
      'research-question:1'
    ),
    3
  )
  const collection = asDoc(
    collectionSaveRequest(
      collectionFromRecords('TLS sources', [SAVED_DRAFT, FIPS], NOW),
      'library-collection:1'
    ),
    4
  )
  const matrix = asDoc(
    claimMatrixSaveRequest(
      {
        ...emptyClaimMatrix(),
        title: 'TLS claims',
        claims: [
          { ...newClaim([]), claim: 'ML-KEM is final', status: 'fact', supporting: ['FIPS 203'] },
        ],
      },
      'claim-matrix:1'
    ),
    5
  )
  const repro = asDoc(
    reproductionSaveRequest(
      {
        schema: REPRODUCTION_SCHEMA,
        runs: [
          { moduleId: runA.moduleId, title: runA.title, finishedAt: a.runtime.finishedAt },
          { moduleId: runB.moduleId, title: runB.title, finishedAt: b.runtime.finishedAt },
        ],
        comparison: compareRuns(a, b),
        secondImplementation: '',
        conclusion: 'Repeats',
        falsification: '',
      },
      'reproduction-record:1'
    ),
    6
  )
  return [repro, matrix, collection, question, runB, runA]
}

describe('evidence bundle with the research workspace', async () => {
  const docs = await documents()
  const bundle = buildEvidenceBundle({
    records: [],
    documents: docs,
    site: SITE,
    now: NOW,
    libraryIndex: index,
  })
  const md = bundle.markdown

  it('reads question → records → collections → claims → runs → reproductions → methods', () => {
    const order = [
      '## 1. Research question',
      // 2 and 3 (bookmarks, references) are listed as missing: nothing bookmarked.
      '## 4. Library Collection',
      '## 5. Claim Matrix',
      '## 6. Saved Run Record',
      '## 7. Reproduction Record',
      '## 8. Methods and limitations',
      '## What is missing',
    ].map((h) => md.indexOf(h))
    expect(order.some((i) => i < 0)).toBe(false)
    expect([...order].sort((x, y) => x - y)).toEqual(order)
    expect(md).toContain('> Is the ML-KEM TLS codepoint stable?')
  })

  it('shows each collection record’s current state and, when different, the saved one', () => {
    expect(md).toContain(
      '| draft-ietf-tls-mlkem | ML-KEM for TLS 1.3 | — | draft -05 · Draft · not re-verified | draft -04 · Draft · not re-verified | New revision: draft -04 → draft -05 |'
    )
    expect(md).toContain(
      '| FIPS 203 | ML-KEM | — | 2024-08-13 · Released · verified 2026-09-30 | same | — |'
    )
  })

  it('lists what is missing for the workspace parts', () => {
    const labels = bundle.missing.map((m) => m.label)
    expect(labels).toContain('1 collection record has changed since you saved it')
    expect(labels).toContain('Falsification condition not stated')
    expect(labels).toContain('No second implementation compared')
    expect(labels).not.toContain('Claim Matrix')
    expect(labels).not.toContain('Research question')
    expect(bundle.missing.find((m) => m.label === 'Bookmarked Library records')?.toolPath).toBe(
      '/library'
    )
  })

  it('round-trips through the zip for a read-only reviewer', async () => {
    const files = evidenceBundleFiles(bundle, { today: '2026-10-16', now: NOW })
    const collections = JSON.parse(
      files.find((f) => f.path.endsWith('collections.json'))?.content as string
    )
    expect(Object.keys(collections)[0]).toBe('notice')
    expect(collections.checkedAgainstLibrary).toBe(true)

    const zip = await buildZipBundle(files)
    const imported = await readEvidenceBundleZip(await zip.arrayBuffer())
    expect(imported.problems).toEqual([])
    expect(imported.title).toBe('Evidence bundle')
    expect(imported.runs.map((r) => r.path)).toEqual([
      'runs/drbg-demo-1.json',
      'runs/drbg-demo-2.json',
    ])
    expect(imported.runs[0].manifest.site.commit).toBe(SITE.commit)
    expect(imported.collections[0].entries[0]).toMatchObject({
      referenceId: 'draft-ietf-tls-mlkem',
      saved: { revision: 'draft -04' },
      current: { revision: 'draft -05' },
    })
    expect(imported.research?.questions[0].question).toBe('Is the ML-KEM TLS codepoint stable?')
    expect(imported.research?.claimMatrices[0].claims[0].supporting).toEqual(['FIPS 203'])
    expect(imported.research?.reproductions[0].conclusion).toBe('Repeats')

    // A reviewer's change check starts from the state at bundle time.
    expect(
      collectionChanges(
        [{ moduleId: 'm', collection: asLibraryCollection(imported.collections[0]) }],
        index
      )
    ).toEqual([])
  })

  it('reports files it cannot read and an empty zip', async () => {
    const zip = new JSZip()
    zip.file('evidence-bundle/runs/bad.json', '{ not json')
    zip.file('evidence-bundle/runs/other.json', '{"schema":"something-else"}')
    const imported = await readEvidenceBundleZip(await zip.generateAsync({ type: 'uint8array' }))
    expect(imported.runs).toEqual([])
    expect(imported.problems).toEqual([
      'evidence-bundle/runs/bad.json is not valid JSON.',
      'evidence-bundle/runs/other.json is not a PQC Today run record.',
      'No run records, collections or research notes were found in this zip.',
    ])
  })

  it('without the Library, collections show the saved state and say it was not checked', () => {
    const b = buildEvidenceBundle({ records: [], documents: docs, site: SITE, now: NOW })
    expect(b.markdown).toContain('current Library state not checked')
    expect(b.missing.map((m) => m.label)).not.toContain(
      '1 collection record has changed since you saved it'
    )
  })
})
