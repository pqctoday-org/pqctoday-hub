import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Trash2, Shield, FileText, PenTool, Building2, CheckSquare } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { WalletComponent } from './components/Wallet/WalletComponent'
import { PIDIssuerComponent } from './components/PIDIssuer/PIDIssuerComponent'
import { AttestationIssuerComponent } from './components/AttestationIssuer/AttestationIssuerComponent'
import { QESProviderComponent } from './components/QESProvider/QESProviderComponent'
import { RelyingPartyComponent } from './components/RelyingParty/RelyingPartyComponent'
import { OverviewComponent } from './components/Overview/OverviewComponent'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import type { WalletInstance, CryptoKey, VerifiableCredential } from './types'

const MODULE_ID = 'digital-id'

// Initial State
const INITIAL_WALLET: WalletInstance = {
  id: 'wallet-001',
  owner: {
    legalName: 'María Elena García',
    birthDate: '1990-03-15',
    nationality: 'ES',
    address: 'Calle Mayor 42, 28013 Madrid',
  },
  keys: [],
  credentials: [],
  history: [],
}

// Metadata for workshop step navigation
const WORKSHOP_STEPS = [
  {
    id: 'wallet',
    title: 'Step 1: EUDI Wallet',
    description: 'View your credentials and secure keys.',
    icon: Shield,
  },
  {
    id: 'pid-issuer',
    title: 'Step 2: PID Issuer',
    description: 'Issue your National Digital ID (PID).',
    icon: FileText,
  },
  {
    id: 'attestation',
    title: 'Step 3: University',
    description: 'Issue Diploma attestation (requires PID).',
    icon: CheckSquare,
  },
  {
    id: 'relying-party',
    title: 'Step 4: Bank (RP)',
    description: 'Verify your ID to open an account.',
    icon: Building2,
  },
  {
    id: 'qes',
    title: 'Step 5: QTSP (QES)',
    description: 'Sign documents digitally.',
    icon: PenTool,
  },
]

export const DigitalIDModule: React.FC = () => {
  const resetModuleProgress = useModuleStore((state) => state.resetModuleProgress)
  const updateModuleProgress = useModuleStore((state) => state.updateModuleProgress)
  const markStepComplete = useModuleStore((state) => state.markStepComplete)

  const [activeTab, setActiveTab] = useState('learn')
  const [currentStep, setCurrentStep] = useState(0)
  const [wallet, setWallet] = useState<WalletInstance>(INITIAL_WALLET)
  const prevStepRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)

  // Mark module in-progress on mount and track time spent
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsed = (Date.now() - startTimeRef.current) / 60000
      if (elapsed > 0) {
        const current = useModuleStore.getState().modules[MODULE_ID]
        updateModuleProgress(MODULE_ID, {
          timeSpent: (current?.timeSpent || 0) + elapsed,
        })
      }
    }
  }, [updateModuleProgress])

  // Track tab visits as completed steps
  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  // Navigate from Learn tab to Workshop
  const navigateToWorkshop = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

  // Mark the previous workshop step complete whenever the user navigates
  useEffect(() => {
    if (prevStepRef.current !== null) {
      const prevId = WORKSHOP_STEPS[prevStepRef.current]?.id
      if (prevId) markStepComplete(MODULE_ID, prevId)
    }
    prevStepRef.current = currentStep
  }, [currentStep, markStepComplete])

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the module? This will clear all generated keys and credentials.'
      )
    ) {
      resetModuleProgress(MODULE_ID)
      const { resetStore } = useOpenSSLStore.getState()
      resetStore()
      setWallet(INITIAL_WALLET)
      setCurrentStep(0)
    }
  }

  // --- Actions ---
  const handleCredentialIssued = (cred: VerifiableCredential, key: CryptoKey) => {
    setWallet((prev) => ({
      ...prev,
      credentials: [...prev.credentials, cred],
      keys: prev.keys.some((k) => k.id === key.id) ? prev.keys : [...prev.keys, key],
      history: [
        ...prev.history,
        {
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          type: 'ISSUANCE',
          actor: cred.issuer,
          details: `Issued ${cred.type.join(', ')}`,
          status: 'SUCCESS',
        },
      ],
    }))
  }

  const navigateTo = useCallback((stepId: string) => {
    const idx = WORKSHOP_STEPS.findIndex((s) => s.id === stepId)
    if (idx !== -1) setCurrentStep(idx)
  }, [])

  // Components mapping for workshop steps
  const currentStepComponent = useMemo(() => {
    /* eslint-disable-next-line security/detect-object-injection */
    const step = WORKSHOP_STEPS[currentStep]
    if (!step) return null

    switch (step.id) {
      case 'wallet':
        return <WalletComponent wallet={wallet} onAddCredential={() => navigateTo('pid-issuer')} />
      case 'pid-issuer':
        return (
          <PIDIssuerComponent
            wallet={wallet}
            onCredentialIssued={handleCredentialIssued}
            onBack={() => navigateTo('wallet')}
          />
        )
      case 'attestation':
        return (
          <AttestationIssuerComponent
            wallet={wallet}
            onCredentialIssued={handleCredentialIssued}
            onBack={() => navigateTo('wallet')}
          />
        )
      case 'relying-party':
        return <RelyingPartyComponent wallet={wallet} onBack={() => navigateTo('wallet')} />
      case 'qes':
        return <QESProviderComponent wallet={wallet} onBack={() => navigateTo('wallet')} />
      default:
        return null
    }
  }, [currentStep, wallet, navigateTo])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">EUDI Digital Identity Wallet</h1>
          <p className="text-muted-foreground mt-2">
            Explore the European Digital Identity ecosystem: Issuance, Presentation, and Signing.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          <OverviewComponent onNavigateTo={(_stepId) => navigateToWorkshop()} />
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            {/* Reset button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
              >
                <Trash2 size={16} />
                Reset Workshop
              </button>
            </div>

            {/* Step Progress */}
            <div className="overflow-x-auto px-2 sm:px-0">
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {WORKSHOP_STEPS.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = currentStep === idx
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(idx)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        isActive
                          ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                          : idx < currentStep
                            ? 'bg-success/10 border-success text-success'
                            : 'bg-transparent border-border text-muted-foreground hover:bg-muted/10'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="font-medium hidden sm:inline">
                        {step.title.split(':')[1]?.trim()}
                      </span>
                      <span className="font-medium sm:hidden">{idx + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="glass-panel p-1 animate-fade-in min-h-0 overflow-y-auto">
              {currentStepComponent}
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50 transition-colors text-foreground"
              >
                &larr; Previous Step
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(WORKSHOP_STEPS.length - 1, currentStep + 1))}
                disabled={currentStep === WORKSHOP_STEPS.length - 1}
                className="px-6 py-3 min-h-[44px] bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Next Step &rarr;
              </button>
            </div>

            <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">
              <p>
                This is an educational simulation of the EUDI Wallet Architecture and Reference
                Framework (ARF). Cryptographic keys are generated in-browser using WebCrypto/WASM
                (OpenSSL) and stored in memory.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Complete the Workshop steps, then answer these questions to check your understanding
              of the EUDI Wallet and eIDAS 2.0 ecosystem.
            </p>

            {[
              {
                q: 'What is the role of the PID Issuer in the EUDI Wallet ecosystem?',
                hint: 'The PID Issuer authenticates the citizen and issues a Person Identification Data (PID) credential — the foundational credential that other attestations can build upon.',
              },
              {
                q: 'Why does the University require a valid PID before issuing a Diploma attestation?',
                hint: "The University (as an attestation issuer) needs to verify the holder's identity before binding a diploma to them. The PID credential proves identity within the trust framework.",
              },
              {
                q: 'What is the difference between a Verifiable Credential (VC) and a Qualified Electronic Signature (QES)?',
                hint: 'A VC is a tamper-evident digital credential about an identity attribute (e.g., diploma). A QES is a digital signature with the legal equivalent of a handwritten signature under eIDAS 2.0.',
              },
              {
                q: 'How does the Relying Party (Bank) verify your identity without receiving your raw credential data?',
                hint: 'Using selective disclosure and cryptographic proofs, the wallet presents only the required attributes (e.g., age, name) without exposing the full credential — preserving privacy.',
              },
              {
                q: 'What PQC algorithms could replace the current signature schemes used in EUDI Wallet credentials?',
                hint: 'ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) are the NIST-standardized PQC signature schemes. They can replace ECDSA/EdDSA in credential issuance and QES signing.',
              },
            ].map((exercise, idx) => (
              <div key={idx} className="glass-panel p-6">
                <p className="font-semibold text-foreground mb-3">
                  {idx + 1}. {exercise.q}
                </p>
                <details className="text-sm text-muted-foreground cursor-pointer">
                  <summary className="text-primary hover:underline cursor-pointer select-none">
                    Show hint
                  </summary>
                  <p className="mt-2 leading-relaxed pl-4 border-l-2 border-primary/30">
                    {exercise.hint}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
