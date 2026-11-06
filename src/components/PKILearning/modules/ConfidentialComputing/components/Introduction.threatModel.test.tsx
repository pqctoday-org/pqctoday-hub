// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Introduction } from './Introduction'

function renderIntro() {
  return render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={() => undefined} />
    </MemoryRouter>
  )
}

const openSection = (title: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(title) }))

describe('TEE threat model: the guarantee rests on a trusted layer', () => {
  it('does not promise protection when the TEE vendor firmware itself is compromised', () => {
    const { container } = renderIntro()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/firmware has been fully compromised/i)
    expect(text).not.toMatch(/guarantees confidentiality and integrity/i)
  })

  it('names the trusted layer and the attestation, version-policy and patching response', () => {
    const { container } = renderIntro()
    const text = container.textContent ?? ''
    expect(text).toMatch(/host operating system, hypervisor or host firmware/)
    expect(text).toMatch(/CPU hardware and microcode/)
    expect(text).toMatch(/security firmware/)
    expect(text).toMatch(/guest.s own operating system and application/)
    expect(text).toMatch(/attestation\s+evidence against a version policy/)
    expect(text).toMatch(/patching matters/)
  })

  it('lists a flaw in the trusted layer under what a TEE does not protect against', () => {
    renderIntro()
    expect(screen.getByText(/Flaws in the trusted layer itself/)).toBeInTheDocument()
  })
})

describe('sealing keys: upgrade behaviour depends on the sealing policy', () => {
  it('does not say every enclave version change loses sealed data', () => {
    const { container } = renderIntro()
    openSection('Memory Encryption')
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/different enclave\s+version\), the derived sealing key changes/)
    expect(text).not.toMatch(/inaccessible without a migration protocol/)
  })

  it('contrasts a code-measurement policy with a signer policy and the version numbers', () => {
    const { container } = renderIntro()
    openSection('Memory Encryption')
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/code measurement \(MRENCLAVE\) ties the key to one exact build/)
    expect(text).toMatch(/signer \(MRSIGNER plus the product ID\) lets a later version/)
    expect(text).toMatch(/security update can unseal older data/)
    expect(text).toMatch(/higher version than the enclave or platform has cannot be unsealed/)
    expect(text).toMatch(/different physical platform is a separate design requirement/)
  })

  it('tells the integrity column apart by kind', () => {
    const { container } = renderIntro()
    openSection('Memory Encryption')
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/Integrity \/ Ownership Checks/)
    expect(text).toMatch(/SEV-SNP only: hardware ownership checks \(RMP\), not cryptographic/)
    expect(text).toMatch(/is access control: it decides who may write a page/)
  })
})

describe('attestation overview', () => {
  it('does not say every flow signs with an ECDSA curve when the Arm token profile leaves it open', () => {
    const { container } = renderIntro()
    openSection('Remote Attestation')
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).not.toMatch(/Every current attestation implementation/)
    expect(text).toMatch(/Arm.s CCA token profile leaves the signing algorithm open/)
    expect(text).toMatch(/signing key belongs to a platform component, not to the enclave/)
  })
})
