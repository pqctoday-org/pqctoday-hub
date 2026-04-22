// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  ArrowRightLeft,
  AlertTriangle,
  Globe,
  Users,
  Plus,
  Bug,
  Database,
  Shield,
  Info,
} from 'lucide-react'
import clsx from 'clsx'
import { useVersionStore, getCurrentVersion } from '../../store/useVersionStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { PERSONAS, type PersonaId } from '../../data/learningPersonas'
import { Button } from './button'
import { StatusBadge } from '../common/StatusBadge'
import {
  getDataSourceSummaries,
  filterSummariesForPersona,
  type DataSourceSummary,
  type DataChangeItem,
} from '../../utils/dataFingerprint'
import {
  ALL_CHANGELOG_VERSIONS,
  compareChangelogVersion,
  type ChangelogEntry,
  type ChangelogSection,
  type SectionType,
} from '../../utils/changelogParser'

// ── Icon map for data sources ───────────────────────────────────────────────

const SOURCE_ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  ArrowRightLeft,
  AlertTriangle,
  Globe,
  Users,
}

const SECTION_ICONS: Record<SectionType, typeof Plus> = {
  added: Plus,
  changed: Sparkles,
  fixed: Bug,
  data: Database,
  security: Shield,
  other: Sparkles,
}

const SECTION_COLORS: Record<SectionType, string> = {
  added: 'text-success',
  changed: 'text-primary',
  fixed: 'text-warning',
  data: 'text-status-info',
  security: 'text-status-error',
  other: 'text-muted-foreground',
}

const MAX_VISIBLE_ITEMS = 10

// ── Changelog helpers ───────────────────────────────────────────────────────

function getUnseenChangelogSections(
  lastSeenVersion: string | null,
  personaId: PersonaId | null
): ChangelogSection[] {
  // Collect entries from all versions newer than lastSeenVersion. Treat the
  // literal `Unreleased` as newer than any released version so in-progress
  // entries are surfaced automatically.
  const unseenVersions = lastSeenVersion
    ? ALL_CHANGELOG_VERSIONS.filter((v) => compareChangelogVersion(v.version, lastSeenVersion) > 0)
    : ALL_CHANGELOG_VERSIONS.slice(0, 1) // fallback: show latest only

  // Merge all sections across unseen versions
  const mergedSections = new Map<SectionType, ChangelogEntry[]>()
  for (const v of unseenVersions) {
    for (const section of v.sections) {
      const existing = mergedSections.get(section.type) ?? []
      existing.push(...section.entries)
      mergedSections.set(section.type, existing)
    }
  }

  // Filter by persona if set
  const sections: ChangelogSection[] = []
  for (const [type, entries] of mergedSections) {
    const filtered = personaId
      ? entries.filter(
          (e) =>
            e.meta.personas.length === 0 ||
            e.meta.personas.includes('all') ||
            e.meta.personas.includes(personaId)
        )
      : entries
    if (filtered.length > 0) {
      sections.push({ type, entries: filtered })
    }
  }

  return sections
}

// ── Component ───────────────────────────────────────────────────────────────

export const WhatsNewModal = () => {
  const { getChangedSources, lastSeenVersion, markAllSeen } = useVersionStore()
  const { selectedPersona, selectedIndustries } = usePersonaStore()
  const navigate = useNavigate()
  const version = getCurrentVersion()

  const [isVisible, setIsVisible] = useState(false)
  const [openedImperatively, setOpenedImperatively] = useState(false)
  const [showAllPersona, setShowAllPersona] = useState(false)
  const [showPersonaInfo, setShowPersonaInfo] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedItemLists, setExpandedItemLists] = useState<Record<string, boolean>>({})
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  // Determine effective persona for filtering
  const effectivePersona = showAllPersona ? null : selectedPersona

  // Compute data summaries
  const dataSummaries = useMemo((): DataSourceSummary[] => {
    const changedSources = getChangedSources()
    if (changedSources.length === 0) return []
    const raw = getDataSourceSummaries(changedSources)
    return filterSummariesForPersona(
      raw,
      effectivePersona as PersonaId | null,
      selectedIndustries ?? []
    )
  }, [getChangedSources, effectivePersona, selectedIndustries])

  // When opened imperatively (button click), always show current version — pass null
  // so getUnseenChangelogSections falls back to ALL_CHANGELOG_VERSIONS.slice(0, 1)
  const effectiveLastSeen = openedImperatively ? null : lastSeenVersion

  // Compute changelog sections
  const changelogSections = useMemo(
    () => getUnseenChangelogSections(effectiveLastSeen, effectivePersona as PersonaId | null),
    [effectiveLastSeen, effectivePersona]
  )

  // Unfiltered totals — always computed with null persona/industries
  const allChangelogSections = useMemo(
    () => getUnseenChangelogSections(effectiveLastSeen, null),
    [effectiveLastSeen]
  )

  const rawDataSummaries = useMemo((): DataSourceSummary[] => {
    const changedSources = getChangedSources()
    if (changedSources.length === 0) return []
    return getDataSourceSummaries(changedSources)
  }, [getChangedSources])

  const hasContent = dataSummaries.length > 0 || changelogSections.length > 0

  // ── Visibility logic ────────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('whatsnew')) {
      useVersionStore.getState().resetForTesting()
    }

    const timer = setTimeout(() => {
      // Read fresh state at callback time — persist middleware rehydrates asynchronously,
      // so closure values from the initial render may still hold defaults.
      const state = useVersionStore.getState()

      let tourCompleted = false
      try {
        tourCompleted = !!localStorage.getItem('pqc-tour-completed')
      } catch {
        // localStorage unavailable — suppress modal
      }

      // First-visit: surface the latest changes once instead of silently
      // seeding the fingerprint. Wait for the tour to finish so the two
      // overlays don't fight for attention. The modal's own dismiss handler
      // calls markAllSeen(), so this only fires on the very first session.
      if (state.isFirstVisit) {
        if (tourCompleted) {
          setIsVisible(true)
        }
        return
      }

      if (tourCompleted && (state.hasUnseenChanges() || !state.hasSeenCurrentVersion())) {
        setIsVisible(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // ── Imperative open via store (e.g. "What's New" button in About page) ─
  // Note: Zustand v5 removed prevState from subscribe — check state directly
  useEffect(() => {
    const unsub = useVersionStore.subscribe((state) => {
      if (state.showWhatsNew) {
        setOpenedImperatively(true)
        setIsVisible(true)
        state.clearShowWhatsNew()
      }
    })
    return unsub
  }, [])

  // ── Focus trap ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isVisible) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the modal after a frame to let it render
      requestAnimationFrame(() => {
        modalRef.current?.focus()
      })
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isVisible])

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setOpenedImperatively(false)
    markAllSeen()
  }, [markAllSeen])

  const handleItemClick = useCallback(
    (deepLink: string) => {
      markAllSeen()
      setIsVisible(false)
      navigate(deepLink)
    },
    [markAllSeen, navigate]
  )

  const handleViewChangelog = useCallback(() => {
    markAllSeen()
    setIsVisible(false)
    navigate(version ? `/changelog#v${version}` : '/changelog')
  }, [markAllSeen, navigate, version])

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] })) // eslint-disable-line security/detect-object-injection
  }, [])

  const toggleItemList = useCallback((key: string) => {
    setExpandedItemLists((prev) => ({ ...prev, [key]: !prev[key] })) // eslint-disable-line security/detect-object-injection
  }, [])

  // ── Keyboard handler ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isVisible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, handleDismiss])

  // ── Render ────────────────────────────────────────────────────────────

  if (!isVisible || !hasContent) return null

  const personaLabel = selectedPersona
    ? (PERSONAS[selectedPersona]?.label ?? selectedPersona) // eslint-disable-line security/detect-object-injection
    : null

  const totalEntries = changelogSections.reduce((sum, s) => sum + s.entries.length, 0)

  // Counts for the persona filtering indicator
  const filteredAppCount = totalEntries
  const filteredDataCount = dataSummaries.reduce((sum, s) => sum + s.items.length, 0)
  const totalAppCount = allChangelogSections.reduce((sum, s) => sum + s.entries.length, 0)
  const totalDataCount = rawDataSummaries.reduce((sum, s) => sum + s.items.length, 0)
  const showCounts =
    !showAllPersona &&
    !!selectedPersona &&
    (filteredAppCount < totalAppCount || filteredDataCount < totalDataCount)

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop — absolute in embed so it doesn't exceed iframe bounds */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 z-overlay bg-black/60 print:hidden`}
            onClick={handleDismiss}
            aria-hidden="true"
          />

          {/* Modal — standalone uses flex centering wrapper; embed uses positionStyle directly */}
          <div
            className={clsx(!isEmbedded && 'fixed inset-0 flex items-center justify-center p-4')}
            style={!isEmbedded ? { zIndex: 9999 } : undefined}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg max-h-[90dvh] sm:max-h-[80dvh] flex flex-col glass-panel border border-primary/30 shadow-lg shadow-primary/10 print:hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="whats-new-modal-title"
              tabIndex={-1}
              style={isEmbedded ? { zIndex: 9999, ...positionStyle } : undefined}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-4 pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Sparkles size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 id="whats-new-modal-title" className="font-bold text-foreground text-base">
                      What's New
                    </h2>
                    <span className="text-xs font-mono text-primary font-semibold">v{version}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  aria-label="Close what's new"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Persona indicator */}
              {selectedPersona && (
                <div className="shrink-0 border-b border-border text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-y-1 px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {showAllPersona ? (
                        'Showing all updates'
                      ) : (
                        <>
                          Updates for{' '}
                          <span className="font-medium text-foreground">{personaLabel}</span>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => setShowPersonaInfo((prev) => !prev)}
                        aria-label={showPersonaInfo ? 'Hide filtering info' : 'How filtering works'}
                        className={clsx(
                          'ml-0.5 p-1.5 -m-1 transition-colors rounded',
                          showPersonaInfo
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Info size={14} />
                      </Button>
                      {showCounts && (
                        <>
                          <span className="text-muted-foreground/40 select-none">·</span>
                          <span className="tabular-nums">
                            <span className="text-primary/80">{filteredAppCount}</span>
                            <span className="text-muted-foreground/50">/{totalAppCount}</span> app
                          </span>
                          <span className="text-muted-foreground/40 select-none">·</span>
                          <span className="tabular-nums">
                            <span className="text-status-info/80">{filteredDataCount}</span>
                            <span className="text-muted-foreground/50">/{totalDataCount}</span> data
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAllPersona((prev) => !prev)}
                      className="text-primary hover:text-primary/80 transition-colors underline"
                    >
                      {showAllPersona ? 'Filter for me' : 'Show all'}
                    </Button>
                  </div>
                  {showPersonaInfo && (
                    <div className="px-4 pb-3 pt-2 space-y-1.5 border-t border-border/50 bg-muted/20 text-muted-foreground">
                      <p>
                        Showing updates tagged for{' '}
                        <span className="font-medium text-foreground">{personaLabel}</span> plus
                        universal updates (not tagged to any specific persona).
                      </p>
                      <p>
                        Data updates (library, standards, migration catalog) are further narrowed by
                        your selected industries when applicable.
                      </p>
                      <p>
                        Use <span className="font-medium text-foreground">Show all</span> to see
                        every update regardless of persona.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-3">
                {/* App update entries from CHANGELOG */}
                {changelogSections.length > 0 && (
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSection('changelog')}
                      className="flex items-center gap-2 w-full text-left py-1.5 group"
                    >
                      <Sparkles size={14} className="text-primary shrink-0" />
                      <span className="text-sm font-semibold text-foreground flex-1">
                        App Updates
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {totalEntries}
                      </span>
                      {expandedSections['changelog'] ? (
                        <ChevronUp size={14} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={14} className="text-muted-foreground" />
                      )}
                    </Button>

                    {expandedSections['changelog'] && (
                      <div className="mt-1 space-y-2 pl-1">
                        {changelogSections.map((section) => {
                          const SectionIcon = SECTION_ICONS[section.type]
                          const colorClass = SECTION_COLORS[section.type]
                          return (
                            <div key={section.type}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <SectionIcon size={12} className={colorClass} />
                                <span
                                  className={clsx('text-xs font-medium capitalize', colorClass)}
                                >
                                  {section.type}
                                </span>
                              </div>
                              <ul className="space-y-0.5 pl-4">
                                {section.entries.map((entry, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground py-0.5">
                                    <span className="font-medium text-foreground">
                                      {entry.title}
                                    </span>
                                    {entry.body && (
                                      <span className="ml-1 opacity-70">
                                        —{' '}
                                        {entry.body.length > 100
                                          ? entry.body.slice(0, 97) + '...'
                                          : entry.body}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Data source sections */}
                {dataSummaries.map((summary) => {
                  const Icon = SOURCE_ICONS[summary.iconName] ?? BookOpen
                  const isExpanded = expandedSections[summary.sourceId] ?? false
                  const isItemListExpanded = expandedItemLists[summary.sourceId] ?? false
                  const visibleItems = isItemListExpanded
                    ? summary.items
                    : summary.items.slice(0, MAX_VISIBLE_ITEMS)
                  const hasOverflow = summary.items.length > MAX_VISIBLE_ITEMS

                  return (
                    <div key={summary.sourceId}>
                      {/* Source header (clickable to expand) */}
                      <Button
                        variant="ghost"
                        onClick={() => toggleSection(summary.sourceId)}
                        className="flex items-center gap-2 w-full text-left py-1.5 group"
                      >
                        <Icon size={14} className="text-primary shrink-0" />
                        <span className="text-sm font-semibold text-foreground flex-1">
                          {summary.label}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {summary.newCount > 0 && (
                            <span className="text-success">{summary.newCount} new</span>
                          )}
                          {summary.newCount > 0 && summary.updatedCount > 0 && ', '}
                          {summary.updatedCount > 0 && (
                            <span className="text-primary">{summary.updatedCount} updated</span>
                          )}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={14} className="text-muted-foreground" />
                        )}
                      </Button>

                      {/* Expanded item list */}
                      {isExpanded && (
                        <div className="mt-1 space-y-0.5 pl-1">
                          {visibleItems.map((item) => (
                            <DataChangeRow
                              key={item.id}
                              item={item}
                              isExpanded={expandedItem === item.id}
                              onToggle={() =>
                                setExpandedItem((prev) => (prev === item.id ? null : item.id))
                              }
                              onNavigate={handleItemClick}
                            />
                          ))}
                          {hasOverflow && (
                            <Button
                              variant="ghost"
                              onClick={() => toggleItemList(summary.sourceId)}
                              className="text-xs text-primary hover:text-primary/80 pl-2 py-1 transition-colors"
                            >
                              {isItemListExpanded
                                ? 'Show fewer'
                                : `Show all ${summary.items.length} items`}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* No persona hint */}
                {!selectedPersona && (
                  <p className="text-xs text-muted-foreground italic pt-2">
                    Select a persona on the landing page to see personalized updates.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 p-3 sm:p-4 pt-3 border-t border-border shrink-0">
                <Button
                  variant="ghost"
                  onClick={handleViewChangelog}
                  className="text-sm text-primary hover:text-primary/80 transition-colors underline"
                >
                  View Full Changelog
                </Button>
                <div className="flex-1" />
                <Button variant="gradient" size="sm" onClick={handleDismiss}>
                  Got it
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ── Subcomponent: single data change row with inline expand ─────────────────

function DataChangeRow({
  item,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  item: DataChangeItem
  isExpanded: boolean
  onToggle: () => void
  onNavigate: (deepLink: string) => void
}) {
  const hasPreview = item.description || item.organization || item.date || item.tags?.length

  return (
    <div>
      <Button
        variant="ghost"
        onClick={hasPreview ? onToggle : () => onNavigate(item.deepLink)}
        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-muted/30 transition-colors group"
      >
        <StatusBadge status={item.status} size="sm" />
        <span className="text-xs text-foreground flex-1 truncate" title={item.label}>
          {item.label}
        </span>
        {hasPreview ? (
          isExpanded ? (
            <ChevronUp size={12} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground shrink-0" />
          )
        ) : (
          <ExternalLink
            size={12}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          />
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && hasPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/20 rounded-md p-2.5 mt-1 mb-1 mx-2 text-xs space-y-1.5">
              {item.description && (
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap text-muted-foreground">
                {item.organization && <span className="font-medium">{item.organization}</span>}
                {item.organization && item.date && <span>·</span>}
                {item.date && <span>{item.date}</span>}
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => onNavigate(item.deepLink)}
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium pt-0.5"
              >
                Go to resource
                <ExternalLink size={10} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
