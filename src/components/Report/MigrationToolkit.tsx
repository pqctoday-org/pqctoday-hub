// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Package, ArrowRight, ChevronDown, EyeOff } from 'lucide-react'
import { useMigrateSelectionStore } from '../../store/useMigrateSelectionStore'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { softwareData } from '../../data/migrateData'
import { Button } from '../ui/button'
import { SectionInfoTip } from './ReportContent'
import clsx from 'clsx'

const priorityConfig = {
  Critical: { color: 'text-destructive', bg: 'bg-destructive/10' },
  High: { color: 'text-warning', bg: 'bg-warning/10' },
  Medium: { color: 'text-primary', bg: 'bg-primary/10' },
  Low: { color: 'text-success', bg: 'bg-success/10' },
} as const

const fipsConfig = {
  validated: { label: 'FIPS', color: 'text-success', bg: 'bg-success/10' },
  partial: { label: 'Partial', color: 'text-warning', bg: 'bg-warning/10' },
  no: { label: 'No FIPS', color: 'text-muted-foreground', bg: 'bg-muted' },
} as const

function getFipsStatus(fips: string) {
  const lower = fips.toLowerCase()
  if (lower.startsWith('yes') && !lower.includes('mode')) return fipsConfig.validated
  if (lower.includes('partial') || lower.includes('mode') || lower.includes('fips'))
    return fipsConfig.partial
  return fipsConfig.no
}

interface MigrationToolkitProps {
  /** Infrastructure layer IDs from the assessment (e.g. ['Hardware', 'Cloud']). */
  assessmentInfrastructure: string[]
  /** Per-layer sub-category selections; empty array = all sub-cats in that layer. */
  assessmentSubCategories: Record<string, string[]>
  /** Industry from the assessment (used as fallback label only). */
  assessmentIndustry: string
  /** Whether section starts expanded (default true). */
  defaultOpen?: boolean
}

export const MigrationToolkit: React.FC<MigrationToolkitProps> = ({
  assessmentInfrastructure,
  assessmentSubCategories,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const hiddenProducts = useMigrateSelectionStore((s) => s.hiddenProducts)
  const hideProduct = useMigrateSelectionStore((s) => s.hideProduct)
  const restoreAll = useMigrateSelectionStore((s) => s.restoreAll)
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const importProductSelection = useAssessmentStore((s) => s.importProductSelection)

  // "Selected" mode: user has explicitly bookmarked products AND the import toggle is ON
  const useSelectedMode = importProductSelection && myProducts.length > 0

  const { selectedProducts, groupedByLayer } = useMemo(() => {
    const hiddenSet = new Set(hiddenProducts)

    let selected: typeof softwareData

    if (useSelectedMode) {
      // Show only the user's explicitly bookmarked products (minus hidden)
      const mySet = new Set(myProducts)
      selected = softwareData.filter((item) => {
        const key = `${item.softwareName}::${item.categoryId}`
        return mySet.has(key) && !hiddenSet.has(key)
      })
    } else {
      // Fall back to infrastructure-filtered recommendations
      selected = softwareData.filter((item) => {
        const key = `${item.softwareName}::${item.categoryId}`
        return !hiddenSet.has(key)
      })

      // Filter by selected infrastructure layer IDs (exact match)
      if (assessmentInfrastructure.length > 0) {
        selected = selected.filter((item) => {
          const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
          return itemLayers.some((l) => assessmentInfrastructure.includes(l))
        })

        // Further filter by sub-categories (per-layer; empty = all sub-cats in that layer)
        const hasSubCatFilter = assessmentInfrastructure.some(
          (l) => (assessmentSubCategories[l] ?? []).length > 0
        )
        if (hasSubCatFilter) {
          selected = selected.filter((item) => {
            const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
            return itemLayers.some((layer) => {
              if (!assessmentInfrastructure.includes(layer)) return false
              const cats = assessmentSubCategories[layer] ?? []
              return cats.length === 0 || cats.includes(item.categoryName)
            })
          })
        }
      }
    }

    // Sort by migration priority
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    selected.sort((a, b) => {
      const pa = priorityOrder[a.pqcMigrationPriority as keyof typeof priorityOrder] ?? 4
      const pb = priorityOrder[b.pqcMigrationPriority as keyof typeof priorityOrder] ?? 4
      return pa - pb
    })

    // Group by infrastructure layer (take first layer for grouping)
    const grouped = new Map<string, typeof selected>()
    for (const item of selected) {
      const layer = item.infrastructureLayer.split(',')[0].trim() || 'Other'
      const existing = grouped.get(layer) ?? []
      existing.push(item)
      grouped.set(layer, existing)
    }

    return { selectedProducts: selected, groupedByLayer: grouped }
  }, [
    hiddenProducts,
    myProducts,
    useSelectedMode,
    assessmentInfrastructure,
    assessmentSubCategories,
  ])

  const titleRow = (
    <div className="flex items-center gap-2 font-semibold text-foreground">
      <Package className="text-primary" size={20} />
      Your Migration Toolkit
      <SectionInfoTip sectionId="migrationToolkit" />
    </div>
  )

  // Selected mode: all bookmarked products are hidden
  if (useSelectedMode && selectedProducts.length === 0) {
    return (
      <div className="glass-panel p-6">
        {titleRow}
        <div className="text-center py-6 mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            All your selected products are hidden.
          </p>
          <Button variant="outline" onClick={restoreAll}>
            Restore Hidden Products
          </Button>
        </div>
      </div>
    )
  }

  // Recommended mode: no infra selected, or no matches
  if (!useSelectedMode && selectedProducts.length === 0) {
    const noInfraSelected = assessmentInfrastructure.length === 0
    return (
      <div className="glass-panel p-6">
        {titleRow}
        <div className="text-center py-6 mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            {noInfraSelected
              ? 'Select your infrastructure layers in Step 11 of the assessment to see relevant migration tools here.'
              : 'No products match your selected infrastructure and sub-categories.'}
          </p>
          <Link
            to={noInfraSelected ? '/assess' : '/migrate'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground text-sm font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          >
            {noInfraSelected ? 'Go to Assessment' : 'Explore Tools'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 print:border print:border-border">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full h-auto items-center justify-between print:hidden"
        aria-expanded={open}
      >
        {titleRow}
        <div className="flex items-center gap-2">
          {hiddenProducts.length > 0 && (
            <Button
              variant="ghost"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                restoreAll()
              }}
              className="text-xs px-2.5 py-1 h-auto rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 print:hidden"
            >
              {hiddenProducts.length} hidden · Restore
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
            {useSelectedMode && <span className="ml-1.5 text-primary/60">· Selected</span>}
          </span>
          <ChevronDown
            size={18}
            className={clsx(
              'text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>
      </Button>
      {/* Print-only static title */}
      <div className="hidden print:flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Package className="text-primary" size={20} />
          Your Migration Toolkit
        </div>
        <span className="text-xs text-muted-foreground">
          {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className={clsx('mt-4', !open && 'hidden print:block')}>
        <p className="text-sm text-muted-foreground mb-4">
          {useSelectedMode ? (
            <>
              Your bookmarked products from the{' '}
              <Link to="/migrate" className="text-primary hover:underline">
                Migrate catalog
              </Link>
              . Select or remove products in the Migrate view or in Step 12 of the assessment.
            </>
          ) : (
            <>
              Products from the Migrate catalog matching your infrastructure profile. Manage
              selections in the{' '}
              <Link to="/migrate" className="text-primary hover:underline">
                Migrate view
              </Link>
              .
            </>
          )}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="w-8 print:hidden" />
                <th className="py-1.5 pr-3 font-medium text-muted-foreground">Product</th>
                <th className="py-1.5 pr-3 font-medium text-muted-foreground hidden sm:table-cell">
                  PQC Support
                </th>
                <th className="py-1.5 pr-3 font-medium text-muted-foreground hidden md:table-cell">
                  FIPS
                </th>
                <th className="py-1.5 font-medium text-muted-foreground">Priority</th>
              </tr>
            </thead>
            {Array.from(groupedByLayer.entries()).map(([layer, items]) => (
              <tbody key={layer}>
                <tr>
                  <td colSpan={5} className="pt-4 pb-1">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">
                      {layer}
                    </h4>
                  </td>
                </tr>
                {items.slice(0, 5).map((item) => {
                  const fips = getFipsStatus(item.fipsValidated)
                  const priority =
                    priorityConfig[item.pqcMigrationPriority as keyof typeof priorityConfig]

                  return (
                    <tr
                      key={`${item.softwareName}::${item.categoryId}`}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="p-2 w-8 print:hidden">
                        <Button
                          variant="ghost"
                          type="button"
                          aria-label="Hide this product"
                          onClick={(e) => {
                            e.stopPropagation()
                            hideProduct(`${item.softwareName}::${item.categoryId}`)
                          }}
                          className="p-1 h-auto w-auto rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                        >
                          <EyeOff size={14} />
                        </Button>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-medium text-foreground">{item.softwareName}</span>
                        <span className="text-xs text-muted-foreground ml-1.5 hidden lg:inline">
                          {item.categoryName}
                        </span>
                      </td>
                      <td className="py-2 pr-3 hidden sm:table-cell">
                        <span
                          className={clsx(
                            'text-xs',
                            item.pqcSupport.toLowerCase().startsWith('yes')
                              ? 'text-success'
                              : item.pqcSupport.toLowerCase().startsWith('partial') ||
                                  item.pqcSupport.toLowerCase().startsWith('limited') ||
                                  item.pqcSupport.toLowerCase().startsWith('planned') ||
                                  item.pqcSupport.toLowerCase().startsWith('in progress')
                                ? 'text-warning'
                                : 'text-muted-foreground'
                          )}
                        >
                          {item.pqcSupport.split('(')[0].trim()}
                        </span>
                      </td>
                      <td className="py-2 pr-3 hidden md:table-cell">
                        <span
                          className={clsx('text-xs px-1.5 py-0.5 rounded', fips.bg, fips.color)}
                        >
                          {fips.label}
                        </span>
                      </td>
                      <td className="py-2">
                        {priority ? (
                          <span
                            className={clsx(
                              'text-xs px-1.5 py-0.5 rounded',
                              priority.bg,
                              priority.color
                            )}
                          >
                            {item.pqcMigrationPriority}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {item.pqcMigrationPriority}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {items.length > 5 && (
                  <tr>
                    <td colSpan={5} className="py-1">
                      <p className="text-xs text-muted-foreground">
                        +{items.length - 5} more in this layer
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between print:hidden">
          <Link
            to="/migrate"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {useSelectedMode ? 'Manage product selections' : 'Explore more tools'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
