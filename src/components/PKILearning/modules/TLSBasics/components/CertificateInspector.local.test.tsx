// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CertificateInspector } from './CertificateInspector'
import { openSSLService } from '@/services/crypto/OpenSSLService'

vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))

// Shape of `openssl x509 -in cert.pem -text -noout` output (OpenSSL 3.6): the signature
// algorithm appears twice, the subject key algorithm once, and the subject can hold any text.
function certText(opts: { keyAlgo: string; sigAlgo: string; commonName?: string }): string {
  const cn = opts.commonName ?? 'example test'
  return `Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 1 (0x1)
        Signature Algorithm: ${opts.sigAlgo}
        Issuer: CN=${cn}
        Validity
            Not Before: Nov  5 00:00:00 2026 GMT
            Not After : Nov  6 00:00:00 2026 GMT
        Subject: CN=${cn}
        Subject Public Key Info:
            Public Key Algorithm: ${opts.keyAlgo}
                ${opts.keyAlgo} Public-Key:
    Signature Algorithm: ${opts.sigAlgo}
    Signature Value:
        00:01:02
`
}

async function inspect(stdout: string) {
  vi.mocked(openSSLService.execute).mockResolvedValue({ stdout, stderr: '', files: [] })
  render(
    <CertificateInspector
      isOpen
      onClose={() => {}}
      pem="-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"
      title="Sample certificate"
    />
  )
  await waitFor(() => expect(screen.queryByText(/Parsing Certificate Structure/)).toBeNull())
}

const panelText = () => document.body.textContent ?? ''

describe('CertificateInspector PQC annotation', () => {
  beforeEach(() => {
    vi.mocked(openSSLService.execute).mockReset()
  })

  it('shows security category 1 and the 800 B encapsulation key for an ML-KEM-512 certificate', async () => {
    await inspect(certText({ keyAlgo: 'ML-KEM-512', sigAlgo: 'ML-DSA-65' }))
    expect(screen.getByText(/PQC Certificate — ML-KEM-512 \(NIST category 1\)/)).toBeTruthy()
    expect(panelText()).toContain('800 B')
    // The certificate signature is the issuer's ML-DSA-65 signature, not an ML-KEM property.
    expect(panelText()).toContain('ML-DSA-65: 3,309 B')
    expect(panelText()).not.toMatch(/NIST L\d/)
    expect(panelText()).not.toContain('category 2')
  })

  it.each([
    ['ML-KEM-768', 'NIST category 3', '1,184 B'],
    ['ML-KEM-1024', 'NIST category 5', '1,568 B'],
    ['ML-DSA-44', 'NIST category 2', '1,312 B'],
    ['ML-DSA-87', 'NIST category 5', '2,592 B'],
  ])('shows the category and public key size of %s', async (algo, category, pubKey) => {
    await inspect(certText({ keyAlgo: algo, sigAlgo: 'ML-DSA-87' }))
    expect(screen.getByText(new RegExp(`PQC Certificate — ${algo} \\(${category}\\)`))).toBeTruthy()
    expect(panelText()).toContain(pubKey)
  })

  it.each([
    // [parameter set, category, public key (2n bytes), signature (FIPS 205 Table 2)]
    ['SLH-DSA-SHA2-128s', 'category 1', '32 B', '7,856 B'],
    ['SLH-DSA-SHAKE-128f', 'category 1', '32 B', '17,088 B'],
    ['SLH-DSA-SHA2-192s', 'category 3', '48 B', '16,224 B'],
    ['SLH-DSA-SHAKE-192f', 'category 3', '48 B', '35,664 B'],
    ['SLH-DSA-SHA2-256s', 'category 5', '64 B', '29,792 B'],
    ['SLH-DSA-SHAKE-256f', 'category 5', '64 B', '49,856 B'],
  ])('gives %s its own %s, public key and signature size', async (algo, category, pk, sig) => {
    await inspect(certText({ keyAlgo: algo, sigAlgo: algo }))
    expect(screen.getByText(new RegExp(`${algo} \\(NIST ${category}\\)`))).toBeTruthy()
    // The value cell beside the "Public Key Size" label starts with the family's key size.
    expect(screen.getByText('Public Key Size').nextElementSibling?.textContent).toMatch(
      new RegExp(`^${pk}`)
    )
    expect(panelText()).toContain(`${algo}: ${sig}`)
  })

  it('does not treat name fragments in the subject as the certificate algorithm', async () => {
    // An RSA key whose subject mentions PQC names, signed by an ML-DSA-65 issuer.
    await inspect(
      certText({
        keyAlgo: 'rsaEncryption',
        sigAlgo: 'ML-DSA-65',
        commonName: 'mlkem768 and mldsa87 and SLH-DSA demo',
      })
    )
    expect(panelText()).toContain('Certificate signed with ML-DSA-65 (NIST category 3)')
    expect(panelText()).not.toContain('PQC Certificate')
    expect(panelText()).not.toContain('ML-KEM-768 (')
    expect(panelText()).not.toContain('ML-DSA-87 (')
    // No public key size is attributed to the RSA key.
    expect(screen.queryByText('Public Key Size')).toBeNull()
  })

  it('shows no PQC annotation for a classical certificate with a PQC-looking name', async () => {
    await inspect(
      certText({
        keyAlgo: 'id-ecPublicKey',
        sigAlgo: 'ecdsa-with-SHA256',
        commonName: 'ml-kem-512 sphincs slhdsa mldsa65',
      })
    )
    expect(panelText()).not.toContain('NIST category')
    expect(screen.queryByText('Classical equivalent')).toBeNull()
  })

  it('resolves a dotted OID printed in place of the algorithm name', async () => {
    await inspect(
      certText({ keyAlgo: '2.16.840.1.101.3.4.4.1', sigAlgo: '2.16.840.1.101.3.4.3.18' })
    )
    expect(screen.getByText(/PQC Certificate — ML-KEM-512 \(NIST category 1\)/)).toBeTruthy()
    expect(panelText()).toContain('ML-DSA-65: 3,309 B')
  })

  it('ignores identifiers that only look like object properties', async () => {
    await inspect(certText({ keyAlgo: 'constructor', sigAlgo: '__proto__' }))
    expect(panelText()).not.toContain('NIST category')
  })
})
