// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Play, Cpu, FlaskConical, Sparkles, ArrowRight, BookOpen } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { Input } from '../ui/input'
import { EmptyState } from '../ui/empty-state'
import { WORKSHOP_TOOLS, CATEGORIES, type ToolDifficulty } from './workshopRegistry'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'

// ---------------------------------------------------------------------------
// Difficulty badge
// ---------------------------------------------------------------------------

const DIFFICULTY_STYLES: Record<ToolDifficulty, string> = {
  beginner: 'bg-status-success/10 text-status-success',
  intermediate: 'bg-status-warning/10 text-status-warning',
  advanced: 'bg-status-error/10 text-status-error',
}

const DifficultyBadge = ({ level }: { level: ToolDifficulty }) => (
  <span
    className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_STYLES[level]}`}
  >
    {level}
  </span>
)

// ---------------------------------------------------------------------------
// Persona display metadata
// ---------------------------------------------------------------------------

const PERSONA_META: Record<PersonaId, { label: string; subtitle: string; starterTools: string[] }> =
  {
    executive: {
      label: 'Executive / GRC',
      subtitle: 'Risk & governance focus',
      starterTools: ['pqc-comparison', 'hybrid-certs', 'token-migration'],
    },
    developer: {
      label: 'Developer / Engineer',
      subtitle: 'Protocol & implementation focus',
      starterTools: ['binary-signing', 'hybrid-signing', 'openssl-studio'],
    },
    architect: {
      label: 'Security Architect',
      subtitle: 'Architecture & infrastructure focus',
      starterTools: ['pkcs11-sim', 'envelope-encrypt', 'hybrid-certs'],
    },
    researcher: {
      label: 'Researcher / Academic',
      subtitle: 'Comprehensive deep dive',
      starterTools: ['entropy-test', 'qkd-postproc', 'slh-dsa'],
    },
    ops: {
      label: 'IT Ops / DevOps',
      subtitle: 'Deploy & operate focus',
      starterTools: ['firmware-signing', 'hybrid-certs', 'token-migration'],
    },
    curious: {
      label: 'Curious Explorer',
      subtitle: 'New to cryptography',
      starterTools: ['qkd-postproc', 'qrng-demo', 'pqc-comparison'],
    },
  }

// ---------------------------------------------------------------------------
// Executive-specific callout (no technical tools fit executives — CTA to Assess)
// ---------------------------------------------------------------------------

const ExecutiveBanner = () => (
  <div className="glass-panel p-5 border-primary/30 space-y-3">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-foreground">Tailored for Executive / GRC</p>
        <p className="text-sm text-muted-foreground mt-1">
          The crypto workshop demonstrates the technical operations behind PQC migration. For
          business-case framing, compliance deadlines, and risk governance — start with the
          Assessment to get a personalised migration readiness report.
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link
        to="/assess"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
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

// ---------------------------------------------------------------------------
// Curious Explorer guided start
// ---------------------------------------------------------------------------

const CuriousStartHere = () => {
  const steps = [
    {
      n: 1,
      id: 'pqc-comparison',
      title: 'PQC vs Classical',
      caption:
        "See the difference between today's crypto and quantum-safe algorithms live in your browser.",
    },
    {
      n: 2,
      id: 'qrng-demo',
      title: 'QRNG Demo',
      caption: 'Visualise how randomness underpins all cryptographic security.',
    },
    {
      n: 3,
      id: 'qkd-postproc',
      title: 'QKD Post-Processing',
      caption: 'Simulate the BB84 quantum key distribution protocol step by step.',
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

// ---------------------------------------------------------------------------
// Persona recommended tools banner
// ---------------------------------------------------------------------------

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
      <button
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
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hero cards
// ---------------------------------------------------------------------------

const HeroCard = ({
  to,
  icon: Icon,
  title,
  description,
  badge,
}: {
  to: string
  icon: React.ElementType
  title: string
  description: string
  badge?: string
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
        {badge && (
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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showPersonaFilter, setShowPersonaFilter] = useState(true)

  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const recommendedTools = useMemo(() => {
    if (!selectedPersona) return []
    return WORKSHOP_TOOLS.filter((t) => t.recommendedPersonas.includes(selectedPersona))
  }, [selectedPersona])

  const filteredTools = useMemo(() => {
    let tools =
      showPersonaFilter && selectedPersona && !searchQuery.trim() && !activeCategory
        ? recommendedTools
        : WORKSHOP_TOOLS
    if (activeCategory) tools = tools.filter((t) => t.category === activeCategory)
    if (!searchQuery.trim()) return tools
    const q = searchQuery.toLowerCase()
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.algorithms.some((a) => a.toLowerCase().includes(q)) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.category.toLowerCase().includes(q)
    )
  }, [searchQuery, activeCategory, showPersonaFilter, selectedPersona, recommendedTools])

  const groupedTools = useMemo(() => {
    const groups: Record<string, typeof WORKSHOP_TOOLS> = {}
    for (const cat of CATEGORIES) {
      const tools = filteredTools.filter((t) => t.category === cat)
      if (tools.length > 0) groups[cat] = tools
    }
    return groups
  }, [filteredTools])

  const isPersonaFiltered =
    showPersonaFilter && !!selectedPersona && !searchQuery.trim() && !activeCategory

  return (
    <div>
      <PageHeader
        icon={FlaskConical}
        pageId="playground"
        title="Crypto Workshop"
        description="Hands-on cryptographic tools — interactive playground, PKCS#11 HSM, and 25 specialized crypto demos."
        shareTitle="PQC Crypto Workshop — Interactive Cryptography in Your Browser"
        shareText="Run real post-quantum cryptographic operations in your browser — key generation, PKCS#11 HSM, ML-KEM, ML-DSA and more via WASM."
      />

      <div className="space-y-8">
        {/* Persona-specific entry points */}
        {selectedPersona === 'executive' && <ExecutiveBanner />}
        {selectedPersona === 'curious' && <CuriousStartHere />}

        {/* Persona recommended banner (non-executive/curious) */}
        {selectedPersona && selectedPersona !== 'executive' && selectedPersona !== 'curious' && (
          <PersonaBanner
            persona={selectedPersona}
            recommendedCount={recommendedTools.length}
            showingPersona={isPersonaFiltered}
            onToggle={() => setShowPersonaFilter((v) => !v)}
          />
        )}

        {/* Search + filter */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tools, algorithms, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
              {isPersonaFiltered && (
                <button
                  onClick={() => setShowPersonaFilter(false)}
                  className="ml-2 text-xs text-primary hover:underline"
                >
                  Show all
                </button>
              )}
            </span>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === null
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
              }`}
            >
              All
              <span
                className={`text-[10px] px-1 rounded ${activeCategory === null ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {WORKSHOP_TOOLS.length}
              </span>
            </button>
            {CATEGORIES.map((cat) => {
              const count = WORKSHOP_TOOLS.filter((t) => t.category === cat).length
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
                  }`}
                >
                  {cat}
                  <span
                    className={`text-[10px] px-1 rounded ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hero cards — Playgrounds */}
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
              badge="WIP"
            />
          </div>
        </div>

        {Object.keys(groupedTools).length === 0 && (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title={`No tools match \u201c${searchQuery}\u201d`}
          />
        )}

        {/* Tool grid by category */}
        {CATEGORIES.map((category) => {
          const tools = groupedTools[category]
          if (!tools) return null
          return (
            <div key={category}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <Link
                      key={tool.id}
                      to={`/playground/${tool.id}`}
                      className="glass-panel p-4 h-auto text-left hover:border-primary/40 transition-colors cursor-pointer group items-start justify-start flex"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {tool.name}
                            </p>
                            <DifficultyBadge level={tool.difficulty} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {tool.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tool.algorithms.map((algo) => (
                              <span
                                key={algo}
                                className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {algo}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
