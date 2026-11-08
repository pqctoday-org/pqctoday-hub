// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Content guards for KmsPqc Step 7.
 *
 *  - Every provider sentence is the registered claim, word for word, with its
 *    Library reference id. The expected sentences are pinned here so a reword in
 *    the data file fails.
 *  - The four references dropped from the release are never cited.
 *  - The headline facts the step teaches are pinned: no post-quantum key import
 *    into AWS KMS, Decapsulate returns the secret to the caller, Google's HPKE
 *    import is Preview, AWS and Azure HPKE are labelled as candidate designs.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  DROPPED_REFERENCE_IDS,
  FLOWS,
  PROVIDERS,
  PROVIDER_CLAIMS,
  claimsFor,
  flowById,
  flowsFor,
  providerById,
} from './cloudKmsExchangeData'

const EXPECTED: Record<string, string> = {
  'AWS-KMS-Post-Quantum-Keys':
    'AWS KMS offers ML-DSA signing keys (ML_DSA_44, ML_DSA_65, ML_DSA_87) and ML-KEM key-establishment keys (ML_KEM_512, ML_KEM_768, ML_KEM_1024).',
  'AWS-KMS-ML-KEM-Launch-2026-10':
    'AWS added ML-KEM keys to AWS KMS on 26 October 2026; they are not available in the China, Middle East (UAE) and Middle East (Bahrain) Regions.',
  'AWS-KMS-Import-Wrapping-Keys':
    'AWS KMS imports key material only under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096) and cannot import key material into ML-DSA or ML-KEM KMS keys.',
  'AWS-KMS-API-Decapsulate':
    'AWS KMS Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
  'AWS-KMS-API-Encapsulate':
    'AWS KMS Encapsulate works only with the public key of a KMS ML-KEM key, so encapsulating to a partner’s HSM key happens in the caller’s own library.',
  'AWS-KMS-API-GenerateDataKeyPair':
    'AWS KMS GenerateDataKeyPair can return ML-KEM data key pairs, with the private key in seed format, encrypted under a symmetric KMS key.',
  'AWS-KMS-Hybrid-PQ-TLS':
    'AWS KMS supports hybrid post-quantum TLS that combines ECDH with ML-KEM on its service endpoints.',
  'AWS-PQ-Readiness-Confidentiality':
    'AWS lists hybrid post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS Payment Cryptography and the AWS CloudHSM control plane.',
  'Google-Cloud-KMS-Quantum-Safe-Key-Import':
    'Google Cloud KMS quantum-safe key import, in Preview since 6 August 2026, wraps imported key material with HPKE using X-Wing, ML-KEM-768 or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM.',
  'Google-Cloud-KMS-Key-Import':
    'Google Cloud KMS key import wraps key material for transfer, with RSA-based import methods alongside the quantum-safe HPKE methods.',
  'Google-Cloud-KMS-Release-Notes':
    'Google Cloud KMS release notes list the ML-KEM and X-Wing key encapsulation algorithms as Preview since 23 September 2025.',
  'Azure-Key-Vault-BYOK-Specification':
    'Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key exchange key of 2048, 3072 or 4096 bits.',
  'Azure-Managed-HSM-BYOK':
    'Azure Managed HSM BYOK uses an RSA-HSM key exchange key that has only the import key operation.',
}

const STEP7_FILES = [
  'data/cloudKmsExchangeData.ts',
  'services/cloudKmsExchange.ts',
  'workshop/CloudKmsKeyExchange.tsx',
  'workshop/CloudKmsFlowSteps.tsx',
  'workshop/CloudKmsFacts.tsx',
  'workshop/CloudKmsRadioGroup.tsx',
]
const read = (rel: string) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

describe('provider claims', () => {
  it('are exactly the registered sentences, one per reference id', () => {
    expect(Object.fromEntries(PROVIDER_CLAIMS.map((c) => [c.id, c.sentence]))).toEqual(EXPECTED)
    expect(new Set(PROVIDER_CLAIMS.map((c) => c.id)).size).toBe(PROVIDER_CLAIMS.length)
  })

  it('every claim is shown on the tab of the provider it is about', () => {
    for (const p of PROVIDERS) {
      for (const c of claimsFor(p.claimIds)) expect(c.providerId).toBe(p.id)
    }
  })

  it('every claim is shown somewhere', () => {
    const shown = new Set(PROVIDERS.flatMap((p) => p.claimIds))
    for (const c of PROVIDER_CLAIMS) expect(shown.has(c.id), c.id).toBe(true)
  })

  it('every flow cites only claims about its own provider', () => {
    for (const f of FLOWS) {
      for (const c of claimsFor(f.claimIds))
        expect(c.providerId, `${f.id}: ${c.id}`).toBe(f.providerId)
    }
  })

  it('claimsFor refuses an unknown id rather than skipping it', () => {
    expect(() => claimsFor(['No-Such-Reference'])).toThrow(/Unknown provider claim id/)
  })
})

describe('source hygiene', () => {
  it.each(STEP7_FILES)('%s cites none of the dropped references', (rel) => {
    const text = read(rel)
    for (const id of DROPPED_REFERENCE_IDS) {
      // The data file lists them once, in DROPPED_REFERENCE_IDS, so a guard can name them.
      const allowed = rel === 'data/cloudKmsExchangeData.ts' ? 1 : 0
      expect(text.split(id).length - 1, `${rel}: ${id}`).toBe(allowed)
    }
  })

  it.each(STEP7_FILES)('%s carries no TODO or citation placeholder', (rel) => {
    expect(read(rel)).not.toMatch(/TODO|FIXME|citation\)/i)
  })
})

describe('what the step teaches', () => {
  it('AWS KMS: no post-quantum key import (the registered claim, shown with the classical flow)', () => {
    const aws = flowById('aws-classical')
    expect(aws.claimIds).toContain('AWS-KMS-Import-Wrapping-Keys')
    expect(EXPECTED['AWS-KMS-Import-Wrapping-Keys']).toMatch(
      /cannot import key material into ML-DSA or ML-KEM KMS keys/
    )
    // Every wrapping step of the AWS import is classical.
    const wrap = aws.steps.find((s) => s.id === 'wrap')!
    expect(wrap.quantumSafe).toBe('no')
    expect(wrap.params.join(' ')).toMatch(/CKM_RSA_AES_KEY_WRAP/)
    expect(aws.steps.some((s) => s.quantumSafe === 'yes')).toBe(false)
  })

  it('AWS KMS: Decapsulate returns the secret to the caller, so the key is application data', () => {
    const f = flowById('aws-mlkem')
    expect(f.claimIds).toContain('AWS-KMS-API-Decapsulate')
    const decap = f.steps.find((s) => s.id === 'decap')!
    expect(decap.keyLocation).toBe('caller-memory')
    expect(f.verdict).toMatch(/leaves the HSM in plaintext/)
    expect(f.verdict).toMatch(/not a KMS key/)
  })

  it('the hybrid flow keeps both secrets and the combine step outside an HSM', () => {
    const f = flowById('aws-hybrid')
    for (const s of f.steps) expect(s.keyLocation).toBe('caller-memory')
    expect(f.verdict).toMatch(/outside any HSM/)
  })

  it('Google: the HPKE import is labelled Preview and cites the Preview claim', () => {
    const f = flowById('gcp-hpke')
    expect(f.availability).toBe('preview')
    expect(f.claimIds).toContain('Google-Cloud-KMS-Quantum-Safe-Key-Import')
  })

  it('AWS and Azure: the HPKE flow is labelled a candidate design the provider does not offer', () => {
    for (const id of ['aws-hpke', 'azure-hpke']) {
      const f = flowById(id)
      expect(f.availability).toBe('candidate')
      expect(f.summary).toMatch(/does not offer this/)
    }
  })

  it('every provider shows its real classical import next to the HPKE flow', () => {
    for (const p of PROVIDERS) {
      const kinds = flowsFor(p.id).map((f) => f.kind)
      expect(kinds, p.id).toContain('classical')
      expect(kinds, p.id).toContain('hpke')
    }
    expect(flowsFor('aws').map((f) => f.kind)).toEqual([
      'classical',
      'hpke',
      'aws-mlkem',
      'aws-hybrid',
    ])
  })

  it('each flow has unique, non-empty step ids and every step says where the key sits', () => {
    for (const f of FLOWS) {
      const ids = f.steps.map((s) => s.id)
      expect(new Set(ids).size, f.id).toBe(ids.length)
      for (const s of f.steps) {
        expect(s.apiName.length, `${f.id}/${s.id}`).toBeGreaterThan(0)
        expect(['inside-hsm', 'in-transit', 'caller-memory']).toContain(s.keyLocation)
      }
    }
  })

  it('names three providers', () => {
    expect(PROVIDERS.map((p) => providerById(p.id).name)).toEqual([
      'AWS KMS',
      'Google Cloud KMS',
      'Azure Key Vault and Managed HSM',
    ])
  })
})
