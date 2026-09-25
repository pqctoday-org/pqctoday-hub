// SPDX-License-Identifier: GPL-3.0-only
/**
 * katEvidence — what kind of evidence backs each katRunner test kind, derived
 * from the vector file the kind actually reads (never from a label or button
 * text). ACVP validation remediation plan 2026-09-24, WS-A items A-1/A-2.
 *
 * The rule is the same one useAcvpSuite.ts's deriveEvidenceTier applies: a
 * vector file is "ACVP-backed" only when its own `_provenance.producer`
 * starts with "NIST ACVP-Server". Kinds that read no vector at all (fresh
 * keypair → sign → verify, wrap → unwrap, …) are functional round-trips and
 * carry no external expected value.
 *
 * UI surfaces (KATView, KatValidationPanel, MobileKATValidationView) build
 * their per-row evidence labels and their run-button text from this module,
 * so a button can only say "reference sample" when every test it runs reads
 * a NIST ACVP-Server file. katEvidence.test.ts enforces that.
 */
/* eslint-disable security/detect-object-injection */
import mlkemTestVectors from '../data/acvp/mlkem_test.json'
import mldsaTestVectors from '../data/acvp/mldsa_test.json'
import aesgcmTestVectors from '../data/acvp/aesgcm_test.json'
import aescbcTestVectors from '../data/acvp/aescbc_test.json'
import aesctrTestVectors from '../data/acvp/aesctr_test.json'
import aeskwTestVectors from '../data/acvp/aeskw_test.json'
import hmacTestVectors from '../data/acvp/hmac_test.json'
import hmacSha384TestVectors from '../data/acvp/hmac_sha384_test.json'
import hmacSha512TestVectors from '../data/acvp/hmac_sha512_test.json'
import ecdsaTestVectors from '../data/acvp/ecdsa_test.json'
import ecdsaP384TestVectors from '../data/acvp/ecdsa_p384_test.json'
import eddsaTestVectors from '../data/acvp/eddsa_test.json'
import rsapssTestVectors from '../data/acvp/rsapss_test.json'
import sha256TestVectors from '../data/acvp/sha256_test.json'
import sha384TestVectors from '../data/acvp/sha384_test.json'
import sha512TestVectors from '../data/acvp/sha512_test.json'
import sha3_256TestVectors from '../data/acvp/sha3_256_test.json'
import sha3_512TestVectors from '../data/acvp/sha3_512_test.json'
import aescmacTestVectors from '../data/acvp/aescmac_test.json'
import pbkdf2TestVectors from '../data/acvp/pbkdf2_test.json'
import hkdfTestVectors from '../data/acvp/hkdf_test.json'
import type { KatKind, KatTestSpec } from './katRunner'

/** Evidence classes, named as in the remediation plan §2.1. */
export type KatEvidenceClass =
  | 'nist-acvp-reference-sample'
  | 'published-standard-kat'
  | 'independent-oracle'
  | 'functional-round-trip'
  /** Vector file exists but carries no `_provenance` block — origin unknown. */
  | 'unverified-provenance'

interface VectorFileRef {
  /** Path under src/data/, for display and for the static test. */
  file: string
  producer: string | undefined
  /** Immutable upstream URL from `_provenance.source_url`, when recorded. */
  sourceUrl?: string
}

interface ProvenanceShape {
  _provenance?: { producer?: string; source_url?: string | null }
}

const ref = (file: string, json: unknown): VectorFileRef => {
  const p = (json as ProvenanceShape)._provenance
  return { file, producer: p?.producer, sourceUrl: p?.source_url ?? undefined }
}

/** Same rule as useAcvpSuite.ts deriveEvidenceTier, extended with the unknown case. */
export function classifyProducer(producer: string | undefined): KatEvidenceClass {
  if (!producer) return 'unverified-provenance'
  if (producer.startsWith('NIST ACVP-Server')) return 'nist-acvp-reference-sample'
  if (producer.startsWith('self-generated')) return 'independent-oracle'
  return 'published-standard-kat'
}

/**
 * The vector file each kind reads (mirrors the imports in katRunner.ts), or
 * null when the kind is a functional round-trip with no external expected
 * value. `suci-profile-b` reads a 3GPP TS 33.501 Annex C file outside
 * src/data/acvp; it is a published-standard example.
 */
export function vectorFileForKind(kind: KatKind): VectorFileRef | null {
  switch (kind.type) {
    case 'mlkem-decap':
      return ref('acvp/mlkem_test.json', mlkemTestVectors)
    case 'mldsa-sigver':
      return ref('acvp/mldsa_test.json', mldsaTestVectors)
    case 'aesgcm-decrypt':
      return ref('acvp/aesgcm_test.json', aesgcmTestVectors)
    case 'aescbc-decrypt':
      return ref('acvp/aescbc_test.json', aescbcTestVectors)
    case 'aesctr-roundtrip':
      // Encrypts then decrypts the SP 800-38A sample; the expected value is
      // the published plaintext, so it still rests on that file's provenance.
      return ref('acvp/aesctr_test.json', aesctrTestVectors)
    case 'aeskw-wrap':
      return ref('acvp/aeskw_test.json', aeskwTestVectors)
    case 'hmac-verify':
    case 'hmac-generate':
      return kind.hashAlg === 'SHA-384'
        ? ref('acvp/hmac_sha384_test.json', hmacSha384TestVectors)
        : kind.hashAlg === 'SHA-512'
          ? ref('acvp/hmac_sha512_test.json', hmacSha512TestVectors)
          : ref('acvp/hmac_test.json', hmacTestVectors)
    case 'sha256-hash':
      return ref('acvp/sha256_test.json', sha256TestVectors)
    case 'sha384-hash':
      return ref('acvp/sha384_test.json', sha384TestVectors)
    case 'sha512-hash':
      return ref('acvp/sha512_test.json', sha512TestVectors)
    case 'sha3-256-hash':
      return ref('acvp/sha3_256_test.json', sha3_256TestVectors)
    case 'sha3-512-hash':
      return ref('acvp/sha3_512_test.json', sha3_512TestVectors)
    case 'digest-multipart':
      return kind.hashAlg === 'SHA-384'
        ? ref('acvp/sha384_test.json', sha384TestVectors)
        : kind.hashAlg === 'SHA-512'
          ? ref('acvp/sha512_test.json', sha512TestVectors)
          : ref('acvp/sha256_test.json', sha256TestVectors)
    case 'ecdsa-sigver':
      return kind.curve === 'P-384'
        ? ref('acvp/ecdsa_p384_test.json', ecdsaP384TestVectors)
        : ref('acvp/ecdsa_test.json', ecdsaTestVectors)
    case 'eddsa-sigver':
      return ref('acvp/eddsa_test.json', eddsaTestVectors)
    case 'rsapss-sigver':
      return ref('acvp/rsapss_test.json', rsapssTestVectors)
    case 'aescmac-verify':
      return ref('acvp/aescmac_test.json', aescmacTestVectors)
    case 'pbkdf2-derive':
      return ref('acvp/pbkdf2_test.json', pbkdf2TestVectors)
    case 'hkdf-derive':
      return ref('acvp/hkdf_test.json', hkdfTestVectors)
    case 'suci-profile-b':
      return {
        file: 'kat/gsma_suci_ts33501_annex_c.json',
        producer: '3GPP TS 33.501 Annex C.4 (published test vectors, not from ACVP)',
      }
    case 'mlkem-encap-roundtrip':
    case 'mldsa-functional':
    case 'slhdsa-functional':
    case 'aesgcm-functional':
    case 'ecdsa-functional':
    case 'eddsa-functional':
    case 'rsa-functional':
    case 'ecdh-derive':
    case 'aes-kwp-wrap':
      return null
  }
}

export function evidenceForKind(kind: KatKind): KatEvidenceClass {
  const file = vectorFileForKind(kind)
  return file ? classifyProducer(file.producer) : 'functional-round-trip'
}

export const isAcvpBacked = (kind: KatKind): boolean =>
  evidenceForKind(kind) === 'nist-acvp-reference-sample'

export const KAT_EVIDENCE_META: Record<KatEvidenceClass, { label: string; short: string }> = {
  'nist-acvp-reference-sample': {
    label: 'Public NIST ACVP-Server reference sample',
    short: 'NIST ACVP sample',
  },
  'published-standard-kat': {
    label: "Published standard's own example / KAT (not ACVP)",
    short: 'Standard KAT',
  },
  'independent-oracle': {
    label: 'Independent-oracle comparison (OpenSSL), not a published KAT',
    short: 'Oracle comparison',
  },
  'functional-round-trip': {
    label: 'Functional round-trip — no external expected value',
    short: 'Functional',
  },
  'unverified-provenance': {
    label: 'Vector with unrecorded provenance — treat as unverified',
    short: 'Unverified source',
  },
}

const ACTION_LABEL: Record<KatEvidenceClass, string> = {
  'nist-acvp-reference-sample': 'Run reference samples',
  'published-standard-kat': 'Run standard KATs',
  'independent-oracle': 'Run oracle comparisons',
  'functional-round-trip': 'Run functional tests',
  'unverified-provenance': 'Run validation tests',
}

/**
 * Button text for a run that executes `specs`. Evidence-specific only when
 * every spec shares one class; any mix gets the neutral label.
 */
export function katActionLabel(specs: readonly Pick<KatTestSpec, 'kind'>[]): string {
  const classes = new Set(specs.map((s) => evidenceForKind(s.kind)))
  if (classes.size === 1) {
    const [only] = classes
    const label = ACTION_LABEL[only]
    return specs.length === 1 ? label.replace(/s$/, '') : label
  }
  return 'Run validation tests'
}

/** Distinct evidence classes in a spec set, in a stable display order. */
export function evidenceClassesFor(
  specs: readonly Pick<KatTestSpec, 'kind'>[]
): KatEvidenceClass[] {
  const order = Object.keys(KAT_EVIDENCE_META) as KatEvidenceClass[]
  const present = new Set(specs.map((s) => evidenceForKind(s.kind)))
  return order.filter((c) => present.has(c))
}
