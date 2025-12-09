import React, { useState, useEffect } from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { FiveGDiagram } from './components/FiveGDiagram'
import { fiveGService } from './services/FiveGService'
import { Shield, Radio } from 'lucide-react'
import clsx from 'clsx'

interface SuciFlowProps {
  onBack: () => void
}

type Profile = 'A' | 'B' | 'C'

export const SuciFlow: React.FC<SuciFlowProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<Profile>('A')
  const [pqcMode, setPqcMode] = useState<'hybrid' | 'pure'>('hybrid')

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
        const res = await fiveGService.generateNetworkKey(profile, pqcMode)
        // Store the dynamic filenames for later steps
        setArtifacts((prev) => ({
          ...prev,
          hnPubFile: res.pubKeyFile,
          hnPrivFile: res.privKeyFile,
        }))
        result = res.output
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
      } else if (stepData.id === 'encrypt_msin') {
        result = await fiveGService.encryptMSIN()
      } else if (stepData.id === 'compute_mac') {
        result = await fiveGService.computeMAC()
      } else if (stepData.id === 'sidf_decryption') {
        result = await fiveGService.sidfDecrypt(profile)
      } else if (stepData.id === 'visualize_suci') {
        result = await fiveGService.visualizeStructure()
      } else {
        // Fallback for steps not yet fully dynamic
        await new Promise((resolve) => setTimeout(resolve, 600))
        result = stepData.output + '\n(Dynamic execution pending for this step)'
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

  // Reset wizard when profile changes
  useEffect(() => {
    // We can't easily reset the internal hook state without re-mounting or adding a reset to the hook
    // For now, key-based re-mounting is simplest strategy in the parent,
    // but here we can just accept that changing profile resets if we force it.
    // To handle proper reset, we might need to modify useStepWizard or just remount this component.
    // However, useStepWizard doesn't export a setStep.
    // Let's rely on the user manually restarting or just re-rendering the wizard with new steps.
    // Actually, if steps change, StepWizard usually needs a reset.
    // Let's check typical behavior. The hook likely initializes state once.
  }, [profile])

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground uppercase tracking-wider font-bold">
          <Shield size={14} />
          Select Protection Scheme
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            data-testid="profile-a-btn"
            onClick={() => setProfile('A')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-white/5',
              profile === 'A'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/10 text-muted-foreground'
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
            onClick={() => setProfile('B')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-white/5',
              profile === 'B'
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-white/10 text-muted-foreground'
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
            onClick={() => setProfile('C')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-white/5',
              profile === 'C'
                ? 'border-purple-400 bg-purple-500/10 text-purple-400'
                : 'border-white/10 text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'C' ? 'fill-purple-400' : ''} />
              Profile C (PQC)
            </div>
            <div className="text-xs opacity-70 mt-1">ML-KEM (Kyber) + AES-256</div>
          </button>
        </div>
      </div>

      {/* Profile C Mode Selector */}
      {profile === 'C' && (
        <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-3 text-sm text-purple-300 uppercase tracking-wider font-bold">
            <Shield size={14} />
            PQC Mode Configuration
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setPqcMode('hybrid')}
              className={clsx(
                'flex-1 p-3 rounded border text-left transition-all',
                pqcMode === 'hybrid'
                  ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                  : 'border-white/5 text-muted-foreground hover:bg-white/5'
              )}
            >
              <div className="font-bold">Hybrid (Transition)</div>
              <div className="text-xs opacity-70">X25519 + ML-KEM-768</div>
            </button>
            <button
              onClick={() => setPqcMode('pure')}
              className={clsx(
                'flex-1 p-3 rounded border text-left transition-all',
                pqcMode === 'pure'
                  ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                  : 'border-white/5 text-muted-foreground hover:bg-white/5'
              )}
            >
              <div className="font-bold">Pure PQC (Target)</div>
              <div className="text-xs opacity-70">ML-KEM-768 Only</div>
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
}
