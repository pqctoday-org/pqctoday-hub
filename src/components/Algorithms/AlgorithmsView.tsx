// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { AlgorithmFilters } from './AlgorithmFilters'
import { AlgorithmCompareBar } from './AlgorithmCompareBar'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3, Shield, Lightbulb, Network, Info } from 'lucide-react'
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
import { AlgorithmEntryStrip } from './AlgorithmEntryStrip'
import { usePersonaStore } from '../../store/usePersonaStore'
import { Button } from '../ui/button'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'

const MAX_COMPARE = 6 // allows up to 3 classical+PQC pairs from the transition tab

const ALGO_PERSONA_HINTS: Record<string, string> = {
  executive:
    'Start with FIPS-standardized picks: ML-KEM-768 and ML-DSA-65 — the required choices for US federal compliance.',
  developer:
    "Filter by 'Standardized' status and compare key/signature sizes — performance varies 10× across families.",
  architect:
    'Use the Transition tab to find your classical algorithms and their recommended PQC replacements.',
  researcher:
    'Switch to the Detailed tab for full parameter sets, attack vectors, and cross-family security comparisons.',
}

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
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const viewAccess = usePersonaStore((s) => s.viewAccess)
  const setAdvancedViewsUnlocked = usePersonaStore((s) => s.setAdvancedViewsUnlocked)
  const comparisonPanelRef = useRef<HTMLDivElement>(null)
  const isCuriousPreview =
    selectedPersona === 'curious' && viewAccess === 'preview' && !searchParams.get('highlight')

  // Strip is hidden when the page has any pre-set filter/tab/search state
  const hasActiveParams = useMemo(() => {
    const watched = [
      'tab',
      'highlight',
      'family',
      'fn',
      'level',
      'region',
      'status',
      'q',
      'compare',
      'section',
      'subtab',
    ]
    return watched.some((key) => searchParams.has(key))
  }, [searchParams])

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
  const [activeTab, setActiveTab] = useState<'transition' | 'detailed' | 'support'>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transition' || tab === 'detailed' || tab === 'support') return tab
    return searchParams.get('highlight') ? 'detailed' : 'transition'
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

      {/* eslint-disable-next-line security/detect-object-injection */}
      {selectedPersona && ALGO_PERSONA_HINTS[selectedPersona] && (
        <div className="mt-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
          <Lightbulb size={13} className="shrink-0 text-primary mt-0.5" aria-hidden="true" />
          {/* eslint-disable-next-line security/detect-object-injection */}
          <span className="flex-1">{ALGO_PERSONA_HINTS[selectedPersona]}</span>
          {selectedPersona === 'executive' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 border border-primary/20 rounded shrink-0"
              onClick={() =>
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('highlight', 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s,Falcon-512')
                    next.set('tab', 'detailed')
                    return next
                  },
                  { replace: true }
                )
              }
            >
              View Top 5 →
            </Button>
          )}
        </div>
      )}

      <AlgorithmEntryStrip
        persona={selectedPersona}
        hasActiveParams={hasActiveParams}
        onApply={updateSearchParams}
      />

      {/* Curious preview — hide the heavy comparison tables until they explicitly unlock */}
      {isCuriousPreview && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gradient mb-3">
            42 algorithms — three you actually need to know
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            NIST selected three post-quantum algorithms in 2024 (FIPS 203 / 204 / 205): one for key
            exchange (ML-KEM), one for general-purpose signatures (ML-DSA), and a hash-based backup
            (SLH-DSA). Everything else on this page is either a classical algorithm being retired or
            a candidate still in standardisation.
          </p>
          <ul className="text-sm text-foreground/90 space-y-2 mb-5">
            <li>
              <strong className="text-primary">ML-KEM-768</strong> — replaces RSA / ECDH for
              encryption key exchange. Public key ~1.2 KB, ciphertext ~1.1 KB.
            </li>
            <li>
              <strong className="text-primary">ML-DSA-65</strong> — replaces RSA / ECDSA for digital
              signatures. Signature ~3.3 KB.
            </li>
            <li>
              <strong className="text-primary">SLH-DSA-SHA2-128s</strong> — hash-based backup
              signature for the highest-security scenarios. Signature ~7.8 KB.
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="gradient"
              onClick={() => setAdvancedViewsUnlocked(true)}
              className="sm:w-auto"
            >
              Show full algorithm comparison
            </Button>
            <Link to="/learn/pqc-101">
              <Button variant="outline" className="sm:w-auto">
                Learn the basics first
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {!isCuriousPreview && isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )}

      {/* Filters + View */}
      {!isLoading && !isCuriousPreview && (
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

          {/* Cross-link to PQC Candidates module when filtering by Candidate status */}
          {filterStatus === 'Candidate' && (
            <div className="mt-3 rounded-lg border border-info/30 bg-info/5 p-3 flex items-start gap-2">
              <Info size={16} className="text-info shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/85 leading-relaxed">
                These are NIST Additional Signatures Round-2 / Round-3 candidates, not yet
                standardised. To understand the standardisation lifecycle — the four math families,
                the cryptanalysis events, and the worldwide parallel tracks (KpqC, CACR, ISO/IEC) —
                see the{' '}
                <Link
                  to="/learn/pqc-candidates"
                  className="text-info hover:underline font-semibold inline-flex items-center gap-1"
                >
                  PQC Candidates &amp; Standardisation Lifecycle <ArrowRight size={11} />
                </Link>{' '}
                learn module.
              </p>
            </div>
          )}

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
              <TabsTrigger value="support" className="flex items-center gap-2">
                <Network size={18} />
                Protocol Support
                <span
                  className="rounded-sm bg-status-warning/20 text-status-warning px-1 py-0 text-[9px] font-bold uppercase tracking-wider"
                  title="Work in progress — schema + data are evolving"
                >
                  WIP
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transition">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                data-workshop-target="section-algorithm-transition"
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
                data-workshop-target="section-algorithm-detailed"
              >
                <AlgorithmDetailedComparison
                  highlightAlgorithms={highlightAlgorithms}
                  onInfoOpen={() => setInfoOpen(true)}
                  filteredAlgorithms={filteredAlgorithms}
                  compareSet={compareSet}
                  compareType={compareType}
                  maxCompareReached={compareKeys.length >= MAX_COMPARE}
                  onToggleCompare={handleToggleCompare}
                  initialSection={
                    (searchParams.get('section') ?? searchParams.get('subtab') ?? undefined) as
                      | 'performance'
                      | 'security'
                      | 'sizes'
                      | 'usecases'
                      | 'attacks'
                      | 'kat'
                      | undefined
                  }
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="support">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                data-workshop-target="section-algorithm-protocol-support"
              >
                <PQCProtocolMatrix />
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Comparison panel — only meaningful for transition/detailed tabs; suppressed on Protocol Support */}
          {showComparison && comparisonAlgos.length >= 2 && activeTab !== 'support' && (
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
