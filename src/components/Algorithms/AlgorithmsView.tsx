// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { AlgorithmComparison } from './AlgorithmComparison'
import { AlgorithmDetailedComparison } from './AlgorithmDetailedComparison'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { AlgorithmValidationView } from './AlgorithmValidationView'
import { AlgorithmFilters } from './AlgorithmFilters'
import { AlgorithmCompareBar } from './AlgorithmCompareBar'
import { AlgorithmComparisonPanel } from './AlgorithmComparisonPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ArrowRight, BarChart3, Shield, Network, Info, FlaskConical, Factory } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { PageHeader } from '../common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { AlgorithmInfoModal } from './AlgorithmInfoModal'
import { AlgorithmEntryStrip } from './AlgorithmEntryStrip'
import { Cnsa20Panel } from './Cnsa20Panel'
import { usePersonaStore } from '../../store/usePersonaStore'
import { Button } from '../ui/button'
import { getAlgorithmDefaults } from '../../data/personaConfig'
import type { PersonaId } from '../../data/learningPersonas'
import { useAlgorithmExplorer, MAX_COMPARE } from './useAlgorithmExplorer'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileAlgorithmsView } from '@/components/Mobile/screens/MobileAlgorithmsView'
import { MobileProtocolMatrixView } from '@/components/Mobile/screens/MobileProtocolMatrixView'
import { MobileKATValidationView } from '@/components/Mobile/screens/MobileKATValidationView'

const ALGO_PERSONA_HINTS: Record<PersonaId, string> = {
  executive:
    'Start with FIPS-standardized picks: ML-KEM-768 and ML-DSA-65 — the required choices for US federal compliance.',
  developer:
    // ACCURACY-0705: 'Standardized' isn't a real filter value (see
    // AlgorithmFilters.tsx STATUS_ITEMS) — this instructed users into a
    // zero-result filter. 'Certified' is the actual status value.
    "Filter by 'Certified' status and compare key/signature sizes — performance varies 10× across families.",
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
  const selectedRegion = usePersonaStore((s) => s.selectedRegion)
  const viewAccess = usePersonaStore((s) => s.viewAccess)
  const setAdvancedViewsUnlocked = usePersonaStore((s) => s.setAdvancedViewsUnlocked)

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
    researchGapOnly,
    quickView,
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
    handleToggleResearchGapOnly,
    detailMode,
    handleDetailModeChange,
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

  // Mobile UX layer (Phase 7). Only the bare landing state (no explicit
  // ?tab=/?highlight=) gets the distilled mobile screen — every entry-strip
  // intent (including "Replace a classical algorithm", whose params target
  // the same tab a bare visit would resolve to by default) sets one of these
  // explicitly, so tapping any of them intentionally falls through to the
  // real desktop tab in mobile chrome, same as every other not-yet-distilled
  // sub-view. This is a 5-tab explorer, not a single-tab route like Timeline/
  // Threats — one new mobile screen for all 5 tabs isn't in scope; the entry
  // strip is how a mobile reader still reaches each real tab.
  //
  // 2026-08-24 audit: `tab=support` ("Understand PQC protocols") and
  // `tab=validation` ("Run a live test") were exactly this fall-through —
  // real bugs, not an intentional desktop-only cut like the rest of this
  // comment describes; investigated and confirmed neither screen's real
  // filters are what the (still-uncut) family/region/security-level tabs
  // use. Both now get their own distilled mobile screens instead of falling
  // through.
  //
  // 2026-08-24 audit part 2: `tab=transition` and `tab=detailed` had the
  // SAME fall-through — the entry-strip cards that reach them ("Replace a
  // classical algorithm", "Find a drop-in replacement", "View top
  // compliance picks", BSI/ANSSI) landed on the full desktop hero
  // (AlgorithmEntryStrip shown a second time), the executive-mandate box,
  // the AlgorithmFilters control deck, and the full 5-tab TabsList, all
  // squeezed to phone width, with only the tab's own inner content actually
  // mobile-shaped. Confirmed via user scope-check (2026-08-24): strip that
  // chrome for both, same as support/validation above; Detailed
  // Comparison's Compare-side-by-side mode (AlgorithmComparisonPanel) has no
  // mobile layout, so mobile is Browse-only there — desktop keeps both.
  // `tab=landscape` remains out of scope: confirmed unreachable from any
  // mobile entry-strip intent, so no real phone user hits it.
  const isMobile = useIsMobileShell()
  const tabParam = searchParams.get('tab')
  const isMobileShell = isMobile && !tabParam && !searchParams.get('highlight')
  const isMobileProtocolMatrix = isMobile && tabParam === 'support'
  const isMobileValidation = isMobile && tabParam === 'validation'
  const isMobileTransition = isMobile && tabParam === 'transition'
  const isMobileDetailed = isMobile && tabParam === 'detailed'

  const [infoOpen, setInfoOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)

  // Clear every active filter + search in one action (deck "Clear all").
  // Reuses the 'everything' preset so quickView resets along with the
  // dropdowns — a second reset path here previously let quickView survive
  // "Clear all", pinning stale FIPS-validated/NIST-picks results.
  const handleClearAllFilters = () => {
    handleQuickView('everything')
    handleSearchChange('')
  }

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
      'cnsa',
      'gap',
      'quickview',
      'mode',
      'protocol',
      'matrixView',
      'matrixQ',
      'matrixStatus',
      'matrixAvailability',
      'matrixSort',
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

  // 2026-08-02 (design_handoff_2026_pages/IMPLEMENTATION-PLAN-ALGORITHMS-
  // 2026-08-01.md §3.2): the curious-only Protocol Support lock (P2.3,
  // formerly gated on algorithmsTabsVisited/markAlgorithmsTabVisited in
  // usePersonaStore) is removed — "a reference table teaches nothing by
  // being hidden." The tab is unlocked from first paint for every persona
  // now. algorithmsTabsVisited/markAlgorithmsTabVisited are left in
  // usePersonaStore itself (not read anywhere else) rather than removed —
  // pruning a field from that widely-shared, version-9 persisted store is a
  // separate, higher-risk cleanup than this fix calls for.

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/export/endorse/flag render there now, not as
  // a row on the page itself. Mirrors TimelineView.tsx's pattern.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'Post-Quantum Algorithms & Protocols',
      dataSource:
        `Data Sources: ${transitionMetadata?.filename ?? 'algorithms_transitions.csv'}, ` +
        `${metadata?.filename ?? 'pqc_complete_algorithm_reference.csv'} • Updated: ` +
        `${(metadata?.date ?? transitionMetadata?.date ?? new Date()).toLocaleDateString()}`,
      onExport: handleExportCsv,
      endorseUrl: buildEndorsementUrl({
        category: 'algorithm-endorsement',
        title: 'Endorse: PQC Algorithms & Protocols',
        resourceType: 'Algorithms Page',
        resourceId: 'Post-Quantum Algorithms & Protocols',
        resourceDetails:
          '**Page:** Post-Quantum Algorithms & Protocols — compare PQC algorithms and IETF protocol support.',
        pageUrl: '/algorithms',
      }),
      endorseLabel: 'Algorithms Page',
      endorseResourceType: 'Algorithms',
      flagUrl: buildFlagUrl({
        category: 'algorithm-endorsement',
        title: 'Flag: PQC Algorithms & Protocols',
        resourceType: 'Algorithms Page',
        resourceId: 'Post-Quantum Algorithms & Protocols',
        resourceDetails:
          '**Page:** Post-Quantum Algorithms & Protocols — compare PQC algorithms and IETF protocol support.',
        pageUrl: '/algorithms',
      }),
      flagLabel: 'Algorithms Page',
      flagResourceType: 'Algorithms',
    })
    return () => clearPageActions()
  }, [handleExportCsv, metadata, transitionMetadata])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). AlgorithmsView is never
  // embedded in the simulation (AlgorithmTransitionEmbed/ProtocolMatrixEmbed
  // both bypass it, reading useAlgorithmExplorer/PQCProtocolMatrix directly),
  // so unlike ThreatsDashboard this needs no simEmbed-equivalent guard.
  if (isMobileShell) {
    return <MobileAlgorithmsView />
  }
  if (isMobileProtocolMatrix) {
    return <MobileProtocolMatrixView />
  }
  if (isMobileValidation) {
    return <MobileKATValidationView />
  }
  if (isMobileTransition) {
    return (
      <div className="px-4 pb-4 pt-4">
        <AlgorithmComparison
          highlightAlgorithms={highlightAlgorithms}
          filteredData={filteredTransitions}
          compareSet={compareSet}
          compareType={compareType}
          maxCompareReached={compareKeys.length >= MAX_COMPARE - 1}
          onToggleTransitionRow={handleToggleTransitionRow}
        />
      </div>
    )
  }
  if (isMobileDetailed) {
    return (
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">
          Detailed Comparison
        </h1>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          Key sizes, performance, and standardization status for every algorithm.
        </p>
        <div className="mt-3">
          <AlgorithmDetailedComparison
            highlightAlgorithms={highlightAlgorithms}
            onInfoOpen={() => setInfoOpen(true)}
            filteredAlgorithms={filteredAlgorithms}
            compareSet={compareSet}
            compareType={compareType}
            maxCompareReached={compareKeys.length >= MAX_COMPARE}
            onToggleCompare={handleToggleCompare}
            detailMode="browse"
            onDetailModeChange={() => {}}
            comparisonAlgos={comparisonAlgos}
            baselineAlgo={baselineAlgo}
            hideCompareToggle
          />
        </div>
        <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon={Shield}
        title="Post-Quantum Algorithms & Protocols"
        description="Compare post-quantum algorithms and track their support across IETF protocols"
      />

      <AlgorithmEntryStrip
        persona={selectedPersona}
        region={selectedRegion}
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
          {/* Executive mandate readout — turns the comparison workbench into a
              "what must I adopt, and where are the deadlines" answer. Exec only. */}
          {selectedPersona === 'executive' && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-foreground mb-1">
                    What you&apos;re required to adopt
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    For US National Security Systems, CNSA 2.0 requires{' '}
                    <strong className="text-foreground">ML-KEM-1024</strong> for key establishment
                    and <strong className="text-foreground">ML-DSA-87</strong> for signatures.
                    Federal civilian systems commonly deploy ML-KEM-768 / ML-DSA-65 under NIST
                    guidance. The tables below are the engineering detail — for the deadlines that
                    apply to your sector and region, see the compliance timeline.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/compliance">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                        Compliance deadlines →
                      </Button>
                    </Link>
                    <Link to="/timeline">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                        Migration timeline →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Control deck — filters + QuickView + CNSA lens + persona hint in one panel.
              Hidden on Protocol Support: that tab filters/sorts its own table
              (family/fn/level/region/status here have no effect on it). */}
          {activeTab !== 'support' && activeTab !== 'landscape' && (
            <>
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
                quickView={quickView}
                onQuickView={handleQuickView}
                cnsaLens={cnsaLens}
                onToggleCnsaLens={handleToggleCnsaLens}
                researchGapOnly={researchGapOnly}
                onToggleResearchGapOnly={handleToggleResearchGapOnly}
                onClearAll={handleClearAllFilters}
                personaHint={
                  selectedPersona && !hintDismissed
                    ? ALGO_PERSONA_HINTS[selectedPersona]
                    : undefined
                }
                onDismissHint={() => setHintDismissed(true)}
                hintAction={
                  selectedPersona === 'executive' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 border border-primary/20 rounded shrink-0"
                      onClick={() =>
                        setSearchParams(
                          (prev) => {
                            const next = new URLSearchParams(prev)
                            next.set(
                              'highlight',
                              'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s,FN-DSA-512'
                            )
                            next.set('tab', 'detailed')
                            return next
                          },
                          { replace: true }
                        )
                      }
                    >
                      View Top 4 →
                    </Button>
                  ) : undefined
                }
              />

              {/* CNSA 2.0 suite detail — inline below the deck only when the lens is on */}
              {cnsaLens && <Cnsa20Panel />}

              {/* Cross-link to PQC Candidates module when filtering by Candidate status */}
              {filterStatus === 'Candidate' && (
                <div className="mt-3 rounded-lg border border-info/30 bg-info/5 p-3 flex items-start gap-2">
                  <Info size={16} className="text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    These are NIST Additional Signatures Round-2 / Round-3 candidates, not yet
                    standardised. To understand the standardisation lifecycle — the four math
                    families, the cryptanalysis events, and the worldwide parallel tracks (KpqC,
                    CACR, ISO/IEC) — see the{' '}
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
            </>
          )}

          {/* View Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="mb-6 bg-muted/50 border border-border">
              <TabsTrigger value="transition" className="flex items-center gap-2">
                <ArrowRight size={18} />
                <span className="hidden sm:inline">Transition Guide</span>
                <span className="sm:hidden">Transition</span>
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <BarChart3 size={18} />
                <span className="hidden sm:inline">Detailed Comparison</span>
                <span className="sm:hidden">Comparison</span>
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="flex items-center gap-2"
                title="Tracks 28 protocols across IETF, TCG, OASIS, 3GPP, IEEE, UEFI, and vendor specs — pure-KEM, hybrid-KEM, pure-Sig, hybrid-Sig dimensions. IETF stages refresh weekly from datatracker; other standards bodies are refreshed manually."
              >
                <Network size={18} />
                <span className="hidden sm:inline">Protocol Support</span>
                <span className="sm:hidden">Protocol</span>
              </TabsTrigger>
              <TabsTrigger
                value="landscape"
                className="flex items-center gap-2"
                title="Cross-references 22 industries and their use cases with the classical crypto mechanisms in use, PQC replacements, applicable technical standards (linked to the Library), and official-statistics market sizes."
              >
                <Factory size={18} />
                <span className="hidden sm:inline">Industry Landscape</span>
                <span className="sm:hidden">Industries</span>
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <FlaskConical size={18} />
                Validation
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
                  detailMode={detailMode}
                  onDetailModeChange={handleDetailModeChange}
                  comparisonAlgos={comparisonAlgos}
                  baselineAlgo={baselineAlgo}
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

            <TabsContent value="landscape">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                data-workshop-target="section-algorithm-industry-landscape"
              >
                <IndustryLandscapeView />
              </motion.div>
            </TabsContent>

            <TabsContent value="validation">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                data-workshop-target="section-algorithm-validation"
              >
                <AlgorithmValidationView sectionParam={searchParams.get('section')} />
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Comparison panel + sticky tray — Transition tab only. The Detailed
              tab now hosts comparison inline via its own Browse ↔ Compare mode. */}
          {activeTab === 'transition' && (
            <>
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

              <AlgorithmCompareBar
                compareKeys={compareKeys}
                baselineName={baselineName}
                compareType={compareType}
                onRemove={(key) => handleToggleCompare(key)}
                onClearAll={handleClearCompare}
                onCompare={handleOpenComparison}
              />
            </>
          )}
        </>
      )}

      <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
