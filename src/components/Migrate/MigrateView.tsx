// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { softwareData, softwareMetadata, vendorMap } from '../../data/migrateData'
import { useSearchParams } from 'react-router-dom'

import { SoftwareTable } from './SoftwareTable'
import { SoftwareCardGrid } from './SoftwareCardGrid'
import { MigrationWorkflow } from './MigrationWorkflow'
import { InfrastructureStack, LAYERS, CISA_LAYERS } from './InfrastructureStack'
import { MobileFilterDrawer } from './MobileFilterDrawer'
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
  Scale,
  BookmarkCheck,
} from 'lucide-react'
import debounce from 'lodash/debounce'
import { logMigrateAction } from '../../utils/analytics'
import { MIGRATION_STEPS } from '../../data/migrationWorkflowData'
import type { MigrationStep, SoftwareItem, PqcStats } from '../../types/MigrateTypes'
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
import { useIsEmbedded } from '../../embed/EmbedProvider'

const LICENSE_FILTER_ITEMS = [
  { id: 'Open Source', label: 'Open Source' },
  { id: 'Commercial', label: 'Commercial' },
]

type WipFilter = 'hidden' | 'include' | 'only'

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
  const isEmbedded = useIsEmbedded()
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
    restoreLayerProducts,
    restoreAll,
    activeLayer,
    activeSubCategory,
    setActiveLayer,
    setActiveSubCategory,
    myProducts,
    toggleMyProduct,
    showOnlyMyProducts,
    setShowOnlyMyProducts,
    viewMode,
    setViewMode,
    workflowCollapsed,
    setWorkflowCollapsed,
  } = useMigrateSelectionStore()

  // Shared expanded-row state — survives layer/filter switches; init from ?product= deep link
  const [tableExpandedIds, setTableExpandedIds] = useState<Set<string>>(() => {
    const p = searchParams.get('product')
    return p ? new Set([p]) : new Set()
  })
  const handleToggleTableExpand = useCallback((id: string) => {
    setTableExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Sync a single expanded product row → ?product= URL param
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tableExpandedIds.size === 1) {
          const key = [...tableExpandedIds][0]
          next.set('product', key)
          // Removed forcing mode to table, so Stack View inline expansions work.
        } else {
          next.delete('product')
        }
        return next
      },
      { replace: true }
    )
  }, [tableExpandedIds, setSearchParams])

  // Scroll to the initially-deep-linked product row after first render
  const initialProductKeyRef = useRef(searchParams.get('product'))

  const [hasDismissedCompareOnboarding, setHasDismissedCompareOnboarding] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem('dimissed_compare_onboarding') === 'true'
  )
  useEffect(() => {
    const key = initialProductKeyRef.current
    if (!key) return
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-product-key="${key}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
    return () => clearTimeout(timer)
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
          return softwareData.find((s) => s.productId === key)
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
  const [licenseFilter, setLicenseFilter] = useState(
    () => searchParams.get('licenseFilter') ?? 'All'
  )
  const [wipFilter, setWipFilter] = useState<WipFilter>(
    // In embed mode WIP items are always hidden — accuracy over completeness
    () => (isEmbedded ? 'hidden' : ((searchParams.get('wip') as WipFilter | null) ?? 'hidden'))
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
    const mode = searchParams.get('mode') as 'stack' | 'cisaStack' | 'cards' | 'table' | null
    if (mode !== null) setViewMode(mode)
    const product = searchParams.get('product')
    if (product !== null) {
      setTableExpandedIds((prev) =>
        prev.size === 1 && prev.has(product) ? prev : new Set([product])
      )
      // Removed: if (mode === null) setViewMode('table')
    }
    const subcat = searchParams.get('subcat')
    if (subcat !== null) setActiveSubCategory(subcat)

    const license = searchParams.get('licenseFilter')
    if (license !== null) setLicenseFilter((prev) => (prev !== license ? license : prev))
    const wip = searchParams.get('wip') as WipFilter | null
    if (wip !== null) setWipFilter((prev) => (prev !== wip ? wip : prev))
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
      licenseFilter?: string
      wip?: WipFilter
      sort?: MigrateSortOption
      mode?: 'stack' | 'cisaStack' | 'cards' | 'table'
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
          const license =
            overrides.licenseFilter !== undefined ? overrides.licenseFilter : licenseFilter
          const wip = overrides.wip !== undefined ? overrides.wip : wipFilter
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

          if (license !== 'All') next.set('licenseFilter', license)
          else next.delete('licenseFilter')

          if (wip !== 'hidden') next.set('wip', wip)
          else next.delete('wip')

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
      licenseFilter,
      wipFilter,
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
  const urlModeParam = searchParams.get('mode') as 'stack' | 'cisaStack' | 'cards' | 'table' | null
  const effectiveViewMode = urlModeParam ?? viewMode
  const isStackMode = effectiveViewMode === 'stack' || effectiveViewMode === 'cisaStack'
  const activePartitions = useMemo(
    () => (effectiveViewMode === 'cisaStack' ? CISA_LAYERS : LAYERS),
    [effectiveViewMode]
  )

  const effectiveLayer =
    urlLayerParam && activePartitions.some((l) => l.id === urlLayerParam)
      ? urlLayerParam
      : activeLayer
  const effectiveSubCategory = urlSubcatParam ?? activeSubCategory

  const activeInfrastructureLayer = effectiveLayer as string
  const activeTab = effectiveSubCategory
  const hiddenSet = useMemo(() => new Set(hiddenProducts), [hiddenProducts])
  const myProductsSet = useMemo(() => new Set(myProducts), [myProducts])
  const isStackAllView = isStackMode && activeInfrastructureLayer === 'All'

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
    return activePartitions.reduce(
      (acc, layer) => {
        acc[layer.id] = softwareData.filter((item) => {
          // Step filter
          if (stepFilter) {
            const phases = item.migrationPhases?.split(',').map((p) => p.trim()) ?? []
            if (!phases.includes(stepFilter.stepId)) return false
          }
          // Layer filter
          if (effectiveViewMode === 'cisaStack') {
            if (item.cisaCategory !== layer.id) return false
          } else {
            const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
            if (!itemLayers.includes(layer.id)) return false
          }
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
          // License filter
          if (
            licenseFilter !== 'All' &&
            !item.licenseType?.toLowerCase().includes(licenseFilter.toLowerCase())
          )
            return false
          // WIP filter
          if (wipFilter === 'hidden' && item.wip === true) return false
          if (wipFilter === 'only' && item.wip !== true) return false
          // My Products filter
          if (showOnlyMyProducts && !myProductsSet.has(item.productId)) return false
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
  }, [
    stepFilter,
    filterText,
    industryFilter,
    vendorFilter,
    verificationFilter,
    licenseFilter,
    wipFilter,
    effectiveViewMode,
    activePartitions,
    showOnlyMyProducts,
    myProductsSet,
  ])

  // Layer product counts (for badges on collapsed layer rows)
  const layerProductCounts = useMemo(
    () =>
      activePartitions.reduce(
        (acc, layer) => {
          acc[layer.id as string] = perLayerData[layer.id]?.length ?? 0
          return acc
        },
        {} as Partial<Record<string, number>>
      ),
    [perLayerData, activePartitions]
  )

  // Unfiltered product counts per layer (used as denominator in stack headers)
  const layerRawCounts = useMemo(
    () =>
      activePartitions.reduce(
        (acc, layer) => {
          acc[layer.id as string] = softwareData.filter((item) => {
            if (effectiveViewMode === 'cisaStack') return item.cisaCategory === layer.id
            return item.infrastructureLayer
              .split(',')
              .map((l) => l.trim())
              .includes(layer.id)
          }).length
          return acc
        },
        {} as Partial<Record<string, number>>
      ),
    [activePartitions, effectiveViewMode]
  )

  // Layer product keys (for restore-layer action)
  const layerProductKeys = useMemo(
    () =>
      activePartitions.reduce(
        (acc, layer) => {
          acc[layer.id as string] = (perLayerData[layer.id] ?? []).map((item) => item.productId)
          return acc
        },
        {} as Partial<Record<string, string[]>>
      ),
    [perLayerData, activePartitions]
  )

  // Layer selected counts (for "My Products" badges)
  const layerSelectedCounts = useMemo(
    () =>
      activePartitions.reduce(
        (acc, layer) => {
          const keys = new Set(layerProductKeys[layer.id as string] ?? [])
          acc[layer.id as string] = myProducts.filter((k) => keys.has(k)).length
          return acc
        },
        {} as Partial<Record<string, number>>
      ),
    [layerProductKeys, myProducts, activePartitions]
  )

  // Layer hidden counts (for restore badges)
  const layerHiddenCounts = useMemo(
    () =>
      activePartitions.reduce(
        (acc, layer) => {
          const keys = new Set(layerProductKeys[layer.id as string] ?? [])
          acc[layer.id as string] = hiddenProducts.filter((k) => keys.has(k)).length
          return acc
        },
        {} as Partial<Record<string, number>>
      ),
    [layerProductKeys, hiddenProducts, activePartitions]
  )

  // Helper to categorize PQC capability
  const getPqcStats = useCallback(
    (items: SoftwareItem[]): PqcStats => {
      const stats: PqcStats = { established: 0, inProgress: 0, noCapabilities: 0, total: 0 }

      const visibleItems = filterText
        ? items
        : items.filter((item) => !hiddenSet.has(item.productId))

      stats.total = visibleItems.length

      visibleItems.forEach((item) => {
        const support = (item.pqcSupport || '').toLowerCase()
        if (support.startsWith('yes')) {
          stats.established++
        } else if (
          support.startsWith('partial') ||
          support.startsWith('limited') ||
          support.startsWith('planned') ||
          support.startsWith('in')
        ) {
          stats.inProgress++
        } else {
          stats.noCapabilities++
        }
      })

      return stats
    },
    [filterText, hiddenSet]
  )

  // PQC stats per layer
  const layerPqcStats = useMemo(() => {
    return activePartitions.reduce(
      (acc, layer) => {
        acc[layer.id as string] = getPqcStats(perLayerData[layer.id] ?? [])
        return acc
      },
      {} as Record<string, PqcStats>
    )
  }, [perLayerData, getPqcStats, activePartitions])

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
        if (effectiveViewMode === 'cisaStack') {
          if (item.cisaCategory !== effectiveLayer) return false
        } else {
          const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
          if (!itemLayers.includes(effectiveLayer)) return false
        }
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
      // License filter
      if (
        licenseFilter !== 'All' &&
        !item.licenseType?.toLowerCase().includes(licenseFilter.toLowerCase())
      )
        return false
      // WIP filter
      if (wipFilter === 'hidden' && item.wip === true) return false
      if (wipFilter === 'only' && item.wip !== true) return false
      // My Products filter
      if (showOnlyMyProducts && !myProductsSet.has(item.productId)) return false
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
    licenseFilter,
    wipFilter,
    showOnlyMyProducts,
    myProductsSet,
  ])

  // PQC stats for all filtered products
  const totalPqcStats = useMemo(() => {
    return getPqcStats(allFilteredProducts)
  }, [allFilteredProducts, getPqcStats])

  // Unique categories for the flat-mode category dropdown (scoped to selected layer)
  const flatCategories = useMemo(() => {
    const sourceData =
      effectiveLayer !== 'All'
        ? softwareData.filter((item) => {
            if (effectiveViewMode === 'cisaStack') {
              return item.cisaCategory === effectiveLayer
            }
            const layers = item.infrastructureLayer.split(',').map((l) => l.trim())
            return layers.includes(effectiveLayer)
          })
        : softwareData
    const cats = new Set<string>()
    sourceData.forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName)
    })
    return Array.from(cats).sort()
  }, [effectiveLayer, effectiveViewMode])

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
      activePartitions.map((layer) => {
        const Icon = layer.icon
        return {
          id: layer.id,
          label: layer.label,
          icon: <Icon size={16} className={layer.iconColor} />,
        }
      }),
    [activePartitions]
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
      ? items.filter((item) => !hiddenSet.has(item.productId)).length
      : items.length
  }, [effectiveViewMode, sortedFlatProducts, allFilteredProducts, hiddenSet, filterText])

  // Total filtered count across all layers (for stack mode)
  const stackFilteredCount = useMemo(() => {
    return Object.values(perLayerData).reduce((sum, items) => {
      if (!filterText && hiddenSet.size > 0) {
        return sum + items.filter((item) => !hiddenSet.has(item.productId)).length
      }
      return sum + items.length
    }, 0)
  }, [perLayerData, hiddenSet, filterText])

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
        <p className="hidden md:block">
          I am in the process of reviewing and validating the PQC product information. There are
          still many inaccuracies that need to be addressed. The community can help with this effort
          by submitting product update requests via the <em>Update PQC Info</em> link available in
          each product card.
        </p>
        <p className="md:hidden text-xs">
          Data under review. Please help by submitting product update requests via the{' '}
          <em>Update PQC Info</em> link in each product card.
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

      {/* Removed standalone mobile migration step selector to save vertical space; it now lives inside the Filter Drawer */}

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

      {/* Sticky filter container */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur backdrop-saturate-150 border-b border-border/50 pb-3 pt-3 -mx-4 px-4 md:mx-0 md:px-0 mb-6 shadow-sm transition-all duration-300">
        <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col md:flex-row gap-2">
          {/* Mobile Layout: Search + Drawer Row */}
          <div className="flex flex-col md:hidden items-stretch gap-3 w-full">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search software..."
                value={inputValue}
                onChange={handleSearchChange}
                className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="w-full">
              <MobileFilterDrawer
                activeFilterCount={
                  (stepFilter ? 1 : 0) +
                  (effectiveLayer !== 'All' ? 1 : 0) +
                  (flatCategoryFilter !== 'All' ? 1 : 0) +
                  (vendorFilter !== 'All' ? 1 : 0) +
                  (verificationFilter !== 'All' ? 1 : 0) +
                  (licenseFilter !== 'All' ? 1 : 0) +
                  (wipFilter !== 'hidden' ? 1 : 0) +
                  (hiddenSet.size > 0 ? 1 : 0) +
                  (sortBy !== 'pqcMigrationPriority' ? 1 : 0)
                }
                onClearAll={() => {
                  setStepFilter(null)
                  setActiveLayer('All')
                  setFlatCategoryFilter('All')
                  setVendorFilter('All')
                  setVerificationFilter('All')
                  setLicenseFilter('All')
                  setWipFilter('hidden')
                  setSortBy('pqcMigrationPriority')
                  if (hiddenSet.size > 0) restoreAll()
                  syncFiltersToUrl({
                    step: null,
                    layer: 'All',
                    cat: 'All',
                    vendor: 'All',
                    verification: 'All',
                    licenseFilter: 'All',
                    wip: 'hidden',
                    sort: 'pqcMigrationPriority',
                  })
                }}
                filterContent={
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Migration Phase
                      </h3>
                      <FilterDropdown
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
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Architecture
                      </h3>
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
                      {flatCategories.length > 1 && (
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
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Properties
                      </h3>
                      {vendorFilterItems.length > 0 && (
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
                      )}
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
                      <FilterDropdown
                        items={LICENSE_FILTER_ITEMS}
                        selectedId={licenseFilter}
                        onSelect={(id) => {
                          setLicenseFilter(id)
                          syncFiltersToUrl({ licenseFilter: id })
                          logMigrateAction('Filter License', id)
                        }}
                        defaultLabel="All Licenses"
                      />
                      {!isEmbedded && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const next: WipFilter =
                              wipFilter === 'hidden'
                                ? 'include'
                                : wipFilter === 'include'
                                  ? 'only'
                                  : 'hidden'
                            setWipFilter(next)
                            syncFiltersToUrl({ wip: next })
                            logMigrateAction('Filter WIP', next)
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            wipFilter === 'only'
                              ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                              : wipFilter === 'hidden'
                                ? 'bg-muted text-muted-foreground border-border line-through'
                                : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
                          }`}
                        >
                          <Wrench size={12} aria-hidden="true" />
                          {wipFilter === 'hidden' ? 'WIP hidden' : 'WIP'}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Sorting
                      </h3>
                      <MigrateSortControl
                        value={sortBy}
                        onChange={(s) => {
                          setSortBy(s)
                          syncFiltersToUrl({ sort: s })
                        }}
                      />
                    </div>

                    {(myProducts.length > 0 || showOnlyMyProducts) && (
                      <div className="space-y-3 pt-6 border-t border-border">
                        <Button
                          variant="ghost"
                          onClick={() => setShowOnlyMyProducts(!showOnlyMyProducts)}
                          className={`w-full inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors font-medium ${
                            showOnlyMyProducts
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                          }`}
                          aria-pressed={showOnlyMyProducts}
                        >
                          <BookmarkCheck size={14} />
                          My Products ({myProducts.length})
                        </Button>
                      </div>
                    )}

                    {hiddenSet.size > 0 && (
                      <div className="space-y-3 pt-6 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => restoreAll()}
                          className="w-full text-status-warning border-status-warning/50 hover:bg-status-warning/10"
                        >
                          <EyeOff size={16} className="mr-2" />
                          Restore {hiddenSet.size} hidden products
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          </div>

          {/* Desktop Layout: Inline Filter Band */}
          <div className="hidden md:flex flex-wrap items-center gap-2 flex-1 relative z-10 w-full overflow-visible">
            {/* Layer dropdown — flat modes */}
            <div className={isStackMode ? 'hidden' : ''}>
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

            {/* Category dropdown — flat modes */}
            {flatCategories.length > 1 && (
              <div className={isStackMode ? 'hidden' : ''}>
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

            {/* Vendor dropdown */}
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

            {/* License dropdown */}
            <div>
              <FilterDropdown
                items={LICENSE_FILTER_ITEMS}
                selectedId={licenseFilter}
                onSelect={(id) => {
                  setLicenseFilter(id)
                  syncFiltersToUrl({ licenseFilter: id })
                  logMigrateAction('Filter License', id)
                }}
                defaultLabel="All Licenses"
              />
            </div>

            {/* WIP filter — same cycling pill as Playground */}
            <Button
              variant="ghost"
              onClick={() => {
                const next: WipFilter =
                  wipFilter === 'hidden' ? 'include' : wipFilter === 'include' ? 'only' : 'hidden'
                setWipFilter(next)
                syncFiltersToUrl({ wip: next })
                logMigrateAction('Filter WIP', next)
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                wipFilter === 'only'
                  ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                  : wipFilter === 'hidden'
                    ? 'bg-muted text-muted-foreground border-border line-through'
                    : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
              }`}
              title={
                wipFilter === 'include'
                  ? 'Click to show only WIP products'
                  : wipFilter === 'only'
                    ? 'Click to hide WIP products'
                    : 'Click to show all products'
              }
            >
              <Wrench size={12} aria-hidden="true" />
              {wipFilter === 'hidden' ? 'WIP hidden' : 'WIP'}
            </Button>

            {/* Search */}
            <div className="relative flex-1 min-w-[150px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                id="software-search-desktop"
                placeholder="Search..."
                value={inputValue}
                onChange={handleSearchChange}
                className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[40px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Sort — cards mode */}
            <div className={effectiveViewMode !== 'cards' ? 'hidden' : ''}>
              <MigrateSortControl
                value={sortBy}
                onChange={(s) => {
                  setSortBy(s)
                  syncFiltersToUrl({ sort: s })
                }}
              />
            </div>

            {/* Restore hidden */}
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

            {/* View toggle + My filter — grouped together */}
            <div className="flex items-center gap-2">
              <MigrateViewToggle
                mode={effectiveViewMode}
                onChange={(m) => {
                  setViewMode(m)
                  syncFiltersToUrl({ mode: m })
                }}
              />
              {(myProducts.length > 0 || showOnlyMyProducts) && (
                <Button
                  variant="ghost"
                  onClick={() => setShowOnlyMyProducts(!showOnlyMyProducts)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap ${
                    showOnlyMyProducts
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                  }`}
                  aria-pressed={showOnlyMyProducts}
                >
                  <BookmarkCheck size={12} />
                  My ({myProducts.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results count — always visible in all modes */}
      <div className="flex flex-col sm:flex-row items-baseline justify-between mb-2">
        {(() => {
          const layerLabel =
            effectiveLayer !== 'All'
              ? (activePartitions.find((l) => l.id === effectiveLayer)?.label ?? effectiveLayer)
              : null

          if (isStackMode && effectiveLayer !== 'All') {
            // Specific layer open: show filtered / raw-layer-total
            const filteredInLayer = perLayerData[effectiveLayer]?.length ?? 0
            const rawInLayer = softwareData.filter((item) => {
              if (effectiveViewMode === 'cisaStack') return item.cisaCategory === effectiveLayer
              return item.infrastructureLayer
                .split(',')
                .map((l) => l.trim())
                .includes(effectiveLayer)
            }).length
            const hasLayerFilter = filteredInLayer < rawInLayer
            return (
              <p className="text-xs text-muted-foreground">
                {hasLayerFilter ? (
                  <>
                    Showing {filteredInLayer} of {rawInLayer} products in {layerLabel}
                  </>
                ) : (
                  <>
                    {rawInLayer} product{rawInLayer !== 1 ? 's' : ''} in {layerLabel}
                  </>
                )}
              </p>
            )
          }

          const visibleCount = isStackMode ? stackFilteredCount : flatVisibleCount
          return (
            <p className="text-xs text-muted-foreground">
              {visibleCount} product{visibleCount !== 1 ? 's' : ''}
              {layerLabel && ` in ${layerLabel}`}
            </p>
          )
        })()}

        {/* Compare Onboarding Tooltip banner */}
        {!hasDismissedCompareOnboarding && (
          <div className="mt-2 sm:mt-0 flex items-center gap-2 bg-secondary/10 border border-secondary/20 text-secondary text-xs px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-bottom-2">
            <Scale size={14} className="animate-pulse" />
            <span>Select up to 4 products to compare capabilities.</span>
            <Button
              variant="ghost"
              onClick={() => {
                setHasDismissedCompareOnboarding(true)
                localStorage.setItem('dimissed_compare_onboarding', 'true')
              }}
              className="ml-2 hover:bg-secondary/20 rounded-full p-0.5"
              aria-label="Dismiss tip"
            >
              <X size={12} />
            </Button>
          </div>
        )}
      </div>

      {/* Content area — mode-specific rendering */}
      <div className="py-4">
        {/* Stack Mode: Accordion on Mobile, Expanded on Desktop */}
        {isStackMode && (
          <div className="block">
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
              layerRawCounts={layerRawCounts}
              layerHiddenCounts={layerHiddenCounts}
              layerProductKeys={layerProductKeys}
              onRestoreLayer={(keys) => restoreLayerProducts(keys)}
              layerSelectedCounts={layerSelectedCounts}
              hideEmptyLayers={vendorFilter !== 'All' || showOnlyMyProducts}
              layerPqcStats={layerPqcStats}
              totalPqcStats={totalPqcStats}
              partitions={activePartitions}
              expandedContent={
                activeInfrastructureLayer !== 'All' ? (
                  activeLayerTableData.length > 0 ? (
                    <>
                      <div className="hidden md:block">
                        <SoftwareTable
                          key={`${activeInfrastructureLayer}-${activeTab}-${stepFilter?.stepId ?? 'none'}`}
                          data={activeLayerTableData}
                          defaultSort={{ key: 'softwareName', direction: 'asc' }}
                          hiddenProducts={hiddenSet}
                          selectedProducts={myProductsSet}
                          onToggleProduct={toggleMyProduct}
                          compareProducts={compareSet}
                          onToggleCompare={handleToggleCompare}
                          maxCompareReached={maxCompareReached}
                          expandedIds={tableExpandedIds}
                          onToggleExpand={handleToggleTableExpand}
                        />
                      </div>
                      <div className="block md:hidden">
                        <SoftwareCardGrid
                          items={activeLayerTableData}
                          hiddenProducts={hiddenSet}
                          selectedProducts={myProductsSet}
                          onToggleProduct={toggleMyProduct}
                          compareProducts={compareSet}
                          onToggleCompare={handleToggleCompare}
                          maxCompareReached={maxCompareReached}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="block">
                      <EmptyState
                        icon={<PackageSearch size={32} />}
                        title="No products match the current filters."
                      />
                    </div>
                  )
                ) : undefined
              }
            />
          </div>
        )}

        {/* Cards Mode */}
        {effectiveViewMode === 'cards' && (
          <div className="animate-in fade-in block">
            {activeInfrastructureLayer !== 'All' && (
              <div className="flex md:hidden items-center justify-between gap-2 mb-3 px-3 py-2 text-xs bg-primary/10 border border-primary/20 rounded-md animate-fade-in">
                <span className="text-primary font-medium">
                  Layer:{' '}
                  {activePartitions.find((l) => l.id === activeInfrastructureLayer)?.label ??
                    activeInfrastructureLayer}
                </span>
                <Button
                  variant="ghost"
                  type="button"
                  aria-label="Clear layer filter"
                  onClick={() => {
                    setActiveLayer('All')
                    syncFiltersToUrl({ layer: 'All' })
                  }}
                  className="p-0.5 rounded hover:bg-primary/20 text-primary transition-colors"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
            <SoftwareCardGrid
              items={sortedFlatProducts}
              hiddenProducts={filterText ? undefined : hiddenSet}
              selectedProducts={myProductsSet}
              onToggleProduct={toggleMyProduct}
              compareProducts={compareSet}
              onToggleCompare={handleToggleCompare}
              maxCompareReached={maxCompareReached}
            />
          </div>
        )}

        {/* Table Mode */}
        {effectiveViewMode === 'table' &&
          (allFilteredProducts.length > 0 ? (
            <>
              <div className="hidden md:block">
                <SoftwareTable
                  key={`flat-table-${effectiveLayer}-${flatCategoryFilter}-${stepFilter?.stepId ?? 'none'}`}
                  data={allFilteredProducts}
                  defaultSort={{ key: 'softwareName', direction: 'asc' }}
                  hiddenProducts={filterText ? undefined : hiddenSet}
                  selectedProducts={myProductsSet}
                  onToggleProduct={toggleMyProduct}
                  compareProducts={compareSet}
                  expandedIds={tableExpandedIds}
                  onToggleExpand={handleToggleTableExpand}
                  onToggleCompare={handleToggleCompare}
                  maxCompareReached={maxCompareReached}
                />
              </div>
              <div className="block md:hidden">
                <SoftwareCardGrid
                  items={allFilteredProducts}
                  hiddenProducts={filterText ? undefined : hiddenSet}
                  selectedProducts={myProductsSet}
                  onToggleProduct={toggleMyProduct}
                  compareProducts={compareSet}
                  onToggleCompare={handleToggleCompare}
                  maxCompareReached={maxCompareReached}
                />
              </div>
            </>
          ) : (
            <div className="block">
              <EmptyState
                icon={<PackageSearch size={32} />}
                title="No products match the current filters."
              />
            </div>
          ))}

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
