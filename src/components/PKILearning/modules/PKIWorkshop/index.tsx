// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import {
  Trash2,
  FileKey,
  Key,
  ShieldCheck,
  FilePlus,
  Shield,
  FileCheck,
  FileSearch,
  XCircle,
  GitBranch,
  Globe,
  BarChart2,
  ChevronDown,
} from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { PKIIntroduction } from './components/PKIIntroduction'
import { PKIExercises } from './components/PKIExercises'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { CSRGenerator } from './CSRGenerator'
import { RootCAGenerator } from './RootCAGenerator'
import { CertSigner } from './CertSigner'
import { CertParser } from './CertParser'
import { CRLGenerator } from './CRLGenerator'
import { MTCComparison } from './MTCComparison'
import { AcmePqcWalkthrough } from './AcmePqcWalkthrough'
import { ScrollFadeContainer } from '@/components/ui/ScrollFadeContainer'
import { CertCapacityCalculator } from './CertCapacityCalculator'
import { ModuleShell } from '@/components/PKILearning/common/ModuleShell'
import { Button } from '@/components/ui/button'
import { PlaygroundNextStep } from '@/components/Playground/components/PlaygroundNextStep'
import manifest from './manifest'
import { clampStep } from '@/utils/clampStep'

const ARTIFACT_GROUPS = [
  {
    key: 'csrs' as const,
    label: 'CSRs',
    Icon: FileKey,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  {
    key: 'keys' as const,
    label: 'Keys',
    Icon: ShieldCheck,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/10',
  },
  {
    key: 'certs' as const,
    label: 'Certs',
    Icon: Key,
    colorClass: 'text-status-success',
    bgClass: 'bg-status-success/10',
  },
]

const ArtifactSummaryStrip: React.FC = () => {
  const { artifacts } = useModuleStore()
  const [expanded, setExpanded] = useState(false)

  const csrs = artifacts.csrs
  const keys = artifacts.keys
  const certs = artifacts.certificates
  const total = csrs.length + keys.length + certs.length

  if (total === 0) return null

  const groups = [
    {
      ...ARTIFACT_GROUPS[0],
      items: csrs.map((c) => ({ id: c.id, name: c.name, detail: '' })),
    },
    {
      ...ARTIFACT_GROUPS[1],
      items: keys.map((k) => ({ id: k.id, name: k.name, detail: k.algorithm })),
    },
    {
      ...ARTIFACT_GROUPS[2],
      items: certs.map((c) => ({ id: c.id, name: c.name, detail: '' })),
    },
  ]

  return (
    <div className="mb-4 rounded-lg border border-border bg-muted/30 overflow-hidden">
      {/* Summary bar — always visible */}
      <Button
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left h-auto rounded-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-2">
            Session Artifacts
          </span>
          {groups.map((g) => (
            <div
              key={g.label}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${g.bgClass}`}
            >
              <g.Icon size={11} className={g.colorClass} />
              <span className={`text-xs font-bold ${g.colorClass}`}>{g.items.length}</span>
              <span className="text-xs text-muted-foreground">{g.label}</span>
            </div>
          ))}
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform shrink-0 ml-2 ${expanded ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* Expanded grouped panel */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">
          {groups.map((g) => (
            <div key={g.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <g.Icon size={12} className={g.colorClass} />
                <span className="text-xs font-semibold text-foreground">{g.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{g.items.length}</span>
              </div>
              {g.items.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 italic">None yet</p>
              ) : (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {g.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 min-w-0"
                      title={item.name}
                    >
                      <span className="text-xs font-mono text-foreground/80 truncate">
                        {item.name}
                      </span>
                      {item.detail && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          · {item.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const MODULE_ID = 'pki-workshop'

const ALL_PARTS = [
  {
    id: 'csr',
    title: 'Step 1: Generate CSR',
    description: 'Create a Certificate Signing Request using a key pair.',
    icon: FilePlus,
  },
  {
    id: 'root-ca',
    title: 'Step 2: Create Root CA',
    description: 'Generate a self-signed Root Certificate Authority.',
    icon: Shield,
  },
  {
    id: 'sign',
    title: 'Step 3: Certificate Issuance',
    description: 'Use your Root CA to sign the CSR from Step 1.',
    icon: FileCheck,
  },
  {
    id: 'parse',
    title: 'Step 4: Parse Certificate',
    description: 'Inspect the details of your generated certificate.',
    icon: FileSearch,
  },
  {
    id: 'revoke',
    title: 'Step 5: Revocation (CRL)',
    description: 'Generate an empty Certificate Revocation List (CRL) for your Root CA.',
    icon: XCircle,
  },
  {
    id: 'mtc',
    title: 'Step 6: MTC Comparison',
    description: 'Compare traditional certificate chains with Merkle Tree Certificates.',
    icon: GitBranch,
  },
  {
    id: 'acme',
    title: 'Step 7: ACME + PQC',
    description:
      'Explore simulated ACME transport and generate a real ML-DSA-65 sample CSR with its matching public key.',
    icon: Globe,
  },
  {
    id: 'capacity',
    title: 'Step 8: Cert Capacity',
    description:
      'Estimate certificate-related TLS payload and annual leaf issuance storage for classical and PQC chains (no CPU prediction).',
    icon: BarChart2,
  },
]

interface PKIWorkshopProps {
  /** When true: renders only the 5-step workshop panel (no module tabs, no Step 6+). */
  playgroundMode?: boolean
  initialStep?: number
}

export const PKIWorkshop: React.FC<PKIWorkshopProps> = ({
  playgroundMode = false,
  initialStep = 0,
}) => {
  const parts = playgroundMode ? ALL_PARTS.slice(0, 5) : ALL_PARTS

  // Learn uses the shell's step state, including its URL and embedded step.
  // The standalone five-step Playground keeps its own local state.
  const [playgroundStep, setPlaygroundStep] = useState(() => clampStep(initialStep, parts.length))
  const { updateModuleProgress, markStepComplete, resetModuleProgress } = useModuleStore()
  const [workshopRevision, setWorkshopRevision] = useState(0)
  const completedSteps = useModuleStore((state) => state.modules[MODULE_ID]?.completedSteps)
  const earlierStepsRecorded = parts.slice(0, -1).every((part) => completedSteps?.includes(part.id))
  const allStepsRecorded = parts.every((part) => completedSteps?.includes(part.id))

  const recordStep = (stepIndex: number) => {
    const part = ALL_PARTS.at(stepIndex)
    if (!part) return
    if (!useModuleStore.getState().modules[MODULE_ID]) {
      updateModuleProgress(MODULE_ID, {})
    }
    markStepComplete(MODULE_ID, part.id, stepIndex)
  }

  const renderWorkshopPanel = (currentStep: number, setCurrentStep: (step: number) => void) => {
    const handlePartChange = (newStep: number) => {
      if (newStep > currentStep) recordStep(currentStep)
      setCurrentStep(newStep)
    }

    const handleReset = () => {
      if (confirm('Reset PKI workshop progress and return to the first exercise?')) {
        resetModuleProgress(MODULE_ID)
        setCurrentStep(0)
        setWorkshopRevision((revision) => revision + 1)
      }
    }

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reset button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-status-error rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
          >
            <Trash2 size={16} />
            Reset
          </Button>
        </div>

        {/* Part Progress Steps */}
        <ScrollFadeContainer
          scrollClassName="px-2 sm:px-0"
          showScrollHint
          scrollProps={{ role: 'navigation', 'aria-label': 'PKI workshop steps' }}
        >
          <div className="flex justify-evenly relative min-w-0">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

            {parts.map((part, idx) => {
              const Icon = part.icon
              return (
                <Button
                  variant="ghost"
                  key={part.id}
                  onClick={() => setCurrentStep(idx)}
                  aria-label={part.title}
                  aria-current={idx === currentStep ? 'step' : undefined}
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
                  <span className="block max-w-[68px] truncate text-[11px] font-medium leading-tight sm:max-w-none sm:text-sm">
                    {part.title.split(':')[0]}
                  </span>
                </Button>
              )
            })}
          </div>
        </ScrollFadeContainer>

        {/* Content Area */}
        <div
          key={workshopRevision}
          className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in"
        >
          <WorkshopStepHeader
            moduleId={MODULE_ID}
            stepId={parts[currentStep].id}
            stepTitle={parts[currentStep].title}
            stepDescription={parts[currentStep].description}
            stepIndex={currentStep}
            totalSteps={parts.length}
            steps={parts.map((p) => ({ id: p.id, label: p.title }))}
            onStepClick={setCurrentStep}
          />

          <ArtifactSummaryStrip />

          {currentStep === 0 && <CSRGenerator onComplete={() => recordStep(0)} />}
          {currentStep === 1 && <RootCAGenerator onComplete={() => recordStep(1)} />}
          {currentStep === 2 && <CertSigner onComplete={() => recordStep(2)} />}
          {currentStep === 3 && <CertParser onComplete={() => recordStep(3)} />}
          {currentStep === 4 && <CRLGenerator onComplete={() => recordStep(4)} />}
          {currentStep === 5 && <MTCComparison onComplete={() => recordStep(5)} />}
          {currentStep === 6 && <AcmePqcWalkthrough />}
          {currentStep === 7 && <CertCapacityCalculator />}
        </div>

        {/* Part Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => handlePartChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
          >
            &larr; Previous Step
          </Button>
          {currentStep === parts.length - 1 ? (
            <div className="space-y-2 sm:text-right">
              <Button
                variant="gradient"
                onClick={() => recordStep(currentStep)}
                disabled={!earlierStepsRecorded || allStepsRecorded}
                className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
              >
                {allStepsRecorded ? 'Workshop steps recorded' : 'Finish workshop'}
              </Button>
              {!earlierStepsRecorded && (
                <p className="text-xs text-muted-foreground">
                  Review the earlier workshop steps to finish this section.
                </p>
              )}
            </div>
          ) : (
            <Button
              variant="gradient"
              onClick={() => handlePartChange(Math.min(parts.length - 1, currentStep + 1))}
              className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
            >
              Next Step &rarr;
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Playground embed: the 5-step workshop stands alone (no tabs/header) plus a
  // hand-off to the capacity calculator.
  if (playgroundMode) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Browser learning sandbox — keys and certificates are generated in-memory via OpenSSL WASM
          and must not be used in production. Verify CA policy, HSM key protection, and chain
          validation with your production PKI tools.
        </p>
        {renderWorkshopPanel(playgroundStep, setPlaygroundStep)}
        <PlaygroundNextStep
          toolId="cert-capacity"
          name="Cert Capacity Calculator"
          description="Estimate certificate-related TLS payload and annual leaf issuance storage for classical and PQC chains (no CPU prediction)."
        />
      </div>
    )
  }

  return (
    <ModuleShell
      manifest={manifest}
      title="PKI Workshop"
      description={
        <>
          Learn PKI fundamentals, build certificate chains hands-on, and explore PQC migration.
          <span className="block text-xs text-muted-foreground mt-1">
            Learning sandbox — private keys are stored in your browser and should not be used in
            production.
          </span>
        </>
      }
      learn={(api) => <PKIIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
      workshop={(api) => renderWorkshopPanel(api.currentWorkshopStep, api.selectWorkshopStep)}
      exercises={(api) => (
        <PKIExercises
          onNavigateToWorkshop={() => api.goToWorkshop()}
          onSetWorkshopStep={api.selectWorkshopStep}
        />
      )}
    />
  )
}
