// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  EVIDENCE_MANIFEST,
  validateRecord,
  validationsFor,
  type EvidenceRecord,
} from './fheEvidence'
import { evidencePanelModel, formatEvidenceDate } from './fheEvidencePanel'

const HEX = (c: string) => c.repeat(64)

const record = (over: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  id: 'panel-fixture',
  scenarioId: 'tfhe-single-hsm',
  stepIds: ['compute-with-pbs'],
  level: 'device',
  parts: [
    {
      device: 'kv260',
      role: 'fhe-server',
      producer: 'pqctoday-fhe',
      claimScope: 'board-untrusted-compute',
      stepIds: ['compute-with-pbs'],
    },
  ],
  library: { name: 'TFHE-rs', version: '1.8.1', commit: '187fc0b95a' },
  parameters: 'V1_4_PARAM_MESSAGE_2_CARRY_2_KS_PBS_TUNIFORM_2M128',
  config: 'default',
  parameterHash: HEX('a'),
  environment: { hardware: 'lab', os: 'mixed', toolchain: 'rustc 1.90', features: 'default' },
  method: {
    warmup: 0,
    samples: 3,
    distribution: 'median of 3 per op',
    peakMemoryMethod: 'cgroup peak (203.0M)',
  },
  result: 'pass',
  status: 'measured',
  artifacts: [
    { name: 'RESULT.md', sha256: HEX('b'), url: 'https://example.org/RESULT.md' },
    { name: 'server.json', sha256: HEX('c'), url: 'https://example.org/server.json' },
  ],
  measuredAt: '2026-10-03T22:24:00Z',
  ...over,
})

const withSummary = record({
  summary: {
    headline: 'FHE server on the KV260: 6 of 6 results correct, 3 of 3 tampered keys refused.',
    keyNumbers: [
      { label: 'Server key check', value: '298', unit: 'ms' },
      { label: 'Results correct', value: '6/6' },
    ],
  },
})

describe('evidencePanelModel', () => {
  it('with a summary: headline first, key numbers with their units', () => {
    const m = evidencePanelModel(withSummary)
    expect(m.headline).toMatch(/^FHE server on the KV260: 6 of 6/)
    expect(m.keyNumbers).toEqual([
      { label: 'Server key check', value: '298 ms' },
      { label: 'Results correct', value: '6/6' },
    ])
  })

  it('without a summary: no headline or numbers, but every structured fact is there', () => {
    const m = evidencePanelModel(record())
    expect(m.headline).toBeNull()
    expect(m.keyNumbers).toEqual([])
    const facts = Object.fromEntries(m.facts.map((f) => [f.label, f.value]))
    expect(facts['Devices and roles']).toBe('KV260: FHE server (untrusted compute)')
    expect(facts.Result).toBe('Passed')
    expect(facts['Evidence level']).toBe('Measured')
    expect(facts.Date).toBe('3 Oct 2026')
    expect(facts['What it claims']).toBe('Board as untrusted compute (keys held in software)')
    expect(m.method).toBe('3 samples (median of 3 per op). Peak memory: cgroup peak (203.0M).')
  })

  it('names the failover custodian and the software token, never hardware custody', () => {
    const m = evidencePanelModel(
      record({
        parts: [
          {
            device: 'mx95-pro',
            role: 'custodian',
            producer: 'pqctoday-hsm',
            claimScope: 'board-software-token',
            failover: true,
            engine: { repo: 'pqctoday-org/pqctoday-hsm', commit: 'a0a60b69' },
            stepIds: ['compute-with-pbs'],
          },
        ],
      })
    )
    const text = m.facts.map((f) => f.value).join('\n')
    expect(text).toContain('MX95 Pro: custodian after failover, software token')
    expect(text).toContain('Software token on a board')
    expect(text).not.toMatch(/hardware custody|hsm-validated/i)
  })

  it('raw files: the first artifact leads, all of them are listed', () => {
    const m = evidencePanelModel(withSummary)
    expect(m.primaryFile.name).toBe('RESULT.md')
    expect(m.files.map((f) => f.name)).toEqual(['RESULT.md', 'server.json'])
  })

  it('formats a date-only or timestamp value in UTC', () => {
    expect(formatEvidenceDate('2026-10-03')).toBe('3 Oct 2026')
    expect(formatEvidenceDate('2026-10-03T23:59:00Z')).toBe('3 Oct 2026')
    expect(formatEvidenceDate('not a date')).toBe('not a date')
  })
})

describe('summary validation', () => {
  it('accepts a record with a good summary and one without', () => {
    expect(validateRecord(withSummary)).toEqual([])
    expect(validateRecord(record())).toEqual([])
  })

  it.each([
    ['an empty headline', { headline: ' ', keyNumbers: [] }],
    ['a row with no value', { headline: 'x', keyNumbers: [{ label: 'a', value: '' }] }],
    ['a numeric value', { headline: 'x', keyNumbers: [{ label: 'a', value: 5 as never }] }],
    [
      'more than 12 rows',
      {
        headline: 'x',
        keyNumbers: Array.from({ length: 13 }, (_, i) => ({ label: `k${i}`, value: '1' })),
      },
    ],
  ])('rejects %s, so the badge is not raised', (_n, summary) => {
    expect(validateRecord(record({ summary })).length).toBeGreaterThan(0)
    expect(validationsFor('tfhe-single-hsm', 'compute-with-pbs', [record({ summary })])).toEqual([])
  })
})

describe('the real manifest', () => {
  const records = EVIDENCE_MANIFEST.records

  it('every record builds a panel', () => {
    for (const r of records) {
      const m = evidencePanelModel(r)
      expect(m.files.length).toBeGreaterThan(0)
      expect(m.facts.length).toBeGreaterThan(3)
    }
  })

  it('summary text, where present, keeps the wording and privacy rules', () => {
    for (const r of records) {
      if (!r.summary) continue
      const text = [r.summary.headline, ...r.summary.keyNumbers.flatMap((k) => [k.label, k.value])]
        .join('\n')
        .toLowerCase()
      expect(text, r.id).not.toMatch(/hsm-validated|hardware custody/)
      // Board host names and local paths never reach the page.
      expect(text, r.id).not.toMatch(/\.local\b|\/users\/|\/home\//)
    }
  })
})
