// SPDX-License-Identifier: AGPL-3.0-only
/**
 * AWS KMS claim invariants (outside the KMS lesson).
 *
 * Each BANNED check is a sentence the site used to teach that AWS's own pages
 * contradict (AWS KMS has ML-KEM keys since October 2026, ML-DSA keys since
 * June 2025; CloudHSM documents ML-DSA but no ML-KEM; no policy condition can
 * require post-quantum TLS; TLS hybrid groups are not HPKE; AWS lists hybrid PQ
 * TLS on FIPS endpoints too). Each REQUIRED check pins a corrected sentence
 * verbatim, so the wording a citation is matched on cannot drift.
 *
 * The KMS lesson's own files (modules/KmsPqc/) are owned and tested elsewhere.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const MODULES = path.join(ROOT, 'src/components/PKILearning/modules')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'KmsPqc') continue
      walk(p, out)
    } else if (/\.(tsx?|md)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}

const EXTRA = [
  'src/components/FAQ/faqData.ts',
  'src/data/stepExercises.ts',
  'src/data/personaBlocks.ts',
  'src/data/glossary/concepts.json',
  'src/data/module-topic-summaries.md',
].map((f) => path.join(ROOT, f))

const SHIPPED: string[] = [...walk(MODULES), ...EXTRA]

/** Collapse JSX line wrapping so a sentence is matched however Prettier wrapped it. */
function flat(file: string): string {
  return fs.readFileSync(file, 'utf-8').replace(/\s+/g, ' ')
}

const read = (rel: string): string => flat(path.join(ROOT, rel))

/** [pattern, why it is wrong] */
const BANNED: Array<[RegExp, string]> = [
  [
    /AWS KMS (offers|has|creates) no ML-KEM keys|AWS KMS[^.]{0,80}but no ML-KEM keys/i,
    'AWS KMS has offered ML-KEM keys since October 2026',
  ],
  [
    /AWS KMS's ML-KEM key agreement is in preview/i,
    'AWS KMS ML-KEM keys are generally available, not a preview',
  ],
  [/AWS KMS PQC preview available/i, 'AWS KMS ML-DSA and ML-KEM keys are generally available'],
  [
    /Plan ML-DSA \/ ML-KEM key generation once the KMS adds support/i,
    'AWS KMS already offers both key families',
  ],
  [
    /when AWS KMS adds GA support, roadmap 2026/i,
    'AWS KMS has offered ML-DSA key specs since June 2025',
  ],
  [/AWS KMS key policy that enforces hybrid PQC/i, 'no policy condition can require PQ TLS'],
  [
    /hybrid ML-KEM planned via HPKE|Hybrid TLS \(X25519\+ML-KEM\) for Vault API . via HPKE/i,
    'TLS hybrid groups are RFC 10024 / RFC 9954 key-exchange groups, not HPKE',
  ],
  [
    /\(non-FIPS endpoints, April 2025|\(non-FIPS, April 2025\)|ML-KEM key agreement in non-FIPS endpoints|hybrid ML-KEM TLS on its non-FIPS endpoints|key agreement on Secrets Manager's non-FIPS endpoints/i,
    'AWS lists hybrid post-quantum key exchange on FIPS endpoints too',
  ],
  [
    /Thales \(Luna\), Entrust \(nShield\), Utimaco, and AWS CloudHSM have announced or delivered PQC algorithm support including ML-KEM/i,
    'AWS CloudHSM documents ML-DSA but no ML-KEM command',
  ],
  [
    /All use an RSA-3072 or ECDH wrapping key for key import/i,
    'AWS KMS import wrapping is RSA only; Azure uses CKM_RSA_AES_KEY_WRAP; Google has HPKE import',
  ],
  [
    /Encapsulate and Decapsulate are not available in China Regions/i,
    'ML-KEM keys are also unavailable in Middle East (UAE) and Middle East (Bahrain)',
  ],
  [
    /\(AWS KMS creates ML-KEM keys, but its import wrapping keys are RSA only\) to generate ML-KEM-1024 key wrapping keys\. Establish KMIP v2 connectivity/i,
    'AWS KMS has no KMIP endpoint, and its ML-KEM keys only Encapsulate and Decapsulate',
  ],
  [
    /not documented in the Vault pages read here|no hybrid ML-KEM group documented for Vault/i,
    'the Vault 1.19.4 and 1.20.0 changelogs list X25519MLKEM768 in the Go TLS stack',
  ],
  [
    /documentation history entry dated 23 October 2026|documentation entry dated 23 October 2026|ML_KEM_1024, from 23 October 2026/i,
    'one launch date for AWS KMS ML-KEM keys: 26 October 2026 (the AWS announcement)',
  ],
  [
    /Azure Key Vault KMIP v2\.1|Azure Key Vault with KMIP v2\.1 connectivity/i,
    'no held Azure page documents a KMIP endpoint; the provider table lists none',
  ],
  [
    /the AWS KMS security page excludes/i,
    'name the page (Infrastructure security in AWS KMS) and say what each AWS page says',
  ],
]

/** [library id, sentence verbatim (as the citation step matches it), file] */
const VERBATIM: Array<[string, string, string]> = [
  [
    'AWS-KMS-Post-Quantum-Keys',
    'AWS KMS offers ML-DSA signing keys (ML_DSA_44, ML_DSA_65, ML_DSA_87) and ML-KEM key-establishment keys (ML_KEM_512, ML_KEM_768, ML_KEM_1024).',
    'src/data/stepExercises.ts',
  ],
  [
    'AWS-KMS-ML-KEM-Launch-2026-10',
    'AWS added ML-KEM keys to AWS KMS on 26 October 2026; they are not available in the China, Middle East (UAE) and Middle East (Bahrain) Regions.',
    'src/components/PKILearning/modules/SecretsManagementPQC/components/SecretsManagementIntroduction.tsx',
  ],
  [
    'AWS-KMS-Import-Wrapping-Keys',
    'AWS KMS imports key material only under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096) and cannot import key material into ML-DSA or ML-KEM KMS keys.',
    'src/components/PKILearning/modules/SecretsManagementPQC/components/SecretsManagementIntroduction.tsx',
  ],
  [
    'AWS-KMS-Import-Wrapping-Keys',
    'AWS KMS imports key material only under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096) and cannot import key material into ML-DSA or ML-KEM KMS keys.',
    'src/data/glossary/concepts.json',
  ],
  [
    'AWS-KMS-Import-Wrapping-Keys',
    'AWS KMS imports key material only under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096) and cannot import key material into ML-DSA or ML-KEM KMS keys.',
    'src/components/PKILearning/modules/DatabaseEncryptionPQC/data/databaseConstants.ts',
  ],
  [
    'AWS-KMS-API-Decapsulate',
    'AWS KMS Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
    'src/components/PKILearning/modules/DatabaseEncryptionPQC/data/databaseConstants.ts',
  ],
  [
    'AWS-PQ-Readiness-Confidentiality',
    'AWS lists hybrid post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS Payment Cryptography and the AWS CloudHSM control plane.',
    'src/components/PKILearning/modules/HybridCrypto/components/HybridCryptoIntroduction.tsx',
  ],
  [
    'Azure-Key-Vault-BYOK-Specification',
    'Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key exchange key of 2048, 3072 or 4096 bits.',
    'src/data/glossary/concepts.json',
  ],
  [
    'Google-Cloud-KMS-Quantum-Safe-Key-Import',
    'Google Cloud KMS quantum-safe key import, in Preview since 6 August 2026, wraps imported key material with HPKE using X-Wing, ML-KEM-768 or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM.',
    'src/data/glossary/concepts.json',
  ],
  [
    'Google-Cloud-KMS-Key-Import',
    'Google Cloud KMS key import wraps key material for transfer, with RSA-based import methods alongside the quantum-safe HPKE methods.',
    'src/data/glossary/concepts.json',
  ],
]

describe('AWS KMS claim invariants', () => {
  it('scans a non-trivial set of shipped files', () => {
    expect(SHIPPED.length).toBeGreaterThan(200)
  })

  for (const [re, why] of BANNED) {
    it(`no shipped file matches ${re} (${why})`, () => {
      const hits = SHIPPED.filter((f) => re.test(flat(f))).map((f) => path.relative(ROOT, f))
      expect(hits).toEqual([])
    })
  }

  for (const [id, sentence, file] of VERBATIM) {
    it(`${id}: the cited sentence stays verbatim in ${path.basename(file)}`, () => {
      expect(read(file)).toContain(sentence)
    })
  }

  it('the FAQ separates AWS CloudHSM (ML-DSA, no ML-KEM) from the vendors with ML-KEM', () => {
    const faq = read('src/components/FAQ/faqData.ts')
    expect(faq).toContain(
      'AWS CloudHSM documents ML-DSA key generation and signing (in FIPS mode on hsm2m.medium clusters from 1 September 2026) but no ML-KEM command.'
    )
  })

  it('the KMS persona block says a policy restricts key specs and cannot require PQ TLS', () => {
    const persona = read('src/data/personaBlocks.ts')
    expect(persona).toContain(
      'write an AWS KMS policy that restricts key specs and key usage; no policy condition can require post-quantum TLS, which is a client setting.'
    )
  })

  it('the topic summaries say AWS KMS has ML-KEM key specs, and no KMIP endpoint in the database step', () => {
    const summaries = read('src/data/module-topic-summaries.md')
    expect(summaries).toContain('AWS KMS ML-DSA signing keys and ML-KEM key specs')
    expect(summaries).toContain(
      'AWS KMS offers ML-KEM keys whose Decapsulate returns the shared secret to the caller, with RSA-only import wrapping and no KMIP endpoint'
    )
    expect(summaries).toContain('a key spec AWS KMS has offered since June 2025')
    const dbRag = read('src/components/PKILearning/modules/DatabaseEncryptionPQC/rag-summary.md')
    expect(dbRag).toContain('AWS KMS has no KMIP endpoint')
  })

  it('the hybrid-TLS passages name the GovCloud and China edges instead of saying "non-FIPS only"', () => {
    const intro = read(
      'src/components/PKILearning/modules/HybridCrypto/components/HybridCryptoIntroduction.tsx'
    )
    expect(intro).toContain(
      'AWS pages differ on the edges, so check the endpoint and Region you use'
    )
    expect(intro).toContain(
      'lists FIPS and non-FIPS endpoints in commercial and US GovCloud Regions as launched'
    )
    expect(intro).toContain(
      'page says AWS KMS supports hybrid post-quantum TLS in all Regions except the China Regions and does not support it on AWS GovCloud (US) FIPS endpoints'
    )
    expect(intro).toContain(
      'docs.aws.amazon.com/kms/latest/developerguide/infrastructure-security.html'
    )
    const rag = read('src/components/PKILearning/modules/HybridCrypto/rag-summary.md')
    expect(rag).toContain(
      'supports hybrid post-quantum TLS in all Regions except the China Regions and does not support it on AWS GovCloud (US) FIPS endpoints'
    )
  })

  it('the Vault TLS rows do not attribute TLS hybrid groups to HPKE', () => {
    const intro = read(
      'src/components/PKILearning/modules/SecretsManagementPQC/components/SecretsManagementIntroduction.tsx'
    )
    expect(intro).toContain('defined in RFC 10024 and RFC 9954, not by HPKE (RFC 9180)')
    expect(intro).toContain(
      'the Vault 1.19.4 and 1.20.0 changelogs list X25519MLKEM768 key agreement in the Go TLS stack'
    )
    const constants = read(
      'src/components/PKILearning/modules/SecretsManagementPQC/data/secretsConstants.ts'
    )
    expect(constants).toContain('TLS hybrid groups come from RFC 10024 and RFC 9954, not HPKE')
    expect(constants).toContain(
      'the Vault 1.19.4 and 1.20.0 changelogs list X25519MLKEM768 in the Go TLS stack'
    )
  })

  it('the cloud responsibility matrix and CBOM template no longer wait for AWS KMS support', () => {
    const matrix = read(
      'src/components/PKILearning/modules/CryptoMgmtModernization/components/CloudResponsibilityMatrix.tsx'
    )
    expect(matrix).toContain('where your KMS already offers them (AWS KMS does)')
    const cbom = read('src/components/PKILearning/modules/CryptoAgility/data/cbomTemplates.ts')
    expect(cbom).toContain('Decapsulate returns the shared secret to your application')
  })
})
