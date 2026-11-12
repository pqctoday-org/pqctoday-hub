// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { AsnSerializer } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo, AlgorithmIdentifier } from '@peculiar/asn1-x509'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MerkleTreeBuilder } from './MerkleTreeBuilder'
import { InclusionProofGenerator } from './InclusionProofGenerator'
import { ProofVerifier } from './ProofVerifier'
import { CTLogSimulator } from './CTLogSimulator'
import { hsm_signBytesMLDSA } from '@/wasm/softhsm'
import { bindSubjectKeys, generateSubjectKey } from '../utils/subjectKeys'
import {
  buildMerkleTree,
  exportSubjectProof,
  getInclusionProof,
  type CertLeaf,
} from '../utils/merkleTree'
const control = vi.hoisted(() => ({
  nonce: 1,
  pending: null as Promise<CertLeaf[]> | null,
  fail: false,
  pendingAudit: null as Promise<
    import('../utils/batchVerification').BatchVerificationResult
  > | null,
  auditCalls: 0,
  engineReady: false,
  engineSession: 1,
  engineModule: {} as object,
}))
const meta: CertLeaf = {
  id: 1,
  subject: 'fictional.example',
  issuer: 'Sample CA',
  algorithm: 'ML-DSA-44',
  publicKeySize: 1312,
  notBefore: '2026-01-01',
  notAfter: '2026-03-01',
}
// Controlled public-format fixture; actual generated-key behavior is tested with bundled WASM separately.
function fixture(cert: CertLeaf): CertLeaf {
  const oid =
    cert.algorithm === 'ML-DSA-44'
      ? '2.16.840.1.101.3.4.3.17'
      : cert.algorithm === 'ML-DSA-65'
        ? '2.16.840.1.101.3.4.3.18'
        : cert.algorithm === 'ML-DSA-87'
          ? '2.16.840.1.101.3.4.3.19'
          : '2.16.840.1.101.3.4.3.20'
  const der = new Uint8Array(
    AsnSerializer.serialize(
      new SubjectPublicKeyInfo({
        algorithm: new AlgorithmIdentifier({ algorithm: oid }),
        subjectPublicKey: new Uint8Array(cert.publicKeySize).fill(control.nonce++).buffer,
      })
    )
  )
  return {
    ...cert,
    publicKeySpki: Buffer.from(der).toString('base64'),
    publicKeyDigest: createHash('sha256').update(der).digest('hex'),
  }
}
vi.mock('../utils/subjectKeys', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/subjectKeys')>()),
  bindSubjectKeys: vi.fn(async (certs: CertLeaf[]) => {
    if (control.fail) throw new Error('controlled subject generation error')
    if (control.pending) return control.pending
    return certs.map((c) => (c.publicKeySpki ? c : fixture(c)))
  }),
  generateSubjectKey: vi.fn(async (cert: CertLeaf) => fixture(cert)),
}))
vi.mock('../utils/batchVerification', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/batchVerification')>()
  return {
    ...actual,
    verifySampleBatch: vi.fn(async (...args: Parameters<typeof actual.verifySampleBatch>) => {
      control.auditCalls += 1
      return control.pendingAudit ?? actual.verifySampleBatch(...args)
    }),
  }
})
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: control.engineReady,
    moduleRef: { current: control.engineReady ? control.engineModule : null },
    hSessionRef: { current: control.engineSession },
    registerKey: vi.fn(),
    keys: [],
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateMLDSAKeyPair: vi.fn(() => ({ pubHandle: 100, privHandle: 101 })),
  hsm_extractKeyValue: vi.fn(() => new Uint8Array([1])),
  hsm_signBytesMLDSA: vi.fn(() => new Uint8Array([7])),
  hsm_verifyBytes: vi.fn(() => true),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  control.nonce = 1
  control.pending = null
  control.fail = false
  control.pendingAudit = null
  control.auditCalls = 0
  control.engineReady = false
  control.engineSession = 1
  control.engineModule = {}
  vi.clearAllMocks()
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
})
describe('subject-bound workshop state and public proof receiver', () => {
  it('retains generated subject keys on rebuild and invalidates the shared tree before replacing a same-size key', async () => {
    const built = vi.fn(),
      invalidated = vi.fn()
    render(<MerkleTreeBuilder onTreeBuilt={built} onTreeInvalidated={invalidated} />)
    fireEvent.click(screen.getByRole('button', { name: 'Instant' }))
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(1))
    const original = built.mock.calls[0][1] as CertLeaf[],
      root = built.mock.calls[0][0].at(-1)[0].hash
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(2))
    expect(built.mock.calls[1][1]).toEqual(original)
    fireEvent.click(
      screen.getByRole('button', { name: `Replace public key for ${original[0].subject}` })
    )
    await waitFor(() => expect(generateSubjectKey).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Computed Root Hash — Unsigned')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Build Merkle Tree/ })).not.toBeDisabled()
    )
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(3))
    expect(built.mock.calls[2][1][0].publicKeyDigest).not.toBe(original[0].publicKeyDigest)
    expect(built.mock.calls[2][0].at(-1)[0].hash).not.toBe(root)
    expect(invalidated).toHaveBeenCalled()
  })
  it('allocates a unique ID after remove/add and replacement preserves every other leaf', async () => {
    const built = vi.fn()
    render(<MerkleTreeBuilder onTreeBuilt={built} />)
    fireEvent.click(screen.getByRole('button', { name: 'Instant' }))
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(1))
    const initial = built.mock.calls[0][1] as CertLeaf[]
    fireEvent.click(screen.getByRole('button', { name: `Remove ${initial[1].subject}` }))
    fireEvent.change(screen.getByLabelText('Subject CN'), { target: { value: 'added.example' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(2))
    const before = built.mock.calls[1][1] as CertLeaf[]
    expect(new Set(before.map((c) => c.id)).size).toBe(before.length)
    expect(before.at(-1)?.id).toBe(Math.max(...initial.map((c) => c.id)) + 1)
    const target = before[2]
    fireEvent.click(
      screen.getByRole('button', { name: `Replace public key for ${target.subject}` })
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Build Merkle Tree/ })).not.toBeDisabled()
    )
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(3))
    const after = built.mock.calls[2][1] as CertLeaf[]
    expect(after.filter((c) => c.id !== target.id)).toEqual(
      before.filter((c) => c.id !== target.id)
    )
    expect(after[2].subject).toBe(target.subject)
    expect(after[2].publicKeyDigest).not.toBe(target.publicKeyDigest)
  })
  it('targets only the captured leaf even if incoming records already have duplicate IDs', async () => {
    const left = fixture({ ...meta, id: 4, subject: 'left.example' })
    const right = fixture({ ...meta, id: 4, subject: 'right.example' })
    const built = vi.fn()
    render(<MerkleTreeBuilder initialCerts={[left, right]} onTreeBuilt={built} />)
    fireEvent.click(screen.getByRole('button', { name: 'Instant' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replace public key for left.example' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Build Merkle Tree/ })).not.toBeDisabled()
    )
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(1))
    expect(built.mock.calls[0][1][1]).toEqual(right)
    expect(built.mock.calls[0][1][0].subject).toBe(left.subject)
    expect(built.mock.calls[0][1][0].publicKeyDigest).not.toBe(left.publicKeyDigest)
  })
  it('shows actual generation failure as incomplete and permits retry without publishing a tree', async () => {
    control.fail = true
    const built = vi.fn()
    render(<MerkleTreeBuilder onTreeBuilt={built} />)
    fireEvent.click(screen.getByRole('button', { name: 'Instant' }))
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incomplete')
    expect(built).not.toHaveBeenCalled()
    control.fail = false
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    await waitFor(() => expect(built).toHaveBeenCalledTimes(1))
  })
  it('does not publish late subject generation after unmount or start a duplicate request', async () => {
    let resolve!: (c: CertLeaf[]) => void
    control.pending = new Promise((r) => {
      resolve = r
    })
    const built = vi.fn()
    const view = render(<MerkleTreeBuilder onTreeBuilt={built} />)
    const build = screen.getByRole('button', { name: /Build Merkle Tree/ })
    fireEvent.click(build)
    fireEvent.click(build)
    expect(bindSubjectKeys).toHaveBeenCalledTimes(1)
    view.unmount()
    resolve([fixture(meta), fixture({ ...meta, id: 2 })])
    await Promise.resolve()
    expect(built).not.toHaveBeenCalled()
  })
  it('successfully submits the first actual bound subject record instead of duplicating unbound metadata', async () => {
    render(<CTLogSimulator />)
    fireEvent.change(screen.getByLabelText('Domain / Subject CN'), {
      target: { value: 'fictional.example' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText(/Unsigned sample tree head.*1 cert/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(bindSubjectKeys).toHaveBeenCalledTimes(1)
  })
  it('retains first unsigned submission across irrelevant HSM readiness/module/session initialization', async () => {
    let finish!: (certs: CertLeaf[]) => void
    control.pending = new Promise((resolve) => {
      finish = resolve
    })
    const view = render(<CTLogSimulator />)
    fireEvent.change(screen.getByLabelText('Domain / Subject CN'), {
      target: { value: 'initializing.example' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const submitted = vi.mocked(bindSubjectKeys).mock.calls[0][0][0]
    control.engineReady = true
    control.engineSession = 42
    control.engineModule = {}
    view.rerender(<CTLogSimulator />)
    finish([fixture(submitted)])
    expect(await screen.findByText(/Unsigned sample tree head.*1 cert/)).toBeInTheDocument()
    expect(screen.getByText('No CA signature created')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(hsm_signBytesMLDSA).not.toHaveBeenCalled()
  })
  it('withholds publication and requires retry after the actual selected CA session changes', async () => {
    control.engineReady = true
    const view = render(<CTLogSimulator />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate ML-DSA-65 CA Key' }))
    await screen.findByText(/ML-DSA-65 CA key ready/)
    let finish!: (certs: CertLeaf[]) => void
    control.pending = new Promise((resolve) => {
      finish = resolve
    })
    fireEvent.change(screen.getByLabelText('Domain / Subject CN'), {
      target: { value: 'changed-context.example' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const submitted = vi.mocked(bindSubjectKeys).mock.calls[0][0][0]
    control.engineSession = 2
    view.rerender(<CTLogSimulator />)
    finish([fixture(submitted)])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'selected CA signing context changed'
    )
    expect(screen.queryByText(/Signed Tree Head \(STH\)/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unsigned sample tree head/)).not.toBeInTheDocument()
    expect(hsm_signBytesMLDSA).not.toHaveBeenCalled()
  })
  it.each(['edit', 'restore'] as const)(
    'invalidates a pending audit after a committed local %s',
    async (action) => {
      render(<CTLogSimulator />)
      fireEvent.click(screen.getByRole('button', { name: 'Load 5 samples' }))
      await screen.findByText(/Unsigned sample tree head/)
      fireEvent.click(screen.getByRole('button', { name: '3. Misissuance Audit' }))
      const edit = () => fireEvent.click(screen.getAllByTitle('Edit to simulate misissuance')[0])
      const commit = (value: string) => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value } })
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
      }
      if (action === 'restore') {
        edit()
        commit('initial-change.example')
      }
      let finish!: (value: import('../utils/batchVerification').BatchVerificationResult) => void
      control.pendingAudit = new Promise((resolve) => {
        finish = resolve
      })
      fireEvent.click(screen.getByRole('button', { name: 'Re-audit Batch' }))
      await waitFor(() => expect(control.auditCalls).toBe(1))
      if (action === 'edit') {
        edit()
        commit('later-change.example')
      } else fireEvent.click(screen.getByRole('button', { name: 'Restore all' }))
      finish({
        valid: true,
        computedRoot: 'controlled-old-result',
        rootMatches: true,
        signatureState: 'valid',
      })
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Re-audit Batch' })).not.toBeDisabled()
      )
      expect(screen.queryByText('Audit Passed')).not.toBeInTheDocument()
      expect(screen.queryByText('Audit Failed')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    }
  )
  it('copies a version1 actual-public-leaf envelope and receiver rejects the same-size changed key', async () => {
    const leaves = [fixture(meta), fixture({ ...meta, id: 2 })],
      tree = await buildMerkleTree(leaves)
    const view = render(<InclusionProofGenerator sharedCerts={leaves} sharedLevels={tree.levels} />)
    fireEvent.click(screen.getByRole('button', { name: /Cert 1/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1))
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    const envelope = JSON.parse(copied)
    expect(envelope.leaf.publicKeySpki).toBe(leaves[0].publicKeySpki)
    expect(envelope.version).toBe(1)
    view.unmount()
    render(<ProofVerifier />)
    const input = screen.getByLabelText('Copied version1 public proof envelope')
    fireEvent.change(input, { target: { value: copied } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify copied public proof' }))
    expect(await screen.findByRole('status')).toHaveTextContent('leaf/key hash and path match')
    fireEvent.change(input, {
      target: { value: JSON.stringify({ ...envelope, leaf: fixture(leaves[0]) }) },
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Verify copied public proof' }))
    expect(await screen.findByRole('status')).toHaveTextContent('verification failed')
  })
  it('rejects an old hash-only import and handles committed shared-input replacements without stale proof or TDZ', async () => {
    const leaves = [fixture(meta), fixture({ ...meta, id: 2 })],
      tree = await buildMerkleTree(leaves)
    const view = render(<ProofVerifier sharedLevels={tree.levels} sharedCerts={leaves} />)
    fireEvent.change(screen.getByLabelText('Copied version1 public proof envelope'), {
      target: { value: JSON.stringify(getInclusionProof(tree.levels, 0)) },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify copied public proof' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/rebuild/i)
    const changed = [fixture(meta), fixture({ ...meta, id: 3 })],
      next = await buildMerkleTree(changed)
    expect(() =>
      view.rerender(<ProofVerifier sharedLevels={next.levels} sharedCerts={changed} />)
    ).not.toThrow()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Verification Passed')).not.toBeInTheDocument()
    expect(exportSubjectProof(changed[0], getInclusionProof(next.levels, 0)).proof.root).not.toBe(
      tree.root.hash
    )
  })
})
