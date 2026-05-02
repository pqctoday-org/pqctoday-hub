// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Trash2, Shield, FileText, PenTool, Building2, CheckSquare } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { WalletComponent } from './components/Wallet/WalletComponent'
import { PIDIssuerComponent } from './components/PIDIssuer/PIDIssuerComponent'
import { AttestationIssuerComponent } from './components/AttestationIssuer/AttestationIssuerComponent'
import { QESProviderComponent } from './components/QESProvider/QESProviderComponent'
import { RelyingPartyComponent } from './components/RelyingParty/RelyingPartyComponent'
import { OverviewComponent } from './components/Overview/OverviewComponent'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import type { WalletInstance, CryptoKey, VerifiableCredential } from './types'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'
import { DigitalIDExercises } from './components/DigitalIDExercises'

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

export const DigitalIDModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const resetModuleProgress = useModuleStore((state) => state.resetModuleProgress)
  const updateModuleProgress = useModuleStore((state) => state.updateModuleProgress)
  const markStepComplete = useModuleStore((state) => state.markStepComplete)

  const deepLink = getModuleDeepLink({ maxStep: WORKSHOP_STEPS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentStep, setCurrentStep] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentStep)
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

  // Navigate to Workshop and jump to a specific step (used by exercises)
  const navigateToStep = useCallback(
    (stepIndex: number) => {
      setCurrentStep(stepIndex)
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab('workshop')
    },
    [activeTab, markStepComplete]
  )

  // Mark the previous workshop step complete whenever the user navigates
  useEffect(() => {
    if (prevStepRef.current !== null) {
      const prevId = WORKSHOP_STEPS[prevStepRef.current]?.id
      if (prevId) markStepComplete(MODULE_ID, prevId, prevStepRef.current)
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

  const workshopContent = (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-muted/10 p-4 border-b border-border rounded-t-xl mb-6">
        <h2 className="text-xl font-bold">EUDI Wallet Architecture</h2>
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-sm border border-border px-4 py-2 hover:bg-muted rounded text-muted-foreground transition-colors"
          >
            &larr; Back to Tools
          </Button>
        )}
      </div>
      <div className="flex justify-end min-h-[36px]">
        {(wallet.keys.length > 0 || wallet.credentials.length > 0) && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
          >
            <Trash2 size={16} />
            Reset
          </Button>
        )}
      </div>

      {/* Part Progress Steps */}
      <div className="overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-evenly relative min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

          {WORKSHOP_STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <Button
                variant="ghost"
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${idx === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${
                      idx === currentStep
                        ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                        : idx < currentStep
                          ? 'border-success text-success'
                          : 'border-border text-muted-foreground'
                    }`}
                >
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {step.title.split(':')[0]}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="glass-panel p-4 animate-fade-in min-h-[400px] md:min-h-[600px] overflow-y-auto">
        <WorkshopStepHeader
          moduleId={MODULE_ID}
          stepId={WORKSHOP_STEPS[currentStep].id}
          stepTitle={WORKSHOP_STEPS[currentStep].title}
          stepDescription={WORKSHOP_STEPS[currentStep].description}
          stepIndex={currentStep}
          totalSteps={WORKSHOP_STEPS.length}
        />
        {currentStepComponent}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
        >
          &larr; Previous Step
        </Button>
        {currentStep === WORKSHOP_STEPS.length - 1 ? (
          <Button
            variant="gradient"
            onClick={() => markStepComplete(MODULE_ID, WORKSHOP_STEPS[currentStep].id)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
          >
            Complete Module ✓
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={() => setCurrentStep(Math.min(WORKSHOP_STEPS.length - 1, currentStep + 1))}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
          >
            Next Step &rarr;
          </Button>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">
        <p>
          This is an educational simulation of the EUDI Wallet Architecture and Reference Framework
          (ARF). Cryptographic keys are generated in-browser using WebCrypto/WASM (OpenSSL) and
          stored in memory.
        </p>
      </div>
    </div>
  )

  if (onBack) {
    return workshopContent
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm transition-colors"
            >
              &larr; Back to Playground
            </Button>
          )}
          <h1 className="text-3xl font-bold text-gradient">EUDI Digital Identity Wallet</h1>

          <p className="text-muted-foreground mt-2">
            Explore the European Digital Identity ecosystem: Issuance, Presentation, and Signing.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="tools">Tools & Products</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <GlossaryAutoWrap>
            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
            <OverviewComponent onNavigateTo={(_stepId) => navigateToWorkshop()} />
          </GlossaryAutoWrap>
        </TabsContent>

        {/* Workshop Tab */}

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">{workshopContent}</TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <DigitalIDExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onNavigateToStep={navigateToStep}
          />
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
