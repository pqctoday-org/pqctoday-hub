// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AmdSnpReportVerifier } from './AmdSnpReportVerifier'
import { AttestationWorkshop } from './AttestationWorkshop'

// The algorithm-check panel needs an HSM engine; the page tests only need the specs it is given.
vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: ({
    specs,
    label,
    authorityNote,
  }: {
    specs: { id: string; useCase: string; standard: string; message?: string }[]
    label: string
    authorityNote: string
  }) => (
    <div data-testid="kat-panel">
      <div>{label}</div>
      <div>{authorityNote}</div>
      {specs.map((s) => (
        <div key={s.id} data-testid={`kat-${s.id}`}>
          {s.useCase} | {s.standard} | {s.message ?? ''}
        </div>
      ))}
    </div>
  ),
}))

const status = (id: string) => screen.getByTestId(`amd-check-${id}`).textContent ?? ''
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }))

describe('AMD SEV-SNP report verifier panel', () => {
  it('says plainly that the report is a recorded sample and that AMD signs with ECDSA', () => {
    render(<AmdSnpReportVerifier />)
    const d = screen.getByTestId('amd-sample-disclosure').textContent ?? ''
    expect(d).toMatch(/recorded AMD SEV-SNP report from the open-source project/)
    expect(d).toMatch(/google\/go-sev-guest/)
    expect(d).toMatch(/Apache-2\.0/)
    expect(d).toMatch(/not a fresh value issued by this page/)
    expect(d).toMatch(/ECDSA P-384/)
    expect(d).toMatch(/Nothing in this real evidence is ML-DSA or ML-KEM/)
    const n = screen.getByTestId('amd-not-appraised').textContent ?? ''
    expect(n).toMatch(/allows debugging/)
    expect(n).toMatch(/revocation lists/)
    expect(d).toMatch(/valid until\s+2029-09-24/)
  })

  it('runs six separate real checks and passes them on the recorded report', async () => {
    render(<AmdSnpReportVerifier />)
    click(/Appraise recorded report/)
    await screen.findByTestId('amd-snp-result')
    for (const id of [
      'chain',
      'validity',
      'vcek-binding',
      'signature',
      'measurement',
      'challenge',
    ]) {
      expect(status(id), id).toMatch(/PASS/)
    }
    expect(screen.getByTestId('amd-overall')).toHaveTextContent('All six real checks passed.')
  })

  it('rejects the second presentation of the same challenge as a replay', async () => {
    render(<AmdSnpReportVerifier />)
    click(/Appraise recorded report/)
    await waitFor(() => expect(status('challenge')).toMatch(/PASS/))
    click(/Appraise recorded report/)
    await waitFor(() => expect(status('challenge')).toMatch(/FAIL/))
    expect(status('challenge')).toMatch(/replay/)
    expect(status('signature')).toMatch(/PASS/)
    click(/Reset verifier/)
    expect(screen.queryByTestId('amd-snp-result')).toBeNull()
  })

  it('a flipped bit fails the signature check and a different pinned measurement fails only that check', async () => {
    render(<AmdSnpReportVerifier />)
    click(/Flip one bit/)
    await waitFor(() => expect(status('signature')).toMatch(/FAIL/))
    expect(status('measurement')).toMatch(/PASS/)
    expect(status('challenge')).toMatch(/PASS/)
    click(/Pin a different measurement/)
    await waitFor(() => expect(status('measurement')).toMatch(/FAIL/))
    expect(status('signature')).toMatch(/PASS/)
    expect(status('chain')).toMatch(/PASS/)
  })

  it('labels the binding step as simulated and shows pass, wrong key and different ciphertext', async () => {
    render(<AmdSnpReportVerifier />)
    expect(screen.getByTestId('amd-binding-label')).toHaveTextContent(
      "simulated: a recorded report cannot carry this page's key"
    )
    expect(screen.getByTestId('amd-gate-pending')).toBeInTheDocument()
    click(/Run simulated binding step/)
    const out = await screen.findByTestId('amd-binding-result')
    const row = (key: string, id: string) =>
      within(out).getByTestId(`binding-${key}-${id}`).textContent ?? ''
    expect(row('right', 'key-binding')).toMatch(/PASS/)
    expect(row('right', 'ciphertext-binding')).toMatch(/PASS/)
    expect(row('wrong-key', 'key-binding')).toMatch(/FAIL/)
    expect(row('swapped-ciphertext', 'ciphertext-binding')).toMatch(/FAIL/)
    expect(row('swapped-ciphertext', 'key-binding')).toMatch(/PASS/)
  })

  it('opens the key-transport gate only when the real checks and the binding checks all passed', async () => {
    render(<AmdSnpReportVerifier />)
    click(/Run simulated binding step/)
    click(/Appraise recorded report/)
    await waitFor(() => expect(screen.getByTestId('amd-gate')).toHaveTextContent('OPEN'))
    click(/Appraise recorded report/)
    await waitFor(() => expect(screen.getByTestId('amd-gate')).toHaveTextContent('CLOSED'))
    expect(screen.getByTestId('amd-gate')).toHaveTextContent('failed: challenge')
  })
})

describe('Attestation workshop labels', () => {
  it('describes the four algorithm checks by what they run', () => {
    render(<AttestationWorkshop />)
    const kat = screen.getByTestId('kat-panel').textContent ?? ''
    expect(kat).not.toMatch(/TEE attestation quote signing/)
    expect(kat).not.toMatch(/Enclave measurement integrity/)
    expect(kat).not.toMatch(/Enclave sealing key wrap/)
    expect(kat).not.toMatch(/TCG DICE \+/)
    expect(screen.getByTestId('kat-cc-attestation-sign')).toHaveTextContent(
      'ML-DSA-65 sign and verify of a sample text message (not a quote) | FIPS 204'
    )
    expect(screen.getByTestId('kat-cc-enclave-kem')).toHaveTextContent(
      'ML-KEM-768 encapsulate and decapsulate round trip (not enclave provisioning)'
    )
    expect(screen.getByTestId('kat-cc-measurement-hash')).toHaveTextContent(
      'SHA-256 digest of an ACVP test vector (not an enclave measurement)'
    )
    expect(screen.getByTestId('kat-cc-sealing-kwp')).toHaveTextContent(
      'AES-KWP wrap and unwrap of a generic secret (not hardware sealing)'
    )
    expect(kat).toMatch(/do not parse a quote, verify a certificate chain, run TCG DICE or seal/)
    expect(screen.getByTestId('amd-snp-verifier')).toBeInTheDocument()
  })
})
