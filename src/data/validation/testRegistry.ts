// SPDX-License-Identifier: GPL-3.0-only
/**
 * testRegistry — the machine-readable TEST inventory the coverage matrix joins
 * against the capability inventory (plan WS-C C-2). Static on purpose: the
 * runners are not rewritten or instrumented; each entry below was written by
 * reading the runner code it names, and says which PKCS #11 capability cell
 * (mechanism × operation × parameter set × sign variant) each case exercises,
 * on which engines, with which evidence class and polarity.
 *
 * Rules for editing:
 *  - A case backed by a vector file uses the vector-manifest caseId; the
 *    generator fails when the case is missing, quarantined, or when the
 *    evidence class / polarity written here differ from the manifest.
 *  - Inputs that are not in the manifest (key pairs generated at run time,
 *    inline literals) use `local:<test-id>/<n>` and state their class here.
 *  - Never register a capability a case does not actually drive. Key import
 *    via C_CreateObject is not a mechanism operation and is not listed.
 *  - A round-trip's key generation IS listed (its output is consumed), as
 *    functional-round-trip evidence for the key-generation cell.
 *
 * katRunner cases carry their `katKind`, the join key the Algorithms KAT view
 * and the Learn panels use to find a spec's evidence record, so a case shows
 * the same class and source wherever it runs. suci-profile-b steps 1–2 (key
 * import only) exercise no mechanism and are not registered.
 *
 * Engines: useAcvpSuite and the conformance runners drive the C++ and Rust
 * engines (dual mode). katRunner is driven by KATView (/algorithms) and
 * KatValidationPanel (Learn) through useHSM(), whose default — used by both —
 * is the Rust engine.
 */
import manifestJson from './vector-manifest.json'
import inventoryJson from './mechanism-inventory.generated.json'
import {
  expandErrorPathCases,
  probeKind,
  type InventoryMechLike,
} from '../../wasm/pkcs11ConformanceRunner/errorPathCatalog'
import sha256V from '../acvp/sha256_test.json'
import sha384V from '../acvp/sha384_test.json'
import sha512V from '../acvp/sha512_test.json'
import sha3_256V from '../acvp/sha3_256_test.json'
import sha3_512V from '../acvp/sha3_512_test.json'
import type { EvidenceClassId } from './evidenceClasses'
import type { CaseRecord, ValidationCaseManifest } from './validationCaseManifest'
import type {
  CapabilityRef,
  KatKindRef,
  CaseExercise,
  CaseParams,
  DeclaredPolarity,
  EngineId,
  RegisteredCase,
  RegisteredTest,
} from './coverageModel'

const manifest = manifestJson as unknown as ValidationCaseManifest

const BOTH: EngineId[] = ['cpp', 'rust']
const RUST: EngineId[] = ['rust']

const NIST: EvidenceClassId = 'nist-acvp-reference-sample'
const STD: EvidenceClassId = 'published-standard-kat'
const ORACLE: EvidenceClassId = 'independent-oracle'
const RT: EvidenceClassId = 'functional-round-trip'
const PROBE: EvidenceClassId = 'product-mechanism-probe'
const OASIS: EvidenceClassId = 'oasis-profile-case'

/** One exercised capability cell. */
const x = (
  mechanism: string,
  operation: string,
  parameterSet?: string,
  variant?: string,
  extra?: Omit<CaseExercise, 'capability'>
): CaseExercise => ({
  capability: { mechanism, operation, parameterSet, variant } satisfies CapabilityRef,
  ...extra,
})

const manifestCase = (caseId: string): CaseRecord => {
  const fileId = caseId.split('#')[0]
  const c = manifest.files.find((f) => f.id === fileId)?.cases.find((k) => k.caseId === caseId)
  if (!c) throw new Error(`testRegistry: ${caseId} is not in vector-manifest.json`)
  return c
}

const casesOf = (fileId: string, pointerPrefix = ''): CaseRecord[] => {
  const f = manifest.files.find((k) => k.id === fileId)
  if (!f) throw new Error(`testRegistry: vector file ${fileId} is not in vector-manifest.json`)
  return f.cases.filter((c) => c.pointer.startsWith(pointerPrefix))
}

/** A registered case backed by a manifest case. */
const mc = (
  caseId: string,
  evidenceClass: EvidenceClassId,
  polarity: DeclaredPolarity,
  exercises: CaseExercise[],
  rowId?: string,
  instance?: string
): RegisteredCase => ({
  caseId,
  evidenceClass,
  polarity,
  exercises,
  ...(rowId ? { rowId } : {}),
  ...(instance ? { instance } : {}),
})

/** A registered case whose inputs are not in the manifest. */
const lc = (
  testId: string,
  n: string,
  evidenceClass: EvidenceClassId,
  polarity: DeclaredPolarity,
  exercises: CaseExercise[],
  opts: {
    rowId?: string
    parameters?: CaseParams
    note?: string
    source?: RegisteredCase['source']
  } = {}
): RegisteredCase => ({
  caseId: `local:${testId}/${n}`,
  evidenceClass,
  polarity,
  exercises,
  ...opts,
})

const param = (c: CaseRecord, k: string): string => String(c.parameters[k]) // eslint-disable-line security/detect-object-injection

/** ACVP / hub hash spellings → the CKM_HASH_ML_DSA_<suffix> PKCS #11 v3.2 §6.67.7 defines. */
const HASH_SUFFIX: Record<string, string> = {
  'sha2-224': 'SHA224',
  sha224: 'SHA224',
  'sha2-256': 'SHA256',
  sha256: 'SHA256',
  'sha2-384': 'SHA384',
  sha384: 'SHA384',
  'sha2-512': 'SHA512',
  sha512: 'SHA512',
  'sha3-224': 'SHA3_224',
  'sha3-256': 'SHA3_256',
  'sha3-384': 'SHA3_384',
  'sha3-512': 'SHA3_512',
  'shake-128': 'SHAKE128',
  shake128: 'SHAKE128',
  'shake-256': 'SHAKE256',
  shake256: 'SHAKE256',
}
const hashMech = (family: 'ML_DSA' | 'SLH_DSA', hashAlg: string): string => {
  const s = HASH_SUFFIX[hashAlg.toLowerCase()]
  if (!s) throw new Error(`testRegistry: no CKM_HASH_${family} mechanism for ${hashAlg}`)
  return `CKM_HASH_${family}_${s}`
}
const hashMlDsaMech = (hashAlg: string): string => hashMech('ML_DSA', hashAlg)
/** The mechanism an ML-DSA manifest case drives (mirrors sections/mldsaAcvp.ts mechFor()). */
const mldsaMech = (c: CaseRecord): string =>
  c.parameters.externalMu === true
    ? 'CKM_ML_DSA_EXTERNAL_MU'
    : c.parameters.preHash === 'preHash'
      ? hashMlDsaMech(param(c, 'hashAlg'))
      : 'CKM_ML_DSA'
/** The mechanism an SLH-DSA manifest case drives (mirrors sections/slhdsaAcvp.ts mechFor()). */
const slhdsaMech = (c: CaseRecord): string =>
  c.parameters.preHash === 'preHash' ? hashMech('SLH_DSA', param(c, 'hashAlg')) : 'CKM_SLH_DSA'
/** Manifest `contextBytes` / `messageBytes` of a case, for product-authored cases derived from it. */
const lengthsOf = (c: CaseRecord): CaseParams => ({
  contextBytes: Number(param(c, 'contextBytes')),
  messageBytes: Number(param(c, 'messageBytes')),
})

const upstreamIds = (c: CaseRecord) => `tg${c.upstream?.tgId ?? '?'}-tc${c.upstream?.tcId ?? '?'}`

/** WS-E: ACVP hashAlg → CKM_<hash>_HMAC_GENERAL (mirrors sections/hmacAcvp.ts). */
const HMAC_GENERAL: Record<string, string> = {
  'SHA-1': 'CKM_SHA_1_HMAC_GENERAL',
  'SHA2-224': 'CKM_SHA224_HMAC_GENERAL',
  'SHA2-256': 'CKM_SHA256_HMAC_GENERAL',
  'SHA2-384': 'CKM_SHA384_HMAC_GENERAL',
  'SHA2-512': 'CKM_SHA512_HMAC_GENERAL',
  'SHA2-512/224': 'CKM_SHA512_224_HMAC_GENERAL',
  'SHA2-512/256': 'CKM_SHA512_256_HMAC_GENERAL',
  'SHA3-224': 'CKM_SHA3_224_HMAC_GENERAL',
  'SHA3-256': 'CKM_SHA3_256_HMAC_GENERAL',
  'SHA3-384': 'CKM_SHA3_384_HMAC_GENERAL',
  'SHA3-512': 'CKM_SHA3_512_HMAC_GENERAL',
}
/** WS-E: ACVP hashAlg → CKM_ECDSA_<hash> (mirrors sections/ecSigVerAcvp.ts). */
const ECDSA_MECH: Record<string, string> = {
  'SHA2-256': 'CKM_ECDSA_SHA256',
  'SHA2-512': 'CKM_ECDSA_SHA512',
  'SHA3-256': 'CKM_ECDSA_SHA3_256',
  'SHA3-512': 'CKM_ECDSA_SHA3_512',
}
/** Curves in the capability map's EC parameter-set group (P-224 is not one). */
const EC_DECLARED = new Set(['P-256', 'P-384', 'P-521', 'secp256k1'])
const hashSlug = (h: string) => h.toLowerCase().replace('/', '-')
/** WS-E: ACVP hashAlg → CKM_<hash> digest (mirrors sections/shaAcvp.ts). */
const DIGEST_MECH: Record<string, string> = {
  'SHA2-224': 'CKM_SHA224',
  'SHA2-256': 'CKM_SHA256',
  'SHA2-384': 'CKM_SHA384',
  'SHA2-512': 'CKM_SHA512',
  'SHA2-512/224': 'CKM_SHA512_224',
  'SHA2-512/256': 'CKM_SHA512_256',
  'SHA3-224': 'CKM_SHA3_224',
  'SHA3-256': 'CKM_SHA3_256',
  'SHA3-384': 'CKM_SHA3_384',
  'SHA3-512': 'CKM_SHA3_512',
}
const eddsaScheme = (curve: string, preHash: boolean) =>
  `${curve === 'ED-25519' ? 'Ed25519' : 'Ed448'}${preHash ? 'ph' : ''}`

/** P5: ACVP hashAlg → CKM_ECDSA_<hash> for the sigGen verify-back rows (mirrors sections/ecKeyVerSigGenAcvp.ts). */
const ECDSA_SIGGEN_MECH: Record<string, string> = {
  'SHA2-224': 'CKM_ECDSA_SHA224',
  'SHA2-256': 'CKM_ECDSA_SHA256',
  'SHA2-384': 'CKM_ECDSA_SHA384',
  'SHA2-512': 'CKM_ECDSA_SHA512',
  'SHA3-224': 'CKM_ECDSA_SHA3_224',
  'SHA3-256': 'CKM_ECDSA_SHA3_256',
  'SHA3-384': 'CKM_ECDSA_SHA3_384',
  'SHA3-512': 'CKM_ECDSA_SHA3_512',
}
const edCurve = (curve: string) => (curve === 'ED-25519' ? 'Ed25519' : 'Ed448')
/** P5: ACVP KDF 1.0 kdfMode → PKCS#11 KBKDF mechanism (mirrors sections/kdfDeriveAcvp.ts). */
const KBKDF_MECH: Record<string, string> = {
  counter: 'CKM_SP800_108_COUNTER_KDF',
  feedback: 'CKM_SP800_108_FEEDBACK_KDF',
  'double pipeline iteration': 'CKM_SP800_108_DOUBLE_PIPELINE_KDF',
}
const NOBLE_CURVES = {
  citation:
    '@noble/curves 2.x (package.json dependency) p256/p384/p521 ECDSA verify over a @noble/hashes digest, FIPS 186-5 §6.4.2',
  url: 'https://github.com/paulmillr/noble-curves',
}

const MLDSA_SETS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const
const MLKEM_SETS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'] as const
const SLH_SETS = [
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-256s',
  'SLH-DSA-SHAKE-256f',
] as const

/** P5: the "f" SLH-DSA sets the product-authored sign rows run on (mirrors sections/slhdsaCoverage.ts). */
const SLH_F_SETS = SLH_SETS.filter((ps) => ps.endsWith('f'))

/** P5: independent verifier the hedged-sign oracle rows use. */
const NOBLE_PQ = {
  citation:
    '@noble/post-quantum 0.7.1 (package.json dependency) — ml_dsa / slh_dsa verify, FIPS 204 Algorithm 3 / FIPS 205 Algorithm 24',
  url: 'https://github.com/paulmillr/noble-post-quantum',
}

/** P5: hedged-sign rows at the context extremes for one parameter set (sections/mldsaNegBoundary.ts, slhdsaCoverage.ts). */
const hedgedCases = (
  testId: string,
  rowPrefix: string,
  signMech: string,
  ps: string,
  messageBytes: number
): RegisteredCase[] =>
  (['ctx0', 'ctx255'] as const).flatMap((ext) => {
    const parameters = { contextBytes: ext === 'ctx0' ? 0 : 255, messageBytes }
    return [
      lc(
        testId,
        `${ps}-${ext}-rt`,
        RT,
        'positive',
        [x(signMech, 'sign', ps, 'hedged'), x(signMech, 'verify', ps)],
        {
          rowId: `${rowPrefix}-hedged-${ext}-rt-${ps}-{engine}`,
          parameters,
          note: 'CKH_HEDGE_REQUIRED signature over the NIST key material, verified by the same engine with the NIST public key.',
        }
      ),
      lc(testId, `${ps}-${ext}-oracle`, ORACLE, 'positive', [x(signMech, 'sign', ps, 'hedged')], {
        rowId: `${rowPrefix}-hedged-${ext}-oracle-${ps}-{engine}`,
        parameters,
        source: NOBLE_PQ,
        note: 'The same hedged signature verified by an independent implementation: agreement with that oracle for this case, not a NIST expected value; the signing randomness is not checked.',
      }),
      lc(
        testId,
        `${ps}-${ext}-neg`,
        PROBE,
        'negative',
        [x(signMech, 'sign', ps, 'hedged'), x(signMech, 'verify', ps)],
        {
          rowId: `${rowPrefix}-hedged-${ext}-neg-${ps}-{engine}`,
          parameters,
          note: `The hedged signature verified with the ${ext === 'ctx0' ? 'message last bit flipped' : 'context byte 0 flipped'}; asserts CKR_SIGNATURE_INVALID (PQC Today-authored mutation).`,
        }
      ),
    ]
  })

// ── useAcvpSuite (src/components/Playground/hsm/acvp/useAcvpSuite.ts) ───────

const ACVP = 'useAcvpSuite' as const
const acvp = (
  id: string,
  ref: string,
  title: string,
  cases: RegisteredCase[],
  note?: string
): RegisteredTest => ({
  id: `acvp.${id}`,
  runner: ACVP,
  ref,
  title,
  engines: BOTH,
  cases,
  ...(note ? { note } : {}),
})

interface DigestVectors {
  testGroups: { tests: { tcId: number }[] }[]
}
/** Row ids use the vector file's own (renumbered) tcId, not the upstream one. */
const digestCases = (fileId: string, vectors: DigestVectors, mech: string, prefix: string) =>
  casesOf(fileId, '/testGroups/0/tests/').map((c) => {
    const i = Number(c.pointer.split('/').pop())
    const tcId = vectors.testGroups[0].tests[i]?.tcId // eslint-disable-line security/detect-object-injection
    return mc(c.caseId, NIST, 'positive', [x(mech, 'digest')], `${prefix}-tc${tcId}-{engine}`)
  })

const USE_ACVP_SUITE: RegisteredTest[] = [
  acvp('01', '§1', 'AES-GCM-256 decrypt', [
    mc(
      'aesgcm_test#/testGroups/0/tests/0',
      ORACLE,
      'positive',
      [x('CKM_AES_GCM', 'decrypt', 'AES-256')],
      'aes-acvp-{engine}'
    ),
  ]),
  acvp(
    '01b',
    '§1b (sections/aesGcmAcvp.ts)',
    'AES-GCM NIST reference samples: encrypt byte-match, decrypt byte-match, upstream authentication failures (AES-128; IV 96/120, tag 128/32 bits)',
    casesOf('aesgcm_acvp_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x('CKM_AES_GCM', param(c, 'direction'), `AES-${param(c, 'keyLen')}`)],
        `aesgcm-nist-k${param(c, 'keyLen')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp('02', '§2', 'HMAC-SHA2-256 verify (truncated MAC)', [
    mc(
      'hmac_test#/testGroups/0/tests/0',
      NIST,
      'positive',
      [x('CKM_SHA256_HMAC_GENERAL', 'verify')],
      'hmac-acvp-{engine}'
    ),
  ]),
  acvp(
    '02b',
    '§2b.1 (sections/hmacAcvp.ts)',
    'HMAC key / message / tag-length matrix: NIST HMAC 2.0 AFT for 11 digests (C_Sign CKM_<hash>_HMAC_GENERAL byte-match, then C_Verify)',
    casesOf('hmac_acvp_matrix_test').map((c) => {
      const mech = HMAC_GENERAL[param(c, 'hashAlg')]
      if (!mech)
        throw new Error(`testRegistry: no HMAC_GENERAL mechanism for ${param(c, 'hashAlg')}`)
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x(mech, 'sign'), x(mech, 'verify')],
        `hmac-nist-${hashSlug(param(c, 'hashAlg'))}-tc${c.upstream?.tcId}-{engine}`
      )
    })
  ),
  acvp(
    '02b.invalid-mac',
    '§2b.2 (sections/hmacAcvp.ts)',
    "HMAC invalid MACs (product-authored mutations of each digest's longest-MAC NIST case): bit-flipped MAC and a MAC one byte shorter than CK_MAC_GENERAL_PARAMS",
    Object.entries(HMAC_GENERAL).flatMap(([hashAlg, mech]) => {
      const slug = hashSlug(hashAlg)
      return [
        lc('acvp.02b.invalid-mac', `${slug}-flip`, PROBE, 'negative', [x(mech, 'verify')], {
          rowId: `hmac-probe-flip-${slug}-{engine}`,
          parameters: { hashAlg, mutation: 'bit-flip' },
          note: "Key/message/MAC from the digest's longest-MAC hmac_acvp_matrix_test case with the last MAC bit flipped; asserts CKR_SIGNATURE_INVALID.",
        }),
        lc('acvp.02b.invalid-mac', `${slug}-short`, PROBE, 'state-error', [x(mech, 'verify')], {
          rowId: `hmac-probe-short-${slug}-{engine}`,
          parameters: { hashAlg, mutation: 'truncated-by-1-byte' },
          note: 'MAC one byte shorter than the CK_MAC_GENERAL_PARAMS length; asserts the CK_RV pinned per engine (both CKR_SIGNATURE_LEN_RANGE).',
        }),
      ]
    })
  ),
  acvp('03', '§3', 'RSA-PSS-2048 SHA-256 verify', [
    mc(
      'rsapss_test#/testGroups/0/tests/0',
      ORACLE,
      'positive',
      [x('CKM_SHA256_RSA_PKCS_PSS', 'verify')],
      'rsa-acvp-{engine}'
    ),
  ]),
  acvp('04', '§4', 'ECDSA P-256 SHA-256 verify', [
    mc(
      'ecdsa_test#/testGroups/0/tests/0',
      STD,
      'positive',
      [x('CKM_ECDSA_SHA256', 'verify', 'P-256')],
      'ecdsa-acvp-{engine}'
    ),
  ]),
  acvp(
    '04b',
    '§4b (sections/ecSigVerAcvp.ts)',
    'ECDSA dedicated NIST SigVer: P-224/256/384/521 x SHA2-256/512, SHA3-256/512, every upstream valid/invalid case',
    casesOf('ecdsa_sigver_acvp_test').map((c) => {
      const curve = param(c, 'curve')
      const mech = ECDSA_MECH[param(c, 'hashAlg')]
      if (!mech) throw new Error(`testRegistry: no CKM_ECDSA_<hash> for ${param(c, 'hashAlg')}`)
      return mc(
        c.caseId,
        NIST,
        c.expectation,
        // P-224 is outside the capability map's EC curve set: the case runs and
        // records its result, but maps to no capability cell.
        EC_DECLARED.has(curve) ? [x(mech, 'verify', curve)] : [],
        `ecdsa-sigver-nist-${curve}-${param(c, 'hashAlg')}-${upstreamIds(c)}-{engine}`
      )
    }),
    'P-224 cases exercise no capability cell (P-224 is not in the capability map EC parameter-set group); their results are still recorded. SHA2-512/256 and SHAKE groups are notExecuted skip rows (no CKM_ECDSA_<hash> in PKCS #11 v3.2).'
  ),
  acvp(
    '04c',
    '§4c (sections/ecSigVerAcvp.ts)',
    'EdDSA dedicated NIST SigVer: Ed25519/Ed448, pure and preHash (CK_EDDSA_PARAMS.phFlag), every upstream valid/invalid case',
    casesOf('eddsa_sigver_acvp_test').map((c) => {
      const ps = param(c, 'curve') === 'ED-25519' ? 'Ed25519' : 'Ed448'
      return mc(
        c.caseId,
        NIST,
        c.expectation,
        [x('CKM_EDDSA', 'verify', ps)],
        `eddsa-sigver-nist-${eddsaScheme(param(c, 'curve'), c.parameters.preHash === true)}-${upstreamIds(c)}-{engine}`
      )
    })
  ),
  acvp(
    '04d',
    '§4d (sections/rsaSigVerAcvp.ts)',
    'RSA dedicated NIST SigVer: PKCS#1 v1.5/SHA2-256 at 2048/3072/4096 and PSS/SHA3-256/MGF1 at 2048, every upstream valid/invalid case',
    casesOf('rsa_sigver_acvp_test').map((c) => {
      const pss = param(c, 'sigType') === 'pss'
      return mc(
        c.caseId,
        NIST,
        c.expectation,
        [x(pss ? 'CKM_SHA3_256_RSA_PKCS_PSS' : 'CKM_SHA256_RSA_PKCS', 'verify')],
        `rsa-sigver-nist-${param(c, 'modulo')}-${param(c, 'sigType')}-${param(c, 'hashAlg')}-${upstreamIds(c)}-{engine}`
      )
    }),
    'SHAKE-hash and SHAKE-mask PSS groups are notExecuted skip rows (no PKCS #11 v3.2 mechanism / CKG_MGF).'
  ),
  acvp(
    '04e.keyver',
    '§4e.1 (sections/ecKeyVerSigGenAcvp.ts)',
    'ECDSA / EdDSA NIST keyVer: the key is used (sign with the upstream d, verify with the point) — a valid key must verify, an invalid point must be refused with a key error',
    [...casesOf('ecdsa_keyver_acvp_test'), ...casesOf('eddsa_keyver_acvp_test')].map((c) => {
      const curve = param(c, 'curve')
      const ec = c.caseId.startsWith('ecdsa_')
      const mech = ec ? 'CKM_ECDSA_SHA256' : 'CKM_EDDSA'
      const ps = ec ? curve : edCurve(curve)
      return mc(
        c.caseId,
        NIST,
        c.expectation,
        c.expectation === 'positive'
          ? [x(mech, 'sign', ps), x(mech, 'verify', ps)]
          : [x(mech, 'verify', ps)],
        `${ec ? 'ecdsa' : 'eddsa'}-keyver-nist-${curve}-${upstreamIds(c)}-{engine}`
      )
    }),
    'A negative passes when the invalid point is refused at C_CreateObject, C_VerifyInit or C_Verify with a code other than CKR_SIGNATURE_INVALID / CKR_SIGNATURE_LEN_RANGE.'
  ),
  acvp(
    '04e.ecdsa-siggen',
    '§4e.2 (sections/ecKeyVerSigGenAcvp.ts)',
    'ECDSA sigGen verify-back: NIST key + message signed by the engine (NIST r, s not reproducible), verified by the engine (round-trip) and by an independent verifier (oracle)',
    casesOf('ecdsa_siggen_acvp_test').flatMap((c) => {
      const curve = param(c, 'curve')
      const hashAlg = param(c, 'hashAlg')
      const mech = ECDSA_SIGGEN_MECH[hashAlg]
      if (!mech) throw new Error(`testRegistry: no CKM_ECDSA_<hash> for ${hashAlg}`)
      const base = `ecdsa-siggen-${curve}-${hashAlg.toLowerCase()}-${upstreamIds(c)}`
      return [
        mc(
          c.caseId,
          RT,
          'positive',
          [x(mech, 'sign', curve), x(mech, 'verify', curve)],
          `${base}-rt-{engine}`
        ),
        lc(
          'acvp.04e.ecdsa-siggen',
          `${curve}-${hashAlg}-oracle`,
          ORACLE,
          'positive',
          [x(mech, 'sign', curve)],
          {
            rowId: `${base}-oracle-{engine}`,
            parameters: { messageBytes: Number(param(c, 'messageBytes')) },
            source: NOBLE_CURVES,
            note: `The engine signature over ${c.caseId} (NIST key + message) verified by an independent implementation: agreement with that oracle, not a NIST expected value.`,
          }
        ),
      ]
    }),
    'The manifest records these cases as functional-round-trip: the NIST file supplies the key and message only (k, r, s dropped).'
  ),
  acvp(
    '04e.eddsa-siggen',
    '§4e.3 (sections/ecKeyVerSigGenAcvp.ts)',
    'EdDSA NIST sigGen byte-match (deterministic): Ed25519 / Ed448, pure and preHash, with the upstream contexts',
    casesOf('eddsa_siggen_acvp_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_EDDSA', 'sign', edCurve(param(c, 'curve')))],
        `eddsa-siggen-nist-${eddsaScheme(param(c, 'curve'), c.parameters.preHash === true)}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '05',
    '§5',
    'ML-DSA verify of NIST sigGen output (sigGen → local sigVer)',
    casesOf('mldsa_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_ML_DSA', 'verify', param(c, 'parameterSet'))],
        `mldsa-sigver-${param(c, 'parameterSet')}-{engine}`
      )
    )
  ),
  acvp(
    '05b',
    '§5b',
    'ML-DSA verify with a non-empty context (sigGen-tr1 → local sigVer)',
    casesOf('mldsa_extended_test', '/context/').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_ML_DSA', 'verify', param(c, 'parameterSet'))],
        `mldsa-ctx-sigver-${param(c, 'parameterSet')}-{engine}`
      )
    )
  ),
  acvp(
    '05c',
    '§5c',
    'HashML-DSA verify (sigGen-tr1 → local sigVer)',
    casesOf('mldsa_extended_test', '/preHash/').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x(hashMlDsaMech(param(c, 'hashAlg')), 'verify', param(c, 'parameterSet'))],
        `mldsa-prehash-sigver-${param(c, 'parameterSet')}-{engine}`
      )
    )
  ),
  acvp(
    '05d.sigver',
    '§5d.1 (sections/mldsaAcvp.ts)',
    'ML-DSA dedicated NIST sigVer (positive and negative)',
    casesOf('mldsa_sigver_test', '/testGroups/').map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x(mldsaMech(c), 'verify', param(c, 'parameterSet'))],
        `mldsa-sigver-nist-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '05d.mutation',
    '§5d.1b (sections/mldsaAcvp.ts)',
    'ML-DSA product-authored negatives (public-key / context mutation), per parameter set',
    MLDSA_SETS.flatMap((ps) =>
      (
        [
          ['mldsa_sigver_test#/localMutations/0', 'pk-bitflip'],
          ['mldsa_sigver_test#/localMutations/1', 'ctx-bitflip'],
        ] as const
      ).map(([caseId, key]) =>
        mc(
          caseId,
          PROBE,
          'negative',
          [x('CKM_ML_DSA', 'verify', ps)],
          `mldsa-sigver-local-${key}-${ps}-{engine}`,
          ps
        )
      )
    ),
    'Derived from the positive pure case of each parameter set group; expected CKR_SIGNATURE_INVALID is PQC Today-authored, not NIST.'
  ),
  acvp(
    '05d.siggen-det',
    '§5d.2 (sections/mldsaAcvp.ts)',
    'ML-DSA deterministic sigGen byte-match (sk via C_CreateObject, CKH_DETERMINISTIC_REQUIRED)',
    casesOf('mldsa_siggen_det_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x(mldsaMech(c), 'sign', param(c, 'parameterSet'), 'deterministic')],
        `mldsa-siggen-det-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '05d.keygen',
    '§5d.3 (sections/mldsaAcvp.ts)',
    'ML-DSA keyGen from seed (CKA_SEED), public-key byte-match',
    casesOf('mldsa_keygen_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_ML_DSA_KEY_PAIR_GEN', 'generate-key-pair', param(c, 'parameterSet'))],
        `mldsa-keygen-seed-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '05d.skips',
    '§5d.4 (sections/mldsaAcvp.ts)',
    'ML-DSA honest skips (groups PKCS #11 cannot express)',
    [],
    'Skip rows are evidence of nothing; the capabilities they stand for are the capability map declaredUnreachable rows (mldsa-hash-sha512t, mldsa-hedged-rnd, mldsa-internal-interface), shown as unsupported.'
  ),
  acvp(
    '05e.siggen-det',
    '§5e.1 (sections/mldsaDepth.ts)',
    'ML-DSA deterministic sigGen byte-match at context 0/255, 8192-byte messages and the remaining HashML-DSA functions (sk via C_CreateObject)',
    [...casesOf('mldsa_siggen_ctxmsg_test'), ...casesOf('mldsa_siggen_prehash_test')].map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x(mldsaMech(c), 'sign', param(c, 'parameterSet'), 'deterministic')],
        `mldsa-depth-siggen-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '05e.ctx-probes',
    '§5e.2 (sections/mldsaDepth.ts)',
    'ML-DSA-44 context boundaries: 1-byte context sign + verify, 256-byte context refused at C_SignInit / C_VerifyInit',
    (() => {
      const base = manifestCase('mldsa_siggen_ctxmsg_test#/testGroups/0/tests/0')
      const ps = 'ML-DSA-44'
      const msg = Number(param(base, 'messageBytes'))
      return [
        lc(
          'acvp.05e.ctx-probes',
          'ctx1',
          RT,
          'positive',
          [x('CKM_ML_DSA', 'sign', ps, 'deterministic'), x('CKM_ML_DSA', 'verify', ps)],
          {
            rowId: 'mldsa-depth-probe-ctx1-{engine}',
            parameters: { contextBytes: 1, messageBytes: msg },
            note: `Key material from ${base.caseId}; the deterministic signature is verified by the same engine. Its sha256 fingerprint is recorded for a C++/Rust comparison, but the row does not compare it.`,
          }
        ),
        lc(
          'acvp.05e.ctx-probes',
          'ctx1-verify-no-context',
          PROBE,
          'negative',
          [x('CKM_ML_DSA', 'verify', ps)],
          {
            rowId: 'mldsa-depth-probe-ctx1-{engine}',
            parameters: { contextBytes: 0, messageBytes: msg },
            note: 'Asserts CKR_SIGNATURE_INVALID when the 1-byte-context signature is verified without its context.',
          }
        ),
        lc(
          'acvp.05e.ctx-probes',
          'ctx256-sign',
          PROBE,
          'state-error',
          [x('CKM_ML_DSA', 'sign', ps, 'deterministic')],
          {
            rowId: 'mldsa-depth-probe-ctx256-sign-{engine}',
            parameters: { contextBytes: 256, messageBytes: msg },
            note: 'Asserts refusal at C_SignInit with the CK_RV pinned per engine (C++ CKR_ARGUMENTS_BAD, Rust CKR_MECHANISM_PARAM_INVALID).',
          }
        ),
        lc(
          'acvp.05e.ctx-probes',
          'ctx256-verify',
          PROBE,
          'state-error',
          [x('CKM_ML_DSA', 'verify', ps)],
          {
            rowId: 'mldsa-depth-probe-ctx256-verify-{engine}',
            parameters: { contextBytes: 256, messageBytes: msg },
            note: 'Asserts refusal at C_VerifyInit with the CK_RV pinned per engine (C++ CKR_ARGUMENTS_BAD, Rust CKR_MECHANISM_PARAM_INVALID).',
          }
        ),
      ]
    })()
  ),
  acvp(
    '05e.skips',
    '§5e.3 (sections/mldsaDepth.ts)',
    'ML-DSA honest skip (the NIST 1-byte-context sigGen case)',
    [],
    'Skip rows are evidence of nothing; the one NIST 1-byte-context case is hedged and uses SHA2-512/256 — the declaredUnreachable rows mldsa-hedged-rnd and mldsa-hash-sha512t.'
  ),
  acvp(
    '05f.sigver',
    '§5f.1 (sections/mldsaNegBoundary.ts)',
    'ML-DSA NIST sigVer depth: 0-byte and 255-byte context cases of each pure group and every HashML-DSA case with a mechanism, upstream disposition',
    casesOf('mldsa_sigver_depth_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x(mldsaMech(c), 'verify', param(c, 'parameterSet'))],
        `mldsa-sigver-depth-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '05f.det-neg',
    '§5f.2 (sections/mldsaNegBoundary.ts)',
    'ML-DSA deterministic-sign negatives (product-authored): message bit flip / 1-byte context must not reproduce the NIST signature nor verify for the original input',
    casesOf('mldsa_siggen_ctxmsg_test')
      .filter((c) => c.parameters.contextBytes === 0)
      .flatMap((c) => {
        const ps = param(c, 'parameterSet')
        const messageBytes = Number(param(c, 'messageBytes'))
        return (
          [
            ['msgflip', 0],
            ['ctxchange', 1],
          ] as const
        ).map(([key, contextBytes]) =>
          lc(
            'acvp.05f.det-neg',
            `${key}-${ps}`,
            PROBE,
            'negative',
            [x('CKM_ML_DSA', 'sign', ps, 'deterministic'), x('CKM_ML_DSA', 'verify', ps)],
            {
              rowId: `mldsa-negbound-det-${key}-${ps}-{engine}`,
              parameters: { contextBytes, messageBytes },
              note: `Key material from ${c.caseId}; the deterministic signature of the mutated input must differ from the NIST expected signature and C_Verify of the original input must return CKR_SIGNATURE_INVALID. PQC Today-authored, not NIST.`,
            }
          )
        )
      })
  ),
  acvp(
    '05f.hedged',
    '§5f.3–4 (sections/mldsaNegBoundary.ts)',
    'ML-DSA hedged signing at context 0 and 255 bytes: engine round-trip, independent-oracle verification (@noble/post-quantum), and mutated-message / mutated-context negatives',
    casesOf('mldsa_siggen_ctxmsg_test')
      .filter((c) => c.parameters.contextBytes === 0)
      .flatMap((c) =>
        hedgedCases(
          'acvp.05f.hedged',
          'mldsa-negbound',
          'CKM_ML_DSA',
          param(c, 'parameterSet'),
          Number(param(c, 'messageBytes'))
        )
      ),
    'Key material from the empty-context case of mldsa_siggen_ctxmsg_test per parameter set; the 255-byte context is product-authored (00..FE). The hedged-rnd NIST sigGen groups stay the declaredUnreachable row mldsa-hedged-rnd.'
  ),
  acvp(
    '06',
    '§6',
    'ML-DSA functional sign + verify',
    MLDSA_SETS.map((ps) =>
      lc(
        'acvp.06',
        ps,
        RT,
        'positive',
        [
          x('CKM_ML_DSA_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_ML_DSA', 'sign', ps, 'hedged'),
          x('CKM_ML_DSA', 'verify', ps),
        ],
        { rowId: `mldsa-func-${ps.slice(7)}-{engine}` }
      )
    )
  ),
  acvp(
    '07',
    '§7',
    'ML-KEM decapsulation of NIST encapDecap AFT samples',
    casesOf('mlkem_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_ML_KEM', 'decapsulate', param(c, 'parameterSet'))],
        `test-${param(c, 'parameterSet')}-decap-{engine}`
      )
    )
  ),
  acvp(
    '07b.keygen',
    '§7b.1 (sections/mlkemAcvp.ts)',
    'ML-KEM keyGen from seed (CKA_SEED d‖z), ek + dk byte-match',
    casesOf('mlkem_keygen_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_ML_KEM_KEY_PAIR_GEN', 'generate-key-pair', param(c, 'parameterSet'))],
        `mlkem-keygen-seed-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '07b.decap-val',
    '§7b.3 (sections/mlkemAcvp.ts)',
    'ML-KEM decapsulation VAL: valid and modified ciphertexts (dk via C_CreateObject), k byte-match',
    casesOf('mlkem_encapdecap_val_test')
      .filter((c) => c.parameters.function === 'decapsulation')
      .map((c) =>
        mc(
          c.caseId,
          NIST,
          c.expectation,
          [x('CKM_ML_KEM', 'decapsulate', param(c, 'parameterSet'))],
          `mlkem-decap-val-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
        )
      ),
    'A modified-ciphertext case (negative) must still return CKR_OK, with k equal to the NIST implicit-rejection value.'
  ),
  acvp(
    '07b.keycheck',
    '§7b.4 (sections/mlkemAcvp.ts)',
    'ML-KEM decapsulation-key / encapsulation-key checks (FIPS 203 §7.3 / §7.2), key import + decapsulate / encapsulate',
    casesOf('mlkem_encapdecap_val_test')
      .filter((c) => c.parameters.function !== 'decapsulation')
      .map((c) => {
        const isDk = c.parameters.function === 'decapsulationKeyCheck'
        return mc(
          c.caseId,
          NIST,
          c.expectation,
          [x('CKM_ML_KEM', isDk ? 'decapsulate' : 'encapsulate', param(c, 'parameterSet'))],
          `mlkem-keycheck-${isDk ? 'dk' : 'ek'}-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
        )
      }),
    'A negative case passes when the invalid key is rejected anywhere on the path — at C_CreateObject or at the C_DecapsulateKey / C_EncapsulateKey that must perform the check.'
  ),
  acvp(
    '07b.implicit-reject',
    '§7b.5 (sections/mlkemAcvp.ts)',
    'ML-KEM product-authored implicit rejection (ciphertext bit flip → k = J(z‖c′)), per parameter set',
    casesOf('mlkem_encapdecap_val_test')
      .filter((c) => c.parameters.function === 'decapsulation')
      .filter(
        (c, i, all) =>
          c.parameters.reason === 'valid decapsulation' &&
          all.findIndex(
            (d) =>
              d.parameters.parameterSet === c.parameters.parameterSet &&
              d.parameters.reason === 'valid decapsulation'
          ) === i
      )
      .map((c) =>
        lc(
          'acvp.07b.implicit-reject',
          param(c, 'parameterSet'),
          PROBE,
          'negative',
          [x('CKM_ML_KEM', 'decapsulate', param(c, 'parameterSet'))],
          {
            rowId: `mlkem-implicit-reject-local-${param(c, 'parameterSet')}-{engine}`,
            note: `Mutation of ${c.caseId} (c[0]^=0x01). Expects CKR_OK and k = SHAKE256(z‖c′, 32) computed with @noble/hashes (FIPS 203 Alg. 18), never the original k; the mutation is PQC Today-authored, not NIST.`,
          }
        )
      )
  ),
  acvp(
    '07b.boundary',
    '§7b.6 (sections/mlkemAcvp.ts)',
    'ML-KEM-512 PKCS #11 boundary probes (ciphertext length, output buffer, short ek), exact CK_RV pinned per engine',
    (
      [
        ['decap-ct-short', 'decapsulate', 'state-error'],
        ['decap-ct-long', 'decapsulate', 'state-error'],
        ['decap-ct-other-set', 'decapsulate', 'state-error'],
        ['encap-size-query', 'encapsulate', 'positive'],
        ['encap-short-buffer', 'encapsulate', 'state-error'],
        ['import-ek-short', 'encapsulate', 'state-error'],
      ] as const
    ).map(([key, op, pol]) =>
      lc('acvp.07b.boundary', key, PROBE, pol, [x('CKM_ML_KEM', op, 'ML-KEM-512')], {
        rowId: `mlkem-boundary-${key}-{engine}`,
      })
    ),
    'import-dk-short is not registered: the Rust engine rejects the 1-byte-short dk at C_CreateObject, so on that engine the row drives no mechanism operation. import-ek-short is: both engines accept the short ek and the pinned code comes from C_EncapsulateKey.'
  ),
  acvp(
    '07b.skips',
    '§7b.2 (sections/mlkemAcvp.ts)',
    'ML-KEM honest skip (encapsulation AFT: C_EncapsulateKey takes no caller-supplied randomness m)',
    [],
    'Skip rows are evidence of nothing; the encapsulation AFT groups are listed under notExecuted in mlkem_encapdecap_val_test.json.'
  ),
  acvp(
    '07c.ekcheck-depth',
    '§7c (sections/mlkemKeyCheckDepth.ts)',
    'ML-KEM encapsulation-key check depth: every remaining invalid NIST ek (FIPS 203 §7.2), key import + C_EncapsulateKey',
    casesOf('mlkem_ekcheck_depth_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x('CKM_ML_KEM', 'encapsulate', param(c, 'parameterSet'))],
        `mlkem-ekcheck-depth-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    ),
    'A negative case passes when the invalid key is rejected at C_CreateObject or at C_EncapsulateKey. ML-KEM inputs have fixed lengths: the capability map declares no length boundary for these cells.'
  ),
  acvp(
    '08',
    '§8',
    'ML-KEM encapsulate + decapsulate round-trip',
    MLKEM_SETS.map((ps) =>
      lc(
        'acvp.08',
        ps,
        RT,
        'positive',
        [
          x('CKM_ML_KEM_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_ML_KEM', 'encapsulate', ps),
          x('CKM_ML_KEM', 'decapsulate', ps),
        ],
        { rowId: `mlkem-rt-${ps.slice(7)}-{engine}` }
      )
    )
  ),
  acvp(
    '09',
    '§9',
    'SLH-DSA functional sign + verify (all 12 parameter sets)',
    SLH_SETS.map((ps) =>
      lc(
        'acvp.09',
        ps,
        RT,
        'positive',
        [
          x('CKM_SLH_DSA_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_SLH_DSA', 'sign', ps, 'hedged'),
          x('CKM_SLH_DSA', 'verify', ps),
        ],
        { rowId: `slhdsa-func-${ps}-{engine}` }
      )
    )
  ),
  acvp(
    '09b',
    '§9b',
    'SLH-DSA verify of NIST sigGen output (sigGen → local sigVer, context 255 B)',
    casesOf('slhdsa_ctx_test', '/sigVer/').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_SLH_DSA', 'verify', param(c, 'parameterSet'))],
        `slhdsa-sigver-kat-${param(c, 'parameterSet')}-{engine}`
      )
    )
  ),
  acvp(
    '09c.sigver',
    '§9c.1 (sections/slhdsaAcvp.ts)',
    'SLH-DSA dedicated NIST sigVer, pure and pre-hash (positive and negative)',
    [...casesOf('slhdsa_sigver_sha2_test'), ...casesOf('slhdsa_sigver_shake_test')].map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x(slhdsaMech(c), 'verify', param(c, 'parameterSet'))],
        `slhdsa-sigver-nist-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    ),
    'A too-small / too-large signature must return CKR_SIGNATURE_LEN_RANGE; any other invalid case CKR_SIGNATURE_INVALID.'
  ),
  acvp(
    '09c.siggen-det',
    '§9c.2 (sections/slhdsaAcvp.ts)',
    'SLH-DSA deterministic sigGen byte-match (sk via C_CreateObject, CKH_DETERMINISTIC_REQUIRED): all 12 sets at context 255 B, plus 128f empty-context and pre-hash',
    [...casesOf('slhdsa_ctx_test', '/sigGen/'), ...casesOf('slhdsa_siggen_det_test')].map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x(slhdsaMech(c), 'sign', param(c, 'parameterSet'), 'deterministic')],
        `slhdsa-siggen-det-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '09c.mutation',
    '§9c.3 (sections/slhdsaAcvp.ts)',
    'SLH-DSA product-authored negatives (public-key / context flips for all 12 sets; signature / message flips for the sets without a pure NIST sigVer case)',
    (() => {
      const nistSigVerSets = new Set(
        [...casesOf('slhdsa_sigver_sha2_test'), ...casesOf('slhdsa_sigver_shake_test')]
          .filter((c) => c.parameters.preHash === 'pure')
          .map((c) => param(c, 'parameterSet'))
      )
      return casesOf('slhdsa_ctx_test', '/sigVer/').flatMap((c) => {
        const ps = param(c, 'parameterSet')
        const keys = nistSigVerSets.has(ps)
          ? ['pk-bitflip', 'ctx-bitflip']
          : ['pk-bitflip', 'ctx-bitflip', 'sig-bitflip', 'msg-bitflip']
        return keys.map((key) =>
          lc(
            'acvp.09c.mutation',
            `${key}-${ps}`,
            PROBE,
            'negative',
            [x('CKM_SLH_DSA', 'verify', ps)],
            {
              rowId: `slhdsa-sigver-local-${key}-${ps}-{engine}`,
              parameters: lengthsOf(c),
              note: `One-bit mutation of ${c.caseId}; expected CKR_SIGNATURE_INVALID is PQC Today-authored, not NIST.`,
            }
          )
        )
      })
    })()
  ),
  acvp(
    '09c.probes',
    '§9c.4 (sections/slhdsaAcvp.ts)',
    'SLH-DSA-SHA2-128f product-authored probes: 256-byte context refused at C_SignInit; hedged signing randomized',
    (() => {
      const base = casesOf('slhdsa_siggen_det_test').find(
        (c) => c.parameters.parameterSet === 'SLH-DSA-SHA2-128f' && c.parameters.preHash === 'pure'
      )
      if (!base)
        throw new Error('testRegistry: no pure SLH-DSA-SHA2-128f deterministic sigGen case')
      const ps = 'SLH-DSA-SHA2-128f'
      return [
        lc(
          'acvp.09c.probes',
          'ctx256',
          PROBE,
          'state-error',
          [x('CKM_SLH_DSA', 'sign', ps, 'deterministic')],
          {
            rowId: 'slhdsa-probe-ctx256-{engine}',
            parameters: { ...lengthsOf(base), contextBytes: 256 },
            note: `Key material from ${base.caseId}. Asserts refusal at C_SignInit with the CK_RV pinned per engine (C++ CKR_ARGUMENTS_BAD, Rust CKR_MECHANISM_PARAM_INVALID).`,
          }
        ),
        lc(
          'acvp.09c.probes',
          'hedged-randomized',
          RT,
          'positive',
          [x('CKM_SLH_DSA', 'sign', ps, 'hedged'), x('CKM_SLH_DSA', 'verify', ps)],
          {
            rowId: 'slhdsa-probe-hedged-randomized-{engine}',
            parameters: lengthsOf(base),
            note: `Key material from ${base.caseId}. Two CKH_HEDGE_REQUIRED signatures must differ (and differ from the NIST deterministic one) and both verify; shows randomization is active, not that the randomness is correct.`,
          }
        ),
      ]
    })()
  ),
  acvp(
    '09c.skips',
    '§9c.5 (sections/slhdsaAcvp.ts)',
    'SLH-DSA honest skips (pre-hash functions with no PKCS #11 mechanism, internal interface, hedged sigGen)',
    [],
    'Skip rows are evidence of nothing; the upstream groups they stand for are listed under notExecuted in the SLH-DSA vector files. No capability-map declaredUnreachable row covers them yet.'
  ),
  acvp(
    '09d.keygen',
    '§9d.1 (sections/slhdsaCoverage.ts)',
    'SLH-DSA keyGen from seed (CKA_SEED SK.seed‖SK.prf‖PK.seed), pk + sk byte-match, all 12 parameter sets',
    casesOf('slhdsa_keygen_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_SLH_DSA_KEY_PAIR_GEN', 'generate-key-pair', param(c, 'parameterSet'))],
        `slhdsa-keygen-seed-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '09d.siggen-ctx0',
    '§9d.2 (sections/slhdsaCoverage.ts)',
    'SLH-DSA deterministic sigGen byte-match at an empty context (sk via C_CreateObject, CKH_DETERMINISTIC_REQUIRED)',
    casesOf('slhdsa_siggen_ctx0_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_SLH_DSA', 'sign', param(c, 'parameterSet'), 'deterministic')],
        `slhdsa-siggen-ctx0-${param(c, 'parameterSet')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '09d.det-neg',
    '§9d.3a (sections/slhdsaCoverage.ts)',
    'SLH-DSA deterministic-sign negatives for the six "f" sets (product-authored): message / context bit flip must not reproduce the NIST signature nor verify for the original input',
    casesOf('slhdsa_ctx_test', '/sigGen/')
      .filter((c) => (SLH_F_SETS as readonly string[]).includes(param(c, 'parameterSet')))
      .flatMap((c) => {
        const ps = param(c, 'parameterSet')
        return (['msgflip', 'ctxflip'] as const).map((key) =>
          lc(
            'acvp.09d.det-neg',
            `${key}-${ps}`,
            PROBE,
            'negative',
            [x('CKM_SLH_DSA', 'sign', ps, 'deterministic'), x('CKM_SLH_DSA', 'verify', ps)],
            {
              rowId: `slhdsa-cov-det-${key}-${ps}-{engine}`,
              parameters: lengthsOf(c),
              note: `Key material from ${c.caseId}; the deterministic signature of the mutated input must differ from the NIST expected signature and C_Verify of the original input must return CKR_SIGNATURE_INVALID. PQC Today-authored, not NIST.`,
            }
          )
        )
      })
  ),
  acvp(
    '09d.hedged',
    '§9d.3b–c (sections/slhdsaCoverage.ts)',
    'SLH-DSA hedged signing at context 0 and 255 bytes for the six "f" sets: engine round-trip, independent-oracle verification (@noble/post-quantum), and mutated-message / mutated-context negatives',
    casesOf('slhdsa_ctx_test', '/sigGen/')
      .filter((c) => (SLH_F_SETS as readonly string[]).includes(param(c, 'parameterSet')))
      .flatMap((c) =>
        hedgedCases(
          'acvp.09d.hedged',
          'slhdsa-cov',
          'CKM_SLH_DSA',
          param(c, 'parameterSet'),
          Number(param(c, 'messageBytes'))
        )
      ),
    'Key material from the slhdsa_ctx_test sigGen entry of each set; the 255-byte context is the NIST one.'
  ),
  acvp(
    '09d.skips',
    '§9d.4 (sections/slhdsaCoverage.ts)',
    'SLH-DSA honest skip (the "s" sets\' product-authored sign rows: runtime budget)',
    [],
    'Skip rows are evidence of nothing; the "s" sets keep their NIST deterministic byte-matches at context 0 and 255 bytes, and their sign cells stay without a negative case.'
  ),
  acvp(
    '09e.prehash-siggen',
    '§9e.1 (sections/slhdsaPreHash.ts)',
    'HashSLH-DSA NIST pre-hash sigGen — all 120 (CKM_HASH_SLH_DSA_<hash> × parameter set) pairs: deterministic byte-match, verify of the NIST signature, hedged sign verified back, and the same three over the PKCS#11 v3.2 message-based interface',
    [
      ...casesOf('slhdsa_prehash_siggen_sha2_test'),
      ...casesOf('slhdsa_prehash_siggen_shake_test'),
    ].flatMap((c) => {
      const ps = param(c, 'parameterSet')
      const m = slhdsaMech(c)
      const tag = `${ps}-${param(c, 'hashAlg')}-${upstreamIds(c)}`
      return [
        mc(
          c.caseId,
          NIST,
          'positive',
          [x(m, 'verify', ps)],
          `slhdsa-prehash-sigver-${tag}-{engine}`,
          'sigver'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x(m, 'sign', ps, 'deterministic')],
          `slhdsa-prehash-siggen-det-${tag}-{engine}`,
          'siggen-det'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x(m, 'sign', ps, 'hedged', { evidenceClass: RT })],
          `slhdsa-prehash-siggen-hedged-${tag}-{engine}`,
          'siggen-hedged'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x(m, 'message-verify', ps)],
          `slhdsa-prehash-msg-sigver-${tag}-{engine}`,
          'msg-sigver'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x(m, 'message-sign', ps, 'deterministic')],
          `slhdsa-prehash-msg-siggen-det-${tag}-{engine}`,
          'msg-siggen-det'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x(m, 'message-sign', ps, 'hedged', { evidenceClass: RT })],
          `slhdsa-prehash-msg-siggen-hedged-${tag}-{engine}`,
          'msg-siggen-hedged'
        ),
      ]
    }),
    'A hedged row is a round-trip, not a byte-match: CKH_HEDGE_REQUIRED draws fresh randomness the NIST vector cannot pin, so those exercises carry functional-round-trip, not the case-level NIST class.'
  ),
  acvp(
    '09e.prehash-sigver',
    '§9e.2 (sections/slhdsaPreHash.ts)',
    'HashSLH-DSA dedicated NIST pre-hash sigVer, single-part and message-based: the upstream disposition kept verbatim — 22 negative cases across all six upstream reasons in both hash families',
    [
      ...casesOf('slhdsa_prehash_sigver_sha2_test'),
      ...casesOf('slhdsa_prehash_sigver_shake_test'),
    ].flatMap((c) => {
      const ps = param(c, 'parameterSet')
      const m = slhdsaMech(c)
      const tag = `${ps}-${upstreamIds(c)}`
      return [
        mc(
          c.caseId,
          NIST,
          c.expectation,
          [x(m, 'verify', ps)],
          `slhdsa-prehash-nist-sigver-${tag}-{engine}`,
          'single'
        ),
        mc(
          c.caseId,
          NIST,
          c.expectation,
          [x(m, 'message-verify', ps)],
          `slhdsa-prehash-nist-msg-sigver-${tag}-{engine}`,
          'message'
        ),
      ]
    }),
    'A too-small / too-large signature must return CKR_SIGNATURE_LEN_RANGE; any other invalid case CKR_SIGNATURE_INVALID.'
  ),
  acvp(
    '09e.pure-message',
    '§9e.3 (sections/slhdsaPreHash.ts)',
    'Pure CKM_SLH_DSA over the message-based interface (C_MessageSignInit/C_SignMessage, C_MessageVerifyInit/C_VerifyMessage) for all 12 parameter sets: the slhdsa_ctx_test.json NIST tuples, no new vector bytes',
    casesOf('slhdsa_ctx_test', '/sigGen/').flatMap((c) => {
      const ps = param(c, 'parameterSet')
      const tag = `${ps}-${upstreamIds(c)}`
      return [
        mc(
          c.caseId,
          NIST,
          'positive',
          [x('CKM_SLH_DSA', 'message-verify', ps)],
          `slhdsa-pure-message-sigver-${tag}-{engine}`,
          'msg-sigver'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x('CKM_SLH_DSA', 'message-sign', ps, 'deterministic')],
          `slhdsa-pure-message-siggen-det-${tag}-{engine}`,
          'msg-siggen-det'
        ),
        mc(
          c.caseId,
          NIST,
          'positive',
          [x('CKM_SLH_DSA', 'message-sign', ps, 'hedged', { evidenceClass: RT })],
          `slhdsa-pure-message-siggen-hedged-${tag}-{engine}`,
          'msg-siggen-hedged'
        ),
      ]
    })
  ),
  acvp('10', '§10', 'SHA2-256 digest', digestCases('sha256_test', sha256V, 'CKM_SHA256', 'sha256')),
  acvp(
    '10b',
    '§10b',
    'SHA2-384 digest',
    digestCases('sha384_test', sha384V, 'CKM_SHA384', 'sha384')
  ),
  acvp(
    '10c',
    '§10c',
    'SHA2-512 digest',
    digestCases('sha512_test', sha512V, 'CKM_SHA512', 'sha512')
  ),
  acvp(
    '10d',
    '§10d',
    'SHA3-256 digest',
    digestCases('sha3_256_test', sha3_256V, 'CKM_SHA3_256', 'sha3-256')
  ),
  acvp(
    '10e',
    '§10e',
    'SHA3-512 digest',
    digestCases('sha3_512_test', sha3_512V, 'CKM_SHA3_512', 'sha3-512')
  ),
  acvp(
    '10f',
    '§10f (sections/shaAcvp.ts)',
    'SHA-2 / SHA-3 NIST digests at the empty, shortest, block-boundary and longest message lengths, plus standard MCT (outer iteration 0 of 100)',
    casesOf('sha_acvp_boundary_test').map((c) => {
      const hashAlg = param(c, 'hashAlg')
      const mech = DIGEST_MECH[hashAlg]
      if (!mech) throw new Error(`testRegistry: no digest mechanism for ${hashAlg}`)
      const mct = c.testType === 'MCT'
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x(mech, 'digest')],
        `sha-${mct ? 'mct' : 'nist'}-${hashSlug(hashAlg)}-${upstreamIds(c)}-{engine}`
      )
    }),
    'MCT cases check the first of the 100 upstream outer iterations only (1000 chained C_Digest calls). Alternate-version MCT and LDT groups are notExecuted skip rows.'
  ),
  acvp(
    '10g',
    '§10g (sections/mctFullAcvp.ts)',
    'SHA-2 / SHA-3 NIST MCT, all 100 outer iterations: standard version (SHA2-224/384/512-224, SHA-3) and alternate version (SHA2-256/512/512-256)',
    casesOf('sha_mct_full_test').map((c) => {
      const hashAlg = param(c, 'hashAlg')
      const mech = DIGEST_MECH[hashAlg]
      if (!mech) throw new Error(`testRegistry: no digest mechanism for ${hashAlg}`)
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x(mech, 'digest')],
        `sha-mct-full-${hashSlug(hashAlg)}-${upstreamIds(c)}-{engine}`
      )
    })
  ),
  acvp('11', '§11', 'AES-CBC-256 decrypt (raw CKM_AES_CBC)', [
    mc(
      'aescbc_test#/testGroups/0/tests/0',
      NIST,
      'positive',
      [x('CKM_AES_CBC', 'decrypt', 'AES-256')],
      'aescbc-acvp-{engine}'
    ),
  ]),
  acvp('12', '§12', 'AES-CTR-256 decrypt', [
    mc(
      'aesctr_test#/testGroups/0/tests/0',
      STD,
      'positive',
      [x('CKM_AES_CTR', 'decrypt', 'AES-256')],
      'aesctr-acvp-{engine}'
    ),
  ]),
  acvp(
    '12b',
    '§12b.1 (sections/aesCbcCtrAcvp.ts)',
    'AES-CBC NIST reference samples: GFSBox and 1/10-block MMT encrypt/decrypt byte-match, MCT outer iteration 0 of 100, AES-128/192/256',
    casesOf('aescbc_acvp_test').map((c) => {
      const kl = param(c, 'keyLen')
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_AES_CBC', param(c, 'direction'), `AES-${kl}`)],
        `aescbc-${c.testType === 'MCT' ? 'mct' : 'nist'}-k${kl}-${upstreamIds(c)}-{engine}`
      )
    }),
    'MCT cases run the ACVP inner loop (1000 single-block C_EncryptUpdate/C_DecryptUpdate calls in one multi-part operation) and check the first of the 100 upstream outer iterations only.'
  ),
  acvp(
    '12d',
    '§12d (sections/mctFullAcvp.ts)',
    'AES-CBC NIST MCT, all 100 outer iterations (AESAVS §6.4), AES-128/192/256 encrypt and decrypt',
    casesOf('aescbc_mct_full_test').map((c) => {
      const kl = param(c, 'keyLen')
      const dir = param(c, 'direction')
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_AES_CBC', dir, `AES-${kl}`)],
        `aescbc-mct-full-k${kl}-${dir}-${upstreamIds(c)}-{engine}`
      )
    }),
    'Each outer iteration imports the next key and restarts the multi-part operation with the next IV, both derived from the engine outputs as AESAVS §6.4 specifies.'
  ),
  acvp(
    '12b.probes',
    '§12b.2 (sections/aesCbcCtrAcvp.ts)',
    'AES-CBC product-authored length / IV probes: 15-byte plaintext, 17-byte ciphertext, 15-byte IV — exact CK_RV pinned per engine',
    (
      [
        ['encLen15', 'encrypt', 'C_Encrypt of 15 bytes: CKR_DATA_LEN_RANGE on both engines.'],
        [
          'decLen17',
          'decrypt',
          'C_Decrypt of 17 bytes: CKR_ENCRYPTED_DATA_LEN_RANGE on both engines.',
        ],
        [
          'iv15',
          'encrypt',
          'C_EncryptInit with a 15-byte IV: CKR_MECHANISM_PARAM_INVALID expected (§5.8.1); the Rust engine returns CKR_ARGUMENTS_BAD, which C_EncryptInit does not list — open gap rust-cbc-iv-length-arguments-bad.',
        ],
      ] as const
    ).map(([key, op, note]) =>
      lc('acvp.12b.probes', key, PROBE, 'state-error', [x('CKM_AES_CBC', op, 'AES-128')], {
        rowId: `aescbc-probe-${key}-{engine}`,
        parameters: { probe: key },
        note,
      })
    )
  ),
  acvp(
    '12c',
    '§12b.3 (sections/aesCbcCtrAcvp.ts)',
    'AES-CTR NIST reference samples (RFC 3686 test mode): decrypt byte-match, then encrypt of the same tuple byte-match, AES-128/192/256',
    casesOf('aesctr_acvp_test').map((c) => {
      const kl = param(c, 'keyLen')
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_AES_CTR', 'decrypt', `AES-${kl}`), x('CKM_AES_CTR', 'encrypt', `AES-${kl}`)],
        `aesctr-nist-k${kl}-${upstreamIds(c)}-{engine}`
      )
    }),
    "The upstream encrypt groups (IV chosen by the implementation, deferred) are notExecuted skip rows; encryption is exercised on the decrypt groups' tuples (operation-change recorded in the manifest lineage)."
  ),
  acvp('13', '§13', 'HMAC-SHA2-384 verify (truncated MAC)', [
    mc(
      'hmac_sha384_test#/testGroups/0/tests/0',
      NIST,
      'positive',
      [x('CKM_SHA384_HMAC_GENERAL', 'verify')],
      'hmac384-acvp-{engine}'
    ),
  ]),
  acvp('14', '§14', 'HMAC-SHA2-512 verify (truncated MAC)', [
    mc(
      'hmac_sha512_test#/testGroups/0/tests/0',
      NIST,
      'positive',
      [x('CKM_SHA512_HMAC_GENERAL', 'verify')],
      'hmac512-acvp-{engine}'
    ),
  ]),
  acvp('15', '§15', 'ECDSA P-384 SHA-384 verify', [
    mc(
      'ecdsa_p384_test#/testGroups/0/tests/0',
      STD,
      'positive',
      [x('CKM_ECDSA_SHA384', 'verify', 'P-384')],
      'ecdsa384-acvp-{engine}'
    ),
  ]),
  acvp('16', '§16', 'EdDSA Ed25519 verify', [
    mc(
      'eddsa_test#/testGroups/0/tests/0',
      STD,
      'positive',
      [x('CKM_EDDSA', 'verify', 'Ed25519')],
      'eddsa-sigver-{engine}'
    ),
  ]),
  acvp('16b', '§16b', 'EdDSA Ed448 verify', [
    mc(
      'eddsa_ed448_test#/testGroups/0/tests/0',
      NIST,
      'positive',
      [x('CKM_EDDSA', 'verify', 'Ed448')],
      'eddsa448-sigver-{engine}'
    ),
  ]),
  acvp('17', '§17', 'PBKDF2-HMAC-SHA256 derive', [
    mc(
      'pbkdf2_test#/testGroups/0/tests/1',
      ORACLE,
      'positive',
      [x('CKM_PKCS5_PBKD2', 'derive')],
      'pbkdf2-kat-{engine}'
    ),
  ]),
  acvp('18', '§18', 'HKDF-SHA256 derive (RFC 5869 A.1, inline copy)', [
    mc(
      'hkdf_test#/testGroups/0/tests/0',
      STD,
      'positive',
      [x('CKM_HKDF_DERIVE', 'derive')],
      'hkdf-kat-{engine}'
    ),
  ]),
  acvp(
    '18b',
    '§18b (sections/kdfMacAcvp.ts)',
    'PBKDF2 NIST reference samples (PBKDF 1.0, HMAC-SHA2-224 PRF): derived-key byte-match, incl. one 1-iteration case',
    casesOf('pbkdf2_acvp_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        'positive',
        [x('CKM_PKCS5_PBKD2', 'derive')],
        `pbkdf2-nist-${upstreamIds(c)}-{engine}`
      )
    ),
    'The Rust engine implements only the HMAC-SHA-256/384/512 PRFs and refuses fewer than 1000 iterations (open gaps rust-pbkdf2-prf-limited, pbkdf2-min-iterations-divergence); its rows are recorded as fails.'
  ),
  acvp(
    '18c.hkdf',
    '§18c.1 (sections/kdfDeriveAcvp.ts)',
    'HKDF NIST reference samples (KDA-HKDF-Sp800-56Cr2): IKM = Z‖T, salt, constructed fixedInfo; AFT byte-match and VAL testPassed=false (output must differ)',
    casesOf('hkdf_acvp_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x('CKM_HKDF_DERIVE', 'derive')],
        `hkdf-nist-${param(c, 'hmacAlg').toLowerCase().replace('/', '-')}-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp(
    '18c.kbkdf',
    '§18c.2 (sections/kdfDeriveAcvp.ts)',
    'SP 800-108 KBKDF NIST reference samples (KDF 1.0): counter / feedback / double pipeline × every Table 196 PRF, every counter location for HMAC-SHA2-256 and CMAC-AES128; keyOut byte-match',
    casesOf('kbkdf_acvp_test').map((c) => {
      const mode = param(c, 'kdfMode')
      const mech = KBKDF_MECH[mode]
      if (!mech) throw new Error(`testRegistry: no KBKDF mechanism for ${mode}`)
      return mc(
        c.caseId,
        NIST,
        'positive',
        [x(mech, 'derive')],
        `kbkdf-nist-${mode.split(' ')[0]}-${param(c, 'macMode').toLowerCase().replace('/', '-')}-${upstreamIds(c)}-{engine}`
      )
    }),
    'The CK_PRF_DATA_PARAM layout follows PKCS#11 v3.2 §6.42.3–6.42.5 (ITERATION_VARIABLE is mandatory in every mode). Open gaps cpp-kbkdf-counter-position-ignored and rust-kbkdf-iteration-variable-rejected record the engine rows that fail.'
  ),
  acvp(
    '18c.skips',
    '§18c.3 (sections/kdfDeriveAcvp.ts)',
    'ANSI X9.63 KDF on a caller-supplied shared secret — honest unsupported row',
    [],
    'Skip rows are evidence of nothing; the capability stands as the capability-map declaredUnreachable row x963-kdf-caller-z (shown as unsupported).'
  ),
  acvp('19', '§19', 'AES-KW-256 wrap', [
    mc(
      'aeskw_test#/testGroups/0/tests/0',
      STD,
      'positive',
      [x('CKM_AES_KEY_WRAP', 'wrap', 'AES-256')],
      'aeskw-acvp-{engine}'
    ),
  ]),
  acvp('20', '§20', 'AES-KWP-256 wrap + unwrap round-trip', [
    lc(
      'acvp.20',
      '1',
      RT,
      'positive',
      [
        x('CKM_AES_KEY_GEN', 'generate-key', 'AES-256'),
        x('CKM_AES_KEY_WRAP_KWP', 'wrap', 'AES-256'),
        x('CKM_AES_KEY_WRAP_KWP', 'unwrap', 'AES-256'),
      ],
      { rowId: 'aeskwp-func-{engine}' }
    ),
  ]),
  acvp(
    '20b',
    '§20b (sections/aesKwAcvp.ts)',
    'AES-KW / AES-KWP NIST reference samples: wrap byte-match, unwrap byte-match, upstream integrity failures (C_UnwrapKey refused), AES-128/192/256',
    casesOf('aeskw_acvp_test').map((c) => {
      const mode = param(c, 'mode')
      const mech = mode === 'KW' ? 'CKM_AES_KEY_WRAP' : 'CKM_AES_KEY_WRAP_KWP'
      return mc(
        c.caseId,
        NIST,
        c.expectation,
        [x(mech, c.operation, `AES-${param(c, 'keyLen')}`)],
        `aes${mode.toLowerCase()}-nist-k${param(c, 'keyLen')}-${upstreamIds(c)}-{engine}`
      )
    }),
    'kwCipher=inverse groups are notExecuted skip rows (no PKCS #11 mechanism).'
  ),
  acvp('21', '§21', 'SLH-DSA-SHA2-128s context binding', [
    lc(
      'acvp.21',
      'same-context',
      RT,
      'positive',
      [
        x('CKM_SLH_DSA_KEY_PAIR_GEN', 'generate-key-pair', 'SLH-DSA-SHA2-128s'),
        x('CKM_SLH_DSA', 'sign', 'SLH-DSA-SHA2-128s', 'hedged'),
        x('CKM_SLH_DSA', 'verify', 'SLH-DSA-SHA2-128s'),
      ],
      { rowId: 'slhdsa-ctx-binding-{engine}', parameters: { contextBytes: 10 } }
    ),
    lc(
      'acvp.21',
      'cross-context',
      PROBE,
      'negative',
      [x('CKM_SLH_DSA', 'verify', 'SLH-DSA-SHA2-128s')],
      {
        rowId: 'slhdsa-ctx-binding-{engine}',
        parameters: { contextBytes: 10 },
        note: 'Asserts verify returns false; the exact CK_RV is not checked.',
      }
    ),
    lc(
      'acvp.21',
      'no-context',
      PROBE,
      'negative',
      [x('CKM_SLH_DSA', 'verify', 'SLH-DSA-SHA2-128s')],
      {
        rowId: 'slhdsa-ctx-binding-{engine}',
        parameters: { contextBytes: 0 },
        note: 'Asserts verify returns false; the exact CK_RV is not checked.',
      }
    ),
  ]),
  acvp('22', '§22', 'SLH-DSA-SHA2-128s deterministic signing (two signatures equal)', [
    lc(
      'acvp.22',
      '1',
      RT,
      'positive',
      [
        x('CKM_SLH_DSA_KEY_PAIR_GEN', 'generate-key-pair', 'SLH-DSA-SHA2-128s'),
        x('CKM_SLH_DSA', 'sign', 'SLH-DSA-SHA2-128s', 'deterministic'),
        x('CKM_SLH_DSA', 'verify', 'SLH-DSA-SHA2-128s'),
      ],
      {
        rowId: 'slhdsa-deterministic-{engine}',
        note: 'Determinism is checked against itself, not against an external expected signature.',
      }
    ),
  ]),
  acvp('23', '§23', 'X25519 ECDH two-party round-trip', [
    lc(
      'acvp.23',
      '1',
      RT,
      'positive',
      [
        x('CKM_EC_MONTGOMERY_KEY_PAIR_GEN', 'generate-key-pair', 'X25519'),
        x('CKM_ECDH1_DERIVE', 'derive', 'X25519'),
      ],
      { rowId: 'x25519-ecdh-{engine}' }
    ),
  ]),
  acvp('24', '§24', 'X448 ECDH two-party round-trip', [
    lc(
      'acvp.24',
      '1',
      RT,
      'positive',
      [
        x('CKM_EC_MONTGOMERY_KEY_PAIR_GEN', 'generate-key-pair', 'X448'),
        x('CKM_ECDH1_DERIVE', 'derive', 'X448'),
      ],
      { rowId: 'x448-ecdh-{engine}' }
    ),
  ]),
  acvp('25', '§25', 'ECDH (X25519) with X9.63 SHA3-256 / SHA3-512 KDF, two-party agreement', [
    lc(
      'acvp.25',
      'sha3-256-kdf',
      RT,
      'positive',
      [
        x('CKM_EC_MONTGOMERY_KEY_PAIR_GEN', 'generate-key-pair', 'X25519'),
        x('CKM_ECDH1_DERIVE', 'derive', 'X25519'),
      ],
      { rowId: 'x963-sha3-kdf-{engine}' }
    ),
    lc('acvp.25', 'sha3-512-kdf', RT, 'positive', [x('CKM_ECDH1_DERIVE', 'derive', 'X25519')], {
      rowId: 'x963-sha3-kdf-{engine}',
    }),
  ]),
  acvp('26', '§26', 'ChaCha20-Poly1305 encrypt + decrypt round-trip', [
    lc(
      'acvp.26',
      '1',
      RT,
      'positive',
      [
        x('CKM_CHACHA20_KEY_GEN', 'generate-key'),
        x('CKM_CHACHA20_POLY1305', 'encrypt'),
        x('CKM_CHACHA20_POLY1305', 'decrypt'),
      ],
      { rowId: 'chacha20-rt-{engine}' }
    ),
  ]),
  acvp('27', '§27', 'SP 800-108 counter-mode KBKDF (output length only)', [
    lc('acvp.27', '1', PROBE, 'positive', [x('CKM_SP800_108_COUNTER_KDF', 'derive')], {
      rowId: 'sp800-108-kdf-{engine}',
      note: 'Passes when 32 bytes come back; no expected output value is checked.',
    }),
  ]),
  acvp(
    '28',
    '§28',
    'HashML-DSA (SHA-512) functional sign + verify',
    MLDSA_SETS.map((ps) =>
      lc(
        'acvp.28',
        ps,
        RT,
        'positive',
        [
          x('CKM_ML_DSA_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_HASH_ML_DSA_SHA512', 'sign', ps, 'hedged'),
          x('CKM_HASH_ML_DSA_SHA512', 'verify', ps),
        ],
        { rowId: `hash-mldsa-${ps.slice(7)}-{engine}` }
      )
    )
  ),
  acvp('29', '§29', 'SP 800-108 feedback-mode KBKDF (output length only)', [
    lc('acvp.29', '1', PROBE, 'positive', [x('CKM_SP800_108_FEEDBACK_KDF', 'derive')], {
      rowId: 'sp800-108-kdf-feedback-{engine}',
      note: 'Passes when 32 bytes come back; no expected output value is checked.',
    }),
  ]),
  acvp('30', '§30', 'XMSS (SHA2_10_256) sign + verify', [
    lc(
      'acvp.30',
      '1',
      RT,
      'positive',
      [
        x('CKM_XMSS_KEY_PAIR_GEN', 'generate-key-pair'),
        x('CKM_XMSS', 'sign'),
        x('CKM_XMSS', 'verify'),
      ],
      { rowId: 'xmss-sig-{engine}' }
    ),
  ]),
  acvp('31', '§31', 'HSS/LMS sign + verify', [
    lc(
      'acvp.31',
      '1',
      RT,
      'positive',
      [
        x('CKM_HSS_KEY_PAIR_GEN', 'generate-key-pair'),
        x('CKM_HSS', 'sign'),
        x('CKM_HSS', 'verify'),
      ],
      { rowId: 'hss-sig-{engine}' }
    ),
  ]),
  acvp('32', '§32', 'ECDSA secp256k1 SHA-256 sign + verify', [
    lc(
      'acvp.32',
      '1',
      RT,
      'positive',
      [
        x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'secp256k1'),
        x('CKM_ECDSA_SHA256', 'sign', 'secp256k1'),
        x('CKM_ECDSA_SHA256', 'verify', 'secp256k1'),
      ],
      { rowId: 'ecdsa-k1-func-{engine}' }
    ),
  ]),
  acvp('33', '§33', 'ECDSA P-521 SHA2-512 verify', [
    mc(
      'ecdsa_p521_test#/testGroups/0/tests/0',
      NIST,
      'positive',
      [x('CKM_ECDSA_SHA512', 'verify', 'P-521')],
      'ecdsa521-acvp-{engine}'
    ),
  ]),
  acvp('34', '§34', 'ECDH P-521 two-party round-trip', [
    lc(
      'acvp.34',
      '1',
      RT,
      'positive',
      [
        x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-521'),
        x('CKM_ECDH1_DERIVE', 'derive', 'P-521'),
      ],
      { rowId: 'ecdh521-rt-{engine}' }
    ),
  ]),
  acvp('35', '§35', 'KMAC128 verify', [
    mc(
      'kmac_test#/testGroups/1/tests/0',
      STD,
      'positive',
      [x('CKM_KMAC_128', 'verify')],
      'kmac128-kat-{engine}'
    ),
  ]),
  acvp(
    '35b',
    '§35b (sections/kdfMacAcvp.ts)',
    'KMAC-128 NIST reference samples: the two byte-aligned non-XOF MVT cases (customization + output length, vendor CKM_KMAC_128)',
    casesOf('kmac_acvp_test').map((c) =>
      mc(
        c.caseId,
        NIST,
        c.expectation,
        [x('CKM_KMAC_128', 'verify')],
        `kmac128-nist-${upstreamIds(c)}-{engine}`
      )
    )
  ),
  acvp('36', '§36', 'RSA-OAEP (SHA-256) decrypt', [
    mc(
      'rsa_oaep_test#/testGroups/0/tests/0',
      ORACLE,
      'positive',
      [x('CKM_RSA_PKCS_OAEP', 'decrypt')],
      'rsaoaep-selfcheck-{engine}'
    ),
  ]),

  // ── PROJECT WYCHEPROOF (Google / C2SP) — sections/wycheproofNegative.ts ────
  // Adversarial reject-path vectors NIST does not publish. ORACLE, never STD:
  // Google/C2SP is not a standards body and no standard prints these values, so
  // the permitted claim is "agrees with Project Wycheproof 3fa63dd0 for this
  // case". Polarity comes from the manifest, where a Wycheproof `acceptable`
  // case is registered POSITIVE on purpose (upstream permits refusing it, so
  // counting it negative would inflate reject-path coverage) — the executed row
  // still asserts "refused OR exactly the upstream value".
  acvp(
    '37.wycheproof-xdh',
    '§37a (sections/wycheproofNegative.ts)',
    'X25519 / X448 ECDH — Project Wycheproof (Google / C2SP): low-order and zero-shared-secret public keys, points on the twist, edge-case multiplications',
    [
      ...casesOf('wycheproof_x25519_test').map((c) =>
        mc(
          c.caseId,
          ORACLE,
          c.expectation,
          [x('CKM_ECDH1_DERIVE', 'derive', 'X25519')],
          `wyc-x25519-${upstreamIds(c)}-{engine}`
        )
      ),
      ...casesOf('wycheproof_x448_test').map((c) =>
        mc(
          c.caseId,
          ORACLE,
          c.expectation,
          [x('CKM_ECDH1_DERIVE', 'derive', 'X448')],
          `wyc-x448-${upstreamIds(c)}-{engine}`
        )
      ),
    ],
    'Source: https://github.com/C2SP/wycheproof @ 3fa63dd0, Apache-2.0. A Wycheproof `invalid` case passes when C_CreateObject(private) or C_DeriveKey refuses it; producing a shared secret for it is a discrepancy row.'
  ),
  acvp(
    '37.wycheproof-eddsa',
    '§37b (sections/wycheproofNegative.ts)',
    'Ed25519 / Ed448 verify — Project Wycheproof (Google / C2SP): signature malleability, r/s out of range, small-order and non-canonical encodings, truncated and appended signatures',
    [
      ...casesOf('wycheproof_ed25519_test').map((c) =>
        mc(
          c.caseId,
          ORACLE,
          c.expectation,
          [x('CKM_EDDSA', 'verify', 'Ed25519')],
          `wyc-ed25519-${upstreamIds(c)}-{engine}`
        )
      ),
      ...casesOf('wycheproof_ed448_test').map((c) =>
        mc(
          c.caseId,
          ORACLE,
          c.expectation,
          [x('CKM_EDDSA', 'verify', 'Ed448')],
          `wyc-ed448-${upstreamIds(c)}-{engine}`
        )
      ),
    ],
    'Source: https://github.com/C2SP/wycheproof @ 3fa63dd0, Apache-2.0. A Wycheproof `invalid` case passes only when C_Verify does NOT return CKR_OK.'
  ),
  acvp(
    '37.wycheproof-keywrap',
    '§37c (sections/wycheproofNegative.ts)',
    'AES-KW / AES-KWP unwrap — Project Wycheproof (Google / C2SP): modified padding, wrong-length and truncated wrapped keys, integrity failures',
    [
      ...casesOf('wycheproof_aes_wrap_test').map((c) =>
        mc(
          c.caseId,
          ORACLE,
          c.expectation,
          [x('CKM_AES_KEY_WRAP', 'unwrap', `AES-${param(c, 'keyLen')}`)],
          `wyc-aeskw-${upstreamIds(c)}-{engine}`
        )
      ),
      ...casesOf('wycheproof_aes_kwp_test').map((c) =>
        mc(
          c.caseId,
          ORACLE,
          c.expectation,
          [x('CKM_AES_KEY_WRAP_KWP', 'unwrap', `AES-${param(c, 'keyLen')}`)],
          `wyc-aeskwp-${upstreamIds(c)}-{engine}`
        )
      ),
    ],
    'Source: https://github.com/C2SP/wycheproof @ 3fa63dd0, Apache-2.0. A Wycheproof `invalid` case passes when C_UnwrapKey refuses; unwrapping it successfully is a discrepancy row.'
  ),
]

// ── katRunner (src/utils/katRunner.ts) — Rust engine via useHSM() ───────────

const kat = (
  kind: string,
  title: string,
  cases: RegisteredCase[],
  note?: string
): RegisteredTest => ({
  id: `kat.${kind}`,
  runner: 'katRunner',
  ref: `KatKind '${kind}'`,
  title,
  engines: RUST,
  cases,
  ...(note ? { note } : {}),
})

/** Attach the KatKind that executes a registered case. */
const k = (c: RegisteredCase, katKind: KatKindRef): RegisteredCase => ({ ...c, katKind })

const TS33501_C441 = {
  citation: 'ETSI TS 133 501 V19.5.0 (3GPP TS 33.501 Rel-19) Annex C.4.4.1 — ECIES Profile B, IMSI',
  url: 'https://www.etsi.org/deliver/etsi_ts/133500_133599/133501/19.05.00_60/ts_133501v190500p.pdf',
}
const suciNote =
  'Expected values printed in Annex C.4.4.1 (src/data/kat/gsma_suci_ts33501_annex_c.json, profile-b-imsi); the file is outside the src/data/acvp vector manifest.'

const HMACS = [
  ['SHA-256', 'hmac_test', 'CKM_SHA256_HMAC_GENERAL'],
  ['SHA-384', 'hmac_sha384_test', 'CKM_SHA384_HMAC_GENERAL'],
  ['SHA-512', 'hmac_sha512_test', 'CKM_SHA512_HMAC_GENERAL'],
] as const

/** First pure/external positive and negative case per parameter set (katRunner mldsa-sigver-nist). */
const mldsaNistPick = (ps: string, valid: boolean): CaseRecord => {
  const c = casesOf('mldsa_sigver_test', '/testGroups/').find(
    (x) =>
      x.parameters.parameterSet === ps &&
      x.parameters.preHash === 'pure' &&
      x.parameters.externalMu !== true &&
      (x.expectation === 'positive') === valid
  )
  if (!c) throw new Error(`testRegistry: no pure ${valid ? 'positive' : 'negative'} ${ps} case`)
  return c
}

const KAT_RUNNER: RegisteredTest[] = [
  kat(
    'mlkem-decap',
    'ML-KEM decapsulation (testIndex 0)',
    casesOf('mlkem_test').map((c) =>
      k(
        mc(c.caseId, NIST, 'positive', [x('CKM_ML_KEM', 'decapsulate', param(c, 'parameterSet'))]),
        { type: 'mlkem-decap', variant: Number(param(c, 'parameterSet').slice(7)) }
      )
    )
  ),
  kat(
    'mlkem-encap-roundtrip',
    'ML-KEM encapsulate + decapsulate round-trip',
    MLKEM_SETS.map((ps) =>
      k(
        lc('kat.mlkem-encap-roundtrip', ps, RT, 'positive', [
          x('CKM_ML_KEM_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_ML_KEM', 'encapsulate', ps),
          x('CKM_ML_KEM', 'decapsulate', ps),
        ]),
        { type: 'mlkem-encap-roundtrip', variant: Number(ps.slice(7)) }
      )
    )
  ),
  kat(
    'mldsa-sigver',
    'ML-DSA verify of NIST sigGen output (testIndex 0)',
    casesOf('mldsa_test').map((c) =>
      k(mc(c.caseId, NIST, 'positive', [x('CKM_ML_DSA', 'verify', param(c, 'parameterSet'))]), {
        type: 'mldsa-sigver',
        variant: Number(param(c, 'parameterSet').slice(7)),
      })
    )
  ),
  kat(
    'mldsa-sigver-nist',
    'ML-DSA dedicated NIST sigVer, pure: positive and first negative case per parameter set',
    MLDSA_SETS.flatMap((ps) =>
      ([true, false] as const).map((valid) => {
        const c = mldsaNistPick(ps, valid)
        return k(mc(c.caseId, NIST, c.expectation, [x('CKM_ML_DSA', 'verify', ps)]), {
          type: 'mldsa-sigver-nist',
          variant: Number(ps.slice(7)),
          expect: valid ? 'valid' : 'invalid',
        })
      })
    ),
    'Same cases and executor (sections/mldsaAcvp.ts verifyRv) as the workbench §5d.1.'
  ),
  kat(
    'mldsa-functional',
    'ML-DSA sign + verify round-trip',
    MLDSA_SETS.map((ps) =>
      k(
        lc('kat.mldsa-functional', ps, RT, 'positive', [
          x('CKM_ML_DSA_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_ML_DSA', 'sign', ps, 'hedged'),
          x('CKM_ML_DSA', 'verify', ps),
        ]),
        { type: 'mldsa-functional', variant: Number(ps.slice(7)) }
      )
    )
  ),
  kat(
    'slhdsa-functional',
    'SLH-DSA sign + verify round-trip',
    SLH_SETS.map((ps) =>
      k(
        lc('kat.slhdsa-functional', ps, RT, 'positive', [
          x('CKM_SLH_DSA_KEY_PAIR_GEN', 'generate-key-pair', ps),
          x('CKM_SLH_DSA', 'sign', ps, 'hedged'),
          x('CKM_SLH_DSA', 'verify', ps),
        ]),
        { type: 'slhdsa-functional', variant: ps.slice(8) }
      )
    )
  ),
  kat(
    'slhdsa-sigver',
    'SLH-DSA verify of NIST sigGen output (sigGen → local sigVer, context 255 B)',
    casesOf('slhdsa_ctx_test', '/sigVer/').map((c) =>
      k(mc(c.caseId, NIST, 'positive', [x('CKM_SLH_DSA', 'verify', param(c, 'parameterSet'))]), {
        type: 'slhdsa-sigver',
        variant: param(c, 'parameterSet').slice(8),
      })
    ),
    'Same cases as the workbench §9b.'
  ),
  kat('aesgcm-decrypt', 'AES-GCM-256 decrypt (testIndex 0)', [
    k(
      mc('aesgcm_test#/testGroups/0/tests/0', ORACLE, 'positive', [
        x('CKM_AES_GCM', 'decrypt', 'AES-256'),
      ]),
      { type: 'aesgcm-decrypt' }
    ),
  ]),
  kat('aescbc-decrypt', 'AES-CBC-256 decrypt (raw CKM_AES_CBC)', [
    k(
      mc('aescbc_test#/testGroups/0/tests/0', NIST, 'positive', [
        x('CKM_AES_CBC', 'decrypt', 'AES-256'),
      ]),
      { type: 'aescbc-decrypt' }
    ),
  ]),
  kat('aesctr-roundtrip', 'AES-CTR-256 encrypt (expected ciphertext) + decrypt', [
    k(
      mc('aesctr_test#/testGroups/0/tests/0', STD, 'positive', [
        x('CKM_AES_CTR', 'encrypt', 'AES-256'),
        x('CKM_AES_CTR', 'decrypt', 'AES-256', undefined, { evidenceClass: RT }),
      ]),
      { type: 'aesctr-roundtrip' }
    ),
  ]),
  kat('aeskw-wrap', 'AES-KW-256 wrap (testIndex 0)', [
    k(
      mc('aeskw_test#/testGroups/0/tests/0', STD, 'positive', [
        x('CKM_AES_KEY_WRAP', 'wrap', 'AES-256'),
      ]),
      { type: 'aeskw-wrap' }
    ),
  ]),
  kat('aes-kwp-wrap', 'AES-KWP-256 wrap + unwrap round-trip (20-byte generic secret)', [
    k(
      lc('kat.aes-kwp-wrap', '1', RT, 'positive', [
        x('CKM_AES_KEY_WRAP_KWP', 'wrap', 'AES-256'),
        x('CKM_AES_KEY_WRAP_KWP', 'unwrap', 'AES-256'),
      ]),
      { type: 'aes-kwp-wrap' }
    ),
  ]),
  kat('aesgcm-functional', 'AES-GCM encrypt + decrypt round-trip', [
    k(
      lc('kat.aesgcm-functional', '1', RT, 'positive', [
        x('CKM_AES_KEY_GEN', 'generate-key', 'AES-256'),
        x('CKM_AES_GCM', 'encrypt', 'AES-256'),
        x('CKM_AES_GCM', 'decrypt', 'AES-256'),
      ]),
      { type: 'aesgcm-functional' }
    ),
  ]),
  kat(
    'hmac-verify',
    'HMAC-SHA2 verify of the NIST truncated MAC (_GENERAL mechanism)',
    HMACS.map(([hashAlg, file, mech]) =>
      k(mc(`${file}#/testGroups/0/tests/0`, NIST, 'positive', [x(mech, 'verify')]), {
        type: 'hmac-verify',
        hashAlg,
      })
    )
  ),
  kat(
    'hmac-generate',
    'HMAC-SHA2 generation at the NIST truncated macLen (_GENERAL mechanism)',
    HMACS.map(([hashAlg, file, mech]) =>
      k(
        {
          ...mc(
            `${file}#/testGroups/0/tests/0`,
            NIST,
            'positive',
            [x(mech, 'sign')],
            undefined,
            'generate'
          ),
          operation: 'mac-generate',
        },
        { type: 'hmac-generate', hashAlg }
      )
    ),
    "Runs the upstream AFT's own operation (MAC generation) on the manifest case whose recorded local operation is verification."
  ),
  kat(
    'sha256-hash',
    "SHA2-256 digest (testIndex 0-2: the file's three NIST cases)",
    casesOf('sha256_test', '/testGroups/0/tests/').map((c) => {
      const i = Number(c.pointer.split('/').pop())
      return k(mc(c.caseId, NIST, 'positive', [x('CKM_SHA256', 'digest')]), {
        type: 'sha256-hash',
        ...(i ? { testIndex: i } : {}),
      })
    })
  ),
  kat(
    'sha384-hash',
    "SHA2-384 digest (testIndex 0-2: the file's three NIST cases)",
    casesOf('sha384_test', '/testGroups/0/tests/').map((c) => {
      const i = Number(c.pointer.split('/').pop())
      return k(mc(c.caseId, NIST, 'positive', [x('CKM_SHA384', 'digest')]), {
        type: 'sha384-hash',
        ...(i ? { testIndex: i } : {}),
      })
    })
  ),
  kat(
    'sha512-hash',
    "SHA2-512 digest (testIndex 0-2: the file's three NIST cases)",
    casesOf('sha512_test', '/testGroups/0/tests/').map((c) => {
      const i = Number(c.pointer.split('/').pop())
      return k(mc(c.caseId, NIST, 'positive', [x('CKM_SHA512', 'digest')]), {
        type: 'sha512-hash',
        ...(i ? { testIndex: i } : {}),
      })
    })
  ),
  kat(
    'sha3-256-hash',
    "SHA3-256 digest (testIndex 0-2: the file's three NIST cases)",
    casesOf('sha3_256_test', '/testGroups/0/tests/').map((c) => {
      const i = Number(c.pointer.split('/').pop())
      return k(mc(c.caseId, NIST, 'positive', [x('CKM_SHA3_256', 'digest')]), {
        type: 'sha3-256-hash',
        ...(i ? { testIndex: i } : {}),
      })
    })
  ),
  kat(
    'sha3-512-hash',
    "SHA3-512 digest (testIndex 0-2: the file's three NIST cases)",
    casesOf('sha3_512_test', '/testGroups/0/tests/').map((c) => {
      const i = Number(c.pointer.split('/').pop())
      return k(mc(c.caseId, NIST, 'positive', [x('CKM_SHA3_512', 'digest')]), {
        type: 'sha3-512-hash',
        ...(i ? { testIndex: i } : {}),
      })
    })
  ),
  kat(
    'digest-multipart',
    'Multi-part digest (C_DigestUpdate) vs single-shot expected value',
    (
      [
        ['SHA-256', 'sha256_test', 'CKM_SHA256'],
        ['SHA-384', 'sha384_test', 'CKM_SHA384'],
        ['SHA-512', 'sha512_test', 'CKM_SHA512'],
      ] as const
    ).map(([hashAlg, file, mech]) =>
      k(
        mc(
          `${file}#/testGroups/0/tests/0`,
          NIST,
          'positive',
          [x(mech, 'digest')],
          undefined,
          'multipart'
        ),
        { type: 'digest-multipart', hashAlg }
      )
    )
  ),
  kat('ecdsa-sigver', 'ECDSA verify (testIndex 0)', [
    k(
      mc('ecdsa_test#/testGroups/0/tests/0', STD, 'positive', [
        x('CKM_ECDSA_SHA256', 'verify', 'P-256'),
      ]),
      { type: 'ecdsa-sigver', curve: 'P-256' }
    ),
    k(
      mc('ecdsa_p384_test#/testGroups/0/tests/0', STD, 'positive', [
        x('CKM_ECDSA_SHA384', 'verify', 'P-384'),
      ]),
      { type: 'ecdsa-sigver', curve: 'P-384' }
    ),
    k(
      mc('ecdsa_p521_test#/testGroups/0/tests/0', NIST, 'positive', [
        x('CKM_ECDSA_SHA512', 'verify', 'P-521'),
      ]),
      { type: 'ecdsa-sigver', curve: 'P-521' }
    ),
  ]),
  kat('eddsa-sigver', 'EdDSA verify (testIndex 0)', [
    k(
      mc('eddsa_test#/testGroups/0/tests/0', STD, 'positive', [
        x('CKM_EDDSA', 'verify', 'Ed25519'),
      ]),
      { type: 'eddsa-sigver' }
    ),
    k(
      mc('eddsa_ed448_test#/testGroups/0/tests/0', NIST, 'positive', [
        x('CKM_EDDSA', 'verify', 'Ed448'),
      ]),
      { type: 'eddsa-sigver', curve: 'Ed448' }
    ),
  ]),
  kat('rsapss-sigver', 'RSA-PSS SHA-256 verify (testIndex 0)', [
    k(
      mc('rsapss_test#/testGroups/0/tests/0', ORACLE, 'positive', [
        x('CKM_SHA256_RSA_PKCS_PSS', 'verify'),
      ]),
      { type: 'rsapss-sigver' }
    ),
  ]),
  kat('ecdsa-functional', 'ECDSA sign + verify round-trip', [
    k(
      lc('kat.ecdsa-functional', 'P-256', RT, 'positive', [
        x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-256'),
        x('CKM_ECDSA_SHA256', 'sign', 'P-256'),
        x('CKM_ECDSA_SHA256', 'verify', 'P-256'),
      ]),
      { type: 'ecdsa-functional', curve: 'P-256' }
    ),
    k(
      lc('kat.ecdsa-functional', 'P-384', RT, 'positive', [
        x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-384'),
        x('CKM_ECDSA_SHA384', 'sign', 'P-384'),
        x('CKM_ECDSA_SHA384', 'verify', 'P-384'),
      ]),
      { type: 'ecdsa-functional', curve: 'P-384' }
    ),
  ]),
  kat('eddsa-functional', 'Ed25519 sign + verify round-trip', [
    k(
      lc('kat.eddsa-functional', 'Ed25519', RT, 'positive', [
        x('CKM_EC_EDWARDS_KEY_PAIR_GEN', 'generate-key-pair', 'Ed25519'),
        x('CKM_EDDSA', 'sign', 'Ed25519'),
        x('CKM_EDDSA', 'verify', 'Ed25519'),
      ]),
      { type: 'eddsa-functional' }
    ),
  ]),
  kat(
    'rsa-functional',
    'RSA key generation + RSA-PSS SHA-256 sign + verify round-trip',
    (['2048', '3072'] as const).map((bits) =>
      k(
        lc(
          'kat.rsa-functional',
          bits,
          RT,
          'positive',
          [
            x('CKM_RSA_PKCS_KEY_PAIR_GEN', 'generate-key-pair'),
            x('CKM_SHA256_RSA_PKCS_PSS', 'sign'),
            x('CKM_SHA256_RSA_PKCS_PSS', 'verify'),
          ],
          { parameters: { modulusBits: Number(bits) } }
        ),
        { type: 'rsa-functional', bits: Number(bits) }
      )
    ),
    'Only the 2048- and 3072-bit variants are instantiated by a product surface (grep of KatKind uses).'
  ),
  kat('aescmac-verify', 'AES-CMAC-256 generate vs SP 800-38B example (testIndex 0)', [
    k(
      mc('aescmac_test#/testGroups/0/tests/0', STD, 'positive', [
        x('CKM_AES_CMAC', 'sign', 'AES-256'),
      ]),
      { type: 'aescmac-verify' }
    ),
  ]),
  kat('ecdh-derive', 'ECDH two-party round-trip', [
    k(
      lc('kat.ecdh-derive', 'P-256', RT, 'positive', [
        x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-256'),
        x('CKM_ECDH1_DERIVE', 'derive', 'P-256'),
      ]),
      { type: 'ecdh-derive', curve: 'P-256' }
    ),
    k(
      lc('kat.ecdh-derive', 'P-384', RT, 'positive', [
        x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-384'),
        x('CKM_ECDH1_DERIVE', 'derive', 'P-384'),
      ]),
      { type: 'ecdh-derive', curve: 'P-384' }
    ),
  ]),
  kat(
    'pbkdf2-derive',
    'PBKDF2 derive, c = 4096 (the OpenSSL-oracle case the workbench §17 also runs)',
    (
      [
        ['SHA-256', 'pbkdf2_test#/testGroups/0/tests/1'],
        ['SHA-512', 'pbkdf2_test#/testGroups/1/tests/1'],
      ] as const
    ).map(([prf, caseId]) =>
      k(mc(caseId, ORACLE, 'positive', [x('CKM_PKCS5_PBKD2', 'derive')]), {
        type: 'pbkdf2-derive',
        prf,
      })
    ),
    'The c = 1 cases (tests/0) are not run: the Rust engine refuses iterations < 1000 (open-gaps pbkdf2-min-iterations-divergence).'
  ),
  kat('hkdf-derive', 'HKDF-SHA256 derive (testIndex 0)', [
    k(mc('hkdf_test#/testGroups/0/tests/0', STD, 'positive', [x('CKM_HKDF_DERIVE', 'derive')]), {
      type: 'hkdf-derive',
    }),
  ]),
  kat(
    'suci-profile-b',
    '5G SUCI Profile B (TS 33.501 Annex C.4.4.1): ECDH, X9.63 KDF, AES-CTR, HMAC, scheme output',
    [
      k(
        lc(
          'kat.suci-profile-b',
          '3-ecdh',
          STD,
          'positive',
          [x('CKM_ECDH1_DERIVE', 'derive', 'P-256')],
          {
            source: TS33501_C441,
            note: suciNote,
          }
        ),
        { type: 'suci-profile-b', step: '3-ecdh' }
      ),
      k(
        lc(
          'kat.suci-profile-b',
          '4-kdf',
          STD,
          'positive',
          [x('CKM_ECDH1_DERIVE', 'derive', 'P-256')],
          {
            source: TS33501_C441,
            note: `${suciNote} ECDH with CKD_SHA256_KDF (ANSI X9.63), SharedInfo = compressed ephemeral key.`,
          }
        ),
        { type: 'suci-profile-b', step: '4-kdf' }
      ),
      k(
        lc(
          'kat.suci-profile-b',
          '5-encrypt',
          STD,
          'positive',
          [x('CKM_AES_CTR', 'encrypt', 'AES-128')],
          {
            source: TS33501_C441,
            note: suciNote,
          }
        ),
        { type: 'suci-profile-b', step: '5-encrypt' }
      ),
      k(
        lc('kat.suci-profile-b', '6-mac', STD, 'positive', [x('CKM_SHA256_HMAC_GENERAL', 'sign')], {
          source: TS33501_C441,
          note: suciNote,
        }),
        { type: 'suci-profile-b', step: '6-mac' }
      ),
      k(
        lc(
          'kat.suci-profile-b',
          '7-e2e',
          STD,
          'positive',
          [
            x('CKM_ECDH1_DERIVE', 'derive', 'P-256'),
            x('CKM_AES_CTR', 'encrypt', 'AES-128'),
            x('CKM_SHA256_HMAC_GENERAL', 'sign'),
          ],
          {
            source: TS33501_C441,
            note: `${suciNote} Compares the Scheme Output; no full SUCI string is published.`,
          }
        ),
        { type: 'suci-profile-b', step: '7-e2e' }
      ),
    ],
    'Steps 1-2 (key import only) exercise no mechanism and are not registered.'
  ),
]

// ── PKCS #11 conformance runner (usePkcs11Conformance.ts) ───────────────────

const probe = (
  id: string,
  title: string,
  exercises: CaseExercise[],
  note?: string
): RegisteredTest => ({
  id: `probe.${id}`,
  runner: 'mechanismCoverageProbes',
  ref: `mechanismProbes() id '${id}'`,
  title,
  engines: BOTH,
  cases: [lc(`probe.${id}`, '1', PROBE, 'positive', exercises, note ? { note } : {})],
})

const MECHANISM_PROBES: RegisteredTest[] = [
  probe('pqc-seed-mldsa', 'ML-DSA-65 key generation from CKA_SEED is deterministic', [
    x('CKM_ML_DSA_KEY_PAIR_GEN', 'generate-key-pair', 'ML-DSA-65'),
  ]),
  probe('pqc-seed-mlkem', 'ML-KEM-768 key generation from CKA_SEED is deterministic', [
    x('CKM_ML_KEM_KEY_PAIR_GEN', 'generate-key-pair', 'ML-KEM-768'),
  ]),
  probe('pqc-seed-slhdsa', 'SLH-DSA-SHA2-128s key generation from CKA_SEED is deterministic', [
    x('CKM_SLH_DSA_KEY_PAIR_GEN', 'generate-key-pair', 'SLH-DSA-SHA2-128s'),
  ]),
  probe('hybrid-ecdh1-kem', 'CKM_ECDH1_DERIVE as C_EncapsulateKey / C_DecapsulateKey (P-256)', [
    x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-256'),
    x('CKM_ECDH1_DERIVE', 'encapsulate', 'P-256'),
    x('CKM_ECDH1_DERIVE', 'decapsulate', 'P-256'),
  ]),
  probe('hybrid-concatenate-base-and-key', 'CKM_CONCATENATE_BASE_AND_KEY produces base‖other', [
    x('CKM_CONCATENATE_BASE_AND_KEY', 'derive'),
  ]),
  probe('classical-rsa-pkcs', 'CKM_RSA_PKCS sign + verify (RSA-2048)', [
    x('CKM_RSA_PKCS_KEY_PAIR_GEN', 'generate-key-pair'),
    x('CKM_RSA_PKCS', 'sign'),
    x('CKM_RSA_PKCS', 'verify'),
  ]),
  probe(
    'classical-rsa-x509',
    'CKM_RSA_X_509 sign + verify (RSA-2048)',
    [
      x('CKM_RSA_PKCS_KEY_PAIR_GEN', 'generate-key-pair'),
      x('CKM_RSA_X_509', 'sign'),
      x('CKM_RSA_X_509', 'verify'),
    ],
    'The probe takes the C_SignRecover path only when CKF_SIGN is absent; both shipped engines set CKF_SIGN, so it drives C_Sign/C_Verify.'
  ),
  probe('classical-rsa-hash-sign', 'CKM_SHA256_RSA_PKCS sign + verify (RSA-2048)', [
    x('CKM_RSA_PKCS_KEY_PAIR_GEN', 'generate-key-pair'),
    x('CKM_SHA256_RSA_PKCS', 'sign'),
    x('CKM_SHA256_RSA_PKCS', 'verify'),
  ]),
  probe(
    'classical-ecdsa-raw',
    'CKM_ECDSA (raw) sign + verify over a C_Digest SHA-256 digest (P-256)',
    [
      x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-256'),
      x('CKM_SHA256', 'digest'),
      x('CKM_ECDSA', 'sign', 'P-256'),
      x('CKM_ECDSA', 'verify', 'P-256'),
    ]
  ),
  probe('classical-ecdh-cofactor', 'CKM_ECDH1_COFACTOR_DERIVE two-party agreement (P-256)', [
    x('CKM_EC_KEY_PAIR_GEN', 'generate-key-pair', 'P-256'),
    x('CKM_ECDH1_COFACTOR_DERIVE', 'derive', 'P-256'),
  ]),
  probe(
    'symmetric-aes-cbc-pad',
    'CKM_AES_CBC_PAD encrypt + decrypt of a non-aligned plaintext (AES-128)',
    [
      x('CKM_AES_KEY_GEN', 'generate-key', 'AES-128'),
      x('CKM_AES_CBC_PAD', 'encrypt', 'AES-128'),
      x('CKM_AES_CBC_PAD', 'decrypt', 'AES-128'),
    ]
  ),
  probe(
    'symmetric-aes-key-wrap-pad',
    'CKM_AES_KEY_WRAP_PAD wrap + unwrap of a 20-byte secret (AES-256 KEK)',
    [
      x('CKM_AES_KEY_GEN', 'generate-key', 'AES-256'),
      x('CKM_AES_KEY_WRAP_PAD', 'wrap', 'AES-256'),
      x('CKM_AES_KEY_WRAP_PAD', 'unwrap', 'AES-256'),
    ]
  ),
]

const CONFORMANCE: RegisteredTest[] = [
  {
    id: 'oasis.AUTH-M-1-32',
    runner: 'oasisProfileXml',
    ref: 'TIER_A_CASES AUTH-M-1-32 (Profiles v3.2 §5.4.1)',
    title: 'OASIS Authentication Token mandatory case — C_Sign with CKM_SHA256_RSA_PKCS',
    engines: BOTH,
    cases: [
      lc('oasis.AUTH-M-1-32', '1', OASIS, 'positive', [x('CKM_SHA256_RSA_PKCS', 'sign')], {
        note: 'Asserts rv=OK only; the XML carries no expected signature value.',
      }),
    ],
  },
  {
    id: 'oasis.api-only',
    runner: 'oasisProfileXml',
    ref: 'TIER_A_CASES BL-M-1-32, EXT-M-1-32, CERT-M-1-32',
    title: 'OASIS Baseline / Extended / Public-Certificates mandatory cases',
    engines: BOTH,
    cases: [],
    note: 'API-behavior only (sessions, slots, objects, C_GetMechanismInfo); no mechanism operation. Belongs to the API-behavior matrix (plan G-3), not this algorithm matrix.',
  },
  {
    id: 'profile.auth-fn-sign',
    runner: 'profileConditions',
    ref: "profileConditions 'auth-fn-sign'",
    title: 'Authentication Token profile condition — CKM_SHA256_RSA_PKCS sign then verify',
    engines: BOTH,
    cases: [
      lc('profile.auth-fn-sign', '1', PROBE, 'positive', [
        x('CKM_SHA256_RSA_PKCS', 'sign'),
        x('CKM_SHA256_RSA_PKCS', 'verify'),
      ]),
    ],
  },
  {
    id: 'profile.hkdf-data',
    runner: 'profileConditions',
    ref: "profileConditions 'hkdf-obj-data', 'hkdf-fn-derivekey', 'hkdf-mech-tlsiv', 'hkdf-mech-tlsquiciv'",
    title: 'HKDF TLS Token profile conditions — C_DeriveKey(CKM_HKDF_DATA)',
    engines: BOTH,
    cases: [
      lc('profile.hkdf-data', 'tls-iv', PROBE, 'positive', [x('CKM_HKDF_DATA', 'derive')]),
      lc('profile.hkdf-data', 'tls-quic-iv', PROBE, 'positive', [x('CKM_HKDF_DATA', 'derive')]),
    ],
    note: 'Asserts the derive is accepted and yields a CKO_DATA object; no expected output value.',
  },
  {
    id: 'profile.api-only',
    runner: 'profileConditions',
    ref: 'profileConditions — the remaining Tier B probes',
    title: 'Generated profile-condition probes (sessions, login, objects, attributes)',
    engines: BOTH,
    cases: [],
    note: 'API-behavior only; product-generated, not OASIS-published cases (plan G-4). Belongs to the API-behavior matrix (plan G-3).',
  },
]

// ── Error-path / required-operation probes (errorPathProbes.ts, plan G-8 / G-2) ──
//
// Expanded from the committed mechanism inventory by the SAME catalog function
// the runtime runner uses (errorPathCatalog.expandErrorPathCases), never
// written by hand: one test per (operation, probe kind), one case per
// mechanism, exercising every probed parameter set × sign variant. G-2
// "executes" cases are generated only for (mechanism, operation) pairs no other
// registered test drives.

const exercisedPairs = (tests: RegisteredTest[]): Set<string> =>
  new Set(
    tests.flatMap((t) =>
      t.cases.flatMap((c) =>
        c.exercises.map((e) => `${e.capability.mechanism}|${e.capability.operation}`)
      )
    )
  )

const inventoryRecords = (): InventoryMechLike[][] => {
  const inv = inventoryJson as unknown as {
    engines: Record<string, { inventory: { mechanisms: InventoryMechLike[] } }>
  }
  return Object.values(inv.engines).map((e) => e.inventory.mechanisms)
}

const errorPathTests = (existing: RegisteredTest[]): RegisteredTest[] => {
  const byTest = new Map<string, RegisteredTest>()
  for (const c of expandErrorPathCases(inventoryRecords(), {
    skipExecutes: exercisedPairs(existing),
  })) {
    const kind = probeKind(c.kind)
    let t = byTest.get(c.testId)
    if (!t) {
      t = {
        id: c.testId,
        runner: 'errorPathProbes',
        ref: `errorPathCatalog PROBE_KINDS '${c.kind}' × operation '${c.op}'`,
        title: kind.title(c.op),
        engines: BOTH,
        cases: [],
        note: `${kind.probeClass}. Asserts: ${kind.steps(c.op)}. Cites ${kind.citation(c.op)}. Why no existing test covers it (G-5): ${kind.whyNotCovered}`,
      }
      byTest.set(c.testId, t)
    }
    t.cases.push(
      lc(
        c.testId,
        c.mechanism,
        PROBE,
        kind.polarity,
        c.cells.map((cell) => x(c.mechanism, c.op, cell.parameterSet, cell.variant))
      )
    )
  }
  return [...byTest.values()]
}

/** Every registered test, in runner order. */
/**
 * The skip row each workbench section emits (pushSkip) when the engine does
 * not advertise its mechanism — read from useAcvpSuite.ts. A recorded skip
 * counts for every case of that test on that engine, as its own status.
 */
const SKIP_ROW_PREFIX: Readonly<Record<string, string>> = {
  'acvp.01': 'aes',
  'acvp.02': 'hmac',
  'acvp.03': 'rsa',
  'acvp.04': 'ecdsa',
  'acvp.10': 'sha256',
  'acvp.10b': 'sha384',
  'acvp.10c': 'sha512',
  'acvp.10d': 'sha3-256',
  'acvp.10e': 'sha3-512',
  'acvp.11': 'aescbc',
  'acvp.12': 'aesctr',
  'acvp.13': 'hmac384',
  'acvp.14': 'hmac512',
  'acvp.15': 'ecdsa384',
  'acvp.16': 'eddsa-sigver',
  'acvp.16b': 'eddsa448-sigver',
  'acvp.17': 'pbkdf2',
  'acvp.18': 'hkdf',
  'acvp.19': 'aeskw',
  'acvp.20': 'aeskwp',
  'acvp.23': 'x25519',
  'acvp.24': 'x448',
  'acvp.25': 'x963-sha3-kdf',
  'acvp.26': 'chacha20',
  'acvp.27': 'sp800-108',
  'acvp.29': 'sp800-108-feedback',
  'acvp.30': 'xmss',
  'acvp.31': 'hss',
  'acvp.32': 'ecdsa-k1',
  'acvp.33': 'ecdsa521',
  'acvp.34': 'ecdh521',
  'acvp.35': 'kmac128',
  'acvp.36': 'rsaoaep',
}
const withSkipRows = (tests: RegisteredTest[]): RegisteredTest[] =>
  tests.map((t) =>
    SKIP_ROW_PREFIX[t.id] ? { ...t, skipRowId: `${SKIP_ROW_PREFIX[t.id]}-skip-{engine}` } : t
  )

const BASE_REGISTRY: RegisteredTest[] = [
  ...withSkipRows(USE_ACVP_SUITE),
  ...KAT_RUNNER,
  ...MECHANISM_PROBES,
  ...CONFORMANCE,
]

export const TEST_REGISTRY: RegisteredTest[] = [...BASE_REGISTRY, ...errorPathTests(BASE_REGISTRY)]

/** Exposed for the registry's own consistency test. */
export const __registryInternals = { manifestCase, hashMlDsaMech }
