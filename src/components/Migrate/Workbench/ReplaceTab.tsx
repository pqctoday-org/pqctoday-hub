// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ArrowRight, Clock, Search, AlertTriangle, Check, Plus } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import {
  REPLACE_ASSETS,
  DOMAINS,
  DECISIONS,
  type DomainId,
  type ReplaceAsset,
} from '@/data/migrationAssets'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { AssetList } from './AssetList'
import { ProductRow } from './ProductRow'
import { Pill, DECISION_ICON } from './workbenchUi'
import { productsForDomain, filterProducts } from './workbenchCatalog'

const ASSET_BY_ID = new Map<string, ReplaceAsset>(REPLACE_ASSETS.map((a) => [a.id, a]))

interface ReplaceTabProps {
  persona: PersonaId | null
}

export function ReplaceTab({ persona }: ReplaceTabProps) {
  const plan = useMigrateSelectionStore((s) => s.plan)
  const choice = useMigrateSelectionStore((s) => s.choice)
  const togglePlanAsset = useMigrateSelectionStore((s) => s.togglePlanAsset)
  const chooseProduct = useMigrateSelectionStore((s) => s.chooseProduct)

  const [selectedDomain, setSelectedDomain] = useState<DomainId | null>('tls')
  const [filter, setFilter] = useState('')

  const onSelect = (d: DomainId) => {
    setSelectedDomain(d)
    setFilter('')
  }

  const asset = selectedDomain ? (ASSET_BY_ID.get(selectedDomain) ?? null) : null
  const products = useMemo(
    () => (selectedDomain ? productsForDomain(selectedDomain) : []),
    [selectedDomain]
  )
  const filtered = useMemo(() => filterProducts(products, filter), [products, filter])

  return (
    <div className="flex flex-col items-start gap-4 lg:flex-row">
      <AssetList persona={persona} selectedDomain={selectedDomain} onSelect={onSelect} />

      <div className="min-w-0 flex-1 lg:min-w-[380px]">
        {asset ? (
          <>
            <AssetDetailCard
              asset={asset}
              inPlan={plan.includes(asset.id)}
              onToggle={() => togglePlanAsset(asset.id)}
            />
            {asset.decision === 'mitigate' && (
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
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter products…"
                  aria-label="Filter products"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {products.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  No catalog products mapped here yet.
                </p>
              ) : filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  No products match “{filter}”.
                </p>
              ) : (
                filtered.map((p) => (
                  <ProductRow
                    key={p.productId || p.softwareName}
                    product={p}
                    // Key the choice on the domain id, not the replace-asset id:
                    // foundation/infrastructure domains have no ReplaceAsset, so
                    // gating on `asset` left their Choose button dead. For replace
                    // domains selectedDomain === asset.id, so behavior is unchanged.
                    chosen={choice[selectedDomain] === p.softwareName}
                    onChoose={() => chooseProduct(selectedDomain, p.softwareName)}
                  />
                ))
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
  return (
    <div className="rounded-xl border border-dashed border-status-error/40 bg-status-error/5 p-4">
      <div className="flex items-center gap-2 text-status-error">
        <AlertTriangle size={16} aria-hidden />
        <span className="text-sm font-semibold">No GA quantum-safe product for this yet</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{asset.note}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Lands in Wave {asset.wave}, flagged <strong className="text-status-error">Mitigate</strong>.
        {hasCandidates && ' Partial / early candidates are listed below — none are GA yet.'}
      </p>
    </div>
  )
}
