// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * "Building Your PQC Team" module (Applied Quantum Skills appendix, p.160–164).
 * Teaches core roles, the Crypto Champion network, Build-Borrow-Buy, and a
 * 1-per-500-engineers team-sizing calculator.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Introduction } from './components/Introduction'
import { TeamSizingCalculator } from './components/TeamSizingCalculator'
import { PQCTeamExercises } from './PQCTeamExercises'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ModuleTabBar } from '@/components/PKILearning/common/ModuleTabBar'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'

const MODULE_ID = 'pqc-team'

export const PQCTeamModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: 0 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  useSyncDeepLink(activeTab, 0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete } = useModuleStore()

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Building Your PQC Team</h1>
        <p className="text-muted-foreground mt-2">
          Staff the migration: core roles, a federated Crypto Champion network, Build-Borrow-Buy,
          and a 1-per-500 sizing calculator.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ModuleTabBar
          tabs={[
            { value: 'learn', label: 'Learn' },
            { value: 'workshop', label: 'Workshop' },
            { value: 'exercises', label: 'Exercises' },
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
        />

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <Introduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="workshop">
          <div className="glass-panel p-4 sm:p-6 md:p-8">
            <TeamSizingCalculator />
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <PQCTeamExercises onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
