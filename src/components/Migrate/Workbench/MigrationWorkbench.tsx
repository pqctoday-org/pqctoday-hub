// SPDX-License-Identifier: GPL-3.0-only
//
// Top-level "PQC Migration Workbench" — the asset-first /migrate redesign.
// Header + posture command center + two tabs (Replace what you own / Plan &
// sequence). Tab state is URL-synced (?tab=) when standalone, store-only when
// embedded in the Simulation page.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  TrendingUp,
  ArrowRightLeft,
  BarChart3,
  Map as MapIcon,
  ShieldAlert,
  Undo2,
} from 'lucide-react'
import { PageHeader } from '../../common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { Button } from '../../ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { softwareMetadata, softwareData } from '@/data/migrateData'
import {
  useMigrateSelectionStore,
  selectedProductIds,
  type MigrateTab,
} from '@/store/useMigrateSelectionStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { encodeMigrateShareToken, decodeMigrateShareToken } from '@/utils/migrateShareToken'
import { classifyProductDomain, type DomainId } from '@/data/migrationAssets'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { useMigrationPlan } from './useMigrationPlan'
import { PostureCommandCenter } from './PostureCommandCenter'
import { ReplaceTab } from './ReplaceTab'
import { PlanTab } from './PlanTab'
import { RoadmapsTab } from './RoadmapsTab'
import { SupplyChainRiskMatrix } from '../../PKILearning/modules/VendorRisk/components/SupplyChainRiskMatrix'
import { VendorConcentrationRiskPanel } from './VendorConcentrationRiskPanel'
import { WhoHasMovedPanel } from './WhoHasMovedPanel'
import { CatalogScopeNote } from './CatalogScopeNote'
import { VendorCommitmentPanel, ClaimsAndEvidencePanel } from './VendorCommitmentPanel'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileMigrateView } from '@/components/Mobile/screens/MobileMigrateView'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'
import { DeepLinkNotice } from '../../common/DeepLinkNotice'
import { resolveProductLink, productLinkNoticeMessage } from './workbenchCatalog'

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
  const isMobileShell = useIsMobileShell()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const posture = useMigrationPlan()

  const tab = useMigrateSelectionStore((s) => s.tab)
  const setTabStore = useMigrateSelectionStore((s) => s.setTab)
  const plan = useMigrateSelectionStore((s) => s.plan)
  const choice = useMigrateSelectionStore((s) => s.choice)
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const nameToProductId = useMigrateSelectionStore((s) => s.nameToProductId)
  const applySharedSelection = useMigrateSelectionStore((s) => s.applySharedSelection)
  const [searchParams, setSearchParams] = useSearchParams()
  const addHistoryEvent = useHistoryStore((s) => s.addEvent)

  // Fire history event on selection change (debounced 1.5s) — mirrors
  // ComplianceView's compliance_framework_selection pattern. selectedProductIds
  // is the store's own documented "single join" of myProducts ∪ choice, so this
  // counts a pick made through either selection path, not just one of them.
  const selectedCount = selectedProductIds(myProducts, choice, nameToProductId).length
  const prevSelectedCountRef = useRef(selectedCount)
  useEffect(() => {
    if (selectedCount === prevSelectedCountRef.current) return
    prevSelectedCountRef.current = selectedCount
    if (selectedCount === 0) return
    const timer = setTimeout(() => {
      addHistoryEvent({
        type: 'migrate_product_selection',
        timestamp: Date.now(),
        title: 'Updated migration plan',
        detail: `${selectedCount} product${selectedCount === 1 ? '' : 's'} selected`,
        route: '/migrate',
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [selectedCount, addHistoryEvent])

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

  // ── Product deep links (?product=<id|name> / ?productIds=<id1>,<id2>) ──
  // ?product= is emitted by ProductDetail's Endorse/Flag buttons (2026-07-16,
  // U8) and ?productIds= by the leader-detail "view N open-source projects"
  // link (2026-07-30). Deep-link remediation PR 1 (2026-09-28) reworked both:
  //  - each token resolves by product_id, exact name (case-insensitive) or a
  //    former name (resolveProductLink), then filters by EXACT id — never the
  //    old substring name filter that also showed sibling products;
  //  - a single resolved product is auto-expanded, scrolled to and ringed;
  //  - unknown/retired tokens show a "not found" notice instead of nothing;
  //  - the params stay in the URL (reload/share keep working) and are dropped
  //    only when the reader collapses the row or moves on (domain, filter,
  //    facets, another tab);
  //  - hydration re-runs whenever the param VALUE changes, so a second link
  //    while the page is mounted works (was a one-shot ref).
  // Domain comes from the first resolved product; ?productIds= spanning
  // several domains still shows only that domain's subset.
  // On the phone shell MobileMigrateView reads these params itself.
  const productParam = searchParams.get('product')
  const productIdsParam = searchParams.get('productIds')
  const [productLink, setProductLink] = useState<{
    key: string
    domain: DomainId
    productIds: string[]
    expandId?: string
  } | null>(null)
  const [productLinkNotice, setProductLinkNotice] = useState<string | null>(null)
  const productLinkKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (embedded || isMobileShell) return
    if (!productParam && !productIdsParam) {
      productLinkKeyRef.current = null
      return
    }
    const key = `${productParam ?? ''}|${productIdsParam ?? ''}`
    if (productLinkKeyRef.current === key) return
    productLinkKeyRef.current = key
    const res = resolveProductLink(productParam, productIdsParam)
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from the ?product=/?productIds= link, once per distinct param value */
    setProductLinkNotice(productLinkNoticeMessage(res))
    const first = res.products[0]
    const domain = first
      ? classifyProductDomain(first.categoryName, first.infrastructureLayer)
      : null
    if (!domain) {
      setProductLink(null)
      return
    }
    setTabStore('replace')
    setProductLink({
      key,
      domain,
      productIds: res.products.map((p) => p.productId),
      expandId: res.products.length === 1 ? first.productId : undefined,
    })
    /* eslint-enable react-hooks/set-state-in-effect */
    if (searchParams.get('tab') !== 'replace') {
      const sp = new URLSearchParams(searchParams)
      sp.set('tab', 'replace')
      setSearchParams(sp, { replace: true })
    }
  }, [
    embedded,
    isMobileShell,
    productParam,
    productIdsParam,
    searchParams,
    setSearchParams,
    setTabStore,
  ])

  /** The reader moved on from the linked product: forget it and drop the
   *  params (replace — a filter-style change, not a new history entry). */
  const clearProductLink = useCallback(() => {
    setProductLink(null)
    productLinkKeyRef.current = null
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev)
        sp.delete('product')
        sp.delete('productIds')
        return sp
      },
      { replace: true }
    )
  }, [setSearchParams])

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
      // Leaving Replace ends a product deep link — otherwise returning to the
      // tab would silently re-apply a stale filter.
      if (t !== 'replace') {
        sp.delete('product')
        sp.delete('productIds')
        setProductLink(null)
        productLinkKeyRef.current = null
      }
      setSearchParams(sp, { replace: true })
    },
    [embedded, searchParams, setSearchParams, setTabStore]
  )

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info renders there now, not as a row on the page
  // itself. Mirrors TimelineView.tsx's pattern. Gated on `!embedded`, same as
  // the PageHeader render below.
  useEffect(() => {
    if (embedded) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'PQC Migration Workbench',
      // ADDED 2026-07-16 (migrate-process remediation Phase 5, U1): the
      // catalog snapshot date was loaded (softwareMetadata) but never
      // surfaced anywhere on this page — a reviewer had no way to tell how
      // current the whole product list is, only individual rows' own
      // verified-pill tooltips (which needed expanding to see).
      dataSource: softwareMetadata
        ? `${softwareMetadata.filename} • Catalog as of ${softwareMetadata.lastUpdate.toLocaleDateString()}`
        : undefined,
      // FIX 2026-08-02 (Grade-A remediation): this page used to render its
      // own second ShareButton next to PageHeader — the exact "one control,
      // not two" mistake the dataSource note above already fixed once for
      // Sources. Share lives ONLY in the top bar; when there's a selection
      // worth sharing, register its self-contained token URL here instead,
      // same pattern ReportView.tsx uses. No selection -> url stays
      // undefined -> top bar falls back to its normal bare-URL share.
      ...(hasSelection
        ? {
            url: shareUrl,
            shareTitle: 'PQC Migration plan',
            shareText: "Here's my PQC migration product selection",
          }
        : null),
    })
    return () => clearPageActions()
  }, [embedded, hasSelection, shareUrl])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). MigrateWorkbenchEmbed.tsx
  // renders this same component inside the simulation via `embedded` (this
  // page's own equivalent of Threats/Library/Compliance's `simEmbed` prop —
  // a different name, same real risk), so `embedded` must win over
  // isMobileShell regardless of viewport width.
  if (isMobileShell && !embedded) {
    return <MobileMigrateView />
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-4 sm:px-6">
      {!embedded && (
        <PageHeader
          icon={TrendingUp}
          title="PQC Migration Workbench"
          description="Start from what you run — get a sequenced, quantum-safe plan aligned to NIST IR 8547 (Initial Public Draft) & CNSA 2.0."
          // NOTE (merge, 2026-08-02): this branch added viewType="Migrate"
          // and a dataSource prop here to give the catalog's 907
          // trusted_source_id-backed rows a Sources button and a visible
          // snapshot date. Both landed on main first, via 4.38.0's
          // page-action-strip rollout — MainLayout's ROUTE_VIEW_TYPE now maps
          // '/migrate' -> 'Migrate' (global top-bar Sources button), and this
          // component's own setPageActions() effect above already passes the
          // same softwareMetadata-derived dataSource string. Re-adding them
          // here would render both controls twice, which is exactly what that
          // rollout existed to stop.
        />
      )}

      {!embedded && <PersonaPageNote route="/migrate" className="mb-4" />}

      {!embedded && <CatalogScopeNote items={softwareData} />}

      {/* B+ remediation 4.6 (2026-08-10): a newcomer meets an unfiltered vendor
          catalog they have no basis to evaluate. Their question is not "which
          product" but "is anyone actually doing this" — answered here, from the
          live catalog, and counting only products whose support we hold a proof
          document for. */}
      {!embedded && persona === 'curious' && <WhoHasMovedPanel />}

      {/* B+ remediation 4.6 (2026-08-10): the page answers a question neither
          of these roles asked. An executive wants to know whether their
          suppliers have committed; a researcher wants the corpus of claims and
          what backs each. Both are rendered from data the catalog already
          holds, so neither can assert more than the rows support. */}
      {!embedded && persona === 'executive' && <VendorCommitmentPanel />}
      {!embedded && persona === 'researcher' && <ClaimsAndEvidencePanel />}

      {!embedded && priorSelection && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span>Viewing a shared product selection.</span>
          <Button variant="outline" size="sm" onClick={undoSharedSelection} className="gap-1.5">
            <Undo2 size={14} aria-hidden />
            Restore my selection
          </Button>
        </div>
      )}

      {!embedded && productLinkNotice && (
        <div className="mt-3">
          <DeepLinkNotice
            kind="not-found"
            message={productLinkNotice}
            onDismiss={() => setProductLinkNotice(null)}
          />
        </div>
      )}

      <div className="mt-2">
        <PostureCommandCenter posture={posture} onGoToReplace={() => setTab('replace')} />
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="mt-5">
        <TabsList>
          <TabsTrigger value="replace">
            <ArrowRightLeft size={15} className="mr-1.5" aria-hidden />
            <span className="hidden sm:inline">Replace what you own</span>
            <span className="sm:hidden">Replace</span>
          </TabsTrigger>
          <TabsTrigger value="plan">
            <BarChart3 size={15} className="mr-1.5" aria-hidden />
            <span className="hidden sm:inline">Plan &amp; sequence</span>
            <span className="sm:hidden">Plan</span>
            {posture.plannedAssets.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                {posture.plannedAssets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="roadmaps">
            <MapIcon size={15} className="mr-1.5" aria-hidden />
            <span className="hidden sm:inline">Vendor roadmaps</span>
            <span className="sm:hidden">Vendors</span>
          </TabsTrigger>
          <TabsTrigger value="vendorrisk">
            <ShieldAlert size={15} className="mr-1.5" aria-hidden />
            <span className="hidden sm:inline">Vendor risk</span>
            <span className="sm:hidden">Risk</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="replace" className="mt-4">
          <ReplaceTab
            persona={persona}
            initialDomain={productLink?.domain ?? focus?.domain}
            initialProductIds={productLink?.productIds}
            deepLinkKey={productLink?.key}
            expandProductId={productLink?.expandId}
            onDeepLinkConsumed={clearProductLink}
            onGoToRoadmaps={() => setTab('roadmaps')}
          />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanTab posture={posture} onGoToReplace={() => setTab('replace')} />
        </TabsContent>
        <TabsContent value="roadmaps" className="mt-4">
          <RoadmapsTab />
        </TabsContent>
        <TabsContent value="vendorrisk" className="mt-4">
          <VendorConcentrationRiskPanel />
          <SupplyChainRiskMatrix variant="flat" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
