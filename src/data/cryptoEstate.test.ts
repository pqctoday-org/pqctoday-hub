// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SAMPLE_INVENTORY } from './cryptoEstate'

describe('sample crypto estate: remediation text', () => {
  const liboqs = SAMPLE_INVENTORY.find((a) => a.id === 'lib-liboqs')

  it('does not suggest that a FIPS shim makes an unvalidated library production-ready', () => {
    expect(liboqs).toBeDefined()
    const text = liboqs!.remediation
    expect(text).not.toMatch(/Keep behind FIPS shim for production/i)
    expect(text).toMatch(/does not validate liboqs/)
    expect(text).toMatch(/named module, in a tested configuration, with a defined boundary/)
  })

  it('requires a documented validated implementation where policy requires validated cryptography', () => {
    const text = liboqs!.remediation
    expect(text).toMatch(/Where policy requires validated cryptography for a service/)
    expect(text).toMatch(/documented validated implementation/)
    expect(text).toMatch(/record its certificate and boundary/)
    expect(text).toMatch(/keep liboqs out of that service/)
  })

  it('keeps the contrasting case: a validated library swap is still named by its certificate', () => {
    const bc = SAMPLE_INVENTORY.find((a) => /CMVP #\d+/.test(a.remediation))
    expect(bc).toBeDefined()
    expect(bc!.remediation).toMatch(/CMVP #\d+/)
  })
})

it('keeps the Python migration on its documented C-library build path, distinct from the Rust API and FIPS claims', () => {
  const signer = SAMPLE_INVENTORY.find((asset) => asset.id === 'sw-batch-signer')!
  expect(signer.currentAlgorithm).toBe('RSA-2048 via PyCryptodome')
  expect(signer.remediation).toContain(
    'Python cryptography 50.0.2 built against the C AWS-LC library'
  )
  expect(signer.remediation).toContain('OPENSSL_DIR')
  expect(signer.remediation).toContain('build cryptography from source')
  expect(signer.remediation).toContain('aws-lc-rs is a separate Rust library, not a Python backend')
  expect(signer.remediation).toContain('test sample signing, verification and tamper rejection')
  expect(signer.remediation).toContain(
    'module certificate, approved algorithm, operating environment and security policy'
  )
  expect(signer.remediation).not.toContain('with aws-lc-rs FIPS backend')
})
