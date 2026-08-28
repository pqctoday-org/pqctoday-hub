// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  FileText,
  Newspaper,
  BookText,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useMigrateSelectionStore, useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import {
  REPLACE_ASSETS,
  DECISIONS,
  DOMAINS,
  classifyProductDomain,
  type DomainId,
  type ReplaceAsset,
} from '@/data/migrationAssets'
import { softwareData, vendorMap } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { getCertsForProduct } from '@/data/certificationXrefData'
import {
  productsForDomain,
  productsForVendor,
  domainProductCount,
  filterProducts,
} from '@/components/Migrate/Workbench/workbenchCatalog'
import { productPqcStatus, productFipsBadge } from '@/components/Migrate/Workbench/productStatus'
import { proofFreshness } from '@/components/Migrate/Workbench/proofFreshness'
import { useMigrationPlan } from '@/components/Migrate/Workbench/useMigrationPlan'
import { WAVES_FALLBACK } from '@/components/Migrate/Workbench/waves'
import { downloadPlanCbom } from '@/components/Migrate/Workbench/cbomExport'
import { useVendorConcentrationRisks } from '@/components/Migrate/Workbench/vendorConcentrationRisk'
import { TONE_CLASS, type Tone } from '@/data/migrateToneClass'
import type {
  SoftwareItem,
  CertificationXref,
  VendorRoadmap,
  VendorRoadmapEnrichment,
} from '@/types/MigrateTypes'
import { deriveVendorRoadmapDisplay } from '@/components/Migrate/vendorRoadmapDisplay'
import { MobileSheet } from '../primitives/Sheet'

const CERT_TYPE_ORDER: CertificationXref['certType'][] = [
  'FIPS 140-3',
  'ACVP',
  'Common Criteria',
  'PSA Certified',
]

// 2026-08-28 foundation-domain reach: same derivation as desktop's AssetList
// (Migrate/Workbench/AssetList.tsx) — the 8 domains with no seeded
// "replace what you run" asset (crypto libraries, platforms, network,
// hardware, discovery, blockchain, identity, national programs). Until this
// change, nothing on mobile could ever set `selectedDomain` to one of these,
// making the 604 products living only in them permanently unreachable —
// not a legibility gap, an unreachability one.
const FOUNDATION_DOMAINS: DomainId[] = Object.values(DOMAINS)
  .filter((d) => d.kind === 'foundation')
  .map((d) => d.id)

type Tab = 'replace' | 'plan' | 'roadmaps' | 'vendorrisk'

const TABS: { id: Tab; label: string }[] = [
  { id: 'replace', label: 'Replace' },
  { id: 'plan', label: 'Plan' },
  { id: 'roadmaps', label: 'Vendors' },
  { id: 'vendorrisk', label: 'Risk' },
]

function Badge({
  tone,
  children,
  title,
  size = 'sm',
}: {
  tone: string
  children: ReactNode
  title?: string
  /** 'sm' (default) is the original, unchanged size used by the row and
   * every other tab. 'md' is for the detail sheet only, where these badges
   * sit as the first thing a reader sees and 'sm' read as the smallest
   * text on the sheet (2026-08-28 legibility follow-up). */
  size?: 'sm' | 'md'
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-md border font-semibold',
        size === 'md' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px]',
        // tone is real desktop status-derived text (DECISIONS/productPqcStatus/
        // productFipsBadge/proofFreshness), not typed as Tone this far
        // upstream — same loose-string prop this Badge always had.
        TONE_CLASS[tone as Tone] ?? TONE_CLASS.muted
      )}
    >
      {children}
    </span>
  )
}

function canonicalOrder(list: ReplaceAsset[]): ReplaceAsset[] {
  return [...list].sort((a, b) => a.wave - b.wave || a.cnsaYear - b.cnsaYear)
}

/**
 * Mobile Migrate (handoff Phase 8 — Workflow set, design handoff §9).
 *
 * The README's own §9 prose ("product catalog with layer chips, Security
 * Stack/Cloud/Network, sticky compare bar") describes a DIFFERENT, already-
 * deleted legacy page (`MigrateView.tsx`, retired 2026-06-24) — verified by
 * research before writing any UI. The real `/migrate` route renders
 * `MigrationWorkbench.tsx`, an asset-first planner with 4 real tabs (Replace/
 * Plan/Vendor roadmaps/Vendor risk), matching the target screenshot (which
 * itself has 2 stale numbers, corrected here by reading straight from
 * `migrationAssets.ts`: TLS's real cnsaYear is 2025 not 2035, and Secure
 * email's real decision is 'mitigate' → "Mitigate", not "Track roadmap").
 * Scope confirmed with the user (2026-08-23): all 4 real tabs.
 *
 * Every section reuses real desktop logic verbatim: REPLACE_ASSETS/DECISIONS
 * (migrationAssets.ts), useMigrateSelectionStore (the same plan/choice state
 * desktop's Replace/Plan tabs read and write — Add-to-plan and Choose on
 * mobile land in the identical store desktop reads), productPqcStatus/
 * productFipsBadge/proofFreshness (the real per-product badge logic),
 * useMigrationPlan() (the real posture/wave-grouping hook), WAVES_FALLBACK
 * (the real 4-wave sequencing copy), and downloadPlanCbom (the real CBOM
 * export, byte-identical output to desktop's).
 *
 * The Vendor risk tab's 4 real risk signals (single-source domains, vendor
 * concentration, certification gap, geographic concentration) reuse
 * useVendorConcentrationRisks() verbatim — the same hook
 * VendorConcentrationRiskPanel renders on desktop, extracted to a pure
 * module (2026-08-24 audit fix) so both surfaces compute identical numbers
 * AND identical severity thresholds from the same catalog data. A prior
 * version of this file carried a hand-copied severity computation with
 * different thresholds (25/50/40 vs desktop's 40/30/50) — the same vendor
 * data could read "severe" on a phone and calm on a laptop; that's the bug
 * this reuse closes. `SupplyChainRiskMatrix` (that tab's other real
 * sub-view, per its own comment "a different-shaped view of the SAME tab")
 * is dropped, stated below.
 *
 * 2026-08-28 (real production feedback): foundation-domain browsing (the 8
 * domains with no seeded "what you run" asset — crypto libraries, platforms,
 * network, hardware, discovery, blockchain, identity, national programs) was
 * a stated cut until this date. It made 604 of ~1,011 catalog products
 * permanently unreachable on mobile — not a legibility gap, an
 * unreachability one, since the product detail sheet only ever opens from a
 * selected domain's product list. Mirrors desktop's AssetList.tsx grouping
 * (a chip per foundation domain with its product count) rather than its
 * literal vertical-list component, matching this file's own chip idiom.
 * `SupplyChainRiskMatrix` remains the only real stated cut.
 *
 * 2026-08-24 (real production feedback): certifications (ACVP/FIPS 140-3/
 * Common Criteria, via the same `getCertsForProduct` desktop reads) and the
 * real `VendorRoadmapPanel` were the two pieces of the originally-cut
 * `ProductDetail` expansion a reader actually asked for. Both are now real,
 * not stated cuts: a product row opens a detail sheet (certifications + PQC
 * capabilities + validation/brief/manual links; proof.detail moved here too,
 * off the row where it used to render unconditionally on every card), and
 * the Vendors tab's roadmap cards open the genuine `VendorRoadmapPanel` --
 * kept there rather than duplicated into the product sheet (confirmed with
 * the user), with a "View {vendor}'s roadmap" button in the product sheet
 * crossing over to it directly.
 */
export function MobileMigrateView() {
  const [tab, setTab] = useState<Tab>('replace')
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('tls')
  // 2026-08-28: the product list's own "Filter products…" box (mirrors
  // desktop's ReplaceTab.tsx). Reset on every domain switch — see
  // handleSelectDomain below — so a filter typed under one domain can never
  // silently hide another domain's whole product list.
  const [filter, setFilter] = useState('')
  // 2026-08-28: catalog-wide product search — no desktop equivalent exists
  // to mirror (AssetList's search matches domain labels, ReplaceTab's
  // matches products within ONE already-selected domain). While non-empty,
  // this replaces the domain-chip browsing UI entirely rather than stacking
  // alongside it, so a reader is never shown two different product lists.
  const [catalogQuery, setCatalogQuery] = useState('')
  const [roadmapQuery, setRoadmapQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<SoftwareItem | null>(null)
  // Cross-nav from a product's detail sheet ("View {vendor}'s roadmap") into
  // the Vendors tab, opening that vendor's own roadmap sheet directly rather
  // than leaving the reader to find it again in the list (2026-08-24, real
  // production feedback + follow-up: roadmap detail lives in the Vendors tab
  // only, not duplicated into the product sheet).
  const [pendingVendorId, setPendingVendorId] = useState<string | null>(null)

  const persona = usePersonaStore((s) => s.selectedPersona)
  const plan = useMigrateSelectionStore((s) => s.plan)
  const choice = useMigrateSelectionStore((s) => s.choice)
  const togglePlanAsset = useMigrateSelectionStore((s) => s.togglePlanAsset)
  const chooseProduct = useMigrateSelectionStore((s) => s.chooseProduct)
  const removeFromPlan = useMigrateSelectionStore((s) => s.removeFromPlan)
  const clearPlan = useMigrateSelectionStore((s) => s.clearPlan)

  const asset = REPLACE_ASSETS.find((a) => a.id === selectedDomain) ?? null
  const decision = asset ? DECISIONS[asset.decision] : null

  const narrowed = useMemo(
    () => (persona ? REPLACE_ASSETS.filter((a) => a.focusPersonas.includes(persona)) : []),
    [persona]
  )
  const narrowingActive = narrowed.length > 0
  const assetList = useMemo(
    () => canonicalOrder(narrowingActive ? narrowed : REPLACE_ASSETS),
    [narrowingActive, narrowed]
  )

  const products = useMemo(() => productsForDomain(selectedDomain), [selectedDomain])
  const filteredProducts = useMemo(() => filterProducts(products, filter), [products, filter])

  // Shared by both chip rows (the 10 replace assets and the 8 foundation
  // domains below) so switching domains always clears a stale filter —
  // mirrors desktop's ReplaceTab.tsx onSelect.
  const handleSelectDomain = (id: DomainId) => {
    setSelectedDomain(id)
    setFilter('')
  }

  // Catalog-wide search results (all ~1,011 products, not just one domain's
  // slice) — filterProducts already matches name/category/vendorId, so no
  // new matcher is needed. Capped: the per-domain filter above never needed
  // a cap (201 is the largest single domain), but a short, common substring
  // here can match across the whole catalog with no natural ceiling.
  const CATALOG_SEARCH_LIMIT = 50
  // 2026-08-28: measured against the real catalog — a single letter matched
  // 872-899 of 906 active products, while real short words landed at 62-268
  // (see the gap report this session). Below this length, a query isn't
  // really searching; skip filterProducts entirely rather than compute (and
  // then hide) an near-whole-catalog match on every keystroke.
  const MIN_CATALOG_QUERY_LENGTH = 2
  const trimmedCatalogQuery = catalogQuery.trim()
  const catalogMatches = useMemo(
    () =>
      trimmedCatalogQuery.length >= MIN_CATALOG_QUERY_LENGTH
        ? filterProducts(softwareData, trimmedCatalogQuery)
        : [],
    [trimmedCatalogQuery]
  )
  const catalogResults = catalogMatches.slice(0, CATALOG_SEARCH_LIMIT)
  // Two-tier overflow message: "over the cap but under half the catalog" is
  // the realistic range for a genuine short-word query (62-268, measured);
  // "over half the catalog" only happens for queries barely past the
  // minimum length that still match almost everything — "Showing 50 of
  // 899" undersells that, so it gets a different, blunter message.
  const catalogMatchesAreExtreme = catalogMatches.length > softwareData.length / 2

  const posture = useMigrationPlan()

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-1">
        <h1 className="sr-only">Migrate</h1>
      </div>
      <p className="mb-4 text-[11.5px] leading-relaxed text-muted-foreground">
        Pick the cryptography you run to get a sequenced, quantum-safe plan aligned to NIST IR 8547
        (Initial Public Draft) &amp; CNSA 2.0.
      </p>

      <div className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant="ghost"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn(
              'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
              tab === t.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {t.label}
            {t.id === 'plan' && posture.plannedAssets.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-foreground/25 px-1.5 text-sim-chip">
                {posture.plannedAssets.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {tab === 'replace' && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Search all products…"
              aria-label="Search all products"
              className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-[12px] text-foreground focus:outline-none"
            />
          </div>

          {trimmedCatalogQuery.length >= MIN_CATALOG_QUERY_LENGTH ? (
            <div className="flex flex-col gap-2">
              {/* 2026-08-28: aria-live on just this count text, not the
               * result list below it — announcing every re-rendered
               * MobileProductRow on each keystroke would be unusable for a
               * screen-reader user, not an improvement. */}
              <p
                aria-live="polite"
                aria-atomic="true"
                className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Search results · <span className="text-foreground">{catalogMatches.length}</span>
              </p>
              {catalogResults.length === 0 ? (
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground"
                >
                  No matches for "{catalogQuery}".
                </p>
              ) : (
                catalogResults.map((p) => {
                  // Same defensive fallback as MobileVendorProductsSheet — a
                  // real active catalog row always resolves here.
                  const domain = classifyProductDomain(p.categoryName, p.infrastructureLayer)
                  if (!domain) {
                    return (
                      <div
                        key={p.productId || p.softwareName}
                        className="rounded-xl border border-border bg-card p-3"
                      >
                        <p className="text-[12.5px] font-bold text-foreground">{p.softwareName}</p>
                        <p className="mt-1 text-[10.5px] text-muted-foreground">
                          Not available in the product catalog browser.
                        </p>
                      </div>
                    )
                  }
                  return (
                    <MobileProductRow
                      key={p.productId || p.softwareName}
                      product={p}
                      chosen={(choice[domain] ?? []).includes(p.softwareName)}
                      onChoose={() => chooseProduct(domain, p.softwareName)}
                      onSelect={() => setSelectedProduct(p)}
                    />
                  )
                })
              )}
              {catalogMatches.length > CATALOG_SEARCH_LIMIT &&
                (catalogMatchesAreExtreme ? (
                  <p className="text-center text-[10.5px] text-muted-foreground">
                    {catalogMatches.length} products match — try a more specific product or vendor
                    name.
                  </p>
                ) : (
                  <p className="text-center text-[10.5px] text-muted-foreground">
                    Showing {CATALOG_SEARCH_LIMIT} of {catalogMatches.length} matches — refine your
                    search.
                  </p>
                ))}
            </div>
          ) : trimmedCatalogQuery.length > 0 ? (
            <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground">
              Type at least {MIN_CATALOG_QUERY_LENGTH} characters to search all{' '}
              {softwareData.length} products.
            </p>
          ) : (
            <>
              {narrowingActive && (
                <p className="text-[10.5px] text-muted-foreground">
                  Showing {narrowed.length} matched to your role ·{' '}
                  <span className="text-foreground">{REPLACE_ASSETS.length} total</span>
                </p>
              )}
              <div className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
                {assetList.map((a) => (
                  <Button
                    key={a.id}
                    type="button"
                    variant="ghost"
                    onClick={() => handleSelectDomain(a.id)}
                    aria-pressed={selectedDomain === a.id}
                    className={cn(
                      'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
                      selectedDomain === a.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground'
                    )}
                  >
                    {a.label}
                    {a.hndl && <span className="ml-1 text-sim-chip text-status-error">HNDL</span>}
                  </Button>
                ))}
              </div>

              {/* 2026-08-28 foundation-domain reach: the 8 domains with no
               * seeded "what you run" asset — mirrors desktop AssetList.tsx's
               * "Foundations & infrastructure" grouping (label + product count
               * per chip), in this file's own horizontal-chip idiom rather than
               * desktop's vertical list. */}
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Foundations &amp; infrastructure
              </p>
              <div className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
                {FOUNDATION_DOMAINS.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    onClick={() => handleSelectDomain(id)}
                    aria-pressed={selectedDomain === id}
                    className={cn(
                      'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
                      selectedDomain === id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground'
                    )}
                  >
                    {DOMAINS[id].label} · {domainProductCount(id)}
                  </Button>
                ))}
              </div>

              {asset && decision ? (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="text-[13.5px] font-bold text-foreground">{asset.label}</h2>
                      <Badge tone={decision.tone}>{decision.label}</Badge>
                    </div>
                    <Button
                      type="button"
                      variant={plan.includes(asset.id) ? 'secondary' : 'gradient'}
                      size="sm"
                      onClick={() => togglePlanAsset(asset.id)}
                      className="h-8 text-[11px]"
                    >
                      {plan.includes(asset.id) ? (
                        <>
                          <Check size={13} /> In your plan
                        </>
                      ) : (
                        <>
                          <Plus size={13} /> Add to plan
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">{asset.where}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {asset.classical}
                    </span>
                    <ArrowRight size={12} className="text-muted-foreground" aria-hidden="true" />
                    <span className="rounded border border-status-success/30 bg-status-success/10 px-1.5 py-0.5 font-mono text-[10px] text-status-success">
                      {asset.target}
                    </span>
                    <span className="ml-auto text-[10.5px] font-semibold text-status-warning">
                      {asset.cnsaYear} · {asset.deadlineLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-[10.5px] leading-relaxed text-foreground/80">
                    {asset.note}
                  </p>
                </div>
              ) : selectedDomain ? (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-3.5">
                  <h2 className="text-[13.5px] font-bold text-foreground">
                    {DOMAINS[selectedDomain].label}
                  </h2>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">
                    Foundational building blocks &amp; tooling — browse the full set below.
                  </p>
                </div>
              ) : null}

              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {asset ? 'Products that replace this' : 'Products'} ·{' '}
                <span className="text-foreground">{products.length} in catalog</span>
              </p>
              {products.length > 0 && (
                <div className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter products…"
                    aria-label="Filter products"
                    className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-[12px] text-foreground focus:outline-none"
                  />
                </div>
              )}
              {/* 2026-08-28: the visible heading above stays the domain's
               * unfiltered total by design (round 4) — it never changes as
               * you type, so it can't double as filter feedback. This
               * sr-only line is the only thing that reports the filtered
               * count to a screen reader. */}
              {filter.trim() && (
                <p className="sr-only" aria-live="polite" aria-atomic="true">
                  {filteredProducts.length} of {products.length} products match "{filter}".
                </p>
              )}
              <div className="flex flex-col gap-2">
                {products.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground">
                    No catalog products mapped here yet.
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground">
                    No matches for "{filter}".
                  </p>
                ) : (
                  filteredProducts.map((p) => (
                    <MobileProductRow
                      key={p.productId || p.softwareName}
                      product={p}
                      chosen={(choice[selectedDomain] ?? []).includes(p.softwareName)}
                      onChoose={() => chooseProduct(selectedDomain, p.softwareName)}
                      onSelect={() => setSelectedProduct(p)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'plan' && (
        <MobilePlanTab
          posture={posture}
          choice={choice}
          chooseProduct={chooseProduct}
          removeFromPlan={removeFromPlan}
          clearPlan={clearPlan}
          onGoToReplace={() => setTab('replace')}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {tab === 'roadmaps' && (
        <MobileRoadmapsTab
          query={roadmapQuery}
          onQueryChange={setRoadmapQuery}
          onSelectProduct={setSelectedProduct}
          openVendorId={pendingVendorId}
          onOpenedVendor={() => setPendingVendorId(null)}
        />
      )}

      {tab === 'vendorrisk' && <MobileVendorRiskTab />}

      <MobileProductDetailSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onViewVendorRoadmap={(vendorId) => {
          setSelectedProduct(null)
          setPendingVendorId(vendorId)
          setTab('roadmaps')
        }}
      />

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The Supply Chain Risk Matrix is on a laptop.
      </p>
    </div>
  )
}

function MobileProductRow({
  product,
  chosen,
  onChoose,
  onSelect,
}: {
  product: SoftwareItem
  chosen: boolean
  onChoose: () => void
  onSelect: () => void
}) {
  const pqc = productPqcStatus(product)
  const fips = productFipsBadge(product)
  const proof = proofFreshness(product)
  // ADDED (real production feedback, 2026-08-24): proof.detail used to render
  // here unconditionally, on every row, taking real vertical space for a
  // sentence most readers never asked to see up front. It's still real
  // content -- just moved behind a tap, in the detail sheet below, same as
  // the certifications that were previously not reachable on mobile at all.
  const certCount = getCertsForProduct(product.productId, product.softwareName).length
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        chosen ? 'border-status-success/40 bg-status-success/5' : 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onSelect}
          className="h-auto min-w-0 flex-1 flex-col items-start whitespace-normal rounded-none p-0 text-left font-normal"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13.5px] font-bold text-foreground">{product.softwareName}</span>
            {product.vendorId && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {product.vendorId}
              </span>
            )}
            <Badge tone={pqc.tone}>{pqc.label}</Badge>
            {fips && <Badge tone={fips.tone}>{fips.label}</Badge>}
            <Badge tone={proof.tone} title={proof.detail}>
              {proof.label}
            </Badge>
            {certCount > 0 && (
              <Badge tone="success">
                {certCount} cert{certCount === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{product.categoryName}</p>
        </Button>
        <Button
          type="button"
          variant={chosen ? 'secondary' : 'outline'}
          size="sm"
          onClick={onChoose}
          className="h-8 shrink-0 text-[11px]"
        >
          {chosen ? (
            <>
              <Check size={13} /> In plan
            </>
          ) : (
            <>
              <Plus size={13} /> Choose
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function MobileProductDetailSheet({
  product,
  onClose,
  onViewVendorRoadmap,
}: {
  product: SoftwareItem | null
  onClose: () => void
  onViewVendorRoadmap: (vendorId: string) => void
}) {
  const certsByType = useMemo(() => {
    const certs = product ? getCertsForProduct(product.productId, product.softwareName) : []
    const map = new Map<CertificationXref['certType'], CertificationXref[]>()
    for (const c of certs) {
      const list = map.get(c.certType)
      if (list) list.push(c)
      else map.set(c.certType, [c])
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.certDate < b.certDate ? 1 : a.certDate > b.certDate ? -1 : 0))
    }
    return map
  }, [product])

  const supportDetail = (product?.pqcSupport || '')
    .replace(/^\s*(yes|no|partial)\b[\s:,-]*/i, '')
    .replace(/^\(|\)$/g, '')
    .trim()

  // Real production feedback, 2026-08-27: proof.detail (why the PQC-support
  // claim is fresh/stale) previously only reached a reader through the row
  // Badge's native `title` tooltip, which does not fire on tap on mobile —
  // the sentence was effectively unreadable on a phone. Rendered here as
  // real text now, alongside the capabilities it qualifies.
  const proof = product ? proofFreshness(product) : null

  // Real production feedback, 2026-08-27: the row shows the PQC-support tier
  // (Yes/Partial/No) and FIPS badge, but tapping into this sheet never
  // repeated them — a reader scrolling the sheet had no way to recheck that
  // status without closing it and re-reading the row.
  const pqc = product ? productPqcStatus(product) : null
  const fips = product ? productFipsBadge(product) : null

  const hasVendorRoadmap =
    !!product?.vendorId &&
    (roadmapByVendorId.has(product.vendorId) || enrichmentByVendorId.has(product.vendorId))

  return (
    <MobileSheet
      open={!!product}
      onClose={onClose}
      title={product?.softwareName}
      large
      testId="migrate-product-detail-sheet"
    >
      {product && (
        <div className="flex flex-col gap-3">
          {(pqc || fips) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {pqc && (
                <Badge tone={pqc.tone} size="md">
                  {pqc.label}
                </Badge>
              )}
              {fips && (
                <Badge tone={fips.tone} size="md">
                  {fips.label}
                </Badge>
              )}
            </div>
          )}

          {certsByType.size > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Certifications
              </p>
              <div className="flex flex-col gap-2">
                {CERT_TYPE_ORDER.filter((t) => certsByType.has(t)).map((type) => (
                  <div key={type} className="rounded-lg border border-border bg-card p-2.5">
                    <p className="text-[11.5px] font-bold text-foreground">{type}</p>
                    <div className="mt-1 flex flex-col gap-1.5">
                      {certsByType.get(type)!.map((c) => (
                        <a
                          key={c.certId}
                          href={c.certLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start justify-between gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1.5 text-[11.5px] text-foreground/90 hover:bg-muted/40"
                        >
                          <span>
                            <span className="font-mono">{c.certId}</span>
                            {c.certificationLevel && <> · {c.certificationLevel}</>}
                            {c.pqcAlgorithms && !c.pqcAlgorithms.startsWith('No ') && (
                              <span className="mt-0.5 block text-[12.5px] font-medium text-foreground/80">
                                {c.pqcAlgorithms}
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground">
                            {c.certDate}
                            <ExternalLink size={10} aria-hidden="true" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proof && (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Proof status
              </p>
              <Badge tone={proof.tone} size="md">
                {proof.label}
              </Badge>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/90">{proof.detail}</p>
            </div>
          )}

          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              PQC capabilities
            </p>
            {supportDetail && (
              <p className="text-[13.5px] font-medium text-foreground">{supportDetail}</p>
            )}
            {product.pqcCapabilityDescription && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/90">
                {product.pqcCapabilityDescription}
              </p>
            )}
            {!supportDetail && !product.pqcCapabilityDescription && (
              <p className="text-[13px] italic text-muted-foreground">
                No PQC capability details documented for this product.
              </p>
            )}
          </div>

          {(product.proofUrl || product.productBriefUrl || product.userManualUrl) && (
            <div className="flex flex-wrap items-center gap-3">
              {product.proofUrl && (
                <a
                  href={product.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-status-success hover:underline"
                >
                  <FileText size={12} aria-hidden="true" /> Validation proof
                </a>
              )}
              {product.productBriefUrl && (
                <a
                  href={product.productBriefUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                >
                  <Newspaper size={12} aria-hidden="true" /> Product brief
                </a>
              )}
              {product.userManualUrl && (
                <a
                  href={product.userManualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                >
                  <BookText size={12} aria-hidden="true" /> User manual
                </a>
              )}
            </div>
          )}

          {hasVendorRoadmap && product.vendorId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewVendorRoadmap(product.vendorId!)}
              className="h-9 justify-between text-[11.5px]"
            >
              View {vendorMap.get(product.vendorId)?.vendorDisplayName || product.vendorId}'s
              roadmap
              <ArrowRight size={13} aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </MobileSheet>
  )
}

function MobilePlanTab({
  posture,
  choice,
  chooseProduct,
  removeFromPlan,
  clearPlan,
  onGoToReplace,
  onSelectProduct,
}: {
  posture: ReturnType<typeof useMigrationPlan>
  choice: Record<string, string[]>
  chooseProduct: (assetId: string, productName: string) => void
  removeFromPlan: (assetId: string) => void
  clearPlan: () => void
  onGoToReplace: () => void
  onSelectProduct: (product: SoftwareItem) => void
}) {
  const nameToProductId = useMigrateSelectionStore((s) => s.nameToProductId)
  // Same two-step resolution as desktop's PlanProductRow (PlanTab.tsx) — by
  // name within the domain first, then by the id captured at selection time
  // if the product was renamed/moved since it was chosen. Skipping the
  // fallback would silently reintroduce the exact bug that fallback was
  // added to fix (2026-07-16), just on mobile instead of desktop.
  const resolveProduct = (domainId: string, name: string): SoftwareItem | undefined => {
    const byDomain = productsForDomain(domainId as DomainId).find((p) => p.softwareName === name)
    if (byDomain) return byDomain
    const cachedId = nameToProductId[name]
    return cachedId ? softwareData.find((p) => p.productId === cachedId) : undefined
  }

  const foundationDomainsWithChoices = posture.foundations.filter(
    (f) => (choice[f.id] ?? []).length > 0
  )
  const foundationSelectionCount = foundationDomainsWithChoices.reduce(
    (sum, f) => sum + (choice[f.id] ?? []).length,
    0
  )

  if (posture.plannedAssets.length === 0 && foundationSelectionCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <p className="text-[12.5px] font-semibold text-foreground">Nothing in your plan yet</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Pick the cryptography you run to build a sequenced migration plan.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onGoToReplace}>
          ← Add what you run
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Your assets, sequenced by exposure — external-facing traffic first.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearPlan}
          className="h-7 shrink-0 text-[10.5px] text-muted-foreground"
        >
          Clear all
        </Button>
      </div>

      {/* 2026-08-28: foundation-domain browsing shipped (round 4), making a
          foundation selection a mainstream mobile action, not the rare
          shared-link edge case the 2026-08-24 "see them on a laptop"
          summary line was written for. Full parity with desktop's
          PlanTab.tsx foundation section now: grouped by domain, each
          product tappable to reopen its real detail sheet, individually
          removable — nothing left to disclose as missing. */}
      {foundationDomainsWithChoices.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="bg-muted/40 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Foundations &amp; infrastructure · {foundationSelectionCount}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {foundationDomainsWithChoices.map((f) => {
              const names = choice[f.id] ?? []
              return (
                <div key={f.id}>
                  <div className="flex items-center justify-between bg-muted/20 px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-foreground">{f.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {names.length}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-border/50">
                    {names.map((name) => {
                      const product = resolveProduct(f.id, name)
                      return (
                        // 2026-08-28: the row's own padding used to live on
                        // this non-interactive wrapper while the tappable
                        // Button below sat at h-auto p-0 — a real ~15px tap
                        // box (the text's own line-height), not just a small
                        // look. `items-center` doesn't stretch children, so
                        // the fix moves the padding onto the button itself.
                        <div key={name} className="flex items-center gap-1.5 pr-3">
                          {product ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => onSelectProduct(product)}
                              className="min-h-11 min-w-0 flex-1 justify-start truncate rounded-md px-3 py-1.5 text-left text-[11px] font-medium text-foreground"
                            >
                              {name}
                            </Button>
                          ) : (
                            <span className="min-w-0 flex-1 truncate px-3 py-1.5 text-[11px] text-foreground">
                              {name}
                              <span className="ml-1.5 text-[10px] font-medium text-status-warning">
                                No longer in catalog
                              </span>
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => chooseProduct(f.id, name)}
                            aria-label={`Remove ${name} from plan`}
                            className="min-h-11 min-w-11 shrink-0 p-0 text-muted-foreground"
                          >
                            <X size={11} />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {posture.gaps.length > 0 && (
        <div className="rounded-xl border border-status-error/25 bg-status-error/[0.07] p-3">
          <p className="text-[11.5px] font-semibold text-status-error">
            {posture.gaps.length} asset{posture.gaps.length > 1 ? 's have' : ' has'} no GA
            quantum-safe product yet
          </p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            {posture.gaps.map((g) => g.label).join(', ')} — deploy a crypto gateway with a hard
            sunset date. Mitigation is never permanent.
          </p>
        </div>
      )}

      {posture.waves.map((group) => {
        const meta = WAVES_FALLBACK[group.wave]
        return (
          <div key={group.wave} className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-2">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                  meta.tileClass
                )}
              >
                {group.wave}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-foreground">{meta.title}</span>
                <span className="block text-[10px] text-muted-foreground">{meta.subtitle}</span>
              </span>
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {group.assets.length}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {group.assets.map((a) => {
                const decision = DECISIONS[a.decision]
                const chosen = choice[a.id] ?? []
                return (
                  <div key={a.id} className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-foreground">{a.label}</span>
                      <Badge tone={decision.tone}>{decision.label}</Badge>
                      <span className="ml-auto font-mono text-[10.5px] text-status-warning">
                        {a.cnsaYear}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromPlan(a.id)}
                        aria-label={`Remove ${a.label} from plan`}
                        className="h-7 w-7 shrink-0 p-0 text-muted-foreground"
                      >
                        <X size={13} />
                      </Button>
                    </div>
                    {chosen.length > 0 ? (
                      <div className="mt-1.5 flex flex-col gap-1">
                        {/* 2026-08-28: this row used to render `product` as a
                         * raw string with no resolution at all — no
                         * tap-to-view AND no "No longer in catalog" safety
                         * net either, unlike the foundation section above.
                         * Closes both gaps at once, reusing resolveProduct
                         * (defined once for this whole tab) and the same
                         * full-row tap-target sizing as the foundation
                         * section, so the two sections read as one pattern
                         * rather than two similar-but-different ones. */}
                        {chosen.map((name) => {
                          const resolvedProduct = resolveProduct(a.id, name)
                          return (
                            <div
                              key={name}
                              className="flex items-center gap-1.5 rounded bg-muted/30"
                            >
                              {resolvedProduct ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => onSelectProduct(resolvedProduct)}
                                  className="min-h-11 min-w-0 flex-1 justify-start truncate rounded px-2 py-1 text-left text-[11px] text-foreground"
                                >
                                  {name}
                                </Button>
                              ) : (
                                <span className="min-w-0 flex-1 truncate px-2 py-1 text-[11px] text-foreground">
                                  {name}
                                  <span className="ml-1.5 text-[10px] font-medium text-status-warning">
                                    No longer in catalog
                                  </span>
                                </span>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => chooseProduct(a.id, name)}
                                aria-label={`Remove ${name} from plan`}
                                className="min-h-11 min-w-11 shrink-0 p-0 text-muted-foreground"
                              >
                                <X size={11} />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="mt-1 text-[10.5px] text-muted-foreground">
                        {decision.key === 'mitigate'
                          ? 'No product — mitigate'
                          : 'No product chosen yet'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="gradient"
        size="sm"
        onClick={() =>
          downloadPlanCbom({
            planIds: posture.plannedAssets.map((a) => a.id),
            choice,
            timestamp: new Date().toISOString(),
          })
        }
        className="h-9 self-end text-[11.5px]"
      >
        <FileText size={13} /> Export plan + CBOM
      </Button>
    </div>
  )
}

function MobileRoadmapsTab({
  query,
  onQueryChange,
  onSelectProduct,
  openVendorId,
  onOpenedVendor,
}: {
  query: string
  onQueryChange: (q: string) => void
  onSelectProduct: (product: SoftwareItem) => void
  /** Set when a product's detail sheet asked to jump here for a specific
   *  vendor (2026-08-24, real production feedback) — opens that vendor's
   *  roadmap sheet immediately rather than leaving the reader to find it
   *  again in the list below. */
  openVendorId: string | null
  onOpenedVendor: () => void
}) {
  const selectedProductIds = useSelectedProductIds()
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  // 2026-08-28: which vendor's product-list sheet is open, distinct from
  // selectedVendorId (that one opens the roadmap sheet) — RoadmapVendorCard
  // now has two independent tap targets, not one.
  const [viewingVendorId, setViewingVendorId] = useState<string | null>(null)

  useEffect(() => {
    if (openVendorId) {
      setSelectedVendorId(openVendorId)
      onOpenedVendor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per incoming openVendorId, not on every render
  }, [openVendorId])

  const vendorIdByProductId = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of softwareData) {
      if (s.vendorId) map.set(s.productId, s.vendorId)
    }
    return map
  }, [])

  const roadmapEntries = useMemo(() => {
    const ids = new Set<string>([...roadmapByVendorId.keys(), ...enrichmentByVendorId.keys()])
    const entries = [...ids].map((vendorId) => ({
      vendorId,
      vendorName:
        roadmapByVendorId.get(vendorId)?.vendorName ||
        vendorMap.get(vendorId)?.vendorDisplayName ||
        vendorId,
    }))
    entries.sort((a, b) => a.vendorName.localeCompare(b.vendorName))
    return entries
  }, [])

  const committedVendorCount = useMemo(
    () =>
      [...vendorMap.values()].filter((v) =>
        ['Active', 'Partial', 'Announced'].includes(v.pqcCommitment)
      ).length,
    []
  )

  const myVendorIds = useMemo(() => {
    const ids = new Set<string>()
    for (const productId of selectedProductIds) {
      const vendorId = vendorIdByProductId.get(productId)
      if (vendorId) ids.add(vendorId)
    }
    return ids
  }, [selectedProductIds, vendorIdByProductId])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? roadmapEntries.filter(
        (e) => e.vendorName.toLowerCase().includes(q) || e.vendorId.toLowerCase().includes(q)
      )
    : roadmapEntries
  const myVendors = filtered.filter((e) => myVendorIds.has(e.vendorId))
  const otherVendors = filtered.filter((e) => !myVendorIds.has(e.vendorId))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">{roadmapByVendorId.size}</span> vendors with
        a published PQC roadmap · of{' '}
        <span className="font-semibold text-foreground">{committedVendorCount}</span> with a stated
        PQC commitment. Most vendors with a commitment publish no roadmap at all — this list is what
        the field has actually released.
      </p>
      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter vendors…"
          aria-label="Filter vendor roadmaps"
          className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-[12px] text-foreground focus:outline-none"
        />
      </div>

      {myVendors.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Your vendors · {myVendors.length}
          </p>
          <div className="flex flex-col gap-2">
            {myVendors.map((v) => (
              <RoadmapVendorCard
                key={v.vendorId}
                vendorId={v.vendorId}
                vendorName={v.vendorName}
                onSelect={() => setSelectedVendorId(v.vendorId)}
                onViewProducts={() => setViewingVendorId(v.vendorId)}
              />
            ))}
          </div>
        </div>
      )}
      <div>
        {myVendors.length > 0 && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            All vendors
          </p>
        )}
        <div className="flex flex-col gap-2">
          {otherVendors.map((v) => (
            <RoadmapVendorCard
              key={v.vendorId}
              vendorId={v.vendorId}
              vendorName={v.vendorName}
              onSelect={() => setSelectedVendorId(v.vendorId)}
              onViewProducts={() => setViewingVendorId(v.vendorId)}
            />
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-[11.5px] text-muted-foreground">
          No vendors match "{query}".
        </p>
      )}

      <MobileSheet
        open={!!selectedVendorId}
        onClose={() => setSelectedVendorId(null)}
        title={
          selectedVendorId
            ? roadmapByVendorId.get(selectedVendorId)?.vendorName ||
              vendorMap.get(selectedVendorId)?.vendorDisplayName ||
              selectedVendorId
            : undefined
        }
        large
        testId="vendor-roadmap-sheet"
      >
        {selectedVendorId && (
          <MobileVendorRoadmapPanel
            roadmap={roadmapByVendorId.get(selectedVendorId)}
            enrichment={enrichmentByVendorId.get(selectedVendorId)}
          />
        )}
      </MobileSheet>

      <MobileVendorProductsSheet
        vendorId={viewingVendorId}
        vendorName={
          viewingVendorId
            ? roadmapByVendorId.get(viewingVendorId)?.vendorName ||
              vendorMap.get(viewingVendorId)?.vendorDisplayName ||
              viewingVendorId
            : undefined
        }
        onClose={() => setViewingVendorId(null)}
        onSelectProduct={(p) => {
          setViewingVendorId(null)
          onSelectProduct(p)
        }}
      />
    </div>
  )
}

/** 2026-08-28: the vendor drill-down `RoadmapVendorCard`'s product-count tap
 * target opens — the browse half of "see everything this vendor makes"
 * (the roadmap sheet is the commitment/status half). Reuses MobileProductRow
 * verbatim, resolving each product's own domain via classifyProductDomain
 * since a vendor's catalog can span multiple domains and `chooseProduct`
 * needs the real domain id, not the vendor id. */
function MobileVendorProductsSheet({
  vendorId,
  vendorName,
  onClose,
  onSelectProduct,
}: {
  vendorId: string | null
  vendorName: string | undefined
  onClose: () => void
  onSelectProduct: (product: SoftwareItem) => void
}) {
  const [filter, setFilter] = useState('')
  const choice = useMigrateSelectionStore((s) => s.choice)
  const chooseProduct = useMigrateSelectionStore((s) => s.chooseProduct)

  const products = useMemo(() => (vendorId ? productsForVendor(vendorId) : []), [vendorId])
  const filteredProducts = useMemo(() => filterProducts(products, filter), [products, filter])

  return (
    <MobileSheet
      open={!!vendorId}
      onClose={() => {
        setFilter('')
        onClose()
      }}
      title={vendorName}
      large
      testId="vendor-products-sheet"
    >
      {vendorId && (
        <div className="flex flex-col gap-3">
          <p className="text-[10.5px] text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'} in catalog
          </p>
          {products.length > 0 && (
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter products…"
                aria-label="Filter products"
                className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-[12px] text-foreground focus:outline-none"
              />
            </div>
          )}
          {/* 2026-08-28: same reasoning as the Replace tab's per-domain
           * filter — the visible heading above is the unfiltered total,
           * so this sr-only line is what actually reports the filtered
           * count to a screen reader. */}
          {filter.trim() && (
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {filteredProducts.length} of {products.length} products match "{filter}".
            </p>
          )}
          <div className="flex flex-col gap-2">
            {products.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground">
                No catalog products for this vendor yet.
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground">
                No matches for "{filter}".
              </p>
            ) : (
              filteredProducts.map((p) => {
                // A real *active* catalog row always resolves (workbenchCatalog.ts's
                // own domain index build is guarded by a coverage test forbidding
                // this for active rows) — the fallback below is defensive, not a
                // real expected path.
                const domain = classifyProductDomain(p.categoryName, p.infrastructureLayer)
                if (!domain) {
                  return (
                    <div
                      key={p.productId || p.softwareName}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <p className="text-[12.5px] font-bold text-foreground">{p.softwareName}</p>
                      <p className="mt-1 text-[10.5px] text-muted-foreground">
                        Not available in the product catalog browser.
                      </p>
                    </div>
                  )
                }
                return (
                  <MobileProductRow
                    key={p.productId || p.softwareName}
                    product={p}
                    chosen={(choice[domain] ?? []).includes(p.softwareName)}
                    onChoose={() => chooseProduct(domain, p.softwareName)}
                    onSelect={() => {
                      setFilter('')
                      onSelectProduct(p)
                    }}
                  />
                )
              })
            )}
          </div>
        </div>
      )}
    </MobileSheet>
  )
}

function RoadmapVendorCard({
  vendorId,
  vendorName,
  onSelect,
  onViewProducts,
}: {
  vendorId: string
  vendorName: string
  onSelect: () => void
  onViewProducts: () => void
}) {
  const hasRoadmap = roadmapByVendorId.has(vendorId)
  const productCount = useMemo(() => productsForVendor(vendorId).length, [vendorId])
  // 2026-08-24 audit R4.8: same real field + "None detected" sentinel guard
  // as VendorRoadmapPanel.tsx:136 (desktop) — a per-vendor dated milestone,
  // not invented, was the one concrete fact these cards were missing.
  const targetDates = enrichmentByVendorId.get(vendorId)?.targetMigrationDates
  return (
    // 2026-08-28: was a single <Button> wrapping everything, including the
    // product-count line — no second tap target was possible without
    // nesting a <button> inside a <button> (the exact "nested-interactive"
    // violation this file's own AssetList.tsx already fixed once,
    // 2026-08-02). Now an inert container with two sibling buttons, same
    // shape MobileProductRow already establishes (row-select + Choose).
    <div className="rounded-xl border border-border bg-card p-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        // 2026-08-24, real production feedback + follow-up: this card used to
        // be a dead, unTappable summary. It's now the one place mobile reaches
        // the real VendorRoadmapPanel (GA status, algorithm coverage, dated
        // milestones) — a product's own detail sheet links here rather than
        // duplicating roadmap content.
        className="h-auto w-full flex-col items-stretch whitespace-normal p-0 text-left font-normal hover:bg-transparent"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] font-bold text-foreground">{vendorName}</p>
          <Badge tone={hasRoadmap ? 'success' : 'info'}>
            {hasRoadmap ? 'Published roadmap' : 'Enrichment only'}
          </Badge>
        </div>
        {targetDates && targetDates !== 'None detected' && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] text-muted-foreground">
            <Calendar size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            {targetDates}
          </p>
        )}
      </Button>
      {/* 2026-08-28: the second tap target — "browse this vendor's actual
       * products" (productsForVendor, unrestricted by domain) is a
       * different question from "what's their roadmap status" above.
       * min-h-11 + real padding (not h-auto p-0) — this is the only way
       * to reach the vendor drill-down at all, so its own hit box getting
       * the same real-content-height pass as MobileProductRow matters more
       * here than it would for a supplementary link. */}
      <Button
        type="button"
        variant="ghost"
        onClick={onViewProducts}
        className="mt-1 min-h-11 w-full justify-start rounded-md px-2 text-[10.5px] text-primary underline-offset-2 hover:underline"
      >
        {productCount} {productCount === 1 ? 'product' : 'products'} in catalog
      </Button>
    </div>
  )
}

const GA_STATUS_TONE: Record<string, Tone> = {
  ga: 'success',
  preview: 'warning',
  beta: 'warning',
  planned: 'muted',
}

/** Distilled, not resized: desktop's VendorRoadmapPanel treats every field
 * (scope chip, roadmap-status badge, hybrid mode, compliance frameworks,
 * quote) as equally prominent in one dense row + list. Here GA status,
 * algorithms, and migration dates lead -- the 3 facts that actually answer
 * "is this vendor ready and when" -- with the rest kept real but visually
 * secondary, using this screen's own Badge/Tone system rather than porting
 * desktop's inline color classes (2026-08-24, real production feedback).
 * Same derived data as desktop (deriveVendorRoadmapDisplay) -- only the
 * layout and hierarchy differ per platform. */
function MobileVendorRoadmapPanel({
  roadmap,
  enrichment,
}: {
  roadmap: VendorRoadmap | undefined
  enrichment: VendorRoadmapEnrichment | undefined
}) {
  const display = deriveVendorRoadmapDisplay(roadmap, enrichment)
  if (!display) return null
  const { title, roadmapUrl, gaStatus, dateLine, isEmpty } = display

  if (isEmpty) {
    return <p className="text-[12.5px] text-muted-foreground">No roadmap published.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-bold text-foreground">{title}</span>
          {gaStatus && <Badge tone={GA_STATUS_TONE[gaStatus.kind]}>{gaStatus.label}</Badge>}
        </div>
        {dateLine && (
          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <Calendar size={10} className="shrink-0" aria-hidden="true" />
            {dateLine.label === 'verified' ? 'Last verified' : 'Published'} {dateLine.date}
          </p>
        )}
        {roadmapUrl && (
          <a
            href={roadmapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 text-[12px] font-semibold text-primary"
          >
            <ExternalLink size={13} aria-hidden="true" /> Open the real roadmap
          </a>
        )}
      </div>

      {display.pqcAlgorithms.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Algorithms
          </p>
          <div className="flex flex-wrap gap-1">
            {display.pqcAlgorithms.map((alg) => (
              <span
                key={alg}
                className="rounded border border-primary/20 bg-primary/8 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
              >
                {alg}
              </span>
            ))}
          </div>
        </div>
      )}

      {display.migrationDates && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Target dates
          </p>
          <p className="text-[11.5px] text-foreground/90">{display.migrationDates}</p>
        </div>
      )}

      {(display.hybridModeText || display.complianceFrameworks.length > 0) && (
        <div className="flex flex-col gap-1 border-t border-border pt-2.5 text-[10.5px] text-muted-foreground">
          {display.hybridModeText && (
            <p>
              <span className="font-semibold text-foreground/80">Hybrid:</span>{' '}
              {display.hybridModeText}
            </p>
          )}
          {display.complianceFrameworks.length > 0 && (
            <p>
              <span className="font-semibold text-foreground/80">Compliance:</span>{' '}
              {display.complianceFrameworks.join(' · ')}
            </p>
          )}
        </div>
      )}

      {display.firstQuote && (
        <p className="border-l-2 border-border pl-2.5 text-[11px] italic leading-relaxed text-muted-foreground">
          &ldquo;{display.firstQuote}&rdquo;
        </p>
      )}
    </div>
  )
}

function MobileVendorRiskTab() {
  const risks = useVendorConcentrationRisks()

  return (
    <div className="flex flex-col gap-2.5">
      {risks.map((c) => (
        <div key={c.key} className="glass-panel p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-foreground">{c.title}</p>
            <span
              className={cn(
                'text-[15px] font-extrabold',
                c.severe ? 'text-status-warning' : 'text-foreground'
              )}
            >
              {c.headline}
            </span>
          </div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{c.detail}</p>
        </div>
      ))}
    </div>
  )
}
