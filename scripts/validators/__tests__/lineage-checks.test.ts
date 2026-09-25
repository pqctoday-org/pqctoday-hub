// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Each case replays a leak from 2026-09-17 (plan §1) against the pure core
 * of the gate that should have caught it.
 */
import { describe, it, expect } from 'vitest'
import {
  archiveOnlyFindings,
  contradictedFindings,
  manifestEntries,
  parseNameStatus,
  typedEvidenceFindings,
  verdictLockFindings,
  LINEAGE_CUTOFF,
} from '../lineage-checks.js'

const opts = { csv: 'compliance-data.json', field: 'pqcCoverage' }

describe('LN-1 verdict lock', () => {
  it('L1 replay: a lane overwrites a stamped verdict and drops the stamp → finding', () => {
    const before = [
      { id: '5313', value: 'No PQC Mechanisms Detected', stamp: '2026-09-17T21:49:07Z' },
    ]
    const after = [{ id: '5313', value: 'ML-KEM, ML-DSA, LMS, XMSS', stamp: '' }]
    const f = verdictLockFindings(before, after, opts)
    expect(f).toHaveLength(1)
    expect(f[0].message).toMatch(/no verification stamp/)
  })

  it('a change that keeps the OLD stamp is still a finding (stamp did not move)', () => {
    const before = [
      { id: '5220', value: 'No PQC Mechanisms Detected', stamp: '2026-09-17T21:49:07Z' },
    ]
    const after = [{ id: '5220', value: 'ML-KEM, ML-DSA', stamp: '2026-09-17T21:49:07Z' }]
    expect(verdictLockFindings(before, after, opts)[0]?.message).toMatch(/did not move forward/)
  })

  it('a change WITH a newer stamp is a legitimate re-verification', () => {
    const before = [{ id: '5314', value: 'ML-KEM', stamp: '2026-09-17T21:49:07Z' }]
    const after = [
      { id: '5314', value: 'No PQC Mechanisms Detected', stamp: '2026-09-18T03:00:00Z' },
    ]
    expect(verdictLockFindings(before, after, opts)).toHaveLength(0)
  })

  it('a first verdict on a previously unstamped record needs only to be stamped', () => {
    const before = [{ id: '9001', value: '', stamp: '' }]
    expect(
      verdictLockFindings(before, [{ id: '9001', value: 'ML-KEM', stamp: '2026-09-18' }], opts)
    ).toHaveLength(0)
    expect(
      verdictLockFindings(before, [{ id: '9001', value: 'ML-KEM', stamp: '' }], opts)
    ).toHaveLength(1)
  })

  it('unchanged values, new records and removed records are not findings', () => {
    const before = [
      { id: 'a', value: 'x', stamp: '2026-09-01' },
      { id: 'gone', value: 'y', stamp: '2026-09-01' },
    ]
    const after = [
      { id: 'a', value: 'x', stamp: '2026-09-01' },
      { id: 'new', value: 'z', stamp: '' },
    ]
    expect(verdictLockFindings(before, after, opts)).toHaveLength(0)
  })
})

describe('LN-4 archive, never delete', () => {
  it('parses D / A / M lines from git diff --name-status --no-renames', () => {
    const out = [
      'D\tsrc/data/concept_xwalks_08292026.csv',
      'A\tsrc/data/archive/library_09132026_r2.csv',
      'D\tsrc/data/library_09132026_r2.csv',
      'M\tsrc/data/vendors_09172026_r1.csv',
    ].join('\n')
    const e = parseNameStatus(out)
    expect(e).toHaveLength(4)
    expect(e[0]).toEqual({ status: 'D', from: 'src/data/concept_xwalks_08292026.csv' })
  })

  it('L4 replay: a deleted dated generation with no archive/ arrival is a finding', () => {
    const f = archiveOnlyFindings([
      { status: 'D', from: 'src/data/concept_xwalks_08292026.csv' },
      { status: 'A', from: 'src/data/concept_xwalks_09172026_r1.csv' }, // the new generation git paired it with
    ])
    expect(f).toHaveLength(1)
    expect(f[0].message).toMatch(/without arriving in src\/data\/archive/)
  })

  it('git mv into archive/ under the same name (D + A pair) is the allowed exit', () => {
    expect(
      archiveOnlyFindings([
        { status: 'D', from: 'src/data/library_09132026_r2.csv' },
        { status: 'A', from: 'src/data/archive/library_09132026_r2.csv' },
      ])
    ).toHaveLength(0)
  })

  it('a rename reported anyway (someone ran with -M) is judged by where it arrived', () => {
    expect(
      archiveOnlyFindings([
        {
          status: 'R100',
          from: 'src/data/leaders_09132026_r1.csv',
          to: 'src/data/archive/leaders_09132026_r1.csv',
        },
      ])
    ).toHaveLength(0)
    expect(
      archiveOnlyFindings([
        {
          status: 'R088',
          from: 'src/data/concept_xwalks_08292026.csv',
          to: 'src/data/concept_xwalks_09172026_r1.csv',
        },
      ])
    ).toHaveLength(1)
  })

  it('archiving under a DIFFERENT name is not an exit', () => {
    expect(
      archiveOnlyFindings([
        { status: 'D', from: 'src/data/leaders_09132026_r1.csv' },
        { status: 'A', from: 'src/data/archive/leaders_old.csv' },
      ])
    ).toHaveLength(1)
  })

  it('non-dated files and archive/ files are not this check’s business', () => {
    expect(
      archiveOnlyFindings([
        { status: 'D', from: 'src/data/timelineFacts.generated.ts' },
        { status: 'D', from: 'src/data/archive/concept_xwalks_08122026.csv' },
        { status: 'D', from: 'src/data/glossary.json' },
      ])
    ).toHaveLength(0)
  })
})

describe('manifestEntries', () => {
  it('reads entries, downloads (migrate-proofs) and bare arrays', () => {
    const e = [{ identity: 'MATCH' }]
    expect(manifestEntries({ entries: e })).toBe(e)
    expect(manifestEntries({ downloads: e })).toBe(e)
    expect(manifestEntries(e)).toBe(e)
    expect(manifestEntries({ other: 1 })).toBeNull()
  })
})

describe('LN-6 CONTRADICTED never ships', () => {
  const day = (d: string) => `${d}T12:00:00+00:00`

  it('splits live CONTRADICTED entries into blocking (on/after cutoff) and legacy (before)', () => {
    const r = contradictedFindings('library', [
      { refId: 'PCI-DSS-QRG', identity: 'CONTRADICTED', admittedAt: day('2026-09-17') },
      { refId: 'NEW-DOC', identity: 'CONTRADICTED', admittedAt: day(LINEAGE_CUTOFF) },
      { refId: 'OK-DOC', identity: 'MATCH', admittedAt: day(LINEAGE_CUTOFF) },
    ])
    expect(r.legacy.map((f) => f.message)).toEqual([expect.stringMatching(/^PCI-DSS-QRG:/)])
    expect(r.blocking.map((f) => f.message)).toEqual([expect.stringMatching(/^NEW-DOC:/)])
  })

  it('an entry the door retired (ok:false) is not a finding', () => {
    const r = contradictedFindings('library', [
      { refId: 'RETIRED', identity: 'CONTRADICTED', ok: false, admittedAt: day(LINEAGE_CUTOFF) },
    ])
    expect(r.blocking).toHaveLength(0)
    expect(r.legacy).toHaveLength(0)
  })

  it('an entry with no admittedAt counts as legacy, never silently blocking', () => {
    const r = contradictedFindings('products', [{ refId: 'X', identity: 'CONTRADICTED' }])
    expect(r.legacy).toHaveLength(1)
    expect(r.blocking).toHaveLength(0)
  })
})

describe('LN-2 typed evidence', () => {
  const row = (o: Record<string, string>) => ({ status: 'active', evidence: 'x', ...o })

  it('L2 replay: a verbatim-quote verdict on a rationale row is blocking', () => {
    const r = typedEvidenceFindings(
      'concept_xwalks_09182026.csv',
      [
        row({
          xwalk_id: 'xw-001',
          evidence_kind: 'rationale',
          verified_by: 'lineage:quote-not-found-2026-09-17',
          confidence: 'low',
        }),
      ],
      '2026-09-18'
    )
    expect(r.blocking).toHaveLength(1)
    expect(r.blocking[0].message).toMatch(/category error/)
  })

  it('the same verdict on a quote row is exactly what the check is for', () => {
    const r = typedEvidenceFindings(
      'concept_xwalks_09182026.csv',
      [
        row({
          xwalk_id: 'xw-e1b7b78a',
          evidence_kind: 'quote',
          verified_by: 'lineage:quote-not-found-2026-09-17',
        }),
      ],
      '2026-09-18'
    )
    expect(r.blocking).toHaveLength(0)
  })

  it('an empty or unknown evidence_kind on an active row is blocking; deprecated rows are ignored', () => {
    const r = typedEvidenceFindings(
      'concept_xwalks_09182026.csv',
      [
        row({ xwalk_id: 'a', evidence_kind: '', verified_by: 'ericamador' }),
        row({ xwalk_id: 'b', evidence_kind: 'hunch', verified_by: 'ericamador' }),
        row({ xwalk_id: 'c', evidence_kind: '', verified_by: 'x', status: 'deprecated' }),
      ],
      '2026-09-18'
    )
    expect(r.blocking.map((f) => f.message)).toEqual([
      expect.stringMatching(/^a: evidence_kind must be one of/),
      expect.stringMatching(/^b: evidence_kind must be one of/),
    ])
  })

  it('a generation without the column: legacy before the cutoff, blocking from the cutoff on', () => {
    const rows = [row({ xwalk_id: 'a', verified_by: 'ericamador' })]
    expect(
      typedEvidenceFindings('concept_xwalks_09172026_r2.csv', rows, '2026-09-17').legacy
    ).toHaveLength(1)
    expect(
      typedEvidenceFindings('concept_xwalks_09172026_r2.csv', rows, '2026-09-17').blocking
    ).toHaveLength(0)
    expect(
      typedEvidenceFindings('concept_xwalks_09182026.csv', rows, LINEAGE_CUTOFF).blocking
    ).toHaveLength(1)
  })
})
