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
import { TEE_HSM_INTEGRATIONS } from '../data/attestationData'
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
  hsm_aesWrapKey,
  hsm_sign,
  hsm_ecdsaSign,
  hsm_extractKeyValue,
  hsm_generateECKeyPair,
} from '@/wasm/softhsm'

const TEE_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_EncapsulateKey',
  'C_WrapKey',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
  'C_GenerateKey',
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
      crypto: pqcMode
        ? `${integration.pqcSigningAlgo ?? 'ML-DSA-65'} keypair generation`
        : `${integration.currentSigningAlgo} keypair generation`,
      dataSize: pqcMode ? '~2.5 KB (ML-DSA public key)' : '~64 bytes (ECDSA public key)',
    },
    {
      title: 'TLS transport to enclave',
      description: `A TLS 1.3 channel is established between the HSM and the TEE using key exchange and mutual authentication.`,
      crypto: `Key exchange: ${kem} | Auth: ${signingAlgo}`,
      dataSize: pqcMode
        ? '~1.5 KB (ML-KEM ciphertext + cert)'
        : '~200 bytes (ECDH ephemeral + cert)',
    },
    {
      title: 'Enclave receives wrapped key',
      description: `The wrapped private key material is transmitted over the established channel. The wrapping key is derived from the TLS session.`,
      crypto: `AES-256-GCM key wrapping over ${kem} session`,
      dataSize: pqcMode
        ? '~4.5 KB (wrapped ML-DSA private key)'
        : '~100 bytes (wrapped ECDSA private key)',
    },
    {
      title: 'Enclave unseals with sealing key',
      description: `The enclave uses its hardware-derived sealing key to decrypt the wrapping layer and load the private key into protected memory.`,
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

        // wrapKeyHandle is a KEK, so wrap=true, unwrap=true, encrypt/decrypt=false, extractable=false
        const wrapKeyHandle = hsm_generateAESKey(M, hSession, 256, false, false, true, true, false, false)
        // provKeyHandle is a DEK, so encrypt=true, decrypt=true, wrap/unwrap=false, extractable=false
        const provKeyHandle = hsm_generateAESKey(M, hSession, 256, true, true, false, false, false, false)
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
          pkcs11Call: `C_GenerateKey(CKM_AES_KEY_GEN, 256) → KEK handle\nC_GenerateKey(CKM_AES_KEY_GEN, 256) → prov key handle\nC_WrapKey(CKM_AES_KEY_WRAP) → ${wrappedKey.length} B`,
          detail: `KEK = 32 B · provisioning key = 32 B · wrapped blob = ${wrappedKey.length} B`,
          note: 'The Key Encryption Key (KEK) is derived from the ML-KEM shared secret via HKDF. It wraps the provisioning key before transmission to the enclave.',
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
          note: 'The HSM signs the TEE attestation report with the attestation private key. The enclave verifies this signature to confirm the HSM identity before unsealing.',
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
        const wrapKeyHandle = hsm_generateAESKey(M, hSession, 256, false, false, true, true, false, false)
        // provKeyHandle is a DEK, so encrypt=true, decrypt=true, wrap/unwrap=false, extractable=false
        const provKeyHandle = hsm_generateAESKey(M, hSession, 256, true, true, false, false, false, false)
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
          note: 'ECDSA signature on the attestation report. In PQC mode this uses ML-DSA, producing a ~3.3 KB signature vs ~72 B here.',
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
                  {pqcMode ? '~2,528 B' : '~64 B'}
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
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <div className="text-sm font-bold text-foreground mb-1">{activeStep.title}</div>
                    <p className="text-xs text-muted-foreground mb-3">{activeStep.description}</p>
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
            <div className="text-sm font-bold text-foreground mb-3">
              Mutual Attestation Checklist
            </div>
            <div className="space-y-2">
              {/* TEE attests to HSM */}
              <div className="flex items-center gap-2 text-xs">
                {integration.mutualAttestation ? (
                  <CheckCircle size={14} className="text-status-success shrink-0" />
                ) : (
                  <XCircle size={14} className="text-status-error shrink-0" />
                )}
                <span className="text-foreground">TEE attests to HSM (quote verification)</span>
              </div>

              {/* HSM attests to TEE */}
              <div className="flex items-center gap-2 text-xs">
                {integration.mutualAttestation ? (
                  <CheckCircle size={14} className="text-status-success shrink-0" />
                ) : (
                  <XCircle size={14} className="text-status-error shrink-0" />
                )}
                <span className="text-foreground">
                  HSM attests to TEE (certificate chain validation)
                </span>
              </div>

              {/* TLS channel binding */}
              <div className="flex items-center gap-2 text-xs">
                {integration.tlsChannelBinding ? (
                  <CheckCircle size={14} className="text-status-success shrink-0" />
                ) : (
                  <XCircle size={14} className="text-status-error shrink-0" />
                )}
                <span className="text-foreground">TLS channel binding</span>
              </div>

              {/* Migration complexity */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Migration complexity:</span>
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
            <p className="text-sm font-semibold">Run TEE-HSM Key Provisioning (PQC)</p>
            <button
              onClick={runLiveDemo}
              disabled={liveRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {liveRunning ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Running…
                </>
              ) : (
                'Execute (Live WASM)'
              )}
            </button>
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
                Real output from SoftHSM3 WASM · PKCS#11 v3.2
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
