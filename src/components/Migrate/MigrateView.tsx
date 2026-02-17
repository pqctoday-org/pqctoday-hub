import React, { useCallback, useMemo, useRef, useState } from 'react'
import { softwareData, softwareMetadata } from '../../data/migrateData'

import { SoftwareTable } from './SoftwareTable'
import { MigrationWorkflow } from './MigrationWorkflow'
import { FilterDropdown } from '../common/FilterDropdown'
import { Search, AlertTriangle, X } from 'lucide-react'
import debounce from 'lodash/debounce'
import { logMigrateAction } from '../../utils/analytics'
import type { MigrationStep } from '../../types/MigrateTypes'

export const MigrateView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All')
  const [activePlatform, setActivePlatform] = useState<string>('All')
  const [filterText, setFilterText] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [stepFilter, setStepFilter] = useState<{
    stepNumber: number
    stepTitle: string
    categoryIds: string[]
  } | null>(null)
  const softwareTableRef = useRef<HTMLDivElement>(null)

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

  // Extract unique categories for tabs
  const categories = useMemo(() => {
    const cats = new Set<string>()
    softwareData.forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName)
    })
    return Array.from(cats).sort()
  }, [])

  const tabs = ['All', ...categories]

  // Extract unique platforms for dropdown
  const platforms = useMemo(() => {
    const p = new Set<string>()
    softwareData.forEach((item) => {
      if (item.primaryPlatforms) {
        // Platforms might be space or comma separated in CSV, data view showed "Linux macOS Windows" (space)
        // But let's assume simple contains check is better for usage, or split by space/comma for the list
        // CSV Example: "Windows Linux macOS (.NET)"
        // For the dropdown, let's just grab the whole string or common OSes if we want to be smart.
        // To keep it simple like LibraryView's regionScope:
        if (item.primaryPlatforms.includes(',')) {
          item.primaryPlatforms.split(',').forEach((s) => p.add(s.trim()))
        } else {
          item.primaryPlatforms.split(' ').forEach((s) => p.add(s.trim()))
        }
      }
    })
    // Filter out empty or noise
    const clean = Array.from(p)
      .filter((x) => x.length > 2 && !x.startsWith('('))
      .sort()
    return ['All', ...clean]
  }, [])

  const handleViewSoftware = useCallback((step: MigrationStep) => {
    setStepFilter({
      stepNumber: step.stepNumber,
      stepTitle: step.title,
      categoryIds: step.relevantSoftwareCategories,
    })
    setActiveTab('All')
    logMigrateAction('View Related Software', step.title)
    softwareTableRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const filteredData = useMemo(() => {
    return softwareData.filter((item) => {
      // Step filter (multi-category, from "View Related Software")
      if (stepFilter) {
        if (!stepFilter.categoryIds.includes(item.categoryId)) return false
      } else if (activeTab !== 'All' && item.categoryName !== activeTab) {
        // Manual single-category tab filter
        return false
      }

      // Platform Filter
      if (activePlatform !== 'All') {
        if (!item.primaryPlatforms || !item.primaryPlatforms.includes(activePlatform)) return false
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
  }, [activeTab, stepFilter, activePlatform, filterText])

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
          PQC Software Migration Guide
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

      {/* Software Catalog */}
      <div ref={softwareTableRef} className="pt-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Software Reference Catalog
        </h3>
      </div>

      {/* Step filter banner */}
      {stepFilter && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2 mb-2">
          <span>
            Showing software for{' '}
            <strong>
              Step {stepFilter.stepNumber}: {stepFilter.stepTitle}
            </strong>{' '}
            &middot; {stepFilter.categoryIds.length}{' '}
            {stepFilter.categoryIds.length === 1 ? 'category' : 'categories'}
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

          {/* Platform Dropdown */}
          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={platforms}
              selectedId={activePlatform}
              onSelect={(platform) => {
                setActivePlatform(platform)
                logMigrateAction('Filter Platform', platform)
              }}
              defaultLabel="Platform"
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
