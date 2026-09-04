// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
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
import { isStatusFilterTier, type AlgorithmStatusTier } from '../../data/algorithmStatusTier'
import { passesCnsa20Filter } from './cnsa20'
import { generateCsv, downloadCsv, csvFilename } from '../../utils/csvExport'
import { ALGORITHM_CSV_COLUMNS } from '../../utils/csvExportConfigs'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { getAlgorithmDefaults, type AlgorithmTabId } from '../../data/personaConfig'

export const MAX_COMPARE = 6 // allows up to 3 classical+PQC pairs from the transition tab

// True FIPS validation, grounded in the literal NIST FIPS numbering
// convention: the algorithm's own standards-document field (`fipsStandard` on
// Detailed-Comparison rows, `status` on Transition rows) is a bare, non-draft
// "FIPS <number>" designation — not a Special Publication, RFC, ISO/ETSI/
// BSI/ANSSI/KpqC/CRYPTREC regional standard, or an in-development FIPS (e.g.
// 'FIPS 206 (in development)'). Verified against
// pqc_complete_algorithm_reference_07302026.csv, whose fips_standard values
// spell this out explicitly per row (e.g. "BSI TR-02102-1 ... NOT in NIST
// FIPS"). The moment a value like FIPS 206 drops its "(in development)"
// suffix in the data, it starts matching here automatically.
// Bounded \d+, no nested/overlapping quantifiers — linear-time, not vulnerable to backtracking.
// eslint-disable-next-line security/detect-unsafe-regex
const BARE_FIPS_RE = /^FIPS \d+(-\d+)?$/
export function isFipsValidated(fipsOrStatus: string): boolean {
  return BARE_FIPS_RE.test(fipsOrStatus.trim())
}

// NIST's three flagship PQC picks (FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205
// SLH-DSA — the trio AlgorithmsView's own hero copy calls out by name).
// Deliberately NOT a crypto-family filter: SLH-DSA is Hash-based while
// ML-KEM/ML-DSA are Lattice-based, so no single family value covers all
// three. FIPS 206 (FN-DSA) joins automatically once isFipsValidated() stops
// seeing "(in development)" on it.
const PQC_NIST_PICK_FIPS = new Set(['FIPS 203', 'FIPS 204', 'FIPS 205', 'FIPS 206'])
export function isNistPick(fipsOrStatus: string): boolean {
  const v = fipsOrStatus.trim()
  return isFipsValidated(v) && PQC_NIST_PICK_FIPS.has(v)
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
  const isAlgorithmTab = (t: string | null): t is AlgorithmTabId =>
    t === 'transition' ||
    t === 'detailed' ||
    t === 'support' ||
    t === 'landscape' ||
    t === 'validation'

  const [activeTab, setActiveTab] = useState<AlgorithmTabId>(() => {
    const tab = searchParams.get('tab')
    if (isAlgorithmTab(tab)) return tab
    if (searchParams.get('highlight')) return 'detailed'
    return personaDefaults.tab
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (isAlgorithmTab(tab)) {
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
    setQuickView('none')
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('from_search')
        next.delete('quickview')
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

  // Detailed-tab view mode: Browse (unified table) ↔ Compare (transposed
  // side-by-side matrix). Synced to ?mode=compare; absent means browse.
  const [detailMode, setDetailMode] = useState<'browse' | 'compare'>(() =>
    searchParams.get('mode') === 'compare' ? 'compare' : 'browse'
  )

  useEffect(() => {
    const mode = searchParams.get('mode')
    setDetailMode(mode === 'compare' ? 'compare' : 'browse')
  }, [searchParams])

  // CNSA 2.0 lens — additive. When off (default) the page behaves exactly as
  // before; when on, a lens panel renders and the detailed/transition lists
  // narrow to the CNSA 2.0 suite. Synced to the URL via ?cnsa=1.
  const [cnsaLens, setCnsaLens] = useState(() => searchParams.get('cnsa') === '1')

  // Research-gap filter — additive, same pattern as cnsaLens. Narrows to
  // algorithms with at least one 'Research needed' field. Synced to ?gap=1.
  const [researchGapOnly, setResearchGapOnly] = useState(() => searchParams.get('gap') === '1')

  // QuickView preset — 'nist-picks' / 'fips-validated'. Independent of the
  // Family/Function/Status dropdowns (not reverse-derived from them, which is
  // what let these two presets silently drift out of sync with their own
  // labels — see isFipsValidated()/isNistPick() below). Synced to ?quickview=.
  // Defaults to 'nist-picks' (the three FIPS 203/204/205 standardized
  // algorithms) rather than 'none' — that's the set almost every visitor
  // actually wants first; ?quickview=fips-validated or an explicit click on
  // "Everything" still override it for the rest of the session.
  const [quickView, setQuickView] = useState<'none' | 'nist-picks' | 'fips-validated'>(() => {
    const qv = searchParams.get('quickview')
    return qv === 'nist-picks' || qv === 'fips-validated' ? qv : 'nist-picks'
  })

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

  const handleDetailModeChange = useCallback(
    (mode: 'browse' | 'compare') => {
      setDetailMode(mode)
      updateSearchParams({ mode: mode === 'compare' ? 'compare' : null })
    },
    [updateSearchParams]
  )

  const handleToggleCnsaLens = useCallback(() => {
    setCnsaLens((prev) => {
      const next = !prev
      updateSearchParams({ cnsa: next ? '1' : null })
      return next
    })
  }, [updateSearchParams])

  const handleToggleResearchGapOnly = useCallback(() => {
    setResearchGapOnly((prev) => {
      const next = !prev
      updateSearchParams({ gap: next ? '1' : null })
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
      // Family/Function/Status are cleared for either real preset — they'd
      // otherwise combine with the new quickView gate in ways the button
      // never promised (e.g. a leftover Region/Status pick silently hiding
      // FIPS-validated rows). Region and Level are left alone; combining
      // e.g. "NIST picks" with a Level filter is a legitimate refinement.
      if (preset === 'nist-picks' || preset === 'fips-validated') {
        setQuickView(preset)
        setFilterCryptoFamily('All')
        setFilterFunction('All')
        setFilterStatus('All')
        updateSearchParams({
          quickview: preset,
          family: null,
          fn: null,
          status: null,
        })
      } else {
        setQuickView('none')
        setFilterCryptoFamily('All')
        setFilterFunction('All')
        setFilterSecurityLevel('All')
        setFilterRegion('All')
        setFilterStatus('All')
        updateSearchParams({
          quickview: null,
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

  // Status filter helper. "Certified" reads the normalized status-maturity
  // enum (WORKSTREAMS.md §WS-A) instead of comparing the raw status string —
  // the whitelist is ['final', 'regional', 'fips-draft'] (isStatusFilterTier,
  // algorithmStatusTier.ts). The 'Candidate' / 'To Be Checked' dropdown
  // options remain raw-string matches since those are literal values the
  // CSVs still use verbatim.
  //
  // NOTE: 'regional' means "final within its own jurisdiction (KpqC/BSI
  // winners), not FIPS-Certified" (algorithmStatusTier.ts) — e.g. AIMer,
  // HAETAE, SMAUG-T, NTRU+ (KpqC), Classic-McEliece (BSI TR-02102-1).
  // 'fips-draft' means "NIST-selected, FIPS text not yet published" — e.g.
  // HQC, FN-DSA — included here so the default view doesn't hide NIST's own
  // picks, even though they're not final. This "Certified" bucket is
  // deliberately broader than FIPS and is fine for a plain Status dropdown
  // labeled "Certified" — but it must never back anything claiming to be
  // "FIPS-validated" (see isFipsValidated() below) or suppress the "Draft"
  // badge (isCertifiedTier/isDraftTier stay strict — see
  // algorithmStatusTier.ts).
  const matchesStatusFilter = useCallback(
    (status: string, tier: AlgorithmStatusTier) => {
      if (filterStatus === 'All') return true
      if (filterStatus === 'Certified') return isStatusFilterTier(tier)
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

  // Algorithm filter predicate, parameterised on whether the security-level
  // filter participates. `availableLevels` reuses this with the level filter
  // OFF so picking a level never narrows the set of levels you can switch to.
  const passesAlgoFilters = useCallback(
    (algo: AlgorithmDetail, opts: { applyLevel: boolean } = { applyLevel: true }) => {
      if (cnsaLens && !passesCnsa20Filter(algo)) return false
      if (researchGapOnly && !algo.hasResearchGap) return false
      if (quickView === 'nist-picks' && !isNistPick(algo.fipsStandard)) return false
      if (quickView === 'fips-validated' && !isFipsValidated(algo.fipsStandard)) return false
      if (filterCryptoFamily !== 'All' && algo.cryptoFamily !== filterCryptoFamily) return false
      if (filterFunction !== 'All') {
        const group = getFunctionGroup(algo)
        if (group !== filterFunction) return false
      }
      if (
        opts.applyLevel &&
        filterSecurityLevel !== 'All' &&
        algo.securityLevel !== parseInt(filterSecurityLevel)
      )
        return false
      if (filterRegion !== 'All' && algo.region !== filterRegion) return false
      if (!matchesStatusFilter(algo.status, algo.statusTier)) return false
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
    },
    [
      cnsaLens,
      researchGapOnly,
      quickView,
      filterCryptoFamily,
      filterFunction,
      filterSecurityLevel,
      filterRegion,
      matchesStatusFilter,
      searchQuery,
      semanticAlgoNameSet,
    ]
  )

  // --- Filtered data (Detailed Comparison) ---
  const filteredAlgorithms = useMemo(
    () => algorithmData.filter((algo) => passesAlgoFilters(algo)),
    [algorithmData, passesAlgoFilters]
  )

  // --- Filtered data (Transition Guide) ---
  const filteredTransitions = useMemo(() => {
    return transitionData.filter((t) => {
      if (cnsaLens && !passesCnsa20Filter({ name: t.pqc, family: '' })) return false
      if (quickView === 'nist-picks' && !isNistPick(t.status)) return false
      if (quickView === 'fips-validated' && !isFipsValidated(t.status)) return false
      if (filterFunction !== 'All') {
        const group = getTransitionFunctionGroup(t.function)
        if (group !== filterFunction) return false
      }
      if (filterCryptoFamily !== 'All') {
        const family = getCryptoFamilyFromPQCName(t.pqc)
        if (family !== filterCryptoFamily) return false
      }
      if (filterRegion !== 'All' && t.region !== filterRegion) return false
      if (!matchesStatusFilter(t.status, t.statusTier)) return false
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
    quickView,
  ])

  // --- Available security levels ---
  // Derived from the dataset filtered by everything EXCEPT the active level
  // filter, so selecting a level never hides the other levels you could switch
  // to (previously this fed off the already-level-filtered list — a trap).
  const availableLevels = useMemo(() => {
    const levels = new Set(
      algorithmData
        .filter((a) => passesAlgoFilters(a, { applyLevel: false }))
        .map((a) => a.securityLevel)
        .filter((l): l is number => l !== null)
    )
    return Array.from(levels).sort()
  }, [algorithmData, passesAlgoFilters])

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
    researchGapOnly,
    quickView,
    detailMode,
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
    handleToggleResearchGapOnly,
    handleDetailModeChange,
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
