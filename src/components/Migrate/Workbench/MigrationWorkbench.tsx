// SPDX-License-Identifier: GPL-3.0-only
//
// Top-level "PQC Migration Workbench" — the asset-first /migrate redesign.
// Header + posture command center + two tabs (Replace what you own / Plan &
// sequence). Tab state is URL-synced (?tab=) when standalone, store-only when
// embedded in the Simulation page.

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TrendingUp, ArrowRightLeft, BarChart3 } from 'lucide-react'
import { PageHeader } from '../../common/PageHeader'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useMigrateSelectionStore, type MigrateTab } from '@/store/useMigrateSelectionStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { useMigrationPlan } from './useMigrationPlan'
import { PostureCommandCenter } from './PostureCommandCenter'
import { ReplaceTab } from './ReplaceTab'
import { PlanTab } from './PlanTab'

interface MigrationWorkbenchProps {
  /** When embedded in the Simulation, hide the PageHeader and don't touch the URL. */
  embedded?: boolean
}

export function MigrationWorkbench({ embedded = false }: MigrationWorkbenchProps) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const posture = useMigrationPlan()

  const tab = useMigrateSelectionStore((s) => s.tab)
  const setTabStore = useMigrateSelectionStore((s) => s.setTab)
  const [searchParams, setSearchParams] = useSearchParams()

  // URL is the source of truth when standalone; store when embedded.
  const urlTab = searchParams.get('tab')
  const activeTab: MigrateTab = embedded
    ? tab
    : urlTab === 'plan'
      ? 'plan'
      : urlTab === 'replace'
        ? 'replace'
        : tab

  const setTab = useCallback(
    (next: string) => {
      const t: MigrateTab = next === 'plan' ? 'plan' : 'replace'
      setTabStore(t)
      if (!embedded) {
        const sp = new URLSearchParams(searchParams)
        sp.set('tab', t)
        setSearchParams(sp, { replace: true })
      }
    },
    [embedded, searchParams, setSearchParams, setTabStore]
  )

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-4 sm:px-6">
      {!embedded && (
        <PageHeader
          icon={TrendingUp}
          title="PQC Migration Workbench"
          description="Start from what you run — get a sequenced, quantum-safe plan aligned to NIST IR 8547 & CNSA 2.0."
        />
      )}

      <div className="mt-2">
        <PostureCommandCenter posture={posture} />
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="mt-5">
        <TabsList>
          <TabsTrigger value="replace">
            <ArrowRightLeft size={15} className="mr-1.5" aria-hidden />
            Replace what you own
          </TabsTrigger>
          <TabsTrigger value="plan">
            <BarChart3 size={15} className="mr-1.5" aria-hidden />
            Plan &amp; sequence
            {posture.plannedAssets.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                {posture.plannedAssets.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="replace" className="mt-4">
          <ReplaceTab persona={persona} />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanTab posture={posture} onGoToReplace={() => setTab('replace')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
