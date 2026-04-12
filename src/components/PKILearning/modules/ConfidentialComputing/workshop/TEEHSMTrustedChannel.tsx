// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Lock,
  Key,
  Server,
  Cpu,
  Loader2,
  AppWindow,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  TEE_HSM_INTEGRATIONS,
  QUANTUM_THREAT_VECTORS,
  MEMORY_ENCRYPTION_ENGINES,
} from '../data/attestationData'
import { TEE_ARCHITECTURES } from '../data/teeArchitectureData'
import type { TEEVendor } from '../data/ccConstants'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import type { HsmKeyPurpose } from '@/components/Playground/hsm/HsmContext'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_generateAESKey,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_aesWrapKey,
  hsm_unwrapKeyMech,
  hsm_sign,
  hsm_verify,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_extractKeyValue,
  hsm_generateECKeyPair,
  hsm_importGenericSecret,
  hsm_hkdf,
  hsm_importAESKey,
  CKM_SHA256,
  CKM_AES_KEY_WRAP,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKO_SECRET_KEY,
  CKK_AES,
  CKA_TOKEN,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  type AttrDef,
} from '@/wasm/softhsm'

const TEE_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  'C_WrapKey',
  'C_UnwrapKey',
  'C_DeriveKey',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_MessageVerifyInit',
  'C_VerifyMessage',
  'C_GenerateKey',
  'C_CreateObject',
]

/** Unwrap template for the recovered AES-256 provisioning key.
 *  NOTE: CKA_VALUE_LEN must NOT be included — length is derived from the unwrapped bytes. */
const AES_UNWRAP_TEMPLATE: AttrDef[] = [
  { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
  { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
  { type: CKA_TOKEN, boolVal: false },
  { type: CKA_ENCRYPT, boolVal: true },
  { type: CKA_DECRYPT, boolVal: true },
]

interface ProvisioningResult {
  step: number
  purpose: HsmKeyPurpose
  title: string
  pkcs11Call: string
  detail: string
  note: string
}

const PURPOSE_ICON: Record<HsmKeyPurpose, React.ReactNode> = {
  attestation: <ShieldCheck size={12} className="text-status-warning shrink-0" />,
  tls: <Globe size={12} className="text-status-info shrink-0" />,
  kek: <Key size={12} className="text-status-success shrink-0" />,
  application: <AppWindow size={12} className="text-primary shrink-0" />,
  general: <Key size={12} className="text-muted-foreground shrink-0" />,
}

const PURPOSE_LABEL_CLASS: Record<HsmKeyPurpose, string> = {
  attestation: 'text-status-warning bg-status-warning/10',
  tls: 'text-status-info bg-status-info/10',
  kek: 'text-status-success bg-status-success/10',
  application: 'text-primary bg-primary/10',
  general: 'text-muted-foreground bg-muted',
}

const PURPOSE_DISPLAY: Record<HsmKeyPurpose, string> = {
  attestation: 'Attestation Key (AK)',
  tls: 'TLS / KEM Key',
  kek: 'Wrapping Key (KEK)',
  application: 'Application Key',
  general: 'General',
}

// ── Helpers ──────────────────────────────────────────────────────────────

const uniqueTeeVendors = Array.from(new Set(TEE_HSM_INTEGRATIONS.map((i) => i.teeVendor)))
const uniqueHsmVendors = Array.from(new Set(TEE_HSM_INTEGRATIONS.map((i) => i.hsmVendor)))

const teeVendorItems = uniqueTeeVendors.map((v) => {
  const arch = TEE_ARCHITECTURES.find((a) => a.id === v)
  return { id: v, label: arch?.name ?? v }
})

const hsmVendorItems = uniqueHsmVendors.map((v) => ({ id: v, label: v }))

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  pkcs11: 'PKCS#11',
  kmip: 'KMIP',
  'rest-api': 'REST API',
  proprietary: 'Proprietary',
}

const COMPLEXITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-status-success/20 text-status-success' },
  medium: { label: 'Medium', className: 'bg-status-warning/20 text-status-warning' },
  high: { label: 'High', className: 'bg-status-error/20 text-status-error' },
}

interface ProvisioningStep {
  title: string
  description: string
  whyItMatters: string
  crypto: string
  dataSize: string
}

function buildProvisioningSteps(
  integration: (typeof TEE_HSM_INTEGRATIONS)[number],
  pqcMode: boolean
): ProvisioningStep[] {
  const signingAlgo = pqcMode
    ? (integration.pqcSigningAlgo ?? 'Not available')
    : integration.currentSigningAlgo
  const kem = pqcMode ? (integration.pqcKEM ?? 'Not available') : integration.currentKEM

  return [
    {
      title: 'HSM generates keypair',
      description: `The HSM generates an asymmetric keypair using the configured algorithm and prepares it for export.`,
      whyItMatters: pqcMode
        ? 'Key generation inside the HSM ensures the private key never exists in plaintext outside tamper-resistant hardware. ML-DSA private keys are larger than classical keys — the HSM must support the PKCS#11 v3.2 ML-DSA mechanisms.'
        : "Key generation inside the HSM ensures the private key is protected by hardware tamper controls. If generated outside (e.g., in software), an OS-level attacker could extract it before it reaches the TEE. Shor's algorithm can later break ECDSA — plan migration to ML-DSA.",
      crypto: pqcMode
        ? `${integration.pqcSigningAlgo ?? 'ML-DSA-65'} keypair generation`
        : `${integration.currentSigningAlgo} keypair generation`,
      dataSize: pqcMode ? '~2.5 KB (ML-DSA public key)' : '~64 bytes (ECDSA public key)',
    },
    {
      title: 'TLS transport to enclave',
      description: `A TLS 1.3 channel is established between the HSM and the TEE using key exchange and mutual authentication.`,
      whyItMatters: pqcMode
        ? "ML-KEM replaces the ECDH key exchange vulnerable to Shor's algorithm. An adversary recording this TLS session today cannot retroactively decrypt it once a CRQC is available (harvest-now-decrypt-later is mitigated). Forward secrecy is preserved per TLS 1.3."
        : 'ECDH P-256 key exchange is quantum-vulnerable. An adversary recording this session can retroactively decrypt the wrapped key material when a cryptographically-relevant quantum computer (CRQC) is available — a harvest-now-decrypt-later (HNDL) attack.',
      crypto: `Key exchange: ${kem} | Auth: ${signingAlgo}`,
      dataSize: pqcMode
        ? '~1.5 KB (ML-KEM ciphertext + cert)'
        : '~200 bytes (ECDH ephemeral + cert)',
    },
    {
      title: 'Enclave receives wrapped key',
      description: `The wrapped private key material is transmitted over the established channel. The wrapping key is derived from the TLS session.`,
      whyItMatters:
        'Wrapping ensures the key is never in plaintext during transit — even if the TLS channel is compromised at the application layer. The wrapping key is derived from the session so only the intended receiver can unwrap it. Without this step, the key is exposed to any process that can intercept the TLS payload.',
      crypto: `AES-256-GCM key wrapping over ${kem} session`,
      dataSize: pqcMode
        ? '~4.5 KB (wrapped ML-DSA private key)'
        : '~100 bytes (wrapped ECDSA private key)',
    },
    {
      title: 'Enclave unseals with sealing key',
      description: `The enclave uses its hardware-derived sealing key to decrypt the wrapping layer and load the private key into protected memory.`,
      whyItMatters:
        'The sealing key is derived from the enclave identity (MRENCLAVE/MRSIGNER) and CPU secrets — it only exists inside the enclave and cannot be extracted. This ensures only the exact, unmodified enclave code can access the provisioned key. AES-128 sealing is Grover-halved to 64-bit post-quantum security; next-gen CPUs will require AES-256.',
      crypto: 'AES-256-GCM sealing (hardware-derived key via EGETKEY/ASP/RMM)',
      dataSize: pqcMode
        ? '~4.0 KB (unsealed ML-DSA private key)'
        : '~32 bytes (unsealed ECDSA private key)',
    },
  ]
}

// ── Component ────────────────────────────────────────────────────────────

export const TEEHSMTrustedChannel: React.FC = () => {
  const [selectedTeeVendor, setSelectedTeeVendor] = useState<string>('All')
  const [selectedHsmVendor, setSelectedHsmVendor] = useState<string>('All')
  const [pqcMode, setPqcMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Find matching integration
  const integration = useMemo(() => {
    if (selectedTeeVendor === 'All' || selectedHsmVendor === 'All') return null
    return (
      TEE_HSM_INTEGRATIONS.find(
        (i) => i.teeVendor === selectedTeeVendor && i.hsmVendor === selectedHsmVendor
      ) ?? null
    )
  }, [selectedTeeVendor, selectedHsmVendor])

  // TEE architecture for the selected vendor
  const teeArch = useMemo(() => {
    if (selectedTeeVendor === 'All') return null
    return TEE_ARCHITECTURES.find((a) => a.id === (selectedTeeVendor as TEEVendor)) ?? null
  }, [selectedTeeVendor])

  // Key provisioning steps
  const provisioningSteps = useMemo(() => {
    if (!integration) return []
    return buildProvisioningSteps(integration, pqcMode)
  }, [integration, pqcMode])

  const handleReset = () => {
    setCurrentStep(0)
  }

  // Live HSM demo — TEE-HSM key provisioning flow
  const hsm = useHSM()
  const [liveResults, setLiveResults] = useState<ProvisioningResult[]>([])
  const [liveRunning, setLiveRunning] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)

  const runLiveDemo = useCallback(async () => {
    if (!hsm.moduleRef.current) return
    setLiveRunning(true)
    setLiveResults([])
    setLiveError(null)
    hsm.clearLog()
    hsm.clearKeys()

    const now = () => new Date().toLocaleTimeString()
    const addResult = (r: ProvisioningResult) => setLiveResults((prev) => [...prev, r])

    try {
      const M = hsm.moduleRef.current
      const hSession = hsm.hSessionRef.current

      if (pqcMode) {
        // ── PQC flow ──────────────────────────────────────────────────────────

        // Step 1: Attestation key (ML-DSA-65)
        const dsaKeys = hsm_generateMLDSAKeyPair(M, hSession, 65)
        const dsaPubBytes = hsm_extractKeyValue(M, hSession, dsaKeys.pubHandle)
        hsm.addKey({
          handle: dsaKeys.pubHandle,
          family: 'ml-dsa',
          role: 'public',
          label: 'ML-DSA-65 Attestation Key (Public)',
          purpose: 'attestation',
          generatedAt: now(),
        })
        hsm.addKey({
          handle: dsaKeys.privHandle,
          family: 'ml-dsa',
          role: 'private',
          label: 'ML-DSA-65 Attestation Key (Private)',
          purpose: 'attestation',
          generatedAt: now(),
        })
        addResult({
          step: 1,
          purpose: 'attestation',
          title: 'Attestation Key Generated (ML-DSA-65)',
          pkcs11Call: 'C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN, CKP_ML_DSA_65)',
          detail: `pub = ${dsaPubBytes.length} B (1952 B) · priv = 4032 B`,
          note: 'Used to sign TEE attestation reports and authenticate to relying parties. The private key never leaves the HSM.',
        })

        // Step 2: TLS transport via ML-KEM-768
        const kemKeys = hsm_generateMLKEMKeyPair(M, hSession, 768)
        const kemPubBytes = hsm_extractKeyValue(M, hSession, kemKeys.pubHandle)
        hsm.addKey({
          handle: kemKeys.pubHandle,
          family: 'ml-kem',
          role: 'public',
          label: 'ML-KEM-768 TLS Transport Key (Public)',
          purpose: 'tls',
          generatedAt: now(),
        })
        hsm.addKey({
          handle: kemKeys.privHandle,
          family: 'ml-kem',
          role: 'private',
          label: 'ML-KEM-768 TLS Transport Key (Private)',
          purpose: 'tls',
          generatedAt: now(),
        })
        const { ciphertextBytes, secretHandle } = hsm_encapsulate(
          M,
          hSession,
          kemKeys.pubHandle,
          768
        )
        addResult({
          step: 2,
          purpose: 'tls',
          title: 'TLS Transport Key (ML-KEM-768) + Encapsulation',
          pkcs11Call: `C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN) → pub=${kemPubBytes.length} B\nC_EncapsulateKey(CKM_ML_KEM) → ct=${ciphertextBytes.length} B`,
          detail: `pub = ${kemPubBytes.length} B (1184 B) · ciphertext = ${ciphertextBytes.length} B · shared secret handle = 0x${secretHandle.toString(16)}`,
          note: 'ML-KEM replaces ECDH for the TLS 1.3 key exchange. The encapsulated shared secret is used to derive the session wrapping key.',
        })

        // Derive KEK from ML-KEM shared secret via HKDF-SHA256 (RFC 5869)
        const teeKekInfo = new TextEncoder().encode('tee-hsm-kek-v1')
        const sharedSecretBytes = hsm_extractKeyValue(M, hSession, secretHandle)
        const derivableHandle = hsm_importGenericSecret(M, hSession, sharedSecretBytes)
        const kekBytes = hsm_hkdf(
          M,
          hSession,
          derivableHandle,
          CKM_SHA256,
          true,
          true,
          undefined,
          teeKekInfo,
          32
        )
        // wrapKeyHandle is KEK: wrap=true, unwrap=true, encrypt/decrypt=false, extractable=true (needed for HKDF re-derivation check)
        const wrapKeyHandle = hsm_importAESKey(
          M,
          hSession,
          kekBytes,
          false,
          false,
          true,
          true,
          false,
          true
        )
        // provKeyHandle is a DEK: encrypt=true, decrypt=true, wrap/unwrap=false, extractable=false
        const provKeyHandle = hsm_generateAESKey(
          M,
          hSession,
          256,
          true,
          true,
          false,
          false,
          false,
          false
        )
        hsm.addKey({
          handle: wrapKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 KEK (HKDF from ML-KEM secret)',
          purpose: 'kek',
          generatedAt: now(),
        })
        hsm.addKey({
          handle: provKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 Provisioning Key',
          purpose: 'application',
          generatedAt: now(),
        })
        const wrappedKey = hsm_aesWrapKey(M, hSession, wrapKeyHandle, provKeyHandle)
        addResult({
          step: 3,
          purpose: 'kek',
          title: 'KEK from ML-KEM Secret (HKDF) Wraps Provisioning Key',
          pkcs11Call: `C_CreateObject(CKK_GENERIC_SECRET) → derivable handle\nC_DeriveKey(CKM_HKDF, info="tee-hsm-kek-v1") → 32 B KEK\nC_GenerateKey(CKM_AES_KEY_GEN, 256) → prov key\nC_WrapKey(CKM_AES_KEY_WRAP) → ${wrappedKey.length} B`,
          detail: `shared secret = ${sharedSecretBytes.length} B → HKDF → KEK = 32 B · wrapped blob = ${wrappedKey.length} B`,
          note: 'KEK is derived from the ML-KEM-768 shared secret via HKDF-SHA256 (RFC 5869, info="tee-hsm-kek-v1"). The enclave re-derives the same KEK after decapsulating — no KEK is ever transmitted.',
        })

        // Step 4: Sign attestation report
        const teeReport = `TEE-attestation:kem-ct=${ciphertextBytes.length}B:ks-handle=0x${secretHandle.toString(16)}`
        const sigBytes = hsm_sign(M, hSession, dsaKeys.privHandle, teeReport)
        addResult({
          step: 4,
          purpose: 'attestation',
          title: 'Attestation Report Signed (ML-DSA)',
          pkcs11Call: `C_MessageSignInit(CKM_ML_DSA) + C_SignMessage("${teeReport.slice(0, 40)}…")`,
          detail: `message = "${teeReport.slice(0, 50)}…" · signature = ${sigBytes.length} B`,
          note: 'Simplified attestation payload — real SGX/TDX/CCA tokens use CBOR-encoded COSE_Sign1 structures (RFC 9360). The HSM signs the report; the enclave verifies before unsealing.',
        })

        // Step 5: Receiver side — verify signature, decapsulate, re-derive KEK, unwrap provisioning key
        const verifyOk = hsm_verify(M, hSession, dsaKeys.pubHandle, teeReport, sigBytes)
        const recoveredSecretHandle = hsm_decapsulate(
          M,
          hSession,
          kemKeys.privHandle,
          ciphertextBytes,
          768
        )
        const recoveredSecretBytes = hsm_extractKeyValue(M, hSession, recoveredSecretHandle)
        const derivableHandle2 = hsm_importGenericSecret(M, hSession, recoveredSecretBytes)
        const kekBytes2 = hsm_hkdf(
          M,
          hSession,
          derivableHandle2,
          CKM_SHA256,
          true,
          true,
          undefined,
          teeKekInfo,
          32
        )
        const unwrapKeyHandle = hsm_importAESKey(
          M,
          hSession,
          kekBytes2,
          false,
          false,
          true,
          true,
          false,
          false
        )
        const recoveredProvHandle = hsm_unwrapKeyMech(
          M,
          hSession,
          CKM_AES_KEY_WRAP,
          unwrapKeyHandle,
          wrappedKey,
          AES_UNWRAP_TEMPLATE
        )
        hsm.addKey({
          handle: recoveredProvHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 Recovered Provisioning Key (Enclave)',
          purpose: 'application',
          generatedAt: now(),
        })
        addResult({
          step: 5,
          purpose: 'application',
          title: 'Enclave: Verify + Decap + Re-derive KEK + Unwrap',
          pkcs11Call: `C_MessageVerifyInit(CKM_ML_DSA) → C_VerifyMessage → ${verifyOk ? '✓ PASS' : '✗ FAIL'}\nC_DecapsulateKey(CKM_ML_KEM) → shared secret = ${recoveredSecretBytes.length} B\nC_DeriveKey(CKM_HKDF) → KEK (same derivation)\nC_UnwrapKey(CKM_AES_KEY_WRAP) → prov key handle`,
          // eslint-disable-next-line security/detect-object-injection
          detail: `sig verify = ${verifyOk ? 'PASS ✓' : 'FAIL ✗'} · recovered secret match = ${recoveredSecretBytes.every((b, i) => b === sharedSecretBytes[i]) ? 'YES ✓' : 'NO ✗'} · prov key handle = 0x${recoveredProvHandle.toString(16)}`,
          note: 'Protocol complete. The enclave verified the HSM attestation, decapsulated the KEM ciphertext to recover the shared secret, re-derived the KEK via HKDF (same info string), and unwrapped the provisioning key — all without the KEK ever leaving either party.',
        })
      } else {
        // ── Classical flow ────────────────────────────────────────────────────

        // Step 1: Attestation key (ECDSA P-256)
        const dsaKeys = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'derive')
        hsm.addKey({
          handle: dsaKeys.pubHandle,
          family: 'ecdsa',
          role: 'public',
          label: 'ECDSA P-256 Attestation Key (Public)',
          purpose: 'attestation',
          generatedAt: now(),
        })
        hsm.addKey({
          handle: dsaKeys.privHandle,
          family: 'ecdsa',
          role: 'private',
          label: 'ECDSA P-256 Attestation Key (Private)',
          purpose: 'attestation',
          generatedAt: now(),
        })
        addResult({
          step: 1,
          purpose: 'attestation',
          title: 'Attestation Key Generated (ECDSA P-256)',
          pkcs11Call: 'C_GenerateKeyPair(CKM_EC_KEY_PAIR_GEN, P-256)',
          detail: 'pub ≈ 65 B (uncompressed) · priv ≈ 32 B',
          note: "Classical ECDSA P-256 attestation key. Vulnerable to Shor's algorithm on a cryptographically-relevant quantum computer — migrate to ML-DSA.",
        })

        // Step 2: TLS transport via ECDH P-256
        const kemKeys = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'derive')
        hsm.addKey({
          handle: kemKeys.pubHandle,
          family: 'ecdh',
          role: 'public',
          label: 'ECDH P-256 TLS Ephemeral Key (Public)',
          purpose: 'tls',
          generatedAt: now(),
        })
        hsm.addKey({
          handle: kemKeys.privHandle,
          family: 'ecdh',
          role: 'private',
          label: 'ECDH P-256 TLS Ephemeral Key (Private)',
          purpose: 'tls',
          generatedAt: now(),
        })
        addResult({
          step: 2,
          purpose: 'tls',
          title: 'TLS Ephemeral Key (ECDH P-256)',
          pkcs11Call: 'C_GenerateKeyPair(CKM_EC_KEY_PAIR_GEN, P-256) — ephemeral',
          detail: 'pub ≈ 65 B · priv ≈ 32 B · ECDH shared secret ≈ 32 B',
          note: 'Classical ECDH P-256 for TLS 1.3 key exchange. The shared secret is used to derive the wrapping key. Use PQC mode to see ML-KEM-768 instead.',
        })

        // wrapKeyHandle is a KEK, so wrap=true, unwrap=true, encrypt/decrypt=false, extractable=false
        const wrapKeyHandle = hsm_generateAESKey(
          M,
          hSession,
          256,
          false,
          false,
          true,
          true,
          false,
          false
        )
        // provKeyHandle is a DEK, so encrypt=true, decrypt=true, wrap/unwrap=false, extractable=false
        const provKeyHandle = hsm_generateAESKey(
          M,
          hSession,
          256,
          true,
          true,
          false,
          false,
          false,
          false
        )
        hsm.addKey({
          handle: wrapKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 Key Encryption Key (KEK)',
          purpose: 'kek',
          generatedAt: now(),
        })
        hsm.addKey({
          handle: provKeyHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 Provisioning Key',
          purpose: 'application',
          generatedAt: now(),
        })
        const wrappedKey = hsm_aesWrapKey(M, hSession, wrapKeyHandle, provKeyHandle)
        addResult({
          step: 3,
          purpose: 'kek',
          title: 'KEK Wraps Provisioning Key (AES-256)',
          pkcs11Call: `C_GenerateKey(CKM_AES_KEY_GEN, 256) × 2\nC_WrapKey(CKM_AES_KEY_WRAP) → ${wrappedKey.length} B`,
          detail: `KEK = 32 B · provisioning key = 32 B · wrapped blob = ${wrappedKey.length} B`,
          note: "The Key Encryption Key wraps the provisioning key for secure transmission. AES-256 symmetric keys are quantum-safe (Grover's requires 2^128 ops).",
        })

        // Step 4: Sign attestation report
        const teeReport = `TEE-attestation:ecdh-ephem:ks-handle=0x${wrapKeyHandle.toString(16)}`
        const sigBytes = hsm_ecdsaSign(M, hSession, dsaKeys.privHandle, teeReport)
        addResult({
          step: 4,
          purpose: 'attestation',
          title: 'Attestation Report Signed (ECDSA)',
          pkcs11Call: `C_MessageSignInit(CKM_ECDSA) + C_SignMessage("${teeReport.slice(0, 35)}…")`,
          detail: `message = "${teeReport.slice(0, 50)}…" · signature ≈ ${sigBytes.length} B`,
          note: 'Simplified attestation payload — real SGX/TDX tokens use CBOR-encoded COSE_Sign1 structures. ECDSA signature on the attestation report. In PQC mode this uses ML-DSA (~3.3 KB sig vs ~72 B here).',
        })

        // Step 5: Receiver side — verify signature + unwrap provisioning key
        const verifyOk = hsm_ecdsaVerify(M, hSession, dsaKeys.pubHandle, teeReport, sigBytes)
        const recoveredProvHandle = hsm_unwrapKeyMech(
          M,
          hSession,
          CKM_AES_KEY_WRAP,
          wrapKeyHandle,
          wrappedKey,
          AES_UNWRAP_TEMPLATE
        )
        hsm.addKey({
          handle: recoveredProvHandle,
          family: 'aes',
          role: 'secret',
          label: 'AES-256 Recovered Provisioning Key (Enclave)',
          purpose: 'application',
          generatedAt: now(),
        })
        addResult({
          step: 5,
          purpose: 'application',
          title: 'Enclave: Verify ECDSA + Unwrap Provisioning Key',
          pkcs11Call: `C_Verify(CKM_ECDSA_SHA256) → ${verifyOk ? '✓ PASS' : '✗ FAIL'}\nC_UnwrapKey(CKM_AES_KEY_WRAP) → prov key handle`,
          detail: `sig verify = ${verifyOk ? 'PASS ✓' : 'FAIL ✗'} · recovered prov key handle = 0x${recoveredProvHandle.toString(16)}`,
          note: 'Protocol complete (classical). The enclave verified the HSM ECDSA attestation, then unwrapped the provisioning key using the ECDH-derived session KEK. Switch to PQC mode to see ML-DSA verify + ML-KEM decapsulate + HKDF key derivation.',
        })
      }
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : String(e))
    } finally {
      setLiveRunning(false)
    }
  }, [hsm, pqcMode])

  const bothSelected = selectedTeeVendor !== 'All' && selectedHsmVendor !== 'All'

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Design and explore TEE-HSM integration architectures with mutual attestation and PQC key
        provisioning. Select a TEE vendor and HSM vendor to visualize the trusted channel.
      </p>

      {/* Live HSM TEE-HSM Key Provisioning Demo */}
      <LiveHSMToggle hsm={hsm} operations={TEE_LIVE_OPERATIONS} />

      {/* ── Scenario Selector ─────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Scenario Selector</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <FilterDropdown
              items={teeVendorItems}
              selectedId={selectedTeeVendor}
              onSelect={(id) => {
                setSelectedTeeVendor(id)
                setCurrentStep(0)
              }}
              label="TEE Vendor"
              defaultLabel="Select TEE"
              defaultIcon={<Cpu size={16} className="text-primary" />}
              noContainer
            />
          </div>
          <div className="flex-1">
            <FilterDropdown
              items={hsmVendorItems}
              selectedId={selectedHsmVendor}
              onSelect={(id) => {
                setSelectedHsmVendor(id)
                setCurrentStep(0)
              }}
              label="HSM Vendor"
              defaultLabel="Select HSM"
              defaultIcon={<Server size={16} className="text-primary" />}
              noContainer
            />
          </div>
        </div>
      </div>

      {/* ── No match message ──────────────────────────────────────── */}
      {bothSelected && !integration && (
        <div className="glass-panel p-6 text-center">
          <XCircle size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Integration not available</p>
          <p className="text-xs text-muted-foreground mt-1">
            No documented integration exists between{' '}
            {teeVendorItems.find((t) => t.id === selectedTeeVendor)?.label ?? selectedTeeVendor} and{' '}
            {selectedHsmVendor}. Try a different combination.
          </p>
        </div>
      )}

      {/* ── Architecture Diagram ──────────────────────────────────── */}
      {integration && teeArch && (
        <>
          <div className="glass-panel p-5">
            <div className="text-sm font-bold text-foreground mb-4">Architecture Diagram</div>

            {/* Diagram */}
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {/* TEE Box */}
              <div className="flex-1 max-w-[200px] border-2 border-primary rounded-lg p-3 bg-primary/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Cpu size={14} className="text-primary" />
                  <span className="text-xs font-bold text-primary">{teeArch.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Scope:{' '}
                  {teeArch.scope === 'vm'
                    ? 'VM-Level'
                    : teeArch.scope === 'process'
                      ? 'Process-Level'
                      : 'Hardware Partition'}
                </span>
              </div>

              {/* Channel */}
              <div className="flex flex-col items-center gap-1 min-w-[120px]">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ArrowLeftRight size={10} />
                  <span>Mutual Attestation</span>
                </div>
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 border-t-2 border-dashed border-primary/50" />
                  <Lock size={12} className="text-primary shrink-0" />
                  <div className="flex-1 border-t-2 border-dashed border-primary/50" />
                </div>
                <span className="text-[10px] font-medium text-foreground">TLS 1.3 Channel</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {CHANNEL_TYPE_LABELS[integration.channelType] ?? integration.channelType}
                </span>
              </div>

              {/* HSM Box */}
              <div className="flex-1 max-w-[200px] border-2 border-secondary rounded-lg p-3 bg-secondary/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Server size={14} className="text-secondary" />
                  <span className="text-xs font-bold text-secondary">{integration.hsmVendor}</span>
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Channel: {CHANNEL_TYPE_LABELS[integration.channelType] ?? integration.channelType}
                </span>
              </div>
            </div>
          </div>

          {/* ── Protocol Mode Toggle ──────────────────────────────── */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-foreground">Protocol Mode</div>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <Button
                  variant={!pqcMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setPqcMode(false)
                    setCurrentStep(0)
                  }}
                  className="rounded-none"
                >
                  Classical
                </Button>
                <Button
                  variant={pqcMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setPqcMode(true)
                    setCurrentStep(0)
                  }}
                  className="rounded-none"
                >
                  PQC
                </Button>
              </div>
            </div>

            {/* Crypto comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Signing Algorithm
                </div>
                <div className="text-sm font-medium text-foreground">
                  {pqcMode
                    ? (integration.pqcSigningAlgo ?? (
                        <span className="text-status-warning">Not available</span>
                      ))
                    : integration.currentSigningAlgo}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Key Encapsulation
                </div>
                <div className="text-sm font-medium text-foreground">
                  {pqcMode
                    ? (integration.pqcKEM ?? (
                        <span className="text-status-warning">Not available</span>
                      ))
                    : integration.currentKEM}
                </div>
              </div>
            </div>

            {/* Key size comparison */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-center p-2 bg-muted/20 rounded border border-border">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {pqcMode ? 'PQC Public Key' : 'Classical Public Key'}
                </div>
                <div className="text-sm font-mono font-bold text-foreground">
                  {pqcMode ? '~1,952 B' : '~64 B'}
                </div>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded border border-border">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {pqcMode ? 'PQC Ciphertext' : 'Classical Ciphertext'}
                </div>
                <div className="text-sm font-mono font-bold text-foreground">
                  {pqcMode ? '~1,088 B' : '~65 B'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Provisioning Simulation ────────────────────────── */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-foreground">Key Provisioning Simulation</div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Key size={12} />
                <span>
                  Step {currentStep + 1} of {provisioningSteps.length}
                </span>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1 mb-4">
              {provisioningSteps.map((_, idx) => (
                <div key={idx} className="flex items-center gap-1 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx < currentStep
                        ? 'bg-status-success/20 text-status-success'
                        : idx === currentStep
                          ? 'bg-primary/20 text-primary ring-2 ring-primary/50'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx < currentStep ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  {idx < provisioningSteps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        idx < currentStep ? 'bg-status-success/50' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Current step detail */}
            {provisioningSteps.length > 0 &&
              (() => {
                // eslint-disable-next-line security/detect-object-injection
                const activeStep = provisioningSteps[currentStep]
                return (
                  <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                    <div className="text-sm font-bold text-foreground">{activeStep.title}</div>
                    <p className="text-xs text-muted-foreground">{activeStep.description}</p>
                    <div className="rounded bg-primary/5 border border-primary/20 px-3 py-2">
                      <div className="text-[10px] font-semibold text-primary mb-0.5 uppercase tracking-wide">
                        Why this step matters
                      </div>
                      <p className="text-[10px] text-foreground/80">{activeStep.whyItMatters}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-start gap-2">
                        <Shield size={12} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">Crypto Used</div>
                          <div className="text-xs text-foreground font-medium">
                            {activeStep.crypto}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight size={12} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">Data Size</div>
                          <div className="text-xs text-foreground font-medium">
                            {activeStep.dataSize}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft size={14} className="mr-1" />
                Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw size={14} className="mr-1" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentStep >= provisioningSteps.length - 1}
                onClick={() => setCurrentStep((s) => Math.min(provisioningSteps.length - 1, s + 1))}
              >
                Next
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>

          {/* ── Mutual Attestation Checklist ──────────────────────── */}
          <div className="glass-panel p-4">
            <div className="text-sm font-bold text-foreground mb-1">
              Mutual Attestation Checklist
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
              Mutual attestation means both sides prove their identity cryptographically before any
              key material is exchanged. Without it, a rogue process could impersonate a TEE or HSM
              and receive provisioned keys.
            </p>
            <div className="space-y-3">
              {/* TEE attests to HSM */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  {integration.mutualAttestation ? (
                    <CheckCircle size={14} className="text-status-success shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-status-error shrink-0" />
                  )}
                  <span className="text-foreground font-medium">
                    TEE attests to HSM (quote verification)
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-5">
                  The TEE generates a hardware-signed attestation quote (e.g., SGX DCAP Quote,
                  SEV-SNP Report). The HSM verifies the quote signature against the vendor root CA
                  to confirm it is talking to a genuine, unmodified enclave.
                </p>
              </div>

              {/* HSM attests to TEE */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  {integration.mutualAttestation ? (
                    <CheckCircle size={14} className="text-status-success shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-status-error shrink-0" />
                  )}
                  <span className="text-foreground font-medium">
                    HSM attests to TEE (certificate chain validation)
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-5">
                  The HSM presents its own certificate chain (e.g., FIPS 140-3 validation cert or
                  vendor device certificate). The TEE validates this chain to confirm it is
                  provisioning keys into a genuine, tamper-resistant HSM — not a software mock.
                </p>
              </div>

              {/* TLS channel binding */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  {integration.tlsChannelBinding ? (
                    <CheckCircle size={14} className="text-status-success shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-status-error shrink-0" />
                  )}
                  <span className="text-foreground font-medium">TLS channel binding</span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-5">
                  The attestation evidence is cryptographically bound to the TLS session (e.g., via
                  a nonce or public key hash in the attestation payload). This prevents a
                  man-in-the-middle from replaying a valid quote from a legitimate enclave over a
                  different TLS session.
                </p>
              </div>

              {/* Migration complexity */}
              <div className="flex items-center gap-2 text-xs pt-1 border-t border-border">
                <span className="text-muted-foreground">PQC migration complexity:</span>
                <span
                  className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${COMPLEXITY_CONFIG[integration.migrationComplexity]?.className ?? 'bg-muted text-muted-foreground'}`}
                >
                  {COMPLEXITY_CONFIG[integration.migrationComplexity]?.label ??
                    integration.migrationComplexity}
                </span>
              </div>
            </div>

            {/* Notes */}
            {integration.notes && (
              <p className="text-[10px] text-muted-foreground mt-3 border-t border-border pt-2">
                {integration.notes}
              </p>
            )}
          </div>
        </>
      )}

      {hsm.isReady && (
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Run TEE-HSM Key Provisioning ({pqcMode ? 'PQC' : 'Classical'})
            </p>
            <Button variant="default" size="sm" onClick={runLiveDemo} disabled={liveRunning}>
              {liveRunning ? (
                <>
                  <Loader2 size={11} className="animate-spin mr-1" /> Running…
                </>
              ) : (
                'Execute (Live WASM)'
              )}
            </Button>
          </div>

          {liveError && <p className="text-xs text-status-error font-mono">{liveError}</p>}

          {liveResults.length > 0 && (
            <div className="space-y-2">
              {liveResults.map((r) => (
                <div
                  key={r.step}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5"
                >
                  {/* Step header */}
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-status-success shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{r.title}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto ${PURPOSE_LABEL_CLASS[r.purpose]}`}
                    >
                      {PURPOSE_ICON[r.purpose]}
                      {PURPOSE_DISPLAY[r.purpose]}
                    </span>
                  </div>

                  {/* PKCS#11 call */}
                  <div className="bg-background/60 rounded px-2 py-1.5 border border-border/50">
                    {r.pkcs11Call.split('\n').map((line, i) => (
                      <p key={i} className="text-[11px] font-mono text-foreground/80 break-all">
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Detail + note */}
                  <p className="text-[10px] font-mono text-muted-foreground">{r.detail}</p>
                  <p className="text-[10px] text-muted-foreground italic border-t border-border/30 pt-1">
                    {r.note}
                  </p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">
                Real output from SoftHSM3 WASM · PKCS#11 v3.2 ·{' '}
                {pqcMode
                  ? 'Live demo uses ML-DSA-65 + ML-KEM-768; select a vendor above to see algorithm differences.'
                  : 'Switch to PQC mode to run ML-DSA-65 + ML-KEM-768 + HKDF.'}
              </p>
            </div>
          )}

          {/* Vendor-specific notes when scenario is selected */}
          {liveResults.length > 0 && integration && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Server size={12} className="text-primary" />
                {selectedHsmVendor} + {teeArch?.name ?? selectedTeeVendor} — Integration Notes
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Channel type: </span>
                  <span className="text-foreground font-medium">
                    {CHANNEL_TYPE_LABELS[integration.channelType] ?? integration.channelType}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mutual attestation: </span>
                  <span
                    className={
                      integration.mutualAttestation
                        ? 'text-status-success font-medium'
                        : 'text-status-error font-medium'
                    }
                  >
                    {integration.mutualAttestation ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">TLS channel binding: </span>
                  <span
                    className={
                      integration.tlsChannelBinding
                        ? 'text-status-success font-medium'
                        : 'text-muted-foreground font-medium'
                    }
                  >
                    {integration.tlsChannelBinding ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Migration complexity: </span>
                  <span
                    className={`font-bold rounded px-1 py-0.5 ${COMPLEXITY_CONFIG[integration.migrationComplexity]?.className ?? ''}`}
                  >
                    {COMPLEXITY_CONFIG[integration.migrationComplexity]?.label ??
                      integration.migrationComplexity}
                  </span>
                </div>
              </div>
              {integration.notes && (
                <p className="text-[10px] text-muted-foreground border-t border-border/30 pt-1">
                  {integration.notes}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quantum Threat Analysis ──────────────────────────────── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield size={14} className="text-status-error" />
          Quantum Threat Analysis — TEE &amp; HSM Components
        </div>
        <p className="text-xs text-muted-foreground">
          Each component of a TEE-HSM deployment faces distinct quantum risks. Vectors marked{' '}
          <span className="font-semibold text-status-warning">HNDL</span> are subject to
          harvest-now-decrypt-later attacks — adversaries recording traffic today can decrypt it
          once a cryptographically-relevant quantum computer (CRQC) is available.
        </p>
        <div className="space-y-2">
          {QUANTUM_THREAT_VECTORS.map((threat) => (
            <div
              key={threat.id}
              className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    threat.severity === 'critical'
                      ? 'bg-status-error/20 text-status-error'
                      : threat.severity === 'high'
                        ? 'bg-status-warning/20 text-status-warning'
                        : 'bg-status-info/20 text-status-info'
                  }`}
                >
                  {threat.severity.toUpperCase()}
                </span>
                {threat.hndlExposure && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                    HNDL
                  </span>
                )}
                <span className="text-xs font-semibold text-foreground">{threat.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {threat.component}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{threat.vulnerability}</p>
              <div className="flex items-start gap-1 text-[10px]">
                <span className="text-status-success font-medium shrink-0">PQC fix:</span>
                <span className="text-foreground/80">{threat.pqcSolution}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border/30 pt-1">
                <span>Timeline: {threat.vendorTimeline}</span>
                <span>· Effort: {threat.migrationEffort}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Memory Encryption Quantum Impact ─────────────────────── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="text-sm font-bold text-foreground flex items-center gap-2">
          <Cpu size={14} className="text-status-warning" />
          Memory Encryption Engines — Quantum Impact
        </div>
        <p className="text-xs text-muted-foreground">
          Enclave sealing keys and memory encryption are often AES-128, which Grover&apos;s
          algorithm halves to 64-bit effective post-quantum security — below NIST Level 1 (128-bit).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEMORY_ENCRYPTION_ENGINES.map((eng) => (
            <div
              key={eng.id}
              className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{eng.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    eng.quantumImpact === 'grover-halved'
                      ? 'bg-status-warning/20 text-status-warning'
                      : 'bg-status-success/20 text-status-success'
                  }`}
                >
                  {eng.quantumImpact === 'grover-halved' ? 'Grover Halved' : 'Quantum Safe'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {eng.algorithm} · {eng.keyWidth}-bit key
              </div>
              <p className="text-[10px] text-muted-foreground">{eng.quantumNotes}</p>
              <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-1">
                <span className="font-medium">Sealing:</span> {eng.sealingKeyDerivation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Standards Referenced ──────────────────────────────────── */}
      <div className="glass-panel p-4 space-y-2">
        <div className="text-sm font-bold text-foreground">Standards Referenced</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              ref: 'FIPS 203',
              label: 'FIPS 203 — ML-KEM (Kyber)',
              note: 'Key encapsulation for TLS transport',
            },
            {
              ref: 'FIPS 204',
              label: 'FIPS 204 — ML-DSA (Dilithium)',
              note: 'Attestation key signing',
            },
            {
              ref: 'NIST SP 800-227',
              label: 'NIST SP 800-227 — KEM Guidance',
              note: 'Security and validation guidance for KEMs',
            },
            {
              ref: 'ETSI TS 103 744',
              label: 'ETSI TS 103 744 — Hybrid KEM',
              note: 'Hybrid ECDH + ML-KEM framework',
            },
          ].map(({ ref, label, note }) => (
            <Link
              key={ref}
              to={`/library?ref=${encodeURIComponent(ref)}`}
              className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <Shield size={12} className="text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-medium text-foreground group-hover:text-primary">
                  {label}
                </div>
                <div className="text-[10px] text-muted-foreground">{note}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Cross-reference callout ───────────────────────────────── */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground">
        <strong>Note:</strong> HSM PQC firmware details and vendor comparison are covered in the{' '}
        <Link to="/learn/hsm-pqc" className="text-primary hover:underline">
          HSM &amp; PQC Operations module
        </Link>
        . Use the{' '}
        <Link to="/learn/hsm-pqc?tab=workshop&step=0" className="text-primary hover:underline">
          PKCS#11 Simulator
        </Link>{' '}
        to explore the HSM side of this integration.
      </div>

      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            defaultOpen={false}
            title="PKCS#11 Call Log — TEE-HSM Channel"
            emptyMessage="Click 'Execute' to run the TEE-HSM key provisioning flow."
            filterFns={TEE_LIVE_OPERATIONS}
          />

          {hsm.keys.length > 0 && (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={hsm.removeKey}
              title="Generated Keys — TEE-HSM Provisioning"
            />
          )}
        </div>
      )}
    </div>
  )
}
