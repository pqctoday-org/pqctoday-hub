// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The published HPKE-PQ vectors are those of draft-ietf-hpke-pq-05. The file and
 * its manifest id still read "04" (stable keys, chosen before the label was
 * corrected), so the visible labels must agree with each other and say 05.
 */
import { describe, it, expect } from 'vitest'
import vectorFile from '@/data/acvp/hpke-pq-04-test-vectors.json'
import manifest from './vector-manifest.json'

type Entry = {
  id: string
  source: { citation: string; revision: string; verification: { method: string } }
  cases: { algorithm: { revision: string }; upstream: { label: string } }[]
}
const entry = (manifest as unknown as { files: Entry[] }).files.find(
  (f) => f.id === 'hpke-pq-04-test-vectors'
) as Entry

describe('HPKE-PQ vector file label', () => {
  it('the manifest entry exists and has all 13 cases', () => {
    expect(entry).toBeDefined()
    expect(entry.cases).toHaveLength(13)
  })

  it('the file, the manifest source and every case name draft -05', () => {
    expect(vectorFile.spec).toBe('draft-ietf-hpke-pq-05')
    expect(entry.source.revision).toBe('draft-ietf-hpke-pq-05')
    expect(entry.source.citation).toContain('draft-ietf-hpke-pq-05')
    expect(entry.source.verification.method).toContain('draft-ietf-hpke-pq-05')
    for (const c of entry.cases) {
      expect(c.algorithm.revision).toBe('draft-ietf-hpke-pq-05')
      expect(c.upstream.label).toContain('draft-ietf-hpke-pq-05')
    }
  })

  it('no visible label still says draft -04', () => {
    expect(JSON.stringify(entry.source)).not.toContain('hpke-pq-04')
    expect(JSON.stringify(entry.cases.map((c) => [c.algorithm, c.upstream]))).not.toContain(
      'hpke-pq-04'
    )
    expect(String(vectorFile.spec)).not.toContain('-04')
    expect(String(vectorFile.$schema)).not.toContain('draft-ietf-hpke-pq-04')
  })
})
