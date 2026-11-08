// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { readFileSync } from 'node:fs'
import { createCipheriv, createDecipheriv } from 'node:crypto'
import { join } from 'node:path'
import {
  EnvelopeEncryptionDemo,
  KMS_KAT_SPECS,
  RFC5649_SECTION6_VECTORS,
  compareRecoveredDek,
  describeDekComparison,
} from './EnvelopeEncryptionDemo'
import { evidenceForKind } from '@/utils/katEvidence'
import mlkemVectors from '@/data/acvp/mlkem_test.json'
import aesgcmVectors from '@/data/acvp/aesgcm_test.json'

const key = (fill: number) => new Uint8Array(32).fill(fill)

describe('compareRecoveredDek', () => {
  it('reports identical keys only when every byte matches', () => {
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(7), key(7))
    expect(c.fullMatch).toBe(true)
    expect(c.kcvMatch).toBe(true)
    expect(describeDekComparison(c)).toMatch(/✓ recovered DEK is byte-identical/)
  })

  it('does not report success when the 3-byte check values collide but the keys differ', () => {
    const recovered = key(7)
    recovered[31] = 8
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(7), recovered)
    expect(c.kcvMatch).toBe(true) // a short fingerprint can collide
    expect(c.fullMatch).toBe(false)
    const text = describeDekComparison(c)
    expect(text).toMatch(/✗ recovered DEK differs from the original/)
    expect(text).not.toMatch(/byte-identical/)
  })

  it('does not report a mismatch when only the check value is missing', () => {
    const c = compareRecoveredDek('AA BB CC', '—', key(3), key(3))
    expect(c.kcvMatch).toBeNull()
    expect(c.fullMatch).toBe(true)
    expect(describeDekComparison(c)).toMatch(/KCV not returned/)
  })

  it('fails keys of different length even when the shared prefix matches', () => {
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(5), key(5).slice(0, 16))
    expect(c.fullMatch).toBe(false)
  })

  it('labels a matching check value as a diagnostic, never as proof', () => {
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(1), key(1))
    expect(describeDekComparison(c)).toMatch(/3-byte diagnostic only/)
  })
})

describe('EnvelopeEncryptionDemo rotation explanation', () => {
  function stepFiveText(): string {
    render(<EnvelopeEncryptionDemo initialStep={4} />)
    return document.body.textContent ?? ''
  }

  it('does not say a new DEK can replace the old one without re-encrypting existing data', () => {
    const text = stepFiveText()
    expect(text).not.toMatch(/DEK rotation without re-encrypting any data/)
    expect(text).not.toMatch(/just generate a new DEK and re-wrap/)
  })

  it('separates KEK re-wrap, new DEKs for new writes and re-encryption of existing ciphertext', () => {
    const text = stepFiveText()
    expect(text).toMatch(/Rotating the KEK means re-wrapping each existing DEK/)
    expect(text).toMatch(/A new DEK protects only data written from then on/)
    expect(text).toMatch(/means decrypting and re-encrypting that data/)
  })

  it('does not say the KCV confirms key integrity', () => {
    const text = stepFiveText()
    expect(text).not.toMatch(/confirms key integrity/)
    expect(text).toMatch(/two different keys can share one/)
  })
})

describe('workshop known-answer checks name what they check', () => {
  const byId = (id: string) => {
    const spec = KMS_KAT_SPECS.find((k) => k.id === id)
    if (!spec) throw new Error(`no KAT spec ${id}`)
    return spec
  }

  it('checks ML-KEM decapsulation against an ACVP vector for every parameter set the workshop offers', () => {
    for (const variant of [512, 768, 1024] as const) {
      const spec = byId(`kms-envelope-kem-decap-${variant}`)
      expect(spec.kind).toEqual({ type: 'mlkem-decap', variant })
      expect(evidenceForKind(spec.kind)).toBe('nist-acvp-reference-sample')
      const group = mlkemVectors.testGroups.find((g) => g.parameterSet === `ML-KEM-${variant}`)
      expect(group, `ACVP group for ML-KEM-${variant}`).toBeDefined()
      expect(group!.tests.length).toBeGreaterThan(0)
    }
    // FIPS 203 sizes: ct 768 / 1088 / 1568 bytes, 32-byte shared secret
    const ctBytes = { 512: 768, 768: 1088, 1024: 1568 } as const
    for (const variant of [512, 768, 1024] as const) {
      const t = mlkemVectors.testGroups.find((g) => g.parameterSet === `ML-KEM-${variant}`)!
        .tests[0]
      // eslint-disable-next-line security/detect-object-injection -- variant is a literal from the loop above
      expect(t.ct.length / 2).toBe(ctBytes[variant])
      expect(t.ss.length / 2).toBe(32)
    }
  })

  it('decapsulation rows cite FIPS 203 section 7.3, the decapsulation algorithm', () => {
    for (const variant of [512, 768, 1024]) {
      expect(byId(`kms-envelope-kem-decap-${variant}`).standard).toMatch(/FIPS 203 §7\.3/)
    }
  })

  it('checks AES-256-GCM against a NIST CAVP vector, and the Node/OpenSSL result agrees with it', () => {
    const spec = byId('kms-dek-decrypt-gcm-cavp')
    expect(spec.kind).toEqual({ type: 'aesgcm-decrypt', testIndex: 0 })
    expect(evidenceForKind(spec.kind)).toBe('published-standard-kat')
    const t = aesgcmVectors.testGroups[0].tests[0]
    const decipher = createDecipheriv(
      'aes-256-gcm',
      Buffer.from(t.key, 'hex'),
      Buffer.from(t.iv, 'hex')
    )
    decipher.setAuthTag(Buffer.from(t.tag, 'hex'))
    const pt = Buffer.concat([decipher.update(Buffer.from(t.ct, 'hex')), decipher.final()])
    expect(pt.toString('hex')).toBe(t.pt)
  })

  it('labels the HKDF row RFC 5869 / SP 800-56C, not SP 800-108', () => {
    const spec = byId('kms-kek-hkdf')
    expect(spec.standard).toMatch(/RFC 5869/)
    expect(spec.standard).toMatch(/SP 800-56C/)
    expect(spec.standard).not.toMatch(/800-108/)
    expect(evidenceForKind(spec.kind)).toBe('published-standard-kat')
  })

  it('says "round-trip" on every row whose expected value is not an external published answer', () => {
    const roundTrips = KMS_KAT_SPECS.filter(
      (k) => evidenceForKind(k.kind) === 'functional-round-trip'
    )
    expect(roundTrips.map((k) => k.id).sort()).toEqual(
      [
        'kms-dek-encrypt',
        'kms-envelope-kem-1024',
        'kms-envelope-kem-512',
        'kms-envelope-kem-768',
        'kms-kek-kwp',
      ].sort()
    )
    for (const k of roundTrips) expect(`${k.useCase} ${k.standard}`).toMatch(/round-trip/i)
  })

  it('keeps every spec id unique', () => {
    const ids = KMS_KAT_SPECS.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('RFC 5649 section 6 vectors pinned in the workshop', () => {
  const kwp = (mode: 'wrap' | 'unwrap', kekHex: string, dataHex: string): string => {
    const kek = Buffer.from(kekHex, 'hex')
    const iv = Buffer.from('A65959A6', 'hex') // the RFC 5649 default alternative IV constant
    const name = `id-aes${kek.length * 8}-wrap-pad`
    const c = mode === 'wrap' ? createCipheriv(name, kek, iv) : createDecipheriv(name, kek, iv)
    return Buffer.concat([c.update(Buffer.from(dataHex, 'hex')), c.final()]).toString('hex')
  }

  it('pins the two published examples, 20 and 7 octets of key data under a 192-bit KEK', () => {
    expect(RFC5649_SECTION6_VECTORS.map((v) => v.keyHex.length / 2)).toEqual([20, 7])
    for (const v of RFC5649_SECTION6_VECTORS) expect(v.kekHex.length / 2).toBe(24)
  })

  it('every pinned wrapped value is what an independent AES-KWP implementation produces, and unwraps back', () => {
    for (const v of RFC5649_SECTION6_VECTORS) {
      expect(kwp('wrap', v.kekHex, v.keyHex), v.id).toBe(v.wrappedHex)
      expect(kwp('unwrap', v.kekHex, v.wrappedHex), v.id).toBe(v.keyHex)
    }
  })
})

describe('HKDF salt comments make no SP 800-56C salt-length claim', () => {
  it('does not cite a minimum salt length that SP 800-56C does not set', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed sibling file
    const src = readFileSync(join(__dirname, 'EnvelopeEncryptionDemo.tsx'), 'utf8')
    expect(src).not.toMatch(/salt length SHALL be/)
    expect(src).not.toMatch(/same salt\s+[—-]\s+SP 800-56C Rev 2 §4\.1/)
    expect(src).not.toMatch(/\(SP 800-56C Rev 2 §4\.1\)/)
    expect(src).toMatch(/design choice/)
  })
})
