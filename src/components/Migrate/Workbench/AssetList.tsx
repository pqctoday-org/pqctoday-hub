// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { ChevronRight, Check, Plus } from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import {
  REPLACE_ASSETS,
  DOMAINS,
  DECISIONS,
  type DomainId,
  type ReplaceAsset,
} from '@/data/migrationAssets'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { domainProductCount } from './workbenchCatalog'
import { TONE_DOT } from './workbenchUi'

interface AssetListProps {
  persona: PersonaId | null
  selectedDomain: DomainId | null
  onSelect: (domain: DomainId) => void
}

const FOUNDATION_DOMAINS: DomainId[] = Object.values(DOMAINS)
  .filter((d) => d.kind === 'foundation')
  .map((d) => d.id)

/** Persona-focused assets float to the top, otherwise canonical (wave) order. */
function sortAssets(persona: PersonaId | null): ReplaceAsset[] {
  const list = [...REPLACE_ASSETS]
  list.sort((a, b) => {
    const fa = persona && a.focusPersonas.includes(persona) ? 0 : 1
    const fb = persona && b.focusPersonas.includes(persona) ? 0 : 1
    return fa - fb || a.wave - b.wave || a.cnsaYear - b.cnsaYear
  })
  return list
}

export function AssetList({ persona, selectedDomain, onSelect }: AssetListProps) {
  const plan = useMigrateSelectionStore((s) => s.plan)
  const togglePlanAsset = useMigrateSelectionStore((s) => s.togglePlanAsset)
  const assets = useMemo(() => sortAssets(persona), [persona])

  return (
    <div className="flex w-full flex-col gap-4 md:w-[352px] md:min-w-[300px] md:shrink-0">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          What you run — pick to see replacements
        </p>
        <div className="flex flex-col gap-2">
          {assets.map((asset) => {
            const inPlan = plan.includes(asset.id)
            const isSelected = selectedDomain === asset.id
            const decision = DECISIONS[asset.decision]
            return (
              <div
                key={asset.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${asset.label}`}
                onClick={() => onSelect(asset.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(asset.id)
                  }
                }}
                aria-pressed={isSelected}
                className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : inPlan
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/20'
                }`}
              >
                <span
                  role="checkbox"
                  aria-checked={inPlan}
                  aria-label={
                    inPlan ? `Remove ${asset.label} from plan` : `Add ${asset.label} to plan`
                  }
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlanAsset(asset.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      togglePlanAsset(asset.id)
                    }
                  }}
                  className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border ${
                    inPlan
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {inPlan ? <Check size={13} /> : <Plus size={13} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {asset.label}
                    </span>
                    {asset.hndl && (
                      <span className="rounded bg-status-error/15 px-1 text-[9px] font-bold uppercase text-status-error">
                        HNDL
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                    {asset.classical} → {asset.target}
                  </span>
                </span>

                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[decision.tone]}`}
                  title={decision.label}
                  aria-hidden
                />
                <ChevronRight
                  size={16}
                  className={`shrink-0 transition-colors ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  aria-hidden
                />
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Foundations &amp; infrastructure
        </p>
        <div className="flex flex-col gap-1.5">
          {FOUNDATION_DOMAINS.map((id) => {
            const meta = DOMAINS[id]
            const isSelected = selectedDomain === id
            const count = domainProductCount(id)
            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(id)
                  }
                }}
                aria-pressed={isSelected}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:bg-muted/20'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
