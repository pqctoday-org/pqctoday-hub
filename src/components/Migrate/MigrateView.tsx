import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { softwareData, softwareMetadata } from '../../data/migrateData'
import { useSearchParams } from 'react-router-dom'

import { SoftwareTable } from './SoftwareTable'
import { MigrationWorkflow } from './MigrationWorkflow'
import { InfrastructureStack, LAYERS, type InfrastructureLayerType } from './InfrastructureStack'
import { Search, AlertTriangle, X, ArrowRightLeft } from 'lucide-react'
import debounce from 'lodash/debounce'
import { logMigrateAction } from '../../utils/analytics'
import type { MigrationStep } from '../../types/MigrateTypes'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { useMigrateSelectionStore } from '../../store/useMigrateSelectionStore'

export const MigrateView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '')
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')

  const [stepFilter, setStepFilter] = useState<{
    stepNumber: number
    stepTitle: string
    stepId: string
  } | null>(null)

  // Persisted store: hidden products + active layer/sub-category
  const {
    hiddenProducts,
    hideProduct,
    restoreLayerProducts,
    activeLayer,
    activeSubCategory,
    setActiveLayer,
    setActiveSubCategory,
  } = useMigrateSelectionStore()

  // Support ?layer= deep link from Tools & Products tab
  useEffect(() => {
    const layerParam = searchParams.get('layer')
    if (layerParam && LAYERS.some((l) => l.id === layerParam)) {
      setActiveLayer(layerParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeInfrastructureLayer = activeLayer as InfrastructureLayerType
  const activeTab = activeSubCategory
  const hiddenSet = useMemo(() => new Set(hiddenProducts), [hiddenProducts])

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
  }, [stepFilter, filterText])

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
        {softwareMetadata && (
          <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 font-mono">
            <p>
              Data Source: {softwareMetadata.filename} • Updated:{' '}
              {softwareMetadata.lastUpdate.toLocaleDateString()}
            </p>
            <SourcesButton viewType="Migrate" />
            <ShareButton
              title="PQC Migration Guide — 7-Phase Framework for Post-Quantum Readiness"
              text="A 7-phase migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance. Explore software readiness and migration steps."
            />
            <GlossaryButton />
          </div>
        )}
      </div>

      {/* Migration Workflow Hero */}
      <MigrationWorkflow onViewSoftware={handleViewSoftware} />

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

      {/* Global filter controls — above the stack */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex items-center">
        <div className="relative flex-1 w-full">
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
      </div>

      {/* Infrastructure Stack with inline foldable product tables */}
      <div className="py-4">
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
          expandedContent={
            activeInfrastructureLayer !== 'All' ? (
              activeLayerTableData.length > 0 ? (
                <SoftwareTable
                  key={`${activeInfrastructureLayer}-${activeTab}-${stepFilter?.stepId ?? 'none'}`}
                  data={activeLayerTableData}
                  defaultSort={{ key: 'softwareName', direction: 'asc' }}
                  hiddenProducts={hiddenSet}
                  onHideProduct={hideProduct}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground italic text-sm">
                  No products match the current filters.
                </div>
              )
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
