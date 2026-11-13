// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { GateReason } from '@/components/shared/GateReason'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle,
  Circle,
  Lock,
  Info,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { ENVELOPE_ENCRYPTION_STEPS, type EnvelopeEncryptionStep } from '../data/kmsConstants'
import {
  buildHke1,
  HKE1_FORMAT_LABEL,
  HKE1_HEADER_BYTES,
  hke1TotalBytes,
  parseHke1,
} from '../utils/hke1Envelope'
import { useHSM, type HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_generateMLKEMKeyPair,
  hsm_generateRSAWrapKeyPair,
  hsm_generateAESKey,
  hsm_importAESKey,
  hsm_importGenericSecret,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_hkdf,
  hsm_wrapKeyMech,
  hsm_unwrapKeyMech,
  hsm_aesGcmWrapKey,
  hsm_aesGcmUnwrapKey,
  hsm_rsaOaepWrapKey,
  hsm_rsaOaepUnwrapKey,
  hsm_getKeyCheckValue,
  hsm_extractKeyValue,
  CKM_SHA256,
  CKM_AES_KEY_WRAP,
  CKM_AES_KEY_WRAP_KWP,
  CKA_CLASS,
  CKO_SECRET_KEY,
  CKA_KEY_TYPE,
  CKK_AES,
  CKK_GENERIC_SECRET,
  CKA_TOKEN,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  type AttrDef,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { translateCryptoError } from '@/utils/cryptoErrorHint'
import type { KatTestSpec } from '@/utils/katRunner'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'

// ── Types ─────────────────────────────────────────────────────────────────────

type KekAlgorithm = 'ml-kem-512' | 'ml-kem-768' | 'ml-kem-1024' | 'rsa-2048' | 'rsa-4096'
type WrapMechanism = 'aes-kw' | 'aes-kwp' | 'aes-gcm'

// ── Constants ─────────────────────────────────────────────────────────────────

const RSA_OAEP_STANDARD = 'PKCS #1 v2.2 §7.1 · RFC 8017'

/** Fixed 32-byte HKDF salt for the KMS envelope encryption protocol.
 *  The length is this module's design choice (it matches the SHA-256 output length). SP 800-56C
 *  does not require a minimum salt length, and RFC 5869 §3.1 lets the salt be any length or
 *  absent.
 *  Value: UTF-8 "kms-envelope-salt-v1" right-padded with 0x00 to 32 bytes. */
const ENVELOPE_HKDF_SALT: Uint8Array = (() => {
  const buf = new Uint8Array(32)
  new TextEncoder().encodeInto('kms-envelope-salt-v1', buf)
  return buf
})()

/**
 * Known-answer checks for the primitives this workshop calls. The evidence class of each row is
 * derived from its vector file (ACVP reference sample, published standard vector, or a
 * round-trip with no external expected value) and shown next to the result, so a round-trip row
 * is labelled as one here too.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const KMS_KAT_SPECS: KatTestSpec[] = [
  // FIPS 203 decapsulation against NIST ACVP-Server sample vectors, one per parameter set
  {
    id: 'kms-envelope-kem-decap-512',
    useCase: 'Envelope KEM decapsulation vs NIST ACVP vector (ML-KEM-512)',
    standard: 'FIPS 203 §7.3 (NIST ACVP decapsulation sample)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-decap', variant: 512 },
  },
  {
    id: 'kms-envelope-kem-decap-768',
    useCase: 'Envelope KEM decapsulation vs NIST ACVP vector (ML-KEM-768)',
    standard: 'FIPS 203 §7.3 (NIST ACVP decapsulation sample)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-decap', variant: 768 },
  },
  {
    id: 'kms-envelope-kem-decap-1024',
    useCase: 'Envelope KEM decapsulation vs NIST ACVP vector (ML-KEM-1024)',
    standard: 'FIPS 203 §7.3 (NIST ACVP decapsulation sample)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-decap', variant: 1024 },
  },
  // Round-trips: they show the engine is self-consistent, not that it matches a published answer
  {
    id: 'kms-envelope-kem-768',
    useCase: 'Envelope KEM encap/decap round-trip (ML-KEM-768)',
    standard: 'FIPS 203 §7 (round-trip only, no external expected value)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'kms-envelope-kem-512',
    useCase: 'Envelope KEM encap/decap round-trip (ML-KEM-512)',
    standard: 'FIPS 203 §7 (round-trip only, no external expected value)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 512 },
  },
  {
    id: 'kms-envelope-kem-1024',
    useCase: 'Envelope KEM encap/decap round-trip (ML-KEM-1024)',
    standard: 'FIPS 203 §7 (round-trip only, no external expected value)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 1024 },
  },
  // AES-GCM: a NIST CAVP gcmDecrypt256 vector, then this module's own header as a round-trip
  {
    id: 'kms-dek-decrypt-gcm-cavp',
    useCase: 'DEK decryption vs NIST CAVP vector (AES-256-GCM)',
    standard: 'SP 800-38D (NIST CAVP gcmDecrypt256 vector)',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-decrypt', testIndex: 0 },
  },
  {
    id: 'kms-dek-encrypt',
    useCase: 'DEK encryption round-trip (AES-256-GCM)',
    standard: 'SP 800-38D (round-trip only, no external expected value)',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-functional' },
    message: 'KMS envelope header: keyId=arn:kms:pqc/key-001,context=prod-db',
  },
  {
    id: 'kms-kek-wrap',
    useCase: 'KEK key wrapping (AES-256-KW)',
    standard: 'RFC 3394',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc3394',
    kind: { type: 'aeskw-wrap' },
  },
  {
    id: 'kms-kek-hkdf',
    useCase: 'KEK derivation from master (HKDF-SHA256)',
    standard: 'RFC 5869 (Appendix A.1 vector); SP 800-56C Rev 2 two-step procedure',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5869',
    kind: { type: 'hkdf-derive' },
  },
  {
    id: 'kms-kek-kwp',
    useCase: 'KEK wrapping with padding (AES-256-KWP): length rule and round-trip',
    standard: 'RFC 5649 §4.1 (round-trip only; the published §6 vectors run in the check below)',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5649',
    kind: { type: 'aes-kwp-wrap' },
  },
]

/**
 * RFC 5649 section 6 publishes AES Key Wrap with Padding examples for a 192-bit KEK. This module
 * wraps with a 256-bit KEK, so these vectors prove the CKM_AES_KEY_WRAP_KWP mechanism reproduces a
 * published answer (wrap) and recovers the published key data (unwrap); they are not an AES-256
 * vector. Each value was re-derived with an independent AES-KWP implementation before it was
 * pinned here.
 */
export interface PublishedKwpVector {
  id: string
  description: string
  kekHex: string
  keyHex: string
  wrappedHex: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const RFC5649_SECTION6_VECTORS: PublishedKwpVector[] = [
  {
    id: 'rfc5649-s6-20-octets',
    description: 'RFC 5649 §6: 20-octet key data (padded to 24), 192-bit KEK',
    kekHex: '5840df6e29b02af1ab493b705bf16ea1ae8338f4dcc176a8',
    keyHex: 'c37b7e6492584340bed12207808941155068f738',
    wrappedHex: '138bdeaa9b8fa7fc61f97742e72248ee5ae6ae5360d1ae6a5f54f373fa543b6a',
  },
  {
    id: 'rfc5649-s6-7-octets',
    description: 'RFC 5649 §6: 7-octet key data (padded to 8), 192-bit KEK',
    kekHex: '5840df6e29b02af1ab493b705bf16ea1ae8338f4dcc176a8',
    keyHex: '466f7250617369',
    wrappedHex: 'afbeb0f07dfbf5419200f2ccb50bb24f',
  },
]

export interface PublishedKwpResult {
  id: string
  description: string
  pass: boolean
  details: string
}

const hexBytes = (hex: string): Uint8Array =>
  Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16))
const bytesHex = (b: Uint8Array): string =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

/**
 * Run the RFC 5649 section 6 vectors through the HSM: wrap the published key data and compare
 * with the published ciphertext, then unwrap the published ciphertext and compare with the
 * published key data.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function runPublishedKwpVectors(
  M: SoftHSMModule,
  hSession: number,
  vectors: PublishedKwpVector[] = RFC5649_SECTION6_VECTORS
): PublishedKwpResult[] {
  return vectors.map((v) => {
    try {
      const kek = hsm_importAESKey(
        M,
        hSession,
        hexBytes(v.kekHex),
        false,
        false,
        true,
        true,
        false,
        true
      )
      const key = hsm_importGenericSecret(M, hSession, hexBytes(v.keyHex))
      const wrapped = bytesHex(hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_KWP, kek, key))
      if (wrapped !== v.wrappedHex) {
        return {
          id: v.id,
          description: v.description,
          pass: false,
          details: `wrap gave ${wrapped}, RFC 5649 §6 publishes ${v.wrappedHex}`,
        }
      }
      const recoveredHandle = hsm_unwrapKeyMech(
        M,
        hSession,
        CKM_AES_KEY_WRAP_KWP,
        kek,
        hexBytes(v.wrappedHex),
        [
          { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
          { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
          { type: CKA_TOKEN, boolVal: false },
          { type: CKA_EXTRACTABLE, boolVal: true },
        ]
      )
      const recovered = bytesHex(hsm_extractKeyValue(M, hSession, recoveredHandle))
      return recovered === v.keyHex
        ? {
            id: v.id,
            description: v.description,
            pass: true,
            details: `wrap reproduces the published ${v.wrappedHex.length / 2}-byte ciphertext; unwrap recovers the published ${v.keyHex.length / 2}-byte key data`,
          }
        : {
            id: v.id,
            description: v.description,
            pass: false,
            details: `unwrap gave ${recovered}, RFC 5649 §6 publishes ${v.keyHex}`,
          }
    } catch (e) {
      return {
        id: v.id,
        description: v.description,
        pass: false,
        details: e instanceof Error ? e.message : String(e),
      }
    }
  })
}

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GenerateKey',
  'C_EncapsulateKey',
  'C_WrapKey',
  'C_WrapKeyAuthenticated',
  'C_DecapsulateKey',
  'C_UnwrapKey',
  'C_UnwrapKeyAuthenticated',
  'C_DeriveKey',
  'C_CreateObject',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtKcv = (kcv: Uint8Array | null | undefined): string =>
  kcv && kcv.length >= 3
    ? Array.from(kcv.slice(0, 3))
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ')
    : '—'

const ts = () => new Date().toLocaleTimeString()

/** Outcome of comparing the DEK before wrapping with the DEK recovered after unwrapping. */
export interface DekComparison {
  kcvBefore: string
  kcvAfter: string
  /** Same 3-byte key check value? null when a check value was not returned for either key. */
  kcvMatch: boolean | null
  /** Byte-for-byte equality of the two key values: the check the success label depends on. */
  fullMatch: boolean
}

/**
 * Compare the original and the recovered DEK. A 3-byte check value is a diagnostic fingerprint
 * (PKCS#11 notes that two different keys can share one), so only the full key comparison decides
 * whether the keys are identical.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function compareRecoveredDek(
  kcvBefore: string,
  kcvAfter: string,
  bytesBefore: Uint8Array,
  bytesAfter: Uint8Array
): DekComparison {
  const fullMatch =
    bytesBefore.length === bytesAfter.length && bytesBefore.every((b, i) => b === bytesAfter[i])
  const haveKcv = kcvBefore !== '—' && kcvAfter !== '—'
  return { kcvBefore, kcvAfter, kcvMatch: haveKcv ? kcvBefore === kcvAfter : null, fullMatch }
}

/** One-line log text; the success wording is used only when the full comparison matched. */
// eslint-disable-next-line react-refresh/only-export-components
export function describeDekComparison(c: DekComparison): string {
  const kcv =
    c.kcvMatch === null
      ? 'KCV not returned'
      : `KCV ${c.kcvBefore} / ${c.kcvAfter} ${c.kcvMatch ? 'same' : 'different'} (3-byte diagnostic only)`
  return c.fullMatch
    ? `DEK round-trip: ✓ recovered DEK is byte-identical to the original; ${kcv}`
    : `DEK round-trip: ✗ recovered DEK differs from the original; ${kcv}`
}

/** Collapsible hex panel for a raw cryptographic blob. */
const BlobHexPanel: React.FC<{ label: string; bytes: Uint8Array }> = ({ label, bytes }) => {
  const [copied, setCopied] = React.useState(false)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
  const handleCopy = () => {
    void navigator.clipboard.writeText(hex.replace(/ /g, '')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {label}{' '}
          <span className="font-normal text-muted-foreground font-mono">({bytes.length} B)</span>
        </span>
        <Button
          variant="ghost"
          onClick={handleCopy}
          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy hex'}
        </Button>
      </div>
      <pre className="text-[10px] font-mono bg-muted/50 rounded border border-border p-2 overflow-x-auto whitespace-pre-wrap break-all text-foreground/70 max-h-28 overflow-y-auto leading-relaxed">
        {hex}
      </pre>
    </div>
  )
}

/** Runs the RFC 5649 section 6 published AES-KWP vectors on the workshop's live HSM. */
const PublishedKwpVectorCheck: React.FC<{ hsm: ReturnType<typeof useHSM> }> = ({ hsm }) => {
  const [results, setResults] = useState<PublishedKwpResult[] | null>(null)

  const run = () => {
    const M = hsm.moduleRef.current
    if (!M) return
    setResults(runPublishedKwpVectors(M, hsm.hSessionRef.current))
  }

  return (
    <div className="glass-panel p-4 space-y-3" data-testid="published-kwp-check">
      <div>
        <p className="text-sm font-semibold text-foreground">
          AES-KWP published vectors (RFC 5649 §6)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          The AES-KWP row above is a length check and a round-trip, so it cannot catch a wrong
          answer. RFC 5649 §6 publishes two examples, both for a 192-bit KEK. This module wraps with
          a 256-bit KEK, so these vectors show that the CKM_AES_KEY_WRAP_KWP mechanism reproduces a
          published ciphertext and recovers the published key data; they are not an AES-256 vector.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={run} disabled={!hsm.isReady}>
          Run RFC 5649 §6 vectors
        </Button>
        <GateReason when={!hsm.isReady} className="mt-0">
          Start the live HSM above to run this check.
        </GateReason>
      </div>
      {results && (
        <ul className="space-y-1 text-xs" aria-label="RFC 5649 vector results">
          {results.map((r) => (
            <li key={r.id} className="flex items-start gap-2">
              {r.pass ? (
                <CheckCircle
                  size={12}
                  className="text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <Circle size={12} className="text-destructive shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span className="text-foreground/80">
                <span className="font-semibold">{r.pass ? 'Passed' : 'Failed'}</span> —{' '}
                {r.description}: {r.details}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export const EnvelopeEncryptionDemo: React.FC<{ initialStep?: number }> = ({ initialStep = 0 }) => {
  // Computed inside the component (not as a module-level literal): the production
  // build wraps this module's softhsm import in vite-plugin-top-level-await, so a
  // top-level object literal here would capture CKM_AES_KEY_WRAP*/CKA_* as
  // `undefined` (they're assigned only after that chunk's own top-level await
  // resolves, which happens AFTER this module's top-level runs). Dev/vitest don't
  // use that plugin, so this bug is invisible outside a real production build. See
  // pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
  const WRAP_MECH_META = React.useMemo<
    Record<WrapMechanism, { label: string; standard: string; ckm?: number }>
  >(
    () => ({
      'aes-kw': {
        label: 'AES-KW',
        standard: 'RFC 3394 · NIST SP 800-38F §6.2',
        ckm: CKM_AES_KEY_WRAP,
      },
      'aes-kwp': {
        label: 'AES-KWP',
        standard: 'RFC 5649 · NIST SP 800-38F §6.3',
        ckm: CKM_AES_KEY_WRAP_KWP,
      },
      'aes-gcm': { label: 'AES-GCM', standard: 'NIST SP 800-38D' },
    }),
    []
  )
  /** Unwrap template for the recovered AES-256 DEK (sensitive=false so KCV is always readable).
   *  NOTE: CKA_VALUE_LEN must NOT be included — P11AttrValueLen::updateAttr rejects OBJECT_OP_UNWRAP
   *  (only OBJECT_OP_GENERATE/DERIVE allowed); the length is derived from the unwrapped bytes. */
  const AES_UNWRAP_TEMPLATE = React.useMemo<AttrDef[]>(
    () => [
      { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_ENCRYPT, boolVal: true },
      { type: CKA_DECRYPT, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: false },
      { type: CKA_EXTRACTABLE, boolVal: true },
    ],
    []
  )

  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set())

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const [flowDiagramOpen, setFlowDiagramOpen] = useState(!isMobile)
  const [artifactTableOpen, setArtifactTableOpen] = useState(!isMobile)

  // Configuration
  const [kekAlgo, setKekAlgo] = useState<KekAlgorithm>('ml-kem-768')
  const [wrapMech, setWrapMech] = useState<WrapMechanism>('aes-kw')

  // Live HSM mode
  const hsm = useHSM()
  const [liveLines, setLiveLines] = useState<LogEntry[]>([])
  const [liveRunning, setLiveRunning] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [progressLabel, setProgressLabel] = useState<string | null>(null)
  const [kcvResult, setKcvResult] = useState<{
    comparison: DekComparison
    path: 'ml-kem' | 'rsa'
  } | null>(null)
  const [envelopeBlob, setEnvelopeBlob] = useState<{
    path: 'ml-kem' | 'rsa'
    kemCt: Uint8Array | null
    wrappedDek: Uint8Array
    gcmIv: Uint8Array | null
    /** Complete HKE1 sample envelope serialized from the blobs above, when the format covers this run. */
    hke1: Uint8Array | null
  } | null>(null)

  const isRSA = kekAlgo.startsWith('rsa')

  const runLiveDemo = async () => {
    if (!hsm.moduleRef.current) return
    setLiveRunning(true)
    setLiveLines([])
    setLiveError(null)
    setKcvResult(null)
    setEnvelopeBlob(null)
    hsm.clearLog()
    hsm.clearKeys()

    const addLine = (msg: string) =>
      setLiveLines((prev) => [...prev, { status: 'success' as const, message: msg }])

    try {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      if (isRSA) {
        // ── RSA-OAEP path ──────────────────────────────────────────────────────
        const bits = parseInt(kekAlgo.split('-')[1]) as 2048 | 3072 | 4096

        // Step 1: Generate AES-256 DEK
        // encrypt=true, decrypt=true, wrap=false, unwrap=false, derive=false, extractable=true
        // NOTE: extractable=true here is intentional for this educational demo so we can
        // fall back to raw byte comparison when CKA_CHECK_VALUE is unavailable (the engine
        // returned none after C_UnwrapKey). In production, DEKs would be extractable=false, sensitive=true;
        // KCV would be the only integrity verification method.
        // Each step header is logged BEFORE the PKCS#11 calls it names: the log panel starts a
        // new section at every header, so a header logged after its calls would label the NEXT
        // step's calls instead.
        hsm.addStepLog('── Step 1: Generate AES-256 DEK (CKM_AES_KEY_GEN) ─────────────────')
        setProgressLabel('Generating key pair...')
        const dekHandle = hsm_generateAESKey(
          M,
          hSession,
          256,
          true,
          true,
          false,
          false,
          false,
          true,
          'AES-256 DEK'
        )
        hsm.registerKey(M, hSession, {
          handle: dekHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 DEK',
          generatedAt: ts(),
        })
        addLine(`DEK: AES-256 key generated (32 B, for data encryption)`)

        // Step 2: Generate RSA key pair (KEK)
        hsm.addStepLog(
          `── Step 2: Generate RSA-${bits} Key Pair (CKM_RSA_PKCS_KEY_PAIR_GEN) ──────────`
        )
        setProgressLabel('Generating key pair...')
        const { pubHandle, privHandle } = hsm_generateRSAWrapKeyPair(M, hSession, bits)
        hsm.registerKey(M, hSession, {
          handle: pubHandle,
          family: 'rsa',
          role: 'public',
          label: `RSA-${bits} KEK (Public)`,
          generatedAt: ts(),
        })
        hsm.registerKey(M, hSession, {
          handle: privHandle,
          family: 'rsa',
          role: 'private',
          label: `RSA-${bits} KEK (Private)`,
          generatedAt: ts(),
        })
        addLine(`KEK: RSA-${bits} key pair — public key ${bits / 8} B (e=65537)`)

        // Read KCV and raw bytes of original DEK (before wrap)
        const kcvBefore = fmtKcv(hsm_getKeyCheckValue(M, hSession, dekHandle))
        const dekBytesOrig = hsm_extractKeyValue(M, hSession, dekHandle)

        // Step 3: Wrap DEK with RSA-OAEP public key
        hsm.addStepLog(
          `── Step 3: Wrap DEK (CKM_RSA_PKCS_OAEP / ${RSA_OAEP_STANDARD}) ─────────────`
        )
        setProgressLabel('Wrapping DEK...')
        const wrappedDek = hsm_rsaOaepWrapKey(M, hSession, pubHandle, dekHandle)
        addLine(`Wrapped DEK: ${wrappedDek.length} B (RSA-OAEP, ${RSA_OAEP_STANDARD})`)

        // Step 4: Unwrap DEK with RSA-OAEP private key
        hsm.addStepLog('── Step 4: Unwrap DEK (CKM_RSA_PKCS_OAEP) · DEK compared ────────────')
        setProgressLabel('Verifying integrity...')
        const recoveredDekHandle = hsm_rsaOaepUnwrapKey(
          M,
          hSession,
          privHandle,
          wrappedDek,
          AES_UNWRAP_TEMPLATE
        )
        hsm.registerKey(M, hSession, {
          handle: recoveredDekHandle,
          family: 'aes',
          role: 'secret',
          label: 'DEK (Recovered)',
          generatedAt: ts(),
        })

        // Full-key comparison decides the result; the 3-byte KCV is shown separately as a diagnostic
        const kcvAfter = fmtKcv(hsm_getKeyCheckValue(M, hSession, recoveredDekHandle))
        const dekBytesRecov = hsm_extractKeyValue(M, hSession, recoveredDekHandle)
        const comparison = compareRecoveredDek(kcvBefore, kcvAfter, dekBytesOrig, dekBytesRecov)
        setKcvResult({ comparison, path: 'rsa' })

        addLine(describeDekComparison(comparison))

        addLine(`RSA-${bits} ciphertext: ${wrappedDek.length} B (1 wrapped blob, data field only)`)
        // HKE1 defines RSA-2048 OAEP-SHA256; other moduli are shown as data fields only.
        let hke1: Uint8Array | null = null
        if (bits === 2048) {
          hke1 = buildHke1(1, { wrappedDek })
          const parsed = parseHke1(hke1)
          addLine(
            `Complete HKE1 envelope: ${hke1.length} B (${HKE1_FORMAT_LABEL.toLowerCase()}; ${HKE1_HEADER_BYTES} B header + ${parsed.keyId.length} B key ID + ${wrappedDek.length} B ciphertext)`
          )
        }
        setEnvelopeBlob({ path: 'rsa', kemCt: null, wrappedDek, gcmIv: null, hke1 })
      } else {
        // ── ML-KEM path ────────────────────────────────────────────────────────
        const variant = parseInt(kekAlgo.split('-')[2]) as 512 | 768 | 1024
        const mechMeta = WRAP_MECH_META[wrapMech]

        // Step 1: Generate AES-256 DEK
        // encrypt=true, decrypt=true, wrap=false, unwrap=false, derive=false, extractable=true
        // NOTE: extractable=true here is intentional for this educational demo so we can
        // fall back to raw byte comparison when CKA_CHECK_VALUE is unavailable (the engine
        // returned none after C_UnwrapKey). In production, DEKs would be extractable=false, sensitive=true;
        // KCV would be the only integrity verification method.
        hsm.addStepLog('── Step 1: Generate AES-256 DEK (CKM_AES_KEY_GEN) ─────────────────')
        setProgressLabel('Generating key pair...')
        const dekHandle = hsm_generateAESKey(
          M,
          hSession,
          256,
          true,
          true,
          false,
          false,
          false,
          true,
          'AES-256 DEK'
        )
        hsm.registerKey(M, hSession, {
          handle: dekHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 DEK',
          generatedAt: ts(),
        })
        addLine(`DEK: AES-256 key generated (32 B, for data encryption)`)

        // Step 2: Generate ML-KEM key pair (KEK)
        hsm.addStepLog(`── Step 2: Generate ML-KEM-${variant} Key Pair (FIPS 203) ──────────────`)
        setProgressLabel('Generating key pair...')
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, variant)
        hsm.registerKey(M, hSession, {
          handle: pubHandle,
          family: 'ml-kem',
          role: 'public',
          label: `ML-KEM-${variant} KEK (Public)`,
          generatedAt: ts(),
        })
        hsm.registerKey(M, hSession, {
          handle: privHandle,
          family: 'ml-kem',
          role: 'private',
          label: `ML-KEM-${variant} KEK (Private)`,
          generatedAt: ts(),
        })
        const pubKeyBytes = hsm_extractKeyValue(M, hSession, pubHandle)
        addLine(
          `KEK: ML-KEM-${variant} key pair — encapsulation key ${pubKeyBytes.length} B (FIPS 203)`
        )

        // Step 3: KEM Encapsulate → shared secret + ciphertext
        hsm.addStepLog('── Step 3: KEM Encapsulate (CKM_ML_KEM / FIPS 203) ─────────────────')
        setProgressLabel('Encapsulating shared secret...')
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(M, hSession, pubHandle, variant)
        hsm.registerKey(M, hSession, {
          handle: secretHandle,
          family: 'kdf',
          role: 'secret',
          label: 'ML-KEM Shared Secret (Encaps)',
          generatedAt: ts(),
        })
        const secretBytes = hsm_extractKeyValue(M, hSession, secretHandle)
        addLine(
          `Encapsulation: ciphertext ${ciphertextBytes.length} B, shared secret ${secretBytes.length} B (random, FIPS 203)`
        )

        // Step 4: HKDF-SHA256 → 32-byte wrapping key (RFC 5869; the SP 800-56C extract-then-expand
        // procedure with HMAC). The 32-byte salt is this module's design choice, not a value
        // SP 800-56C requires.
        hsm.addStepLog('── Step 4: Derive Wrapping Key (CKM_HKDF_DERIVE / SP 800-56C + RFC 5869) ─')
        const derivableHandle = hsm_importGenericSecret(M, hSession, secretBytes)
        hsm.registerKey(M, hSession, {
          handle: derivableHandle,
          family: 'kdf',
          role: 'secret',
          label: 'ML-KEM SS (Derivable)',
          generatedAt: ts(),
        })

        const envelopeInfo = new TextEncoder().encode('kms-envelope-v1')
        const rawWrapHandleOut = { current: 0 }
        setProgressLabel('Deriving session key (HKDF)...')
        const wrapKeyBytes = hsm_hkdf(
          M,
          hSession,
          derivableHandle,
          CKM_SHA256,
          true,
          true,
          ENVELOPE_HKDF_SALT,
          envelopeInfo,
          32,
          rawWrapHandleOut
        )
        hsm.registerKey(M, hSession, {
          handle: rawWrapHandleOut.current,
          family: 'kdf',
          role: 'secret',
          label: 'HKDF Output (Generic)',
          generatedAt: ts(),
        })
        addLine(
          `HKDF-SHA256 (RFC 5869, a version of the SP 800-56C extraction-then-expansion procedure that uses HMAC for both steps): derived ${wrapKeyBytes.length} B wrapping key — salt=kms-envelope-salt-v1 info="kms-envelope-v1"`
        )

        // Read KCV and raw bytes of original DEK (before wrap)
        const kcvBefore = fmtKcv(hsm_getKeyCheckValue(M, hSession, dekHandle))
        const dekBytesOrig = hsm_extractKeyValue(M, hSession, dekHandle)

        // Step 5: Wrap DEK using selected mechanism
        hsm.addStepLog(
          `── Step 5: Wrap DEK (${mechMeta.label} / ${mechMeta.standard}) ─────────────`
        )
        const wrapKeyHandle = hsm_importAESKey(
          M,
          hSession,
          wrapKeyBytes,
          false,
          false,
          true,
          true,
          false,
          false
        )
        hsm.registerKey(M, hSession, {
          handle: wrapKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'HKDF Wrapping Key',
          generatedAt: ts(),
        })

        let wrappedDek: Uint8Array
        let gcmIv: Uint8Array | null = null

        setProgressLabel('Encrypting data (AES-GCM)...')
        if (wrapMech === 'aes-gcm') {
          const gcmResult = hsm_aesGcmWrapKey(
            M,
            hSession,
            wrapKeyHandle,
            dekHandle,
            new Uint8Array()
          )
          wrappedDek = gcmResult.wrapped
          gcmIv = gcmResult.iv
          addLine(
            `Wrapped DEK: ${wrappedDek.length} B ciphertext + ${gcmIv.length} B nonce (AES-GCM, NIST SP 800-38D)`
          )
        } else {
          setProgressLabel('Wrapping DEK...')
          wrappedDek = hsm_wrapKeyMech(M, hSession, mechMeta.ckm!, wrapKeyHandle, dekHandle)
          addLine(`Wrapped DEK: ${wrappedDek.length} B (${mechMeta.label}, ${mechMeta.standard})`)
        }

        // Step 6: Decapsulate → recover shared secret → re-derive wrapping key → unwrap DEK
        hsm.addStepLog('── Step 6: Decapsulate + Unwrap DEK · DEK compared ─────────────────')
        setProgressLabel('Verifying integrity...')
        const recoveredSecretHandle = hsm_decapsulate(
          M,
          hSession,
          privHandle,
          ciphertextBytes,
          variant
        )
        hsm.registerKey(M, hSession, {
          handle: recoveredSecretHandle,
          family: 'kdf',
          role: 'secret',
          label: 'ML-KEM Shared Secret (Decaps)',
          generatedAt: ts(),
        })
        const recoveredSecretBytes = hsm_extractKeyValue(M, hSession, recoveredSecretHandle)
        const secretMatch =
          secretBytes.length === recoveredSecretBytes.length &&
          secretBytes.every((b, i) => b === recoveredSecretBytes[i])
        addLine(
          `KEM round-trip: ${secretMatch ? '✓ shared secrets match' : '✗ shared secrets differ'} (${recoveredSecretBytes.length} B)`
        )

        // Re-derive the same wrapping key from the recovered secret (same salt and info as step 4)
        const derivableHandle2 = hsm_importGenericSecret(M, hSession, recoveredSecretBytes)
        hsm.registerKey(M, hSession, {
          handle: derivableHandle2,
          family: 'kdf',
          role: 'secret',
          label: 'Recovered SS (Derivable)',
          generatedAt: ts(),
        })

        const rawUnwrapHandleOut = { current: 0 }
        const unwrapKeyBytes = hsm_hkdf(
          M,
          hSession,
          derivableHandle2,
          CKM_SHA256,
          true,
          true,
          ENVELOPE_HKDF_SALT,
          envelopeInfo,
          32,
          rawUnwrapHandleOut
        )
        hsm.registerKey(M, hSession, {
          handle: rawUnwrapHandleOut.current,
          family: 'kdf',
          role: 'secret',
          label: 'HKDF Output (Generic)',
          generatedAt: ts(),
        })
        const unwrapKeyHandle = hsm_importAESKey(
          M,
          hSession,
          unwrapKeyBytes,
          false,
          false,
          true,
          true,
          false,
          false
        )
        hsm.registerKey(M, hSession, {
          handle: unwrapKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'HKDF Unwrapping Key',
          generatedAt: ts(),
        })

        // Unwrap the DEK
        let recoveredDekHandle: number
        if (wrapMech === 'aes-gcm') {
          recoveredDekHandle = hsm_aesGcmUnwrapKey(
            M,
            hSession,
            unwrapKeyHandle,
            wrappedDek,
            gcmIv!,
            AES_UNWRAP_TEMPLATE
          )
        } else {
          recoveredDekHandle = hsm_unwrapKeyMech(
            M,
            hSession,
            mechMeta.ckm!,
            unwrapKeyHandle,
            wrappedDek,
            AES_UNWRAP_TEMPLATE
          )
        }
        hsm.registerKey(M, hSession, {
          handle: recoveredDekHandle,
          family: 'aes',
          role: 'secret',
          label: 'DEK (Recovered)',
          generatedAt: ts(),
        })

        // Full-key comparison decides the result; the 3-byte KCV is shown separately as a diagnostic
        const kcvAfter = fmtKcv(hsm_getKeyCheckValue(M, hSession, recoveredDekHandle))
        const dekBytesRecov = hsm_extractKeyValue(M, hSession, recoveredDekHandle)
        const comparison = compareRecoveredDek(kcvBefore, kcvAfter, dekBytesOrig, dekBytesRecov)
        setKcvResult({ comparison, path: 'ml-kem' })

        addLine(describeDekComparison(comparison))

        const dataFieldBytes = ciphertextBytes.length + wrappedDek.length + (gcmIv?.length ?? 0)
        addLine(
          `Data fields: KEM ciphertext ${ciphertextBytes.length} B` +
            ` + wrapped DEK ${wrappedDek.length} B` +
            (gcmIv ? ` + GCM nonce ${gcmIv.length} B` : '') +
            ` = ${dataFieldBytes} B (2 blobs; not a complete envelope)`
        )
        // HKE1 defines ML-KEM-768 with AES-256-KW. The 20-byte wire salt gives the same HKDF
        // output as this demo's 32-byte zero-padded salt, because HMAC zero-pads its key.
        let hke1: Uint8Array | null = null
        if (variant === 768 && wrapMech === 'aes-kw' && !gcmIv) {
          hke1 = buildHke1(2, { kemCiphertext: ciphertextBytes, wrappedDek })
          const parsed = parseHke1(hke1)
          addLine(
            `Complete HKE1 envelope: ${hke1.length} B (${HKE1_FORMAT_LABEL.toLowerCase()}; ${HKE1_HEADER_BYTES} B header + ${parsed.keyId.length} B key ID + ${parsed.salt.length} B salt + ${parsed.info.length} B info + ${ciphertextBytes.length} B KEM ciphertext + ${wrappedDek.length} B wrapped DEK)`
          )
        }
        setEnvelopeBlob({
          path: 'ml-kem',
          kemCt: ciphertextBytes,
          wrappedDek,
          gcmIv: gcmIv ?? null,
          hke1,
        })
      }
      // One Execute runs the whole envelope flow (keygen → DEK → wrap → unwrap →
      // KCV), so every step's data now exists. Mark them all executed rather than
      // forcing a redundant re-run per step tab before "Complete & Next" unlocks.
      setExecutedSteps(new Set(ENVELOPE_ENCRYPTION_STEPS.map((_, i) => i)))
    } catch (e) {
      setLiveError(translateCryptoError(e instanceof Error ? e.message : String(e)))
    } finally {
      setLiveRunning(false)
      setProgressLabel(null)
    }
  }

  const step = ENVELOPE_ENCRYPTION_STEPS[currentStep]

  const markComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStep < ENVELOPE_ENCRYPTION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Artifact size table values — computed dynamically from the selected KEK algorithm
  const ML_KEM_SIZES: Record<string, { pk: number; ct: number }> = {
    'ml-kem-512': { pk: 800, ct: 768 },
    'ml-kem-768': { pk: 1184, ct: 1088 },
    'ml-kem-1024': { pk: 1568, ct: 1568 },
  }
  const RSA_PK_BYTES: Record<string, number> = { 'rsa-2048': 256, 'rsa-4096': 512 }

  const classicalPkBytes = isRSA ? (RSA_PK_BYTES[kekAlgo] ?? 256) : 256
  const mlKemSizes = !isRSA ? ML_KEM_SIZES[kekAlgo] : null
  // When RSA is selected for the live demo the PQC column shows ML-KEM-768 reference values
  const pqcRefSizes = mlKemSizes ?? ML_KEM_SIZES['ml-kem-768']
  // AES-KW: 40 B · AES-KWP: 40 B for a 32-byte key (RFC 5649 §3, n+1 64-bit blocks) · AES-GCM: 60 B (48 B ct + 12 B nonce)
  const wrapOverheadBytes = wrapMech === 'aes-gcm' ? 60 : 40
  // HKE1 (project sample format) covers exactly RSA-2048 and ML-KEM-768 with AES-256-KW.
  const hke1Covers = !isRSA && kekAlgo === 'ml-kem-768' && wrapMech === 'aes-kw'
  const pqcPkStr = `${pqcRefSizes.pk.toLocaleString()} B`
  const pqcCtStr = `${pqcRefSizes.ct.toLocaleString()} + 32 B`
  const totalPqcStr = `${pqcRefSizes.ct.toLocaleString()} + ${wrapOverheadBytes} B`

  const classicalTotalSizes = [
    `${classicalPkBytes} B`,
    `${classicalPkBytes} B`,
    'N/A',
    `${classicalPkBytes} B`,
    '32 B',
  ]
  const pqcTotalSizes = [pqcPkStr, pqcCtStr, '32 B', totalPqcStr, '32 B']

  // Step 1 comparison multiplier for the info note
  const step1ComparisonNote = (() => {
    if (isRSA) return null // RSA vs RSA — no meaningful cross-comparison
    const { pk } = ML_KEM_SIZES[kekAlgo] ?? { pk: 1184 }
    const rsaRef = 256 // RSA-2048 public key baseline
    const ratio = (pk / rsaRef).toFixed(1)
    return `${kekAlgo.toUpperCase()} encapsulation keys are ${ratio}x larger than RSA-2048 public keys (${pk.toLocaleString()} B vs 256 B). In this module's reading, this impacts certificate sizes and key distribution bandwidth.`
  })()

  // Dynamic overrides for the step card side-by-side panel — reflect kekAlgo + wrapMech selection.
  // Only variant-sensitive fields are overridden; static fields fall through from kmsConstants.
  const rsaBits = isRSA ? parseInt(kekAlgo.split('-')[1]) : 2048
  const mechLabel = WRAP_MECH_META[wrapMech].label
  const mechStd = WRAP_MECH_META[wrapMech].standard
  const stepCardOverrides: Partial<EnvelopeEncryptionStep>[] = [
    // Step 1 — Generate KEK Pair
    {
      classicalDescription: `Generate RSA-${rsaBits} key pair. Public key is used by clients to wrap DEKs.`,
      classicalArtifact: `RSA-${rsaBits} Public Key`,
      classicalSize: `${rsaBits / 8} bytes`,
      pqcDescription: isRSA
        ? `Generate RSA-${rsaBits} key pair. Public key is used by clients to wrap DEKs.`
        : `Generate ${kekAlgo.toUpperCase()} key pair. Public encapsulation key is distributed to clients.`,
      pqcArtifact: isRSA
        ? `RSA-${rsaBits} Public Key`
        : `${kekAlgo.toUpperCase()} Encapsulation Key`,
      pqcSize: isRSA ? `${rsaBits / 8} bytes` : `${pqcRefSizes.pk.toLocaleString()} bytes`,
    },
    // Step 2 — Encapsulate / Wrap
    {
      pqcArtifact: isRSA
        ? 'RSA-OAEP Ciphertext (wrapped DEK)'
        : `${kekAlgo.toUpperCase()} Ciphertext + 32-byte Shared Secret`,
      pqcSize: isRSA
        ? `${rsaBits / 8} bytes ciphertext`
        : `${pqcRefSizes.ct.toLocaleString()} bytes ciphertext + 32 bytes ss`,
    },
    // Step 3 — Derive Wrapping Key (no variant-sensitive fields)
    {},
    // Step 4 — Wrap DEK
    {
      pqcDescription: isRSA
        ? '(DEK is already wrapped in step 2 via RSA-OAEP)'
        : `Use ${mechLabel} (${mechStd}) to wrap the 32-byte DEK with the derived wrapping key. Store the KEM ciphertext alongside the wrapped DEK.`,
      pqcArtifact: isRSA
        ? 'Wrapped DEK (from step 2)'
        : `${mechLabel} Wrapped DEK (${wrapOverheadBytes} bytes)`,
      pqcSize: isRSA
        ? rsaBits === 2048
          ? `${rsaBits / 8} bytes ciphertext; ${hke1TotalBytes(1)} bytes as a complete HKE1 envelope`
          : `${rsaBits / 8} bytes ciphertext only`
        : hke1Covers
          ? `${pqcRefSizes.ct.toLocaleString()} + ${wrapOverheadBytes} = ${pqcRefSizes.ct + wrapOverheadBytes} bytes of data fields; ${hke1TotalBytes(2).toLocaleString('en-US')} bytes as a complete HKE1 envelope`
          : `${pqcRefSizes.ct.toLocaleString()} + ${wrapOverheadBytes} = ${pqcRefSizes.ct + wrapOverheadBytes} bytes of data fields only`,
    },
    // Step 5 — Decapsulate / Unwrap
    {
      pqcDescription: isRSA
        ? 'Server uses RSA-OAEP private key to decrypt the ciphertext → recovers the 32-byte DEK directly.'
        : `Server runs ML-KEM.Decaps(dk, ct) → shared secret → HKDF → wrapping key → ${mechLabel} unwrap → DEK. Multi-step but all happens server-side.`,
    },
  ]
  const displayStep = step ? { ...step, ...(stepCardOverrides[currentStep] ?? {}) } : step

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gradient mb-2">Envelope Encryption Demo</h2>
        <p className="text-sm text-muted-foreground">
          Step through the complete envelope encryption flow. Compare how RSA-OAEP directly wraps a
          DEK in one step versus the 3-step ML-KEM process: encapsulate &rarr; KDF &rarr; AES wrap
          (AES-KW / AES-KWP / AES-GCM).
        </p>
      </div>

      {/* Live HSM Mode */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      {hsm.isReady && (
        <div className="glass-panel p-4 space-y-4">
          {/* ── Configuration ─────────────────────────────────────────────────── */}
          <div className="space-y-3 pb-3 border-b border-border/40">
            {/* KEK algorithm selector */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                KEK Algorithm
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'ml-kem-512',
                    'ml-kem-768',
                    'ml-kem-1024',
                    'rsa-2048',
                    'rsa-4096',
                  ] as KekAlgorithm[]
                ).map((alg) => (
                  <Button
                    key={alg}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setKekAlgo(alg)
                      setExecutedSteps(new Set())
                    }}
                    disabled={liveRunning}
                    className={`font-mono text-xs h-auto py-1 px-2.5 ${
                      kekAlgo === alg
                        ? 'bg-primary/20 text-primary border-primary/50 font-semibold'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {alg.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Wrap mechanism selector (ML-KEM only) */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Wrap Mechanism
              </p>
              {isRSA ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs rounded border font-mono bg-primary/20 text-primary border-primary/50 font-semibold">
                    RSA-OAEP
                  </span>
                  <span className="text-[10px] text-muted-foreground">{RSA_OAEP_STANDARD}</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.entries(WRAP_MECH_META) as [
                      WrapMechanism,
                      (typeof WRAP_MECH_META)[WrapMechanism],
                    ][]
                  ).map(([key, meta]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWrapMech(key)
                        setExecutedSteps(new Set())
                      }}
                      disabled={liveRunning}
                      title={meta.standard}
                      className={`font-mono text-xs h-auto py-1 px-2.5 ${
                        wrapMech === key
                          ? 'bg-primary/20 text-primary border-primary/50 font-semibold'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {meta.label}
                      <span className="ml-1 text-[10px] font-normal hidden sm:inline">
                        {meta.standard}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Run button ────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Run{' '}
              {isRSA
                ? `RSA-${kekAlgo.split('-')[1]} / RSA-OAEP`
                : `${kekAlgo.toUpperCase()} / ${WRAP_MECH_META[wrapMech].label}`}{' '}
              Envelope Encryption
            </p>
            <Button
              variant="gradient"
              size="sm"
              onClick={runLiveDemo}
              disabled={liveRunning}
              className="flex items-center gap-1.5 text-xs"
            >
              {liveRunning ? (
                <>
                  <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                  {progressLabel ?? 'Running…'}
                </>
              ) : (
                'Execute (Live WASM)'
              )}
            </Button>
          </div>

          {liveError && <ErrorAlert message={liveError} />}

          {/* ── Summary lines ──────────────────────────────────────────────────── */}
          {liveLines.length > 0 && (
            <div className="space-y-1">
              <WorkshopOperationLog entries={liveLines} />
              <p className="text-[10px] text-muted-foreground pl-1">
                Real output from SoftHSM3 WASM · PKCS#11 v3.2
              </p>
            </div>
          )}

          {/* ── Recovered DEK check panel ───────────────────────────────────────── */}
          {kcvResult && (
            <div
              className={`rounded-lg p-3 border text-xs ${
                kcvResult.comparison.fullMatch
                  ? 'bg-status-success/5 border-status-success/30'
                  : 'bg-status-error/5 border-status-error/30'
              }`}
            >
              <p className="font-semibold mb-2 text-foreground">Recovered DEK check</p>
              <div className="font-mono space-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-52 shrink-0">
                    Full key comparison (32 B):
                  </span>
                  {kcvResult.comparison.fullMatch ? (
                    <span className="text-status-success font-bold">✓ Byte-identical</span>
                  ) : (
                    <span className="text-status-error font-bold">✗ Keys differ</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-52 shrink-0">
                    3-byte KCV, before / after:
                  </span>
                  <span className="text-foreground tracking-widest">
                    {kcvResult.comparison.kcvBefore} / {kcvResult.comparison.kcvAfter}
                  </span>
                  {kcvResult.comparison.kcvMatch === null ? (
                    <span className="text-muted-foreground ml-1">not returned</span>
                  ) : kcvResult.comparison.kcvMatch ? (
                    <span className="text-foreground font-bold ml-1">Same KCV</span>
                  ) : (
                    <span className="text-status-error font-bold ml-1">Different KCV</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                CKA_CHECK_VALUE for an AES key is the first 3 bytes of AES-ECB(key, 0x00…) (PKCS#11
                v3.2, AES secret key objects). It is a short fingerprint for cross-checking a key
                between systems, and PKCS#11 notes that two different keys can have the same value,
                so a matching KCV is a diagnostic, not proof of identical keys. The full comparison
                is possible here only because this demo&apos;s DEK is extractable; a production DEK
                would not be.
                {kcvResult.path === 'ml-kem' &&
                  ' A successful AES-KW, AES-KWP or AES-GCM unwrap has already passed that algorithm’s own integrity check (the key-wrap integrity value or the GCM tag); the comparisons above are separate cross-checks.'}
              </p>
            </div>
          )}

          {/* ── Envelope Blob Hex Viewer ──────────────────────────────────── */}
          {envelopeBlob && (
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">Stored Envelope Blobs</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                  {envelopeBlob.hke1
                    ? `HKE1\u202f·\u202f${envelopeBlob.hke1.length}\u00a0B`
                    : envelopeBlob.kemCt
                      ? `KEM\u202f+\u202fAES\u202f·\u202f${envelopeBlob.kemCt.length + envelopeBlob.wrappedDek.length + (envelopeBlob.gcmIv?.length ?? 0)}\u00a0B`
                      : `RSA-OAEP\u202f·\u202f${envelopeBlob.wrappedDek.length}\u00a0B`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {envelopeBlob.kemCt
                  ? "Raw bytes that would be stored alongside the encrypted data. In this module's illustration, the recipient decapsulates the KEM ciphertext, re-derives the HKDF wrapping key (SP\u00a0800-56C), then unwraps the DEK."
                  : 'Raw RSA-OAEP ciphertext stored alongside encrypted data. The recipient decrypts with their RSA private key to recover the DEK.'}
              </p>
              {envelopeBlob.kemCt && (
                <BlobHexPanel label="KEM Ciphertext" bytes={envelopeBlob.kemCt} />
              )}
              <BlobHexPanel label="Wrapped DEK" bytes={envelopeBlob.wrappedDek} />
              {envelopeBlob.gcmIv && (
                <BlobHexPanel label="GCM Nonce (IV)" bytes={envelopeBlob.gcmIv} />
              )}
              {envelopeBlob.hke1 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    The blobs above, plus a header, key ID, salt and info, serialized as one HKE1
                    envelope. {HKE1_FORMAT_LABEL}; it is this module&apos;s own layout, not HPKE or
                    a provider format. A receiver can parse these bytes alone (the unit tests do);
                    the live steps above still unwrap from the in-memory blobs.
                  </p>
                  <BlobHexPanel label="Complete HKE1 envelope" bytes={envelopeBlob.hke1} />
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sizes above are data fields only. The HKE1 sample envelope covers RSA-2048 and
                  ML-KEM-768 with AES-256-KW; this selection has no complete-envelope count.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step stepper */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {ENVELOPE_ENCRYPTION_STEPS.map((s, idx) => (
            <Button
              key={s.id}
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-1.5 text-xs font-medium h-auto py-2 px-3 ${
                idx === currentStep
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(idx)
                    ? 'bg-status-success/10 text-status-success border-status-success/20'
                    : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              {completedSteps.has(idx) ? (
                <CheckCircle size={12} aria-hidden="true" />
              ) : (
                <Circle size={12} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Step {s.step}</span>
              <span className="sm:hidden">{s.step}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>Progress</span>
          <span>
            {Math.round((completedSteps.size / ENVELOPE_ENCRYPTION_STEPS.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${(completedSteps.size / ENVELOPE_ENCRYPTION_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current step detail */}
      {displayStep && (
        <div className="glass-panel p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Lock size={24} className="text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Step {displayStep.step} of {ENVELOPE_ENCRYPTION_STEPS.length}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gradient">{displayStep.title}</h3>
              {displayStep.step === 1 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Info size={12} className="shrink-0" />
                  {step1ComparisonNote ?? 'Execute the demo to see exact envelope sizes.'}
                </div>
              )}
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Classical side */}
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-status-error border border-destructive/20 font-bold">
                  CLASSICAL
                </span>
                <span className="text-xs text-muted-foreground">RSA-OAEP</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {displayStep.classicalDescription}
              </p>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-[10px] font-bold text-foreground mb-1">Artifact</div>
                <p className="text-xs text-muted-foreground">{displayStep.classicalArtifact}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-foreground">Size:</span>
                  <span className="text-xs font-mono text-destructive">
                    {displayStep.classicalSize}
                  </span>
                </div>
              </div>
            </div>

            {/* PQC side */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  PQC
                </span>
                <span className="text-xs text-muted-foreground">
                  {isRSA ? 'RSA-OAEP' : kekAlgo.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{displayStep.pqcDescription}</p>
              <div className="bg-background rounded p-3 border border-border">
                <div className="text-[10px] font-bold text-foreground mb-1">Artifact</div>
                <p className="text-xs text-muted-foreground">{displayStep.pqcArtifact}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-foreground">Size:</span>
                  <span className="text-xs font-mono text-primary">{displayStep.pqcSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context note */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">
                {displayStep.step === 1 &&
                  (step1ComparisonNote ??
                    'Select an ML-KEM variant to see the size comparison against RSA-2048.')}
                {displayStep.step === 2 &&
                  'RSA-OAEP transports a key chosen by the sender. ML-KEM Encaps outputs a shared secret key that is ready to use; a key-derivation method may be applied if the keying material needed differs from the KEM output (SP 800-227 Sec. 4.3). ' +
                    'OAEP (RFC 8017 §7.1) as a general construction has never been proven secure against adaptive chosen-ciphertext attack (CCA2), and Victor Shoup showed that no such proof exists in the general case, but RSAES-OAEP itself was later proved CCA2-secure by Fujisaki, Okamoto, Pointcheval, and Stern. ' +
                    'Never use PKCS#1 v1.5 for key transport — it is broken by the 1998 Bleichenbacher padding oracle attack, which lets an adaptive attacker decrypt RSA ciphertexts without the private key using ~1 million queries to a validating server.'}
                {displayStep.step === 3 &&
                  (isRSA
                    ? 'RSA-OAEP is a direct encryption scheme — the decrypted output IS the DEK. No KDF step is needed. This step is skipped in the classical path.'
                    : 'The shared secret from ML-KEM.Encaps() is a 256-bit value that can be used directly as a shared secret key for symmetric cryptography. This demo applies HKDF with info="kms-envelope-v1" to bind the wrapping key to this protocol and version. ' +
                      'HKDF binds it to a context string (info="kms-envelope-v1") so the derived key is bound to that context, which may prevent the same keying material from being derived for other contexts (RFC 5869 §3.2).')}
                {displayStep.step === 4 &&
                  `AES-KW (RFC 3394), AES-KWP (RFC 5649), or AES-GCM (SP 800-38D) wraps the 32-byte DEK. ` +
                    `AES-KW: 40 B output — 8-byte A value (ICV, RFC 3394 §2.2.3, not a nonce) + 32 B; deterministic, no nonce management required; SP 800-38F §6.2 purpose-built for key wrapping. ` +
                    `AES-KWP: 40 B for the 32-byte DEK — 8-byte AIV (RFC 5649 §3: constant 0xA65959A6 + 32-bit length) + plaintext padded with zero octets to a multiple of 8; handles key lengths that are not multiples of 8 octets. ` +
                    `AES-GCM: 48 B output (32 B plaintext + 16 B auth tag embedded at the end) plus a 12-byte nonce stored separately (visible in the hex blobs above). ` +
                    `The 12-byte nonce is the SP 800-38D §5.2.1.1 recommended IV length for GCM. The 16-byte tag provides authenticated integrity — the ciphertext blob already contains it. ` +
                    `IV uniqueness is a requirement in GCM (SP 800-38D §8): if even one IV is ever repeated under a key, the implementation may be vulnerable to forgery attacks. Prefer AES-KW when nonce management is operationally risky. ` +
                    `Store the KEM ciphertext alongside the wrapped DEK.`}
                {displayStep.step === 5 &&
                  'Both paths recover the same 32-byte DEK. The byte-for-byte comparison of the DEK before wrapping and after unwrapping is the check that decides this result; the 3-byte KCV (CKA_CHECK_VALUE) is a separate diagnostic fingerprint, and two different keys can share one. ' +
                    'What rotation costs depends on what changes. Rotating the KEK means re-wrapping each existing DEK under the new KEK; the encrypted data blocks stay untouched. A new DEK protects only data written from then on: ciphertext already encrypted under the old DEK can be decrypted only with that DEK, so replacing the DEK that protects existing ciphertext means decrypting and re-encrypting that data. ' +
                    "That is envelope encryption's operational advantage at scale: KEK rotation touches small wrapped keys, not the data."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flow diagram */}
      <div className="glass-panel border border-border">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors h-auto rounded-none"
          onClick={() => setFlowDiagramOpen((v) => !v)}
          aria-expanded={flowDiagramOpen}
        >
          <span>Envelope Encryption Flow</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${flowDiagramOpen ? 'rotate-180' : ''}`}
          />
        </Button>
        {flowDiagramOpen && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Classical flow */}
              <div>
                <div className="text-xs font-bold text-destructive mb-2 text-center">
                  Classical (RSA-OAEP)
                </div>
                <div className="space-y-2 text-center">
                  {[
                    {
                      label: `1. Generate RSA-${isRSA ? kekAlgo.split('-')[1] : '2048'} key pair`,
                      active: currentStep === 0,
                    },
                    {
                      label: `2. RSA-OAEP wrap DEK → ${classicalPkBytes} B`,
                      active: currentStep === 1,
                    },
                    { label: '3. (no KDF step)', active: currentStep === 2 },
                    { label: '4. (DEK already wrapped)', active: currentStep === 3 },
                    { label: '5. RSA-OAEP unwrap → DEK · compare', active: currentStep === 4 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                        item.active
                          ? 'bg-destructive/20 text-destructive border-destructive/50'
                          : completedSteps.has(idx)
                            ? 'bg-status-success/10 text-status-success border-status-success/20'
                            : 'bg-muted/50 text-muted-foreground border-border'
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* PQC flow */}
              <div>
                <div className="text-xs font-bold text-primary mb-2 text-center">
                  PQC ({kekAlgo.toUpperCase()}
                  {!isRSA ? ` + ${WRAP_MECH_META[wrapMech].label}` : ''})
                </div>
                <div className="space-y-2 text-center">
                  {(isRSA
                    ? [
                        {
                          label: `1. Generate ${kekAlgo.toUpperCase()} key pair`,
                          active: currentStep === 0,
                        },
                        { label: '2. Generate AES-256 DEK', active: currentStep === 1 },
                        { label: '3. RSA-OAEP wrap DEK', active: currentStep === 2 },
                        { label: '4. RSA-OAEP unwrap → DEK · compare', active: currentStep === 3 },
                        { label: '—', active: currentStep === 4 },
                      ]
                    : [
                        {
                          label: `1. Generate ${kekAlgo.toUpperCase()} key pair`,
                          active: currentStep === 0,
                        },
                        { label: '2. Encaps → ct + shared secret', active: currentStep === 1 },
                        {
                          label: '3. HKDF(ss) → wrapping key (RFC 5869)',
                          active: currentStep === 2,
                        },
                        {
                          label: `4. ${WRAP_MECH_META[wrapMech].label} wrap DEK`,
                          active: currentStep === 3,
                        },
                        {
                          label: '5. Decaps → HKDF → unwrap → DEK · compare',
                          active: currentStep === 4,
                        },
                      ]
                  ).map((step, i) => (
                    <div
                      key={i}
                      className={`text-[10px] px-2 py-1 rounded ${step.active ? 'bg-primary/20 text-primary font-semibold' : 'text-muted-foreground'}`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total comparison — shown when all steps complete */}
      {completedSteps.size === ENVELOPE_ENCRYPTION_STEPS.length && (
        <div className="glass-panel p-6 border-status-success/20 animate-fade-in">
          <h3 className="text-sm font-bold text-foreground mb-3">Size Comparison Summary</h3>
          {(() => {
            // One boundary on both sides: complete HKE1 envelopes where the format covers the
            // selection, otherwise data fields only.
            const classRef = hke1Covers ? hke1TotalBytes(1) : classicalPkBytes
            const pqcTotal = mlKemSizes
              ? hke1Covers
                ? hke1TotalBytes(2)
                : mlKemSizes.ct + wrapOverheadBytes
              : classRef
            const ratio = mlKemSizes ? (pqcTotal / classRef).toFixed(1) : '—'
            const pqcTotalLabel = mlKemSizes ? `${pqcTotal.toLocaleString()} B` : `${classRef} B`
            const boundary = hke1Covers ? 'complete HKE1 envelope' : 'data fields only'
            const pqcDesc = mlKemSizes
              ? `${kekAlgo.toUpperCase()} + ${WRAP_MECH_META[wrapMech].label}, ${boundary}`
              : 'PQC Total (select ML-KEM variant)'
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
                    <div className="text-lg font-bold text-destructive">{classRef} B</div>
                    <div className="text-[10px] text-muted-foreground">
                      RSA-{isRSA ? kekAlgo.split('-')[1] : '2048'},{' '}
                      {hke1Covers ? 'complete HKE1 envelope' : 'ciphertext only'}
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
                    <div className="text-lg font-bold text-primary">{pqcTotalLabel}</div>
                    <div className="text-[10px] text-muted-foreground">{pqcDesc}</div>
                  </div>
                  <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/20 text-center">
                    <div className="text-lg font-bold text-status-warning">{ratio}x</div>
                    <div className="text-[10px] text-muted-foreground">Size Increase</div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  The {ratio}x increase in wrapped key storage is the cost of quantum-safe envelope
                  encryption. For most applications, this overhead is manageable. The larger concern
                  is the operational complexity of the 3-step KEM flow versus RSA-OAEP's single
                  operation — though all steps occur server-side.
                </p>
              </>
            )
          })()}
        </div>
      )}

      {/* Step-by-step size table */}
      <div className="glass-panel border border-border">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors h-auto rounded-none"
          onClick={() => setArtifactTableOpen((v) => !v)}
          aria-expanded={artifactTableOpen}
        >
          <span>Artifact Sizes by Step</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${artifactTableOpen ? 'rotate-180' : ''}`}
          />
        </Button>
        {artifactTableOpen && (
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Step</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Operation
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Classical
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    {isRSA ? 'PQC (ML-KEM-768 ref)' : `PQC (${kekAlgo.toUpperCase()})`}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ENVELOPE_ENCRYPTION_STEPS.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-b border-border/50 ${idx === currentStep ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 px-2 font-bold text-foreground">{s.step}</td>
                    <td className="py-2 px-2 text-foreground">{s.title}</td>
                    <td className="py-2 px-2 text-right font-mono text-destructive">
                      {classicalTotalSizes[idx]}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-primary">
                      {pqcTotalSizes[idx]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={14} aria-hidden="true" /> Previous
        </Button>
        <GateReason when={!executedSteps.has(currentStep)} className="mt-0 self-center">
          Run the live demo for this step to unlock Complete &amp; Next.
        </GateReason>
        <Button
          variant="gradient"
          size="sm"
          onClick={markComplete}
          disabled={!executedSteps.has(currentStep)}
          title={!executedSteps.has(currentStep) ? 'Run the live demo for this step first' : ''}
          className="flex items-center gap-2"
        >
          {completedSteps.has(currentStep) ? (
            <>
              <CheckCircle size={14} aria-hidden="true" /> Completed
            </>
          ) : currentStep === ENVELOPE_ENCRYPTION_STEPS.length - 1 ? (
            <>
              Mark Complete <CheckCircle size={14} aria-hidden="true" />
            </>
          ) : (
            <>
              Complete &amp; Next <ChevronRight size={14} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {/* Hybrid migration callout — NIST SP 800-227 guidance */}
      <div className="glass-panel p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              Migration Path: Use Hybrid (Classical + PQC)
            </p>
            <p className="text-xs text-muted-foreground">
              This demo shows a binary choice — RSA-OAEP <em>or</em> ML-KEM. NIST SP 800-227
              describes hybrid (PQ/T) key establishment, in which the shared secrets of all
              components are combined with an approved key combiner so that a well-designed scheme
              is secure if at least one component is secure; the document says combining schemes can
              be advantageous for some applications, for example during the migration to
              post-quantum cryptography. In this module&apos;s illustration, a combined shared
              secret is derived via HKDF from both outputs (e.g. P-256 ECDH ‖ ML-KEM-768 → HKDF →
              AES-256 KEK). This hybrid approach is available in the{' '}
              <span className="font-mono text-primary">HSM / PKCS#11 → Key Wrapping</span> tool
              which supports P-256+ML-KEM and X25519+ML-KEM multi-algorithm key-establishment
              combiner modes (not sourced in the Library).
            </p>
          </div>
        </div>
      </div>

      <KatValidationPanel
        specs={KMS_KAT_SPECS}
        label="KMS PQC Known Answer Tests"
        authorityNote="FIPS 203 · SP 800-56C Rev 2 · SP 800-38D · RFC 3394 · RFC 5649 · RFC 5869"
      />

      <PublishedKwpVectorCheck hsm={hsm} />

      {/* ── PKCS#11 log & Key Inspector (Bottom Layout) ────────────────────── */}
      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            defaultOpen={true}
            title="PKCS#11 Call Log — Envelope Encryption"
            emptyMessage="Click 'Execute' to run the live envelope encryption flow."
            filterFns={LIVE_OPERATIONS}
          />

          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
            onClear={hsm.clearKeys}
          />
        </div>
      )}
    </div>
  )
}
