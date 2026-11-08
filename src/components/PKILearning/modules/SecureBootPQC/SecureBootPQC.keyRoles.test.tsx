// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Secure Boot teaching keeps two questions apart: which keys and hashes the firmware checks a boot
 * image against (db, with dbx forbidding), and which keys may authorize a change to those databases
 * (KEK for db and dbx, PK for the KEK list). It also keeps the interim hybrid attestation sketch
 * honest about what a software key co-signing a nonce can and cannot show.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SecureBootChainAnalyzer } from './workshop/SecureBootChainAnalyzer'
import { AttestationFlowDesigner } from './workshop/AttestationFlowDesigner'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { UEFI_KEY_TYPES, BOOT_CHAIN_STAGES, ATTESTATION_TYPES } from './data/secureBootConstants'

const flat = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

describe('Secure Boot constants: image trust (db) is separate from update authorization (KEK, PK)', () => {
  const stage = BOOT_CHAIN_STAGES.find((s) => s.id === 'uefi-db-check')
  const bootloader = BOOT_CHAIN_STAGES.find((s) => s.id === 'bootloader')
  const kek = UEFI_KEY_TYPES.find((k) => k.id === 'KEK')

  it('describes the db check and the KEK update path as two different things', () => {
    expect(stage?.description).toMatch(/Who may change db is a separate question/)
    expect(stage?.description).toMatch(/updates to db and dbx must be signed by an enrolled KEK/)
    expect(stage?.description).toMatch(/two different PQC migration surfaces/)
    expect(stage?.description).not.toMatch(
      /PK authorizes KEK, KEK authorizes db updates, db contains/
    )
    expect(kek?.description).toMatch(/not what boot images are checked against/)
  })

  it('does not say shim is signed by a KEK, or commit to a shim release number', () => {
    expect(bootloader?.description).not.toMatch(/signed by Microsoft KEK/)
    expect(bootloader?.description).toMatch(/a KEK does not sign images/)
    expect(bootloader?.pqcStatus).not.toMatch(/Microsoft KEK migration/)
    expect(bootloader?.pqcStatus).toMatch(/16\.1 \(13 August 2025\)/)
  })
})

describe('Secure Boot Chain Analyzer: per-key findings', () => {
  const openKey = (id: string): string => {
    render(
      <MemoryRouter>
        <SecureBootChainAnalyzer />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Analyze PQC Requirements/ }))
    const info = UEFI_KEY_TYPES.find((k) => k.id === id)
    const btn = screen
      .getAllByRole('button')
      .find((b) => flat(b.textContent).includes(info?.fullName ?? '#'))
    fireEvent.click(btn as HTMLElement)
    return flat(document.body.textContent)
  }

  it('makes the KEK finding about update authorization, not image verification', () => {
    const text = openKey('KEK')
    expect(text).toMatch(/The KEK does not verify boot images; it authorizes updates to db and dbx/)
    expect(text).not.toMatch(/Microsoft, Red Hat, Canonical\) must issue PQC KEK/)
  })

  it('makes the db finding about image-signing certificates and separates it from the KEK', () => {
    const text = openKey('db')
    expect(text).toMatch(/certificates in db that verify bootloader signatures use RSA-2048/)
    expect(text).toMatch(/separate from the KEK that authorizes db updates/)
  })

  it('does not commit the MOK plan to a shim release number', () => {
    const text = openKey('MOK')
    expect(text).not.toMatch(/shim 16\.0\+/)
    expect(text).not.toMatch(/Microsoft KEK migration/)
    expect(text).toMatch(/No shim release note up to 16\.1/)
  })
})

describe('Attestation: a software co-signature does not make TPM attestation quantum-safe', () => {
  const quote = ATTESTATION_TYPES.find((x) => x.id === 'tpm-quote')

  it('shows the limits of the interim sketch in the TPM quote flow', () => {
    render(
      <MemoryRouter>
        <AttestationFlowDesigner />
      </MemoryRouter>
    )
    const text = flat(document.body.textContent)
    expect(text).toContain(flat(quote?.pqcMigrationPath))
    expect(text).toMatch(/not by itself quantum-safe attestation/)
    expect(text).toMatch(/no hardware root of trust|has no hardware root of trust/)
    expect(text).not.toMatch(/software ML-DSA binding/)
  })

  it('says the software signature must cover the quote, the PCR claims and the nonce', () => {
    expect(quote?.pqcMigrationPath).toMatch(
      /signature must cover the quote and PCR claims and the nonce/
    )
    expect(quote?.pqcMigrationPath).toMatch(/a software key has no hardware root of trust/)
  })
})

describe('Secure Boot introduction: interim hybrid attestation sketch', () => {
  it('does not call a software nonce co-signature quantum-safe attestation or bind it to the AIK certificate', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(
      screen.getByRole('heading', { name: /TPM 2\.0 and the Path to Post-Quantum Attestation/ })
    )
    const text = flat(document.body.textContent)
    expect(text).toMatch(/Interim Hybrid Sketch for TPMs Built to Earlier Versions/)
    expect(text).toMatch(
      /signature over the nonce alone shows only that the holder of the software key saw the challenge/
    )
    expect(text).toMatch(/no hardware root of trust/)
    expect(text).toMatch(/do not call the pair quantum-safe attestation/)
    expect(text).not.toMatch(/providing quantum-safe attestation/)
    expect(text).not.toMatch(/ML-DSA public key is bound to the TPM AIK certificate/)
  })
})
