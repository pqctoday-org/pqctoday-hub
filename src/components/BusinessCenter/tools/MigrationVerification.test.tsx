// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  MigrationVerification,
  verifiedCount,
  isVerified,
  isTnflLiability,
  buildMarkdown,
  type VerificationRecord,
  type DecommissionRow,
  type VerifyState,
} from './MigrationVerification'

const evidence = (n: number): VerificationRecord['evidence'] => {
  const keys: (keyof VerificationRecord['evidence'])[] = [
    'observedNegotiation',
    'negativeTest',
    'certChainUnderPqc',
    'downgradeDocumented',
    'dossierLink',
  ]
  const out = {
    observedNegotiation: '',
    negativeTest: '',
    certChainUnderPqc: '',
    downgradeDocumented: '',
    dossierLink: '',
  }
  for (let i = 0; i < n; i++) out[keys[i]] = 'ref'
  return out
}
const record = (n: number): VerificationRecord => ({
  id: 'r',
  system: 'TLS',
  evidence: evidence(n),
})

describe('verified gate (5-point evidence standard)', () => {
  it('counts filled evidence fields', () => {
    expect(verifiedCount(record(0))).toBe(0)
    expect(verifiedCount(record(3))).toBe(3)
    expect(verifiedCount(record(5))).toBe(5)
  })

  it('a system is Verified ONLY with all five evidence points', () => {
    expect(isVerified(record(4))).toBe(false)
    expect(isVerified(record(5))).toBe(true)
  })
})

describe('decommissioning TNFL flag', () => {
  const row = (kind: DecommissionRow['kind'], confirmed: boolean): DecommissionRow => ({
    id: 'd',
    material: 'root CA key',
    kind,
    retiredDate: '',
    owner: '',
    method: 'SP 800-88 purge',
    confirmed,
  })
  it('flags an unconfirmed signing-key retirement as a TNFL liability', () => {
    expect(isTnflLiability(row('signing-key', false))).toBe(true)
  })
  it('does not flag a confirmed signing key, nor non-signing material', () => {
    expect(isTnflLiability(row('signing-key', true))).toBe(false)
    expect(isTnflLiability(row('certificate', false))).toBe(false)
  })
})

describe('buildMarkdown', () => {
  const state: VerifyState = {
    records: [
      { id: 'a', system: 'Web TLS', evidence: evidence(5) },
      { id: 'b', system: 'Service mesh', evidence: evidence(2) },
    ],
    decommissions: [
      {
        id: 'd',
        material: 'Root CA key',
        kind: 'signing-key',
        retiredDate: '2030-01-01',
        owner: 'PKI team',
        method: 'SP 800-88 purge',
        confirmed: false,
      },
    ],
    closure: {
      decision: 'Program closed',
      signOffBy: 'CISO',
      signOffDate: '2030-06-01',
      bauOwners: {
        Discovery: 'SecOps',
        CBOM: 'Platform',
        Risk: 'GRC',
        'Vendor governance': 'Procurement',
      },
    },
  }

  it('emits the four deliverables and the verified/unverified + TNFL signals', () => {
    const md = buildMarkdown(state)
    expect(md).toContain('## Verification records')
    expect(md).toContain('## Decommissioning log')
    expect(md).toContain('## Closure decision record')
    expect(md).toContain('## BAU handover register')
    expect(md).toContain('**Verified**') // Web TLS (5/5)
    expect(md).toContain('Unverified (2/5)') // Service mesh
    expect(md).toContain('⚠ TNFL liability') // unconfirmed signing key
  })
})

describe('MigrationVerification (render smoke)', () => {
  it('renders the three sections and the verified counter', () => {
    render(<MigrationVerification />)
    expect(
      screen.getByRole('heading', { name: /Migration Verification & Program Closure/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Verification records/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Decommissioning log/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Closure & BAU handover/ })).toBeInTheDocument()
  })
})
