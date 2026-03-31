// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { softwareData, softwareMetadata, vendorMap } from '../../data/migrateData'
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
  X,
  ChevronRight,
  ChevronDown,
  PackageSearch,
  EyeOff,
  ArrowRightLeft,
  Wrench,
} from 'lucide-react'
import debounce from 'lodash/debounce'
import { logMigrateAction } from '../../utils/analytics'
import { MIGRATION_STEPS } from '../../data/migrationWorkflowData'
import type { MigrationStep, SoftwareItem } from '../../types/MigrateTypes'
import { PageHeader } from '../common/PageHeader'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { MIGRATE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { useMigrateSelectionStore } from '../../store/useMigrateSelectionStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { useHistoryStore } from '@/store/useHistoryStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_MIGRATE_LAYERS } from '@/data/personaConfig'
import { Button } from '../ui/button'
import { ErrorAlert } from '../ui/error-alert'
import { EmptyState } from '../ui/empty-state'
import { ComparisonPanel } from './ComparisonPanel'
import { StickyCompareBar } from './StickyCompareBar'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '')
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')

  const [stepFilter, setStepFilter] = useState<{
    stepNumber: number
    stepTitle: string
    stepId: string
  } | null>(() => {
    const step = searchParams.get('step')
    if (step) {
      const found = MIGRATION_STEPS.find((s) => s.id === step)
      return found
        ? { stepNumber: found.stepNumber, stepTitle: found.title, stepId: found.id }
        : null
    }
    return null
  })

  // Support ?industry= deep link from Report
  const [industryFilter, setIndustryFilter] = useState<string | null>(
    () => searchParams.get('industry') ?? null
  )

  // Persisted store: hidden products + active layer/sub-category + view mode
  const {
    hiddenProducts,
    hideProduct,
    restoreLayerProducts,
    restoreAll,
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

  // Shared expanded-row state — survives layer/filter switches
  const [tableExpandedIds, setTableExpandedIds] = useState<Set<string>>(new Set())
  const handleToggleTableExpand = useCallback((id: string) => {
    setTableExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Comparison state — separate from "My Products" workflow selection
  const MAX_COMPARE = 3
  const [compareKeys, setCompareKeys] = useState<string[]>([])
  const [showComparisonPanel, setShowComparisonPanel] = useState(false)
  const comparisonPanelRef = useRef<HTMLDivElement>(null)

  const handleToggleCompare = useCallback((key: string) => {
    setCompareKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, key]
    })
  }, [])

  const maxCompareReached = compareKeys.length >= MAX_COMPARE
  const compareSet = useMemo(() => new Set(compareKeys), [compareKeys])

  const comparisonProducts = useMemo(
    () =>
      compareKeys
        .map((key) => {
          const [name] = key.split('::')
          return softwareData.find((s) => s.softwareName === name)
        })
        .filter((s): s is SoftwareItem => !!s),
    [compareKeys] // softwareData is a module-level constant — safe to exclude
  )

  // Auto-hide comparison panel when products drop below the minimum
  useEffect(() => {
    if (comparisonProducts.length < 2 && showComparisonPanel) {
      setShowComparisonPanel(false)
    }
  }, [comparisonProducts.length, showComparisonPanel])

  // Local state for flat-mode filters — initialized from URL params for deep linking
  const [flatCategoryFilter, setFlatCategoryFilter] = useState(
    () => searchParams.get('cat') ?? 'All'
  )
  const [vendorFilter, setVendorFilter] = useState(() => searchParams.get('vendor') ?? 'All')
  const [verificationFilter, setVerificationFilter] = useState(
    () => searchParams.get('verification') ?? 'All'
  )
  const [sortBy, setSortBy] = useState<MigrateSortOption>(
    () => (searchParams.get('sort') as MigrateSortOption | null) ?? 'name'
  )

  // Backward-compat mapping for renamed infrastructure layers
  const LEGACY_LAYER_MAP: Record<string, string> = { Application: 'AppServers' }

  // Sync URL params on same-route navigations (e.g. chatbot deep links)
  useEffect(() => {
    const layerParam = searchParams.get('layer')
    if (layerParam) {
      const resolved = LEGACY_LAYER_MAP[layerParam] ?? layerParam
      if (LAYERS.some((l) => l.id === resolved)) {
        setActiveLayer(resolved)
      }
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
    const stepParam = searchParams.get('step')
    if (stepParam !== null) {
      const found = MIGRATION_STEPS.find((s) => s.id === stepParam)
      if (found) {
        setStepFilter({ stepNumber: found.stepNumber, stepTitle: found.title, stepId: found.id })
      } else {
        setStepFilter(null)
      }
    }
    const cat = searchParams.get('cat')
    if (cat !== null) setFlatCategoryFilter((prev) => (prev !== cat ? cat : prev))
    const vendor = searchParams.get('vendor')
    if (vendor !== null) setVendorFilter((prev) => (prev !== vendor ? vendor : prev))
    const sort = searchParams.get('sort') as MigrateSortOption | null
    if (sort !== null) setSortBy((prev) => (prev !== sort ? sort : prev))
    const mode = searchParams.get('mode') as 'stack' | 'cards' | 'table' | null
    if (mode !== null) setViewMode(mode)
    const subcat = searchParams.get('subcat')
    if (subcat !== null) setActiveSubCategory(subcat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const syncFiltersToUrl = useCallback(
    (overrides: {
      q?: string
      industry?: string | null
      step?: string | null
      layer?: string
      cat?: string
      vendor?: string
      verification?: string
      sort?: MigrateSortOption
      mode?: 'stack' | 'cards' | 'table'
      subcat?: string
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const q = overrides.q !== undefined ? overrides.q : filterText
          const ind = overrides.industry !== undefined ? overrides.industry : industryFilter
          const stp = overrides.step !== undefined ? overrides.step : (stepFilter?.stepId ?? null)
          const lyr = overrides.layer !== undefined ? overrides.layer : activeLayer
          const cat = overrides.cat !== undefined ? overrides.cat : flatCategoryFilter
          const vendor = overrides.vendor !== undefined ? overrides.vendor : vendorFilter
          const verification =
            overrides.verification !== undefined ? overrides.verification : verificationFilter
          const sort = overrides.sort !== undefined ? overrides.sort : sortBy
          const mode = overrides.mode !== undefined ? overrides.mode : viewMode
          const subcat = overrides.subcat !== undefined ? overrides.subcat : activeSubCategory

          if (q) next.set('q', q)
          else next.delete('q')

          if (ind) next.set('industry', ind)
          else next.delete('industry')

          if (stp) next.set('step', stp)
          else next.delete('step')

          if (lyr && lyr !== 'All') next.set('layer', lyr)
          else next.delete('layer')

          if (cat !== 'All') next.set('cat', cat)
          else next.delete('cat')

          if (vendor !== 'All') next.set('vendor', vendor)
          else next.delete('vendor')

          if (verification !== 'All') next.set('verification', verification)
          else next.delete('verification')

          if (sort !== 'name') next.set('sort', sort)
          else next.delete('sort')

          if (mode !== 'stack') next.set('mode', mode)
          else next.delete('mode')

          if (subcat !== 'All') next.set('subcat', subcat)
          else next.delete('subcat')

          return next
        },
        { replace: true }
      )
    },
    [
      filterText,
      industryFilter,
      stepFilter,
      activeLayer,
      flatCategoryFilter,
      vendorFilter,
      verificationFilter,
      sortBy,
      viewMode,
      activeSubCategory,
      setSearchParams,
    ]
  )

  // Synchronous URL overrides — prevents first-render flash when URL params differ from
  // persisted Zustand store values. These are used for rendering only; store setters are
  // still called in the useEffect above so the store converges after first render.
  const urlLayerParam = searchParams.get('layer')
  const urlSubcatParam = searchParams.get('subcat')
  const urlModeParam = searchParams.get('mode') as 'stack' | 'cards' | 'table' | null
  const effectiveLayer =
    urlLayerParam && LAYERS.some((l) => l.id === urlLayerParam) ? urlLayerParam : activeLayer
  const effectiveSubCategory = urlSubcatParam ?? activeSubCategory
  const effectiveViewMode = urlModeParam ?? viewMode

  const activeInfrastructureLayer = effectiveLayer as InfrastructureLayerType
  const activeTab = effectiveSubCategory
  const hiddenSet = useMemo(() => new Set(hiddenProducts), [hiddenProducts])
  const myProductsSet = useMemo(() => new Set(myProducts), [myProducts])
  const isStackAllView = effectiveViewMode === 'stack' && activeInfrastructureLayer === 'All'

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
      syncFiltersToUrl({ q: value })
      if (value) logMigrateAction('Search', value)
    }, 200),
    [syncFiltersToUrl]
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
          // Vendor filter
          if (vendorFilter !== 'All' && item.vendorId !== vendorFilter) return false
          // Verification status filter
          if (verificationFilter !== 'All' && item.verificationStatus !== verificationFilter)
            return false
          // Search filter
          if (filterText) {
            const q = filterText.toLowerCase()
            return (
              item.softwareName.toLowerCase().includes(q) ||
              item.pqcCapabilityDescription?.toLowerCase().includes(q) ||
              item.pqcSupport?.toLowerCase().includes(q) ||
              item.productBrief?.toLowerCase().includes(q) ||
              item.categoryName?.toLowerCase().includes(q) ||
              item.license?.toLowerCase().includes(q)
            )
          }
          return true
        })
        return acc
      },
      {} as Record<string, (typeof softwareData)[number][]>
    )
  }, [stepFilter, filterText, industryFilter, vendorFilter, verificationFilter])

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
      if (effectiveLayer !== 'All') {
        const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
        if (!itemLayers.includes(effectiveLayer)) return false
      }
      // Category filter (from dropdown in flat modes)
      if (flatCategoryFilter !== 'All') {
        if (item.categoryName !== flatCategoryFilter) return false
      }
      // Vendor filter
      if (vendorFilter !== 'All' && item.vendorId !== vendorFilter) return false
      // Verification status filter
      if (verificationFilter !== 'All' && item.verificationStatus !== verificationFilter)
        return false
      // Search filter
      if (filterText) {
        const q = filterText.toLowerCase()
        return (
          item.softwareName.toLowerCase().includes(q) ||
          item.pqcCapabilityDescription?.toLowerCase().includes(q) ||
          item.pqcSupport?.toLowerCase().includes(q) ||
          item.productBrief?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.license?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [
    stepFilter,
    industryFilter,
    effectiveLayer,
    flatCategoryFilter,
    filterText,
    vendorFilter,
    verificationFilter,
  ])

  // Unique categories for the flat-mode category dropdown (scoped to selected layer)
  const flatCategories = useMemo(() => {
    const sourceData =
      effectiveLayer !== 'All'
        ? softwareData.filter((item) => {
            const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
            return layers.includes(effectiveLayer)
          })
        : softwareData
    const cats = new Set<string>()
    sourceData.forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName)
    })
    return Array.from(cats).sort()
  }, [effectiveLayer])

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
      const order: Record<string, number> = {
        yes: 0,
        partial: 1,
        limited: 1,
        in: 2,
        planned: 2,
        no: 3,
      }
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

  // Vendor filter dropdown items (sorted alphabetically, showing product counts)
  const vendorFilterItems = useMemo(() => {
    const items = Array.from(vendorMap.values())
      .filter((vendor) => (vendor.productCount ?? 0) > 0)
      .sort((a, b) => a.vendorDisplayName.localeCompare(b.vendorDisplayName))
      .map((vendor) => ({
        id: vendor.vendorId,
        label: `${vendor.vendorDisplayName} (${vendor.productCount ?? 0})`,
      }))
    return items
  }, [])

  // Verification status filter dropdown items
  const verificationFilterItems = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of softwareData) {
      const status = item.verificationStatus || 'Unknown'
      counts.set(status, (counts.get(status) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        id: status,
        label: `${status} (${count})`,
      }))
  }, [])

  // Visible product count for flat modes
  // When a search is active, hidden items are surfaced (search bypasses hide filter), so count all matches
  const flatVisibleCount = useMemo(() => {
    const items: SoftwareItem[] =
      effectiveViewMode === 'cards' ? sortedFlatProducts : allFilteredProducts
    if (filterText) return items.length
    return hiddenSet.size > 0
      ? items.filter((item) => !hiddenSet.has(`${item.softwareName}::${item.categoryId}`)).length
      : items.length
  }, [effectiveViewMode, sortedFlatProducts, allFilteredProducts, hiddenSet, filterText])

  // Total filtered count across all layers (for stack mode)
  const stackFilteredCount = useMemo(() => {
    return Object.values(perLayerData).reduce((sum, items) => {
      if (!filterText && hiddenSet.size > 0) {
        return (
          sum +
          items.filter((item) => !hiddenSet.has(`${item.softwareName}::${item.categoryId}`)).length
        )
      }
      return sum + items.length
    }, 0)
  }, [perLayerData, hiddenSet, filterText])

  // Whether any filter is currently active
  const hasActiveFilter =
    !!filterText ||
    !!stepFilter ||
    !!industryFilter ||
    vendorFilter !== 'All' ||
    verificationFilter !== 'All' ||
    effectiveLayer !== 'All' ||
    flatCategoryFilter !== 'All' ||
    hiddenSet.size > 0

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
      syncFiltersToUrl({ step: step.id })
      setActiveSubCategory('All')
      logMigrateAction('View Related Software', step.title)
      // No scroll needed — stack is above the fold; user selects a layer to see step products
    },
    [setActiveSubCategory, syncFiltersToUrl]
  )

  if (!softwareData || softwareData.length === 0) {
    return <ErrorAlert message="Unable to Load Software Data: No reference data found." />
  }

  return (
    <div className={`space-y-8 ${compareKeys.length > 0 ? 'pb-20' : ''}`}>
      <PageHeader
        icon={ArrowRightLeft}
        pageId="migrate"
        title="PQC Migration Guide"
        description="A 7-phase migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance."
        dataSource={
          softwareMetadata
            ? `${softwareMetadata.filename} • Updated: ${softwareMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Migrate"
        shareTitle="PQC Migration Guide — 7-Phase Framework for Post-Quantum Readiness"
        shareText="A 7-phase migration framework aligned with NIST, NSA CNSA 2.0, CISA, and ETSI guidance. Explore software readiness and migration steps."
        onExport={handleExportCsv}
      />

      {/* WIP Disclaimer */}
      <div className="glass-panel border border-status-warning/30 bg-status-warning/5 px-4 py-3 rounded-lg text-sm text-secondary flex items-start gap-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning animate-pulse-glow shrink-0 mt-0.5">
          <Wrench size={12} className="animate-bounce-subtle" />
          WIP
        </span>
        <p>
          I am in the process of reviewing and validating the PQC product information. There are
          still many inaccuracies that need to be addressed. The community can help with this effort
          by submitting product update requests via the <em>Update PQC Info</em> link available in
          each product card.
        </p>
      </div>

      {/* Migration Workflow Hero — collapsible (desktop only) */}
      <div className="hidden md:block">
        <Button
          variant="ghost"
          onClick={() => setWorkflowCollapsed(!workflowCollapsed)}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-2"
          aria-expanded={!workflowCollapsed}
          aria-controls="migration-workflow-hero"
        >
          {workflowCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          {workflowCollapsed ? 'Show Migration Framework' : 'Hide Migration Framework'}
        </Button>
        {!workflowCollapsed && (
          <div id="migration-workflow-hero" className="animate-fade-in">
            <MigrationWorkflow onViewSoftware={handleViewSoftware} />
          </div>
        )}
      </div>

      {/* Mobile migration step selector — visible below md */}
      <div className="md:hidden">
        <FilterDropdown
          label="Migration Phase"
          items={MIGRATION_STEPS.map((s) => ({
            id: s.id,
            label: `${s.stepNumber}. ${s.shortTitle}`,
          }))}
          selectedId={stepFilter?.stepId ?? 'All'}
          onSelect={(id) => {
            if (id === 'All') {
              setStepFilter(null)
              syncFiltersToUrl({ step: null })
            } else {
              const step = MIGRATION_STEPS.find((s) => s.id === id)
              if (step) handleViewSoftware(step)
            }
          }}
          defaultLabel="All Phases"
          noContainer
        />
      </div>

      {/* Industry filter banner (from ?industry= deep link) */}
      {industryFilter && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
          <span>
            Showing products relevant to <strong>{industryFilter}</strong>
          </span>
          <Button
            variant="link"
            onClick={() => {
              setIndustryFilter(null)
              syncFiltersToUrl({ industry: null })
            }}
            className="ml-auto flex items-center gap-1"
            aria-label="Clear industry filter"
          >
            <X size={12} />
            Clear
          </Button>
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
          <Button
            variant="link"
            onClick={() => {
              setStepFilter(null)
              syncFiltersToUrl({ step: null })
            }}
            className="ml-auto flex items-center gap-1"
            aria-label="Clear step filter"
          >
            <X size={12} />
            Clear
          </Button>
        </div>
      )}

      {/* Filter control band */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-wrap items-center gap-2">
        {/* Layer dropdown — flat modes + always on mobile (mobile always shows cards) */}
        <div className={effectiveViewMode === 'stack' ? 'md:hidden' : ''}>
          <FilterDropdown
            items={layerFilterItems}
            selectedId={effectiveLayer === 'All' ? 'All' : effectiveLayer}
            onSelect={(id) => {
              setActiveLayer(id)
              setFlatCategoryFilter('All')
              syncFiltersToUrl({ layer: id })
              logMigrateAction('Filter Layer', id)
            }}
            defaultLabel="All Layers"
          />
        </div>

        {/* Category dropdown — flat modes + always on mobile, scoped to selected layer */}
        {flatCategories.length > 1 && (
          <div className={effectiveViewMode === 'stack' ? 'md:hidden' : ''}>
            <FilterDropdown
              items={categoryFilterItems}
              selectedId={flatCategoryFilter}
              onSelect={(id) => {
                setFlatCategoryFilter(id)
                syncFiltersToUrl({ cat: id })
                logMigrateAction('Filter Category', id)
              }}
              defaultLabel="All Categories"
            />
          </div>
        )}

        {/* Vendor dropdown — all modes */}
        {vendorFilterItems.length > 0 && (
          <div>
            <FilterDropdown
              items={vendorFilterItems}
              selectedId={vendorFilter}
              onSelect={(id) => {
                setVendorFilter(id)
                syncFiltersToUrl({ vendor: id })
                logMigrateAction('Filter Vendor', id)
              }}
              defaultLabel="All Vendors"
              searchable
            />
          </div>
        )}

        {/* Verification status dropdown */}
        <div>
          <FilterDropdown
            items={verificationFilterItems}
            selectedId={verificationFilter}
            onSelect={(id) => {
              setVerificationFilter(id)
              syncFiltersToUrl({ verification: id })
              logMigrateAction('Filter Verification', id)
            }}
            defaultLabel="All Verification"
          />
        </div>

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
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Sort — cards mode + always on mobile */}
        <div className={effectiveViewMode !== 'cards' ? 'md:hidden' : ''}>
          <MigrateSortControl
            value={sortBy}
            onChange={(s) => {
              setSortBy(s)
              syncFiltersToUrl({ sort: s })
            }}
          />
        </div>

        {/* Restore hidden — when any products are hidden */}
        {hiddenSet.size > 0 && (
          <Button
            variant="ghost"
            onClick={() => restoreAll()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label={`Restore ${hiddenSet.size} hidden product${hiddenSet.size !== 1 ? 's' : ''}`}
          >
            <EyeOff size={14} />
            {hiddenSet.size} hidden
          </Button>
        )}

        {/* View toggle — desktop only (mobile always shows cards) */}
        <div className="hidden md:block">
          <MigrateViewToggle
            mode={effectiveViewMode}
            onChange={(m) => {
              setViewMode(m)
              syncFiltersToUrl({ mode: m })
            }}
          />
        </div>
      </div>

      {/* Results count — always visible in all modes */}
      {(() => {
        const visibleCount = effectiveViewMode === 'stack' ? stackFilteredCount : flatVisibleCount
        const total = softwareData.length
        return (
          <p className="text-xs text-muted-foreground">
            {hasActiveFilter ? (
              <>
                Showing {visibleCount} of {total} product{total !== 1 ? 's' : ''}
                {effectiveLayer !== 'All' &&
                  ` in ${LAYERS.find((l) => l.id === effectiveLayer)?.label ?? effectiveLayer}`}
              </>
            ) : (
              <>
                {total} product{total !== 1 ? 's' : ''}
              </>
            )}
          </p>
        )
      })()}

      {/* Content area — mode-specific rendering */}
      <div className="py-4">
        {/* Mobile: always show card grid */}
        <div className="md:hidden">
          {activeInfrastructureLayer !== 'All' && (
            <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 text-xs bg-primary/10 border border-primary/20 rounded-md animate-fade-in">
              <span className="text-primary font-medium">
                Layer:{' '}
                {LAYERS.find((l) => l.id === activeInfrastructureLayer)?.label ??
                  activeInfrastructureLayer}
              </span>
              <button
                type="button"
                aria-label="Clear layer filter"
                onClick={() => {
                  setActiveLayer('All')
                  syncFiltersToUrl({ layer: 'All' })
                }}
                className="p-0.5 rounded hover:bg-primary/20 text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <SoftwareCardGrid
            items={sortedFlatProducts}
            hiddenProducts={filterText ? undefined : hiddenSet}
            onHideProduct={hideProduct}
            selectedProducts={myProductsSet}
            onToggleProduct={toggleMyProduct}
            compareProducts={compareSet}
            onToggleCompare={handleToggleCompare}
            maxCompareReached={maxCompareReached}
          />
        </div>

        {/* Desktop: mode-specific rendering */}
        <div className="hidden md:block">
          {effectiveViewMode === 'stack' && (
            <InfrastructureStack
              activeLayer={activeInfrastructureLayer}
              onSelectLayer={(layer) => {
                setActiveLayer(layer)
                syncFiltersToUrl({ layer })
              }}
              subCategories={activeInfrastructureLayer !== 'All' ? categories : []}
              activeSubCategory={activeTab}
              onSelectSubCategory={(cat) => {
                setActiveSubCategory(cat)
                syncFiltersToUrl({ subcat: cat })
                logMigrateAction('Filter Category', cat)
              }}
              layerProductCounts={layerProductCounts}
              layerHiddenCounts={layerHiddenCounts}
              layerProductKeys={layerProductKeys}
              onRestoreLayer={(keys) => restoreLayerProducts(keys)}
              layerSelectedCounts={layerSelectedCounts}
              hideEmptyLayers={vendorFilter !== 'All'}
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
                      compareProducts={compareSet}
                      onToggleCompare={handleToggleCompare}
                      maxCompareReached={maxCompareReached}
                      expandedIds={tableExpandedIds}
                      onToggleExpand={handleToggleTableExpand}
                    />
                  ) : (
                    <EmptyState
                      icon={<PackageSearch size={32} />}
                      title="No products match the current filters."
                    />
                  )
                ) : undefined
              }
            />
          )}

          {effectiveViewMode === 'cards' && (
            <SoftwareCardGrid
              items={sortedFlatProducts}
              hiddenProducts={filterText ? undefined : hiddenSet}
              onHideProduct={hideProduct}
              selectedProducts={myProductsSet}
              onToggleProduct={toggleMyProduct}
              compareProducts={compareSet}
              onToggleCompare={handleToggleCompare}
              maxCompareReached={maxCompareReached}
            />
          )}

          {effectiveViewMode === 'table' &&
            (allFilteredProducts.length > 0 ? (
              <SoftwareTable
                key={`flat-table-${effectiveLayer}-${flatCategoryFilter}-${stepFilter?.stepId ?? 'none'}`}
                data={allFilteredProducts}
                defaultSort={{ key: 'softwareName', direction: 'asc' }}
                hiddenProducts={filterText ? undefined : hiddenSet}
                onHideProduct={hideProduct}
                selectedProducts={myProductsSet}
                onToggleProduct={toggleMyProduct}
                compareProducts={compareSet}
                expandedIds={tableExpandedIds}
                onToggleExpand={handleToggleTableExpand}
                onToggleCompare={handleToggleCompare}
                maxCompareReached={maxCompareReached}
              />
            ) : (
              <EmptyState
                icon={<PackageSearch size={32} />}
                title="No products match the current filters."
              />
            ))}
        </div>

        {/* Comparison panel — shown inline when triggered from sticky bar */}
        {showComparisonPanel && comparisonProducts.length >= 2 && (
          <div ref={comparisonPanelRef} className="mt-4 pb-20">
            <ComparisonPanel
              products={comparisonProducts}
              onClose={() => setShowComparisonPanel(false)}
            />
          </div>
        )}
      </div>

      {/* Sticky compare bar — fixed bottom, visible whenever ≥1 product is queued */}
      <StickyCompareBar
        compareKeys={compareKeys}
        onRemove={handleToggleCompare}
        onClearAll={() => {
          setCompareKeys([])
          setShowComparisonPanel(false)
        }}
        onCompare={() => {
          setShowComparisonPanel(true)
          requestAnimationFrame(() =>
            comparisonPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          )
        }}
        showBrowseHint={isStackAllView}
        onBrowseAll={() => {
          setViewMode('table')
          syncFiltersToUrl({ mode: 'table' })
        }}
      />
    </div>
  )
}
