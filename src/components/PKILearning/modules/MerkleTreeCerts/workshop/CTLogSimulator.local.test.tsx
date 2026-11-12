// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { AsnSerializer } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo, AlgorithmIdentifier } from '@peculiar/asn1-x509'
import type { CertLeaf } from '../utils/merkleTree'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CTLogSimulator } from './CTLogSimulator'
import { hsm_verifyBytes } from '@/wasm/softhsm'

const engine = vi.hoisted(() => ({ ready: false, module: {} }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: engine.ready,
    moduleRef: { current: engine.ready ? engine.module : null },
    hSessionRef: { current: 1 },
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/wasm/softhsm', () => ({ hsm_verifyBytes: vi.fn() }))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  engine.ready = false
  vi.clearAllMocks()
})
describe('CT unsigned sample batches', () => {
  it('keeps a batch unsigned after the engine becomes ready, without a false audit pass', async () => {
    const view = render(<CTLogSimulator />)
    fireEvent.click(screen.getByRole('button', { name: 'Load 5 samples' }))
    expect(await screen.findByText(/Unsigned sample tree head/)).toBeInTheDocument()
    expect(screen.getByText('No CA signature created')).toBeInTheDocument()
    engine.ready = true
    view.rerender(<CTLogSimulator />)
    fireEvent.click(screen.getByRole('button', { name: '3. Misissuance Audit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Re-audit Batch' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'signature authentication is incomplete (unsigned)'
    )
    expect(screen.queryByText('Audit Passed')).not.toBeInTheDocument()
    expect(hsm_verifyBytes).not.toHaveBeenCalled()
  })
})

// Controlled public SPKI fixtures for rendering/consistency checks, not generated-key evidence.
function publicFixture(cert: CertLeaf): CertLeaf {
  const profiles = [
    ['ML-DSA-44', '2.16.840.1.101.3.4.3.17'],
    ['ML-DSA-65', '2.16.840.1.101.3.4.3.18'],
    ['ML-DSA-87', '2.16.840.1.101.3.4.3.19'],
    ['SLH-DSA-128s', '2.16.840.1.101.3.4.3.20'],
  ]
  const profile = profiles.find((p) => p[0] === cert.algorithm)
  if (!profile) throw new Error('Unsupported controlled fixture profile')
  const spki = new SubjectPublicKeyInfo({
    algorithm: new AlgorithmIdentifier({ algorithm: profile[1] }),
    subjectPublicKey: new Uint8Array(cert.publicKeySize).fill(cert.id + 1).buffer,
  })
  const der = new Uint8Array(AsnSerializer.serialize(spki))
  return {
    ...cert,
    publicKeySpki: Buffer.from(der).toString('base64'),
    publicKeyDigest: createHash('sha256').update(der).digest('hex'),
  }
}

vi.mock('../utils/subjectKeys', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/subjectKeys')>()),
  bindSubjectKeys: async (certs: CertLeaf[]) =>
    certs.map((c) => (c.publicKeySpki ? c : publicFixture(c))),
}))
