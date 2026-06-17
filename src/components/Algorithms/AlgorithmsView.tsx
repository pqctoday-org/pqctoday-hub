// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { AlgorithmFilters } from './AlgorithmFilters'
import { AlgorithmCompareBar } from './AlgorithmCompareBar'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3, Shield, Lightbulb, Network, Info } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { PageHeader } from '../common/PageHeader'
import { AlgorithmInfoModal } from './AlgorithmInfoModal'
import { AlgorithmEntryStrip } from './AlgorithmEntryStrip'
import { Cnsa20Panel } from './Cnsa20Panel'
import { ShieldCheck } from 'lucide-react'
import { usePersonaStore } from '../../store/usePersonaStore'
import { Button } from '../ui/button'
import { getAlgorithmDefaults } from '../../data/personaConfig'
import type { PersonaId } from '../../data/learningPersonas'
import { useAlgorithmExplorer, MAX_COMPARE } from './useAlgorithmExplorer'

const ALGO_PERSONA_HINTS: Record<PersonaId, string> = {
  executive:
    'Start with FIPS-standardized picks: ML-KEM-768 and ML-DSA-65 — the required choices for US federal compliance.',
  developer:
    "Filter by 'Standardized' status and compare key/signature sizes — performance varies 10× across families.",
  architect:
    'Use the Transition tab to find your classical algorithms and their recommended PQC replacements.',
  researcher:
    'Switch to the Detailed tab for full parameter sets, attack vectors, and cross-family security comparisons.',
  ops: 'Filter Status = Certified and look for Production deployment chips on Protocol Support — these are the algorithms safe to deploy in OpenSSL, nginx and HSMs today.',
  curious:
    'You unlocked the full comparison. The three NIST picks (ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128s) are pre-highlighted; everything else is for specialists.',
}

export function AlgorithmsView() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const viewAccess = usePersonaStore((s) => s.viewAccess)
  const setAdvancedViewsUnlocked = usePersonaStore((s) => s.setAdvancedViewsUnlocked)
  const algorithmsTabsVisited = usePersonaStore((s) => s.algorithmsTabsVisited)
  const markAlgorithmsTabVisited = usePersonaStore((s) => s.markAlgorithmsTabVisited)

  // Persona-derived defaults — used to seed first-paint tab / filter / highlight
  // state when no URL params are present. Deep-links always win.
  const personaDefaults = useMemo(() => getAlgorithmDefaults(selectedPersona), [selectedPersona])

  // Shared explorer state (filters, comparison, tabs, data load) lives in the
  // hook so the standalone page and any embedded host behave identically.
  const {
    metadata,
    transitionMetadata,
    algorithmData,
    isLoading,
    filterCryptoFamily,
    filterFunction,
    filterSecurityLevel,
    filterRegion,
    filterStatus,
    searchQuery,
    cnsaLens,
    searchParams,
    setSearchParams,
    updateSearchParams,
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
    compareKeys,
    showComparison,
    setShowComparison,
    compareType,
    baselineName,
    baselineAlgo,
    comparisonAlgos,
    compareSet,
    comparisonPanelRef,
    filteredAlgorithms,
    filteredTransitions,
    availableLevels,
    activeTab,
    totalAlgoCount,
    filteredCount,
  } = useAlgorithmExplorer(personaDefaults)

  const [infoOpen, setInfoOpen] = useState(false)

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
      'cnsa',
    ]
    return watched.some((key) => searchParams.has(key))
  }, [searchParams])

  // --- Highlight: URL deep-link wins, otherwise persona defaults apply when
  //     no other URL state is present (executive / curious land with pinned
  //     NIST picks; everyone else gets undefined). ---
  const highlightAlgorithms = useMemo(() => {
    const raw = searchParams.get('highlight')
    if (raw) {
      return new Set(
        raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    }
    if (personaDefaults.highlight && !hasActiveParams) {
      return new Set(personaDefaults.highlight)
    }
    return undefined
  }, [searchParams, personaDefaults.highlight, hasActiveParams])

  // P2.3: record tab visits so the curious-persona gate on Protocol Support
  // can open after the user has explored Transition or Detailed at least once.
  useEffect(() => {
    if (activeTab === 'transition' || activeTab === 'detailed') {
      markAlgorithmsTabVisited(activeTab)
    }
  }, [activeTab, markAlgorithmsTabVisited])

  // Curious-only gate: hide Protocol Support until they have visited at
  // least one of the friendlier tabs. Power personas and unlocked-curious
  // users always see the third tab.
  const hideSupportTab =
    selectedPersona === 'curious' &&
    !algorithmsTabsVisited.includes('transition') &&
    !algorithmsTabsVisited.includes('detailed')

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
        shareText={`Compare ${algorithmData.length || 'dozens of'} cryptographic algorithms side-by-side — security levels, key sizes, and performance.`}
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
                    next.set('highlight', 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s,FN-DSA-512')
                    next.set('tab', 'detailed')
                    return next
                  },
                  { replace: true }
                )
              }
            >
              View Top 4 →
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
            {algorithmData.length || 'Dozens of'} algorithms — three you actually need to know
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
            persona={selectedPersona}
            onQuickView={handleQuickView}
          />

          {/* CNSA 2.0 lens toggle (gap-closer #1). Additive: off by default. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant={cnsaLens ? 'gradient' : 'outline'}
              size="sm"
              onClick={handleToggleCnsaLens}
              aria-pressed={cnsaLens}
              className="gap-1.5"
              title="Filter to the NSA CNSA 2.0 suite — ML-KEM-1024 / ML-DSA-87 required; SLH-DSA excluded"
            >
              <ShieldCheck size={14} aria-hidden="true" />
              CNSA 2.0 lens
            </Button>
            {cnsaLens && (
              <span className="text-xs text-muted-foreground">
                Showing only the CNSA 2.0 suite for U.S. National Security Systems.
              </span>
            )}
          </div>

          {cnsaLens && <Cnsa20Panel />}

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
              {!hideSupportTab && (
                <TabsTrigger value="support" className="flex items-center gap-2">
                  <Network size={18} />
                  Protocol Support
                  <span
                    className="rounded-sm bg-primary/15 text-primary px-1 py-0 text-[9px] font-bold uppercase tracking-wider"
                    title="Tracks 14 IETF protocols across pure-KEM, hybrid-KEM, pure-Sig, hybrid-Sig dimensions. Updated weekly from datatracker."
                  >
                    Beta
                  </span>
                </TabsTrigger>
              )}
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
