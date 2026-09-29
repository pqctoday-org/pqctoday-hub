// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, AlertTriangle, RotateCcw, X, ChevronDown } from 'lucide-react'
import { WAVES_FALLBACK } from './waves'
import { DECISIONS, type DomainId } from '@/data/migrationAssets'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData, softwareMetadata } from '@/data/migrateData'
import { Button } from '../../ui/button'
import { InlineTooltip } from '../../ui/InlineTooltip'
import { Pill, DECISION_ICON, TONE_DOT, ConfirmButton } from './workbenchUi'
import type { MigrationPosture } from './useMigrationPlan'
import { downloadPlanCbom } from './cbomExport'
import { productsForDomain, resolveProductRef, resolveDomainRef } from './workbenchCatalog'
import { ProductDetail } from './ProductDetail'
import { DeepLinkNotice } from '../../common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'

interface PlanTabProps {
  posture: MigrationPosture
  onGoToReplace: () => void
  /** ?open=<productId|domainId> (deep-link PR 2): expand that planned product,
   *  or scroll to that asset / foundation group, and ring it. */
  openRef?: string
  /** A planned product expanded (id → push ?open=) or collapsed (null). */
  onOpenChange?: (ref: string | null) => void
}

/**
 * A single chosen product in the plan — identical in the exposure (wave) and
 * Foundations sections. Expands to the full ProductDetail (same data as the
 * Replace tab) and carries a per-product remove. `domainId` resolves the
 * catalog row so details are available in both places.
 */
function PlanProductRow({
  domainId,
  productName,
  onRemove,
  defaultOpen = false,
  onToggle,
}: {
  domainId: string
  productName: string
  onRemove: () => void
  defaultOpen?: boolean
  onToggle?: (productId: string, open: boolean) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const cachedId = useMigrateSelectionStore((s) => s.nameToProductId[productName])
  const product = useMemo(() => {
    const byName = productsForDomain(domainId as DomainId).find(
      (p) => p.softwareName === productName
    )
    if (byName) return byName
    // FIXED 2026-07-16 (migrate-process remediation Phase 5, U4, extended):
    // the product's name no longer matches the catalog (renamed since it
    // was chosen) — fall back to the id captured at selection time
    // (nameToProductId) against the FULL catalog, not just this domain's
    // slice, so a rename that also moved category still resolves. Restores
    // real detail instead of just the "No longer in catalog" notice below.
    return cachedId ? softwareData.find((p) => p.productId === cachedId) : undefined
  }, [domainId, productName, cachedId])
  return (
    <div data-deeplink-id={product?.productId || undefined}>
      <div className="flex items-center gap-2 py-2 pl-6 pr-3">
        {product ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (product.productId) onToggle?.(product.productId, !open)
              setOpen((v) => !v)
            }}
            aria-expanded={open}
            aria-label={`${open ? 'Hide' : 'Show'} details for ${productName}`}
            className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        ) : (
          <span className="inline-block w-6 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{productName}</span>
        {/* FIXED 2026-07-16 (migrate-process remediation Phase 5, U4, scoped):
            `choice` stores the product's NAME, so a rename or deprecation
            silently orphans this entry — it used to just lose its expander
            with no explanation, reading as "no detail available" rather
            than "the catalog moved on". Note: this entry also silently
            drops out of useSelectedProductIds()'s count (that fix needs
            storing productId in the store itself — a bigger, deferred
            change; this is the display-only half). */}
        {!product && (
          <span
            className="shrink-0 text-[10px] font-medium text-status-warning"
            title="This product's name no longer matches the catalog (renamed or removed) — its detail can't be shown here."
          >
            No longer in catalog
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove ${productName} from plan`}
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-7 md:w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </Button>
      </div>
      {open && product && (
        <div className="border-t border-border/50 bg-muted/10 px-3 pb-3">
          <ProductDetail product={product} />
        </div>
      )}
    </div>
  )
}

export function PlanTab({ posture, onGoToReplace, openRef, onOpenChange }: PlanTabProps) {
  const choice = useMigrateSelectionStore((s) => s.choice)
  const nameToProductId = useMigrateSelectionStore((s) => s.nameToProductId)
  const removeFromPlan = useMigrateSelectionStore((s) => s.removeFromPlan)
  const chooseProduct = useMigrateSelectionStore((s) => s.chooseProduct)
  const plan = useMigrateSelectionStore((s) => s.plan)
  const clearPlan = useMigrateSelectionStore((s) => s.clearPlan)

  // One entry per selected foundation product (for the empty-state + count).
  const foundationItems = posture.foundations.flatMap((f) =>
    (choice[f.id] ?? []).map((product) => ({ id: f.id, product }))
  )

  // ── ?open= (deep-link PR 2) ──
  // A product id/name → its plan row (expanded); a domain id → its asset or
  // foundation group. Our own writes (a row expanded by hand) are remembered
  // so they don't re-scroll as if they were a new link.
  const selfOpenRef = useRef<string | null>(null)
  const [dismissedOpen, setDismissedOpen] = useState<string | null>(null)
  // The last ?open= that came from a link (not from our own row toggles).
  const [linkedOpen, setLinkedOpen] = useState<string | null>(openRef ?? null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow a new ?open= link
    if (openRef && selfOpenRef.current !== openRef) setLinkedOpen(openRef)
  }, [openRef])
  const openTarget = useMemo(() => {
    if (!linkedOpen) return null
    const product = resolveProductRef(linkedOpen)?.product
    if (product) {
      const planned = Object.values(choice).some((names) =>
        names.some(
          (n) =>
            n === product.softwareName ||
            (nameToProductId[n] && nameToProductId[n] === product.productId)
        )
      )
      return {
        kind: 'product' as const,
        id: product.productId,
        label: product.softwareName,
        planned,
      }
    }
    const domain = resolveDomainRef(linkedOpen)
    if (domain) {
      const planned =
        posture.waves.some((w) => w.assets.some((a) => a.id === domain)) ||
        (choice[domain] ?? []).length > 0
      return { kind: 'domain' as const, id: domain, label: domain, planned }
    }
    return { kind: 'unknown' as const, id: linkedOpen, label: linkedOpen, planned: false }
  }, [linkedOpen, choice, nameToProductId, posture.waves])
  useScrollToDeepLinkTarget(
    openTarget?.planned ? `open:${linkedOpen}` : null,
    openTarget?.planned ? deepLinkSelector(openTarget.id) : null
  )
  const toggleRow = (productId: string, open: boolean) => {
    selfOpenRef.current = open ? productId : null
    if (open) onOpenChange?.(productId)
    else if (openRef && resolveProductRef(openRef)?.product.productId === productId) {
      onOpenChange?.(null)
    }
  }
  const rowKeySuffix = (productName: string, domainId: string) => {
    if (openTarget?.kind !== 'product') return ''
    const byName = productsForDomain(domainId as DomainId).find(
      (p) => p.softwareName === productName
    )
    const id = byName?.productId ?? nameToProductId[productName]
    return id === openTarget.id ? `:open:${linkedOpen}` : ''
  }
  const openNotice =
    openTarget && !openTarget.planned && dismissedOpen !== linkedOpen ? (
      <DeepLinkNotice
        kind="not-found"
        message={
          openTarget.kind === 'unknown'
            ? `No product or category matching “${openTarget.label}”.`
            : `${openTarget.label} isn’t in your plan yet — add it from the Replace tab.`
        }
        onDismiss={() => setDismissedOpen(linkedOpen)}
      />
    ) : null

  if (posture.plannedAssets.length === 0 && foundationItems.length === 0) {
    return (
      <>
        {openNotice}
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-semibold text-foreground">Nothing in your plan yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick the cryptography you run to build a sequenced migration plan.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onGoToReplace}>
            ← Add what you run
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {openNotice}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Your assets, sequenced by exposure — <strong>external-facing traffic first</strong>. Open
          any product for its roadmap, certifications and evidence.
        </p>
        <ConfirmButton
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onConfirm={clearPlan}
          confirmChildren={
            <>
              <RotateCcw size={13} /> Clear it all?
            </>
          }
        >
          <RotateCcw size={13} /> Clear entire plan
        </ConfirmButton>
      </div>

      {posture.gaps.length > 0 && (
        <div className="rounded-xl border border-status-error/25 bg-status-error/[0.07] p-3">
          <div className="flex items-center gap-2 text-status-error">
            <AlertTriangle size={16} aria-hidden />
            <span className="text-sm font-semibold">
              {posture.gaps.length} asset{posture.gaps.length > 1 ? 's have' : ' has'} no GA
              quantum-safe product yet
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {posture.gaps.map((g) => g.label).join(', ')} — deploy a crypto gateway with a hard
            sunset date. Mitigation is never permanent.
          </p>
        </div>
      )}

      {posture.waves.map((group) => {
        const meta = WAVES_FALLBACK[group.wave]
        return (
          <div key={group.wave} className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${meta.tileClass}`}
              >
                {group.wave}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{meta.title}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {group.wave === 1 ? (
                    <>
                      Public TLS &amp; VPN — highest exposure,{' '}
                      <InlineTooltip term="HNDL">HNDL</InlineTooltip> risk
                    </>
                  ) : (
                    meta.subtitle
                  )}
                </span>
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {group.assets.length} in plan
              </span>
            </div>
            <p className="border-t border-border/60 bg-muted/10 px-3 py-1.5 text-[11px] italic leading-relaxed text-muted-foreground">
              {meta.rationale}
            </p>
            <div className="flex flex-col divide-y divide-border">
              {group.assets.map((asset) => {
                const decision = DECISIONS[asset.decision]
                const chosen = choice[asset.id] ?? []
                return (
                  <div key={asset.id} data-deeplink-id={asset.id}>
                    {/* Asset header — decision + deadline + remove-whole-asset */}
                    <div className="flex flex-wrap items-center gap-2.5 px-3 py-2.5">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[decision.tone]}`}
                        title={decision.label}
                        aria-hidden
                      />
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">{asset.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          → {asset.target}
                        </span>
                      </span>
                      <Pill tone={decision.tone} icon={DECISION_ICON[asset.decision]}>
                        {decision.label}
                      </Pill>
                      <span className="font-mono text-[11px] text-status-warning">
                        {asset.cnsaYear}
                      </span>
                      {chosen.length > 1 ? (
                        <ConfirmButton
                          size="sm"
                          aria-label={`Remove ${asset.label} from plan`}
                          className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                          onConfirm={() => removeFromPlan(asset.id)}
                          confirmChildren={
                            <X
                              size={14}
                              aria-label={`Confirm removing ${chosen.length} products`}
                            />
                          }
                        >
                          <X size={14} />
                        </ConfirmButton>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromPlan(asset.id)}
                          aria-label={`Remove ${asset.label} from plan`}
                          className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                    {/* Chosen products — same row component as Foundations */}
                    {chosen.length > 0 ? (
                      <div className="flex flex-col divide-y divide-border/50 border-t border-border/50">
                        {chosen.map((product) => (
                          <PlanProductRow
                            key={`${asset.id}::${product}${rowKeySuffix(product, asset.id)}`}
                            domainId={asset.id}
                            productName={product}
                            onRemove={() => chooseProduct(asset.id, product)}
                            defaultOpen={!!rowKeySuffix(product, asset.id)}
                            onToggle={toggleRow}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 pb-2.5 pl-6 text-[11px] text-muted-foreground">
                        {asset.decision === 'mitigate'
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

      {foundationItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">
                Foundations &amp; infrastructure
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Cross-cutting building blocks &amp; tooling — no fixed wave
              </span>
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {foundationItems.length} in plan
            </span>
          </div>
          {/* Grouped by sub-category — same product rows as the wave sections. */}
          <div className="flex flex-col divide-y divide-border">
            {posture.foundations.map((f) => {
              const products = choice[f.id] ?? []
              if (products.length === 0) return null
              return (
                <div key={f.id} data-deeplink-id={f.id}>
                  <div className="flex items-center justify-between bg-muted/20 px-3 py-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {products.length}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-border/50">
                    {products.map((product) => (
                      <PlanProductRow
                        key={`${f.id}::${product}${rowKeySuffix(product, f.id)}`}
                        domainId={f.id}
                        productName={product}
                        onRemove={() => chooseProduct(f.id, product)}
                        defaultOpen={!!rowKeySuffix(product, f.id)}
                        onToggle={toggleRow}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="gradient"
          size="sm"
          onClick={() =>
            downloadPlanCbom({
              planIds: plan,
              choice,
              timestamp: new Date().toISOString(),
              products: softwareData,
              catalogSnapshot: softwareMetadata?.filename,
            })
          }
        >
          <FileText size={14} /> Export plan + CBOM
        </Button>
      </div>
    </div>
  )
}
