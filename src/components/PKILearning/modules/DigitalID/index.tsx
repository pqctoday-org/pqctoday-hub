import React, { useState, useMemo, useEffect } from 'react'
import { Trash2, Shield, FileText, PenTool, Building2, CheckSquare } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { WalletComponent } from './components/Wallet/WalletComponent'
import { PIDIssuerComponent } from './components/PIDIssuer/PIDIssuerComponent'
import { AttestationIssuerComponent } from './components/AttestationIssuer/AttestationIssuerComponent'
import { QESProviderComponent } from './components/QESProvider/QESProviderComponent'
import { RelyingPartyComponent } from './components/RelyingParty/RelyingPartyComponent'
import type { WalletInstance, CryptoKey, VerifiableCredential } from './types'

// Initial State
const INITIAL_WALLET: WalletInstance = {
  id: 'wallet-001',
  owner: {
    legalName: 'Garcia Rossi',
    birthDate: '1985-05-12',
    nationality: 'ES',
    address: 'Calle Mayor 5, Madrid',
  },
  keys: [],
  credentials: [],
  history: [],
}

// Metadata for navigation
const STEPS_INFO = [
  {
    id: 'wallet',
    title: 'EUDI Wallet',
    description: 'View your credentials and secure keys.',
    icon: Shield,
  },
  {
    id: 'pid-issuer',
    title: 'PID Issuer',
    description: 'Issue your National Digital ID (PID).',
    icon: FileText,
  },
  {
    id: 'attestation',
    title: 'University',
    description: 'Issue Diploma (requires PID).',
    icon: CheckSquare,
  },
  {
    id: 'relying-party',
    title: 'Bank (RP)',
    description: 'Verify your ID to open an account.',
    icon: Building2,
  },
  {
    id: 'qes',
    title: 'QTSP (QES)',
    description: 'Sign documents digitally.',
    icon: PenTool,
  },
]

export const DigitalIDModule: React.FC = () => {
  const resetProgress = useModuleStore((state) => state.resetProgress)
  const updateModuleProgress = useModuleStore((state) => state.updateModuleProgress)

  const [currentStep, setCurrentStep] = useState(0)
  const [wallet, setWallet] = useState<WalletInstance>(INITIAL_WALLET)

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      const currentSpent = useModuleStore.getState().modules['digital-id']?.timeSpent || 0
      updateModuleProgress('digital-id', {
        timeSpent: currentSpent + 1,
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [updateModuleProgress])

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the module? This will clear all generated keys and credentials.'
      )
    ) {
      resetProgress()
      setWallet(INITIAL_WALLET)
      setCurrentStep(0)
    }
  }

  // --- Actions ---
  const handleCredentialIssued = (cred: VerifiableCredential, key: CryptoKey) => {
    setWallet((prev) => ({
      ...prev,
      credentials: [...prev.credentials, cred],
      keys: prev.keys.some((k) => k.id === key.id) ? prev.keys : [...prev.keys, key], // Add key if new
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

  const navigateTo = React.useCallback((stepId: string) => {
    const idx = STEPS_INFO.findIndex((s) => s.id === stepId)
    if (idx !== -1) setCurrentStep(idx)
  }, [])

  // Components mapping
  const currentStepComponent = useMemo(() => {
    /* eslint-disable-next-line security/detect-object-injection */
    const step = STEPS_INFO[currentStep]
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
    <div className="max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">EUDI Digital Identity Wallet</h1>
          <p className="text-muted-foreground">
            Explore the European Digital Identity ecosystem: Issuance, Presentation, and Signing.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset Module
        </button>
      </div>

      {/* Progress Indicator reuse if available, otherwise simplified tabs */}
      {/* If ProgressIndicator expects specific props, we might need to adjust. Assuming it's visual only */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {STEPS_INFO.map((step, idx) => {
            const Icon = step.icon
            const isActive = currentStep === idx
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  isActive
                    ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                    : 'bg-transparent border-border text-muted-foreground hover:bg-muted/10'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium">{step.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="glass-panel p-1 animate-fade-in min-h-[600px]">
        {/* Note: glass-panel likely has styles. Passing p-1 just in case, components have their own cards */}
        {}
        {currentStepComponent}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
        <p>
          This is an educational simulation of the EUDI Wallet Architecture and Reference Framework
          (ARF).
        </p>
        <p>
          Cryptographic keys are generated in-browser using WebCrypto/WASM (OpenSSL) and stored in
          memory.
        </p>
      </div>
    </div>
  )
}
