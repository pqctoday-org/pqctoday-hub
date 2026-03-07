// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { softwareData, softwareMetadata } from '../../data/migrateData'
import { useSearchParams } from 'react-router-dom'

import { SoftwareTable } from './SoftwareTable'
import { SoftwareCardGrid } from './SoftwareCardGrid'
import { MigrationWorkflow } from './MigrationWorkflow'
import { InfrastructureStack, LAYERS, type InfrastructureLayerType } from './InfrastructureStack'
import { MigrateViewToggle } from './MigrateViewToggle'
import { MigrateSortControl, type MigrateSortOption } from './MigrateSortControl'
import { FilterDropdown } from '../common/FilterDropdown'
import {
  Search,
  AlertTriangle,
  X,
  ArrowRightLeft,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import debounce from 'lodash/debounce'
import { logMigrateAction } from '../../utils/analytics'
import type { MigrationStep, SoftwareItem } from '../../types/MigrateTypes'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { ExportButton } from '../ui/ExportButton'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { MIGRATE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { useMigrateSelectionStore } from '../../store/useMigrateSelectionStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { useHistoryStore } from '@/store/useHistoryStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_MIGRATE_LAYERS } from '@/data/personaConfig'

const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

/** Check if a product's infrastructure layers overlap with persona-preferred layers */
function isPersonaRelevant(item: SoftwareItem, preferredLayers: string[]): boolean {
  if (preferredLayers.length === 0) return false
  const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
  return itemLayers.some((l) => preferredLayers.includes(l))
}

export const MigrateView: React.FC = () => {
  useWorkflowPhaseTracker('migrate')
  const addHistoryEvent = useHistoryStore((s) => s.addEvent)
  const persona = usePersonaStore((s) => s.selectedPersona)
  const preferredLayers = persona ? (PERSONA_MIGRATE_LAYERS[persona] ?? []) : [] // eslint-disable-line security/detect-object-injection
  const [searchParams] = useSearchParams()
  const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '')
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')

  const [stepFilter, setStepFilter] = useState<{
    stepNumber: number
    stepTitle: string
    stepId: string
  } | null>(null)

  // Support ?industry= deep link from Report
  const [industryFilter, setIndustryFilter] = useState<string | null>(
    () => searchParams.get('industry') ?? null
  )

  // Persisted store: hidden products + active layer/sub-category + view mode
  const {
    hiddenProducts,
    hideProduct,
    restoreLayerProducts,
    activeLayer,
    activeSubCategory,
    setActiveLayer,
    setActiveSubCategory,
    myProducts,
    toggleMyProduct,
    viewMode,
    setViewMode,
    workflowCollapsed,
    setWorkflowCollapsed,
  } = useMigrateSelectionStore()

  // Local state for flat-mode filters
  const [flatCategoryFilter, setFlatCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState<MigrateSortOption>('name')

  // Sync URL params on same-route navigations (e.g. chatbot deep links)
  useEffect(() => {
    const layerParam = searchParams.get('layer')
    if (layerParam && LAYERS.some((l) => l.id === layerParam)) {
      setActiveLayer(layerParam)
    }
    const q = searchParams.get('q')
    if (q !== null) {
      setFilterText(q)
      setInputValue(q)
    }
    const industry = searchParams.get('industry')
    if (industry !== null) {
      setIndustryFilter(industry)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const activeInfrastructureLayer = activeLayer as InfrastructureLayerType
  const activeTab = activeSubCategory
  const hiddenSet = useMemo(() => new Set(hiddenProducts), [hiddenProducts])
  const myProductsSet = useMemo(() => new Set(myProducts), [myProducts])

  // Fire a history event when the product selection changes meaningfully (debounced)
  const prevProductCountRef = useRef(myProducts.length)
  useEffect(() => {
    const count = myProducts.length
    if (count === prevProductCountRef.current) return
    prevProductCountRef.current = count
    if (count === 0) return
    const timer = setTimeout(() => {
      addHistoryEvent({
        type: 'migrate_product_selection',
        timestamp: Date.now(),
        title: 'Updated product selection',
        detail: `${count} product${count === 1 ? '' : 's'} selected`,
        route: '/migrate',
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [myProducts.length, addHistoryEvent])

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetFilter = useCallback(
    debounce((value: string) => {
      setFilterText(value)
      if (value) logMigrateAction('Search', value)
    }, 200),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    debouncedSetFilter(e.target.value)
  }

  // Per-layer data: products scoped by global filters (search, step)
  const perLayerData = useMemo(() => {
    return LAYERS.reduce(
      (acc, layer) => {
        acc[layer.id] = softwareData.filter((item) => {
          // Step filter
          if (stepFilter) {
            const phases = item.migrationPhases?.split(',').map((p) => p.trim()) ?? []
            if (!phases.includes(stepFilter.stepId)) return false
          }
          // Layer filter
          const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
          if (!itemLayers.includes(layer.id)) return false
          // Industry filter (from ?industry= deep link)
          if (industryFilter) {
            const q = industryFilter.toLowerCase()
            if (!item.targetIndustries?.toLowerCase().includes(q)) return false
          }
          // Search filter
          if (filterText) {
            const q = filterText.toLowerCase()
            return (
              item.softwareName.toLowerCase().includes(q) ||
              item.pqcCapabilityDescription?.toLowerCase().includes(q) ||
              item.license?.toLowerCase().includes(q)
            )
          }
          return true
        })
        return acc
      },
      {} as Record<string, (typeof softwareData)[number][]>
    )
  }, [stepFilter, filterText, industryFilter])

  // Layer product counts (for badges on collapsed layer rows)
  const layerProductCounts = useMemo(
    () =>
      LAYERS.reduce(
        (acc, layer) => {
          acc[layer.id as InfrastructureLayerType] = perLayerData[layer.id]?.length ?? 0
          return acc
        },
        {} as Partial<Record<InfrastructureLayerType, number>>
      ),
    [perLayerData]
  )

  // Layer product keys (for restore-layer action)
  const layerProductKeys = useMemo(
    () =>
      LAYERS.reduce(
        (acc, layer) => {
          acc[layer.id as InfrastructureLayerType] = (perLayerData[layer.id] ?? []).map(
            (item) => `${item.softwareName}::${item.categoryId}`
          )
          return acc
        },
        {} as Partial<Record<InfrastructureLayerType, string[]>>
      ),
    [perLayerData]
  )

  // Layer selected counts (for "My Products" badges)
  const layerSelectedCounts = useMemo(
    () =>
      LAYERS.reduce(
        (acc, layer) => {
          const keys = new Set(layerProductKeys[layer.id as InfrastructureLayerType] ?? [])
          acc[layer.id as InfrastructureLayerType] = myProducts.filter((k) => keys.has(k)).length
          return acc
        },
        {} as Partial<Record<InfrastructureLayerType, number>>
      ),
    [layerProductKeys, myProducts]
  )

  // Layer hidden counts (for restore badges)
  const layerHiddenCounts = useMemo(
    () =>
      LAYERS.reduce(
        (acc, layer) => {
          const keys = new Set(layerProductKeys[layer.id as InfrastructureLayerType] ?? [])
          acc[layer.id as InfrastructureLayerType] = hiddenProducts.filter((k) =>
            keys.has(k)
          ).length
          return acc
        },
        {} as Partial<Record<InfrastructureLayerType, number>>
      ),
    [layerProductKeys, hiddenProducts]
  )

  // Sub-categories for the active layer (scoped to perLayerData)
  const categories = useMemo(() => {
    if (activeInfrastructureLayer === 'All') return []
    const cats = new Set<string>()
    // eslint-disable-next-line security/detect-object-injection
    ;(perLayerData[activeInfrastructureLayer] ?? []).forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName)
    })
    return Array.from(cats).sort()
  }, [perLayerData, activeInfrastructureLayer])

  // Active layer table data (further scoped by sub-category)
  const activeLayerTableData = useMemo(() => {
    if (activeInfrastructureLayer === 'All') return []
    // eslint-disable-next-line security/detect-object-injection
    const layerData = perLayerData[activeInfrastructureLayer] ?? []
    if (activeTab === 'All') return layerData
    return layerData.filter((item) => item.categoryName === activeTab)
  }, [perLayerData, activeInfrastructureLayer, activeTab])

  // Reset sub-category if no longer available in active layer
  useEffect(() => {
    if (activeTab !== 'All' && !categories.includes(activeTab)) {
      setActiveSubCategory('All')
    }
  }, [categories, activeTab, setActiveSubCategory])

  // --- Flat-mode computed data (Cards / Table) ---

  // All products filtered by global filters + layer dropdown + category dropdown
  const allFilteredProducts = useMemo(() => {
    return softwareData.filter((item) => {
      // Step filter
      if (stepFilter) {
        const phases = item.migrationPhases?.split(',').map((p) => p.trim()) ?? []
        if (!phases.includes(stepFilter.stepId)) return false
      }
      // Industry filter
      if (industryFilter) {
        const q = industryFilter.toLowerCase()
        if (!item.targetIndustries?.toLowerCase().includes(q)) return false
      }
      // Layer filter (from dropdown in flat modes)
      if (activeLayer !== 'All') {
        const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
        if (!itemLayers.includes(activeLayer)) return false
      }
      // Category filter (from dropdown in flat modes)
      if (flatCategoryFilter !== 'All') {
        if (item.categoryName !== flatCategoryFilter) return false
      }
      // Search filter
      if (filterText) {
        const q = filterText.toLowerCase()
        return (
          item.softwareName.toLowerCase().includes(q) ||
          item.pqcCapabilityDescription?.toLowerCase().includes(q) ||
          item.license?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [stepFilter, industryFilter, activeLayer, flatCategoryFilter, filterText])

  // Unique categories for the flat-mode category dropdown (scoped to selected layer)
  const flatCategories = useMemo(() => {
    const sourceData =
      activeLayer !== 'All'
        ? softwareData.filter((item) => {
            const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
            return layers.includes(activeLayer)
          })
        : softwareData
    const cats = new Set<string>()
    sourceData.forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName)
    })
    return Array.from(cats).sort()
  }, [activeLayer])

  // Reset flat category filter when layer changes and category no longer exists
  useEffect(() => {
    if (flatCategoryFilter !== 'All' && !flatCategories.includes(flatCategoryFilter)) {
      setFlatCategoryFilter('All')
    }
  }, [flatCategories, flatCategoryFilter])

  // Sorted products for Cards mode — persona-relevant items float to top within each sort
  const sortedFlatProducts = useMemo(() => {
    const items = [...allFilteredProducts]

    // Primary sort by selected option
    if (sortBy === 'name') {
      items.sort((a, b) => a.softwareName.localeCompare(b.softwareName))
    } else if (sortBy === 'pqcSupport') {
      const order: Record<string, number> = { yes: 0, limited: 1, planned: 2, no: 3 }
      items.sort((a, b) => {
        const aKey = Object.keys(order).find((k) => a.pqcSupport?.toLowerCase().startsWith(k))
        const bKey = Object.keys(order).find((k) => b.pqcSupport?.toLowerCase().startsWith(k))
        return (order[aKey ?? ''] ?? 4) - (order[bKey ?? ''] ?? 4)
      })
    } else if (sortBy === 'pqcMigrationPriority') {
      items.sort(
        (a, b) =>
          (PRIORITY_ORDER[a.pqcMigrationPriority] ?? 4) -
          (PRIORITY_ORDER[b.pqcMigrationPriority] ?? 4)
      )
    } else if (sortBy === 'fipsValidated') {
      const fipsOrder = (s: string) => {
        const lower = (s || '').toLowerCase()
        if (lower.includes('fips 140') || lower.includes('fips 203')) return 0
        if (lower.startsWith('yes')) return 1
        return 2
      }
      items.sort((a, b) => fipsOrder(a.fipsValidated) - fipsOrder(b.fipsValidated))
    }

    // Secondary: float persona-relevant items to top (stable sort preserves primary order)
    if (preferredLayers.length > 0) {
      items.sort((a, b) => {
        const aRelevant = isPersonaRelevant(a, preferredLayers) ? 0 : 1
        const bRelevant = isPersonaRelevant(b, preferredLayers) ? 0 : 1
        return aRelevant - bRelevant
      })
    }

    return items
  }, [allFilteredProducts, sortBy, preferredLayers])

  // Layer filter dropdown items
  const layerFilterItems = useMemo(
    () =>
      LAYERS.map((layer) => {
        const Icon = layer.icon
        return {
          id: layer.id,
          label: layer.label,
          icon: <Icon size={16} className={layer.iconColor} />,
        }
      }),
    []
  )

  // Category filter dropdown items
  const categoryFilterItems = useMemo(
    () => flatCategories.map((cat) => ({ id: cat, label: cat })),
    [flatCategories]
  )

  // Visible product count for flat modes
  const flatVisibleCount = useMemo(() => {
    const items: SoftwareItem[] = viewMode === 'cards' ? sortedFlatProducts : allFilteredProducts
    return hiddenSet.size > 0
      ? items.filter((item) => !hiddenSet.has(`${item.softwareName}::${item.categoryId}`)).length
      : items.length
  }, [viewMode, sortedFlatProducts, allFilteredProducts, hiddenSet])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(allFilteredProducts, MIGRATE_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-migrate-catalog'))
  }, [allFilteredProducts])

  const handleViewSoftware = useCallback(
    (step: MigrationStep) => {
      setStepFilter({
        stepNumber: step.stepNumber,
        stepTitle: step.title,
        stepId: step.id,
      })
      setActiveSubCategory('All')
      logMigrateAction('View Related Software', step.title)
      // No scroll needed — stack is above the fold; user selects a layer to see step products
    },
    [setActiveSubCategory]
  )

  if (!softwareData || softwareData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Unable to Load Software Data</h2>
        <p className="text-muted-foreground max-w-md">No reference data found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-2 md:mb-12">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient flex items-center justify-center gap-2 md:gap-3">
          <ArrowRightLeft className="w-5 h-5 md:w-9 md:h-9 text-primary" aria-hidden="true" />
          PQC Migration Guide
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          A 7-phase migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance.
        </p>
        {/* Mobile-only: icon buttons cluster — desktop gets these inside the metadata row below */}
        <div className="flex lg:hidden items-center justify-center gap-2 mb-2">
          <SourcesButton viewType="Migrate" />
          <ShareButton
            title="PQC Migration Guide — 7-Phase Framework for Post-Quantum Readiness"
            text="A 7-phase migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance. Explore software readiness and migration steps."
          />
          <GlossaryButton />
          <ExportButton onExport={handleExportCsv} />
        </div>
        {softwareMetadata && (
          <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 font-mono">
            <p>
              Data Source: {softwareMetadata.filename} • Updated:{' '}
              {softwareMetadata.lastUpdate.toLocaleDateString()}
            </p>
            {myProducts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-sans">
                <CheckSquare size={12} />
                {myProducts.length} selected
              </span>
            )}
            <SourcesButton viewType="Migrate" />
            <ShareButton
              title="PQC Migration Guide — 7-Phase Framework for Post-Quantum Readiness"
              text="A 7-phase migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance. Explore software readiness and migration steps."
            />
            <GlossaryButton />
            <ExportButton onExport={handleExportCsv} />
          </div>
        )}
      </div>

      {/* Migration Workflow Hero — collapsible */}
      <div>
        <button
          onClick={() => setWorkflowCollapsed(!workflowCollapsed)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          aria-expanded={!workflowCollapsed}
          aria-controls="migration-workflow-hero"
        >
          {workflowCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          {workflowCollapsed ? 'Show Migration Framework' : 'Hide Migration Framework'}
        </button>
        {!workflowCollapsed && (
          <div id="migration-workflow-hero">
            <MigrationWorkflow onViewSoftware={handleViewSoftware} />
          </div>
        )}
      </div>

      {/* Industry filter banner (from ?industry= deep link) */}
      {industryFilter && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
          <span>
            Showing products relevant to <strong>{industryFilter}</strong>
          </span>
          <button
            onClick={() => setIndustryFilter(null)}
            className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear industry filter"
          >
            <X size={12} />
            Clear
          </button>
        </div>
      )}

      {/* Step filter banner */}
      {stepFilter && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
          <span>
            Showing products for{' '}
            <strong>
              Step {stepFilter.stepNumber}: {stepFilter.stepTitle}
            </strong>{' '}
            — select a layer below to view matching products
          </span>
          <button
            onClick={() => setStepFilter(null)}
            className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear step filter"
          >
            <X size={12} />
            Clear
          </button>
        </div>
      )}

      {/* Filter control band */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-wrap items-center gap-2">
        {/* Layer dropdown — flat modes only */}
        {viewMode !== 'stack' && (
          <FilterDropdown
            items={layerFilterItems}
            selectedId={activeLayer === 'All' ? 'All' : activeLayer}
            onSelect={(id) => {
              setActiveLayer(id)
              setFlatCategoryFilter('All')
              logMigrateAction('Filter Layer', id)
            }}
            defaultLabel="All Layers"
          />
        )}

        {/* Category dropdown — flat modes only, scoped to selected layer */}
        {viewMode !== 'stack' && flatCategories.length > 1 && (
          <FilterDropdown
            items={categoryFilterItems}
            selectedId={flatCategoryFilter}
            onSelect={(id) => {
              setFlatCategoryFilter(id)
              logMigrateAction('Filter Category', id)
            }}
            defaultLabel="All Categories"
          />
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            id="software-search"
            placeholder="Search software..."
            aria-label="Search software"
            value={inputValue}
            onChange={handleSearchChange}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Sort — cards mode only */}
        {viewMode === 'cards' && <MigrateSortControl value={sortBy} onChange={setSortBy} />}

        {/* View toggle — always visible */}
        <MigrateViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Results count — flat modes only */}
      {viewMode !== 'stack' && (
        <p className="text-xs text-muted-foreground">
          {flatVisibleCount} product{flatVisibleCount !== 1 ? 's' : ''}
          {activeLayer !== 'All' &&
            ` in ${LAYERS.find((l) => l.id === activeLayer)?.label ?? activeLayer}`}
        </p>
      )}

      {/* Content area — mode-specific rendering */}
      <div className="py-4">
        {viewMode === 'stack' && (
          <InfrastructureStack
            activeLayer={activeInfrastructureLayer}
            onSelectLayer={(layer) => {
              setActiveLayer(layer)
            }}
            subCategories={activeInfrastructureLayer !== 'All' ? categories : []}
            activeSubCategory={activeTab}
            onSelectSubCategory={(cat) => {
              setActiveSubCategory(cat)
              logMigrateAction('Filter Category', cat)
            }}
            layerProductCounts={layerProductCounts}
            layerHiddenCounts={layerHiddenCounts}
            layerProductKeys={layerProductKeys}
            onRestoreLayer={(keys) => restoreLayerProducts(keys)}
            layerSelectedCounts={layerSelectedCounts}
            expandedContent={
              activeInfrastructureLayer !== 'All' ? (
                activeLayerTableData.length > 0 ? (
                  <SoftwareTable
                    key={`${activeInfrastructureLayer}-${activeTab}-${stepFilter?.stepId ?? 'none'}`}
                    data={activeLayerTableData}
                    defaultSort={{ key: 'softwareName', direction: 'asc' }}
                    hiddenProducts={hiddenSet}
                    onHideProduct={hideProduct}
                    selectedProducts={myProductsSet}
                    onToggleProduct={toggleMyProduct}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground italic text-sm">
                    No products match the current filters.
                  </div>
                )
              ) : undefined
            }
          />
        )}

        {viewMode === 'cards' && (
          <SoftwareCardGrid
            items={sortedFlatProducts}
            hiddenProducts={hiddenSet}
            onHideProduct={hideProduct}
            selectedProducts={myProductsSet}
            onToggleProduct={toggleMyProduct}
          />
        )}

        {viewMode === 'table' &&
          (allFilteredProducts.length > 0 ? (
            <SoftwareTable
              key={`flat-table-${activeLayer}-${flatCategoryFilter}-${stepFilter?.stepId ?? 'none'}`}
              data={allFilteredProducts}
              defaultSort={{ key: 'softwareName', direction: 'asc' }}
              hiddenProducts={hiddenSet}
              onHideProduct={hideProduct}
              selectedProducts={myProductsSet}
              onToggleProduct={toggleMyProduct}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground italic text-sm">
              No products match the current filters.
            </div>
          ))}
      </div>
    </div>
  )
}
