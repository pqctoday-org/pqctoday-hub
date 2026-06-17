// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  loadPQCAlgorithmsData,
  loadedFileMetadata,
  type AlgorithmDetail,
  getFunctionGroup,
  isClassical,
} from '../../data/pqcAlgorithmsData'
import {
  loadAlgorithmsData,
  loadedTransitionMetadata,
  type AlgorithmTransition,
  getCryptoFamilyFromPQCName,
  getTransitionFunctionGroup,
} from '../../data/algorithmsData'
import { passesCnsa20Filter } from './cnsa20'
import { generateCsv, downloadCsv, csvFilename } from '../../utils/csvExport'
import { ALGORITHM_CSV_COLUMNS } from '../../utils/csvExportConfigs'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { getAlgorithmDefaults, type AlgorithmTabId } from '../../data/personaConfig'

export const MAX_COMPARE = 6 // allows up to 3 classical+PQC pairs from the transition tab

/**
 * Map a transition row's (classical, keySize) fields to the matching AlgorithmDetail name.
 * Returns null when no match exists in the loaded algorithm data.
 */
function resolveClassicalAlgoName(
  classical: string,
  keySize: string | undefined,
  algos: AlgorithmDetail[]
): string | null {
  const bits = keySize?.match(/^(\d+)/)?.[1]
  if (classical === 'RSA' && bits) return algos.find((a) => a.name === `RSA-${bits}`)?.name ?? null
  const ecdhMatch = classical.match(/^ECDH\s*\(([^)]+)\)$/)
  if (ecdhMatch) return algos.find((a) => a.name === `ECDH ${ecdhMatch[1]}`)?.name ?? null
  const ecdsaMatch = classical.match(/^ECDSA\s*\(([^)]+)\)$/)
  if (ecdsaMatch) return algos.find((a) => a.name === `ECDSA ${ecdsaMatch[1]}`)?.name ?? null
  return algos.find((a) => a.name === classical)?.name ?? null
}

/** Determine baseline algorithm name based on the function type of compared algorithms */
function getBaselineName(compareType: 'KEM' | 'Signature' | null): string | null {
  if (compareType === 'KEM') return 'ECDH P-256'
  if (compareType === 'Signature') return 'RSA-2048'
  return null
}

/**
 * Shared "explorer" state for the algorithms page. Owns the URL-synced filter,
 * comparison, tab and data-load state so the standalone /algorithms page and any
 * embedded host can drive the same behaviour. Page chrome (persona reads, hints,
 * the info modal) stays in the consuming component.
 */
export function useAlgorithmExplorer(
  personaDefaults: ReturnType<typeof getAlgorithmDefaults>,
  opts: { urlSync?: boolean; initialParams?: string } = {}
) {
  const { urlSync = true, initialParams = '' } = opts
  // Standalone /algorithms page: urlSync=true → drive the real page URL exactly
  // as before. Embedded in the sim: urlSync=false → filter/compare state lives in
  // LOCAL params so it never corrupts /simulation's URL and needs no nested
  // <Router> (which React forbids). `useSearchParams` is always called (hook
  // rules); its result is simply ignored when embedded.
  const [realParams, realSetParams] = useSearchParams()
  const [localParams, setLocalParams] = useState(() => new URLSearchParams(initialParams))
  const searchParams = urlSync ? realParams : localParams
  const setSearchParams: typeof realSetParams = urlSync
    ? realSetParams
    : (nextInit) =>
        setLocalParams((prev) => {
          const next = new URLSearchParams(
            typeof nextInit === 'function'
              ? (nextInit(prev) as URLSearchParams)
              : (nextInit as URLSearchParams)
          )
          // Keep the same object when unchanged so the searchParams-keyed effects
          // don't re-fire forever (matches real setSearchParams' no-op).
          return next.toString() === prev.toString() ? prev : next
        })
  const comparisonPanelRef = useRef<HTMLDivElement>(null)

  // --- Active tab ---
  const [activeTab, setActiveTab] = useState<AlgorithmTabId>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed' || tab === 'support') return tab
    if (searchParams.get('highlight')) return 'detailed'
    return personaDefaults.tab
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed' || tab === 'support') {
      setActiveTab((prev) => (prev !== tab ? tab : prev))
    }
  }, [searchParams])

  // Reset all filters when arriving from command palette search so the highlighted
  // algorithm is always visible regardless of previously active filter state
  useEffect(() => {
    if (searchParams.get('from_search') !== '1') return
    setFilterCryptoFamily('All')
    setFilterFunction('All')
    setFilterSecurityLevel('All')
    setFilterRegion('All')
    setFilterStatus('All')
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('from_search')
        return next
      },
      { replace: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // --- Data loading ---
  const [metadata, setMetadata] = useState<{ filename: string; date: Date | null } | null>(null)
  const [transitionMetadata, setTransitionMetadata] = useState<{
    filename: string
    date: Date | null
  } | null>(null)
  const [algorithmData, setAlgorithmData] = useState<AlgorithmDetail[]>([])
  const [transitionData, setTransitionData] = useState<AlgorithmTransition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadPQCAlgorithmsData().then((data) => {
        setMetadata(loadedFileMetadata)
        setAlgorithmData(data)
      }),
      loadAlgorithmsData().then((data) => {
        setTransitionMetadata(loadedTransitionMetadata)
        setTransitionData(data)
      }),
    ]).finally(() => {
      setIsLoading(false)
    })
  }, [])

  // --- Filter state (synced to URL). URL params win; otherwise the persona's
  //     filter preset applies on first paint. ---
  const [filterCryptoFamily, setFilterCryptoFamily] = useState(
    () => searchParams.get('family') || personaDefaults.filters.family || 'All'
  )
  const [filterFunction, setFilterFunction] = useState(
    () => searchParams.get('fn') || personaDefaults.filters.fn || 'All'
  )
  const [filterSecurityLevel, setFilterSecurityLevel] = useState(
    () => searchParams.get('level') || personaDefaults.filters.level || 'All'
  )
  const [filterRegion, setFilterRegion] = useState(
    () => searchParams.get('region') || personaDefaults.filters.region || 'All'
  )
  const [filterStatus, setFilterStatus] = useState(
    () => searchParams.get('status') || personaDefaults.filters.status || 'All'
  )
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')

  // CNSA 2.0 lens — additive. When off (default) the page behaves exactly as
  // before; when on, a lens panel renders and the detailed/transition lists
  // narrow to the CNSA 2.0 suite. Synced to the URL via ?cnsa=1.
  const [cnsaLens, setCnsaLens] = useState(() => searchParams.get('cnsa') === '1')

  // --- Comparison state (synced to URL) ---
  const [compareKeys, setCompareKeys] = useState<string[]>(() => {
    const raw = searchParams.get('compare')
    if (!raw) return []
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  })
  const [showComparison, setShowComparison] = useState(false)

  // Determine the locked type from the first compared algorithm
  const compareType = useMemo<'KEM' | 'Signature' | null>(() => {
    if (compareKeys.length === 0) return null
    const firstAlgo = algorithmData.find((a) => a.name === compareKeys[0])
    if (!firstAlgo) return null
    return getFunctionGroup(firstAlgo) as 'KEM' | 'Signature' | null
  }, [compareKeys, algorithmData])

  const baselineName = useMemo(() => {
    // When the user has explicitly selected classical algorithms (via transition rows),
    // suppress the auto-baseline — they're already comparing classical vs PQC directly.
    const hasClassical = compareKeys.some((k) => {
      const a = algorithmData.find((d) => d.name === k)
      return a ? isClassical(a) : false
    })
    if (hasClassical) return null
    return getBaselineName(compareType)
  }, [compareType, compareKeys, algorithmData])

  const baselineAlgo = useMemo(
    () => (baselineName ? (algorithmData.find((a) => a.name === baselineName) ?? null) : null),
    [baselineName, algorithmData]
  )

  const comparisonAlgos = useMemo(
    () =>
      compareKeys
        .map((k) => algorithmData.find((a) => a.name === k))
        .filter(Boolean) as AlgorithmDetail[],
    [compareKeys, algorithmData]
  )

  // Set of compared names for quick lookup
  const compareSet = useMemo(() => new Set(compareKeys), [compareKeys])

  // --- URL sync ---
  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '' || value === 'All') {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleToggleCnsaLens = useCallback(() => {
    setCnsaLens((prev) => {
      const next = !prev
      updateSearchParams({ cnsa: next ? '1' : null })
      return next
    })
  }, [updateSearchParams])

  const handleCryptoFamilyChange = useCallback(
    (id: string) => {
      setFilterCryptoFamily(id)
      updateSearchParams({ family: id === 'All' ? null : id })
    },
    [updateSearchParams]
  )

  const handleFunctionChange = useCallback(
    (id: string) => {
      setFilterFunction(id)
      updateSearchParams({ fn: id === 'All' ? null : id })
    },
    [updateSearchParams]
  )

  const handleSecurityLevelChange = useCallback(
    (id: string) => {
      setFilterSecurityLevel(id)
      updateSearchParams({ level: id === 'All' ? null : id })
    },
    [updateSearchParams]
  )

  const handleRegionChange = useCallback(
    (id: string) => {
      setFilterRegion(id)
      updateSearchParams({ region: id === 'All' ? null : id })
    },
    [updateSearchParams]
  )

  const handleStatusChange = useCallback(
    (id: string) => {
      setFilterStatus(id)
      updateSearchParams({ status: id === 'All' ? null : id })
    },
    [updateSearchParams]
  )

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q)
      updateSearchParams({ q: q || null })
    },
    [updateSearchParams]
  )

  const handleTabChange = useCallback(
    (t: string) => {
      const tab = t as AlgorithmTabId
      setActiveTab(tab)
      // Persist tabs that differ from the persona default; clear the param
      // when the user returns to their default so the URL stays clean.
      updateSearchParams({ tab: tab !== personaDefaults.tab ? tab : null })
    },
    [updateSearchParams, personaDefaults.tab]
  )

  // QuickView preset → multi-field filter writes (P1.2). NIST picks pins
  // status=Certified + family=Lattice (the standardized FIPS 203/204/205
  // family); FIPS-validated narrows to status=Certified across all families;
  // Everything resets all filters back to "All".
  const handleQuickView = useCallback(
    (preset: 'nist-picks' | 'fips-validated' | 'everything') => {
      if (preset === 'nist-picks') {
        setFilterCryptoFamily('Lattice')
        setFilterFunction('All')
        setFilterStatus('Certified')
        updateSearchParams({
          family: 'Lattice',
          fn: null,
          status: 'Certified',
        })
      } else if (preset === 'fips-validated') {
        setFilterCryptoFamily('All')
        setFilterFunction('All')
        setFilterStatus('Certified')
        updateSearchParams({
          family: null,
          fn: null,
          status: 'Certified',
        })
      } else {
        setFilterCryptoFamily('All')
        setFilterFunction('All')
        setFilterSecurityLevel('All')
        setFilterRegion('All')
        setFilterStatus('All')
        updateSearchParams({
          family: null,
          fn: null,
          level: null,
          region: null,
          status: null,
        })
      }
    },
    [updateSearchParams]
  )

  // --- Comparison handlers ---
  const handleToggleCompare = useCallback(
    (algoName: string) => {
      setCompareKeys((prev) => {
        let next: string[]
        if (prev.includes(algoName)) {
          next = prev.filter((k) => k !== algoName)
        } else {
          if (prev.length >= MAX_COMPARE) return prev
          next = [...prev, algoName]
        }
        // Update URL
        const raw = next.length > 0 ? next.join(',') : null
        updateSearchParams({ compare: raw })
        return next
      })
      setShowComparison(false)
    },
    [updateSearchParams]
  )

  // Transition-tab variant: selects a full row, adding both the PQC name and its
  // classical counterpart as a pair so the comparison panel shows both sides.
  const handleToggleTransitionRow = useCallback(
    (t: AlgorithmTransition) => {
      const pqcName = t.pqc.split(/\s*\(/)[0].trim()
      const classicalName = resolveClassicalAlgoName(t.classical, t.keySize, algorithmData)
      setCompareKeys((prev) => {
        if (prev.includes(pqcName)) {
          // Remove the whole pair
          const next = prev.filter((k) => k !== pqcName && k !== classicalName)
          updateSearchParams({ compare: next.length > 0 ? next.join(',') : null })
          return next
        }
        // Add both — need room for the pair
        const toAdd = [pqcName, ...(classicalName ? [classicalName] : [])]
        if (prev.length + toAdd.length > MAX_COMPARE) return prev
        const next = [...prev, ...toAdd]
        updateSearchParams({ compare: next.join(',') })
        return next
      })
      setShowComparison(false)
    },
    [algorithmData, updateSearchParams]
  )

  const handleClearCompare = useCallback(() => {
    setCompareKeys([])
    setShowComparison(false)
    updateSearchParams({ compare: null })
  }, [updateSearchParams])

  const handleOpenComparison = useCallback(() => {
    setShowComparison(true)
    setTimeout(() => {
      comparisonPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  // Status filter helper: "Certified" matches anything that isn't Candidate or To Be Checked
  const matchesStatusFilter = useCallback(
    (status: string) => {
      if (filterStatus === 'All') return true
      if (filterStatus === 'Certified') return status !== 'Candidate' && status !== 'To Be Checked'
      return status === filterStatus
    },
    [filterStatus]
  )

  // Phase 3 — semantic supplement. Queries like "what replaces my ECC?"
  // surface ECDH/ECDSA transitions and PQC replacements without the
  // user needing to know the term "elliptic-curve".
  const semantic = useSemanticSearch('algorithms', searchQuery, { limit: 30 })
  const semanticAlgoNameSet = useMemo(
    () =>
      semantic.mode === 'semantic' ? new Set(semantic.hits.map((h) => h.id.toLowerCase())) : null,
    [semantic.mode, semantic.hits]
  )

  // --- Filtered data (Detailed Comparison) ---
  const filteredAlgorithms = useMemo(() => {
    return algorithmData.filter((algo) => {
      if (cnsaLens && !passesCnsa20Filter(algo)) return false
      if (filterCryptoFamily !== 'All' && algo.cryptoFamily !== filterCryptoFamily) return false
      if (filterFunction !== 'All') {
        const group = getFunctionGroup(algo)
        if (group !== filterFunction) return false
      }
      if (filterSecurityLevel !== 'All' && algo.securityLevel !== parseInt(filterSecurityLevel))
        return false
      if (filterRegion !== 'All' && algo.region !== filterRegion) return false
      if (!matchesStatusFilter(algo.status)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const lexicalMatch =
          algo.name.toLowerCase().includes(q) ||
          algo.family.toLowerCase().includes(q) ||
          algo.cryptoFamily.toLowerCase().includes(q) ||
          algo.fipsStandard.toLowerCase().includes(q)
        if (!lexicalMatch) {
          if (semanticAlgoNameSet && semanticAlgoNameSet.has(algo.name.toLowerCase())) return true
          return false
        }
      }
      return true
    })
  }, [
    algorithmData,
    filterCryptoFamily,
    filterFunction,
    filterSecurityLevel,
    filterRegion,
    matchesStatusFilter,
    searchQuery,
    semanticAlgoNameSet,
    cnsaLens,
  ])

  // --- Filtered data (Transition Guide) ---
  const filteredTransitions = useMemo(() => {
    return transitionData.filter((t) => {
      if (cnsaLens && !passesCnsa20Filter({ name: t.pqc, family: '' })) return false
      if (filterFunction !== 'All') {
        const group = getTransitionFunctionGroup(t.function)
        if (group !== filterFunction) return false
      }
      if (filterCryptoFamily !== 'All') {
        const family = getCryptoFamilyFromPQCName(t.pqc)
        if (family !== filterCryptoFamily) return false
      }
      if (filterRegion !== 'All' && t.region !== filterRegion) return false
      if (!matchesStatusFilter(t.status)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const lexicalMatch =
          t.classical.toLowerCase().includes(q) || t.pqc.toLowerCase().includes(q)
        if (!lexicalMatch) {
          // Transition rows aren't in the embeddings index directly; we
          // accept them when the PQC algorithm name appears in the
          // semantic hit set (which IS encoded for the algorithms collection).
          if (semanticAlgoNameSet && semanticAlgoNameSet.has(t.pqc.toLowerCase())) return true
          return false
        }
      }
      return true
    })
  }, [
    transitionData,
    filterFunction,
    filterCryptoFamily,
    filterRegion,
    matchesStatusFilter,
    searchQuery,
    semanticAlgoNameSet,
    cnsaLens,
  ])

  // --- Available security levels ---
  const availableLevels = useMemo(() => {
    const levels = new Set(
      filteredAlgorithms.map((a) => a.securityLevel).filter((l): l is number => l !== null)
    )
    return Array.from(levels).sort()
  }, [filteredAlgorithms])

  // --- CSV export ---
  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(algorithmData, ALGORITHM_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-algorithms'))
  }, [algorithmData])

  // Total counts for filter bar
  const totalAlgoCount = activeTab === 'transition' ? transitionData.length : algorithmData.length
  const filteredCount =
    activeTab === 'transition' ? filteredTransitions.length : filteredAlgorithms.length

  return {
    // data load
    metadata,
    transitionMetadata,
    algorithmData,
    transitionData,
    isLoading,
    // filter state
    filterCryptoFamily,
    filterFunction,
    filterSecurityLevel,
    filterRegion,
    filterStatus,
    searchQuery,
    cnsaLens,
    // url sync
    searchParams,
    setSearchParams,
    updateSearchParams,
    // handlers
    handleCryptoFamilyChange,
    handleFunctionChange,
    handleSecurityLevelChange,
    handleRegionChange,
    handleStatusChange,
    handleSearchChange,
    handleTabChange,
    handleQuickView,
    handleToggleCnsaLens,
    handleToggleCompare,
    handleToggleTransitionRow,
    handleClearCompare,
    handleOpenComparison,
    handleExportCsv,
    // compare state + derived
    compareKeys,
    showComparison,
    setShowComparison,
    compareType,
    baselineName,
    baselineAlgo,
    comparisonAlgos,
    compareSet,
    comparisonPanelRef,
    // helpers / semantic
    matchesStatusFilter,
    semantic,
    semanticAlgoNameSet,
    // filtered data
    filteredAlgorithms,
    filteredTransitions,
    availableLevels,
    // tab
    activeTab,
    setActiveTab,
    // counts
    totalAlgoCount,
    filteredCount,
  }
}
