// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, Circle, Lock, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ENVELOPE_ENCRYPTION_STEPS, type EnvelopeEncryptionStep } from '../data/kmsConstants'
import { useHSM } from '@/hooks/useHSM'
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
  CKA_TOKEN,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  type AttrDef,
} from '@/wasm/softhsm'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import type { KatTestSpec } from '@/utils/katRunner'

// ── Types ─────────────────────────────────────────────────────────────────────

type KekAlgorithm = 'ml-kem-512' | 'ml-kem-768' | 'ml-kem-1024' | 'rsa-2048' | 'rsa-4096'
type WrapMechanism = 'aes-kw' | 'aes-kwp' | 'aes-gcm'

// ── Constants ─────────────────────────────────────────────────────────────────

const WRAP_MECH_META: Record<WrapMechanism, { label: string; standard: string; ckm?: number }> = {
  'aes-kw': { label: 'AES-KW', standard: 'RFC 3394 · NIST SP 800-38F §6.2', ckm: CKM_AES_KEY_WRAP },
  'aes-kwp': {
    label: 'AES-KWP',
    standard: 'RFC 5649 · NIST SP 800-38F §6.3',
    ckm: CKM_AES_KEY_WRAP_KWP,
  },
  'aes-gcm': { label: 'AES-GCM', standard: 'NIST SP 800-38D' },
}

const RSA_OAEP_STANDARD = 'PKCS #1 v2.2 §7.1 · RFC 8017'

/** Fixed 32-byte HKDF salt for the KMS envelope encryption protocol.
 *  SP 800-56C Rev 2 §4.1: salt length SHALL be ≥ L bits (SHA-256 → 32 B).
 *  Value: UTF-8 "kms-envelope-salt-v1" right-padded with 0x00 to 32 bytes. */
const ENVELOPE_HKDF_SALT: Uint8Array = (() => {
  const buf = new Uint8Array(32)
  new TextEncoder().encodeInto('kms-envelope-salt-v1', buf)
  return buf
})()

/** Unwrap template for the recovered AES-256 DEK (sensitive=false so KCV is always readable).
 *  NOTE: CKA_VALUE_LEN must NOT be included — P11AttrValueLen::updateAttr rejects OBJECT_OP_UNWRAP
 *  (only OBJECT_OP_GENERATE/DERIVE allowed); the length is derived from the unwrapped bytes. */
const AES_UNWRAP_TEMPLATE: AttrDef[] = [
  { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
  { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
  { type: CKA_TOKEN, boolVal: false },
  { type: CKA_ENCRYPT, boolVal: true },
  { type: CKA_DECRYPT, boolVal: true },
  { type: CKA_SENSITIVE, boolVal: false },
  { type: CKA_EXTRACTABLE, boolVal: true },
]

const KMS_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'kms-envelope-kem-768',
    useCase: 'Envelope KEM encap/decap round-trip (ML-KEM-768)',
    standard: 'FIPS 203 §7 (encap/decap round-trip)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'kms-envelope-kem-decap-768',
    useCase: 'Envelope KEM decapsulation vs NIST ACVP vector (ML-KEM-768)',
    standard: 'FIPS 203 §7.2 (NIST ACVP decap KAT)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-decap', variant: 768 },
  },
  {
    id: 'kms-envelope-kem-512',
    useCase: 'Envelope KEM encap/decap round-trip (ML-KEM-512)',
    standard: 'FIPS 203 §7 (encap/decap round-trip)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 512 },
  },
  {
    id: 'kms-envelope-kem-1024',
    useCase: 'Envelope KEM encap/decap round-trip (ML-KEM-1024)',
    standard: 'FIPS 203 §7 (encap/decap round-trip)',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 1024 },
  },
  {
    id: 'kms-dek-encrypt',
    useCase: 'DEK encryption (AES-256-GCM)',
    standard: 'SP 800-38D',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
    kind: { type: 'aesgcm-functional' },
    message: 'KMS envelope header: keyId=arn:kms:pqc/key-001,context=prod-db',
  },
  {
    id: 'kms-kek-wrap',
    useCase: 'KEK key wrapping (AES-256-KW)',
    standard: 'RFC 3394 ACVP',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc3394',
    kind: { type: 'aeskw-wrap' },
  },
  {
    id: 'kms-kek-hkdf',
    useCase: 'KEK derivation from master (HKDF-SHA256)',
    standard: 'SP 800-108 + RFC 5869',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5869',
    kind: { type: 'hkdf-derive' },
  },
  {
    id: 'kms-kek-kwp',
    useCase: 'KEK wrapping with padding (AES-KWP)',
    standard: 'RFC 5649 + SP 800-38F',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5649',
    kind: { type: 'aes-kwp-wrap' },
  },
]

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

// ── Component ─────────────────────────────────────────────────────────────────

export const EnvelopeEncryptionDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Configuration
  const [kekAlgo, setKekAlgo] = useState<KekAlgorithm>('ml-kem-768')
  const [wrapMech, setWrapMech] = useState<WrapMechanism>('aes-kw')

  // Live HSM mode
  const hsm = useHSM()
  const [liveLines, setLiveLines] = useState<string[]>([])
  const [liveRunning, setLiveRunning] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [kcvResult, setKcvResult] = useState<{
    before: string
    after: string
    match: boolean
    method: 'kcv' | 'raw'
  } | null>(null)
  const [envelopeBlob, setEnvelopeBlob] = useState<{
    path: 'ml-kem' | 'rsa'
    kemCt: Uint8Array | null
    wrappedDek: Uint8Array
    gcmIv: Uint8Array | null
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

    const addLine = (line: string) => setLiveLines((prev) => [...prev, line])

    try {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      if (isRSA) {
        // ── RSA-OAEP path ──────────────────────────────────────────────────────
        const bits = parseInt(kekAlgo.split('-')[1]) as 2048 | 3072 | 4096

        // Step 1: Generate AES-256 DEK
        // encrypt=true, decrypt=true, wrap=false, unwrap=false, derive=false, extractable=true
        // NOTE: extractable=true here is intentional for this educational demo so we can
        // fall back to raw byte comparison when CKA_CHECK_VALUE is unavailable (C_UnwrapKey
        // gap in SoftHSMv3). In production, DEKs would be extractable=false, sensitive=true;
        // KCV would be the only integrity verification method.
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
        hsm.addKey({
          handle: dekHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 DEK',
          generatedAt: ts(),
        })
        addLine(`DEK: AES-256 key generated (32 B, for data encryption)`)
        hsm.addStepLog('── Step 1: Generate AES-256 DEK (CKM_AES_KEY_GEN) ─────────────────')

        // Step 2: Generate RSA key pair (KEK)
        const { pubHandle, privHandle } = hsm_generateRSAWrapKeyPair(M, hSession, bits)
        hsm.addKey({
          handle: pubHandle,
          family: 'rsa',
          role: 'public',
          label: `RSA-${bits} KEK (Public)`,
          generatedAt: ts(),
        })
        hsm.addKey({
          handle: privHandle,
          family: 'rsa',
          role: 'private',
          label: `RSA-${bits} KEK (Private)`,
          generatedAt: ts(),
        })
        addLine(`KEK: RSA-${bits} key pair — public key ${bits / 8} B (e=65537)`)
        hsm.addStepLog(
          `── Step 2: Generate RSA-${bits} Key Pair (CKM_RSA_PKCS_KEY_PAIR_GEN) ──────────`
        )

        // Read KCV and raw bytes of original DEK (before wrap)
        const kcvBefore = fmtKcv(hsm_getKeyCheckValue(M, hSession, dekHandle))
        const dekBytesOrig = hsm_extractKeyValue(M, hSession, dekHandle)

        // Step 3: Wrap DEK with RSA-OAEP public key
        const wrappedDek = hsm_rsaOaepWrapKey(M, hSession, pubHandle, dekHandle)
        addLine(`Wrapped DEK: ${wrappedDek.length} B (RSA-OAEP, ${RSA_OAEP_STANDARD})`)
        hsm.addStepLog(
          `── Step 3: Wrap DEK (CKM_RSA_PKCS_OAEP / ${RSA_OAEP_STANDARD}) ─────────────`
        )

        // Step 4: Unwrap DEK with RSA-OAEP private key
        const recoveredDekHandle = hsm_rsaOaepUnwrapKey(
          M,
          hSession,
          privHandle,
          wrappedDek,
          AES_UNWRAP_TEMPLATE
        )
        hsm.addKey({
          handle: recoveredDekHandle,
          family: 'aes',
          role: 'secret',
          label: 'DEK (Recovered)',
          generatedAt: ts(),
        })

        // KCV comparison — fall back to direct byte comparison if CKA_CHECK_VALUE not populated
        const kcvAfter = fmtKcv(hsm_getKeyCheckValue(M, hSession, recoveredDekHandle))
        const dekBytesRecov = hsm_extractKeyValue(M, hSession, recoveredDekHandle)
        const useRaw = kcvBefore === '—' || kcvAfter === '—'
        const kcvMatch = useRaw
          ? dekBytesOrig.length === dekBytesRecov.length &&
            dekBytesOrig.every((b, i) => b === dekBytesRecov[i])
          : kcvBefore === kcvAfter
        const displayBefore = kcvBefore !== '—' ? kcvBefore : fmtKcv(dekBytesOrig)
        const displayAfter = kcvAfter !== '—' ? kcvAfter : fmtKcv(dekBytesRecov)
        setKcvResult({
          before: displayBefore,
          after: displayAfter,
          match: kcvMatch,
          method: useRaw ? 'raw' : 'kcv',
        })

        addLine(
          `DEK round-trip: ${kcvMatch ? '✓ Integrity verified' : '✗ Keys differ — check above'}`
        )
        hsm.addStepLog('── Step 4: Unwrap DEK (CKM_RSA_PKCS_OAEP) · KCV Verified ────────────')

        addLine(
          `Storage overhead: RSA-${bits} ciphertext = ${wrappedDek.length} B total (1 wrapped blob)`
        )
        setEnvelopeBlob({ path: 'rsa', kemCt: null, wrappedDek, gcmIv: null })
      } else {
        // ── ML-KEM path ────────────────────────────────────────────────────────
        const variant = parseInt(kekAlgo.split('-')[2]) as 512 | 768 | 1024
        const mechMeta = WRAP_MECH_META[wrapMech]

        // Step 1: Generate AES-256 DEK
        // encrypt=true, decrypt=true, wrap=false, unwrap=false, derive=false, extractable=true
        // NOTE: extractable=true here is intentional for this educational demo so we can
        // fall back to raw byte comparison when CKA_CHECK_VALUE is unavailable (C_UnwrapKey
        // gap in SoftHSMv3). In production, DEKs would be extractable=false, sensitive=true;
        // KCV would be the only integrity verification method.
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
        hsm.addKey({
          handle: dekHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 DEK',
          generatedAt: ts(),
        })
        addLine(`DEK: AES-256 key generated (32 B, for data encryption)`)
        hsm.addStepLog('── Step 1: Generate AES-256 DEK (CKM_AES_KEY_GEN) ─────────────────')

        // Step 2: Generate ML-KEM key pair (KEK)
        const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, variant)
        hsm.addKey({
          handle: pubHandle,
          family: 'ml-kem',
          role: 'public',
          label: `ML-KEM-${variant} KEK (Public)`,
          generatedAt: ts(),
        })
        hsm.addKey({
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
        hsm.addStepLog(`── Step 2: Generate ML-KEM-${variant} Key Pair (FIPS 203) ──────────────`)

        // Step 3: KEM Encapsulate → shared secret + ciphertext
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(M, hSession, pubHandle, variant)
        hsm.addKey({
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
        hsm.addStepLog('── Step 3: KEM Encapsulate (CKM_ML_KEM / FIPS 203) ─────────────────')

        // Step 4: HKDF-SHA256 → 32-byte wrapping key (SP 800-56C Rev 2 §4.1)
        const derivableHandle = hsm_importGenericSecret(M, hSession, secretBytes)
        hsm.addKey({
          handle: derivableHandle,
          family: 'kdf',
          role: 'secret',
          label: 'ML-KEM SS (Derivable)',
          generatedAt: ts(),
        })

        const envelopeInfo = new TextEncoder().encode('kms-envelope-v1')
        const rawWrapHandleOut = { current: 0 }
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
        hsm.addKey({
          handle: rawWrapHandleOut.current,
          family: 'kdf',
          role: 'secret',
          label: 'HKDF Output (Generic)',
          generatedAt: ts(),
        })
        addLine(
          `HKDF-SHA256 (SP 800-56C §4.1): derived ${wrapKeyBytes.length} B wrapping key — salt=kms-envelope-salt-v1 info="kms-envelope-v1"`
        )
        hsm.addStepLog('── Step 4: Derive Wrapping Key (CKM_HKDF_DERIVE / SP 800-56C + RFC 5869) ─')

        // Read KCV and raw bytes of original DEK (before wrap)
        const kcvBefore = fmtKcv(hsm_getKeyCheckValue(M, hSession, dekHandle))
        const dekBytesOrig = hsm_extractKeyValue(M, hSession, dekHandle)

        // Step 5: Wrap DEK using selected mechanism
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
        hsm.addKey({
          handle: wrapKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'HKDF Wrapping Key',
          generatedAt: ts(),
        })

        let wrappedDek: Uint8Array
        let gcmIv: Uint8Array | null = null

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
          wrappedDek = hsm_wrapKeyMech(M, hSession, mechMeta.ckm!, wrapKeyHandle, dekHandle)
          addLine(`Wrapped DEK: ${wrappedDek.length} B (${mechMeta.label}, ${mechMeta.standard})`)
        }
        hsm.addStepLog(
          `── Step 5: Wrap DEK (${mechMeta.label} / ${mechMeta.standard}) ─────────────`
        )

        // Step 6: Decapsulate → recover shared secret → re-derive wrapping key → unwrap DEK
        const recoveredSecretHandle = hsm_decapsulate(
          M,
          hSession,
          privHandle,
          ciphertextBytes,
          variant
        )
        hsm.addKey({
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

        // Re-derive the same wrapping key from the recovered secret (same salt — SP 800-56C Rev 2 §4.1)
        const derivableHandle2 = hsm_importGenericSecret(M, hSession, recoveredSecretBytes)
        hsm.addKey({
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
        hsm.addKey({
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
        hsm.addKey({
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
        hsm.addKey({
          handle: recoveredDekHandle,
          family: 'aes',
          role: 'secret',
          label: 'DEK (Recovered)',
          generatedAt: ts(),
        })

        // KCV comparison — fall back to direct byte comparison if CKA_CHECK_VALUE not populated
        // (SoftHSM3 computes CKA_CHECK_VALUE for C_GenerateKey but not C_UnwrapKey)
        const kcvAfter = fmtKcv(hsm_getKeyCheckValue(M, hSession, recoveredDekHandle))
        const dekBytesRecov = hsm_extractKeyValue(M, hSession, recoveredDekHandle)
        const useRaw = kcvBefore === '—' || kcvAfter === '—'
        const kcvMatch = useRaw
          ? dekBytesOrig.length === dekBytesRecov.length &&
            dekBytesOrig.every((b, i) => b === dekBytesRecov[i])
          : kcvBefore === kcvAfter
        const displayBefore = kcvBefore !== '—' ? kcvBefore : fmtKcv(dekBytesOrig)
        const displayAfter = kcvAfter !== '—' ? kcvAfter : fmtKcv(dekBytesRecov)
        setKcvResult({
          before: displayBefore,
          after: displayAfter,
          match: kcvMatch,
          method: useRaw ? 'raw' : 'kcv',
        })

        addLine(
          `DEK round-trip: ${kcvMatch ? '✓ Integrity verified' : '✗ Keys differ — check above'}`
        )
        hsm.addStepLog('── Step 6: Decapsulate + Unwrap DEK · KCV Verified ─────────────────')

        const totalBytes = ciphertextBytes.length + wrappedDek.length + (gcmIv?.length ?? 0)
        addLine(
          `Storage overhead: KEM ciphertext ${ciphertextBytes.length} B` +
            ` + wrapped DEK ${wrappedDek.length} B` +
            (gcmIv ? ` + GCM nonce ${gcmIv.length} B` : '') +
            ` = ${totalBytes} B total (2 blobs)`
        )
        setEnvelopeBlob({
          path: 'ml-kem',
          kemCt: ciphertextBytes,
          wrappedDek,
          gcmIv: gcmIv ?? null,
        })
      }
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : String(e))
    } finally {
      setLiveRunning(false)
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
  // AES-KW: 40 B · AES-KWP: 48 B (RFC 5649 §4.2 AIV, softhsmv3 aes_kw crate) · AES-GCM: 60 B (48 B ct + 12 B nonce)
  const wrapOverheadBytes = wrapMech === 'aes-gcm' ? 60 : wrapMech === 'aes-kwp' ? 48 : 40
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
    return `${kekAlgo.toUpperCase()} encapsulation keys are ${ratio}x larger than RSA-2048 public keys (${pk.toLocaleString()} B vs 256 B). This impacts certificate sizes and key distribution bandwidth.`
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
        ? `${rsaBits / 8} bytes total`
        : `${pqcRefSizes.ct.toLocaleString()} + ${wrapOverheadBytes} = ${pqcRefSizes.ct + wrapOverheadBytes} bytes total`,
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
        <h3 className="text-lg font-bold text-foreground mb-2">Envelope Encryption Demo</h3>
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
                    onClick={() => setKekAlgo(alg)}
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
                      onClick={() => setWrapMech(key)}
                      disabled={liveRunning}
                      title={meta.standard}
                      className={`font-mono text-xs h-auto py-1 px-2.5 ${
                        wrapMech === key
                          ? 'bg-primary/20 text-primary border-primary/50 font-semibold'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {meta.label}
                      <span className="ml-1 text-[10px] font-normal opacity-70 hidden sm:inline">
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
                  <Loader2 size={11} className="animate-spin" /> Running…
                </>
              ) : (
                'Execute (Live WASM)'
              )}
            </Button>
          </div>

          {liveError && <p className="text-xs text-status-error font-mono">{liveError}</p>}

          {/* ── Summary lines ──────────────────────────────────────────────────── */}
          {liveLines.length > 0 && (
            <div className="bg-status-success/5 border border-status-success/20 rounded-lg p-3 space-y-1">
              {liveLines.map((line, i) => (
                <p key={i} className="text-xs font-mono text-foreground/80 break-all">
                  {line}
                </p>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                Real output from SoftHSM3 WASM · PKCS#11 v3.2
              </p>
            </div>
          )}

          {/* ── KCV Verification panel ─────────────────────────────────────────── */}
          {kcvResult && (
            <div
              className={`rounded-lg p-3 border text-xs ${
                kcvResult.match
                  ? 'bg-status-success/5 border-status-success/30'
                  : 'bg-status-error/5 border-status-error/30'
              }`}
            >
              <p className="font-semibold mb-2 text-foreground">
                Key Integrity Verification (
                {kcvResult.method === 'kcv' ? 'CKA_CHECK_VALUE' : 'CKA_VALUE byte comparison'})
              </p>
              <div className="font-mono space-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-32 shrink-0">DEK before wrap:</span>
                  <span className="text-foreground tracking-widest">{kcvResult.before}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-32 shrink-0">DEK after unwrap:</span>
                  <span className="text-foreground tracking-widest">{kcvResult.after}</span>
                  {kcvResult.match ? (
                    <span className="text-status-success font-bold ml-1">✓ Keys match</span>
                  ) : (
                    <span className="text-status-error font-bold ml-1">✗ Keys differ</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {kcvResult.method === 'kcv'
                  ? 'CKA_CHECK_VALUE = first 3 bytes of AES-ECB(key, 0x00…) — PKCS#11 §9'
                  : 'SoftHSMv3 implementation note: C_GenerateKey populates CKA_CHECK_VALUE but C_UnwrapKey does not (this is an implementation gap, not a PKCS#11 requirement). Falling back to first 3 bytes of CKA_VALUE for comparison. In production HSMs, CKA_CHECK_VALUE is the correct verification method.'}
              </p>
            </div>
          )}

          {/* ── Envelope Blob Hex Viewer ──────────────────────────────────── */}
          {envelopeBlob && (
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-foreground">Stored Envelope Blobs</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                  {envelopeBlob.kemCt
                    ? `KEM\u202f+\u202fAES\u202f·\u202f${envelopeBlob.kemCt.length + envelopeBlob.wrappedDek.length + (envelopeBlob.gcmIv?.length ?? 0)}\u00a0B`
                    : `RSA-OAEP\u202f·\u202f${envelopeBlob.wrappedDek.length}\u00a0B`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {envelopeBlob.kemCt
                  ? 'Raw bytes that would be stored alongside the encrypted data. The recipient decapsulates the KEM ciphertext, re-derives the HKDF wrapping key (SP\u00a0800-56C), then unwraps the DEK.'
                  : 'Raw RSA-OAEP ciphertext stored alongside encrypted data. The recipient decrypts with their RSA private key to recover the DEK.'}
              </p>
              {envelopeBlob.kemCt && (
                <BlobHexPanel label="KEM Ciphertext" bytes={envelopeBlob.kemCt} />
              )}
              <BlobHexPanel label="Wrapped DEK" bytes={envelopeBlob.wrappedDek} />
              {envelopeBlob.gcmIv && (
                <BlobHexPanel label="GCM Nonce (IV)" bytes={envelopeBlob.gcmIv} />
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
              {completedSteps.has(idx) ? <CheckCircle size={12} /> : <Circle size={12} />}
              <span className="hidden sm:inline">Step {s.step}</span>
              <span className="sm:hidden">{s.step}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{
            width: `${(completedSteps.size / ENVELOPE_ENCRYPTION_STEPS.length) * 100}%`,
          }}
        />
      </div>

      {/* Current step detail */}
      {displayStep && (
        <div className="glass-panel p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Lock size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Step {displayStep.step} of {ENVELOPE_ENCRYPTION_STEPS.length}
                </span>
              </div>
              <h4 className="text-xl font-bold text-foreground">{displayStep.title}</h4>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Classical side */}
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold">
                  CLASSICAL
                </span>
                <span className="text-xs text-muted-foreground">RSA-OAEP</span>
              </div>
              <p className="text-xs text-foreground/80 mb-3">{displayStep.classicalDescription}</p>
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
              <p className="text-xs text-foreground/80 mb-3">{displayStep.pqcDescription}</p>
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
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">
                {displayStep.step === 1 &&
                  (step1ComparisonNote ??
                    'Select an ML-KEM variant to see the size comparison against RSA-2048.')}
                {displayStep.step === 2 &&
                  'RSA-OAEP directly encrypts the DEK in one operation. ML-KEM produces a random shared secret that must be derived into a wrapping key — a fundamental paradigm difference.'}
                {displayStep.step === 3 &&
                  (isRSA
                    ? 'RSA-OAEP is a direct encryption scheme — the decrypted output IS the DEK. No KDF step is needed. This step is skipped in the classical path.'
                    : 'This KDF step is unique to KEMs. The shared secret from ML-KEM.Encaps() is a random 32-byte value — not directly usable as a wrapping key without domain separation. ' +
                      'HKDF binds it to a context string (info="kms-envelope-v1") so the derived key is isolated to this protocol and version, preventing cross-protocol key reuse (RFC 5869 §3.2).')}
                {displayStep.step === 4 &&
                  `AES-KW (RFC 3394), AES-KWP (RFC 5649), or AES-GCM (NIST SP 800-38D) wraps the 32-byte DEK. ` +
                    `AES-KW produces 40 B (8-byte A value / ICV per RFC 3394 §2.2.3, not an IV). ` +
                    `AES-KWP produces 48 B (RFC 5649 §4.2 — 8-byte AIV over padded plaintext, softhsmv3 aes_kw crate). ` +
                    `AES-GCM produces 48 B ciphertext + 12-byte random nonce. ` +
                    `Store the KEM ciphertext alongside the wrapped DEK. ` +
                    `Note: C_EncapsulateKey and C_DecapsulateKey are new in PKCS#11 v3.2 (OASIS 2023) — classic PKCS#11 had no native KEM primitives.`}
                {displayStep.step === 5 &&
                  'Both paths recover the same 32-byte DEK. The KCV (CKA_CHECK_VALUE) confirms key integrity across the wrap/unwrap cycle. ' +
                    'Envelope encryption enables DEK rotation without re-encrypting any data — just generate a new DEK and re-wrap it with the same or new KEK. ' +
                    "To rotate the KEK, re-wrap the existing DEK with the new KEK; data blocks remain untouched. This is envelope encryption's primary operational advantage at scale."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flow diagram */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Envelope Encryption Flow</h4>
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
                { label: '5. RSA-OAEP unwrap → DEK · KCV ✓', active: currentStep === 4 },
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
                    { label: '4. RSA-OAEP unwrap → DEK · KCV ✓', active: currentStep === 3 },
                    { label: '—', active: currentStep === 4 },
                  ]
                : [
                    {
                      label: `1. Generate ${kekAlgo.toUpperCase()} key pair`,
                      active: currentStep === 0,
                    },
                    { label: '2. Encaps → ct + shared secret', active: currentStep === 1 },
                    { label: '3. HKDF(ss) → wrapping key (RFC 5869)', active: currentStep === 2 },
                    {
                      label: `4. ${WRAP_MECH_META[wrapMech].label} wrap DEK`,
                      active: currentStep === 3,
                    },
                    {
                      label: '5. Decaps → HKDF → unwrap → DEK · KCV ✓',
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

      {/* Total comparison — shown when all steps complete */}
      {completedSteps.size === ENVELOPE_ENCRYPTION_STEPS.length && (
        <div className="glass-panel p-6 border-status-success/20 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground mb-3">Size Comparison Summary</h4>
          {(() => {
            const classRef = classicalPkBytes
            const pqcTotal = mlKemSizes ? mlKemSizes.ct + wrapOverheadBytes : classRef
            const ratio = mlKemSizes ? (pqcTotal / classRef).toFixed(1) : '—'
            const pqcTotalLabel = mlKemSizes ? `${pqcTotal.toLocaleString()} B` : `${classRef} B`
            const pqcDesc = mlKemSizes
              ? `${kekAlgo.toUpperCase()} + ${WRAP_MECH_META[wrapMech].label} Total`
              : 'PQC Total (select ML-KEM variant)'
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
                    <div className="text-lg font-bold text-destructive">{classRef} B</div>
                    <div className="text-[10px] text-muted-foreground">
                      RSA-{isRSA ? kekAlgo.split('-')[1] : '2048'} Total
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
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Artifact Sizes by Step</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Step</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Operation</th>
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
          <ChevronLeft size={14} /> Previous
        </Button>
        <Button
          variant="gradient"
          size="sm"
          onClick={markComplete}
          className="flex items-center gap-2"
        >
          {completedSteps.has(currentStep) ? (
            <>
              <CheckCircle size={14} /> Completed
            </>
          ) : currentStep === ENVELOPE_ENCRYPTION_STEPS.length - 1 ? (
            <>
              Mark Complete <CheckCircle size={14} />
            </>
          ) : (
            <>
              Complete &amp; Next <ChevronRight size={14} />
            </>
          )}
        </Button>
      </div>

      {/* Hybrid migration callout — NIST SP 800-227 guidance */}
      <div className="glass-panel p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              Migration Path: Use Hybrid (Classical + PQC)
            </p>
            <p className="text-xs text-muted-foreground">
              This demo shows a binary choice — RSA-OAEP <em>or</em> ML-KEM. NIST SP 800-227 and
              current migration guidance recommend running <strong>both simultaneously</strong>{' '}
              during the transition period: combine classical ECDH or RSA with ML-KEM so that
              security holds even if one scheme is broken. A combined shared secret is derived via
              HKDF from both outputs (e.g. P-256 ECDH ‖ ML-KEM-768 → HKDF → AES-256 KEK). This
              hybrid approach is available in the{' '}
              <span className="font-mono text-primary">HSM / PKCS#11 → Key Wrapping</span> tool
              which supports P-256+ML-KEM and X25519+ML-KEM combiner modes per SP 800-227.
            </p>
          </div>
        </div>
      </div>

      <KatValidationPanel
        specs={KMS_KAT_SPECS}
        label="KMS PQC Known Answer Tests"
        authorityNote="FIPS 203 · SP 800-56C Rev 2 · SP 800-38D · RFC 3394 · RFC 5649 · RFC 5869"
      />

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
            onRemoveKey={hsm.removeKey}
            onClear={hsm.clearKeys}
          />
        </div>
      )}
    </div>
  )
}
