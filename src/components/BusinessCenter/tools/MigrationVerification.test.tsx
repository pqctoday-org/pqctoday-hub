// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

describe('evidence field completeness', () => {
  it('counts filled evidence fields', () => {
    expect(verifiedCount(record(0))).toBe(0)
    expect(verifiedCount(record(3))).toBe(3)
    expect(verifiedCount(record(5))).toBe(5)
  })

  it('requires every reference before recording evidence as complete', () => {
    expect(isVerified(record(4))).toBe(false)
    expect(isVerified(record(5))).toBe(true)
  })
})

describe('decommissioning TNFL flag', () => {
  const row = (
    kind: DecommissionRow['kind'],
    confirmed: boolean,
    trustWithdrawn?: boolean
  ): DecommissionRow => ({
    id: 'd',
    material: 'root CA key',
    kind,
    retiredDate: '',
    owner: '',
    method: 'SP 800-88 purge',
    confirmed,
    trustWithdrawn,
  })
  it('flags a signing-key retirement as a TNFL liability until trust is withdrawn', () => {
    expect(isTnflLiability(row('signing-key', false))).toBe(true)
    expect(isTnflLiability(row('signing-key', false, false))).toBe(true)
  })
  it('does not clear the flag when the private key is destroyed but verifiers still trust it', () => {
    expect(isTnflLiability(row('signing-key', true))).toBe(true)
    expect(isTnflLiability(row('signing-key', true, false))).toBe(true)
  })
  it('clears the flag once verifier trust is withdrawn, whether or not destruction is confirmed', () => {
    expect(isTnflLiability(row('signing-key', false, true))).toBe(false)
    expect(isTnflLiability(row('signing-key', true, true))).toBe(false)
  })
  it('does not flag non-signing material', () => {
    expect(isTnflLiability(row('certificate', false))).toBe(false)
    expect(isTnflLiability(row('kek', true))).toBe(false)
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

  it('exports field completeness without claiming technical verification', () => {
    const md = buildMarkdown(state)
    expect(md).toContain('## Verification records')
    expect(md).toContain('## Decommissioning log')
    expect(md).toContain('## Closure decision record')
    expect(md).toContain('## BAU handover register')
    expect(md).toContain('**Evidence recorded — review required**')
    expect(md).not.toContain('**Verified**')
    expect(md).toContain('does not evaluate evidence or verify a deployment')
    expect(md).toContain('Incomplete evidence (2/5)')
    expect(md).toContain('⚠ TNFL liability') // unconfirmed retirement declaration
    expect(md).toContain(
      'Destroying a retired signing private key does not prevent quantum forgery'
    )
    expect(md).toContain('while verifiers still trust its vulnerable public key')
    expect(md).not.toContain('liability — destroy per')
    expect(md).toContain('| Destruction confirmed | Verifier trust withdrawn |')
  })

  it('keeps the TNFL warning in the export when the key is destroyed but trust is not withdrawn', () => {
    const destroyed: VerifyState = {
      ...state,
      decommissions: [{ ...state.decommissions[0], confirmed: true }],
    }
    const md = buildMarkdown(destroyed)
    expect(md).toMatch(/\| ✓ \| ⚠ TNFL liability \|/)
    const withdrawn: VerifyState = {
      ...state,
      decommissions: [{ ...state.decommissions[0], confirmed: true, trustWithdrawn: true }],
    }
    const clean = buildMarkdown(withdrawn)
    expect(clean).toMatch(/\| ✓ \| ✓ \|/)
    expect(clean).not.toContain('⚠ TNFL liability')
  })
})

describe('MigrationVerification (render smoke)', () => {
  it('renders the sections and evidence-completeness counter', () => {
    const { container } = render(<MigrationVerification />)
    expect(container.textContent).not.toContain('Prove migration with the 5-point')
    expect(container.textContent).toContain('Evidence recorded — review required. Filling')
    expect(container.textContent).not.toContain('the evidence that migration actually happened')
    expect(container.textContent).toContain('as educational drafts')
    expect(container.textContent).toContain(
      'does not establish that a migration or retirement was performed'
    )
    expect(container.textContent).toContain(
      'Destroying a retired signing private key does not prevent quantum forgery'
    )
    expect(screen.getByRole('link', { name: 'NCSC PQC migration guidance' })).toHaveAttribute(
      'href',
      'https://www.ncsc.gov.uk/guidance/pqc-migration-timelines'
    )
    expect(
      screen.getByRole('heading', { name: /Migration Verification & Program Closure/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Verification records.*evidence complete/ })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/It does not test the system or evaluate the evidence/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Verified', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Decommissioning log/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Closure & BAU handover/ })).toBeInTheDocument()
  })

  it('confirming destruction does not clear the TNFL flag; withdrawing trust does', () => {
    const { container } = render(<MigrationVerification />)
    expect(container.textContent).toContain('⚠ TNFL: verifiers still trust it')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Destruction confirmed' }))
    expect(container.textContent).toContain('destruction confirmed')
    expect(container.textContent).toContain('⚠ TNFL: verifiers still trust it')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Verifier trust withdrawn' }))
    expect(container.textContent).not.toContain('⚠ TNFL: verifiers still trust it')
    expect(container.textContent).toContain('trust withdrawn')
  })
})
