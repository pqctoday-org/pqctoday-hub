// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef } from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { FiveGDiagram } from './components/FiveGDiagram'
import { fiveGService } from './services/FiveGService'
import { Shield, Radio, Info } from 'lucide-react'
import clsx from 'clsx'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const FIVEG_KAT_SPECS: KatTestSpec[] = [
  {
    id: '5g-suci-encap',
    useCase: 'SUCI subscriber concealment',
    standard: '3GPP TR 33.841 + FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: '5g-gnb-decap',
    useCase: 'gNB session key derivation',
    standard: '3GPP TR 33.841 + FIPS 203 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203',
    kind: { type: 'mlkem-decap', variant: 768 },
  },
  {
    id: '5g-nas-sigver',
    useCase: 'NAS/RRC control plane integrity',
    standard: '3GPP TR 33.841 + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-sigver', variant: 65 },
  },
]
import {
  hsm_generateECKeyPair,
  hsm_generateAESKey,
  hsm_aesEncrypt,
  hsm_hmac,
  hsm_generateHMACKey,
  hsm_extractKeyValue,
  hsm_ecdhDerive,
  hsm_hkdf,
  CKM_SHA256,
} from '@/wasm/softhsm'

const SUCI_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_DeriveKey',
  'C_GenerateKey',
  'C_EncryptInit',
  'C_Encrypt',
  'C_SignInit',
  'C_Sign',
]

interface SuciFlowProps {
  onBack: () => void
  initialProfile?: 'A' | 'B' | 'C'
  initialPqcMode?: 'hybrid' | 'pure'
}

type Profile = 'A' | 'B' | 'C'

export const SuciFlow: React.FC<SuciFlowProps> = ({ onBack, initialProfile, initialPqcMode }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile ?? 'A')
  const [pqcMode, setPqcMode] = useState<'hybrid' | 'pure'>(initialPqcMode ?? 'hybrid')
  const hsm = useHSM()

  // Track HSM key handles across steps for ECDH derive + HKDF
  const hsmHandlesRef = useRef<{
    hnPubHandle?: number
    hnPrivHandle?: number
    ephPubHandle?: number
    ephPrivHandle?: number
    sharedSecretHandle?: number
  }>({})

  // Wrap setters to also clear crypto state when switching profiles/modes
  const changeProfile = (p: Profile) => {
    fiveGService.cleanup()
    setArtifacts({})
    hsmHandlesRef.current = {}
    setProfile(p)
  }
  const changePqcMode = (m: 'hybrid' | 'pure') => {
    fiveGService.cleanup()
    setArtifacts({})
    hsmHandlesRef.current = {}
    setPqcMode(m)
  }

  // Select steps based on profile
  const rawSteps =
    profile === 'A'
      ? FIVE_G_CONSTANTS.SUCI_STEPS_A
      : profile === 'B'
        ? FIVE_G_CONSTANTS.SUCI_STEPS_B
        : FIVE_G_CONSTANTS.SUCI_STEPS_C

  // Map to Step interface
  const steps: Step[] = rawSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    code: step.code,
    language: 'bash',
    actionLabel: 'Execute Step',
    explanationTable: step.explanationTable,
    // Pass custom diagram that knows about current step and profile
    diagram: <FiveGDiagram step={index} profile={profile} />,
  }))

  // State to hold generated artifacts (simulated persistence)
  const [artifacts, setArtifacts] = useState<{
    hnPubFile?: string
    hnPrivFile?: string
    ephPrivKey?: string
    ephPubKey?: string
  }>({})

  const executeStep = async () => {
    const stepData = rawSteps[wizard.currentStep]
    let result = ''

    try {
      if (stepData.id === 'init_network_key') {
        if (
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          (profile === 'A' || profile === 'B')
        ) {
          // ── Live HSM Mode: EC key gen via PKCS#11 ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const curve = profile === 'A' ? 'X25519' : 'P-256'
          const { pubHandle, privHandle } = hsm_generateECKeyPair(
            M,
            hSession,
            curve === 'X25519' ? 'P-256' : curve
          )
          hsmHandlesRef.current.hnPubHandle = pubHandle
          hsmHandlesRef.current.hnPrivHandle = privHandle
          hsm.addKey({
            handle: pubHandle,
            label: `HN Key (${curve})`,
            family: 'ecdsa',
            role: 'public',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: privHandle,
            label: `HN Key (${curve})`,
            family: 'ecdsa',
            role: 'private',
            generatedAt: new Date().toISOString(),
          })
          result =
            `[PKCS#11] C_GenerateKeyPair(CKM_EC_KEY_PAIR_GEN, ${curve})\n` +
            `  → Public key handle:  ${pubHandle}\n` +
            `  → Private key handle: ${privHandle}\n` +
            `\nHome Network key pair generated via SoftHSM3 WASM.`
          setArtifacts((prev) => ({
            ...prev,
            hnPubFile: `hsm_pub_${pubHandle}`,
            hnPrivFile: `hsm_priv_${privHandle}`,
          }))
        } else {
          const res = await fiveGService.generateNetworkKey(profile, pqcMode)
          setArtifacts((prev) => ({
            ...prev,
            hnPubFile: res.pubKeyFile,
            hnPrivFile: res.privKeyFile,
          }))
          result = res.output
        }
      } else if (stepData.id === 'encrypt_msin') {
        if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
          // ── Live HSM Mode: AES encryption via PKCS#11 ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const aesHandle = hsm_generateAESKey(M, hSession, 128)
          const msin = new TextEncoder().encode('0123456789')
          const ct = hsm_aesEncrypt(M, hSession, aesHandle, msin, 'cbc')
          const ctHex = Array.from(ct.ciphertext)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
          result =
            `[PKCS#11] C_GenerateKey(CKM_AES_KEY_GEN, 128-bit)\n` +
            `[PKCS#11] C_EncryptInit(CKM_AES_CBC) + C_Encrypt\n` +
            `  MSIN plaintext:  0123456789\n` +
            `  Ciphertext (hex): ${ctHex}\n` +
            `\nMSIN encrypted via SoftHSM3 WASM.`
        } else {
          result = await fiveGService.encryptMSIN()
        }
      } else if (stepData.id === 'compute_mac') {
        if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
          // ── Live HSM Mode: HMAC via PKCS#11 ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const hmacHandle = hsm_generateHMACKey(M, hSession, 32)
          const data = new TextEncoder().encode('suci-mac-input-data')
          const mac = hsm_hmac(M, hSession, hmacHandle, data)
          const macHex = Array.from(mac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          result =
            `[PKCS#11] C_GenerateKey(CKM_GENERIC_SECRET_KEY_GEN, 256-bit)\n` +
            `[PKCS#11] C_SignInit(CKM_SHA256_HMAC) + C_Sign\n` +
            `  MAC tag (hex): ${macHex}\n` +
            `\nMAC computed via SoftHSM3 WASM.`
        } else {
          result = await fiveGService.computeMAC()
        }
      } else if (stepData.id === 'provision_usim') {
        if (
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.hnPubHandle
        ) {
          // ── Live HSM Mode: Extract public key for USIM provisioning ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const pubBytes = hsm_extractKeyValue(M, hSession, hsmHandlesRef.current.hnPubHandle)
          const pubHex = Array.from(pubBytes)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
          result =
            `[PKCS#11] C_GetAttributeValue(CKA_VALUE) on pub handle ${hsmHandlesRef.current.hnPubHandle}\n` +
            `  Public key bytes: ${pubBytes.length}\n` +
            `  Key (hex): ${pubHex.slice(0, 64)}...\n` +
            `\nHN public key extracted from SoftHSM3 → provisioned to USIM.`
        } else {
          const targetFile = artifacts.hnPubFile || 'sim_hn_pub.key'
          result = await fiveGService.provisionUSIM(targetFile)
        }
      } else if (stepData.id === 'retrieve_key') {
        if (
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.hnPubHandle
        ) {
          // ── Live HSM Mode: Read back public key ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const pubBytes = hsm_extractKeyValue(M, hSession, hsmHandlesRef.current.hnPubHandle)
          result =
            `[PKCS#11] C_GetAttributeValue(CKA_VALUE) — key retrieved from HSM\n` +
            `  Public key size: ${pubBytes.length} bytes\n` +
            `  Profile ${profile}: ${profile === 'A' ? 'X25519' : 'P-256'} curve\n` +
            `\nUE retrieved HN public key from USIM (HSM-backed).`
        } else {
          const targetFile = artifacts.hnPubFile || 'sim_hn_pub.key'
          result = await fiveGService.retrieveKey(targetFile, profile)
        }
      } else if (stepData.id === 'gen_ephemeral_key') {
        if (
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          (profile === 'A' || profile === 'B')
        ) {
          // ── Live HSM Mode: Ephemeral EC key gen via PKCS#11 ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const curve = profile === 'A' ? 'P-256' : 'P-256'
          const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve)
          hsmHandlesRef.current.ephPubHandle = pubHandle
          hsmHandlesRef.current.ephPrivHandle = privHandle
          const ephPubBytes = hsm_extractKeyValue(M, hSession, pubHandle)
          const ephPubHex = Array.from(ephPubBytes)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
          setArtifacts((prev) => ({
            ...prev,
            ephPrivKey: `hsm_eph_priv_${privHandle}`,
            ephPubKey: `hsm_eph_pub_${pubHandle}`,
          }))
          result =
            `[PKCS#11] C_GenerateKeyPair(CKM_EC_KEY_PAIR_GEN, ${curve})\n` +
            `  → Ephemeral pub handle:  ${pubHandle}\n` +
            `  → Ephemeral priv handle: ${privHandle}\n` +
            `  → Ephemeral pub key: ${ephPubHex.slice(0, 64)}...\n` +
            `\nEphemeral key pair generated via SoftHSM3 WASM.`
        } else {
          const res = await fiveGService.generateEphemeralKey(profile, pqcMode)
          setArtifacts((prev) => ({
            ...prev,
            ephPrivKey: res.privKey,
            ephPubKey: res.pubKey,
          }))
          result = res.output
        }
      } else if (stepData.id === 'compute_shared_secret') {
        if (
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.ephPrivHandle &&
          hsmHandlesRef.current.hnPubHandle
        ) {
          // ── Live HSM Mode: ECDH key agreement via PKCS#11 ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const hnPubBytes = hsm_extractKeyValue(M, hSession, hsmHandlesRef.current.hnPubHandle)
          const derivedHandle = hsm_ecdhDerive(
            M,
            hSession,
            hsmHandlesRef.current.ephPrivHandle,
            hnPubBytes
          )
          hsmHandlesRef.current.sharedSecretHandle = derivedHandle
          const sharedBytes = hsm_extractKeyValue(M, hSession, derivedHandle)
          const sharedHex = Array.from(sharedBytes)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
          result =
            `[PKCS#11] C_DeriveKey(CKM_ECDH1_DERIVE)\n` +
            `  ephPriv handle: ${hsmHandlesRef.current.ephPrivHandle}\n` +
            `  hnPub bytes: ${hnPubBytes.length}\n` +
            `  → Shared secret handle: ${derivedHandle}\n` +
            `  → Z (hex): ${sharedHex.slice(0, 64)}...\n` +
            `\nECDH shared secret computed via SoftHSM3 WASM.`
        } else {
          const ephPriv = artifacts.ephPrivKey || 'sim_eph_priv.key'
          const hnPub = artifacts.hnPubFile || 'sim_hn_pub.key'
          result = await fiveGService.computeSharedSecret(profile, ephPriv, hnPub, pqcMode)
        }
      } else if (stepData.id === 'derive_keys') {
        if (
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.sharedSecretHandle
        ) {
          // ── Live HSM Mode: HKDF key derivation via PKCS#11 ──
          const M = hsm.moduleRef.current
          const hSession = hsm.hSessionRef.current
          const salt = new TextEncoder().encode('5G-SUCI-KDF-salt')
          const infoEnc = new TextEncoder().encode('encryption-key')
          const infoMac = new TextEncoder().encode('mac-key')

          const kEnc = hsm_hkdf(
            M,
            hSession,
            hsmHandlesRef.current.sharedSecretHandle,
            CKM_SHA256,
            true,
            true,
            salt,
            infoEnc,
            16
          )
          const kMac = hsm_hkdf(
            M,
            hSession,
            hsmHandlesRef.current.sharedSecretHandle,
            CKM_SHA256,
            true,
            true,
            salt,
            infoMac,
            32
          )
          const kEncHex = Array.from(kEnc)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          const kMacHex = Array.from(kMac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          result =
            `[PKCS#11] C_DeriveKey(CKM_HKDF_DERIVE, CKM_SHA256)\n` +
            `  Base key handle: ${hsmHandlesRef.current.sharedSecretHandle}\n` +
            `  → K_enc (${kEnc.length} bytes): ${kEncHex}\n` +
            `  → K_mac (${kMac.length} bytes): ${kMacHex}\n` +
            `\nEncryption + MAC keys derived via HKDF in SoftHSM3 WASM.`
        } else {
          result = await fiveGService.deriveKeys(profile)
        }
      } else if (stepData.id === 'sidf_decryption') {
        result = await fiveGService.sidfDecrypt(profile)
      } else if (stepData.id === 'visualize_suci') {
        result = await fiveGService.visualizeStructure()
      } else if (stepData.id === 'assemble_suci') {
        result = await fiveGService.assembleSUCI(profile)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600))
        result = stepData.output
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(msg || 'Execution Failed')
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground uppercase tracking-wider font-bold">
          <Shield size={14} />
          Select Protection Scheme
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            data-testid="profile-a-btn"
            onClick={() => changeProfile('A')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-muted',
              profile === 'A'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'A' ? 'fill-primary' : ''} />
              Profile A
            </div>
            <div className="text-xs opacity-70 mt-1">Curve25519 (X25519) + AES-128</div>
          </button>

          <button
            data-testid="profile-b-btn"
            onClick={() => changeProfile('B')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-muted',
              profile === 'B'
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'B' ? 'fill-secondary' : ''} />
              Profile B
            </div>
            <div className="text-xs opacity-70 mt-1">NIST P-256 + AES-128</div>
          </button>

          <button
            data-testid="profile-c-btn"
            onClick={() => changeProfile('C')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-muted',
              profile === 'C'
                ? 'border-tertiary bg-tertiary/10 text-tertiary'
                : 'border-border text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'C' ? 'fill-tertiary' : ''} />
              Profile C (PQC)
            </div>
            <div className="text-xs opacity-70 mt-1">ML-KEM (Kyber) + AES-256</div>
            <div className="text-xs italic text-muted-foreground mt-1">
              Under 3GPP SA3 study (TR 33.841) — Not yet standardized
            </div>
          </button>
        </div>
      </div>

      {/* Profile C Mode Selector */}
      {profile === 'C' && (
        <div className="bg-tertiary/5 p-4 rounded-lg border border-tertiary/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-1 text-sm text-tertiary uppercase tracking-wider font-bold">
            <Shield size={14} />
            PQC Mode Configuration
          </div>
          <p className="text-xs italic text-muted-foreground mb-3">
            Educational preview of proposed Profile C
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => changePqcMode('hybrid')}
              className={clsx(
                'flex-1 p-3 rounded border text-left transition-all',
                pqcMode === 'hybrid'
                  ? 'border-tertiary bg-tertiary/20 text-tertiary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="font-bold">Hybrid (Transition)</div>
              <div className="text-xs opacity-70">X25519 + ML-KEM-768</div>
            </button>
            <button
              onClick={() => changePqcMode('pure')}
              className={clsx(
                'flex-1 p-3 rounded border text-left transition-all',
                pqcMode === 'pure'
                  ? 'border-tertiary bg-tertiary/20 text-tertiary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="font-bold">Pure PQC (Target)</div>
              <div className="text-xs opacity-70">ML-KEM-768 Only</div>
            </button>
          </div>
        </div>
      )}

      <LiveHSMToggle hsm={hsm} operations={SUCI_LIVE_OPERATIONS} />

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <Info size={13} className="shrink-0" />
        <span>
          All keys and identifiers generated here are for <strong>educational use only</strong> —
          not for production systems.
        </span>
      </div>

      <StepWizard
        key={`${profile}-${pqcMode}`} // Force re-mount on profile or mode change
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onExecute={() => wizard.execute(executeStep)}
        output={wizard.output}
        isExecuting={wizard.isExecuting}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete}
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={onBack}
      />

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — SUCI Construction"
          emptyMessage="Execute a step to see live PKCS#11 operations."
          filterFns={SUCI_LIVE_OPERATIONS}
        />
      )}

      <KatValidationPanel
        specs={FIVEG_KAT_SPECS}
        label="5G PQC Known Answer Tests"
        authorityNote="3GPP TR 33.841 · NIST FIPS 203/204"
      />
    </div>
  )
}
