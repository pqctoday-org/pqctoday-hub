// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structural rules of the certificate and handshake models — the bugs the
 * 2026-10-01 audit found (I2-I5, I17) must stay fixed.
 */
import { describe, it, expect } from 'vitest'
import {
  CERT_OVERHEAD_BYTES,
  MTC_HASH_BYTES,
  PBADV_MAX_TRANSACTION,
  certSize,
  chainSizes,
  deliveredChainBytes,
  dtlsHandshake,
  edhocHandshake,
  pbAdvSegments,
  sigSizesOf,
  uniformChain,
} from './utils/sizing'

const ecdsa = sigSizesOf('ecdsa-p256')
const mldsa44 = sigSizesOf('ml-dsa-44')
const mldsa87 = sigSizesOf('ml-dsa-87')

describe('certificate model', () => {
  it('I3: a certificate carries the ISSUER signature, not its own', () => {
    // ECDSA subject issued by an ML-DSA-87 CA
    expect(certSize(ecdsa, mldsa87)).toBe(
      CERT_OVERHEAD_BYTES.x509 + ecdsa.publicKeyBytes + mldsa87.signatureBytes
    )
    const c = chainSizes(mldsa87, mldsa44, ecdsa)
    expect(c.intermediate).toBe(
      CERT_OVERHEAD_BYTES.x509 + mldsa44.publicKeyBytes + mldsa87.signatureBytes
    )
    expect(c.leaf).toBe(CERT_OVERHEAD_BYTES.x509 + ecdsa.publicKeyBytes + mldsa44.signatureBytes)
    expect(c.root).toBe(CERT_OVERHEAD_BYTES.x509 + mldsa87.publicKeyBytes + mldsa87.signatureBytes)
  })

  it('I2/I4: the chain on the wire omits the root and holds 2 public keys + 2 signatures', () => {
    const c = uniformChain('ml-dsa-44')
    expect(c.sent).toBe(c.intermediate + c.leaf)
    expect(c.sent).toBe(
      2 * CERT_OVERHEAD_BYTES.x509 + 2 * mldsa44.publicKeyBytes + 2 * mldsa44.signatureBytes
    )
  })

  it('C509 changes only the encoding overhead', () => {
    const x = uniformChain('ml-dsa-65', 'x509')
    const c = uniformChain('ml-dsa-65', 'c509')
    expect(x.sent - c.sent).toBe(2 * (CERT_OVERHEAD_BYTES.x509 - CERT_OVERHEAD_BYTES.c509))
  })

  it('compression cannot remove key or signature bytes', () => {
    const full = deliveredChainBytes('full', mldsa44, mldsa44, mldsa44).bytes
    const comp = deliveredChainBytes('compressed', mldsa44, mldsa44, mldsa44).bytes
    expect(comp).toBeGreaterThanOrEqual(2 * (mldsa44.publicKeyBytes + mldsa44.signatureBytes))
    expect(full - comp).toBeLessThan(2 * CERT_OVERHEAD_BYTES.x509)
  })

  it('I17: an MTC proof is 32 bytes per tree level and carries no CA signature', () => {
    const r = deliveredChainBytes('mtc', mldsa44, mldsa44, mldsa44, 20)
    expect(r.bytes).toBe(CERT_OVERHEAD_BYTES.x509 + mldsa44.publicKeyBytes + MTC_HASH_BYTES * 20)
    expect(r.caveat).toMatch(/tree heads/)
  })
})

describe('handshake model', () => {
  it('I4: DTLS Certificate message = chain.sent + framing (2 pk + 2 sig)', () => {
    const d = dtlsHandshake('ml-kem-768', 'ml-dsa-44')
    const cert = d.messages.find((m) => m.label.startsWith('Certificate ('))!
    const chain = uniformChain('ml-dsa-44').sent
    expect(cert.bytes - chain).toBeLessThan(40)
    expect(cert.bytes).toBeGreaterThan(chain)
  })

  it('I5: PQC DTLS needs many more datagrams and radio frames than classical', () => {
    const c = dtlsHandshake('x25519', 'ecdsa-p256')
    const p = dtlsHandshake('ml-kem-768', 'ml-dsa-44')
    expect(p.totalBytes).toBeGreaterThan(5 * c.totalBytes)
    expect(p.radioFrames).toBeGreaterThan(100)
    expect(p.datagrams).toBeGreaterThan(c.datagrams)
  })

  it('EDHOC by reference sends no certificate; by value it does', () => {
    const ref = edhocHandshake('x25519', 'ml-dsa-44', false)
    const val = edhocHandshake('x25519', 'ml-dsa-44', true)
    expect(val.totalBytes - ref.totalBytes).toBeGreaterThan(2 * mldsa44.publicKeyBytes)
    expect(ref.totalBytes).toBeLessThan(dtlsHandshake('x25519', 'ml-dsa-44').totalBytes)
  })
})

describe('BLE Mesh PB-ADV segmentation', () => {
  it('a P-256 key PDU (65 B) is 3 segments; one transaction holds at most 1,469 B', () => {
    expect(pbAdvSegments(65)).toEqual({ segments: 3, fits: true })
    expect(PBADV_MAX_TRANSACTION).toBe(1469)
    expect(pbAdvSegments(1469).fits).toBe(true)
    expect(pbAdvSegments(1470).fits).toBe(false)
  })
})
