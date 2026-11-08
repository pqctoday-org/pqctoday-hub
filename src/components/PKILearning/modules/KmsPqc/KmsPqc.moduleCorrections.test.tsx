// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- reads this module's own source files */
/**
 * Pins the November 2026 corrections to the KMS lesson's data, workshops and summaries.
 * Each check fails on the earlier wording.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { KMS_PROVIDERS } from './data/kmsProviderData'
import {
  HYBRID_COMBINER_MODES,
  KEY_SIZE_COMPARISONS,
  KMIP_OPERATIONS,
  KMIP_PQC_KEY_TYPES,
  KMIP_READINESS_CHECKLIST,
  KMIP_SYNC_SCENARIO,
  ENTERPRISE_SCENARIO,
} from './data/kmsConstants'
import { HybridKeyWrapping } from './workshop/HybridKeyWrapping'
import { KmsPqcExercises } from './components/KmsPqcExercises'
import manifest from './manifest'

const ROOT = process.cwd()
const MODULE_DIR = path.join(ROOT, 'src/components/PKILearning/modules/KmsPqc')
const read = (rel: string) => fs.readFileSync(path.join(MODULE_DIR, rel), 'utf-8')
const provider = (id: string) => KMS_PROVIDERS.find((p) => p.id === id)!
const flat = (v: unknown) => JSON.stringify(v).replace(/\s+/g, ' ')

describe('provider data', () => {
  it('AWS: ML-KEM keys with Regions, no non-FIPS-only TLS scope, scoped rotation, plaintext secret', () => {
    const aws = provider('aws-kms')
    const text = flat(aws)
    expect(text).toMatch(/Middle East \(UAE\) and Middle East \(Bahrain\)/)
    expect(text).not.toMatch(/non-FIPS endpoints across all AWS Regions/)
    expect(aws.notes).toContain(
      'AWS KMS supports hybrid post-quantum TLS that combines ECDH with ML-KEM on its service endpoints.'
    )
    expect(aws.autoRotationNote).toMatch(/symmetric encryption KMS keys/)
    expect(aws.autoRotationNote).toMatch(/ML-DSA and ML-KEM keys are not rotated automatically/)
    expect(aws.autoRotationNote).toMatch(/custom rotation period/)
    expect(aws.envelopeEncryptionModel).toMatch(/Decapsulate/)
    expect(aws.keyImportPath).toMatch(/RSA wrapping key/)
    expect(aws.keyImportPath).toMatch(/SM2 wrapping key is also offered in the China Regions/)
    // AWS KMS names the ML-DSA signing algorithm ML_DSA_SHAKE_256 for every ML-DSA key spec.
    expect(aws.apiPattern).toContain('--signing-algorithm ML_DSA_SHAKE_256')
    expect(aws.apiPattern).not.toMatch(/--signing-algorithm ML_DSA_(44|65|87)/)
  })

  it('Google: signing GA and key encapsulation launch stage kept apart; no validated-boundary claim', () => {
    const gcp = provider('gcp-kms')
    expect(gcp.launchStageNote).toMatch(/Signing: GA since 16 Jul 2026/)
    expect(gcp.launchStageNote).toMatch(/Preview in the Cloud KMS release notes/)
    expect(gcp.launchStageNote).toMatch(/GA in the 28 Jul 2026 blog post/)
    const text = flat(gcp)
    expect(text).not.toMatch(/BoringCrypto/)
    expect(gcp.fipsLevel).toMatch(/state no FIPS validation for them/)
    expect(gcp.keyImportPath).toMatch(/SHA-1 plus AES-KWP, or with SHA-256 with or without AES-KWP/)
    expect(text).toMatch(/hpke-kem-xwing-hkdf-sha256-aes-256-gcm/)
  })

  it('Azure: no hybrid claim, no wrap-key command, Premium FIPS platforms stated, BYOK mechanism named', () => {
    const azure = provider('azure-kv')
    const text = flat(azure)
    expect(text).not.toMatch(/wrap-key/)
    expect(azure.fipsLevel).toMatch(/Platform 1 keys are protected at FIPS 140-2 Level 2/)
    expect(azure.fipsLevel).toMatch(/Platform 2 keys at FIPS 140-3 Level 3/)
    expect(azure.keyImportPath).toMatch(/CKM_RSA_AES_KEY_WRAP/)
    expect(azure.notes).toMatch(/Microsoft-wide goal/)
    expect(azure.hybridSupport).toBe(false)
  })

  it('Vault: real transit API fields, a symmetric key for encryption, ML-DSA marked Enterprise', () => {
    const vault = provider('hashicorp-vault')
    expect(vault.apiPattern).toContain('type="ml-dsa"')
    expect(vault.apiPattern).toContain('parameter_set="65"')
    expect(vault.apiPattern).toContain('type="hybrid"')
    expect(vault.apiPattern).toContain('hybrid_key_type_pqc="ml-dsa"')
    expect(vault.apiPattern).not.toMatch(/ml-dsa-65|hybrid_algorithm/)
    expect(vault.apiPattern).toMatch(/aes256-gcm96/)
    expect(vault.envelopeEncryptionModel).toMatch(/cannot encrypt/)
    expect(vault.notes).toContain(
      "HashiCorp Vault's transit engine creates ML-DSA keys with type ml-dsa and a parameter_set of 44, 65 or 87."
    )
  })

  it('Thales: no ML-KEM key uploaded to AWS, no unsourced GA claim, RSA wrap named as classical', () => {
    const t = provider('thales-ciphertrust')
    const text = flat(t)
    expect(t.apiPattern).not.toMatch(/ML-KEM-768|upload-key|vault\/keys2|cckm\/aws/)
    expect(t.apiPattern).toMatch(/GetParametersForImport/)
    expect(t.apiPattern).toMatch(/RSAES_OAEP_SHA_256/)
    expect(t.apiPattern).toMatch(/does not make the RSA wrap/)
    expect(text).not.toMatch(/GA \(v2\.22\.0\+\)/)
    expect(t.pqcAlgorithms.kem.map((k) => k.status)).toEqual([
      'Technical preview since v2.20.0',
      'Technical preview since v2.21.0',
    ])
    expect(t.keyImportPath).toMatch(/wrap is classical/)
  })

  it('Fortanix: one status, and no unsourced API request shapes', () => {
    const f = provider('fortanix-dsm')
    const text = flat(f)
    expect(text).not.toMatch(/Planned/)
    expect(text).not.toMatch(/obj_type|pqc-central\/v1\/inventory|ENCAPSULATE/)
    expect(f.notes).toMatch(/PQC Central is a Key Insight discovery feature, not part of DSM/)
    expect(f.fipsLevel).toMatch(/FIPS 140-2 Level 3 \(CMVP #4139/)
    expect(f.fipsLevel).not.toMatch(/5555/)
    const tableValues = KMIP_PQC_KEY_TYPES.map((k) => k.providerSupport['fortanix-dsm'])
    expect(tableValues).not.toContain('Planned')
    expect(tableValues).not.toContain('Available')
  })
})

describe('constants', () => {
  it('KMS-wrap combiners put the ML-KEM secret first for the X25519 hybrid and say they are not the TLS group', () => {
    const x = HYBRID_COMBINER_MODES.find((m) => m.id === 'x25519-mlkem768')!
    expect(x.combiner).toBe('HKDF-SHA-256(mlkem_ss || x25519_ss, info="hybrid-kek")')
    expect(x.useCase).toMatch(/this module's own combiner/)
    expect(x.useCase).toMatch(/SP 800-227 Section 4\.6/)
    expect(x.useCase).toMatch(/different construction/)
    expect(x.useCase).not.toMatch(/as defined in RFC 10024/)
  })

  it('no hybrid mode pairs X25519 with ML-KEM-1024; the standard P-384 pairing replaces it', () => {
    expect(HYBRID_COMBINER_MODES.map((m) => m.name)).not.toContain('X25519 + ML-KEM-1024')
    const p384 = HYBRID_COMBINER_MODES.find((m) => m.id === 'p384-mlkem1024')!
    expect(p384.useCase).toMatch(/SecP384r1MLKEM1024/)
    expect(p384.useCase).toMatch(/MLKEM1024-P384/)
    expect(p384.useCase).toMatch(/RFC 10024 defines no X25519 \+ ML-KEM-1024 group/)
  })

  it('key-size table gives classical strength in bits, adds RSA-4096 and a realistic private-key size', () => {
    const rows = Object.fromEntries(KEY_SIZE_COMPARISONS.map((k) => [k.algorithm, k]))
    expect(rows['RSA-2048'].nistLevel).toMatch(/112/)
    expect(rows['RSA-3072'].nistLevel).toMatch(/128/)
    expect(rows['ECDSA P-256'].nistLevel).toMatch(/128/)
    expect(KEY_SIZE_COMPARISONS.some((k) => /Level 1 \(classical\)/.test(k.nistLevel))).toBe(false)
    expect(rows['RSA-4096'].publicKeyBytes).toBe(512)
    expect(rows['RSA-4096'].privateKeyBytes).toBeGreaterThan(2300)
  })

  it('NIST IR 8547 row covers key establishment and the federal dates', () => {
    const row = ENTERPRISE_SCENARIO.complianceDeadlines.find((d) => d.framework === 'NIST IR 8547')!
    expect(row.requirement).toMatch(/both signatures and key establishment/)
    expect(row.requirement).toMatch(/key establishment by 31 December 2030/)
    expect(row.requirement).toMatch(/digital signatures by 31 December 2031/)
  })

  it('AWS rotation feature is scoped to symmetric keys; Google imported keys are not auto-rotated', () => {
    const aws = ENTERPRISE_SCENARIO.kmsProviders.find((p) => p.id === 'aws-kms')!
    expect(aws.rotationFeature).not.toMatch(/Automatic annual rotation with CreateKey API/)
    expect(aws.rotationFeature).toMatch(/symmetric encryption KMS keys only/)
    expect(aws.pqcCapability).toMatch(/Middle East \(Bahrain\)/)
    const gcp = ENTERPRISE_SCENARIO.kmsProviders.find((p) => p.id === 'gcp-kms')!
    expect(gcp.rotationFeature).toMatch(/imported keys have automatic rotation disabled by default/)
  })

  it('KMIP examples use real operation names and lifecycle, and mark 3.0 as a draft', () => {
    const rotate = KMIP_OPERATIONS.find((o) => o.id === 'rotate')!
    expect(rotate.kmipXml).toContain('<Operation>ReKeyKeyPair</Operation>')
    expect(rotate.kmipXml).not.toMatch(/<Operation>ReKey<\/Operation>/)
    expect(rotate.description).toMatch(/KMIP has no Rotate operation/)
    const wrap = KMIP_OPERATIONS.find((o) => o.id === 'wrap')!
    expect(wrap.description).toMatch(/An ML-KEM key is not used this way/)
    expect(wrap.description).toMatch(/Encapsulate and Decapsulate/)
    const destroy = KMIP_OPERATIONS.find((o) => o.id === 'destroy')!
    expect(destroy.kmipXml).toMatch(/Revoke the Active object/)
    expect(destroy.description).toMatch(/Pre-Active or Deactivated/)
    expect(destroy.description).not.toMatch(/Most providers enforce a waiting period \(7-30 days\)/)
    const activate = KMIP_OPERATIONS.find((o) => o.id === 'activate')!
    expect(activate.description).not.toMatch(
      /AWS auto-activates; others require explicit activation/
    )
    expect(KMIP_SYNC_SCENARIO.find((s) => s.action === 'rotate')!.kmipSnippet).toMatch(
      /ReKeyKeyPair/
    )
    const server = KMIP_READINESS_CHECKLIST.find((c) => c.id === 'server-version')!
    expect(server.title).toMatch(/draft/)
    expect(server.description).toMatch(/Committee Specification Draft/)
  })

  it('KMIP examples carry the real Vault fields and no unsourced Thales REST shapes', () => {
    const all = flat(KMIP_OPERATIONS)
    expect(all).not.toMatch(/type=\\"ml-dsa-65\\"|vault\/keys2|"algorithm": "ML-KEM-768"/)
    for (const op of KMIP_OPERATIONS) {
      expect(op.providerApis['thales-ciphertrust'].code).toMatch(/not reproduced here/)
      expect(op.providerApis['hashicorp-vault'].code).not.toMatch(/pqc-root-kek/)
    }
    const vaultWrap = KMIP_OPERATIONS.find((o) => o.id === 'wrap')!.providerApis['hashicorp-vault']
    expect(vaultWrap.code).toMatch(/aes-kek/)
  })

  it('the AWS rotate example no longer pairs automatic rotation with an ML-DSA key', () => {
    const aws = KMIP_OPERATIONS.find((o) => o.id === 'rotate')!.providerApis['aws-kms'].code
    expect(aws).toMatch(/symmetric encryption keys only/)
    expect(aws).not.toMatch(/Automatic rotation \(annual\)/)
  })
})

describe('HybridKeyWrapping explorer', () => {
  it('shows the AWS ML-KEM flow, says where the secret sits, and offers no Azure wrap-key command', () => {
    render(<HybridKeyWrapping />)
    fireEvent.click(screen.getByRole('button', { name: 'PQC Only' }))
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/aws kms decapsulate/)
    expect(text).toMatch(/Decapsulate returns the 32-byte ML-KEM shared secret in plaintext/)
    fireEvent.click(screen.getByRole('button', { name: 'Classical Only' }))
    // AWS rejects an alias in GetParametersForImport, so the example must use a key ID.
    expect(document.body.textContent).toMatch(/aws kms get-parameters-for-import/)
    expect(document.body.textContent).not.toMatch(/alias\/imported-key/)
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    expect(document.body.textContent).toMatch(/derive-shared-secret/)
    expect(document.body.textContent).toMatch(/AWS KMS has no native hybrid key spec/)
    fireEvent.click(screen.getByRole('button', { name: /Azure Key Vault/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Classical Only' }))
    expect(document.body.textContent).not.toMatch(/wrap-key/)
    expect(document.body.textContent).toMatch(/CKM_RSA_AES_KEY_WRAP/)
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    expect(document.body.textContent).not.toMatch(
      /RSA \+ AES-256 dual wrapping|unwrap requires both/
    )
    expect(document.body.textContent).toMatch(/no post-quantum\/traditional hybrid mode/)
  })

  it('splits the Google status note and explains the TLS group difference', () => {
    render(<HybridKeyWrapping />)
    fireEvent.click(screen.getByRole('button', { name: /^Cloud KMS/ }))
    const t = document.body.textContent ?? ''
    expect(t).toMatch(/Signing: GA since 16 Jul 2026/)
    expect(t).toMatch(/is a different construction/)
    expect(t).toMatch(/KMS-wrap combiner of this module/)
    const row = within(screen.getByRole('table')).getByRole('row', { name: /^ECDH P-384/ })
    expect(row).toHaveTextContent('97 + 1,568 = 1,665 bytes ciphertext')
  })
})

describe('guided exercises', () => {
  it('adds the partner-HSM-to-AWS exercise and no longer calls one hybrid the FIPS choice', () => {
    render(
      <MemoryRouter>
        <KmsPqcExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const t = document.body.textContent ?? ''
    expect(t).toMatch(/Partner HSM to AWS KMS: Which Path Is Quantum-Safe\?/)
    expect(t).toMatch(/A partner HSM must deliver an AES key to AWS KMS/)
    expect(t).not.toMatch(/FIPS-compliant environments should prefer P-256\+ML-KEM-768/)
    expect(t).toMatch(/P-256 \+ ML-KEM-768 is not the only hybrid that suits a FIPS environment/)
    expect(t).toMatch(
      /while the Cloud KMS release notes list ML-KEM and X-Wing as Preview since 23 September 2025/
    )
    expect(t).toMatch(/500 keys and certificates/)
    expect(t).not.toMatch(/X25519\+ML-KEM-1024/)
  })
})

describe('summaries and neighbouring files', () => {
  it('rag-summary metadata agrees with the manifest and lists every workshop step', () => {
    const rag = read('rag-summary.md')
    const front = rag.split('---')[1]
    expect(front).toContain(`duration: ${manifest.duration}`)
    expect(front).toContain(`track: ${manifest.track}`)
    const steps = Number(/workshop_steps: (\d+)/.exec(front)![1])
    expect(steps).toBeGreaterThanOrEqual(manifest.workshopSteps!.length)
    const listed = rag.split('## Workshop')[1].split('## Key Standards')[0]
    expect((listed.match(/^\d+\. /gm) ?? []).length).toBe(steps)
    expect(rag).toMatch(/KMIP v3\.0 \(Committee Specification Draft 02/)
    expect(rag).toMatch(/ECDH P-384\+ML-KEM-1024/)
    expect(rag).not.toMatch(/duration: 90 min|workshop_steps: 5|track: Infrastructure/)
  })

  it('the Playground key-wrap panel states AWS import is RSA only and Google has a Preview HPKE import', () => {
    const src = fs
      .readFileSync(
        path.join(ROOT, 'src/components/Playground/hsm/symmetric/KeyWrapPanel.tsx'),
        'utf-8'
      )
      .replace(/\s+/g, ' ')
    expect(src).not.toMatch(/ML-DSA signing announced/)
    expect(src).toMatch(
      /ML-DSA in FIPS mode on hsm2m\.medium since 1 Sep 2026 \(FIPS mode is an operating mode/
    )
    expect(src).toMatch(/AWS KMS import uses an RSA wrapping key/)
    expect(src).toMatch(/Quantum-safe key import with HPKE is in Preview since 6 Aug 2026/)
    expect(src).not.toMatch(/NOT wired into BYOK import flow/)
    expect(src).toMatch(/the 28 Jul 2026 blog post says GA/)
  })

  it('the rotation planner no longer gives Azure Key Vault a 2029 target date', () => {
    const src = read('workshop/KmsRotationPlanner.tsx').replace(/\s+/g, ' ')
    expect(src).not.toMatch(/Migrate Azure Key Vault to native PQC \(target 2029\)/)
    expect(src).toMatch(/2029 is a Microsoft-wide goal, not a Key Vault date/)
  })

  it('the KMIP explorer calls 3.0 a draft and the hierarchy table explains its two security scales', () => {
    const kmip = read('workshop/KmipProtocolExplorer.tsx').replace(/\s+/g, ' ')
    expect(kmip).toMatch(/Committee Specification Draft 02, 7 May 2026/)
    expect(kmip).toMatch(/KMIP v3\.0 \(draft\) XML/)
    const h = read('workshop/KeyHierarchyDesigner.tsx').replace(/\s+/g, ' ')
    expect(h).toMatch(/classical rows: approximate bits; PQC rows: NIST category/)
    expect(h).not.toMatch(/privKey: 2048 \}, \/\/ RSA-4096/)
  })
})
