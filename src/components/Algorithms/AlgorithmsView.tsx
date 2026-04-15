// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { AlgorithmFilters } from './AlgorithmFilters'
import { AlgorithmCompareBar } from './AlgorithmCompareBar'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3, Shield } from 'lucide-react'
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
import { Skeleton } from '../ui/skeleton'
import { PageHeader } from '../common/PageHeader'
import { generateCsv, downloadCsv, csvFilename } from '../../utils/csvExport'
import { ALGORITHM_CSV_COLUMNS } from '../../utils/csvExportConfigs'
import { AlgorithmInfoModal } from './AlgorithmInfoModal'

const MAX_COMPARE = 6 // allows up to 3 classical+PQC pairs from the transition tab

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

export function AlgorithmsView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const comparisonPanelRef = useRef<HTMLDivElement>(null)

  // --- Highlight from URL ---
  const highlightAlgorithms = useMemo(() => {
    const raw = searchParams.get('highlight')
    if (!raw) return undefined
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  }, [searchParams])

  // --- Active tab ---
  const [activeTab, setActiveTab] = useState<'transition' | 'detailed'>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed') return tab
    return searchParams.get('highlight') ? 'detailed' : 'transition'
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab((prev) => (prev !== tab ? tab : prev))
    }
  }, [searchParams])

  // --- Data loading ---
  const [metadata, setMetadata] = useState<{ filename: string; date: Date | null } | null>(null)
  const [transitionMetadata, setTransitionMetadata] = useState<{
    filename: string
    date: Date | null
  } | null>(null)
  const [algorithmData, setAlgorithmData] = useState<AlgorithmDetail[]>([])
  const [transitionData, setTransitionData] = useState<AlgorithmTransition[]>([])
  const [infoOpen, setInfoOpen] = useState(false)
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

  // --- Filter state (synced to URL) ---
  const [filterCryptoFamily, setFilterCryptoFamily] = useState(
    () => searchParams.get('family') || 'All'
  )
  const [filterFunction, setFilterFunction] = useState(() => searchParams.get('fn') || 'All')
  const [filterSecurityLevel, setFilterSecurityLevel] = useState(
    () => searchParams.get('level') || 'All'
  )
  const [filterRegion, setFilterRegion] = useState(() => searchParams.get('region') || 'All')
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || 'All')
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')

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
      const tab = t as 'transition' | 'detailed'
      setActiveTab(tab)
      updateSearchParams({ tab: tab !== 'transition' ? tab : null })
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

  // --- Filtered data (Detailed Comparison) ---
  const filteredAlgorithms = useMemo(() => {
    return algorithmData.filter((algo) => {
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
        if (
          !algo.name.toLowerCase().includes(q) &&
          !algo.family.toLowerCase().includes(q) &&
          !algo.cryptoFamily.toLowerCase().includes(q) &&
          !algo.fipsStandard.toLowerCase().includes(q)
        )
          return false
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
  ])

  // --- Filtered data (Transition Guide) ---
  const filteredTransitions = useMemo(() => {
    return transitionData.filter((t) => {
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
        if (!t.classical.toLowerCase().includes(q) && !t.pqc.toLowerCase().includes(q)) return false
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

  return (
    <div>
      <PageHeader
        icon={Shield}
        pageId="algorithms"
        title="Post-Quantum Cryptography Algorithms"
        description="Migration from classical to post-quantum cryptographic algorithms"
        dataSource={
          `Data Sources: ${transitionMetadata?.filename ?? 'algorithms_transitions.csv'}, ` +
          `${metadata?.filename ?? 'pqc_complete_algorithm_reference.csv'} • Updated: ` +
          `${(metadata?.date ?? transitionMetadata?.date ?? new Date()).toLocaleDateString()}`
        }
        viewType="Algorithms"
        shareTitle="PQC Algorithm Comparison — ML-KEM, ML-DSA, SLH-DSA & More"
        shareText="Compare 42 post-quantum cryptographic algorithms side-by-side — security levels, key sizes, and performance."
        onExport={handleExportCsv}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )}

      {/* Filters + View */}
      {!isLoading && (
        <>
          {/* Shared filters */}
          <AlgorithmFilters
            cryptoFamily={filterCryptoFamily}
            onCryptoFamilyChange={handleCryptoFamilyChange}
            functionGroup={filterFunction}
            onFunctionGroupChange={handleFunctionChange}
            securityLevel={filterSecurityLevel}
            onSecurityLevelChange={handleSecurityLevelChange}
            region={filterRegion}
            onRegionChange={handleRegionChange}
            status={filterStatus}
            onStatusChange={handleStatusChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filteredCount={filteredCount}
            totalCount={totalAlgoCount}
            availableLevels={availableLevels}
          />

          {/* View Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="mb-6 bg-muted/50 border border-border">
              <TabsTrigger value="transition" className="flex items-center gap-2">
                <ArrowRight size={18} />
                Transition Guide
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <BarChart3 size={18} />
                Detailed Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transition">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AlgorithmComparison
                  highlightAlgorithms={highlightAlgorithms}
                  filteredData={filteredTransitions}
                  compareSet={compareSet}
                  compareType={compareType}
                  maxCompareReached={compareKeys.length >= MAX_COMPARE - 1}
                  onToggleTransitionRow={handleToggleTransitionRow}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="detailed">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AlgorithmDetailedComparison
                  highlightAlgorithms={highlightAlgorithms}
                  onInfoOpen={() => setInfoOpen(true)}
                  filteredAlgorithms={filteredAlgorithms}
                  compareSet={compareSet}
                  compareType={compareType}
                  maxCompareReached={compareKeys.length >= MAX_COMPARE}
                  onToggleCompare={handleToggleCompare}
                  activeSubTab={
                    (searchParams.get('subtab') as
                      | 'performance'
                      | 'security'
                      | 'sizes'
                      | 'usecases'
                      | 'attacks'
                      | 'kat') || 'performance'
                  }
                  onSubTabChange={(v) =>
                    updateSearchParams({ subtab: v === 'performance' ? null : v })
                  }
                />
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Comparison panel */}
          {showComparison && comparisonAlgos.length >= 2 && (
            <div ref={comparisonPanelRef} className="mt-6">
              <AlgorithmComparisonPanel
                algorithms={comparisonAlgos}
                baseline={baselineAlgo}
                activeTab={activeTab}
                onClose={() => setShowComparison(false)}
              />
            </div>
          )}

          {/* Sticky compare bar */}
          <AlgorithmCompareBar
            compareKeys={compareKeys}
            baselineName={baselineName}
            onRemove={(key) => handleToggleCompare(key)}
            onClearAll={handleClearCompare}
            onCompare={handleOpenComparison}
          />
        </>
      )}

      <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
