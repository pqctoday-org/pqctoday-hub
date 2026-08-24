// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Check, FileText, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useMigrateSelectionStore, useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { REPLACE_ASSETS, DECISIONS, type DomainId, type ReplaceAsset } from '@/data/migrationAssets'
import { softwareData, vendorMap } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import {
  productsForDomain,
  productsForVendor,
} from '@/components/Migrate/Workbench/workbenchCatalog'
import { productPqcStatus, productFipsBadge } from '@/components/Migrate/Workbench/productStatus'
import { proofFreshness } from '@/components/Migrate/Workbench/proofFreshness'
import { useMigrationPlan } from '@/components/Migrate/Workbench/useMigrationPlan'
import { WAVES_FALLBACK } from '@/components/Migrate/Workbench/waves'
import { downloadPlanCbom } from '@/components/Migrate/Workbench/cbomExport'
import type { SoftwareItem } from '@/types/MigrateTypes'

type Tab = 'replace' | 'plan' | 'roadmaps' | 'vendorrisk'

const TABS: { id: Tab; label: string }[] = [
  { id: 'replace', label: 'Replace' },
  { id: 'plan', label: 'Plan' },
  { id: 'roadmaps', label: 'Vendors' },
  { id: 'vendorrisk', label: 'Risk' },
]

// Same tone→class mapping DECISIONS/Pill's TONE_CLASS carries — replicated
// (a small literal, not worth an ESLint exception on workbenchUi.tsx, which
// has JSX) so decision/status badges match desktop's real semantic tokens.
const TONE_CLASS: Record<string, string> = {
  success: 'text-status-success bg-status-success/10 border-status-success/30',
  primary: 'text-primary bg-primary/10 border-primary/30',
  info: 'text-status-info bg-status-info/10 border-status-info/30',
  warning: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  destructive: 'text-status-error bg-status-error/10 border-status-error/30',
  muted: 'text-muted-foreground bg-muted border-border',
}

function Badge({ tone, children, title }: { tone: string; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
        TONE_CLASS[tone] ?? TONE_CLASS.muted
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
 * concentration, certification gap, geographic concentration) are
 * recomputed here from the same real primitives VendorConcentrationRiskPanel
 * uses — that panel's own computation isn't exported, so this is a parallel
 * computation over the identical real data (REPLACE_ASSETS, productsForDomain,
 * productPqcStatus, softwareData, vendorMap, productFipsBadge), not a
 * reimplementation with invented numbers. `SupplyChainRiskMatrix` (that
 * tab's other real sub-view, per its own comment "a different-shaped view of
 * the SAME tab") is dropped, stated below.
 *
 * Stated cuts: foundation-domain browsing (8 secondary domains beyond the 10
 * "what you run" assets), full `ProductDetail` expansion (certifications/
 * roadmap drill-down), full `VendorRoadmapPanel` content, and
 * `SupplyChainRiskMatrix`.
 */
export function MobileMigrateView() {
  const [tab, setTab] = useState<Tab>('replace')
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('tls')
  const [roadmapQuery, setRoadmapQuery] = useState('')

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

  const posture = useMigrationPlan()

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-1">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">Migrate</h1>
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
              <span className="ml-1 rounded-full bg-primary-foreground/25 px-1.5 text-[9px]">
                {posture.plannedAssets.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {tab === 'replace' && (
        <div className="flex flex-col gap-3">
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
                onClick={() => setSelectedDomain(a.id)}
                aria-pressed={selectedDomain === a.id}
                className={cn(
                  'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
                  selectedDomain === a.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                )}
              >
                {a.label}
                {a.hndl && <span className="ml-1 text-[9px] text-status-error">HNDL</span>}
              </Button>
            ))}
          </div>

          {asset && decision && (
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
              <p className="mt-2 text-[10.5px] leading-relaxed text-foreground/80">{asset.note}</p>
            </div>
          )}

          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            {asset ? 'Products that replace this' : 'Products'} ·{' '}
            <span className="text-foreground">{products.length} in catalog</span>
          </p>
          <div className="flex flex-col gap-2">
            {products.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-3 text-center text-[11.5px] text-muted-foreground">
                No catalog products mapped here yet.
              </p>
            ) : (
              products.map((p) => (
                <MobileProductRow
                  key={p.productId || p.softwareName}
                  product={p}
                  chosen={(choice[selectedDomain] ?? []).includes(p.softwareName)}
                  onChoose={() => chooseProduct(selectedDomain, p.softwareName)}
                />
              ))
            )}
          </div>
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
        />
      )}

      {tab === 'roadmaps' && (
        <MobileRoadmapsTab query={roadmapQuery} onQueryChange={setRoadmapQuery} />
      )}

      {tab === 'vendorrisk' && <MobileVendorRiskTab />}

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The 8 foundation/infrastructure domains, full certification and roadmap drill-down per
        product, and the Supply Chain Risk Matrix are on a laptop.
      </p>
    </div>
  )
}

function MobileProductRow({
  product,
  chosen,
  onChoose,
}: {
  product: SoftwareItem
  chosen: boolean
  onChoose: () => void
}) {
  const pqc = productPqcStatus(product)
  const fips = productFipsBadge(product)
  const proof = proofFreshness(product)
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        chosen ? 'border-status-success/40 bg-status-success/5' : 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12.5px] font-bold text-foreground">{product.softwareName}</span>
            {product.vendorId && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {product.vendorId}
              </span>
            )}
            <Badge tone={pqc.tone}>{pqc.label}</Badge>
            {fips && <Badge tone={fips.tone}>{fips.label}</Badge>}
            <Badge tone={proof.tone} title={proof.detail}>
              {proof.label}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{product.categoryName}</p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">{proof.detail}</p>
        </div>
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

function MobilePlanTab({
  posture,
  choice,
  chooseProduct,
  removeFromPlan,
  clearPlan,
  onGoToReplace,
}: {
  posture: ReturnType<typeof useMigrationPlan>
  choice: Record<string, string[]>
  chooseProduct: (assetId: string, productName: string) => void
  removeFromPlan: (assetId: string) => void
  clearPlan: () => void
  onGoToReplace: () => void
}) {
  const foundationItems = posture.foundations.flatMap((f) =>
    (choice[f.id] ?? []).map((product) => ({ id: f.id, product }))
  )

  if (posture.plannedAssets.length === 0 && foundationItems.length === 0) {
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
                        {chosen.map((product) => (
                          <div
                            key={product}
                            className="flex items-center gap-1.5 rounded bg-muted/30 px-2 py-1"
                          >
                            <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">
                              {product}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => chooseProduct(a.id, product)}
                              aria-label={`Remove ${product} from plan`}
                              className="h-6 w-6 shrink-0 p-0 text-muted-foreground"
                            >
                              <X size={11} />
                            </Button>
                          </div>
                        ))}
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
}: {
  query: string
  onQueryChange: (q: string) => void
}) {
  const selectedProductIds = useSelectedProductIds()

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
              <RoadmapVendorCard key={v.vendorId} vendorId={v.vendorId} vendorName={v.vendorName} />
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
            <RoadmapVendorCard key={v.vendorId} vendorId={v.vendorId} vendorName={v.vendorName} />
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-[11.5px] text-muted-foreground">
          No vendors match "{query}".
        </p>
      )}
    </div>
  )
}

function RoadmapVendorCard({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const hasRoadmap = roadmapByVendorId.has(vendorId)
  const productCount = useMemo(() => productsForVendor(vendorId).length, [vendorId])
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-bold text-foreground">{vendorName}</p>
        <Badge tone={hasRoadmap ? 'success' : 'info'}>
          {hasRoadmap ? 'Published roadmap' : 'Enrichment only'}
        </Badge>
      </div>
      <p className="mt-1 text-[10.5px] text-muted-foreground">
        {productCount} {productCount === 1 ? 'product' : 'products'} in catalog
      </p>
    </div>
  )
}

function MobileVendorRiskTab() {
  const cards = useMemo(() => {
    const singleSource = REPLACE_ASSETS.filter((asset) => {
      const gaCount = productsForDomain(asset.id).filter(
        (p) => productPqcStatus(p).status === 'ga'
      ).length
      return gaCount === 1
    })

    const gaProducts = softwareData.filter((p) => productPqcStatus(p).status === 'ga')
    const gaByVendor = new Map<string, number>()
    for (const p of gaProducts) {
      if (!p.vendorId) continue
      gaByVendor.set(p.vendorId, (gaByVendor.get(p.vendorId) ?? 0) + 1)
    }
    const topVendorEntry = [...gaByVendor.entries()].sort((a, b) => b[1] - a[1])[0]
    const topVendor = topVendorEntry ? vendorMap.get(topVendorEntry[0]) : undefined
    const topVendorShare =
      topVendorEntry && gaProducts.length > 0
        ? Math.round((topVendorEntry[1] / gaProducts.length) * 100)
        : 0

    const gaWithoutFips = gaProducts.filter((p) => productFipsBadge(p) === null)
    const certGapPct =
      gaProducts.length > 0 ? Math.round((gaWithoutFips.length / gaProducts.length) * 100) : 0

    const usedVendors = [...vendorMap.values()].filter((v) => (v.productCount ?? 0) > 0)
    const byCountry = new Map<string, number>()
    for (const v of usedVendors) {
      byCountry.set(v.hqCountry, (byCountry.get(v.hqCountry) ?? 0) + 1)
    }
    const topCountryEntry = [...byCountry.entries()].sort((a, b) => b[1] - a[1])[0]
    const topCountryShare =
      topCountryEntry && usedVendors.length > 0
        ? Math.round((topCountryEntry[1] / usedVendors.length) * 100)
        : 0

    return [
      {
        key: 'single-source',
        title: 'Single-source domains',
        headline: `${singleSource.length} of ${REPLACE_ASSETS.length}`,
        detail:
          singleSource.length > 0
            ? `${singleSource.map((a) => a.label).join(', ')} — exactly one GA product covers each.`
            : 'No domain depends on exactly one GA product.',
        severe: singleSource.length > 0,
      },
      {
        key: 'vendor-concentration',
        title: 'Vendor concentration',
        headline: topVendor ? `${topVendorShare}%` : 'n/a',
        detail: topVendor
          ? `${topVendor.vendorDisplayName || topVendor.vendorName} supplies ${topVendorShare}% of GA quantum-safe products in the catalog.`
          : 'No GA products with a recorded vendor yet.',
        severe: topVendorShare >= 25,
      },
      {
        key: 'cert-gap',
        title: 'Certification gap',
        headline: `${certGapPct}%`,
        detail: `${certGapPct}% of GA quantum-safe products have no FIPS validation on record.`,
        severe: certGapPct >= 50,
      },
      {
        key: 'geographic',
        title: 'Geographic concentration',
        headline: topCountryEntry ? `${topCountryShare}%` : 'n/a',
        detail: topCountryEntry
          ? `${topCountryShare}% of catalog vendors are headquartered in ${topCountryEntry[0]}.`
          : 'No vendor HQ data yet.',
        severe: topCountryShare >= 40,
      },
    ]
  }, [])

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((c) => (
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
