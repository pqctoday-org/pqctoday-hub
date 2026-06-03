// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Play,
  Cpu,
  FlaskConical,
  Sparkles,
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  Mail,
  Container,
  X,
} from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { PreviewBanner } from '../common/PreviewBanner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { EmptyState } from '../ui/empty-state'
import { WORKSHOP_TOOLS, CATEGORIES, type WorkshopTool } from './workshopRegistry'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { logEvent, personaLabel } from '@/utils/analytics'
import type { PersonaId } from '@/data/learningPersonas'
import { usePersonaDefaults } from '@/hooks/usePersonaDefaults'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { PlaygroundViewToggle, type PlaygroundViewMode } from './PlaygroundViewToggle'
import { MobilePlaygroundFilterDrawer } from './MobilePlaygroundFilterDrawer'
import { DesktopPlaygroundFilterPopover, type WipFilter } from './DesktopPlaygroundFilterPopover'
import { ToolTaxonomyFilter } from './ToolTaxonomyFilter'
import { toolMatchesAlgorithm } from './toolFilters'
import { ToolCard, WipBadge } from './views/ToolCard'
import { ToolStack } from './views/ToolStack'
import { ToolTable } from './views/ToolTable'
import { PlaygroundPersonaPathView } from './views/PlaygroundPersonaPathView'
import { PlaygroundNiceView } from './views/PlaygroundNiceView'

// ---------------------------------------------------------------------------
// Persona display metadata
// ---------------------------------------------------------------------------

const PERSONA_META: Record<PersonaId, { label: string; subtitle: string; starterTools: string[] }> =
  {
    executive: {
      label: 'Executive / GRC',
      subtitle: 'Risk & governance focus',
      starterTools: ['hybrid-certs', 'token-migration', 'envelope-encrypt'],
    },
    developer: {
      label: 'Developer / Engineer',
      subtitle: 'Protocol & implementation focus',
      starterTools: ['binary-signing', 'openssl-studio'],
    },
    architect: {
      label: 'Security Architect',
      subtitle: 'Architecture & infrastructure focus',
      starterTools: ['pkcs11-sim', 'envelope-encrypt', 'hybrid-certs'],
    },
    researcher: {
      label: 'Researcher / Academic',
      subtitle: 'Comprehensive deep dive',
      starterTools: ['entropy-test', 'slh-dsa', 'kdf-derivation'],
    },
    ops: {
      label: 'IT Ops / DevOps',
      subtitle: 'Deploy & operate focus',
      starterTools: ['firmware-signing', 'hybrid-certs', 'token-migration'],
    },
    curious: {
      label: 'Curious Explorer',
      subtitle: 'New to cryptography',
      starterTools: ['qrng-demo', 'rng-demo', 'binary-signing'],
    },
  }

const PROFESSIONAL_PERSONA_FILTER_ITEMS = [
  { id: 'All', label: 'All Roles' },
  { id: 'executive', label: 'Executive / GRC' },
  { id: 'developer', label: 'Developer / Engineer' },
  { id: 'architect', label: 'Security Architect' },
  { id: 'ops', label: 'IT Ops / DevOps' },
  { id: 'researcher', label: 'Researcher' },
]

const CURIOUS_PERSONA_FILTER_ITEMS = [
  { id: 'All', label: 'All Paths' },
  { id: 'curious', label: 'Curious Explorer' },
]

// ---------------------------------------------------------------------------
// Banners (preserved from previous implementation)
// ---------------------------------------------------------------------------

const ExecutiveBanner = () => (
  <div className="glass-panel p-5 border-primary/30 space-y-3">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-foreground">Tailored for Executive / GRC</p>
        <p className="text-sm text-muted-foreground mt-1">
          The Crypto Lab demonstrates the technical operations behind PQC migration. For
          business-case framing, compliance deadlines, and risk governance — start with the
          Assessment to get a personalised migration readiness report.
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link
        to="/assess"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground text-sm font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
      >
        Start Assessment <ArrowRight className="w-3.5 h-3.5" />
      </Link>
      <Link
        to="/compliance"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Compliance Tracker
      </Link>
    </div>
    <p className="text-xs text-muted-foreground">
      The 3 tools below give a live side-by-side view of classical vs PQC cryptography — useful for
      board-level demonstrations.
    </p>
  </div>
)

const CuriousStartHere = () => {
  const steps = [
    {
      n: 1,
      id: 'qrng-demo',
      title: 'See where randomness comes from',
      caption:
        'Quantum random numbers — the raw material every encryption key depends on. Watch one being made.',
    },
    {
      n: 2,
      id: 'tls-simulator',
      title: 'Watch a website handshake',
      caption:
        'Every padlock icon hides a 50-millisecond conversation between browser and server. Step through it.',
    },
    {
      n: 3,
      id: 'hybrid-encrypt',
      title: 'Try hybrid (old + new) encryption',
      caption:
        "How the world is migrating: keep today's algorithms running side-by-side with the new quantum-safe ones.",
    },
  ]
  return (
    <div className="glass-panel p-5 border-primary/20 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-semibold text-foreground">Start Here — Curious Explorer</p>
      </div>
      <p className="text-sm text-muted-foreground">
        No cryptography background required. Follow these three steps to understand what quantum
        computing means for everyday security.
      </p>
      <div className="space-y-2">
        {steps.map(({ n, id, title, caption }) => (
          <Link
            key={id}
            to={`/playground/${id}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors group"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
              {n}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary ml-auto shrink-0 mt-0.5 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

const SandboxAccessBanner = () => (
  <div className="glass-panel p-4 border-primary/20 space-y-3">
    <div className="flex items-start gap-3">
      <Container className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-foreground">Container Access Required</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Each Sandbox scenario runs inside an isolated Docker container hosted by PQC Today. To
          enable these scenarios, request access and we will provision your environment — containers
          are spun up on demand and destroyed after the session.
        </p>
      </div>
    </div>
    <a
      href="mailto:pqctoday@gmail.com?subject=Sandbox%20Access%20Request"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium rounded-lg transition-colors border border-primary/20"
    >
      <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      pqctoday@gmail.com — Request access
    </a>
  </div>
)

const PersonaBanner = ({
  persona,
  recommendedCount,
  showingPersona,
  onToggle,
}: {
  persona: PersonaId
  recommendedCount: number
  showingPersona: boolean
  onToggle: () => void
}) => {
  const meta = PERSONA_META[persona]
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground">{meta.label}</span>
          <span className="text-xs text-muted-foreground ml-1.5">· {meta.subtitle}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={onToggle}
        className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
          showingPersona
            ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/10'
            : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
        }`}
      >
        {showingPersona
          ? `Showing ${recommendedCount} recommended`
          : `Show ${recommendedCount} recommended`}
      </Button>
    </div>
  )
}

const HeroCard = ({
  to,
  icon: Icon,
  title,
  description,
  badge,
  wip,
}: {
  to: string
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  wip?: boolean
}) => (
  <Link
    to={to}
    className="glass-panel p-5 flex items-start gap-4 hover:border-primary/60 transition-colors group cursor-pointer"
  >
    <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </p>
        {wip && <WipBadge />}
        {badge && !wip && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </Link>
)

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const PlaygroundWorkshop = () => {
  const isEmbedded = useIsEmbedded()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchText, setSearchText] = useState('')

  // ── URL-driven state ────────────────────────────────────────────────────
  // ?cat=  : category
  // ?view= : view mode (path/stack/cards/table/nice)
  // ?role= : NICE role (handled inside PlaygroundNiceView)
  const activeCategoryFromUrl = searchParams.get('cat')
  const activeCategory: string = activeCategoryFromUrl ?? 'All'
  const setActiveCategory = useCallback(
    (cat: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (cat && cat !== 'All') next.set('cat', cat)
          else next.delete('cat')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // ── Local filter state ──────────────────────────────────────────────────
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [wipFilter, setWipFilter] = useState<WipFilter>(isEmbedded ? 'hide' : 'all')
  const [showPersonaFilter, setShowPersonaFilter] = useState(true)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null)

  // Persona — synced with persona store (mirrors Learn's pattern)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>(
    selectedPersona ?? 'All'
  )
  const isCuriousMode = selectedPersona === 'curious'
  const personaFilterItems = isCuriousMode
    ? CURIOUS_PERSONA_FILTER_ITEMS
    : PROFESSIONAL_PERSONA_FILTER_ITEMS

  // View mode — default 'cards' (preserves the existing visual feel)
  const initialViewMode: PlaygroundViewMode = (() => {
    const v = searchParams.get('view')
    if (v === 'path' || v === 'stack' || v === 'cards' || v === 'table' || v === 'nice') return v
    return 'cards'
  })()
  const [viewMode, setViewMode] = useState<PlaygroundViewMode>(initialViewMode)
  const handleViewModeChange = useCallback(
    (mode: PlaygroundViewMode) => {
      setViewMode(mode)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (mode === 'cards') next.delete('view')
          else next.set('view', mode)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Bookmarks
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)
  const showOnlyPlaygroundTools = useBookmarkStore((s) => s.showOnlyPlaygroundTools)
  const setShowOnlyPlaygroundTools = useBookmarkStore((s) => s.setShowOnlyPlaygroundTools)

  // Persona handler — keeps persona store + local filter in sync
  const handlePersonaFilterChange = useCallback(
    (id: string) => {
      setSelectedPersonaFilter(id)
      setPersona(id === 'All' ? null : (id as PersonaId))
    },
    [setPersona]
  )

  // ── Filter pipeline ─────────────────────────────────────────────────────
  // Persona-recommended pre-filter (when persona banner is "on"). Mirrors the
  // existing behavior: only narrows when no search and no category and no
  // other filter is doing the narrowing itself.
  const personaRecommendedActive =
    showPersonaFilter && !!selectedPersona && !searchText.trim() && activeCategory === 'All'

  const baselineTools = personaRecommendedActive
    ? WORKSHOP_TOOLS.filter((t) => t.recommendedPersonas.includes(selectedPersona))
    : WORKSHOP_TOOLS

  const filteredTools = useMemo(() => {
    let tools = baselineTools
    if (activeCategory !== 'All') tools = tools.filter((t) => t.category === activeCategory)
    if (selectedDifficulty !== 'All')
      tools = tools.filter((t) => t.difficulty === selectedDifficulty)
    if (selectedPersonaFilter !== 'All' && !personaRecommendedActive) {
      tools = tools.filter((t) =>
        t.recommendedPersonas.includes(selectedPersonaFilter as PersonaId)
      )
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.algorithms.some((a) => a.toLowerCase().includes(q)) ||
          t.keywords.some((k) => k.includes(q)) ||
          t.category.toLowerCase().includes(q)
      )
    }
    if (showOnlyPlaygroundTools) tools = tools.filter((t) => myPlaygroundTools.includes(t.id))
    if (wipFilter === 'only') tools = tools.filter((t) => t.wip)
    if (wipFilter === 'hide') tools = tools.filter((t) => !t.wip)
    if (selectedAlgorithm) tools = tools.filter((t) => toolMatchesAlgorithm(t, selectedAlgorithm))
    return tools
  }, [
    baselineTools,
    activeCategory,
    selectedDifficulty,
    selectedPersonaFilter,
    personaRecommendedActive,
    searchText,
    showOnlyPlaygroundTools,
    myPlaygroundTools,
    wipFilter,
    selectedAlgorithm,
  ])

  const recommendedCount = useMemo(() => {
    if (!selectedPersona) return 0
    return WORKSHOP_TOOLS.filter((t) => t.recommendedPersonas.includes(selectedPersona)).length
  }, [selectedPersona])

  // For grouped-by-category Cards layout
  const groupedTools = useMemo(() => {
    const groups: Record<string, WorkshopTool[]> = {}
    for (const cat of CATEGORIES) {
      const tools = filteredTools.filter((t) => t.category === cat)
      if (tools.length > 0) groups[cat] = tools // eslint-disable-line security/detect-object-injection
    }
    return groups
  }, [filteredTools])

  // Active filter count for the popover/drawer badge
  let activeFilterCount = 0
  if (activeCategory !== 'All') activeFilterCount++
  if (selectedDifficulty !== 'All') activeFilterCount++
  if (selectedPersonaFilter !== 'All') activeFilterCount++
  if (wipFilter !== (isEmbedded ? 'hide' : 'all')) activeFilterCount++
  if (selectedAlgorithm) activeFilterCount++

  const filtersActive = activeFilterCount > 0 || searchText.trim() !== ''

  const clearFilters = useCallback(() => {
    setSearchText('')
    setActiveCategory('All')
    setSelectedDifficulty('All')
    setSelectedPersonaFilter('All')
    setPersona(null)
    setWipFilter(isEmbedded ? 'hide' : 'all')
    setSelectedAlgorithm(null)
  }, [isEmbedded, setActiveCategory, setPersona])

  // Curious minimum-viable mode — kept as-is
  const personaDefaults = usePersonaDefaults()
  const curiousMinimalMode = selectedPersona === 'curious' && !personaDefaults.prefsOff

  // Path view is only available when a persona is selected
  const pathAvailable = !!selectedPersona

  // The filter content rendered inside the desktop popover & mobile drawer
  const filterPanelContent = (
    <DesktopPlaygroundFilterPopover
      activeFilterCount={activeFilterCount}
      personaFilterItems={personaFilterItems}
      selectedPersonaFilter={selectedPersonaFilter}
      onPersonaChange={handlePersonaFilterChange}
      selectedCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      selectedDifficulty={selectedDifficulty}
      onDifficultyChange={setSelectedDifficulty}
      wipFilter={wipFilter}
      onWipChange={setWipFilter}
      wipCount={WORKSHOP_TOOLS.filter((t) => t.wip).length}
      onClear={clearFilters}
    />
  )

  return (
    <div>
      <PageHeader
        icon={FlaskConical}
        pageId="playground"
        title="Crypto Lab"
        description="Hands-on cryptographic tools — interactive playground, PKCS#11 HSM, and 25 specialized crypto demos."
        shareTitle="PQC Crypto Lab — Interactive Cryptography in Your Browser"
        shareText="Run real post-quantum cryptographic operations in your browser — key generation, PKCS#11 HSM, ML-KEM, ML-DSA and more via WASM."
      />

      {selectedPersona === 'curious' && (
        <PreviewBanner pageContext="Developer, Architect, Ops, Researcher" />
      )}

      {/* Curious minimum-viable mode — orientation + CTA only */}
      {curiousMinimalMode && (
        <div className="space-y-4 mt-6">
          <CuriousStartHere />
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                personaDefaults.resetToFullSet()
                logEvent('Playground', 'Curious Show Full Catalog', personaLabel())
              }}
              data-testid="playground-show-full-catalog"
            >
              Show full catalog ({WORKSHOP_TOOLS.length} tools)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            The full crypto lab is built for developers, architects, ops, and researchers. The 3
            steps above are the curated entry path for curious users.
          </p>
        </div>
      )}

      {!curiousMinimalMode && (
        <div className="space-y-6 pt-4">
          {/* Persona-specific entry points */}
          {selectedPersona === 'executive' && <ExecutiveBanner />}
          {selectedPersona === 'curious' && <CuriousStartHere />}

          {/* Persona recommended banner (non-executive/curious) */}
          {selectedPersona && selectedPersona !== 'executive' && selectedPersona !== 'curious' && (
            <PersonaBanner
              persona={selectedPersona}
              recommendedCount={recommendedCount}
              showingPersona={personaRecommendedActive}
              onToggle={() => setShowPersonaFilter((v) => !v)}
            />
          )}

          {/* ── Mobile: search + filter drawer ── */}
          <div className="flex md:hidden items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search tools…"
                aria-label="Search tools"
                className="pl-8 h-[44px] text-sm rounded-lg"
              />
            </div>
            <div className="w-[140px] shrink-0">
              <MobilePlaygroundFilterDrawer
                activeFilterCount={activeFilterCount}
                onClearAll={clearFilters}
                filterContent={
                  <div className="space-y-6">
                    {filterPanelContent}
                    <div className="space-y-2 flex flex-col pt-4 border-t border-border/50">
                      <span className="text-sm font-semibold text-foreground">View Mode</span>
                      <PlaygroundViewToggle
                        mode={viewMode}
                        onChange={handleViewModeChange}
                        pathAvailable={pathAvailable}
                      />
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* ── Desktop: controls bar ── */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search tools, algorithms, or keywords…"
                aria-label="Search tools"
                className="pl-8 h-9 text-xs"
              />
            </div>

            {filterPanelContent}

            {myPlaygroundTools.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setShowOnlyPlaygroundTools(!showOnlyPlaygroundTools)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap ${
                  showOnlyPlaygroundTools
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
                aria-pressed={showOnlyPlaygroundTools}
              >
                <BookmarkCheck size={12} />
                My ({myPlaygroundTools.length})
              </Button>
            )}

            <PlaygroundViewToggle
              mode={viewMode}
              onChange={handleViewModeChange}
              pathAvailable={pathAvailable}
            />
          </div>

          {/* Researcher algorithm taxonomy filter — only Stack/Cards modes */}
          {selectedPersona === 'researcher' &&
            (viewMode === 'stack' || viewMode === 'cards' || viewMode === 'table') && (
              <ToolTaxonomyFilter
                selectedAlgorithm={selectedAlgorithm}
                onChange={setSelectedAlgorithm}
              />
            )}

          {/* Results count + clear */}
          {filtersActive && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing{' '}
                <span className="font-semibold text-foreground">{filteredTools.length}</span> of{' '}
                <span className="font-semibold">{WORKSHOP_TOOLS.length}</span> tools
              </span>
              <Button
                variant="link"
                onClick={clearFilters}
                className="p-0 h-auto flex items-center gap-1 font-medium"
              >
                <X size={12} aria-hidden="true" />
                Clear filters
              </Button>
            </div>
          )}

          {/* Hero cards — only on Cards mode without category filter */}
          {viewMode === 'cards' && activeCategory === 'All' && !filtersActive && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Playgrounds
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HeroCard
                  to="/playground/interactive"
                  icon={Play}
                  title="Interactive Playground"
                  description="Key generation, KEM & encryption, signing, hashing, symmetric operations — live via WebAssembly."
                  badge="ML-KEM · ML-DSA · AES"
                />
                <HeroCard
                  to="/playground/hsm"
                  icon={Cpu}
                  title="PKCS#11 HSM Playground"
                  description="Real PKCS#11 v3.2 operations with SoftHSM WASM — dual C++/Rust engine cross-validation and ACVP."
                />
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredTools.length === 0 && (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title={
                searchText ? `No tools match “${searchText}”` : 'No tools match the current filters'
              }
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          )}

          {/* ── View body ── */}
          {filteredTools.length > 0 && (
            <>
              {viewMode === 'path' && selectedPersona && (
                <PlaygroundPersonaPathView personaId={selectedPersona} tools={filteredTools} />
              )}

              {viewMode === 'stack' && (
                <ToolStack
                  tools={filteredTools}
                  baselineTools={baselineTools}
                  onClearFilters={clearFilters}
                />
              )}

              {viewMode === 'cards' && (
                <div className="space-y-8">
                  {CATEGORIES.map((category) => {
                    const tools = groupedTools[category] // eslint-disable-line security/detect-object-injection
                    if (!tools) return null
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {category}
                        </h4>
                        {category === 'Sandbox' && <SandboxAccessBanner />}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tools.map((tool) => (
                            <ToolCard key={tool.id} tool={tool} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {viewMode === 'table' && (
                <>
                  {filteredTools.some((t) => t.category === 'Sandbox') && <SandboxAccessBanner />}
                  <ToolTable tools={filteredTools} />
                </>
              )}

              {viewMode === 'nice' && (
                <PlaygroundNiceView tools={filteredTools} activePersonaId={selectedPersona} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
