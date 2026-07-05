// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { ExportableArtifact } from '../../../common/executive'
import { useModuleStore } from '@/store/useModuleStore'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { softwareData } from '@/data/migrateData'
import { isPqcReady, isFips1403Validated } from '@/data/kpiCatalog'
import type { SoftwareItem } from '@/types/MigrateTypes'
import {
  Info,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'vendor-risk'

interface Dimension {
  id: string
  label: string
  description: string
  weight: number
  /** Auto-detect which products meet this criterion */
  autoDetect?: (item: SoftwareItem) => boolean
}

const DIMENSIONS: Dimension[] = [
  {
    id: 'pqc-algorithm-support',
    label: 'PQC Algorithm Support',
    description: 'Vendor supports NIST-approved PQC algorithms',
    weight: 0.25,
    autoDetect: (item) => isPqcReady(item.pqcSupport),
  },
  {
    id: 'fips-validation',
    label: 'FIPS 140-3 Validation',
    description: 'Cryptographic modules have current FIPS validation',
    weight: 0.2,
    autoDetect: (item) => isFips1403Validated(item.fipsValidated),
  },
  {
    id: 'pqc-roadmap',
    label: 'Published PQC Roadmap',
    description: 'Vendor has a published PQC migration timeline',
    weight: 0.15,
  },
  {
    id: 'crypto-agility',
    label: 'Crypto Agility',
    description: 'Products support algorithm swapping without major rework',
    weight: 0.15,
  },
  {
    id: 'sbom-cbom',
    label: 'SBOM/CBOM Delivery',
    description: 'Vendor provides Software/Crypto Bill of Materials',
    weight: 0.1,
  },
  {
    id: 'hybrid-mode',
    label: 'Hybrid Mode Support',
    description: 'Products support hybrid classical+PQC operation',
    weight: 0.15,
    autoDetect: (item) => {
      const desc = (item.pqcCapabilityDescription || '').toLowerCase()
      const support = (item.pqcSupport || '').toLowerCase()
      return desc.includes('hybrid') || support.includes('hybrid')
    },
  },
]

function resolveProductNames(keys: string[]): SoftwareItem[] {
  const keySet = new Set(keys)
  return softwareData.filter((s) => keySet.has(s.productId))
}

function getScoreColor(value: number): string {
  if (value >= 75) return 'text-status-success'
  if (value >= 50) return 'text-status-warning'
  return 'text-status-error'
}

function getBarColor(value: number): string {
  if (value >= 75) return 'bg-status-success'
  if (value >= 50) return 'bg-status-warning'
  return 'bg-status-error'
}

const productKey = (item: SoftwareItem) => item.productId

interface SavedScorecardInputs {
  checkedProducts?: Record<string, string[]>
  useSlider?: Record<string, boolean>
  sliderScores?: Record<string, number>
  weightOverrides?: Record<string, number>
  scannerNotes?: string
  cveNotes?: string
  siemNotes?: string
  ztNotes?: string
}

export interface VendorScorecardRow {
  vendor: string
  productCount: number
  dimScores: Record<string, number>
  overall: number
}

/**
 * Per-vendor readiness. Groups the selected products by vendor and scores each
 * vendor independently — a dimension's score for a vendor is the share of THAT
 * vendor's products that satisfy it (slider dimensions are global, applied to
 * all vendors). Replaces the single blended "vendor" number, which mixed every
 * vendor's products into one misleading figure for procurement. Pure for tests.
 */
export function computeVendorScorecards(
  items: SoftwareItem[],
  checkedProducts: Record<string, Set<string>>,
  weightOf: (dimId: string) => number,
  opts: { useSlider: Record<string, boolean>; sliderScores: Record<string, number> }
): VendorScorecardRow[] {
  const groups = new Map<string, SoftwareItem[]>()
  for (const item of items) {
    const vendor = item.vendorName?.trim() || item.vendorId?.trim() || 'Unknown vendor'
    const arr = groups.get(vendor) ?? []
    arr.push(item)
    groups.set(vendor, arr)
  }
  const rows: VendorScorecardRow[] = []
  for (const [vendor, group] of groups) {
    const keys = new Set(group.map(productKey))
    const dimScores: Record<string, number> = {}
    let weightedSum = 0
    let totalWeight = 0
    for (const d of DIMENSIONS) {
      let score: number
      if (opts.useSlider[d.id]) {
        score = opts.sliderScores[d.id] ?? 0
      } else {
        const checked = checkedProducts[d.id]
        const hits = checked ? [...keys].filter((k) => checked.has(k)).length : 0
        score = group.length > 0 ? Math.round((hits / group.length) * 100) : 0
      }
      dimScores[d.id] = score
      const w = weightOf(d.id)
      weightedSum += score * w
      totalWeight += w
    }
    rows.push({
      vendor,
      productCount: group.length,
      dimScores,
      overall: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0,
    })
  }
  return rows.sort((a, b) => b.overall - a.overall || a.vendor.localeCompare(b.vendor))
}

export interface ScorecardOutput {
  rows: VendorScorecardRow[]
  lowReadinessVendors: string[]
}

export const VendorScorecardBuilder: React.FC<{ onOutput?: (output: ScorecardOutput) => void }> = ({
  onOutput,
}) => {
  const myProducts = useSelectedProductIds()
  const { addExecutiveDocument } = useModuleStore()
  const hasProducts = myProducts.length > 0
  const { myFrameworks, industry } = useExecutiveModuleData()
  const vendorDependency = useAssessmentStore((s) => s.vendorDependency)
  const [seedCleared, setSeedCleared] = useState(false)
  const savedInputs = useSavedArtifactInputs<SavedScorecardInputs>('vendor-scorecard')

  const selectedItems = useMemo(
    () => (hasProducts ? resolveProductNames(myProducts) : []),
    [myProducts, hasProducts]
  )

  // Per-dimension: which products are checked. Seeded from the last-saved
  // artifact's `inputs` (arrays — Sets aren't JSON-serializable) when present.
  const [checkedProducts, setCheckedProducts] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {}
    for (const d of DIMENSIONS) {
      initial[d.id] = new Set<string>(savedInputs?.checkedProducts?.[d.id] ?? [])
    }
    return initial
  })

  // Per-dimension: use slider instead of product picking
  const [useSlider, setUseSlider] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const d of DIMENSIONS) {
      initial[d.id] = savedInputs?.useSlider?.[d.id] ?? !hasProducts
    }
    return initial
  })

  // Slider scores (used when useSlider[dim] is true)
  const [sliderScores, setSliderScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const d of DIMENSIONS) {
      initial[d.id] = savedInputs?.sliderScores?.[d.id] ?? 0
    }
    return initial
  })

  // User-adjustable weight overrides (0–1). Saved artifact uses the same values.
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>(
    savedInputs?.weightOverrides ?? {}
  )

  const effectiveWeight = useCallback(
    (dimId: string): number =>
      dimId in weightOverrides
        ? (weightOverrides[dimId] ?? 0)
        : (DIMENSIONS.find((d) => d.id === dimId)?.weight ?? 0),
    [weightOverrides]
  )

  const handleWeightChange = useCallback((dimId: string, pct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)))
    setWeightOverrides((prev) => ({ ...prev, [dimId]: clamped / 100 }))
  }, [])

  // Which dimension is expanded — open pqc-roadmap first when the user
  // reports heavy vendor dependency (so they immediately see roadmap risk),
  // otherwise let the user pick.
  const [expandedDim, setExpandedDim] = useState<string | null>(
    vendorDependency === 'heavy-vendor' ? 'pqc-roadmap' : null
  )

  // Auto-initialize checked products when selectedItems change
  useEffect(() => {
    if (selectedItems.length === 0) return
    // Guarded derived-state sync: this effect re-runs only when selectedItems/myProducts
    // change (not on every render) and uses functional updaters, so the cascading-render
    // this rule guards against cannot occur here. Scoped to the two initialization setstates.
    /* eslint-disable react-hooks/set-state-in-effect */
    setCheckedProducts((prev) => {
      const next = { ...prev }
      for (const d of DIMENSIONS) {
        if (d.autoDetect) {
          const auto = new Set<string>()
          for (const item of selectedItems) {
            if (d.autoDetect(item)) {
              auto.add(productKey(item))
            }
          }
          next[d.id] = auto
        } else {
          // Keep existing manual checks, but remove any that are no longer in selection
          const currentKeys = new Set(myProducts)
          next[d.id] = new Set([...(prev[d.id] ?? [])].filter((k) => currentKeys.has(k)))
        }
      }
      return next
    })
    // Reset slider mode when products are selected
    setUseSlider((prev) => {
      const next = { ...prev }
      for (const d of DIMENSIONS) {
        next[d.id] = false
      }
      return next
    })
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedItems, myProducts])

  // Compute score for a dimension
  const getScore = useCallback(
    (dimId: string): number => {
      if (useSlider[dimId] || !hasProducts) {
        return sliderScores[dimId] ?? 0
      }
      const checked = checkedProducts[dimId]
      if (!checked || selectedItems.length === 0) return 0
      return Math.round((checked.size / selectedItems.length) * 100)
    },
    [useSlider, sliderScores, checkedProducts, selectedItems, hasProducts]
  )

  // Overall weighted score — uses live weight overrides so display and export agree
  const weightedTotal = useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    for (const d of DIMENSIONS) {
      const score = getScore(d.id)
      const w = effectiveWeight(d.id)
      weightedSum += score * w
      totalWeight += w
    }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }, [getScore, effectiveWeight])

  // Per-vendor breakdown — each vendor scored on its own products, sorted best
  // to worst. The headline above is a portfolio average; this is what a buyer
  // actually compares.
  const vendorScorecards = useMemo(
    () =>
      computeVendorScorecards(selectedItems, checkedProducts, effectiveWeight, {
        useSlider,
        sliderScores,
      }),
    [selectedItems, checkedProducts, effectiveWeight, useSlider, sliderScores]
  )

  // Emit scorecard output to parent whenever vendor scores change
  useEffect(() => {
    if (!onOutput) return
    const low = vendorScorecards.filter((r) => r.overall < 50).map((r) => r.vendor)
    onOutput({ rows: vendorScorecards, lowReadinessVendors: low })
  }, [onOutput, vendorScorecards])

  const toggleProductForDimension = useCallback((dimId: string, key: string) => {
    setCheckedProducts((prev) => {
      const set = new Set(prev[dimId] ?? [])
      if (set.has(key)) {
        set.delete(key)
      } else {
        set.add(key)
      }
      return { ...prev, [dimId]: set }
    })
  }, [])

  const toggleSliderMode = useCallback((dimId: string) => {
    setUseSlider((prev) => ({ ...prev, [dimId]: !prev[dimId] }))
  }, [])

  // Export and save to module store
  // CSWP.39 §5.3 — Observability tooling notes per vendor relationship.
  const [scannerNotes, setScannerNotes] = useState(savedInputs?.scannerNotes ?? '')
  const [cveNotes, setCveNotes] = useState(savedInputs?.cveNotes ?? '')
  const [siemNotes, setSiemNotes] = useState(savedInputs?.siemNotes ?? '')
  const [ztNotes, setZtNotes] = useState(savedInputs?.ztNotes ?? '')

  const exportMarkdown = useMemo(() => {
    let md = '# Vendor PQC Readiness Scorecard\n\n'
    md += `**Portfolio average (all products): ${weightedTotal}/100**\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n`
    if (hasProducts) {
      md += `Products assessed: ${selectedItems.length}\n`
    }
    md += '\n'
    md += '| Dimension | Score | Weight | Method |\n'
    md += '|-----------|-------|--------|--------|\n'
    for (const d of DIMENSIONS) {
      const score = getScore(d.id)
      const method =
        useSlider[d.id] || !hasProducts
          ? 'Manual'
          : `${checkedProducts[d.id]?.size ?? 0}/${selectedItems.length} products`
      md += `| ${d.label} | ${score}/100 | ${Math.round(effectiveWeight(d.id) * 100)}% | ${method} |\n`
    }

    if (hasProducts && vendorScorecards.length > 0) {
      md += '\n## Per-Vendor Readiness\n\n'
      md += `| Vendor | Products | Overall | ${DIMENSIONS.map((d) => d.label).join(' | ')} |\n`
      md += `|${'---|'.repeat(3 + DIMENSIONS.length)}\n`
      for (const v of vendorScorecards) {
        md += `| ${v.vendor} | ${v.productCount} | ${v.overall}/100 | ${DIMENSIONS.map(
          (d) => v.dimScores[d.id] ?? 0
        ).join(' | ')} |\n`
      }
    }

    // CSWP.39 §5.3 - Observability Tooling Notes
    md += '\n## Observability Tooling Notes (CSWP.39 §5.3)\n\n'
    md += `**Crypto scanner:** ${scannerNotes.trim() || '_Not specified_'}\n\n`
    md += `**CVE / vuln-mgmt feed:** ${cveNotes.trim() || '_Not specified_'}\n\n`
    md += `**SIEM crypto-drift rules:** ${siemNotes.trim() || '_Not specified_'}\n\n`
    md += `**Zero-Trust enforcement:** ${ztNotes.trim() || '_Not specified_'}\n\n`

    // N5: sanitise non-ASCII punctuation in the exported markdown string only.
    md = md.replace(/—/g, '-').replace(/–/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

    return md
  }, [
    weightedTotal,
    getScore,
    useSlider,
    checkedProducts,
    selectedItems,
    hasProducts,
    scannerNotes,
    cveNotes,
    siemNotes,
    ztNotes,
    effectiveWeight,
    vendorScorecards,
  ])

  // Save to the Command Center on an explicit Save click (the export card below).
  // Replaces the old silent auto-save; the 0-score hint above tells the user to
  // score a dimension first.
  const handleSaveArtifact = useCallback(() => {
    const checkedProductsForSave: Record<string, string[]> = {}
    for (const [dimId, keys] of Object.entries(checkedProducts)) {
      checkedProductsForSave[dimId] = [...keys]
    }
    addExecutiveDocument({
      id: `vendor-scorecard-${MODULE_ID}`,
      moduleId: MODULE_ID,
      type: 'vendor-scorecard',
      title: `Vendor PQC Readiness Scorecard (${weightedTotal}/100)`,
      data: exportMarkdown,
      createdAt: Date.now(),
      inputs: {
        checkedProducts: checkedProductsForSave,
        useSlider,
        sliderScores,
        weightOverrides,
        scannerNotes,
        cveNotes,
        siemNotes,
        ztNotes,
      },
    })
  }, [
    addExecutiveDocument,
    weightedTotal,
    exportMarkdown,
    checkedProducts,
    useSlider,
    sliderScores,
    weightOverrides,
    scannerNotes,
    cveNotes,
    siemNotes,
    ztNotes,
  ])

  const seedSources: string[] = []
  if (!seedCleared) {
    if (hasProducts)
      seedSources.push(
        `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
      )
    if (industry) seedSources.push(`industry (${industry})`)
    if (vendorDependency) seedSources.push(`vendor dependency (${vendorDependency})`)
    if (myFrameworks.length > 0)
      seedSources.push(
        `${myFrameworks.length} framework${myFrameworks.length !== 1 ? 's' : ''} from /compliance`
      )
  }

  return (
    <div className="space-y-6">
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Vendors and dimensions seeded from ${seedSources.join(' + ')}.`}
          onClear={() => setSeedCleared(true)}
        />
      )}
      {/* Intro */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-foreground/80">
          Score your vendors across six PQC readiness dimensions.{' '}
          {hasProducts ? (
            <>
              Click each dimension to pick which of your{' '}
              <span className="text-primary font-medium">{selectedItems.length}</span> selected
              products meet the requirement. You can also switch to the slider for manual scoring.
            </>
          ) : (
            <>
              Use the sliders to set each score. Select your infrastructure in Step 1 for
              product-level scoring.
            </>
          )}
        </p>
      </div>

      {/* Overall score */}
      <div className="glass-panel p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          PQC Readiness — Portfolio average (across all products)
        </p>
        <p className={`text-3xl md:text-5xl font-bold ${getScoreColor(weightedTotal)}`}>
          {weightedTotal}
        </p>
        <p className="text-sm text-muted-foreground mt-1">/100</p>
        {vendorScorecards.length > 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            This blends {vendorScorecards.length} vendors — see the per-vendor breakdown below for
            procurement comparisons.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
          <strong className="text-foreground/80">How this is scored:</strong> each dimension score
          (0–100) is multiplied by its weight, then the six weighted scores are summed and divided
          by the total weight — a weighted average, not a plain average. For the two auto-detected
          dimensions (PQC Algorithm Support, FIPS 140-3 Validation), a product only counts toward
          the score once its reported readiness reaches the "hybrid or full" tier — roughly 70% of
          the way to fully deployed; planned, pilot, and narrative-only claims don&apos;t count.
        </p>
      </div>

      {/* Save gate hint — until the overall score is above zero the scorecard
          stays at 0/100 and the auto-save never fires, so spell out what to do. */}
      {weightedTotal === 0 && (
        <div className="glass-panel border border-status-warning/30 bg-status-warning/5 p-3 text-center text-sm text-status-warning">
          Score at least one dimension to save this scorecard —{' '}
          {hasProducts
            ? 'tick a product capability in any dimension below, or switch a dimension to the slider and drag it above 0.'
            : 'drag a dimension slider above 0.'}
        </div>
      )}

      {/* Per-vendor breakdown */}
      {hasProducts && vendorScorecards.length > 0 && (
        <div className="glass-panel p-4">
          <p className="text-sm font-semibold text-foreground mb-1">Per-vendor readiness</p>
          <p className="text-xs text-muted-foreground mb-3">
            Each vendor scored on its own products (best to worst). The portfolio average above can
            hide a weak vendor inside a strong set.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-3 font-medium">Vendor</th>
                  <th className="py-1.5 px-2 font-medium text-center">Products</th>
                  <th className="py-1.5 px-2 font-medium text-center">Overall</th>
                  {DIMENSIONS.map((d) => (
                    <th key={d.id} className="py-1.5 px-2 font-medium text-center" title={d.label}>
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendorScorecards.map((v) => (
                  <tr key={v.vendor} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 text-foreground">{v.vendor}</td>
                    <td className="py-1.5 px-2 text-center text-muted-foreground">
                      {v.productCount}
                    </td>
                    <td className={`py-1.5 px-2 text-center font-bold ${getScoreColor(v.overall)}`}>
                      {v.overall}
                    </td>
                    {DIMENSIONS.map((d) => (
                      <td
                        key={d.id}
                        className={`py-1.5 px-2 text-center ${getScoreColor(v.dimScores[d.id] ?? 0)}`}
                      >
                        {v.dimScores[d.id] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dimension cards */}
      <div className="space-y-3">
        {DIMENSIONS.map((d) => {
          const score = getScore(d.id)
          const isExpanded = expandedDim === d.id
          const isSliderMode = useSlider[d.id] || !hasProducts
          const checked = checkedProducts[d.id] ?? new Set()

          return (
            <div key={d.id} className="glass-panel overflow-hidden">
              {/* Header row */}
              <Button
                variant="ghost"
                type="button"
                className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedDim(isExpanded ? null : d.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {hasProducts ? (
                    isExpanded ? (
                      <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    )
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {!isSliderMode && hasProducts && (
                    <span className="text-xs text-muted-foreground">
                      {checked.size}/{selectedItems.length}
                    </span>
                  )}
                  <span className={`text-lg font-bold tabular-nums ${getScoreColor(score)}`}>
                    {score}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(effectiveWeight(d.id) * 100)}%)
                  </span>
                </div>
              </Button>

              {/* Progress bar */}
              <div className="px-4 pb-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getBarColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3">
                  {hasProducts && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">
                        {isSliderMode
                          ? 'Manual slider scoring'
                          : 'Pick products that meet this requirement'}
                      </span>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSliderMode(d.id)
                        }}
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {isSliderMode ? (
                          <>
                            <Users size={12} /> Pick products
                          </>
                        ) : (
                          <>
                            <SlidersHorizontal size={12} /> Use slider
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {isSliderMode || !hasProducts ? (
                    /* Slider mode */
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderScores[d.id] ?? 0}
                        onChange={(e) =>
                          setSliderScores((prev) => ({
                            ...prev,
                            [d.id]: parseInt(e.target.value),
                          }))
                        }
                        className="flex-1 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground tabular-nums w-8 text-right">
                        {sliderScores[d.id] ?? 0}
                      </span>
                    </div>
                  ) : (
                    /* Product picking mode */
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {selectedItems.map((item) => {
                        const key = productKey(item)
                        const isChecked = checked.has(key)
                        return (
                          <Button
                            variant="ghost"
                            key={key}
                            type="button"
                            onClick={() => toggleProductForDimension(d.id, key)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                              isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare size={14} className="text-primary shrink-0" />
                            ) : (
                              <Square size={14} className="text-muted-foreground/40 shrink-0" />
                            )}
                            <span
                              className={`text-sm truncate ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {item.softwareName}
                            </span>
                            {d.autoDetect && (
                              <span
                                className={`text-[10px] ml-auto shrink-0 ${
                                  d.autoDetect(item)
                                    ? 'text-status-success'
                                    : 'text-muted-foreground/50'
                                }`}
                              >
                                {d.autoDetect(item) ? 'detected' : ''}
                              </span>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {/* Weight override — keeps saved artifact in sync with the on-screen display */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground flex-1">Dimension weight</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(effectiveWeight(d.id) * 100)}
                      onChange={(e) => handleWeightChange(d.id, parseInt(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 text-xs text-right border border-border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    {d.id in weightOverrides && (
                      <Button
                        variant="ghost"
                        type="button"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setWeightOverrides((prev) => {
                            const next = { ...prev }
                            delete next[d.id]
                            return next
                          })
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No products hint */}
      {!hasProducts && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Using manual slider scoring. Select your infrastructure in Step 1 to enable
            product-level scoring.
          </span>
        </div>
      )}

      {/* CSWP.39 §5.3 — Observability tooling notes */}
      <div className="glass-panel p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Observability Tooling Notes (CSWP.39 §5.3)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Document which observability tooling this vendor relationship relies on. Educational —
            these notes export with the scorecard. Browse{' '}
            <a
              href="/migrate?cat=Cryptographic%20Discovery%20Platforms"
              className="text-primary hover:underline"
            >
              Cryptographic Discovery Platforms
            </a>{' '}
            and{' '}
            <a
              href="/migrate?cat=SASE%20%26%20Zero%20Trust"
              className="text-primary hover:underline"
            >
              SASE &amp; Zero Trust
            </a>{' '}
            for examples.
          </p>
        </div>
        <div>
          <label
            htmlFor="cswp39-scanner-notes"
            className="text-xs font-medium text-foreground block mb-1"
          >
            Crypto scanner (algorithms / key lengths / cert details)
          </label>
          <textarea
            id="cswp39-scanner-notes"
            className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[44px]"
            placeholder="e.g., Keyfactor AgileSec covering code + traffic"
            value={scannerNotes}
            onChange={(e) => setScannerNotes(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cswp39-cve-notes"
            className="text-xs font-medium text-foreground block mb-1"
          >
            CVE / vulnerability-management feed (with EoL tracking)
          </label>
          <textarea
            id="cswp39-cve-notes"
            className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[44px]"
            placeholder="e.g., NVD subscription + CISA KEV alerts; library-EoL tracker via Snyk"
            value={cveNotes}
            onChange={(e) => setCveNotes(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cswp39-siem-notes"
            className="text-xs font-medium text-foreground block mb-1"
          >
            SIEM crypto-drift / cipher-suite anomaly rules
          </label>
          <textarea
            id="cswp39-siem-notes"
            className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[44px]"
            placeholder="e.g., Splunk rule alerting on TLS handshakes negotiating non-CNSA suites"
            value={siemNotes}
            onChange={(e) => setSiemNotes(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cswp39-zt-notes"
            className="text-xs font-medium text-foreground block mb-1"
          >
            Zero-Trust enforcement (policy engines blocking disallowed cipher suites)
          </label>
          <textarea
            id="cswp39-zt-notes"
            className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[44px]"
            placeholder="e.g., Cloudflare Zero Trust policy denying RSA-PKCS#1 v1.5 inbound"
            value={ztNotes}
            onChange={(e) => setZtNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Export */}
      <ExportableArtifact
        title="Vendor PQC Readiness — Export"
        exportData={exportMarkdown}
        filename="vendor-pqc-scorecard"
        formats={['markdown', 'pdf']}
        onExport={handleSaveArtifact}
        wideTable
      >
        <p className="text-sm text-muted-foreground">
          Export the scorecard above as a shareable document. Includes observability tooling notes.
        </p>
      </ExportableArtifact>
    </div>
  )
}
