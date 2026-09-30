// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
import {
  loadPQCAlgorithmsData,
  loadedFileMetadata,
  type AlgorithmDetail,
  findAlgorithmByRef,
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
import { algoMatchesHighlight, parseHighlight, transitionMatchesHighlight } from './highlightMatch'

export const MAX_COMPARE = 6 // allows up to 3 classical+PQC pairs from the transition tab

/**
 * Params that only mean something on one tab. Whenever one of them is in the
 * URL, `tab` is written too — even when it equals the sharer's persona
 * default — so a recipient with a different persona lands on the same tab.
 */
const TAB_BOUND_PARAMS = ['mode', 'compare', 'section', 'algo'] as const

/**
 * A link carrying one of these without `?tab` implies the tab its resource
 * lives on (and the tab is pinned into the URL right after first paint).
 * `?algo` is deliberately absent: it opens a page-level drawer (and, on the
 * phone landing screen, a sheet that must not be pushed off that screen), so
 * it only seeds the initial tab and is never pinned.
 */
const IMPLIED_TAB_PARAMS: ReadonlyArray<[string, AlgorithmTabId]> = [
  ['protocol', 'support'],
  ['usecase', 'landscape'],
  ['attack', 'validation'],
]

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

export type QuickViewId = 'none' | 'nist-picks' | 'fips-validated'

/** Every filter that can hide an algorithm/transition row. */
export interface ExplorerFilterState {
  quickView: QuickViewId
  family: string
  fn: string
  level: string
  region: string
  status: string
  cnsa: boolean
  gap: boolean
  q: string
}

/** Everything cleared — what "Everything" / ?from_search=1 show. */
export const WIDE_OPEN_FILTERS: ExplorerFilterState = {
  quickView: 'none',
  family: 'All',
  fn: 'All',
  level: 'All',
  region: 'All',
  status: 'All',
  cnsa: false,
  gap: false,
  q: '',
}

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
function matchesStatus(filterStatus: string, status: string, tier: AlgorithmStatusTier): boolean {
  if (filterStatus === 'All') return true
  if (filterStatus === 'Certified') return isStatusFilterTier(tier)
  return status === filterStatus
}

/**
 * Detailed-Comparison filter predicate for a given filter state. `applyLevel`
 * off lets availableLevels ignore the level filter itself.
 */
export function passesAlgoFilterState(
  algo: AlgorithmDetail,
  f: ExplorerFilterState,
  semanticAlgoNameSet: Set<string> | null,
  applyLevel = true
): boolean {
  if (f.cnsa && !passesCnsa20Filter(algo)) return false
  if (f.gap && !algo.hasResearchGap) return false
  if (f.quickView === 'nist-picks' && !isNistPick(algo.fipsStandard)) return false
  if (f.quickView === 'fips-validated' && !isFipsValidated(algo.fipsStandard)) return false
  if (f.family !== 'All' && algo.cryptoFamily !== f.family) return false
  if (f.fn !== 'All') {
    const group = getFunctionGroup(algo)
    if (group !== f.fn) return false
  }
  if (applyLevel && f.level !== 'All' && algo.securityLevel !== parseInt(f.level)) return false
  if (f.region !== 'All' && algo.region !== f.region) return false
  if (!matchesStatus(f.status, algo.status, algo.statusTier)) return false
  if (f.q) {
    const q = f.q.toLowerCase()
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
}

/** Transition-Guide filter predicate for a given filter state. */
export function passesTransitionFilterState(
  t: AlgorithmTransition,
  f: ExplorerFilterState,
  semanticAlgoNameSet: Set<string> | null
): boolean {
  if (f.cnsa && !passesCnsa20Filter({ name: t.pqc, family: '' })) return false
  if (f.quickView === 'nist-picks' && !isNistPick(t.status)) return false
  if (f.quickView === 'fips-validated' && !isFipsValidated(t.status)) return false
  if (f.fn !== 'All') {
    const group = getTransitionFunctionGroup(t.function)
    if (group !== f.fn) return false
  }
  if (f.family !== 'All') {
    const family = getCryptoFamilyFromPQCName(t.pqc)
    if (family !== f.family) return false
  }
  if (f.region !== 'All' && t.region !== f.region) return false
  if (!matchesStatus(f.status, t.status, t.statusTier)) return false
  if (f.q) {
    const q = f.q.toLowerCase()
    const lexicalMatch = t.classical.toLowerCase().includes(q) || t.pqc.toLowerCase().includes(q)
    if (!lexicalMatch) {
      // Transition rows aren't in the embeddings index directly; we
      // accept them when the PQC algorithm name appears in the
      // semantic hit set (which IS encoded for the algorithms collection).
      if (semanticAlgoNameSet && semanticAlgoNameSet.has(t.pqc.toLowerCase())) return true
      return false
    }
  }
  return true
}

export interface HighlightWideningPlan {
  /** Highlight names that match no row in the whole dataset. */
  unknown: string[]
  /** Filter state to switch to, or null when every known name is already visible. */
  widenTo: ExplorerFilterState | null
}

/**
 * Decide how far to widen the filters so every highlighted name that exists
 * in the dataset has at least one visible row. Widens the least it can:
 * first only drops the quick view (the usual culprit — the 'nist-picks'
 * default hides FrodoKEM/HQC/RSA/3DES…), then clears every filter.
 */
export function planHighlightWidening<Row>(
  names: string[],
  rows: Row[],
  current: ExplorerFilterState,
  passes: (row: Row, f: ExplorerFilterState) => boolean,
  matches: (row: Row, name: string) => boolean
): HighlightWideningPlan {
  const known = names.filter((n) => rows.some((r) => matches(r, n)))
  const unknown = names.filter((n) => !known.includes(n))
  const allVisible = (f: ExplorerFilterState) =>
    known.every((n) => rows.some((r) => matches(r, n) && passes(r, f)))
  if (known.length === 0 || allVisible(current)) return { unknown, widenTo: null }
  const noQuickView: ExplorerFilterState = { ...current, quickView: 'none' }
  if (current.quickView !== 'none' && allVisible(noQuickView)) {
    return { unknown, widenTo: noQuickView }
  }
  return { unknown, widenTo: WIDE_OPEN_FILTERS }
}

/** ?cmp after a tray change, which always closes the comparison panel: on
 *  the Transition tab with ≥2 left, cmp=0 so a reload keeps it closed
 *  (an absent cmp would reopen it); otherwise drop cmp. */
function trayCmp(tab: AlgorithmTabId, remaining: number): string | null {
  return tab === 'transition' && remaining >= 2 ? '0' : null
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
    // ?protocol=<id> only means something on Protocol Support (its detail
    // modal lives there), so a link carrying it without ?tab lands there.
    // Same for ?usecase (Industry Landscape) and ?attack (Validation).
    for (const [param, impliedTab] of IMPLIED_TAB_PARAMS) {
      if (searchParams.get(param)) return impliedTab
    }
    if (searchParams.get('highlight') || searchParams.get('algo')) return 'detailed'
    return personaDefaults.tab
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    const implied = tab
      ? undefined
      : IMPLIED_TAB_PARAMS.find(([param]) => searchParams.get(param))?.[1]
    if (isAlgorithmTab(tab)) {
      setActiveTab((prev) => (prev !== tab ? tab : prev))
    } else if (implied) {
      setActiveTab((prev) => (prev !== implied ? implied : prev))
      // Pin the tab in the URL so closing the resource (which strips its
      // param) keeps the reader on that tab on reload/share.
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', implied)
          return next
        },
        { replace: true }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // ?quickview=none is "Everything", written explicitly so it survives a
  // reload/share instead of snapping back to the 'nist-picks' default.
  const [quickView, setQuickView] = useState<QuickViewId>(() => {
    const qv = searchParams.get('quickview')
    return qv === 'nist-picks' || qv === 'fips-validated' || qv === 'none' ? qv : 'nist-picks'
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
  // Transition-tab comparison panel, mirrored to ?cmp (1 = open, 0 = closed)
  // so the address bar, reloads and shares reproduce it. A link landing on
  // the Transition tab with ≥2 algorithms in ?compare and no ?cmp opens it
  // (links shared before ?cmp existed carried only the tray, which showed
  // the recipient nothing); an explicit cmp=0 keeps it closed.
  const [showComparison, setShowComparisonState] = useState(
    () =>
      activeTab === 'transition' &&
      searchParams.get('cmp') !== '0' &&
      (searchParams.get('compare') ?? '').split(',').filter((s) => s.trim()).length >= 2
  )

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
  // Read through a ref so updateSearchParams keeps a stable identity.
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>, opts: { push?: boolean } = {}) => {
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
          if (!next.has('tab') && TAB_BOUND_PARAMS.some((k) => next.has(k))) {
            next.set('tab', activeTabRef.current)
          }
          return next
        },
        { replace: !opts.push }
      )
    },
    [setSearchParams]
  )

  const arrivalCmpDone = useRef(false)
  // Every open/close goes through here so ?cmp stays in step (replace).
  // Closing writes cmp=0 rather than deleting it: with ≥2 in ?compare an
  // absent cmp would reopen the panel on reload.
  const setShowComparison = useCallback(
    (open: boolean) => {
      arrivalCmpDone.current = true
      setShowComparisonState(open)
      updateSearchParams({ cmp: open ? '1' : '0' })
    },
    [updateSearchParams]
  )

  // Arrival that opened the panel: pin ?cmp=1 and bring the panel into view
  // once the compared algorithms have loaded and it has rendered.
  useEffect(() => {
    if (arrivalCmpDone.current || !showComparison || comparisonAlgos.length < 2) return
    arrivalCmpDone.current = true
    if (searchParams.get('cmp') !== '1') updateSearchParams({ cmp: '1' })
    setTimeout(() => {
      comparisonPanelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }, 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComparison, comparisonAlgos.length])

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
      activeTabRef.current = tab
      // Persist tabs that differ from the persona default; clear the param
      // when the user returns to their default so the URL stays clean —
      // unless a tab-bound param (mode/compare/section/algo) is set, which
      // always pins the tab (a recipient's persona default may differ).
      const pinned = TAB_BOUND_PARAMS.some((k) => searchParams.has(k))
      updateSearchParams({ tab: tab !== personaDefaults.tab || pinned ? tab : null })
    },
    [updateSearchParams, personaDefaults.tab, searchParams]
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
          quickview: 'none',
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
        updateSearchParams({ compare: raw, cmp: trayCmp(activeTabRef.current, next.length) })
        return next
      })
      setShowComparisonState(false)
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
          updateSearchParams({
            compare: next.length > 0 ? next.join(',') : null,
            cmp: trayCmp(activeTabRef.current, next.length),
          })
          return next
        }
        // Add both — need room for the pair
        const toAdd = [pqcName, ...(classicalName ? [classicalName] : [])]
        if (prev.length + toAdd.length > MAX_COMPARE) return prev
        const next = [...prev, ...toAdd]
        updateSearchParams({
          compare: next.join(','),
          cmp: trayCmp(activeTabRef.current, next.length),
        })
        return next
      })
      setShowComparisonState(false)
    },
    [algorithmData, updateSearchParams]
  )

  const handleClearCompare = useCallback(() => {
    setCompareKeys([])
    setShowComparisonState(false)
    updateSearchParams({ compare: null, cmp: null })
  }, [updateSearchParams])

  const handleOpenComparison = useCallback(() => {
    setShowComparison(true)
    setTimeout(() => {
      comparisonPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [setShowComparison])

  const matchesStatusFilter = useCallback(
    (status: string, tier: AlgorithmStatusTier) => matchesStatus(filterStatus, status, tier),
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

  const filterState = useMemo<ExplorerFilterState>(
    () => ({
      quickView,
      family: filterCryptoFamily,
      fn: filterFunction,
      level: filterSecurityLevel,
      region: filterRegion,
      status: filterStatus,
      cnsa: cnsaLens,
      gap: researchGapOnly,
      q: searchQuery,
    }),
    [
      quickView,
      filterCryptoFamily,
      filterFunction,
      filterSecurityLevel,
      filterRegion,
      filterStatus,
      cnsaLens,
      researchGapOnly,
      searchQuery,
    ]
  )

  // Algorithm filter predicate, parameterised on whether the security-level
  // filter participates. `availableLevels` reuses this with the level filter
  // OFF so picking a level never narrows the set of levels you can switch to.
  const passesAlgoFilters = useCallback(
    (algo: AlgorithmDetail, opts: { applyLevel: boolean } = { applyLevel: true }) =>
      passesAlgoFilterState(algo, filterState, semanticAlgoNameSet, opts.applyLevel),
    [filterState, semanticAlgoNameSet]
  )

  // --- Filtered data (Detailed Comparison) ---
  const filteredAlgorithms = useMemo(
    () => algorithmData.filter((algo) => passesAlgoFilters(algo)),
    [algorithmData, passesAlgoFilters]
  )

  // --- Filtered data (Transition Guide) ---
  // Transition rows ignore the level and research-gap filters (no such
  // columns), exactly as before the predicate moved to module scope.
  const filteredTransitions = useMemo(
    () =>
      transitionData.filter((t) =>
        passesTransitionFilterState(t, filterState, semanticAlgoNameSet)
      ),
    [transitionData, filterState, semanticAlgoNameSet]
  )

  // --- ?highlight deep links ---
  // A highlighted row hidden by the default 'nist-picks' quick view (or by
  // saved/persona filters) used to leave the reader on a table without it.
  // Now: widen just enough to show it, say so with an Undo, and say so when
  // the name matches no row at all. Runs once per (tab, highlight) pair so
  // Undo — which hides the row again — doesn't immediately re-widen.
  const [highlightNotice, setHighlightNotice] = useState<{
    widened: {
      message: string
      prev: ExplorerFilterState
      prevParams: Record<string, string | null>
    } | null
    notFound: string | null
  } | null>(null)
  const handledHighlightKeyRef = useRef<string | null>(null)
  const highlightRaw = searchParams.get('highlight')

  const applyFilterState = useCallback((f: ExplorerFilterState) => {
    setQuickView(f.quickView)
    setFilterCryptoFamily(f.family)
    setFilterFunction(f.fn)
    setFilterSecurityLevel(f.level)
    setFilterRegion(f.region)
    setFilterStatus(f.status)
    setCnsaLens(f.cnsa)
    setResearchGapOnly(f.gap)
    setSearchQuery(f.q)
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (activeTab !== 'detailed' && activeTab !== 'transition') return
    const names = parseHighlight(highlightRaw)
    if (names.length === 0) return
    const key = `${activeTab}|${highlightRaw}`
    if (handledHighlightKeyRef.current === key) return
    handledHighlightKeyRef.current = key

    const plan =
      activeTab === 'detailed'
        ? planHighlightWidening(
            names,
            algorithmData,
            filterState,
            (r, f) => passesAlgoFilterState(r, f, semanticAlgoNameSet),
            (r, n) => algoMatchesHighlight(r.name, n)
          )
        : planHighlightWidening(
            names,
            transitionData,
            filterState,
            (r, f) => passesTransitionFilterState(r, f, semanticAlgoNameSet),
            transitionMatchesHighlight
          )

    const known = names.filter((n) => !plan.unknown.includes(n))
    const notFound =
      plan.unknown.length > 0
        ? `No algorithm on this tab matches ${plan.unknown.map((n) => `"${n}"`).join(', ')} — it may have been renamed or retired.`
        : null
    let widened: NonNullable<typeof highlightNotice>['widened'] = null
    if (plan.widenTo) {
      const onlyQuickView =
        plan.widenTo.quickView === 'none' &&
        JSON.stringify({ ...filterState, quickView: 'none' }) === JSON.stringify(plan.widenTo)
      const label = known.join(', ')
      widened = {
        message: onlyQuickView
          ? `Switched the quick view to "Everything" so the linked ${label} is visible.`
          : `Filters were cleared so the linked ${label} is visible.`,
        prev: filterState,
        prevParams: Object.fromEntries(
          ['quickview', 'family', 'fn', 'level', 'region', 'status', 'cnsa', 'gap', 'q'].map(
            (k) => [k, searchParams.get(k)]
          )
        ),
      }
      applyFilterState(plan.widenTo)
      updateSearchParams({
        quickview: 'none',
        family: plan.widenTo.family,
        fn: plan.widenTo.fn,
        level: plan.widenTo.level,
        region: plan.widenTo.region,
        status: plan.widenTo.status,
        cnsa: plan.widenTo.cnsa ? '1' : null,
        gap: plan.widenTo.gap ? '1' : null,
        q: plan.widenTo.q || null,
      })
    }
    setHighlightNotice(widened || notFound ? { widened, notFound } : null)
    // Only the (tab, highlight) pair triggers this; filter state is read, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, activeTab, highlightRaw, algorithmData, transitionData])

  const undoHighlightWidening = useCallback(() => {
    const widened = highlightNotice?.widened
    if (!widened) return
    applyFilterState(widened.prev)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(widened.prevParams)) {
          if (v === null) next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true }
    )
    setHighlightNotice((n) => (n?.notFound ? { widened: null, notFound: n.notFound } : null))
  }, [highlightNotice, applyFilterState, setSearchParams])

  const dismissHighlightNotice = useCallback(() => setHighlightNotice(null), [])

  // --- ?algo=<algorithm_id> detail drawer ---
  // Accepts the stable id or (for links minted before the id column) an
  // exact, case-insensitive algorithm name. Opening pushes a history entry
  // (Back closes the drawer); closing strips the param in place.
  const algoParam = searchParams.get('algo')
  const selectedAlgo = useMemo(
    () => findAlgorithmByRef(algorithmData, algoParam) ?? null,
    [algorithmData, algoParam]
  )
  const algoNotFound = !isLoading && !!algoParam && !selectedAlgo ? algoParam : null

  const openAlgorithm = useCallback(
    (algo: AlgorithmDetail) => updateSearchParams({ algo: algo.id }, { push: true }),
    [updateSearchParams]
  )
  const closeAlgorithm = useCallback(() => updateSearchParams({ algo: null }), [updateSearchParams])

  // The linked algorithm hidden by the quick view / filters on Detailed:
  // widen exactly like ?highlight does (same plan, same Undo notice), once
  // per (tab, algo) pair so Undo doesn't immediately re-widen.
  const handledAlgoKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedAlgo || activeTab !== 'detailed') return
    const key = `${activeTab}|${selectedAlgo.id}`
    if (handledAlgoKeyRef.current === key) return
    handledAlgoKeyRef.current = key
    const plan = planHighlightWidening(
      [selectedAlgo.name],
      algorithmData,
      filterState,
      (r, f) => passesAlgoFilterState(r, f, semanticAlgoNameSet),
      (r, n) => r.name === n
    )
    if (!plan.widenTo) return
    const onlyQuickView =
      JSON.stringify({ ...filterState, quickView: 'none' }) === JSON.stringify(plan.widenTo)
    setHighlightNotice((n) => ({
      notFound: n?.notFound ?? null,
      widened: {
        message: onlyQuickView
          ? `Switched the quick view to "Everything" so the linked ${selectedAlgo.name} is visible.`
          : `Filters were cleared so the linked ${selectedAlgo.name} is visible.`,
        prev: filterState,
        prevParams: Object.fromEntries(
          ['quickview', 'family', 'fn', 'level', 'region', 'status', 'cnsa', 'gap', 'q'].map(
            (k) => [k, searchParams.get(k)]
          )
        ),
      },
    }))
    applyFilterState(plan.widenTo)
    updateSearchParams({
      quickview: 'none',
      family: plan.widenTo.family,
      fn: plan.widenTo.fn,
      level: plan.widenTo.level,
      region: plan.widenTo.region,
      status: plan.widenTo.status,
      cnsa: plan.widenTo.cnsa ? '1' : null,
      gap: plan.widenTo.gap ? '1' : null,
      q: plan.widenTo.q || null,
    })
    // Only the (tab, algo) pair triggers this; filter state is read, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlgo, activeTab, algorithmData])

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
    // ?highlight deep-link notice (widened filters / unknown name)
    highlightNotice,
    undoHighlightWidening,
    dismissHighlightNotice,
    // ?algo detail drawer
    algoParam,
    selectedAlgo,
    algoNotFound,
    openAlgorithm,
    closeAlgorithm,
    // tab
    activeTab,
    setActiveTab,
    // counts
    totalAlgoCount,
    filteredCount,
  }
}
