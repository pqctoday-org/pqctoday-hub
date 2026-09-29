// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigationType } from 'react-router'
import { ArrowRight, Clock, Search, AlertTriangle, Check, Plus } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import {
  REPLACE_ASSETS,
  DOMAINS,
  DECISIONS,
  type DomainId,
  type ReplaceAsset,
} from '@/data/migrationAssets'
import { deprecatedProductCount } from '@/data/migrateData'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { logMigrateAction } from '@/utils/analytics'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { AssetList } from './AssetList'
import { ProductRow } from './ProductRow'
import { Pill, DECISION_ICON } from './workbenchUi'
import {
  productsForDomain,
  filterProducts,
  applyProductFacets,
  NO_FACETS,
  type ProductFacets,
} from './workbenchCatalog'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { getCertsForProduct } from '@/data/certificationXrefData'
import { FilterDropdown } from '../../common/FilterDropdown'
import { MobileFilterDrawer } from '../MobileFilterDrawer'
import { DeepLinkNotice } from '../../common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'

const ASSET_BY_ID = new Map<string, ReplaceAsset>(REPLACE_ASSETS.map((a) => [a.id, a]))

const hasCertLink = (p: SoftwareItem) => getCertsForProduct(p.productId, p.softwareName).length > 0

interface ReplaceTabProps {
  persona: PersonaId | null
  /** Optional domain to pre-select (e.g. a sim catalog step opening 'discovery'). */
  initialDomain?: DomainId
  /** Optional text to pre-fill the in-domain filter with — added 2026-07-16
   *  (migrate-process remediation Phase 5, U8) so the /migrate?product=<name>
   *  deep link (from ProductDetail's Endorse/Flag buttons) actually lands on
   *  the right row instead of a default, unfiltered tab. */
  initialFilter?: string
  /** Optional exact product_id allow-list — added 2026-07-30 for the leader-
   *  detail "view N open-source projects" deep link (/migrate?productIds=a,b).
   *  Takes over from initialFilter's fuzzy text match entirely when present,
   *  since the caller already knows the exact ids (leader.migrateCatalogRefs). */
  initialProductIds?: string[]
  /** Empty-domain dead end (fix #6) routes here — MigrationWorkbench wires this
   *  to its own "Vendor roadmaps" tab. */
  onGoToRoadmaps?: () => void
  /** Identity of the active ?product=/?productIds= deep link (changes per link,
   *  so the same product linked twice still re-expands and re-scrolls). */
  deepLinkKey?: string
  /** The single deep-linked product to auto-expand, scroll to and highlight. */
  expandProductId?: string
  /** The reader changed the view themselves — picked a domain (always), or
   *  collapsed the linked row / edited the filter or facets while a link was
   *  active. The parent drops the one-off link params and writes ?domain=
   *  (null = reset to the default, which clears it). Deep-link PR 2. */
  onViewChange?: (domain: DomainId | null) => void
  /** The product named by the URL's ?product= right now (resolved id) — a
   *  Back that removes it collapses the row that was opened. */
  openProductId?: string
  /** A row expanded by hand (parent pushes ?product=<id>). */
  onProductOpen?: (productId: string, domain: DomainId) => void
  /** A row collapsed by hand (parent drops ?product= if it names it). */
  onProductClose?: (productId: string) => void
}

export function ReplaceTab({
  persona,
  initialDomain,
  initialFilter,
  initialProductIds,
  onGoToRoadmaps,
  deepLinkKey,
  expandProductId,
  onViewChange,
  openProductId,
  onProductOpen,
  onProductClose,
}: ReplaceTabProps) {
  const plan = useMigrateSelectionStore((s) => s.plan)
  const choice = useMigrateSelectionStore((s) => s.choice)
  const togglePlanAsset = useMigrateSelectionStore((s) => s.togglePlanAsset)
  const chooseProduct = useMigrateSelectionStore((s) => s.chooseProduct)

  const [selectedDomain, setSelectedDomain] = useState<DomainId | null>(initialDomain ?? 'tls')
  const [filter, setFilter] = useState(initialFilter ?? '')
  const [productIdFilter, setProductIdFilter] = useState<string[] | undefined>(initialProductIds)
  const [facets, setFacets] = useState<ProductFacets>(NO_FACETS)
  // Facets the reader had before a deep link widened them (Undo restores them).
  const [facetsBeforeLink, setFacetsBeforeLink] = useState<ProductFacets | null>(null)
  const facetsRef = useRef(facets)
  useEffect(() => {
    facetsRef.current = facets
  }, [facets])

  // FIXED 2026-07-16 (Phase 5, U8 — caught by a failing regression test):
  // ReplaceTab is already mounted (tab defaults to 'replace') by the time
  // MigrationWorkbench's ?product= effect resolves the domain/filter a
  // render later, so useState's initial value never saw them — a
  // useState(initialFilter ?? '') initializer only runs on first mount.
  // Sync explicitly instead, once these actually arrive.
  // Domain on its own dependency (PR 2): it also follows ?domain=, and a link
  // being consumed must not re-apply the URL's previous domain for the one
  // render in which the router has not committed the new URL yet.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync when a linked/URL domain arrives
    if (initialDomain) setSelectedDomain(initialDomain)
  }, [initialDomain])
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync when the deep-link values arrive, not on every parent re-render (same pattern as the ?share=/?product= effects in MigrationWorkbench.tsx) */
    if (initialFilter) setFilter(initialFilter)
    // PR 2: a link that carries no id set (?q=, ?layer=, ?domain=) must not
    // inherit the previous link's exact-id filter or text.
    if (deepLinkKey && !initialProductIds) {
      setProductIdFilter(undefined)
      if (!initialFilter) setFilter('')
    }
    if (initialProductIds) {
      setProductIdFilter(initialProductIds)
      setFilter('')
      // Deep-link remediation PR 1: a linked product hidden by the reader's
      // own facet picks is revealed by clearing the facets (the only thing
      // that can hide an exact-id match), with an Undo to restore them.
      const current = facetsRef.current
      if (initialDomain && Object.values(current).some((v) => v !== 'all')) {
        const wanted = new Set(initialProductIds)
        const targets = productsForDomain(initialDomain).filter((p) => wanted.has(p.productId))
        if (applyProductFacets(targets, current, hasCertLink).length < targets.length) {
          setFacetsBeforeLink(current)
          setFacets(NO_FACETS)
        }
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialDomain, initialFilter, initialProductIds, deepLinkKey])

  useScrollToDeepLinkTarget(
    expandProductId && deepLinkKey ? deepLinkKey : null,
    expandProductId ? deepLinkSelector(expandProductId) : null
  )

  // Any reader-driven change of domain / filter / facets ends the deep-linked view.
  const consumeDeepLink = () => {
    if (deepLinkKey) onViewChange?.(selectedDomain)
  }

  // Back (a POP) that drops ?product=<id> closes the row that push opened:
  // re-key it so it remounts collapsed. A fresh push never collapses others.
  const navigationType = useNavigationType()
  const [rowEpoch, setRowEpoch] = useState<ReadonlyMap<string, number>>(new Map())
  const prevOpenProductIdRef = useRef(openProductId)
  useEffect(() => {
    const prev = prevOpenProductIdRef.current
    prevOpenProductIdRef.current = openProductId
    if (navigationType !== 'POP' || !prev || prev === openProductId) return
    setRowEpoch((e) => new Map(e).set(prev, (e.get(prev) ?? 0) + 1))
  }, [openProductId, navigationType])

  const onSelect = (d: DomainId) => {
    setSelectedDomain(d)
    setFilter('')
    setProductIdFilter(undefined)
    onViewChange?.(d)
  }

  // A catalog-wide product search (AssetList's top-level search box) jumping
  // straight to one specific product — set its domain AND narrow the list to
  // just that product, rather than landing on the domain's full, unfiltered list.
  const onSelectProduct = (d: DomainId, productId: string) => {
    setSelectedDomain(d)
    setFilter('')
    setProductIdFilter([productId])
    onViewChange?.(d)
  }

  const setFacet = (next: (f: ProductFacets) => ProductFacets) => {
    setFacets(next)
    setFacetsBeforeLink(null)
    consumeDeepLink()
  }

  const asset = selectedDomain ? (ASSET_BY_ID.get(selectedDomain) ?? null) : null
  const products = useMemo(
    () => (selectedDomain ? productsForDomain(selectedDomain) : []),
    [selectedDomain]
  )
  const filtered = useMemo(
    () =>
      applyProductFacets(filterProducts(products, filter, productIdFilter), facets, hasCertLink),
    [products, filter, productIdFilter, facets]
  )

  const viewingLabel = asset?.label ?? (selectedDomain ? DOMAINS[selectedDomain].label : '')

  // "Filters" here means: viewing something other than the default domain, and/or
  // a product-name search or an exact product-id set is narrowing the list — the
  // things `onClearAll` resets.
  const activeFilterCount =
    (selectedDomain !== 'tls' ? 1 : 0) +
    (filter.trim() || (productIdFilter && productIdFilter.length > 0) ? 1 : 0) +
    Object.values(facets).filter((v) => v !== 'all').length

  return (
    <div className="flex flex-col items-start gap-4 lg:flex-row">
      <div className="hidden w-full lg:block lg:w-auto">
        <AssetList
          persona={persona}
          selectedDomain={selectedDomain}
          onSelect={onSelect}
          onSelectProduct={onSelectProduct}
        />
      </div>
      <div className="w-full space-y-2 lg:hidden">
        {viewingLabel && (
          <p className="text-xs text-muted-foreground">
            Viewing: <span className="font-semibold text-foreground">{viewingLabel}</span>
          </p>
        )}
        <MobileFilterDrawer
          filterContent={
            <AssetList
              persona={persona}
              selectedDomain={selectedDomain}
              onSelect={onSelect}
              onSelectProduct={onSelectProduct}
            />
          }
          activeFilterCount={activeFilterCount}
          onClearAll={() => {
            // Reset to the default domain and clear ?domain= (one URL write).
            setSelectedDomain('tls')
            setFilter('')
            setProductIdFilter(undefined)
            onViewChange?.(null)
          }}
        />
      </div>

      <div className="min-w-0 flex-1 lg:min-w-[380px]">
        {asset ? (
          <>
            <AssetDetailCard
              asset={asset}
              inPlan={plan.includes(asset.id)}
              onToggle={() => togglePlanAsset(asset.id)}
            />
            {(asset.decision === 'mitigate' || asset.decision === 'roadmap') && (
              <div className="mt-3">
                <GapCard asset={asset} hasCandidates={products.length > 0} />
              </div>
            )}
          </>
        ) : selectedDomain ? (
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
            <h2 className="text-base font-bold text-foreground">{DOMAINS[selectedDomain].label}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Foundational building blocks &amp; tooling — browse the full set below.
            </p>
          </div>
        ) : null}

        {selectedDomain && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {asset ? 'Products that replace this' : 'Products'} ·{' '}
                <span className="text-foreground">{products.length} in catalog</span>
              </p>
              <div className="relative w-full sm:w-56">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value)
                    // Typing a fresh search must win over a stale deep-link id set —
                    // filterProducts() would otherwise keep ignoring it.
                    setProductIdFilter(undefined)
                    consumeDeepLink()
                  }}
                  placeholder="Filter products…"
                  aria-label="Filter products"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FilterDropdown
                size="sm"
                ariaLabel="Filter by catalogue population"
                defaultLabel="All products"
                items={[
                  { id: 'pqc_relevant', label: 'PQC capability or plan' },
                  { id: 'migration_baseline', label: 'Migration baseline (no confirmed PQC)' },
                ]}
                selectedId={facets.population === 'all' ? 'All' : facets.population}
                onSelect={(id) =>
                  setFacet((f) => ({
                    ...f,
                    population: (id === 'All' || !id ? 'all' : id) as ProductFacets['population'],
                  }))
                }
              />
              <FilterDropdown
                size="sm"
                ariaLabel="Filter by PQC status"
                defaultLabel="Any PQC status"
                items={[
                  { id: 'available', label: 'Available' },
                  { id: 'partial', label: 'Partial' },
                  { id: 'planned', label: 'Planned / roadmap' },
                  { id: 'none', label: 'None' },
                  { id: 'unknown', label: 'Not yet determined' },
                ]}
                selectedId={facets.pqc === 'all' ? 'All' : facets.pqc}
                onSelect={(id) =>
                  setFacet((f) => ({
                    ...f,
                    pqc: (id === 'All' || !id ? 'all' : id) as ProductFacets['pqc'],
                  }))
                }
              />
              <FilterDropdown
                size="sm"
                ariaLabel="Filter by certification link"
                defaultLabel="Any certification"
                items={[
                  { id: 'linked', label: 'Has a certification link' },
                  { id: 'none', label: 'No certification link' },
                ]}
                selectedId={facets.certified === 'all' ? 'All' : facets.certified}
                onSelect={(id) =>
                  setFacet((f) => ({
                    ...f,
                    certified: (id === 'All' || !id ? 'all' : id) as ProductFacets['certified'],
                  }))
                }
              />
              {filtered.length !== products.length && (
                <span className="text-[11px] text-muted-foreground">
                  Showing {filtered.length} of {products.length}
                </span>
              )}
            </div>
            {facetsBeforeLink && (
              <div className="mt-2">
                <DeepLinkNotice
                  kind="widened"
                  message="The linked product was hidden by your filters, so they were cleared to show it."
                  onUndo={() => {
                    setFacets(facetsBeforeLink)
                    setFacetsBeforeLink(null)
                  }}
                  onDismiss={() => setFacetsBeforeLink(null)}
                />
              </div>
            )}
            {deprecatedProductCount > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {deprecatedProductCount} additional catalog{' '}
                {deprecatedProductCount === 1 ? 'entry is' : 'entries are'} currently hidden pending
                downloadable proof.
              </p>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  <p>No catalog products mapped here yet.</p>
                  {onGoToRoadmaps && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        logMigrateAction(
                          'Check Vendor Roadmaps Instead',
                          selectedDomain ?? undefined
                        )
                        onGoToRoadmaps()
                      }}
                    >
                      Check vendor roadmaps instead
                    </Button>
                  )}
                </div>
              ) : filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  No products match “{filter}”.
                </p>
              ) : (
                filtered.map((p) => {
                  const isLinked = !!expandProductId && p.productId === expandProductId
                  return (
                    <ProductRow
                      // Re-key the linked row per link so it mounts expanded even if
                      // it was already on screen collapsed (and per Back, below).
                      key={`${p.productId || p.softwareName}${isLinked ? `:${deepLinkKey}` : ''}:${rowEpoch.get(p.productId) ?? 0}`}
                      product={p}
                      defaultExpanded={isLinked}
                      onExpand={
                        onProductOpen && p.productId
                          ? () => onProductOpen(p.productId, selectedDomain)
                          : undefined
                      }
                      onCollapse={
                        isLinked
                          ? consumeDeepLink
                          : onProductClose && p.productId
                            ? () => onProductClose(p.productId)
                            : undefined
                      }
                      // Key the choice on the domain id, not the replace-asset id:
                      // foundation/infrastructure domains have no ReplaceAsset, so
                      // gating on `asset` left their Choose button dead. For replace
                      // domains selectedDomain === asset.id, so behavior is unchanged.
                      chosen={(choice[selectedDomain] ?? []).includes(p.softwareName)}
                      onChoose={() => chooseProduct(selectedDomain, p.softwareName)}
                    />
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AssetDetailCard({
  asset,
  inPlan,
  onToggle,
}: {
  asset: ReplaceAsset
  inPlan: boolean
  onToggle: () => void
}) {
  const decision = DECISIONS[asset.decision]
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-foreground">{asset.label}</h2>
          <Pill tone={decision.tone} icon={DECISION_ICON[asset.decision]}>
            {decision.label}
          </Pill>
        </div>
        <Button
          variant={inPlan ? 'secondary' : 'gradient'}
          size="sm"
          onClick={onToggle}
          aria-label={inPlan ? `Remove ${asset.label} from plan` : `Add ${asset.label} to plan`}
        >
          {inPlan ? (
            <>
              <Check size={14} /> In your plan
            </>
          ) : (
            <>
              <Plus size={14} /> Add to plan
            </>
          )}
        </Button>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{asset.where}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {asset.classical}
        </span>
        <ArrowRight size={14} className="text-muted-foreground" aria-hidden />
        <span className="rounded-md border border-status-success/30 bg-status-success/10 px-2 py-0.5 font-mono text-[11px] text-status-success">
          {asset.target}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-status-warning">
          <Clock size={12} aria-hidden />
          <strong>{asset.cnsaYear}</strong> · {asset.deadlineLabel}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-foreground/80">{asset.note}</p>
    </div>
  )
}

function GapCard({ asset, hasCandidates }: { asset: ReplaceAsset; hasCandidates: boolean }) {
  const isRoadmap = asset.decision === 'roadmap'
  const decision = DECISIONS[asset.decision]
  const toneClass = isRoadmap
    ? { border: 'border-status-warning/40', bg: 'bg-status-warning/5', text: 'text-status-warning' }
    : { border: 'border-status-error/40', bg: 'bg-status-error/5', text: 'text-status-error' }

  return (
    <div className={`rounded-xl border border-dashed ${toneClass.border} ${toneClass.bg} p-4`}>
      <div className={`flex items-center gap-2 ${toneClass.text}`}>
        <AlertTriangle size={16} aria-hidden />
        <span className="text-sm font-semibold">
          {isRoadmap
            ? 'No GA quantum-safe product yet — vendor has announced one'
            : 'No GA quantum-safe product for this yet'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{asset.note}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Lands in Wave {asset.wave}, flagged{' '}
        <strong className={toneClass.text}>{decision.label}</strong>.
        {isRoadmap
          ? ' Check the vendor roadmaps tab for the announced timeline.'
          : hasCandidates && ' Partial / early candidates are listed below — none are GA yet.'}
      </p>
    </div>
  )
}
