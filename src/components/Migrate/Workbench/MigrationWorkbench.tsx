// SPDX-License-Identifier: GPL-3.0-only
//
// Top-level "PQC Migration Workbench" — the asset-first /migrate redesign.
// Header + posture command center + two tabs (Replace what you own / Plan &
// sequence). Tab state is URL-synced (?tab=) when standalone, store-only when
// embedded in the Simulation page.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
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
import { DOMAINS, type DomainId } from '@/data/migrationAssets'
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
import {
  resolveMigrateLink,
  resolveProductRef,
  resolveDomainRef,
  resolveVendorRef,
  migrateLinkKey,
  MIGRATE_LINK_PARAMS,
  MIGRATE_TRANSIENT_LINK_PARAMS,
  type MigrateLinkIntent,
} from './workbenchCatalog'

interface MigrationWorkbenchProps {
  /** When embedded in the Simulation, hide the PageHeader and don't touch the URL. */
  embedded?: boolean
  /** When embedded from a sim catalog step, which view to open on. The tab is a
   *  one-time LOCAL seed (it never writes the shared store, so standalone /migrate
   *  is untouched); the domain pre-selects a ReplaceTab domain (e.g. 'discovery'). */
  focus?: { tab?: MigrateTab; domain?: DomainId }
}

/** URL params that mean ONE item (product row, vendor card, Plan row) is open. */
const ITEM_VIEW_PARAMS = ['product', 'productIds', 'vendor', 'open'] as const

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

  // ── Deep links (?product=, ?productIds=, ?domain=, ?vendor=, ?q= …) ─────
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
  // PR 2 (2026-09-29) widened this to every param other pages already emit
  // (resolveMigrateLink): ?domain= (Replace-tab domain, written when the
  // reader picks one), ?vendor= (Roadmaps tab, that vendor's card opened),
  // ?q=/?search=/?highlight=, ?layer=/?cat=/?category=/?subcat= and
  // ?industry= (ignored). A retired product id resolves to its successor.
  // ?productIds= spanning several domains shows the first product's domain
  // plus a notice linking to the others. Our own URL writes set
  // productLinkKeyRef first, so they never re-hydrate as a new link.
  // On the phone shell MobileMigrateView reads these params itself.
  const linkKey = migrateLinkKey((k) => searchParams.get(k))
  const hasLinkParams = MIGRATE_LINK_PARAMS.some((k) => searchParams.has(k))
  const [productLink, setProductLink] = useState<{
    key: string
    domain: DomainId
    filter?: string
    productIds?: string[]
    expandId?: string
  } | null>(null)
  const [vendorLink, setVendorLink] = useState<{ key: string; vendorId: string } | null>(null)
  const [elsewhereProducts, setElsewhereProducts] = useState<MigrateLinkIntent['elsewhere']>([])
  const [productLinkNotice, setProductLinkNotice] = useState<string | null>(null)
  const productLinkKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (embedded || isMobileShell) return
    if (!hasLinkParams) {
      productLinkKeyRef.current = null
      return
    }
    if (productLinkKeyRef.current === linkKey) return
    productLinkKeyRef.current = linkKey
    const intent = resolveMigrateLink((k) => searchParams.get(k))
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from the link params, once per distinct param value */
    setProductLinkNotice(intent.notice)
    setElsewhereProducts(intent.elsewhere)
    setVendorLink(intent.vendorId ? { key: linkKey, vendorId: intent.vendorId } : null)
    setProductLink(
      intent.domain
        ? {
            key: linkKey,
            domain: intent.domain,
            filter: intent.filter,
            productIds: intent.productIds,
            expandId: intent.expandId,
          }
        : null
    )
    if (!intent.tab) return
    setTabStore(intent.tab)
    /* eslint-enable react-hooks/set-state-in-effect */
    if (searchParams.get('tab') !== intent.tab) {
      const sp = new URLSearchParams(searchParams)
      sp.set('tab', intent.tab)
      productLinkKeyRef.current = migrateLinkKey((k) => sp.get(k))
      setSearchParams(sp, { replace: true })
    }
  }, [embedded, isMobileShell, hasLinkParams, linkKey, searchParams, setSearchParams, setTabStore])

  /** One URL write that never re-hydrates as a link (the key is recorded
   *  first). react-router doesn't queue functional updates, so every change
   *  a click makes goes through a single call. */
  const writeLinkParams = useCallback(
    (mutate: (sp: URLSearchParams) => void, replace: boolean) => {
      if (embedded) return
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev)
          mutate(sp)
          productLinkKeyRef.current = migrateLinkKey((k) => sp.get(k))
          return sp
        },
        { replace }
      )
    },
    [embedded, setSearchParams]
  )

  /** The reader moved on from the linked view (collapsed the row, changed
   *  domain, filter or facets): forget the link and drop its params (replace —
   *  a filter-style change, not a new history entry). The domain they are
   *  now on is written as ?domain= (null = reset to the default: cleared). */
  const onReplaceViewChange = useCallback(
    (domain: DomainId | null) => {
      setProductLink(null)
      setElsewhereProducts([])
      writeLinkParams((sp) => {
        for (const k of MIGRATE_TRANSIENT_LINK_PARAMS) sp.delete(k)
        if (domain) sp.set('domain', domain)
        else sp.delete('domain')
      }, true)
    },
    [writeLinkParams]
  )

  /** A Replace-tab row expanded by hand: opening a resource pushes history. */
  const onProductOpen = useCallback(
    (productId: string, domain: DomainId) =>
      writeLinkParams((sp) => {
        for (const k of MIGRATE_TRANSIENT_LINK_PARAMS) sp.delete(k)
        sp.set('domain', domain)
        sp.set('product', productId)
      }, false),
    [writeLinkParams]
  )

  /** …and collapsed: drop ?product= if it names that row (replace). */
  const onProductClose = useCallback(
    (productId: string) => {
      const current = searchParams.get('product')
      if (!current || resolveProductRef(current)?.product.productId !== productId) return
      writeLinkParams((sp) => sp.delete('product'), true)
    },
    [searchParams, writeLinkParams]
  )

  /** Roadmaps tab: a vendor card's products opened (push) / closed or the
   *  vendor filter edited (replace). */
  const onVendorChange = useCallback(
    (vendorId: string | null, open: boolean) => {
      if (open && vendorId) {
        writeLinkParams((sp) => {
          for (const k of MIGRATE_TRANSIENT_LINK_PARAMS) sp.delete(k)
          sp.set('vendor', vendorId)
        }, false)
        return
      }
      const current = searchParams.get('vendor')
      if (!current || (vendorId && resolveVendorRef(current) !== vendorId)) return
      writeLinkParams((sp) => sp.delete('vendor'), true)
    },
    [searchParams, writeLinkParams]
  )

  /** Plan / Roadmaps / Vendor-risk ?open=<productId|domainId>: written when a
   *  Plan row is expanded (push), cleared when it is collapsed (replace). */
  const openParam = embedded ? null : searchParams.get('open')
  const onOpenChange = useCallback(
    (ref: string | null) => {
      if (!ref && !searchParams.get('open')) return
      writeLinkParams((sp) => {
        if (ref) sp.set('open', ref)
        else sp.delete('open')
      }, !ref)
    },
    [searchParams, writeLinkParams]
  )

  // The Replace tab's domain survives a tab switch and a reload via ?domain=
  // (ReplaceTab remounts when its tab is re-selected).
  const domainParam = embedded ? null : searchParams.get('domain')
  const urlDomain = domainParam ? resolveDomainRef(domainParam) : null
  const urlProductId = useMemo(() => {
    const v = embedded ? null : searchParams.get('product')
    return v ? resolveProductRef(v)?.product.productId : undefined
  }, [embedded, searchParams])

  const shareUrl = useMemo(
    () =>
      `${window.location.origin}${window.location.pathname}?share=${encodeMigrateShareToken(plan, choice)}`,
    [plan, choice]
  )
  const hasSelection = plan.length > 0 || Object.keys(choice).length > 0
  // While ONE item is open (a ?product= row, a ?vendor= card, a ?productIds=
  // link or a Plan ?open= row) the top-bar Share must share that item view,
  // not the plan token — so the plan URL is registered only when no item is
  // open. Phones included: the phone header reads the same page actions.
  const itemOpen = !embedded && ITEM_VIEW_PARAMS.some((k) => searchParams.has(k))

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
      // Leaving a tab ends a product deep link — otherwise returning to the
      // tab would silently re-apply a stale filter.
      // PR 2: the same goes for every one-off link param (?vendor=, ?q=, ?open=
      // …) on any tab switch; ?domain= is view state and stays.
      for (const k of MIGRATE_TRANSIENT_LINK_PARAMS) sp.delete(k)
      sp.delete('open')
      setProductLink(null)
      setVendorLink(null)
      setElsewhereProducts([])
      productLinkKeyRef.current = migrateLinkKey((k) => sp.get(k))
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
      ...(hasSelection && !itemOpen
        ? {
            url: shareUrl,
            shareTitle: 'PQC Migration plan',
            shareText: "Here's my PQC migration product selection",
          }
        : null),
    })
    return () => clearPageActions()
  }, [embedded, hasSelection, itemOpen, shareUrl])

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

      {!embedded && elsewhereProducts.length > 0 && (
        <div
          role="status"
          data-testid="deeplink-elsewhere"
          className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm"
        >
          <p>Some linked products are in other categories:</p>
          <ul className="mt-1 list-disc pl-5">
            {elsewhereProducts.map((g) => (
              <li key={g.domain}>
                <Link
                  to={`/migrate?tab=replace&productIds=${g.products
                    .map((p) => encodeURIComponent(p.productId))
                    .join(',')}`}
                  className="text-primary underline underline-offset-2"
                >
                  {DOMAINS[g.domain].label}
                </Link>
                {' — '}
                {g.products.map((p) => p.softwareName).join(', ')}
              </li>
            ))}
          </ul>
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
            initialDomain={productLink?.domain ?? urlDomain ?? focus?.domain}
            initialFilter={productLink?.filter}
            initialProductIds={productLink?.productIds}
            deepLinkKey={productLink?.key}
            expandProductId={productLink?.expandId}
            openProductId={urlProductId}
            onViewChange={embedded ? undefined : onReplaceViewChange}
            onProductOpen={embedded ? undefined : onProductOpen}
            onProductClose={embedded ? undefined : onProductClose}
            onGoToRoadmaps={() => setTab('roadmaps')}
          />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanTab
            posture={posture}
            onGoToReplace={() => setTab('replace')}
            openRef={openParam ?? undefined}
            onOpenChange={embedded ? undefined : onOpenChange}
          />
        </TabsContent>
        <TabsContent value="roadmaps" className="mt-4">
          <RoadmapsTab
            focusVendorId={vendorLink?.vendorId}
            focusKey={vendorLink?.key}
            openRef={openParam ?? undefined}
            onVendorChange={embedded ? undefined : onVendorChange}
          />
        </TabsContent>
        <TabsContent value="vendorrisk" className="mt-4">
          <VendorConcentrationRiskPanel openRef={openParam ?? undefined} />
          <SupplyChainRiskMatrix variant="flat" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
