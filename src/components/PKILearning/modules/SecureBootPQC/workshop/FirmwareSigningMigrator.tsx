// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  FileCode,
  Key,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Info,
  Loader2,
  Upload,
  Download,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HsmFamily } from '@/components/Playground/hsm/HsmContext'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import {
  hsm_generateMLDSAKeyPair,
  hsm_extractKeyValue,
  hsm_digest,
  hsm_sign,
  hsm_verify,
  hsm_generateRSAKeyPair,
  hsm_rsaSign,
  hsm_rsaVerify,
  hsm_generateECKeyPair,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  CKM_SHA256,
  CKM_SHA256_RSA_PKCS,
  CKM_SHA384_RSA_PKCS,
  CKM_SHA512_RSA_PKCS,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_ECDSA_SHA512,
  CKP_SLH_DSA_SHA2_128S,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { FilterDropdown } from '@/components/common/FilterDropdown'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PqcAlgo = 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87' | 'SLH-DSA-SHA2-128S'
type ClassicalAlgo = 'RSA-2048' | 'RSA-3072' | 'ECDSA-P256' | 'ECDSA-P384'
type HashAlgo = 'SHA-256' | 'SHA-384' | 'SHA-512'
type WizardStep = 0 | 1 | 2 | 3

// ---------------------------------------------------------------------------
// Algorithm config lookup tables
// ---------------------------------------------------------------------------

const CLASSICAL_MECH: Record<ClassicalAlgo, Record<HashAlgo, number>> = {
  'RSA-2048': {
    'SHA-256': CKM_SHA256_RSA_PKCS,
    'SHA-384': CKM_SHA384_RSA_PKCS,
    'SHA-512': CKM_SHA512_RSA_PKCS,
  },
  'RSA-3072': {
    'SHA-256': CKM_SHA256_RSA_PKCS,
    'SHA-384': CKM_SHA384_RSA_PKCS,
    'SHA-512': CKM_SHA512_RSA_PKCS,
  },
  'ECDSA-P256': {
    'SHA-256': CKM_ECDSA_SHA256,
    'SHA-384': CKM_ECDSA_SHA384,
    'SHA-512': CKM_ECDSA_SHA512,
  },
  'ECDSA-P384': {
    'SHA-256': CKM_ECDSA_SHA256,
    'SHA-384': CKM_ECDSA_SHA384,
    'SHA-512': CKM_ECDSA_SHA512,
  },
}

const MLDSA_VARIANT: Record<string, number> = { 'ML-DSA-44': 44, 'ML-DSA-65': 65, 'ML-DSA-87': 87 }

// Expected key sizes from FIPS 203/204/205
const CLASSICAL_PUBKEY_BYTES: Record<ClassicalAlgo, number> = {
  'RSA-2048': 256,
  'RSA-3072': 384,
  'ECDSA-P256': 65,
  'ECDSA-P384': 97,
}
const CLASSICAL_PRIVKEY_BYTES: Record<ClassicalAlgo, number> = {
  'RSA-2048': 1192,
  'RSA-3072': 1700,
  'ECDSA-P256': 32,
  'ECDSA-P384': 48,
}
// DER-encoded signature sizes: RSA sig = modulus size; ECDSA DER(r,s) adds up to 8 bytes overhead
const CLASSICAL_SIG_BYTES: Record<ClassicalAlgo, number> = {
  'RSA-2048': 256,
  'RSA-3072': 384,
  'ECDSA-P256': 72, // r(32) + s(32) + DER overhead ≤ 8 B
  'ECDSA-P384': 104, // r(48) + s(48) + DER overhead ≤ 8 B
}
const MLDSA_PUBKEY_BYTES: Record<string, number> = {
  'ML-DSA-44': 1312,
  'ML-DSA-65': 1952,
  'ML-DSA-87': 2592,
}
const MLDSA_PRIVKEY_BYTES: Record<string, number> = {
  'ML-DSA-44': 2560,
  'ML-DSA-65': 4032,
  'ML-DSA-87': 4896,
}
const MLDSA_SIG_BYTES: Record<string, number> = {
  'ML-DSA-44': 2420,
  'ML-DSA-65': 3309,
  'ML-DSA-87': 4627,
}
const MLDSA_NIST_LEVEL: Record<string, string> = {
  'ML-DSA-44': 'NIST Level 2',
  'ML-DSA-65': 'NIST Level 3',
  'ML-DSA-87': 'NIST Level 5',
}
// SLH-DSA-SHA2-128S: pubkey=32B, privkey=64B, sig=7,856B
const SLHDSA_PUBKEY_BYTES = 32
const SLHDSA_PRIVKEY_BYTES = 64
const SLHDSA_SIG_BYTES = 7856

// CMS OIDs (RFC 9882, RFC 9814, RFC 5652)
const OID_SIGNED_DATA = '1.2.840.113549.1.7.2'
const OID_DATA = '1.2.840.113549.1.7.1'
const OID_ML_DSA: Record<string, string> = {
  'ML-DSA-44': '2.16.840.1.101.3.4.3.17',
  'ML-DSA-65': '2.16.840.1.101.3.4.3.18',
  'ML-DSA-87': '2.16.840.1.101.3.4.3.19',
}
const OID_SLH_DSA_SHA2_128S = '2.16.840.1.101.3.4.3.20'
const OID_SHA: Record<HashAlgo, string> = {
  'SHA-256': '2.16.840.1.101.3.4.2.1',
  'SHA-384': '2.16.840.1.101.3.4.2.2',
  'SHA-512': '2.16.840.1.101.3.4.2.3',
}
const OID_RSA_SHA: Record<HashAlgo, string> = {
  'SHA-256': '1.2.840.113549.1.1.11', // sha256WithRSAEncryption
  'SHA-384': '1.2.840.113549.1.1.12', // sha384WithRSAEncryption
  'SHA-512': '1.2.840.113549.1.1.13', // sha512WithRSAEncryption
}
const OID_ECDSA_SHA: Record<HashAlgo, string> = {
  'SHA-256': '1.2.840.10045.4.3.2',
  'SHA-384': '1.2.840.10045.4.3.3',
  'SHA-512': '1.2.840.10045.4.3.4',
}

// ---------------------------------------------------------------------------
// CMS SignedData encoder (minimal, per RFC 5652, RFC 9882, RFC 9814)
// Hand-rolled DER using @peculiar/asn1-schema + low-level helpers.
// Pure mode only — no pre-hash (RFC 9882 §3.1, RFC 9814 §1.2).
// ---------------------------------------------------------------------------

function encodeDERLength(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n])
  if (n < 0x100) return new Uint8Array([0x81, n])
  if (n < 0x10000) return new Uint8Array([0x82, (n >> 8) & 0xff, n & 0xff])
  return new Uint8Array([0x83, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff])
}

function derSeq(items: Uint8Array[]): Uint8Array {
  const body = concat(items)
  const len = encodeDERLength(body.length)
  return concat([new Uint8Array([0x30]), len, body])
}

function derSet(items: Uint8Array[]): Uint8Array {
  const body = concat(items)
  const len = encodeDERLength(body.length)
  return concat([new Uint8Array([0x31]), len, body])
}

function derOctetString(data: Uint8Array): Uint8Array {
  const len = encodeDERLength(data.length)
  return concat([new Uint8Array([0x04]), len, data])
}

function derInteger(value: number): Uint8Array {
  return new Uint8Array([0x02, 0x01, value])
}

function derContextExplicit(tag: number, content: Uint8Array): Uint8Array {
  const len = encodeDERLength(content.length)
  return concat([new Uint8Array([0xa0 | tag]), len, content])
}

function derOID(oidStr: string): Uint8Array {
  // Encode OID string to DER bytes
  const parts = oidStr.split('.').map(Number)
  const values: number[] = [parts[0] * 40 + parts[1]]
  for (let i = 2; i < parts.length; i++) {
    let v = parts[i]
    const bytes: number[] = []
    bytes.push(v & 0x7f)
    v >>= 7
    while (v > 0) {
      bytes.unshift((v & 0x7f) | 0x80)
      v >>= 7
    }
    values.push(...bytes)
  }
  const body = new Uint8Array(values)
  const len = encodeDERLength(body.length)
  return concat([new Uint8Array([0x06]), len, body])
}

function derAlgId(oidStr: string): Uint8Array {
  // AlgorithmIdentifier ::= SEQUENCE { algorithm OID }
  // For PQC (ML-DSA, SLH-DSA): no parameters field per RFC 9882/9814
  return derSeq([derOID(oidStr)])
}

function derAlgIdWithNull(oidStr: string): Uint8Array {
  // AlgorithmIdentifier for classical algos: SEQUENCE { algorithm OID, parameters NULL }
  return derSeq([derOID(oidStr), new Uint8Array([0x05, 0x00])])
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

interface CmsInput {
  sigAlgOid: string
  digestAlgOid: string
  isPqc: boolean // if true, omit NULL parameters from AlgIds
  content: Uint8Array
  sigBytes: Uint8Array
  signerLabel: string
}

/**
 * Build a minimal CMS SignedData DER blob (RFC 5652).
 * Pure mode only — no pre-hash (RFC 9882 §3.1, RFC 9814 §1.2).
 * Does not include a certificate — educational demo only.
 */
function buildCmsSignedData(input: CmsInput): Uint8Array {
  const { sigAlgOid, digestAlgOid, isPqc, content, sigBytes } = input

  // digestAlgorithm AlgorithmIdentifier
  const digestAlgIdDer = isPqc ? derAlgId(digestAlgOid) : derAlgIdWithNull(digestAlgOid)

  // signatureAlgorithm AlgorithmIdentifier
  const sigAlgIdDer = isPqc ? derAlgId(sigAlgOid) : derAlgIdWithNull(sigAlgOid)

  // EncapsulatedContentInfo ::= SEQUENCE { eContentType OID, eContent [0] EXPLICIT OCTET STRING }
  const eContentDer = derContextExplicit(0, derOctetString(content))
  const encapContentInfo = derSeq([derOID(OID_DATA), eContentDer])

  // IssuerAndSerialNumber (minimal placeholder): SEQUENCE { SEQUENCE { SET { SEQUENCE { OID CN, UTF8 "demo" } } }, INTEGER 1 }
  const cnOid = new Uint8Array([0x55, 0x04, 0x03]) // 2.5.4.3 CN
  const cnOidDer = concat([new Uint8Array([0x06, cnOid.length]), cnOid])
  const cnValDer = concat([new Uint8Array([0x0c, 0x04]), new TextEncoder().encode('demo')])
  const atav = derSeq([cnOidDer, cnValDer])
  const rdn = derSet([atav])
  const issuerName = derSeq([rdn])
  const serial = derInteger(1)
  const issuerAndSerial = derSeq([issuerName, serial])

  // SignerInfo ::= SEQUENCE { version, sid, digestAlgorithm, signatureAlgorithm, signature }
  const signerInfo = derSeq([
    derInteger(1), // version
    issuerAndSerial, // sid: IssuerAndSerialNumber
    digestAlgIdDer, // digestAlgorithm
    sigAlgIdDer, // signatureAlgorithm
    derOctetString(sigBytes), // signature OCTET STRING
  ])

  // SignedData ::= SEQUENCE { version, digestAlgorithms SET, encapContentInfo, signerInfos SET }
  const signedData = derSeq([
    derInteger(1), // version
    derSet([digestAlgIdDer]), // digestAlgorithms
    encapContentInfo, // encapContentInfo
    derSet([signerInfo]), // signerInfos
  ])

  // ContentInfo ::= SEQUENCE { contentType OID, content [0] EXPLICIT SignedData }
  const contentInfo = derSeq([derOID(OID_SIGNED_DATA), derContextExplicit(0, signedData)])

  return contentInfo
}

// ---------------------------------------------------------------------------
// Standards reference chips
// ---------------------------------------------------------------------------

const LibRef = ({ id, label }: { id: string; label: string }) => (
  <a
    href={`/library?ref=${id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
  >
    <BookOpen size={9} />
    {label}
  </a>
)

// ---------------------------------------------------------------------------
// KAT specs
// ---------------------------------------------------------------------------

const SECBOOT_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'secboot-uefi-sigver',
    useCase: 'UEFI Secure Boot db verification (ML-DSA-87)',
    standard: 'UEFI 2.10 + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-sigver', variant: 87 },
  },
  {
    id: 'secboot-firmware-sign',
    useCase: 'Firmware image signing (ML-DSA-87)',
    standard: 'UEFI 2.10 + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 87 },
    message: 'UEFI Secure Boot db entry: CN=PQC-SecureBoot-2026,EKU=codeSigning',
  },
  {
    id: 'secboot-measurement-hash',
    useCase: 'PCR measurement hash (SHA-256)',
    standard: 'TPM 2.0 + FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 1 },
  },
  {
    id: 'secboot-firmware-digest',
    useCase: 'Firmware image digest (multi-part SHA-512)',
    standard: 'UEFI 2.10 + FIPS 180-4',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'digest-multipart', hashAlg: 'SHA-512' },
  },
]

// ---------------------------------------------------------------------------
// Mock data (used when Live HSM is off)
// ---------------------------------------------------------------------------

interface FirmwareManifest {
  firmwareName: string
  version: string
  vendor: string
  platform: string
  currentSigningKey: string
  currentAlgorithm: string
  currentSignatureSize: number
  currentKeySize: number
  components: { name: string; size: string; hash: string }[]
}

const MOCK_MANIFEST: FirmwareManifest = {
  firmwareName: 'APTIO_V_GenericServerPlatform',
  version: '5.27.1234',
  vendor: 'AMI',
  platform: 'Xeon Scalable 4th Gen Reference Platform',
  currentSigningKey: 'ami-firmware-sign-rsa2048-2023',
  currentAlgorithm: 'RSA-2048 with SHA-256',
  currentSignatureSize: 256,
  currentKeySize: 256,
  components: [
    { name: 'PEI Core', size: '512 KB', hash: 'a3f2c1d4e5b6a7f8...' },
    { name: 'DXE Core', size: '1.2 MB', hash: 'b4c3d2e1f0a9b8c7...' },
    { name: 'UEFI Shell', size: '256 KB', hash: 'c5d4e3f2a1b0c9d8...' },
    { name: 'Setup UI', size: '384 KB', hash: 'd6e5f4a3b2c1d0e9...' },
    { name: 'Network Stack', size: '192 KB', hash: 'e7f6a5b4c3d2e1f0...' },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const truncateHex = (hex: string, maxChars = 80): string => {
  if (hex.length <= maxChars) return hex
  return `${hex.slice(0, maxChars / 2)}...${hex.slice(-maxChars / 2)}`
}

const buildManifestString = (fileBytes: Uint8Array | null): string => {
  if (fileBytes) {
    // Use a prefix + length + last-8-bytes fingerprint of the uploaded file
    const tail = fileBytes.slice(-8)
    return `file-upload:${fileBytes.length}:${toHex(tail)}`
  }
  return MOCK_MANIFEST.components.map((c) => `${c.name}:${c.size}:${c.hash}`).join('|')
}

const downloadBlob = (bytes: Uint8Array, filename: string) => {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const STEP_TITLES = [
  'Step 1: Upload & Configure',
  'Step 2: Generate Keys',
  'Step 3: Sign Firmware',
  'Step 4: Verify & Compare',
]

const STEP_ICONS = [FileCode, Key, AlertTriangle, CheckCircle]

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_DigestInit',
  'C_Digest',
  'C_SignInit',
  'C_Sign',
  'C_VerifyInit',
  'C_Verify',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_MessageVerifyFinal',
]

// Dropdown option lists
const PQC_ALGO_OPTIONS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHA2-128S']
const CLASSICAL_ALGO_OPTIONS = ['RSA-2048', 'RSA-3072', 'ECDSA-P256', 'ECDSA-P384']
const HASH_ALGO_OPTIONS = ['SHA-256', 'SHA-384', 'SHA-512']

// ---------------------------------------------------------------------------
// Key inspection row (inline, no full HsmKeyTable dependency)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const FirmwareSigningMigrator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [signError, setSignError] = useState<string>('')

  // Algorithm selection
  const [pqcAlgo, setPqcAlgo] = useState<PqcAlgo>('ML-DSA-65')
  const [classicalAlgo, setClassicalAlgo] = useState<ClassicalAlgo>('RSA-2048')
  const [hashAlgo, setHashAlgo] = useState<HashAlgo>('SHA-256')

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null)
  const [fileDigestHex, setFileDigestHex] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)

  // Live HSM state
  const hsm = useHSM()

  // PQC key handles
  const pqcKeyRef = useRef<{ pubHandle: number; privHandle: number }>({
    pubHandle: 0,
    privHandle: 0,
  })
  const [pqcPubKeyBytes, setPqcPubKeyBytes] = useState<number>(0)
  const [pqcKeysReady, setPqcKeysReady] = useState(false)

  // Classical key handles
  const classicalKeyRef = useRef<{ pubHandle: number; privHandle: number }>({
    pubHandle: 0,
    privHandle: 0,
  })
  const [classicalPubKeyBytes, setClassicalPubKeyBytes] = useState<number>(0)
  const [classicalKeysReady, setClassicalKeysReady] = useState(false)

  // PQC signature
  const pqcSigBytesRef = useRef<Uint8Array | null>(null)
  const [pqcSigHex, setPqcSigHex] = useState<string>('')
  const [pqcSigSize, setPqcSigSize] = useState<number>(0)
  const [pqcCmsDer, setPqcCmsDer] = useState<Uint8Array | null>(null)

  // Classical signature
  const classicalSigBytesRef = useRef<Uint8Array | null>(null)
  const [classicalSigHex, setClassicalSigHex] = useState<string>('')
  const [classicalSigSize, setClassicalSigSize] = useState<number>(0)
  const [classicalCmsDer, setClassicalCmsDer] = useState<Uint8Array | null>(null)

  // Verify results
  const [pqcVerified, setPqcVerified] = useState<boolean | null>(null)
  const [classicalVerified, setClassicalVerified] = useState<boolean | null>(null)

  const isLive = hsm.isReady && !!hsm.moduleRef.current
  const keysGenerated = pqcKeysReady && classicalKeysReady
  const signaturesReady = pqcSigSize > 0 && classicalSigSize > 0

  // Reset PQC key state when algorithm changes — stale handles cause WASM errors.
  useEffect(() => {
    if (!pqcKeysReady) return
    pqcKeyRef.current = { pubHandle: 0, privHandle: 0 }
    pqcSigBytesRef.current = null
    /* eslint-disable react-hooks/set-state-in-effect */
    setPqcKeysReady(false)
    setPqcPubKeyBytes(0)
    setPqcSigHex('')
    setPqcSigSize(0)
    setPqcCmsDer(null)
    setPqcVerified(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pqcAlgo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset classical key state when algorithm changes — stale handles cause WASM errors.
  useEffect(() => {
    if (!classicalKeysReady) return
    classicalKeyRef.current = { pubHandle: 0, privHandle: 0 }
    classicalSigBytesRef.current = null
    /* eslint-disable react-hooks/set-state-in-effect */
    setClassicalKeysReady(false)
    setClassicalPubKeyBytes(0)
    setClassicalSigHex('')
    setClassicalSigSize(0)
    setClassicalCmsDer(null)
    setClassicalVerified(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [classicalAlgo]) // eslint-disable-line react-hooks/exhaustive-deps

  const markComplete = (step: number) => setCompletedSteps((prev) => new Set([...prev, step]))

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadedFile(file)
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      setFileBytes(bytes)
      // Compute SHA-256 of file for display
      if (isLive && hsm.moduleRef.current) {
        try {
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const digest = hsm_digest(M, hsm.hSessionRef.current, bytes, CKM_SHA256)
          setFileDigestHex(toHex(digest))
        } catch {
          // fallback: SubtleCrypto
          const hashBuf = await crypto.subtle.digest('SHA-256', buf)
          setFileDigestHex(toHex(new Uint8Array(hashBuf)))
        }
      } else {
        const hashBuf = await crypto.subtle.digest('SHA-256', buf)
        setFileDigestHex(toHex(new Uint8Array(hashBuf)))
      }
    },
    [isLive, hsm]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  // ---------------------------------------------------------------------------
  // Key generation
  // ---------------------------------------------------------------------------

  const handleGenerateBothKeys = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current) return
    setIsProcessing(true)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current

      // --- Classical keygen ---
      let classicalFamily = ''
      let classicalLabelSuffix = ''
      if (classicalAlgo.startsWith('RSA')) {
        const bits = classicalAlgo === 'RSA-2048' ? 2048 : 3072
        const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, bits, false, 'sign')
        classicalKeyRef.current = { pubHandle, privHandle }
        setClassicalPubKeyBytes(CLASSICAL_PUBKEY_BYTES[classicalAlgo])
        classicalFamily = 'rsa'
        classicalLabelSuffix = classicalAlgo
      } else {
        const curve = classicalAlgo === 'ECDSA-P256' ? 'P-256' : 'P-384'
        const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve, false, 'sign')
        classicalKeyRef.current = { pubHandle, privHandle }
        setClassicalPubKeyBytes(CLASSICAL_PUBKEY_BYTES[classicalAlgo])
        classicalFamily = 'ecdsa'
        classicalLabelSuffix = classicalAlgo
      }
      setClassicalKeysReady(true)

      hsm.addKey({
        handle: classicalKeyRef.current.pubHandle,
        family: classicalFamily as HsmFamily,
        role: 'public',
        label: `${classicalLabelSuffix} Public`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      hsm.addKey({
        handle: classicalKeyRef.current.privHandle,
        family: classicalFamily as HsmFamily,
        role: 'private',
        label: `${classicalLabelSuffix} Private`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })

      // --- PQC keygen ---
      let pqcFamily = ''
      let pqcLabelSuffix = ''
      if (pqcAlgo === 'SLH-DSA-SHA2-128S') {
        const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(
          M,
          hSession,
          CKP_SLH_DSA_SHA2_128S
        )
        pqcKeyRef.current = { pubHandle, privHandle }
        setPqcPubKeyBytes(SLHDSA_PUBKEY_BYTES)
        pqcFamily = 'slh-dsa'
        pqcLabelSuffix = pqcAlgo
      } else {
        const variant = MLDSA_VARIANT[pqcAlgo] ?? 65
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(
          M,
          hSession,
          variant as 44 | 65 | 87
        )
        pqcKeyRef.current = { pubHandle, privHandle }
        const pubBytes = hsm_extractKeyValue(M, hSession, pubHandle)
        setPqcPubKeyBytes(pubBytes.length)
        pqcFamily = 'ml-dsa'
        pqcLabelSuffix = pqcAlgo
      }
      setPqcKeysReady(true)

      hsm.addKey({
        handle: pqcKeyRef.current.pubHandle,
        family: pqcFamily as HsmFamily,
        role: 'public',
        label: `${pqcLabelSuffix} Public`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      hsm.addKey({
        handle: pqcKeyRef.current.privHandle,
        family: pqcFamily as HsmFamily,
        role: 'private',
        label: `${pqcLabelSuffix} Private`,
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    } catch (err) {
      console.error('[FirmwareSigningMigrator] keygen error:', err)
    }
    setIsProcessing(false)
  }, [hsm, classicalAlgo, pqcAlgo])

  // ---------------------------------------------------------------------------
  // Signing
  // ---------------------------------------------------------------------------

  const handleSignBoth = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current) return
    if (!classicalKeyRef.current.privHandle || !pqcKeyRef.current.privHandle) {
      setSignError('Keys not ready — generate keys first (Step 2: Generate Keys)')
      return
    }
    setSignError('')
    setIsProcessing(true)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const content = buildManifestString(fileBytes)
      const contentBytes = new TextEncoder().encode(content)

      // --- Classical sign ---
      const mechType = CLASSICAL_MECH[classicalAlgo][hashAlgo]
      let classicalSig: Uint8Array
      if (classicalAlgo.startsWith('RSA')) {
        classicalSig = hsm_rsaSign(
          M,
          hSession,
          classicalKeyRef.current.privHandle,
          content,
          mechType
        )
      } else {
        classicalSig = hsm_ecdsaSign(
          M,
          hSession,
          classicalKeyRef.current.privHandle,
          content,
          mechType
        )
      }
      classicalSigBytesRef.current = classicalSig
      setClassicalSigHex(toHex(classicalSig))
      setClassicalSigSize(classicalSig.length)

      // Build classical CMS SignedData
      const classicalSigAlgOid = classicalAlgo.startsWith('RSA')
        ? OID_RSA_SHA[hashAlgo]
        : OID_ECDSA_SHA[hashAlgo]
      const classicalCms = buildCmsSignedData({
        sigAlgOid: classicalSigAlgOid,
        digestAlgOid: OID_SHA[hashAlgo],
        isPqc: false,
        content: contentBytes,
        sigBytes: classicalSig,
        signerLabel: classicalAlgo,
      })
      setClassicalCmsDer(classicalCms)

      // --- PQC sign (pure mode — RFC 9882 §3.1 / RFC 9814 §1.2) ---
      let pqcSig: Uint8Array
      if (pqcAlgo === 'SLH-DSA-SHA2-128S') {
        pqcSig = hsm_slhdsaSign(M, hSession, pqcKeyRef.current.privHandle, content)
      } else {
        pqcSig = hsm_sign(M, hSession, pqcKeyRef.current.privHandle, content)
      }
      pqcSigBytesRef.current = pqcSig
      setPqcSigHex(toHex(pqcSig))
      setPqcSigSize(pqcSig.length)

      // Build PQC CMS SignedData
      const pqcSigAlgOid =
        pqcAlgo === 'SLH-DSA-SHA2-128S' ? OID_SLH_DSA_SHA2_128S : OID_ML_DSA[pqcAlgo]
      // Per RFC 9882/9814: digestAlgorithm in SignerInfo should be sha256 (matches hash used for messageDigest)
      const pqcCms = buildCmsSignedData({
        sigAlgOid: pqcSigAlgOid,
        digestAlgOid: OID_SHA[hashAlgo],
        isPqc: true,
        content: contentBytes,
        sigBytes: pqcSig,
        signerLabel: pqcAlgo,
      })
      setPqcCmsDer(pqcCms)
    } catch (err) {
      console.error('[FirmwareSigningMigrator] sign error:', err)
      setSignError(`Sign failed: ${err instanceof Error ? err.message : String(err)}`)
    }
    setIsProcessing(false)
  }, [hsm, classicalAlgo, pqcAlgo, hashAlgo, fileBytes])

  // ---------------------------------------------------------------------------
  // Verification
  // ---------------------------------------------------------------------------

  const handleVerifyBoth = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current) return
    if (!classicalSigBytesRef.current || !pqcSigBytesRef.current) return
    setIsProcessing(true)
    try {
      const M = hsm.moduleRef.current as unknown as SoftHSMModule
      const hSession = hsm.hSessionRef.current
      const content = buildManifestString(fileBytes)

      // Classical verify
      const mechType = CLASSICAL_MECH[classicalAlgo][hashAlgo]
      let cvResult: boolean
      if (classicalAlgo.startsWith('RSA')) {
        cvResult = hsm_rsaVerify(
          M,
          hSession,
          classicalKeyRef.current.pubHandle,
          content,
          classicalSigBytesRef.current,
          mechType
        )
      } else {
        cvResult = hsm_ecdsaVerify(
          M,
          hSession,
          classicalKeyRef.current.pubHandle,
          content,
          classicalSigBytesRef.current,
          mechType
        )
      }
      setClassicalVerified(cvResult)

      // PQC verify (pure mode)
      let pvResult: boolean
      if (pqcAlgo === 'SLH-DSA-SHA2-128S') {
        pvResult = hsm_slhdsaVerify(
          M,
          hSession,
          pqcKeyRef.current.pubHandle,
          content,
          pqcSigBytesRef.current
        )
      } else {
        pvResult = hsm_verify(
          M,
          hSession,
          pqcKeyRef.current.pubHandle,
          content,
          pqcSigBytesRef.current
        )
      }
      setPqcVerified(pvResult)
    } catch (err) {
      console.error('[FirmwareSigningMigrator] verify error:', err)
    }
    setIsProcessing(false)
  }, [hsm, classicalAlgo, pqcAlgo, hashAlgo, fileBytes])

  const handleNext = useCallback(async () => {
    if (isLive) {
      if (currentStep === 1 && !keysGenerated) await handleGenerateBothKeys()
      if (currentStep === 2 && !signaturesReady) await handleSignBoth()
      if (currentStep === 3 && pqcVerified === null) await handleVerifyBoth()
    }
    markComplete(currentStep)
    if (currentStep < 3) setCurrentStep((currentStep + 1) as WizardStep)
  }, [
    currentStep,
    isLive,
    keysGenerated,
    signaturesReady,
    pqcVerified,
    handleGenerateBothKeys,
    handleSignBoth,
    handleVerifyBoth,
  ])

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((currentStep - 1) as WizardStep)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setPqcKeysReady(false)
    setClassicalKeysReady(false)
    setPqcPubKeyBytes(0)
    setClassicalPubKeyBytes(0)
    setPqcSigHex('')
    setPqcSigSize(0)
    setClassicalSigHex('')
    setClassicalSigSize(0)
    setPqcVerified(null)
    setClassicalVerified(null)
    setPqcCmsDer(null)
    setClassicalCmsDer(null)
    pqcSigBytesRef.current = null
    classicalSigBytesRef.current = null
    pqcKeyRef.current = { pubHandle: 0, privHandle: 0 }
    classicalKeyRef.current = { pubHandle: 0, privHandle: 0 }
    setUploadedFile(null)
    setFileBytes(null)
    setFileDigestHex('')
    hsm.clearLog()
    hsm.clearKeys()
  }

  // Derived display values (fall back to expected sizes when not live)
  const pqcPubDisplay =
    pqcPubKeyBytes ||
    (pqcAlgo === 'SLH-DSA-SHA2-128S' ? SLHDSA_PUBKEY_BYTES : MLDSA_PUBKEY_BYTES[pqcAlgo])
  const pqcPrivDisplay =
    pqcAlgo === 'SLH-DSA-SHA2-128S' ? SLHDSA_PRIVKEY_BYTES : MLDSA_PRIVKEY_BYTES[pqcAlgo]
  const classicalPubDisplay = classicalPubKeyBytes || CLASSICAL_PUBKEY_BYTES[classicalAlgo]
  const classicalPrivDisplay = CLASSICAL_PRIVKEY_BYTES[classicalAlgo]
  const pqcExpectedSig =
    pqcAlgo === 'SLH-DSA-SHA2-128S' ? SLHDSA_SIG_BYTES : MLDSA_SIG_BYTES[pqcAlgo]
  const classicalExpectedSig = CLASSICAL_SIG_BYTES[classicalAlgo]

  const displayPqcSig = pqcSigSize || pqcExpectedSig
  const displayClassicalSig = classicalSigSize || classicalExpectedSig
  const sigRatio = (displayPqcSig / Math.max(displayClassicalSig, 1)).toFixed(1)

  // Content string being signed (computed inline for display)
  const contentToSign = buildManifestString(fileBytes)

  // PKCS#11 mechanism name for display
  const classicalMechName = classicalAlgo.startsWith('RSA')
    ? hashAlgo === 'SHA-256'
      ? 'CKM_SHA256_RSA_PKCS'
      : hashAlgo === 'SHA-384'
        ? 'CKM_SHA384_RSA_PKCS'
        : 'CKM_SHA512_RSA_PKCS'
    : hashAlgo === 'SHA-256'
      ? 'CKM_ECDSA_SHA256'
      : hashAlgo === 'SHA-384'
        ? 'CKM_ECDSA_SHA384'
        : 'CKM_ECDSA_SHA512'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Firmware Signing Migrator</h3>
        <p className="text-sm text-muted-foreground">
          Sign firmware with both a classical algorithm and a post-quantum algorithm side-by-side.
          Compare keys, signatures, and CMS output. All PKCS#11 operations execute in SoftHSM3 WASM.
        </p>
      </div>

      {/* Live HSM Toggle */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      {/* Step Progress */}
      <div className="overflow-x-auto px-1">
        <div className="flex justify-between relative min-w-max sm:min-w-0">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
          {STEP_TITLES.map((title, idx) => {
            const StepIcon = STEP_ICONS[idx]
            const isDone = completedSteps.has(idx)
            const isActive = idx === currentStep
            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx as WizardStep)}
                className={`flex flex-col items-center gap-2 px-2 group ${isActive ? 'text-primary' : isDone ? 'text-status-success' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${isActive ? 'border-primary text-primary' : isDone ? 'border-status-success text-status-success' : 'border-border text-muted-foreground'}`}
                >
                  <StepIcon size={18} />
                </div>
                <span className="text-[10px] font-medium hidden md:block text-center max-w-[80px] leading-tight">
                  {title.split(':')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-panel p-4 sm:p-6 min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-foreground">{STEP_TITLES[currentStep]}</h4>
        </div>

        {/* ── Step 0: Upload & Configure ── */}
        {currentStep === 0 && (
          <div className="space-y-5">
            {/* Standard refs */}
            <div className="flex flex-wrap gap-1.5">
              <LibRef id="FIPS 204" label="FIPS 204" />
              <LibRef id="FIPS 205" label="FIPS 205" />
              <LibRef id="FIPS 186-5" label="FIPS 186-5" />
              <LibRef id="FIPS-180-4" label="FIPS 180-4" />
              <LibRef id="UEFI-SPEC-2.10-SecureBoot" label="UEFI 2.10" />
            </div>

            {/* Explanation */}
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-xs space-y-1">
              <p className="font-semibold text-foreground">Why firmware signing matters</p>
              <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>
                  UEFI Secure Boot verifies every firmware image against signed db certificates at
                  boot
                </li>
                <li>
                  TPM PCR measurements attest firmware integrity — signatures must survive quantum
                  attacks
                </li>
                <li>
                  Supply chain compromise via forged signatures is a critical threat — PQC
                  eliminates Shor&apos;s algorithm risk
                </li>
              </ul>
            </div>

            {/* Pure mode callout */}
            <div className="bg-muted/60 rounded-lg p-3 border border-border text-xs space-y-1">
              <div className="flex items-center gap-2">
                <Info size={13} className="text-primary shrink-0" aria-hidden="true" />
                <span className="font-semibold text-foreground">
                  Signing mode: Pure &nbsp;
                  <span className="font-normal text-muted-foreground">
                    [Standard per <span className="font-mono">RFC 9882 §3.1</span> &amp;{' '}
                    <span className="font-mono">RFC 9814 §1.2</span>]
                  </span>
                </span>
              </div>
              <p className="text-muted-foreground pl-5">
                ML-DSA and SLH-DSA use SHAKE-256 internally — no caller pre-hashing needed.
                HashML-DSA (pre-hash) is <strong>explicitly excluded</strong> from CMS and X.509
                (RFC 9882, RFC 9881). Your hash selection applies to: firmware digest display +
                classical signature mechanism (e.g. CKM_SHA256_RSA_PKCS).
              </p>
            </div>

            {/* File upload zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop firmware binary or click to browse"
              className={`rounded-lg border-2 border-dashed p-5 flex flex-col items-center gap-3 cursor-pointer transition-colors
                ${isDragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              {uploadedFile ? (
                <div className="text-center space-y-1">
                  <div className="flex items-center gap-2 justify-center text-status-success">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                  {fileDigestHex && (
                    <p className="text-[10px] font-mono text-muted-foreground break-all">
                      SHA-256: {truncateHex(fileDigestHex, 48)}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-muted-foreground" aria-hidden="true" />
                  <div className="text-center">
                    <p className="text-sm text-foreground font-medium">Drop firmware binary here</p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse — any file format
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Mock manifest fallback */}
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                {uploadedFile
                  ? '▸ Mock UEFI manifest (not used)'
                  : '▸ Using mock UEFI firmware manifest (no file uploaded)'}
              </summary>
              <div className="mt-2 bg-muted/50 rounded-lg p-4 border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">Firmware: </span>
                    <span className="font-mono">{MOCK_MANIFEST.firmwareName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version: </span>
                    <span className="font-mono">{MOCK_MANIFEST.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor: </span>
                    <span>{MOCK_MANIFEST.vendor}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Platform: </span>
                    <span>{MOCK_MANIFEST.platform}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={13} className="text-status-error" aria-hidden="true" />
                    <span className="text-xs font-bold text-status-error">
                      Current signing: RSA-2048 (quantum-vulnerable)
                    </span>
                  </div>
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 text-muted-foreground font-medium">
                          Component
                        </th>
                        <th className="text-right py-1 text-muted-foreground font-medium">Size</th>
                        <th className="text-right py-1 text-muted-foreground font-medium">Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_MANIFEST.components.map((c) => (
                        <tr key={c.name} className="border-b border-border/50">
                          <td className="py-1 text-foreground">{c.name}</td>
                          <td className="py-1 text-right font-mono text-muted-foreground">
                            {c.size}
                          </td>
                          <td className="py-1 text-right font-mono text-muted-foreground truncate max-w-[100px]">
                            {c.hash}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            {/* Algorithm selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">PQC Algorithm</p>
                <FilterDropdown
                  items={PQC_ALGO_OPTIONS}
                  selectedId={pqcAlgo}
                  onSelect={(id) => setPqcAlgo(id as PqcAlgo)}
                  label={pqcAlgo}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Classical Algorithm</p>
                <FilterDropdown
                  items={CLASSICAL_ALGO_OPTIONS}
                  selectedId={classicalAlgo}
                  onSelect={(id) => setClassicalAlgo(id as ClassicalAlgo)}
                  label={classicalAlgo}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Hash Algorithm</p>
                <FilterDropdown
                  items={HASH_ALGO_OPTIONS}
                  selectedId={hashAlgo}
                  onSelect={(id) => setHashAlgo(id as HashAlgo)}
                  label={hashAlgo}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="text-status-warning font-medium">Note:</span> Hash applies to
              classical signing mechanism (
              {hashAlgo === 'SHA-256'
                ? 'CKM_SHA256_RSA_PKCS'
                : hashAlgo === 'SHA-384'
                  ? 'CKM_SHA384_RSA_PKCS'
                  : 'CKM_SHA512_RSA_PKCS'}
              ) and digest display. PQC algorithms ({pqcAlgo}) use SHAKE-256 internally — pure mode
              per RFC 9882/9814.
            </p>
          </div>
        )}

        {/* ── Step 1: Generate Keys ── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            {/* Standard refs */}
            <div className="flex flex-wrap gap-1.5">
              <LibRef id="FIPS 204" label="FIPS 204" />
              <LibRef id="FIPS 205" label="FIPS 205" />
              <LibRef id="FIPS 186-5" label="FIPS 186-5" />
              <LibRef id="PKCS11-V32-OASIS" label="PKCS#11 v3.2" />
            </div>

            {isLive && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerateBothKeys}
                  disabled={isProcessing}
                  variant="outline"
                  className="text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Key size={14} className="mr-1.5" />
                      Generate Both Keys
                    </>
                  )}
                </Button>
                {keysGenerated && (
                  <span className="text-[11px] text-status-success font-semibold">
                    ✓ {classicalAlgo} + {pqcAlgo} keys generated via C_GenerateKeyPair
                  </span>
                )}
              </div>
            )}

            {/* Side-by-side key comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Classical */}
              <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
                <div className="text-xs font-bold text-status-error mb-3">
                  Classical — {classicalAlgo}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="font-mono text-status-error">{classicalAlgo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Public key:</span>
                    <span className="font-mono">{classicalPubDisplay.toLocaleString()} B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Private key:</span>
                    <span className="font-mono">{classicalPrivDisplay.toLocaleString()} B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantum-safe:</span>
                    <span className="text-status-error font-bold">No</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard:</span>
                    <span className="font-mono">FIPS 186-5</span>
                  </div>
                </div>
              </div>

              {/* PQC */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="text-xs font-bold text-primary mb-3">PQC — {pqcAlgo}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="font-mono text-primary">{pqcAlgo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Public key:</span>
                    <span className="font-mono text-primary">
                      {pqcPubDisplay.toLocaleString()} B
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Private key:</span>
                    <span className="font-mono text-primary">
                      {pqcPrivDisplay.toLocaleString()} B
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantum-safe:</span>
                    <span className="text-status-success font-bold">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NIST level:</span>
                    <span className="font-mono text-primary">
                      {pqcAlgo === 'SLH-DSA-SHA2-128S' ? 'NIST Level 1' : MLDSA_NIST_LEVEL[pqcAlgo]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Standard:</span>
                    <span className="font-mono">
                      {pqcAlgo.startsWith('ML-DSA') ? 'FIPS 204' : 'FIPS 205'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key size callout */}
            <div className="bg-muted/40 rounded-lg p-3 border border-border text-xs">
              <p className="font-semibold text-foreground mb-1">
                Key size impact on UEFI Secure Boot db
              </p>
              <p className="text-muted-foreground">
                Each UEFI db entry stores an EFI_CERT_X509 containing the full public key.
                {pqcAlgo === 'SLH-DSA-SHA2-128S'
                  ? ` SLH-DSA-SHA2-128S has the smallest PQC public key (${SLHDSA_PUBKEY_BYTES} B) but the largest signature (${SLHDSA_SIG_BYTES.toLocaleString()} B).`
                  : ` ML-DSA-65 public key is ${(MLDSA_PUBKEY_BYTES['ML-DSA-65'] / CLASSICAL_PUBKEY_BYTES['RSA-2048']).toFixed(1)}× larger than RSA-2048 (${MLDSA_PUBKEY_BYTES['ML-DSA-65'].toLocaleString()} B vs ${CLASSICAL_PUBKEY_BYTES['RSA-2048']} B).`}{' '}
                UEFI db partition is typically 64–128 KB — plan capacity accordingly.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Sign Firmware ── */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* Standard refs */}
            <div className="flex flex-wrap gap-1.5">
              <LibRef id="RFC 9882" label="RFC 9882" />
              <LibRef id="RFC 9814" label="RFC 9814" />
              <LibRef id="RFC 5652" label="RFC 5652" />
              <LibRef id="FIPS 204" label="FIPS 204" />
              <LibRef id="FIPS 205" label="FIPS 205" />
              <LibRef id="FIPS 186-5" label="FIPS 186-5" />
            </div>

            {isLive && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSignBoth}
                    disabled={isProcessing || !keysGenerated}
                    variant="outline"
                    className="text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-1.5" />
                        Signing…
                      </>
                    ) : (
                      'Sign Both (Classical + PQC)'
                    )}
                  </Button>
                  {signaturesReady && (
                    <span className="text-[11px] text-status-success font-semibold">
                      ✓ Both signatures produced + CMS envelopes built
                    </span>
                  )}
                </div>
                {signError && (
                  <div className="flex items-center gap-2 text-xs text-status-error bg-status-error/5 border border-status-error/20 rounded px-3 py-2">
                    <AlertTriangle size={13} className="shrink-0" aria-hidden="true" />
                    {signError}
                  </div>
                )}
              </div>
            )}

            {/* Data-to-sign: content + PKCS#11 mechanism formatting per standard */}
            <div className="bg-muted/40 rounded-lg p-3 border border-border text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info size={12} className="text-primary shrink-0" aria-hidden="true" />
                Data to sign — PKCS#11 input formatting per standard
              </div>
              <div className="space-y-1">
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-20">Content:</span>
                  <span className="font-mono text-foreground break-all text-[10px]">
                    {contentToSign.length > 90 ? `${contentToSign.slice(0, 90)}…` : contentToSign}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50">
                {/* Classical formatting */}
                <div className="space-y-0.5">
                  <div className="text-[10px] font-semibold text-status-error">{classicalAlgo}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Mechanism:{' '}
                    <span className="font-mono text-foreground">{classicalMechName}</span>
                  </div>
                  {classicalAlgo.startsWith('RSA') ? (
                    <div className="text-[10px] text-muted-foreground">
                      Flow: <span className="font-mono">SHA-{hashAlgo.split('-')[1]}(msg)</span> →{' '}
                      <span className="font-mono">DigestInfo</span> → RSA-sign
                      <span className="ml-1 text-[9px]">(PKCS#1 v1.5, RFC 8017 §9.2)</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground">
                      Flow: <span className="font-mono">SHA-{hashAlgo.split('-')[1]}(msg)</span> →
                      ECDSA-sign → <span className="font-mono">DER(r, s)</span>
                      <span className="ml-1 text-[9px]">(ANSI X9.62, FIPS 186-5)</span>
                    </div>
                  )}
                </div>
                {/* PQC formatting */}
                <div className="space-y-0.5">
                  <div className="text-[10px] font-semibold text-primary">{pqcAlgo}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Mechanism:{' '}
                    <span className="font-mono text-foreground">C_SignMessage (pure)</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Flow: raw msg →{' '}
                    <span className="font-mono">
                      {pqcAlgo.startsWith('ML-DSA') ? 'SHAKE-256' : 'SHA2/SHAKE'} internal
                    </span>
                    <span className="ml-1 text-[9px]">
                      (no pre-hash,{' '}
                      {pqcAlgo.startsWith('ML-DSA') ? 'RFC 9882 §3.1' : 'RFC 9814 §1.2'})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Classical */}
              <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20 space-y-2">
                <div className="text-xs font-bold text-status-error">
                  {classicalAlgo} — {hashAlgo}
                </div>
                <div className="text-lg font-bold text-status-error text-center py-1">
                  {displayClassicalSig.toLocaleString()} B
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Signature bytes (hex):
                  </span>
                  <pre className="text-[9px] font-mono text-muted-foreground bg-background rounded p-1.5 border border-border break-all whitespace-pre-wrap min-h-[36px]">
                    {classicalSigHex
                      ? truncateHex(classicalSigHex, 160)
                      : isLive
                        ? '— click Sign Both to generate —'
                        : '— waiting for simulation —'}
                  </pre>
                </div>
                <p className="text-[10px] text-muted-foreground">Quantum-vulnerable · FIPS 186-5</p>
              </div>

              {/* PQC */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-2">
                <div className="text-xs font-bold text-primary">
                  {pqcAlgo} — Pure mode
                  <span className="ml-1 text-[9px] font-normal text-muted-foreground">
                    ({pqcAlgo.startsWith('ML-DSA') ? 'RFC 9882 §3.1' : 'RFC 9814 §1.2'})
                  </span>
                </div>
                <div className="text-lg font-bold text-primary text-center py-1">
                  {displayPqcSig.toLocaleString()} B
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Signature bytes (hex):
                  </span>
                  <pre className="text-[9px] font-mono text-primary bg-background rounded p-1.5 border border-primary/20 break-all whitespace-pre-wrap min-h-[36px]">
                    {pqcSigHex
                      ? truncateHex(pqcSigHex, 160)
                      : isLive
                        ? '— click Sign Both to generate —'
                        : '— waiting for simulation —'}
                  </pre>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Quantum-safe · {pqcAlgo.startsWith('ML-DSA') ? 'FIPS 204' : 'FIPS 205'}
                </p>
              </div>
            </div>

            {/* Size ratio */}
            <div className="text-center">
              <span className="text-sm font-bold text-status-warning">{sigRatio}×</span>
              <span className="text-xs text-muted-foreground ml-1">
                larger PQC signature — {displayPqcSig.toLocaleString()} B vs{' '}
                {displayClassicalSig.toLocaleString()} B
              </span>
            </div>

            {/* CMS SignedData output */}
            {(classicalCmsDer || pqcCmsDer) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={13} className="text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">
                    CMS SignedData output (RFC 5652) — pure mode, no pre-hash
                  </p>
                </div>
                {classicalCmsDer && (
                  <div className="bg-muted/40 rounded p-3 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-status-error">
                        {classicalAlgo} · {classicalCmsDer.length.toLocaleString()} bytes DER
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={() => downloadBlob(classicalCmsDer, 'classical-signed.p7s')}
                      >
                        <Download size={10} /> classical-signed.p7s
                      </Button>
                    </div>
                    <pre className="text-[9px] font-mono text-muted-foreground break-all whitespace-pre-wrap">
                      {truncateHex(toHex(classicalCmsDer), 120)}
                    </pre>
                  </div>
                )}
                {pqcCmsDer && (
                  <div className="bg-primary/5 rounded p-3 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-primary">
                        {pqcAlgo} · {pqcCmsDer.length.toLocaleString()} bytes DER
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={() => downloadBlob(pqcCmsDer, 'pqc-signed.p7s')}
                      >
                        <Download size={10} /> pqc-signed.p7s
                      </Button>
                    </div>
                    <pre className="text-[9px] font-mono text-primary break-all whitespace-pre-wrap">
                      {truncateHex(toHex(pqcCmsDer), 120)}
                    </pre>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  ContentInfo → SignedData (RFC 5652) · Pure ML-DSA/SLH-DSA mandated by RFC
                  9882/9814 · In production: add X.509 certificate to certificates field
                </p>
              </div>
            )}

            {/* Explanation */}
            <div className="bg-muted/40 rounded-lg p-3 border border-border text-xs">
              <p className="font-semibold text-foreground mb-1">Signature size impacts</p>
              <p className="text-muted-foreground">
                UEFI Authenticated Variable storage (NVRAM) has tight limits — each db entry stores
                a full .p7s envelope. OTA firmware update packages carry the signature in their
                manifest.
                {pqcAlgo === 'SLH-DSA-SHA2-128S'
                  ? ' SLH-DSA-SHA2-128S has very large signatures (7,856 B) — suitable for low-frequency root key signing, not per-image signing.'
                  : ` ML-DSA signatures are large but acceptable for UEFI db (NVRAM partition is typically 64–128 KB).`}
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Verify & Compare ── */}
        {currentStep === 3 && (
          <div className="space-y-5">
            {/* Standard refs */}
            <div className="flex flex-wrap gap-1.5">
              <LibRef id="RFC 5652" label="RFC 5652" />
              <LibRef id="FIPS 204" label="FIPS 204" />
              <LibRef id="FIPS 205" label="FIPS 205" />
              <LibRef id="NSA CNSA 2.0" label="NSA CNSA 2.0" />
              <LibRef id="RFC 9019" label="RFC 9019 (SUIT)" />
            </div>

            {isLive && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleVerifyBoth}
                  disabled={isProcessing || !signaturesReady}
                  variant="outline"
                  className="text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                      Verifying…
                    </>
                  ) : (
                    'Verify Both Signatures'
                  )}
                </Button>
              </div>
            )}

            {/* Verification results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Classical */}
              <div
                className={`rounded-lg p-4 border-2 space-y-2 ${classicalVerified === null ? 'border-border bg-muted/30' : classicalVerified ? 'border-status-success/40 bg-status-success/5' : 'border-status-error/40 bg-status-error/5'}`}
              >
                <div className="flex items-center gap-2">
                  {classicalVerified === null ? (
                    <Key size={16} className="text-muted-foreground" aria-hidden="true" />
                  ) : classicalVerified ? (
                    <CheckCircle size={16} className="text-status-success" aria-label="Verified" />
                  ) : (
                    <AlertTriangle size={16} className="text-status-error" aria-label="Failed" />
                  )}
                  <span className="text-xs font-bold text-foreground">{classicalAlgo}</span>
                </div>
                {classicalVerified !== null && (
                  <p
                    className={`text-xs font-semibold ${classicalVerified ? 'text-status-success' : 'text-status-error'}`}
                  >
                    {classicalVerified ? 'VERIFIED' : 'FAILED'}
                  </p>
                )}
                {classicalSigHex && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Signature (hex):
                    </span>
                    <pre className="text-[9px] font-mono text-muted-foreground bg-background rounded p-1.5 border border-border break-all whitespace-pre-wrap">
                      {truncateHex(classicalSigHex, 160)}
                    </pre>
                    <span className="text-[10px] text-muted-foreground">
                      {classicalSigSize.toLocaleString()} bytes · {classicalMechName}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">Quantum-vulnerable · FIPS 186-5</p>
              </div>

              {/* PQC */}
              <div
                className={`rounded-lg p-4 border-2 space-y-2 ${pqcVerified === null ? 'border-border bg-muted/30' : pqcVerified ? 'border-status-success/40 bg-status-success/5' : 'border-status-error/40 bg-status-error/5'}`}
              >
                <div className="flex items-center gap-2">
                  {pqcVerified === null ? (
                    <Key size={16} className="text-muted-foreground" aria-hidden="true" />
                  ) : pqcVerified ? (
                    <CheckCircle size={16} className="text-status-success" aria-label="Verified" />
                  ) : (
                    <AlertTriangle size={16} className="text-status-error" aria-label="Failed" />
                  )}
                  <span className="text-xs font-bold text-foreground">{pqcAlgo}</span>
                </div>
                {pqcVerified !== null && (
                  <p
                    className={`text-xs font-semibold ${pqcVerified ? 'text-status-success' : 'text-status-error'}`}
                  >
                    {pqcVerified ? 'VERIFIED' : 'FAILED'}
                  </p>
                )}
                {pqcSigHex && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Signature (hex):
                    </span>
                    <pre className="text-[9px] font-mono text-primary bg-background rounded p-1.5 border border-primary/20 break-all whitespace-pre-wrap">
                      {truncateHex(pqcSigHex, 160)}
                    </pre>
                    <span className="text-[10px] text-muted-foreground">
                      {pqcSigSize.toLocaleString()} bytes · pure mode ·{' '}
                      {pqcAlgo.startsWith('ML-DSA') ? 'RFC 9882 §3.1' : 'RFC 9814 §1.2'}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Quantum-safe · {pqcAlgo.startsWith('ML-DSA') ? 'FIPS 204' : 'FIPS 205'} · Pure
                  mode
                </p>
              </div>
            </div>

            {/* Full comparison table */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-primary" aria-hidden="true" />
                <span className="text-xs font-bold text-foreground">
                  Migration Comparison: {classicalAlgo} → {pqcAlgo}
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 text-muted-foreground font-medium">Metric</th>
                    <th className="text-right py-1.5 text-status-error font-medium">
                      {classicalAlgo}
                    </th>
                    <th className="text-right py-1.5 text-primary font-medium">{pqcAlgo}</th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      metric: 'Public key',
                      classical: `${classicalPubDisplay.toLocaleString()} B`,
                      pqc: `${pqcPubDisplay.toLocaleString()} B`,
                      change: `${(pqcPubDisplay / classicalPubDisplay).toFixed(1)}×`,
                    },
                    {
                      metric: 'Private key',
                      classical: `${classicalPrivDisplay.toLocaleString()} B`,
                      pqc: `${pqcPrivDisplay.toLocaleString()} B`,
                      change: `${(pqcPrivDisplay / classicalPrivDisplay).toFixed(1)}×`,
                    },
                    {
                      metric: 'Signature',
                      classical: `${displayClassicalSig.toLocaleString()} B`,
                      pqc: `${displayPqcSig.toLocaleString()} B`,
                      change: `${sigRatio}×`,
                    },
                    {
                      metric: 'Hash (digest)',
                      classical: hashAlgo,
                      pqc: 'SHAKE-256 (internal)',
                      change: '—',
                    },
                    {
                      metric: 'Signing mode',
                      classical: `Hash+Sign (${hashAlgo})`,
                      pqc: 'Pure (RFC 9882/9814)',
                      change: '✓',
                    },
                    {
                      metric: 'Quantum-safe',
                      classical: 'No',
                      pqc: 'Yes',
                      change: '✓',
                    },
                    {
                      metric: 'NIST level',
                      classical: '~112-bit classical',
                      pqc:
                        pqcAlgo === 'SLH-DSA-SHA2-128S'
                          ? 'NIST Level 1'
                          : MLDSA_NIST_LEVEL[pqcAlgo],
                      change: '↑',
                    },
                    {
                      metric: 'Standard',
                      classical: 'FIPS 186-5',
                      pqc: pqcAlgo.startsWith('ML-DSA') ? 'FIPS 204' : 'FIPS 205',
                      change: '—',
                    },
                    {
                      metric: 'CMS spec',
                      classical: 'RFC 5652',
                      pqc: pqcAlgo.startsWith('ML-DSA') ? 'RFC 9882' : 'RFC 9814',
                      change: '—',
                    },
                  ].map((row) => (
                    <tr key={row.metric} className="border-b border-border/50">
                      <td className="py-1.5 text-foreground">{row.metric}</td>
                      <td className="py-1.5 text-right font-mono text-status-error">
                        {row.classical}
                      </td>
                      <td className="py-1.5 text-right font-mono text-primary">{row.pqc}</td>
                      <td className="py-1.5 text-right font-bold text-status-warning">
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NSA CNSA 2.0 callout */}
            <div className="bg-muted/40 rounded-lg p-3 border border-border text-xs flex gap-2">
              <Info size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">NSA CNSA 2.0</strong> mandates ML-DSA-87 for US
                government firmware signing by 2030.{' '}
                <a
                  href="/library?ref=NSA CNSA 2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  → View requirements
                </a>{' '}
                · RFC 9019 (SUIT) defines firmware update manifest format for IoT devices using the
                same CMS signatures.
              </p>
            </div>

            {/* Migration impact */}
            <div className="bg-muted/40 rounded-lg p-3 border border-border text-xs">
              <p className="font-semibold text-foreground mb-1">Migration pipeline impact</p>
              <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>UEFI db entries must store larger X.509 certificates with PQC public keys</li>
                <li>OTA update packages will carry larger .p7s signature envelopes</li>
                <li>Legacy firmware images need re-signing with new PQC keys</li>
                <li>
                  HSM provisioning tooling must support CKM_ML_DSA_KEY_PAIR_GEN and
                  CKM_SLH_DSA_KEY_PAIR_GEN
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              &larr; Back
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={isProcessing}
              variant="gradient"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  Next <ArrowRight size={14} />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => markComplete(3)}
              variant="gradient"
              className="flex items-center gap-2"
            >
              <CheckCircle size={14} />
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong>{' '}
          {isLive
            ? 'All cryptographic operations execute in SoftHSM3 WASM (PKCS#11 v3.2). Key and signature sizes match FIPS 204/205 exactly. CMS SignedData uses pure mode per RFC 9882/9814.'
            : 'Simulation mode active. Algorithm selection, comparison table, and CMS structure are always shown.'}{' '}
          Generated keys are for educational purposes only.
        </p>
      </div>

      <KatValidationPanel
        specs={SECBOOT_KAT_SPECS}
        label="Secure Boot PQC Known Answer Tests"
        authorityNote="UEFI 2.10 · TPM 2.0 · FIPS 204 · FIPS 205 · FIPS 180-4"
      />

      {/* PKCS#11 Call Log & Key Inspector */}
      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log"
            defaultOpen={true}
            filterFns={LIVE_OPERATIONS}
          />
          {hsm.keys.length > 0 && (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={hsm.removeKey}
              title="Generated Keys — PKCS#11 Objects"
            />
          )}
        </div>
      )}
    </div>
  )
}
