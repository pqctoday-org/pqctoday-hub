// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Trash2, Shield, Lock, Server } from 'lucide-react'
import { SuciFlow } from './SuciFlow'
import { AuthFlow } from './AuthFlow'
import { ProvisioningFlow } from './ProvisioningFlow'
import { FiveGIntroduction } from './components/FiveGIntroduction'
import { FiveGExercises } from './components/FiveGExercises'
import type { SimulationConfig } from './components/FiveGExercises'
import { useModuleStore } from '@/store/useModuleStore'
import { ModuleShell } from '@/components/PKILearning/common/ModuleShell'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { Button } from '@/components/ui/button'
import manifest from './manifest'

const MODULE_ID = '5g-security'

const PARTS = [
  {
    id: 'suci',
    title: 'Part 1: SUCI Deconcealment',
    // "Profile C" is named here because the workshop walks through it, but it is NOT a
    // 3GPP profile — TS 33.501 Annex C defines null-scheme, Profile A and Profile B only,
    // both ECIES. The label carries the qualifier so a reader meeting it in the tab
    // strip is not misled before reaching the explanation.
    description: 'Subscriber Privacy: ECIES (Profile A/B) & KEM (proposed Profile C).',
    icon: Shield,
  },
  {
    id: 'auth',
    title: 'Part 2: 5G-AKA Authentication',
    description: 'Mutual Authentication & MILENAGE Algorithm.',
    icon: Lock,
  },
  {
    id: 'provisioning',
    title: 'Part 3: SIM Key Provisioning',
    description: 'Supply Chain Security & Key Lifecycle.',
    icon: Server,
  },
]

export const FiveGModule: React.FC = () => {
  // Inbound 5G-specific deep-link params (profile / pqcMode) still pre-configure
  // the SUCI flow; ModuleShell owns the tab/step URL after mount (the bespoke
  // outbound sync is dropped — see Phase 1 migration notes).
  const urlParams = new URLSearchParams(window.location.search)
  const profileParam = urlParams.get('profile')
  const pqcModeParam = urlParams.get('pqcMode')
  const parsedProfile =
    profileParam === 'A' || profileParam === 'B' || profileParam === 'C'
      ? (profileParam as 'A' | 'B' | 'C')
      : undefined
  const parsedPqcMode =
    pqcModeParam === 'hybrid' || pqcModeParam === 'pure'
      ? (pqcModeParam as 'hybrid' | 'pure')
      : undefined

  const [currentPart, setCurrentPart] = useState(0)
  const [initialProfile, setInitialProfile] = useState<'A' | 'B' | 'C' | undefined>(parsedProfile)
  const [initialPqcMode, setInitialPqcMode] = useState<'hybrid' | 'pure' | undefined>(parsedPqcMode)

  const [configKey, setConfigKey] = useState(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

  // Exercise pre-configuration: set part, profile, and PQC mode
  const setSimulationConfig = useCallback((config: SimulationConfig) => {
    setCurrentPart(config.part)
    if (config.profile !== undefined) {
      setInitialProfile(config.profile)
    }
    if (config.pqcMode !== undefined) {
      setInitialPqcMode(config.pqcMode)
    }
    setConfigKey((prev) => prev + 1)
  }, [])

  // Part navigation within the workshop
  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = ['suci', 'auth', 'provisioning']
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart], currentPart)
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
  )

  const handleReset = () => {
    if (confirm('Restart 5G Security Module?')) {
      setCurrentPart(0)
      setInitialProfile(undefined)
      setInitialPqcMode(undefined)
      setConfigKey((prev) => prev + 1)
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const workshopContent = (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Reset button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset
        </Button>
      </div>

      {/* Part Progress Steps */}
      <div className="overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-evenly relative min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />

          {PARTS.map((part, idx) => {
            const Icon = part.icon
            return (
              <Button
                variant="ghost"
                key={part.id}
                onClick={() => handlePartChange(idx)}
                aria-label={part.title}
                aria-current={idx === currentPart ? 'step' : undefined}
                className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${
                      idx === currentPart
                        ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                        : idx < currentPart
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
      </div>

      {/* Content Area */}
      <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
        <WorkshopStepHeader
          moduleId={MODULE_ID}
          stepId={PARTS[currentPart].id}
          stepTitle={PARTS[currentPart].title}
          stepDescription={PARTS[currentPart].description}
          stepIndex={currentPart}
          totalSteps={PARTS.length}
          steps={PARTS.map((p) => ({ id: p.id, label: p.title }))}
          onStepClick={handlePartChange}
        />
        {currentPart === 0 && (
          <SuciFlow
            key={`suci-${configKey}`}
            onBack={() => {}}
            initialProfile={initialProfile}
            initialPqcMode={initialPqcMode}
          />
        )}
        {currentPart === 1 && <AuthFlow onBack={() => setCurrentPart(0)} />}
        {currentPart === 2 && <ProvisioningFlow onBack={() => setCurrentPart(1)} />}
      </div>

      {/* Part Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
          disabled={currentPart === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
        >
          &larr; Previous Step
        </Button>
        {currentPart === PARTS.length - 1 ? (
          <Button
            variant="gradient"
            onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
          >
            Complete Module ✓
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={() => handlePartChange(currentPart + 1)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
          >
            Next Step &rarr;
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <ModuleShell
      manifest={manifest}
      title="5G Security Architecture"
      description="Master 3GPP security: Privacy, Authentication, and Provisioning."
      learn={(api) => <FiveGIntroduction onNavigateToSimulate={() => api.goToWorkshop()} />}
      workshop={workshopContent}
      exercises={(api) => (
        <FiveGExercises
          onNavigateToSimulate={() => api.goToWorkshop()}
          onSetSimulationConfig={(config) => setSimulationConfig(config)}
        />
      )}
    />
  )
}
