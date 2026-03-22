// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  Cpu,
  Lightbulb,
  Network,
  Server,
  Layers,
  Briefcase,
  Brain,
  ClipboardList,
  Factory,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/button'
import { ModuleCard } from './ModuleCard'
import { CuriousStackCarousel } from './common/CuriousStackCarousel'
import { usePersonaStore } from '../../store/usePersonaStore'
import { MODULE_TRACKS, TRACK_COLORS } from './moduleData'
import type { ModuleItem } from './ModuleCard'

// ---------------------------------------------------------------------------
// Track → quiz category mapping
// ---------------------------------------------------------------------------

export const TRACK_QUIZ_CATEGORIES: Record<string, string[]> = {
  'Role Guides': ['pqc-fundamentals', 'quantum-threats', 'migration-planning'],
  Foundations: [
    'pqc-fundamentals',
    'quantum-threats',
    'algorithm-families',
    'nist-standards',
    'entropy-randomness',
  ],
  Strategy: [
    'hybrid-crypto',
    'crypto-agility',
    'data-asset-sensitivity',
    'standards-bodies',
    'migration-planning',
  ],
  Protocols: [
    'tls-basics',
    'vpn-ssh-pqc',
    'email-signing',
    'api-security-jwt',
    'protocol-integration',
    'web-gateway-pqc',
    'network-security-pqc',
    'pqc-testing-validation',
  ],
  'Hardware Infrastructure': [
    'hsm-pqc',
    'kms-pqc',
    'qkd',
    'key-management',
    'secure-boot-pqc',
    'confidential-computing',
  ],
  'Software Infrastructure': [
    'pki-infrastructure',
    'stateful-signatures',
    'merkle-tree-certs',
    'crypto-dev-apis',
    'secrets-management-pqc',
    'database-encryption-pqc',
    'os-pqc',
  ],
  Applications: [
    'digital-id',
    'code-signing',
    'iot-ot-pqc',
    'ai-security-pqc',
    'platform-eng-pqc',
    'iam-pqc',
  ],
  Executive: [
    'pqc-risk-management',
    'pqc-business-case',
    'pqc-governance',
    'vendor-risk',
    'migration-program',
    'compliance-strategy',
    'compliance',
  ],
  Industries: [
    'digital-assets',
    '5g-security',
    'energy-utilities-pqc',
    'healthcare-pqc',
    'aerospace-pqc',
    'automotive-pqc',
    'emv-payment-pqc',
    'iot-ot-pqc',
    'industry-threats',
  ],
}

// ---------------------------------------------------------------------------
// Track metadata
// ---------------------------------------------------------------------------

const TRACK_META: {
  track: string
  icon: React.ElementType
  description: string
  colorClass: string
  activeClass: string
}[] = [
  {
    track: 'Role Guides',
    icon: Compass,
    description: 'Role-specific quantum impact: why it matters, what to learn, how to act',
    colorClass: 'from-accent/15 to-accent/5 border-accent/30',
    activeClass: 'bg-card border-accent/60',
  },
  {
    track: 'Foundations',
    icon: BookOpen,
    description: 'Quantum threats, PQC fundamentals, entropy & randomness',
    colorClass: 'from-primary/15 to-primary/5 border-primary/30',
    activeClass:
      'bg-card border-primary/60 shadow-[0_0_12px_rgba(var(--primary-rgb,99,102,241),0.3)]',
  },
  {
    track: 'Strategy',
    icon: Lightbulb,
    description: 'Hybrid crypto, crypto agility, data sensitivity, standards bodies',
    colorClass: 'from-secondary/15 to-secondary/5 border-secondary/30',
    activeClass:
      'bg-card border-secondary/60 shadow-[0_0_12px_rgba(var(--secondary-rgb,139,92,246),0.3)]',
  },
  {
    track: 'Protocols',
    icon: Network,
    description:
      'TLS, VPN/SSH, email signing, API security & JWT, web gateways, network security, PQC testing & validation',
    colorClass: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30',
    activeClass: 'bg-card border-sky-500/60',
  },
  {
    track: 'Hardware Infrastructure',
    icon: Cpu,
    description: 'HSMs, KMS, QKD, secure boot & firmware, confidential computing & TEEs',
    colorClass: 'from-amber-500/20 to-orange-400/10 border-amber-500/30',
    activeClass: 'bg-card border-amber-500/60',
  },
  {
    track: 'Software Infrastructure',
    icon: Server,
    description:
      'PKI, secrets management, stateful sigs, Merkle tree certs, crypto APIs, database encryption, OS PQC',
    colorClass: 'from-amber-400/15 to-yellow-400/10 border-amber-400/30',
    activeClass: 'bg-card border-amber-400/60',
  },
  {
    track: 'Applications',
    icon: Layers,
    description: 'Digital ID, code signing, IoT/OT, AI security, platform engineering, IAM',
    colorClass: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    activeClass: 'bg-card border-emerald-500/60',
  },
  {
    track: 'Executive',
    icon: Briefcase,
    description: 'Risk management, business case, governance, compliance, vendor risk, migration',
    colorClass: 'from-rose-500/20 to-red-500/10 border-rose-500/30',
    activeClass: 'bg-card border-rose-500/60',
  },
  {
    track: 'Industries',
    icon: Factory,
    description:
      'Digital assets, 5G, energy, healthcare, aerospace, automotive, EMV payments \u2014 sector-specific PQC',
    colorClass: 'from-orange-500/20 to-amber-400/10 border-orange-500/30',
    activeClass: 'bg-card border-orange-500/60',
  },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LearnTrackStackProps {
  navigate: (id: string) => void
  navigateToQuiz: (categories: string[]) => void
  filteredModuleIds: Set<string>
  isModuleRelevant: (id: string) => boolean
  isModuleAboveLevel: (id: string) => boolean
  onClearFilters?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LearnTrackStack: React.FC<LearnTrackStackProps> = ({
  navigate,
  navigateToQuiz,
  filteredModuleIds,
  isModuleRelevant,
  isModuleAboveLevel,
  onClearFilters,
}) => {
  const [activeTrack, setActiveTrack] = useState<string | null>(null)

  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isCuriousMode = experienceLevel === 'curious' || selectedPersona === 'curious'

  const handleSelectTrack = (track: string) => {
    setActiveTrack((prev) => (prev === track ? null : track))
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 p-4 md:p-6 bg-card border border-border rounded-2xl shadow-lg relative">
        {/* Vertical connection line */}
        <div className="absolute left-10 top-10 bottom-10 w-px bg-gradient-to-b from-primary/20 via-muted-foreground/10 to-muted-foreground/5 z-0 hidden md:block" />

        {/* Track rows */}
        {TRACK_META.map((meta, index) => {
          const trackData = MODULE_TRACKS.find((t) => t.track === meta.track)
          const allModules: ModuleItem[] = trackData?.modules ?? []
          const visibleModules = allModules.filter((m) => filteredModuleIds.has(m.id))
          const totalCount = allModules.length
          const filteredCount = visibleModules.length
          const isActive = activeTrack === meta.track
          const isFaded = activeTrack !== null && !isActive
          const isHidden = filteredCount === 0
          const trackColorBadge = TRACK_COLORS[meta.track] ?? 'bg-muted text-muted-foreground'
          const quizCategories = TRACK_QUIZ_CATEGORIES[meta.track] ?? []
          const Icon = meta.icon

          return (
            <div
              key={meta.track}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectTrack(meta.track)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectTrack(meta.track)
                }
              }}
              className={`
                group relative z-10 w-full flex flex-col items-stretch p-4 md:px-6 rounded-xl
                transition-all duration-300 ease-in-out cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${
                  isActive
                    ? meta.activeClass
                    : isHidden
                      ? 'bg-muted/10 border border-border/40 hover:scale-[1.005]'
                      : `bg-gradient-to-r ${meta.colorClass} hover:scale-[1.005] hover:brightness-105`
                }
                ${isFaded ? 'opacity-40' : 'opacity-100'}
              `}
              style={{ zIndex: isActive ? TRACK_META.length + 10 : TRACK_META.length - index }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </div>

              {/* Row 1: icon + name + badges */}
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/30 shrink-0">
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? 'text-foreground'
                          : isHidden
                            ? 'text-muted-foreground/40 transition-colors'
                            : 'text-muted-foreground group-hover:text-foreground transition-colors'
                      }
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`font-bold text-sm transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : isHidden
                            ? 'text-muted-foreground/50'
                            : 'text-foreground/80 group-hover:text-foreground'
                      }`}
                    >
                      {meta.track}
                    </h4>
                    <p
                      className={`text-xs hidden md:block mt-0.5 truncate transition-colors ${isHidden ? 'text-muted-foreground/30' : 'text-muted-foreground'}`}
                    >
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* Right-side badges */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  {/* Module count */}
                  <span className="text-xs px-2 py-1 rounded-full bg-background/50 text-muted-foreground border border-border/40 tabular-nums">
                    {totalCount} modules
                  </span>

                  {/* Hidden · Restore badge */}
                  {filteredCount < totalCount && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearFilters?.()
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 transition-colors tabular-nums"
                    >
                      {totalCount - filteredCount} hidden · Restore
                    </button>
                  )}

                  {/* Per-track quiz button */}
                  {quizCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigateToQuiz(quizCategories)
                      }}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors
                        ${trackColorBadge} border-current/30 hover:opacity-80`}
                    >
                      <ClipboardList size={11} aria-hidden="true" />
                      Quiz
                    </button>
                  )}

                  {/* Expand status */}
                  <div
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-background/80 text-foreground border-border'
                        : 'bg-background/40 text-muted-foreground border-transparent group-hover:border-border/50'
                    }`}
                  >
                    {isActive ? 'Expanded' : 'Click to expand'}
                  </div>
                </div>
              </div>

              {/* Mobile-only: module count + restore button + expand chevron */}
              <div className="flex md:hidden items-center justify-between mt-1.5 gap-2">
                <span className="text-xs text-muted-foreground/70 tabular-nums">
                  {filteredCount < totalCount
                    ? `${filteredCount} / ${totalCount} modules`
                    : `${totalCount} modules`}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {filteredCount < totalCount && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearFilters?.()
                      }}
                      className="text-xs px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 transition-colors tabular-nums"
                    >
                      Restore
                    </button>
                  )}
                  {isActive ? (
                    <ChevronDown size={14} className="text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </div>

              {/* Row 2: expanded content — module card grid */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      role="presentation"
                      className="mt-4 pt-4 border-t border-border/30 w-full"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {visibleModules.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No modules match the current filters.
                        </p>
                      ) : isCuriousMode ? (
                        <CuriousStackCarousel modules={visibleModules} />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {visibleModules.map((module) => (
                            <ModuleCard
                              key={module.id}
                              module={module}
                              onSelectModule={(id) => navigate(id)}
                              isRelevant={isModuleRelevant(module.id)}
                              isAboveLevel={isModuleAboveLevel(module.id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Quiz this track button */}
                      {quizCategories.length > 0 && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateToQuiz(quizCategories)}
                          >
                            <ClipboardList size={14} className="mr-1.5" aria-hidden="true" />
                            Quiz this track →
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {/* Knowledge Check (PQC Quiz) — direct navigation, no expand step */}
        {(() => {
          const isFaded = activeTrack !== null
          return (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('quiz')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('quiz')
                }
              }}
              className={`
                group relative z-10 w-full flex items-center p-4 md:px-6 rounded-xl
                transition-all duration-300 ease-in-out cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/25 hover:scale-[1.005] hover:brightness-105
                ${isFaded ? 'opacity-40' : 'opacity-100'}
              `}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-background/50 border border-border/30 shrink-0">
                    <Brain
                      size={20}
                      className="text-muted-foreground group-hover:text-secondary transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                      Knowledge Check
                    </h4>
                    <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
                      Full PQC quiz across all tracks and topics
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
