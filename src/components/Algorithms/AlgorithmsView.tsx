// SPDX-License-Identifier: AGPL-3.0-only
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
import { AlgorithmDetailDrawer } from './AlgorithmDetailDrawer'
import { matchAttackProfile } from './attackDeepLink'
import { AlgorithmEntryStrip } from './AlgorithmEntryStrip'
import { Cnsa20Panel } from './Cnsa20Panel'
import { usePersonaStore } from '../../store/usePersonaStore'
import { Button } from '../ui/button'
import { getAlgorithmDefaults } from '../../data/personaConfig'
import type { PersonaId } from '../../data/learningPersonas'
import { useAlgorithmExplorer, MAX_COMPARE } from './useAlgorithmExplorer'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { logAlgorithmView } from '@/utils/analytics'
import { MobileAlgorithmsView } from '@/components/Mobile/screens/MobileAlgorithmsView'
import { MobileProtocolMatrixView } from '@/components/Mobile/screens/MobileProtocolMatrixView'
import { MobileKATValidationView } from '@/components/Mobile/screens/MobileKATValidationView'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import {
  formatSnapshotDate,
  getCatalogueFreshness,
  getWithheldCatalogueRows,
} from '@/data/pqcAlgorithmsData'
import {
  algoMatchesHighlight,
  highlightRowSelector,
  parseHighlight,
  transitionMatchesHighlight,
  transitionRowId,
} from './highlightMatch'

const ALGO_PERSONA_HINTS: Record<PersonaId, string> = {
  executive:
    'Start with published NIST standards. ML-KEM-768 and ML-DSA-65 are common general-purpose examples; CNSA 2.0 separately specifies stronger parameter sets for US National Security Systems.',
  developer:
    'Use the explicit maturity filters to separate published standards, pending selections, drafts, and candidates. Compare sizes, then measure the same operation on your target.',
  architect:
    'Use the Transition tab to explore candidate paths from classical algorithms, then check protocol, API, key-lifecycle, and validation constraints.',
  grc: 'Use the Transition tab to learn which standards and candidate migration paths may be relevant. This educational view does not determine applicability or product compliance.',
  researcher:
    'Detailed Comparison has the full parameter sets and cross-family security comparisons; Validation › Implementation Attacks has the side-channel and fault-injection notes per family.',
  'cert-engineer':
    'Validation has known-answer tests you can run and implementation-attack notes per family. A CAVP algorithm validation is the prerequisite for a module certificate, not the certificate itself.',
  ops: "Start with Published standard, then inspect reviewed deployment evidence. Check your exact product's documentation and validation status before deployment.",
  curious:
    'You unlocked the full comparison. Three common starting points from the published NIST standards (ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128s) are pre-highlighted; the other rows are there to compare against.',
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
    highlightNotice,
    undoHighlightWidening,
    dismissHighlightNotice,
    selectedAlgo,
    algoNotFound,
    openAlgorithm,
    closeAlgorithm,
    selectedTransitionId,
    transitionNotFound,
    closeTransition,
    roleDefaultFilters,
  } = useAlgorithmExplorer(personaDefaults)

  const catalogueFreshness = getCatalogueFreshness(metadata?.date)
  const catalogueQuality = useMemo(
    () => ({
      missingSource: algorithmData.filter((row) => !row.trustedSourceId || !row.statusUrl).length,
      researchGaps: algorithmData.filter((row) => row.hasResearchGap).length,
      // Read after load: the loader counts the rows it withholds as it parses.
      withheld: getWithheldCatalogueRows(),
    }),
    [algorithmData]
  )
  const withheldTotal =
    catalogueQuality.withheld.unclassified + catalogueQuality.withheld.placeholder
  const withheldParts = [
    catalogueQuality.withheld.unclassified > 0
      ? `${catalogueQuality.withheld.unclassified} unclassified`
      : null,
    catalogueQuality.withheld.placeholder > 0
      ? `${catalogueQuality.withheld.placeholder} placeholder${catalogueQuality.withheld.placeholder === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean)

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
  // ?protocol without ?tab means Protocol Support (useAlgorithmExplorer pins
  // tab=support into the URL right after first paint).
  const protocolParam = searchParams.get('protocol')
  // ?transition=<row slug> without ?tab means the Transition Guide (pinned
  // right after first paint, like ?protocol).
  const transitionParam = searchParams.get('transition')
  // ?usecase / ?attack / ?kat / ?polarity imply their tab the same way (pinned right after
  // first paint), so they skip the landing shell too. ?algo does not: the
  // landing shell opens it in its own detail sheet.
  const isMobileShell =
    isMobile &&
    !tabParam &&
    !searchParams.get('highlight') &&
    !transitionParam &&
    !protocolParam &&
    !searchParams.get('usecase') &&
    !searchParams.get('attack') &&
    !searchParams.get('kat') &&
    !searchParams.get('polarity')
  const isMobileProtocolMatrix =
    isMobile && (tabParam === 'support' || (!tabParam && !!protocolParam))
  const sectionParam = searchParams.get('section')
  const attackParam = searchParams.get('attack')
  // The coverage matrix has no distilled phone screen: ?section=coverage on a
  // phone falls through to the real Validation view (below, page chrome
  // stripped) — its tables already scroll horizontally.
  // ?polarity with no ?section implies the coverage section the same way.
  const isMobileCoverage =
    isMobile &&
    tabParam === 'validation' &&
    (sectionParam === 'coverage' || (!sectionParam && !!searchParams.get('polarity')))
  const isMobileValidation = isMobile && tabParam === 'validation' && !isMobileCoverage
  const isMobileTransition =
    isMobile && (tabParam === 'transition' || (!tabParam && !!transitionParam))
  const isMobileDetailed = isMobile && tabParam === 'detailed'
  const isMobileLandscape = isMobile && tabParam === 'landscape'

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

  // A link to a specific resource or sub-view bypasses the Curious preview
  // card — otherwise it swallows the very thing the link points at.
  const hasResourceParams =
    [
      'protocol',
      'industry',
      'mechanism',
      'usecase',
      'section',
      'attack',
      'engine',
      'case',
      'polarity',
      'kat',
      'compare',
      'highlight',
      'algo',
      'transition',
      'matrixHighlight',
    ].some((k) => searchParams.has(k)) || searchParams.get('mode') === 'compare'
  const isCuriousPreview =
    selectedPersona === 'curious' && viewAccess === 'preview' && !hasResourceParams

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
      'matrixHighlight',
      'algo',
      'usecase',
      'attack',
      'engine',
      'case',
      'polarity',
      'kat',
      'transition',
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

  // Scroll to (and ring) the first visible row a ?highlight link names, on
  // Detailed and Transition. Persona-default highlights don't scroll.
  const urlHighlightNames = useMemo(
    () => parseHighlight(searchParams.get('highlight')),
    [searchParams]
  )
  // ?transition: the one linked Transition row (all rows sharing its id are
  // tinted; the scroll goes to the first) once it's visible —
  // useAlgorithmExplorer widens the filters first when it's hidden. It wins
  // over a ?highlight scroll on the same tab.
  const transitionRowVisible =
    !!selectedTransitionId &&
    activeTab === 'transition' &&
    filteredTransitions.some((t) => transitionRowId(t) === selectedTransitionId)
  useScrollToDeepLinkTarget(
    transitionRowVisible ? `transition-row|${selectedTransitionId}` : null,
    transitionRowVisible ? highlightRowSelector(deepLinkSelector(selectedTransitionId)) : null
  )
  // A ?highlight or ?transition link (not a role default): on a phone the
  // Transition tab opens its full list on the row instead of the wizard.
  const rowLinkArrived = !!searchParams.get('highlight') || !!transitionParam

  const highlightTargetId = useMemo(() => {
    if (isLoading || urlHighlightNames.length === 0) return null
    if (transitionRowVisible) return null
    if (activeTab === 'detailed') {
      const row = filteredAlgorithms.find((a) =>
        urlHighlightNames.some((h) => algoMatchesHighlight(a.name, h))
      )
      return row ? row.name : null
    }
    if (activeTab === 'transition') {
      const row = filteredTransitions.find((t) =>
        urlHighlightNames.some((h) => transitionMatchesHighlight(t, h))
      )
      return row ? transitionRowId(row) : null
    }
    return null
  }, [
    isLoading,
    urlHighlightNames,
    activeTab,
    filteredAlgorithms,
    filteredTransitions,
    transitionRowVisible,
  ])
  useScrollToDeepLinkTarget(
    highlightTargetId ? `${activeTab}|${highlightTargetId}` : null,
    highlightTargetId ? highlightRowSelector(deepLinkSelector(highlightTargetId)) : null
  )

  // ?algo: scroll to (and ring) the linked row on Detailed once it's visible
  // (useAlgorithmExplorer widens the filters first when it's hidden).
  const algoRowVisible =
    !!selectedAlgo &&
    activeTab === 'detailed' &&
    filteredAlgorithms.some((a) => a.id === selectedAlgo.id)
  useScrollToDeepLinkTarget(
    algoRowVisible ? `algo|${selectedAlgo.id}` : null,
    algoRowVisible ? highlightRowSelector(deepLinkSelector(selectedAlgo.name)) : null
  )

  const algoNotFoundEl = algoNotFound ? (
    <DeepLinkNotice
      kind="not-found"
      message={`No algorithm matches "${algoNotFound}" — it may have been renamed or retired.`}
      onDismiss={closeAlgorithm}
    />
  ) : null

  const transitionNotFoundEl = transitionNotFound ? (
    <DeepLinkNotice
      kind="not-found"
      message={`No Transition Guide row matches "${transitionNotFound}" — it may have been renamed or retired.`}
      onDismiss={closeTransition}
    />
  ) : null

  const algoDrawerEl = <AlgorithmDetailDrawer algo={selectedAlgo} onClose={closeAlgorithm} />

  // Validation tab URL state: accordions write ?section, profiles ?attack,
  // the coverage matrix ?engine / ?case / ?polarity, the SLH-DSA KAT tile
  // ?kat (all replace — view state).
  const attackProfile = matchAttackProfile(attackParam)
  const validationEl = (
    <AlgorithmValidationView
      sectionParam={sectionParam}
      attackParam={attackParam}
      engineParam={searchParams.get('engine')}
      caseParam={searchParams.get('case')}
      polarityParam={searchParams.get('polarity')}
      katParam={searchParams.get('kat')}
      onUpdateParams={updateSearchParams}
    />
  )

  const highlightNoticeEl = highlightNotice ? (
    <>
      {highlightNotice.widened && (
        <DeepLinkNotice
          kind="widened"
          message={highlightNotice.widened.message}
          onUndo={undoHighlightWidening}
          onDismiss={dismissHighlightNotice}
        />
      )}
      {highlightNotice.notFound && (
        <DeepLinkNotice
          kind="not-found"
          message={highlightNotice.notFound}
          onDismiss={dismissHighlightNotice}
        />
      )}
    </>
  ) : null

  // 2026-08-02 (design_handoff_2026_pages/IMPLEMENTATION-PLAN-ALGORITHMS-
  // 2026-08-01.md §3.2): the curious-only Protocol Support lock (P2.3,
  // formerly gated on algorithmsTabsVisited/markAlgorithmsTabVisited in
  // usePersonaStore) is removed — "a reference table teaches nothing by
  // being hidden." The tab is unlocked from first paint for every persona
  // now. algorithmsTabsVisited/markAlgorithmsTabVisited are left in
  // usePersonaStore itself (not read anywhere else) rather than removed —
  // pruning a field from that widely-shared, version-9 persisted store is a
  // separate, higher-risk cleanup than this fix calls for.

  // One view event each time an algorithm's detail opens (by click or by deep link).
  const selectedAlgoName = selectedAlgo?.name
  useEffect(() => {
    if (selectedAlgoName) logAlgorithmView(selectedAlgoName)
  }, [selectedAlgoName])

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
        `${formatSnapshotDate(metadata?.date ?? transitionMetadata?.date) ?? 'date not recorded'}`,
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
    return (
      <MobileKATValidationView
        sectionParam={sectionParam}
        attackParam={attackParam}
        attackProfile={attackProfile?.algorithm ?? null}
        onUpdateParams={updateSearchParams}
      />
    )
  }
  if (isMobileCoverage) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-x-hidden px-4 pb-4 pt-4">
        {validationEl}
      </div>
    )
  }
  if (isMobileTransition) {
    return (
      <div className="px-4 pb-4 pt-4">
        {transitionNotFoundEl}
        {highlightNoticeEl}
        <AlgorithmComparison
          highlightAlgorithms={highlightAlgorithms}
          highlightFromLink={rowLinkArrived}
          selectedRowId={selectedTransitionId}
          filteredData={filteredTransitions}
          compareSet={compareSet}
          compareType={compareType}
          maxCompareReached={compareKeys.length >= MAX_COMPARE - 1}
          onToggleTransitionRow={handleToggleTransitionRow}
        />
        {algoDrawerEl}
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
          Key sizes, security levels, publication status, and scoped evidence for each algorithm.
        </p>
        <div className="mt-3">
          {algoNotFoundEl}
          {highlightNoticeEl}
          <AlgorithmDetailedComparison
            highlightAlgorithms={highlightAlgorithms}
            onInfoOpen={() => setInfoOpen(true)}
            filteredAlgorithms={filteredAlgorithms}
            compareSet={compareSet}
            compareType={compareType}
            maxCompareReached={compareKeys.length >= 3}
            selectionLimit={3}
            onToggleCompare={handleToggleCompare}
            detailMode={detailMode}
            onDetailModeChange={handleDetailModeChange}
            comparisonAlgos={comparisonAlgos}
            baselineAlgo={baselineAlgo}
            selectedAlgoId={selectedAlgo?.id ?? null}
            onOpenAlgorithm={openAlgorithm}
          />
        </div>
        <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
        {algoDrawerEl}
      </div>
    )
  }
  if (isMobileLandscape) {
    return (
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">
          Industry use cases
        </h1>
        <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          Learn where cryptography appears and which migration questions to ask.
        </p>
        <IndustryLandscapeView />
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

      <PersonaPageNote route="/algorithms" className="mb-4" />

      <aside className="mb-4 rounded-lg border border-status-info/30 bg-status-info/5 px-4 py-3 text-sm leading-relaxed text-foreground/85">
        <strong className="text-foreground">Educational boundary.</strong> This explorer compares
        algorithm standards, catalogue records, protocol maturity, and tests included in PQC Today.
        It does not certify an algorithm, validate a product, establish compliance, or predict
        performance on your system. Follow each source and measure your own implementation before
        making a deployment decision.
      </aside>

      <aside className="mb-4 rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">Catalogue evidence health:</strong>{' '}
          {catalogueFreshness.label}. This is the imported file date, not proof that every row was
          reviewed on that date. The source file does not yet record a row reviewer, verification
          method, source locator, or next-review date.
        </p>
        <p className="mt-1" data-testid="catalogue-row-counts">
          {algorithmData.length} catalogue rows shown
          {withheldTotal > 0 &&
            `; ${withheldTotal} withheld (${withheldParts.join(', ')}) because they cannot support a defensible comparison yet`}
          . Of the rows shown, {catalogueQuality.missingSource} lack either a source identifier or
          status link and {catalogueQuality.researchGaps} have at least one missing or unresearched
          field. Open a row to inspect its available provenance.
        </p>
      </aside>

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
            {algorithmData.length || 'Dozens of'} catalogue entries — three common starting points
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            NIST published its first three post-quantum standards in August 2024 (FIPS 203 / 204 /
            205): one for key establishment (ML-KEM), one for general-purpose signatures (ML-DSA),
            and a hash-based backup (SLH-DSA). The rest of this page also covers hash-based
            signatures already standardised for firmware (LMS / XMSS), algorithms selected but not
            yet published (FN-DSA, HQC), other countries&apos; standards, and the classical
            algorithms being retired.
          </p>
          <ul className="text-sm text-foreground/90 space-y-2 mb-5">
            <li>
              <strong className="text-primary">ML-KEM-768</strong> — a parameter set of the ML-KEM
              key-encapsulation mechanism, and the default FIPS 203 recommends; a candidate for key
              establishment where RSA or ECDH is used today, not a drop-in replacement. Public key
              ~1.2 KB, ciphertext ~1.1 KB.
            </li>
            <li>
              <strong className="text-primary">ML-DSA-65</strong> — a mid-level ML-DSA parameter
              set; a candidate for digital signatures where RSA or ECDSA is used today. Signature
              ~3.3 KB.
            </li>
            <li>
              <strong className="text-primary">SLH-DSA-SHA2-128s</strong> — hash-based backup
              signature whose security rests only on hash functions. Much larger signatures: ~7.8
              KB.
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
                    What one high-assurance profile specifies
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    For US National Security Systems, CNSA 2.0 requires{' '}
                    <strong className="text-foreground">ML-KEM-1024</strong> for key establishment
                    and <strong className="text-foreground">ML-DSA-87</strong> for signatures.
                    ML-KEM-768 / ML-DSA-65 are useful general-purpose NIST examples, but publication
                    in a FIPS does not itself create a universal federal mandate. The tables below
                    teach the engineering differences; consult the primary policy for the system,
                    agency, sector, and region in scope.
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
          {activeTab !== 'support' && activeTab !== 'landscape' && activeTab !== 'validation' && (
            <>
              <AlgorithmFilters
                roleDefaultFilters={roleDefaultFilters}
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
                            // Published FIPS examples only: FN-DSA (FIPS 206)
                            // is selected but its standard is still pending.
                            next.set('highlight', 'ML-KEM-768,ML-DSA-65,SLH-DSA-SHA2-128s')
                            next.set('tab', 'detailed')
                            return next
                          },
                          { replace: true }
                        )
                      }
                    >
                      Compare common starting points →
                    </Button>
                  ) : undefined
                }
              />

              {/* CNSA 2.0 suite detail — inline below the deck only when the lens is on */}
              {cnsaLens && <Cnsa20Panel />}

              {/* Cross-link to PQC Candidates module when filtering by Candidate status */}
              {(filterStatus === 'candidate' || filterStatus === 'Candidate') && (
                <div className="mt-3 rounded-lg border border-info/30 bg-info/5 p-3 flex items-start gap-2">
                  <Info size={16} className="text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    These are NIST Additional Signatures Round 3 candidates, not yet standardised.
                    To understand the standardisation lifecycle — the four math families, the
                    cryptanalysis events, and the worldwide parallel tracks (KpqC, CACR, ISO/IEC) —
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
            </>
          )}

          {algoNotFoundEl && <div className="mt-4">{algoNotFoundEl}</div>}
          {activeTab === 'transition' && transitionNotFoundEl && (
            <div className="mt-4">{transitionNotFoundEl}</div>
          )}
          {(activeTab === 'detailed' || activeTab === 'transition') && highlightNoticeEl && (
            <div className="mt-4">{highlightNoticeEl}</div>
          )}

          {/* View Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="mb-6 bg-muted/50 border border-border">
              <TabsTrigger
                value="transition"
                className="flex items-center gap-2"
                data-workshop-target="tab-transition"
              >
                <ArrowRight size={18} />
                <span className="hidden sm:inline">Transition Guide</span>
                <span className="sm:hidden">Transition</span>
              </TabsTrigger>
              <TabsTrigger
                value="detailed"
                className="flex items-center gap-2"
                data-workshop-target="tab-detailed"
              >
                <BarChart3 size={18} />
                <span className="hidden sm:inline">Detailed Comparison</span>
                <span className="sm:hidden">Comparison</span>
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="flex items-center gap-2"
                data-workshop-target="tab-support"
                title="Tracks protocols across IETF, TCG, OASIS, 3GPP, IEEE, UEFI, and vendor specs — pure-KEM, hybrid-KEM, pure-Sig, hybrid-Sig dimensions. IETF stages refresh weekly from datatracker; other standards bodies are refreshed manually."
              >
                <Network size={18} />
                <span className="hidden sm:inline">Protocol Support</span>
                <span className="sm:hidden">Protocol</span>
              </TabsTrigger>
              <TabsTrigger
                value="landscape"
                className="flex items-center gap-2"
                data-workshop-target="tab-landscape"
                title="Cross-references 22 industries and their use cases with the classical crypto mechanisms in use, PQC replacements, applicable technical standards (linked to the Library), and official-statistics market sizes."
              >
                <Factory size={18} />
                <span className="hidden sm:inline">Industry Landscape</span>
                <span className="sm:hidden">Industries</span>
              </TabsTrigger>
              <TabsTrigger
                value="validation"
                className="flex items-center gap-2"
                data-workshop-target="tab-validation"
              >
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
                  highlightFromLink={rowLinkArrived}
                  selectedRowId={selectedTransitionId}
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
                {/* Tab-level heading so the table sits under an H2, not straight under the page H1. */}
                <h2 className="sr-only">Detailed comparison</h2>
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
                  selectedAlgoId={selectedAlgo?.id ?? null}
                  onOpenAlgorithm={openAlgorithm}
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
                {validationEl}
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
      {algoDrawerEl}
    </div>
  )
}
