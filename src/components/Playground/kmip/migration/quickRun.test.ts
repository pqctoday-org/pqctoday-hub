// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildQuickRunSummary, QUICK_RUN_LABEL, type QuickRunRecord } from './quickRun'
import { MIGRATION_KEYS } from './migrationKeys'

const record: QuickRunRecord = {
  label: QUICK_RUN_LABEL,
  message: 'approve release 1.0.0',
  policyBefore: 'migration-classical',
  policyAfter: 'migration-pqc',
  before: {
    uid: 'urn:pqctoday:obj:aaaa',
    algorithm: 'RSA-2048',
    state: 'Active',
    quantumSafe: false,
  },
  signatureBytesBefore: 256,
  after: {
    uid: 'urn:pqctoday:obj:bbbb',
    algorithm: 'ML-DSA-44',
    state: 'Active',
    quantumSafe: true,
  },
  beforeStateAfterRun: 'Deactivated',
  successorLinked: true,
  signatureBytesAfter: 2420,
  verified: true,
  events: ['Sign: rekey'],
  appVersion: '4.161.0',
  buildCommit: null,
  ranAt: '2026-10-16T05:00:00.000Z',
}

describe('quick run summary', () => {
  it('records both keys, the policy change and the signature sizes', () => {
    const md = buildQuickRunSummary(record)
    expect(md).toContain('`migration-classical` → `migration-pqc`')
    expect(md).toContain(
      '| Before (step 1) | `urn:pqctoday:obj:aaaa` | RSA-2048 | Deactivated | no | 256 |'
    )
    expect(md).toContain(
      '| After (step 3) | `urn:pqctoday:obj:bbbb` | ML-DSA-44 | Active | yes | 2420 |'
    )
    expect(md).toContain('Same label, new identifier: yes')
    expect(md).toContain('- Sign: rekey')
  })

  it('always states the execution limits', () => {
    const md = buildQuickRunSummary({ ...record, events: [] })
    expect(md).toContain('not a FIPS 140-3 validated module')
    expect(md).toContain('Committee Specification Draft 02')
    expect(md).toContain('new UniqueIdentifier')
    expect(md).toContain('- (none recorded)')
  })

  it('uses a label the estate cards do not use', () => {
    expect(MIGRATION_KEYS.map((k) => k.defaultLabel)).not.toContain(QUICK_RUN_LABEL)
    expect(QUICK_RUN_LABEL.startsWith('firmware-')).toBe(true)
  })
})
