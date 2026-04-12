// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { ExportableArtifact } from '../../../common/executive'
import { useModuleStore } from '@/store/useModuleStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
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
    autoDetect: (item) => {
      const s = (item.pqcSupport || '').toLowerCase()
      return s.startsWith('yes') || s.startsWith('partial') || s.startsWith('limited')
    },
  },
  {
    id: 'fips-validation',
    label: 'FIPS 140-3 Validation',
    description: 'Cryptographic modules have current FIPS validation',
    weight: 0.2,
    autoDetect: (item) => {
      const s = (item.fipsValidated || '').toLowerCase()
      return (
        s.startsWith('yes') || s === 'validated' || (s.includes('fips 140') && !s.startsWith('no'))
      )
    },
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
  return softwareData.filter((s) => keySet.has(`${s.softwareName}::${s.categoryId}`))
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

const productKey = (item: SoftwareItem) => `${item.softwareName}::${item.categoryId}`

export const VendorScorecardBuilder: React.FC = () => {
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const { addExecutiveDocument } = useModuleStore()
  const hasProducts = myProducts.length > 0

  const selectedItems = useMemo(
    () => (hasProducts ? resolveProductNames(myProducts) : []),
    [myProducts, hasProducts]
  )

  // Per-dimension: which products are checked
  const [checkedProducts, setCheckedProducts] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {}
    for (const d of DIMENSIONS) {
      initial[d.id] = new Set<string>()
    }
    return initial
  })

  // Per-dimension: use slider instead of product picking
  const [useSlider, setUseSlider] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const d of DIMENSIONS) {
      initial[d.id] = !hasProducts
    }
    return initial
  })

  // Slider scores (used when useSlider[dim] is true)
  const [sliderScores, setSliderScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const d of DIMENSIONS) {
      initial[d.id] = 0
    }
    return initial
  })

  // Which dimension is expanded
  const [expandedDim, setExpandedDim] = useState<string | null>(null)

  // Auto-initialize checked products when selectedItems change
  useEffect(() => {
    if (selectedItems.length === 0) return
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

  // Overall weighted score
  const weightedTotal = useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    for (const d of DIMENSIONS) {
      const score = getScore(d.id)
      weightedSum += score * d.weight
      totalWeight += d.weight
    }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }, [getScore])

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
  const exportMarkdown = useMemo(() => {
    let md = '# Vendor PQC Readiness Scorecard\n\n'
    md += `**Overall Score: ${weightedTotal}/100**\n\n`
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
      md += `| ${d.label} | ${score}/100 | ${Math.round(d.weight * 100)}% | ${method} |\n`
    }
    return md
  }, [weightedTotal, getScore, useSlider, checkedProducts, selectedItems, hasProducts])

  // Save to module store when score is meaningful (store deduplicates by moduleId+type)
  useEffect(() => {
    if (weightedTotal > 0) {
      addExecutiveDocument({
        id: `vendor-scorecard-${MODULE_ID}`,
        moduleId: MODULE_ID,
        type: 'vendor-scorecard',
        title: `Vendor PQC Readiness Scorecard (${weightedTotal}/100)`,
        data: exportMarkdown,
        createdAt: Date.now(),
      })
    }
    // Only save when overall score changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightedTotal])

  return (
    <div className="space-y-6">
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
        <p className="text-sm text-muted-foreground mb-2">Vendor PQC Readiness — Overall Score</p>
        <p className={`text-3xl md:text-5xl font-bold ${getScoreColor(weightedTotal)}`}>
          {weightedTotal}
        </p>
        <p className="text-sm text-muted-foreground mt-1">/100</p>
      </div>

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
                    ({Math.round(d.weight * 100)}%)
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

      {/* Export */}
      <ExportableArtifact
        title="Vendor PQC Readiness — Export"
        exportData={exportMarkdown}
        filename="vendor-pqc-scorecard"
        formats={['markdown']}
      >
        <p className="text-sm text-muted-foreground">
          Export the scorecard above as a shareable document.
        </p>
      </ExportableArtifact>
    </div>
  )
}
