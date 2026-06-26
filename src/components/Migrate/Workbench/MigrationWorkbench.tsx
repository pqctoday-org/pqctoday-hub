// SPDX-License-Identifier: GPL-3.0-only
//
// Top-level "PQC Migration Workbench" — the asset-first /migrate redesign.
// Header + posture command center + two tabs (Replace what you own / Plan &
// sequence). Tab state is URL-synced (?tab=) when standalone, store-only when
// embedded in the Simulation page.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  TrendingUp,
  ArrowRightLeft,
  BarChart3,
  Map as MapIcon,
  ShieldAlert,
  Undo2,
} from 'lucide-react'
import { PageHeader } from '../../common/PageHeader'
import { Button } from '../../ui/button'
import { ShareButton } from '../../ui/ShareButton'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useMigrateSelectionStore, type MigrateTab } from '@/store/useMigrateSelectionStore'
import { encodeMigrateShareToken, decodeMigrateShareToken } from '@/utils/migrateShareToken'
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
  const plan = useMigrateSelectionStore((s) => s.plan)
  const choice = useMigrateSelectionStore((s) => s.choice)
  const applySharedSelection = useMigrateSelectionStore((s) => s.applySharedSelection)
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Shared-selection deep link (?share=<token>) ───────────────────────────
  // A /migrate link can carry the user's product selection so a colleague sees
  // the same plan. Hydrate once on load (standalone only), snapshotting the
  // visitor's own selection so they can undo back to it. Disabled when embedded.
  const [priorSelection, setPriorSelection] = useState<{
    plan: string[]
    choice: Record<string, string[]>
  } | null>(null)
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (embedded || hydratedRef.current) return
    const token = searchParams.get('share')
    if (!token) return
    hydratedRef.current = true
    // Strip the token from the URL so a refresh doesn't re-apply it.
    const sp = new URLSearchParams(searchParams)
    sp.delete('share')
    setSearchParams(sp, { replace: true })
    const decoded = decodeMigrateShareToken(token)
    if (!decoded) return
    const { plan: priorPlan, choice: priorChoice } = useMigrateSelectionStore.getState()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from the ?share= link
    setPriorSelection({ plan: priorPlan, choice: priorChoice })
    applySharedSelection(decoded.plan, decoded.choice)
  }, [embedded, searchParams, setSearchParams, applySharedSelection])

  const undoSharedSelection = useCallback(() => {
    if (priorSelection) applySharedSelection(priorSelection.plan, priorSelection.choice)
    setPriorSelection(null)
  }, [priorSelection, applySharedSelection])

  const shareUrl = useMemo(
    () =>
      `${window.location.origin}${window.location.pathname}?share=${encodeMigrateShareToken(plan, choice)}`,
    [plan, choice]
  )
  const hasSelection = plan.length > 0 || Object.keys(choice).length > 0

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            icon={TrendingUp}
            title="PQC Migration Workbench"
            description="Start from what you run — get a sequenced, quantum-safe plan aligned to NIST IR 8547 & CNSA 2.0."
          />
          {hasSelection && (
            <ShareButton
              title="PQC Migration plan"
              text="Here's my PQC migration product selection"
              url={shareUrl}
            />
          )}
        </div>
      )}

      {!embedded && priorSelection && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span>Viewing a shared product selection.</span>
          <Button variant="outline" size="sm" onClick={undoSharedSelection} className="gap-1.5">
            <Undo2 size={14} aria-hidden />
            Restore my selection
          </Button>
        </div>
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
