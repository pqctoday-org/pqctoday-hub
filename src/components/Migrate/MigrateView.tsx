import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { softwareData, softwareMetadata } from '../../data/migrateData'
import { useSearchParams } from 'react-router-dom'

import { SoftwareTable } from './SoftwareTable'
import { MigrationWorkflow } from './MigrationWorkflow'
import { InfrastructureStack, LAYERS, type InfrastructureLayerType } from './InfrastructureStack'
import { FilterDropdown } from '../common/FilterDropdown'
import { Search, AlertTriangle, X } from 'lucide-react'
import debounce from 'lodash/debounce'
import { logMigrateAction } from '../../utils/analytics'
import type { MigrationStep } from '../../types/MigrateTypes'

export const MigrateView: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>('All')
  const [activePqcSupport, setActivePqcSupport] = useState<string>('All')
  const [activeInfrastructureLayer, setActiveInfrastructureLayer] =
    useState<InfrastructureLayerType>('All')
  const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '')
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')

  // Scroll to software table when navigated here with a pre-set query
  const softwareTableRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && softwareTableRef.current) {
      setTimeout(
        () => softwareTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        300
      )
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [stepFilter, setStepFilter] = useState<{
    stepNumber: number
    stepTitle: string
    stepId: string
  } | null>(null)

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

  // Base data filtered by infrastructure layer (used to derive contextual dropdown options)
  const layerFilteredData = useMemo(() => {
    if (activeInfrastructureLayer === 'All') return softwareData
    return softwareData.filter((item) => {
      const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
      return layers.includes(activeInfrastructureLayer)
    })
  }, [activeInfrastructureLayer])

  // Normalize PQC support values to broad groups
  const normalizePqcSupport = useCallback((pqcSupport: string): string => {
    if (!pqcSupport) return 'Unknown'
    const lower = pqcSupport.toLowerCase()
    if (lower.startsWith('yes')) return 'Yes'
    if (lower.startsWith('limited')) return 'Limited'
    if (lower.startsWith('planned')) return 'Planned'
    if (lower.startsWith('no')) return 'No'
    return 'Unknown'
  }, [])

  // Extract unique categories — scoped to active layer + PQC support filters
  const categories = useMemo(() => {
    const source =
      activePqcSupport === 'All'
        ? layerFilteredData
        : layerFilteredData.filter(
            (item) => normalizePqcSupport(item.pqcSupport) === activePqcSupport
          )
    const cats = new Set<string>()
    source.forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName)
    })
    return Array.from(cats).sort()
  }, [layerFilteredData, activePqcSupport, normalizePqcSupport])

  const tabs = ['All', ...categories]

  // Extract PQC support options — scoped to active layer + category filters
  const pqcSupportOptions = useMemo(() => {
    const source =
      activeTab === 'All'
        ? layerFilteredData
        : layerFilteredData.filter((item) => item.categoryName === activeTab)
    const groups = new Set<string>()
    source.forEach((item) => {
      groups.add(normalizePqcSupport(item.pqcSupport))
    })
    // Fixed order: Yes, Limited, Planned, No
    const order = ['Yes', 'Limited', 'Planned', 'No', 'Unknown']
    return ['All', ...order.filter((g) => groups.has(g))]
  }, [layerFilteredData, activeTab, normalizePqcSupport])

  // Reset category/PQC support if current selection is no longer available
  useEffect(() => {
    if (activeTab !== 'All' && !categories.includes(activeTab)) {
      setActiveTab('All')
    }
  }, [categories, activeTab])

  useEffect(() => {
    if (activePqcSupport !== 'All' && !pqcSupportOptions.includes(activePqcSupport)) {
      setActivePqcSupport('All')
    }
  }, [pqcSupportOptions, activePqcSupport])

  const handleViewSoftware = useCallback((step: MigrationStep) => {
    setStepFilter({
      stepNumber: step.stepNumber,
      stepTitle: step.title,
      stepId: step.id,
    })
    setActiveTab('All')
    logMigrateAction('View Related Software', step.title)
    softwareTableRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const filteredData = useMemo(() => {
    return softwareData.filter((item) => {
      // Step filter (per-product phase matching from "View Related Products")
      if (stepFilter) {
        const phases = item.migrationPhases?.split(',').map((p) => p.trim()) ?? []
        if (!phases.includes(stepFilter.stepId)) return false
      } else if (activeTab !== 'All' && item.categoryName !== activeTab) {
        // Manual single-category tab filter
        return false
      }

      // PQC Support Filter
      if (activePqcSupport !== 'All') {
        if (normalizePqcSupport(item.pqcSupport) !== activePqcSupport) return false
      }

      // Infrastructure Layer Filter (supports comma-separated multi-layer values)
      if (activeInfrastructureLayer !== 'All') {
        const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
        if (!layers.includes(activeInfrastructureLayer)) return false
      }

      // Search Filter
      if (!filterText) return true
      const searchLower = filterText.toLowerCase()
      return (
        item.softwareName.toLowerCase().includes(searchLower) ||
        item.pqcCapabilityDescription?.toLowerCase().includes(searchLower) ||
        item.license?.toLowerCase().includes(searchLower)
      )
    })
  }, [
    activeTab,
    stepFilter,
    activePqcSupport,
    normalizePqcSupport,
    activeInfrastructureLayer,
    filterText,
  ])

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
      <div className="text-center mb-2 md:mb-12">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
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
          </div>
        )}
      </div>

      {/* Migration Workflow Hero */}
      <MigrationWorkflow onViewSoftware={handleViewSoftware} />

      {/* Infrastructure Stack */}
      <div className="py-8">
        <InfrastructureStack
          activeLayer={activeInfrastructureLayer}
          onSelectLayer={(layer) => {
            setActiveInfrastructureLayer(layer)
            setStepFilter(null)
            setActiveTab('All')
            if (layer !== 'All') {
              setTimeout(
                () =>
                  softwareTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                100
              )
            }
          }}
        />
      </div>

      {/* Software Catalog */}
      <div ref={softwareTableRef} className="pt-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Reference Catalog
        </h3>
      </div>

      {/* Active layer banner */}
      {activeInfrastructureLayer !== 'All' && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2 mb-2">
          <span>
            Filtering by layer:{' '}
            <strong>
              {LAYERS.find((l) => l.id === activeInfrastructureLayer)?.label ??
                activeInfrastructureLayer}
            </strong>{' '}
            &middot; {filteredData.length} {filteredData.length === 1 ? 'product' : 'products'}
          </span>
          <button
            onClick={() => setActiveInfrastructureLayer('All')}
            className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear layer filter"
          >
            <X size={12} />
            Clear
          </button>
        </div>
      )}

      {/* Step filter banner */}
      {stepFilter && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2 mb-2">
          <span>
            Showing products for{' '}
            <strong>
              Step {stepFilter.stepNumber}: {stepFilter.stepTitle}
            </strong>{' '}
            &middot; {filteredData.length} {filteredData.length === 1 ? 'product' : 'products'}
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

      {/* Controls Container */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-8 flex flex-col md:flex-row items-center gap-4">
        {/* Mobile: Filters on one row */}
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          {/* Category Dropdown */}
          <div className="flex-1 min-w-[150px]">
            <FilterDropdown
              items={tabs}
              selectedId={activeTab}
              onSelect={(tab) => {
                setActiveTab(tab)
                setStepFilter(null)
                logMigrateAction('Filter Category', tab)
              }}
              defaultLabel="Category"
              noContainer
              opaque
              className="mb-0 w-full"
            />
          </div>

          {/* PQC Support Dropdown */}
          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={pqcSupportOptions}
              selectedId={activePqcSupport}
              onSelect={(pqc) => {
                setActivePqcSupport(pqc)
                logMigrateAction('Filter PQC Support', pqc)
              }}
              defaultLabel="PQC Support"
              noContainer
              opaque
              className="mb-0 w-full"
            />
          </div>
        </div>

        <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
        <div className="relative flex-1 min-w-[200px] w-full">
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

      {/* Content */}
      <div className="space-y-4">
        {filteredData.length > 0 ? (
          <SoftwareTable
            key={`${activeInfrastructureLayer}-${activeTab}-${activePqcSupport}`}
            data={filteredData}
            defaultSort={{ key: 'softwareName', direction: 'asc' }}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground italic bg-muted/5 rounded-lg border border-white/5">
            No software found matching your filters.
          </div>
        )}
      </div>
    </div>
  )
}
