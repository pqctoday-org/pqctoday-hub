// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Content guards for KmsPqc Step 7.
 *
 *  - Every provider sentence is the registered claim, word for word, with its
 *    Library reference id. The expected sentences are pinned here so a reword in
 *    the data file fails.
 *  - Four Library references are never cited by this step.
 *  - The headline facts the step teaches are pinned: no post-quantum key import
 *    into AWS KMS, Decapsulate returns the secret to the caller, Google's HPKE
 *    import is Preview, AWS and Azure HPKE are labelled as candidate designs.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  ENGINES,
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
    'AWS KMS imports key material under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096), or an SM2 wrapping key in the China Regions, and cannot import key material into ML-DSA or ML-KEM KMS keys.',
  'AWS-KMS-API-Decapsulate':
    'AWS KMS Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
  'AWS-KMS-API-Encapsulate':
    'AWS KMS Encapsulate works only with the public key of a KMS ML-KEM key.',
  'AWS-KMS-API-GenerateDataKeyPair':
    'AWS KMS GenerateDataKeyPair can return ML-KEM data key pairs, with the private key in seed format, encrypted under a symmetric KMS key.',
  'AWS-KMS-Hybrid-PQ-TLS':
    'AWS KMS supports hybrid post-quantum TLS that combines ECDH with ML-KEM on its service endpoints.',
  'AWS-PQ-Readiness-Confidentiality':
    'AWS lists hybrid post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS Payment Cryptography and the AWS CloudHSM control plane.',
  'Google-Cloud-KMS-Quantum-Safe-Key-Import':
    'Google Cloud KMS quantum-safe key import, in Preview, wraps imported key material with HPKE using X-Wing, ML-KEM-768 or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM.',
  'Google-Cloud-KMS-Key-Import':
    'Google Cloud KMS key import wraps key material for transfer using RSA-based import methods.',
  'Google-Cloud-KMS-Release-Notes':
    'Google Cloud KMS release notes list the ML-KEM and X-Wing key encapsulation algorithms as Preview since 23 September 2025.',
  'Azure-Key-Vault-BYOK-Specification':
    'Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key exchange key of 2048, 3072 or 4096 bits.',
  'Azure-Managed-HSM-BYOK':
    'Azure Managed HSM BYOK uses an RSA-HSM key exchange key that has only the import key operation.',
}

// Library references this step does not cite.
const NOT_CITED_REFERENCE_IDS = [
  'AWS-KMS-API-DeriveSharedSecret',
  'AWS-KMS-External-Key-Stores',
  'AWS-KMS-Infrastructure-Security',
  'Thales-CipherTrust-Manager-Release-Notes',
]

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
  it.each(STEP7_FILES)('%s does not cite the references that are not cited', (rel) => {
    const text = read(rel)
    for (const id of NOT_CITED_REFERENCE_IDS) {
      expect(text.includes(id), `${rel}: ${id}`).toBe(false)
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

  it('the classical flows export an EC private key, because CKM_RSA_AES_KEY_WRAP wraps asymmetric targets', () => {
    for (const id of ['aws-classical', 'gcp-classical', 'azure-classical']) {
      const f = flowById(id)
      const source = f.steps.find((s) => s.id === 'source')!
      expect(source.title, id).toMatch(/EC P-256/)
      expect(source.apiName, id).toMatch(/CKM_EC_KEY_PAIR_GEN/)
      expect(f.summary, id).toMatch(/EC P-256 private key/)
      expect(f.steps.map((s) => s.detail).join(' '), id).not.toMatch(/AES-256 key is created/)
    }
    expect(flowById('aws-classical').steps.find((s) => s.id === 'source')!.detail).toMatch(
      /asymmetric target keys/
    )
  })

  it('the temporary AES key size is only stated as a fact where the provider names it', () => {
    const wrapParams = (id: string) =>
      flowById(id)
        .steps.find((s) => s.id === 'wrap')!
        .params.join(' | ')
    expect(wrapParams('gcp-classical')).toMatch(
      /temporary AES key = 256 bits(?! \(simulation choice\))/
    )
    expect(wrapParams('aws-classical')).toMatch(/\(simulation choice\)/)
    expect(wrapParams('azure-classical')).toMatch(/\(simulation choice\)/)
  })

  it('Azure imports with the REST call the BYOK specification shows, not a made-up operation', () => {
    const step = flowById('azure-classical').steps.find((s) => s.id === 'import')!
    expect(step.apiName).toBe('PUT /keys/<key-name>')
    expect(step.params).toContain('key_hsm = the transfer blob')
    expect(step.params).toContain('kty = EC-HSM')
    expect(step.apiName).not.toMatch(/Import key \(BYOK\)/)
  })

  it('the Google HPKE flow says software protection, Preview and pre-wrapped keys', () => {
    const f = flowById('gcp-hpke')
    expect(f.verdict).toMatch(
      /software-protected keys only, as Preview, and only with pre-wrapped keys/
    )
    expect(f.steps.find((s) => s.id === 'publish')!.params).toContain('protection level = SOFTWARE')
  })

  it('the candidate HPKE flows cite no classical claim', () => {
    expect(flowById('aws-hpke').claimIds).toEqual([])
    expect(flowById('azure-hpke').claimIds).toEqual([])
  })

  it('the HPKE seal step labels info and aad as the simulation\u2019s choice', () => {
    const seal = flowById('gcp-hpke').steps.find((s) => s.id === 'seal')!
    expect(seal.params.join(' | ')).toMatch(/info = empty \(simulation choice/)
    expect(seal.params.join(' | ')).toMatch(/aad = empty \(simulation choice\)/)
  })

  it('shows the ML-KEM key spec as the API value', () => {
    expect(flowById('aws-mlkem').steps.find((s) => s.id === 'public')!.params).toContain(
      'KeySpec = ML_KEM_768'
    )
  })

  it('states what the two AWS pages say about GovCloud FIPS endpoints, as plain text with no claim id', () => {
    expect(providerById('aws').note).toBe(
      'AWS\u2019s readiness page lists hybrid post-quantum key exchange for AWS KMS on FIPS and non-FIPS endpoints in commercial and US GovCloud Regions, while its AWS KMS infrastructure security page says hybrid post-quantum TLS is not supported on FIPS endpoints in AWS GovCloud (US). Check the current AWS pages for your Region before relying on post-quantum TLS there.'
    )
  })

  it('the AWS classical flow says the KMS key is ECC_NIST_P256 with an external origin', () => {
    const params = flowById('aws-classical').steps.find((s) => s.id === 'params')!.params
    expect(params).toContain('KMS key created with KeySpec = ECC_NIST_P256 and Origin = EXTERNAL')
  })

  it('HPKE Seal is shown as a key wrap and HPKE Open as a key unwrap, in that order, on a key object', () => {
    for (const id of ['aws-hpke', 'gcp-hpke', 'azure-hpke']) {
      const steps = flowById(id).steps
      const seal = steps.findIndex(
        (s) => s.apiName === 'C_WrapKeyAuthenticated (CKM_AES_GCM) = HPKE Seal'
      )
      const open = steps.findIndex(
        (s) => s.apiName === 'C_UnwrapKeyAuthenticated (CKM_AES_GCM) = HPKE Open'
      )
      expect(seal, id).toBeGreaterThanOrEqual(0)
      expect(open, id).toBeGreaterThan(seal)
      expect(steps[seal].params.join(' | '), id).toMatch(
        /hKey = the key to export \(an AES-256 key object/
      )
      expect(steps[seal].detail, id).toMatch(/never read out/)
      expect(steps[open].params.join(' | '), id).toMatch(/sensitive, non-extractable key object/)
    }
  })

  it('the AWS ML-KEM and hybrid flows wrap and unwrap a key object, and the secret is the only plaintext', () => {
    const kek = flowById('aws-mlkem').steps.find((s) => s.id === 'kek')!
    expect(kek.apiName).toMatch(/C_WrapKey \(CKM_AES_KEY_WRAP/)
    expect(kek.params.join(' | ')).toMatch(/key object in the partner HSM/)
    expect(kek.detail).toMatch(/Only the shared secret reached the application in plaintext/)
    expect(flowById('aws-hybrid').steps.find((s) => s.id === 'combine')!.detail).toMatch(
      /key object/
    )
  })

  it('the v3.3 text does not say the draft matches X-Wing and says it defines its own composition and no HPKE mechanism', () => {
    const v33 = ENGINES.find((e) => e.id === 'v33')!.standing
    expect(v33).not.toMatch(/\bmatch/i)
    expect(v33).toMatch(/defines CKM_COMP_KEM, a composite KEM, and no HPKE mechanism/)
    expect(v33).toMatch(/defines its own composition/)
    expect(v33).toMatch(/can still change/)
    expect(ENGINES.find((e) => e.id === 'candidate')!.standing).toMatch(
      /in neither PKCS#11 v3\.2 nor the v3\.3 draft/
    )
  })

  it('names three providers', () => {
    expect(PROVIDERS.map((p) => providerById(p.id).name)).toEqual([
      'AWS KMS',
      'Google Cloud KMS',
      'Azure Key Vault and Managed HSM',
    ])
  })
})
