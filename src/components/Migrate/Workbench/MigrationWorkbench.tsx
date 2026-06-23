// SPDX-License-Identifier: GPL-3.0-only
//
// Top-level "PQC Migration Workbench" — the asset-first /migrate redesign.
// Header + posture command center + two tabs (Replace what you own / Plan &
// sequence). Tab state is URL-synced (?tab=) when standalone, store-only when
// embedded in the Simulation page.

import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TrendingUp, ArrowRightLeft, BarChart3, Map as MapIcon, ShieldAlert } from 'lucide-react'
import { PageHeader } from '../../common/PageHeader'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useMigrateSelectionStore, type MigrateTab } from '@/store/useMigrateSelectionStore'
import type { DomainId } from '@/data/migrationAssets'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { useMigrationPlan } from './useMigrationPlan'
import { PostureCommandCenter } from './PostureCommandCenter'
import { ReplaceTab } from './ReplaceTab'
import { PlanTab } from './PlanTab'
import { RoadmapsTab } from './RoadmapsTab'
import { SupplyChainRiskMatrix } from '../../PKILearning/modules/VendorRisk/components/SupplyChainRiskMatrix'

interface MigrationWorkbenchProps {
  /** When embedded in the Simulation, hide the PageHeader and don't touch the URL. */
  embedded?: boolean
  /** When embedded from a sim catalog step, which view to open on. The tab is a
   *  one-time LOCAL seed (it never writes the shared store, so standalone /migrate
   *  is untouched); the domain pre-selects a ReplaceTab domain (e.g. 'discovery'). */
  focus?: { tab?: MigrateTab; domain?: DomainId }
}

const isTab = (v: string | null): v is MigrateTab =>
  v === 'replace' || v === 'plan' || v === 'roadmaps' || v === 'vendorrisk'

export function MigrationWorkbench({ embedded = false, focus }: MigrationWorkbenchProps) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const posture = useMigrationPlan()

  const tab = useMigrateSelectionStore((s) => s.tab)
  const setTabStore = useMigrateSelectionStore((s) => s.setTab)
  const [searchParams, setSearchParams] = useSearchParams()

  // Embedded-from-a-catalog-step tab is LOCAL state seeded once from focus.tab, so
  // opening the embed never mutates the shared store that standalone /migrate reads.
  const [embedTab, setEmbedTab] = useState<MigrateTab | null>(
    embedded && focus?.tab ? focus.tab : null
  )

  // URL is the source of truth when standalone; the local seed (then store) when embedded.
  const urlTab = searchParams.get('tab')
  const activeTab: MigrateTab = embedded ? (embedTab ?? tab) : isTab(urlTab) ? urlTab : tab

  const setTab = useCallback(
    (next: string) => {
      const t: MigrateTab = isTab(next) ? next : 'replace'
      if (embedded) {
        setEmbedTab(t) // local only — don't pollute the global store
        return
      }
      setTabStore(t)
      const sp = new URLSearchParams(searchParams)
      sp.set('tab', t)
      setSearchParams(sp, { replace: true })
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
          <TabsTrigger value="roadmaps">
            <MapIcon size={15} className="mr-1.5" aria-hidden />
            Vendor roadmaps
          </TabsTrigger>
          <TabsTrigger value="vendorrisk">
            <ShieldAlert size={15} className="mr-1.5" aria-hidden />
            Vendor risk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="replace" className="mt-4">
          <ReplaceTab persona={persona} initialDomain={focus?.domain} />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanTab posture={posture} onGoToReplace={() => setTab('replace')} />
        </TabsContent>
        <TabsContent value="roadmaps" className="mt-4">
          <RoadmapsTab />
        </TabsContent>
        <TabsContent value="vendorrisk" className="mt-4">
          <SupplyChainRiskMatrix />
        </TabsContent>
      </Tabs>
    </div>
  )
}
