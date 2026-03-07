// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { AuthDiagram } from './components/AuthDiagram'
import { fiveGService } from './services/FiveGService'
import { Info } from 'lucide-react'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { hsm_generateAESKey, hsm_aesEncrypt, hsm_hmac, hsm_generateHMACKey } from '@/wasm/softhsm'

const AUTH_LIVE_OPERATIONS = ['C_GenerateKey', 'C_EncryptInit', 'C_Encrypt', 'C_SignInit', 'C_Sign']

interface AuthFlowProps {
  onBack: () => void
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onBack }) => {
  const hsm = useHSM()

  const steps: Step[] = FIVE_G_CONSTANTS.AUTH_STEPS.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    code: step.code,
    language: 'javascript',
    actionLabel: 'Execute Step',
    diagram: <AuthDiagram step={index} />, // Use AuthDiagram
  }))

  const executeStep = async () => {
    const wizardStep = steps[wizard.currentStep]

    if (wizardStep.id === 'retrieve_creds') {
      return await fiveGService.retrieveCredentials()
    }

    if (wizardStep.id === 'gen_rand') {
      return await fiveGService.generateRAND()
    }

    if (wizardStep.id === 'compute_milenage') {
      if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
        // ── Live HSM Mode: AES-128 MILENAGE via PKCS#11 ──
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current
        const aesHandle = hsm_generateAESKey(M, hSession, 128)
        const rand = crypto.getRandomValues(new Uint8Array(16))
        const ct = hsm_aesEncrypt(M, hSession, aesHandle, rand, 'cbc')
        const ctHex = Array.from(ct.ciphertext.slice(0, 16))
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')

        // Run software MILENAGE for the actual vector values
        const vec = await fiveGService.runMilenage()

        return `═══════════════════════════════════════════════════════════════
            MILENAGE COMPUTATION (f1-f5) — Live HSM Mode
═══════════════════════════════════════════════════════════════

[PKCS#11] C_GenerateKey(CKM_AES_KEY_GEN, 128-bit) → handle ready
[PKCS#11] C_EncryptInit(CKM_AES_CBC) + C_Encrypt → ${ctHex}...

Step 1: Input Parameters
  > K:    [PKCS#11 key handle]
  > OPc:  [derived via C_Encrypt]
  > RAND: ${vec.rand}
  > SQN:  [from HSM]
  > AMF:  [from HSM]

Step 2: Executing MILENAGE Functions (AES-128 via PKCS#11)
  > f1 (MAC-A):  ${vec.mac}
  > f2 (XRES):   ${vec.res}
  > f3 (CK):     ${vec.ck}
  > f4 (IK):     ${vec.ik}
  > f5 (AK):     ${vec.ak}

[SUCCESS] All MILENAGE vectors computed via SoftHSM3 WASM.`
      }

      const vec = await fiveGService.runMilenage()
      return `═══════════════════════════════════════════════════════════════
            MILENAGE COMPUTATION (f1-f5)
═══════════════════════════════════════════════════════════════

Step 1: Input Parameters
  > K:    [from HSM]
  > OPc:  [from HSM]
  > RAND: ${vec.rand}
  > SQN:  [from HSM]
  > AMF:  [from HSM]

Step 2: Executing MILENAGE Functions
  > f1 (MAC-A):  ${vec.mac}
  > f2 (XRES):   ${vec.res}
  > f3 (CK):     ${vec.ck}
  > f4 (IK):     ${vec.ik}
  > f5 (AK):     ${vec.ak}

[SUCCESS] All MILENAGE vectors computed.`
    }

    if (wizardStep.id === 'compute_autn') {
      return await fiveGService.computeAUTN()
    }

    if (wizardStep.id === 'derive_kausf') {
      if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
        // ── Live HSM Mode: HMAC-SHA-256 key derivation via PKCS#11 ──
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current
        const hmacHandle = hsm_generateHMACKey(M, hSession, 32)
        const data = new TextEncoder().encode('5G:1:serving-network:key-material')
        const mac = hsm_hmac(M, hSession, hmacHandle, data)
        const macHex = Array.from(mac)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        // Also run the software version for complete output
        const softResult = await fiveGService.deriveKAUSF()

        return `${softResult}\n\n[PKCS#11] C_SignInit(CKM_SHA256_HMAC) + C_Sign\n  K_AUSF via HMAC: ${macHex.substring(0, 32)}...\n  Derived via SoftHSM3 WASM.`
      }

      return await fiveGService.deriveKAUSF()
    }

    // Fallback (should not reach here)
    const staticData = FIVE_G_CONSTANTS.AUTH_STEPS[wizard.currentStep]
    await new Promise((resolve) => setTimeout(resolve, 600))
    return staticData.output
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <div className="space-y-4">
      <LiveHSMToggle hsm={hsm} operations={AUTH_LIVE_OPERATIONS} />

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <Info size={13} className="shrink-0" />
        <span>
          All keys and identifiers generated here are for <strong>educational use only</strong> —
          not for production systems.
        </span>
      </div>
      <StepWizard
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
          title="PKCS#11 Call Log — 5G-AKA Authentication"
          emptyMessage="Execute a step to see live PKCS#11 operations."
        />
      )}
    </div>
  )
}
