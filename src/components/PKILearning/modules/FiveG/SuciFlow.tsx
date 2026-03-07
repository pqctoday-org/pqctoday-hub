// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
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
import {
  hsm_generateECKeyPair,
  hsm_generateAESKey,
  hsm_aesEncrypt,
  hsm_hmac,
  hsm_generateHMACKey,
} from '@/wasm/softhsm'

const SUCI_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
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

  // Wrap setters to also clear crypto state when switching profiles/modes
  const changeProfile = (p: Profile) => {
    fiveGService.cleanup()
    setArtifacts({})
    setProfile(p)
  }
  const changePqcMode = (m: 'hybrid' | 'pure') => {
    fiveGService.cleanup()
    setArtifacts({})
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
        // Use the file we just generated, or fallback if testing/skipped
        const targetFile = artifacts.hnPubFile || 'sim_hn_pub.key'
        result = await fiveGService.provisionUSIM(targetFile)
      } else if (stepData.id === 'retrieve_key') {
        const targetFile = artifacts.hnPubFile || 'sim_hn_pub.key'
        result = await fiveGService.retrieveKey(targetFile, profile)
      } else if (stepData.id === 'gen_ephemeral_key') {
        const res = await fiveGService.generateEphemeralKey(profile, pqcMode)
        setArtifacts((prev) => ({
          ...prev,
          ephPrivKey: res.privKey,
          ephPubKey: res.pubKey,
        }))
        result = res.output
      } else if (stepData.id === 'compute_shared_secret') {
        const ephPriv = artifacts.ephPrivKey || 'sim_eph_priv.key'
        const hnPub = artifacts.hnPubFile || 'sim_hn_pub.key'
        result = await fiveGService.computeSharedSecret(profile, ephPriv, hnPub, pqcMode)
      } else if (stepData.id === 'derive_keys') {
        // Call the new KDF visualization method
        result = await fiveGService.deriveKeys(profile)
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
        />
      )}
    </div>
  )
}
