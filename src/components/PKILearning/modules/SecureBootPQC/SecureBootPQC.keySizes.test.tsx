// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Firmware Signing Migrator compares RSA keys with post-quantum keys. A raw ML-DSA public key
 * and a bare RSA modulus are not the same kind of object as what a certificate carries, so the
 * comparison table says which form each row shows, and the db callout uses the certificate form
 * (DER SubjectPublicKeyInfo, measured with OpenSSL 3.6.3: RSA-2048 294 B, ML-DSA-65 1,974 B).
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { FirmwareSigningMigrator } from './workshop/FirmwareSigningMigrator'

const flat = (s: string) => s.replace(/\s+/g, ' ').trim()

const renderAtStep = (initialStep: number) =>
  render(
    <MemoryRouter>
      <FirmwareSigningMigrator initialStep={initialStep} />
    </MemoryRouter>
  )

describe('Firmware Signing Migrator: key-size comparison names the form of each key', () => {
  it('labels the public-key row as raw key material with RSA as the modulus only', () => {
    renderAtStep(3)
    const row = screen.getByRole('row', { name: /^Public key/ })
    const cells = within(row).getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('Public key (raw key material; RSA = modulus only)')
    // the sizes are those of the forms named: the 256-byte RSA-2048 modulus, the 1,952-byte ML-DSA-65 key
    expect(cells[1]).toHaveTextContent('256 B')
    expect(cells[2]).toHaveTextContent('1,952 B')
  })

  it('labels the private-key row with the form each size is for', () => {
    renderAtStep(3)
    const row = screen.getByRole('row', { name: /^Private key/ })
    const label = within(row).getAllByRole('cell')[0]
    expect(label).toHaveTextContent(
      'Private key (as stored: RSA PKCS#1 DER with CRT values; ECDSA and post-quantum raw)'
    )
    expect(row).toHaveTextContent('1,192 B')
    expect(row).toHaveTextContent('4,032 B')
  })

  it('no longer presents an unlabelled "Public key" or "Private key" row', () => {
    renderAtStep(3)
    expect(screen.queryByRole('cell', { name: 'Public key' })).not.toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Private key' })).not.toBeInTheDocument()
  })
})

describe('Firmware Signing Migrator: the db callout compares certificate-form public keys', () => {
  it('says 1,974 B against 294 B, 6.7x, and drops the raw-against-modulus ratio', () => {
    renderAtStep(1)
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain(
      'As a certificate carries it (SubjectPublicKeyInfo), the ML-DSA-65 public key is 6.7× larger than RSA-2048 (1,974 B vs 294 B).'
    )
    expect(text).not.toContain('7.6× larger than RSA-2048')
    expect(text).not.toContain('1,952 B vs 256 B')
  })
})
