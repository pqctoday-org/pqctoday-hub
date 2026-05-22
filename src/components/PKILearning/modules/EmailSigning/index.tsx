// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { Trash2, ShieldCheck, PenLine, Lock, FlaskConical } from 'lucide-react'
import { EmailSigningIntroduction } from './components/EmailSigningIntroduction'
import { EmailSigningExercises, type WorkshopConfig } from './components/EmailSigningExercises'
import { SMIMECertViewer } from './workshop/SMIMECertViewer'
import { CMSSigningDemo } from './workshop/CMSSigningDemo'
import { CMSEncryptionDemo } from './workshop/CMSEncryptionDemo'
const LiveHSMProvider = lazy(() =>
  import('./workshop/LiveHSMProvider').then((m) => ({ default: m.LiveHSMProvider }))
)
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ModuleTabBar } from '@/components/PKILearning/common/ModuleTabBar'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { Button } from '@/components/ui/button'
import { WORKSHOP_STEPS } from '@/components/PKILearning/moduleData'

const MODULE_ID = 'email-signing'

const PARTS = [
  {
    id: 'smime-cert',
    title: 'Step 1: S/MIME Certificates',
    description: 'Compare classical and PQC certificate structures for email signing.',
    icon: ShieldCheck,
  },
  {
    id: 'cms-signing',
    title: 'Step 2: CMS Signing',
    description: 'Walk through the CMS SignedData workflow and ASN.1 structure.',
    icon: PenLine,
  },
  {
    id: 'cms-encryption',
    title: 'Step 3: CMS Encryption',
    description:
      'Compare RSA key transport with KEM-based encryption (RFC 9629) using AuthEnvelopedData.',
    icon: Lock,
  },
  {
    id: 'live-hsm',
    title: 'Step 4: Live HSM Provider',
    description:
      'Phase 1 foundation — load openssl.wasm with pkcs11-provider + softhsmv3 statically linked and register the provider in-process.',
    icon: FlaskConical,
  },
]

export const EmailSigningModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete, modules } = useModuleStore()

  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMs = Date.now() - startTimeRef.current
      const elapsed = elapsedMs / 60000
      const current = useModuleStore.getState().modules[MODULE_ID]
      updateModuleProgress(MODULE_ID, {
        timeSpent: (current?.timeSpent || 0) + elapsed,
      })
    }
  }, [updateModuleProgress])

  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  const navigateToWorkshop = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

  const handleSetWorkshopConfig = useCallback((config: WorkshopConfig) => {
    setCurrentPart(config.step)
    setConfigKey((prev) => prev + 1)
  }, [])

  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = PARTS.map((p) => p.id)
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart], currentPart)
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
  )

  const handleReset = () => {
    if (confirm('Restart Email & Document Signing Module?')) {
      setCurrentPart(0)
      setConfigKey((prev) => prev + 1)
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const workshopSteps = WORKSHOP_STEPS[MODULE_ID] ?? []
  const completedSteps = modules[MODULE_ID]?.completedSteps ?? []
  const workshopDone = workshopSteps.filter((s) => completedSteps.includes(s.id)).length
  const workshopDot = workshopDone > 0 && workshopDone < workshopSteps.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Email &amp; Document Signing (S/MIME, CMS)
          </h1>
          <p className="text-muted-foreground mt-2">
            Master CMS structures for email signing and encryption &mdash; from classical S/MIME to
            post-quantum KEMs.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ModuleTabBar
          tabs={[
            { value: 'learn', label: 'Learn' },
            { value: 'visual', label: 'Visual' },
            { value: 'workshop', label: 'Workshop', hasDot: workshopDot },
            { value: 'exercises', label: 'Exercises' },
            { value: 'references', label: 'References' },
            { value: 'tools', label: 'Tools & Products' },
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
        />

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <EmailSigningIntroduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
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

            {/* Content Area — WorkshopStepHeader renders the dot stepper above title */}
            <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
              <WorkshopStepHeader
                moduleId={MODULE_ID}
                stepId={PARTS[currentPart].id}
                stepTitle={PARTS[currentPart].title}
                stepDescription={PARTS[currentPart].description}
                stepIndex={currentPart}
                totalSteps={PARTS.length}
                steps={PARTS.map((p) => ({ id: p.id, label: p.title.split(':')[0] }))}
                onStepClick={handlePartChange}
              />
              {currentPart === 0 && <SMIMECertViewer key={`smime-cert-${configKey}`} />}
              {currentPart === 1 && <CMSSigningDemo key={`cms-signing-${configKey}`} />}
              {currentPart === 2 && <CMSEncryptionDemo key={`cms-encryption-${configKey}`} />}
              {currentPart === 3 && (
                <Suspense
                  fallback={
                    <div className="text-sm text-muted-foreground">Loading Live HSM Provider…</div>
                  }
                >
                  <LiveHSMProvider key={`live-hsm-${configKey}`} />
                </Suspense>
              )}
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
        </TabsContent>

        <TabsContent value="exercises">
          <EmailSigningExercises
            onNavigateToWorkshop={navigateToWorkshop}
            onSetWorkshopConfig={handleSetWorkshopConfig}
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
