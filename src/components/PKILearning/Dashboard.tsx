// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, BookOpen, Home, PlayCircle, Search, X, CheckSquare } from 'lucide-react'
import clsx from 'clsx'
import { useModuleStore } from '../../store/useModuleStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { MODULE_INDUSTRY_RELEVANCE } from '../../data/personaConfig'
import { PERSONAS, type PersonaId } from '../../data/learningPersonas'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { EmptyState } from '../ui/empty-state'
import { FilterDropdown } from '../common/FilterDropdown'
import { ModuleCard } from './ModuleCard'
import { LearnViewToggle, type LearnViewMode } from './LearnViewToggle'
import { LearnTrackStack } from './LearnTrackStack'
import { ModuleTable, type ModuleTableItem } from './ModuleTable'
import { MODULE_CATALOG, MODULE_TRACKS, MODULE_STEP_COUNTS, MODULE_TO_TRACK } from './moduleData'
import { MobileLearnFilterDrawer } from './MobileLearnFilterDrawer'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import { useIsEmbedded } from '../../embed/EmbedProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LearnSortMode = 'default' | 'alpha' | 'difficulty' | 'duration' | 'recently' | 'status'

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
const STATUS_ORDER: Record<string, number> = { 'in-progress': 0, 'not-started': 1, completed: 2 }

const SORT_OPTIONS: { id: LearnSortMode; label: string }[] = [
  { id: 'default', label: 'Default order' },
  { id: 'alpha', label: 'Name A–Z' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'duration', label: 'Duration (shortest first)' },
  { id: 'recently', label: 'Recently visited' },
  { id: 'status', label: 'Status (in progress first)' },
]

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

const TRACK_FILTER_ITEMS = ['All', ...MODULE_TRACKS.map((t) => t.track)]

const DIFFICULTY_FILTER_ITEMS = ['All', 'beginner', 'intermediate', 'advanced']
const STATUS_FILTER_ITEMS = ['All', 'not-started', 'in-progress', 'completed']

const STATUS_LABELS: Record<string, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

// ---------------------------------------------------------------------------
// LearnSortControl
// ---------------------------------------------------------------------------

const LearnSortControl = ({
  value,
  onChange,
  disabled,
}: {
  value: LearnSortMode
  onChange: (v: LearnSortMode) => void
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const selected = SORT_OPTIONS.find((o) => o.id === value)

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        title={disabled ? 'Sort unavailable in this mode' : undefined}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium transition-colors',
          disabled
            ? 'bg-muted/10 text-muted-foreground/40 cursor-not-allowed'
            : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
        )}
      >
        <ArrowUpDown size={14} aria-hidden="true" />
        <span className="hidden sm:inline">{selected?.label ?? 'Sort'}</span>
      </Button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-label="Sort by"
          tabIndex={0}
          className="absolute top-full right-0 mt-1 w-52 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50"
          onKeyDown={(e) => {
            const options = Array.from(
              e.currentTarget.querySelectorAll('[role="option"]')
            ) as HTMLElement[]
            const idx = options.findIndex((o) => o === document.activeElement)
            if (idx === -1) return
            let next = idx
            if (e.key === 'ArrowDown') next = (idx + 1) % options.length
            else if (e.key === 'ArrowUp') next = (idx - 1 + options.length) % options.length
            else if (e.key === 'Home') next = 0
            else if (e.key === 'End') next = options.length - 1
            else if (e.key === 'Escape') {
              setIsOpen(false)
              return
            } else return
            e.preventDefault()
            options[next].focus()
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <Button
              variant="ghost"
              key={option.id}
              type="button"
              role="option"
              aria-selected={value === option.id}
              onClick={() => {
                onChange(option.id)
                setIsOpen(false)
              }}
              className={clsx(
                'w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors border-b border-border last:border-0',
                value === option.id ? 'text-primary bg-muted/30' : 'text-muted-foreground'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const isEmbedded = useIsEmbedded()
  const { modules } = useModuleStore()

  const activeModules = MODULE_TRACKS.flatMap((t) => t.modules)

  // Single most-recently-visited in-progress module
  const inProgressModules = activeModules
    .filter((m) => modules[m.id]?.status === 'in-progress')
    .sort((a, b) => (modules[b.id]?.lastVisited || 0) - (modules[a.id]?.lastVisited || 0))
  const resumeModule = inProgressModules[0]

  const getProgressPercentage = (moduleId: string): number => {
    const module = modules[moduleId]
    if (!module) return 0
    const totalSteps = MODULE_STEP_COUNTS[moduleId] ?? 4
    return Math.min(100, Math.round((module.completedSteps.length / totalSteps) * 100))
  }

  return (
    <div className="space-y-8">
      {/* Continue Learning — single most-recent in-progress module */}
      {resumeModule && !isEmbedded && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel px-4 py-3 border-primary/30"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <PlayCircle className="text-primary shrink-0" size={18} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Continue Learning
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate">
                    {resumeModule.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(resumeModule.id)}%` }}
                      role="progressbar"
                      aria-label="Module completion progress"
                      aria-valuenow={getProgressPercentage(resumeModule.id)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {getProgressPercentage(resumeModule.id)}% ·{' '}
                    {Math.floor(modules[resumeModule.id]?.timeSpent || 0)} min
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => navigate(resumeModule.id)}
              className="shrink-0"
            >
              Resume
            </Button>
          </div>
        </motion.div>
      )}

      {/* Module Tracks Grid — always visible */}
      <ModuleTracksGrid
        navigate={navigate}
        onGoHome={isEmbedded ? undefined : () => navigate('/')}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ModuleTracksGrid — 3-mode view: Stack / Cards / Table
// ---------------------------------------------------------------------------

const ModuleTracksGrid = ({
  navigate,
  onGoHome,
}: {
  navigate: (path: string) => void
  onGoHome?: () => void
}) => {
  const isEmbedded = useIsEmbedded()
  const { modules } = useModuleStore()
  const { selectedIndustry, experienceLevel, selectedPersona, setPersona } = usePersonaStore()
  const { myLearnModules, showOnlyLearnModules, setShowOnlyLearnModules } = useBookmarkStore()

  // Filter state
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  // Professional personas pre-select their learning path; curious users start with all modules visible to explore, but advanced topics are guarded in the carousel.
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>(
    selectedPersona === 'curious' ? 'All' : (selectedPersona ?? 'All')
  )
  const [sortBy, setSortBy] = useState<LearnSortMode>('default')
  const [viewMode, setViewMode] = useState<LearnViewMode>('stack')

  // Show Curious Explorer path in curious mode (persona or experience level); professionals see professional roles
  const isCuriousMode = selectedPersona === 'curious' || experienceLevel === 'curious'
  const personaFilterItems = isCuriousMode
    ? CURIOUS_PERSONA_FILTER_ITEMS
    : PROFESSIONAL_PERSONA_FILTER_ITEMS

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 150)
    return () => clearTimeout(timer)
  }, [searchText])

  // Dropdown → store: changing role in the grid updates the persona store
  const handlePersonaFilterChange = useCallback(
    (id: string) => {
      setSelectedPersonaFilter(id)
      setPersona(id === 'All' ? null : (id as PersonaId))
    },
    [setPersona]
  )

  const isModuleRelevant = useCallback(
    (moduleId: string): boolean => {
      if (!selectedIndustry) return false
      const relevant = MODULE_INDUSTRY_RELEVANCE[moduleId]
      return relevant === null || (relevant?.includes(selectedIndustry) ?? false)
    },
    [selectedIndustry]
  )

  const isModuleAboveLevel = useCallback(
    (moduleId: string): boolean => {
      // Curious mode (persona OR experience level): all modules have curious-summary.md — no dimming
      if (isCuriousMode) return false
      if (!experienceLevel) return false
      const mod = MODULE_CATALOG[moduleId]
      if (!mod?.difficulty) return false
      if (experienceLevel === 'basics') return mod.difficulty === 'advanced'
      return false
    },
    [isCuriousMode, experienceLevel]
  )

  const allModules = useMemo(() => MODULE_TRACKS.flatMap((t) => t.modules), [])
  const completedCount = allModules.filter((m) => modules[m.id]?.status === 'completed').length
  const inProgressCount = allModules.filter((m) => modules[m.id]?.status === 'in-progress').length
  const touchedCount = completedCount + inProgressCount

  const personaFilterActive = selectedPersonaFilter !== 'All'

  const filtersActive =
    debouncedSearch !== '' ||
    selectedTrack !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedStatus !== 'All' ||
    personaFilterActive ||
    sortBy !== 'default'

  const clearFilters = () => {
    setSearchText('')
    setSelectedTrack('All')
    setSelectedDifficulty('All')
    setSelectedStatus('All')
    setSelectedPersonaFilter('All')
    setPersona(null)
    setSortBy('default')
  }

  // Build flat item list (for Cards and Table modes)
  const flatItems = useMemo<ModuleTableItem[]>(() => {
    if (personaFilterActive) {
      const persona = PERSONAS[selectedPersonaFilter as PersonaId]
      if (!persona) return []
      return persona.pathItems.map((item) => {
        if (item.type === 'module') {
          const mod = MODULE_CATALOG[item.moduleId]
          return {
            kind: 'module' as const,
            module: mod,
            track: MODULE_TO_TRACK[item.moduleId] ?? '',
          }
        }
        return {
          kind: 'checkpoint' as const,
          id: item.id,
          label: item.label,
          categoryCount: item.categories.length,
          categories: item.categories,
        }
      })
    }
    return MODULE_TRACKS.flatMap(({ track, modules: mods }) =>
      mods.map((module) => ({ kind: 'module' as const, module, track }))
    )
  }, [personaFilterActive, selectedPersonaFilter])

  // Apply filters and sort to module items
  const filteredItems = useMemo<ModuleTableItem[]>(() => {
    const needle = debouncedSearch.toLowerCase()

    let filtered = flatItems.filter((item) => {
      if (item.kind === 'checkpoint') return true
      const { module, track } = item
      // In embed mode, WIP modules are never shown — accuracy over completeness
      if (isEmbedded && module.workInProgress) return false
      if (showOnlyLearnModules && !myLearnModules.includes(module.id)) return false
      if (needle && !`${module.title} ${module.description}`.toLowerCase().includes(needle))
        return false
      if (selectedTrack !== 'All' && track !== selectedTrack) return false
      if (selectedDifficulty !== 'All' && (module.difficulty ?? '') !== selectedDifficulty)
        return false
      if (selectedStatus !== 'All') {
        const s = modules[module.id]?.status ?? 'not-started'
        if (s !== selectedStatus) return false
      }
      return true
    })

    if (!personaFilterActive && sortBy !== 'default') {
      const moduleItems = filtered.filter((i) => i.kind === 'module') as Extract<
        ModuleTableItem,
        { kind: 'module' }
      >[]
      moduleItems.sort((a, b) => {
        switch (sortBy) {
          case 'alpha':
            return a.module.title.localeCompare(b.module.title)
          case 'difficulty':
            return (
              (DIFFICULTY_ORDER[a.module.difficulty ?? ''] ?? 99) -
              (DIFFICULTY_ORDER[b.module.difficulty ?? ''] ?? 99)
            )
          case 'duration':
            return parseInt(a.module.duration) - parseInt(b.module.duration)
          case 'recently':
            return (
              (modules[b.module.id]?.lastVisited ?? 0) - (modules[a.module.id]?.lastVisited ?? 0)
            )
          case 'status': {
            const sa = modules[a.module.id]?.status ?? 'not-started'
            const sb = modules[b.module.id]?.status ?? 'not-started'
            return (STATUS_ORDER[sa] ?? 99) - (STATUS_ORDER[sb] ?? 99)
          }
          default:
            return 0
        }
      })
      filtered = moduleItems
    }

    return filtered
  }, [
    flatItems,
    debouncedSearch,
    selectedTrack,
    selectedDifficulty,
    selectedStatus,
    sortBy,
    personaFilterActive,
    modules,
    showOnlyLearnModules,
    myLearnModules,
    isEmbedded,
  ])

  // For stack mode: which module IDs pass the current filters
  const filteredModuleIds = useMemo<Set<string>>(() => {
    const needle = debouncedSearch.toLowerCase()
    return new Set(
      allModules
        .filter((m) => {
          if (showOnlyLearnModules && !myLearnModules.includes(m.id)) return false
          if (needle && !`${m.title} ${m.description}`.toLowerCase().includes(needle)) return false
          if (selectedDifficulty !== 'All' && (m.difficulty ?? '') !== selectedDifficulty)
            return false
          if (selectedStatus !== 'All') {
            const s = modules[m.id]?.status ?? 'not-started'
            if (s !== selectedStatus) return false
          }
          if (personaFilterActive) {
            const persona = PERSONAS[selectedPersonaFilter as PersonaId]
            if (persona && !persona.recommendedPath.includes(m.id)) return false
          }
          return true
        })
        .map((m) => m.id)
    )
  }, [
    debouncedSearch,
    selectedDifficulty,
    selectedStatus,
    personaFilterActive,
    selectedPersonaFilter,
    allModules,
    modules,
    showOnlyLearnModules,
    myLearnModules,
  ])

  const moduleItemCount = filteredItems.filter((i) => i.kind === 'module').length
  const totalModuleCount = allModules.length

  // Navigate to quiz with pre-selected categories
  const navigateToQuiz = useCallback(
    (categories: string[]) => {
      navigate(`/learn/quiz?category=${categories.join(',')}`)
    },
    [navigate]
  )

  // In stack mode, Track filter is hidden (the stack itself is the track navigator)
  const showTrackFilter = viewMode !== 'stack'
  // Sort is disabled in stack mode and when persona filter active
  const sortDisabled = viewMode === 'stack' || personaFilterActive

  let activeFilterCount = 0
  if (selectedTrack !== 'All') activeFilterCount++
  if (selectedDifficulty !== 'All') activeFilterCount++
  if (selectedStatus !== 'All') activeFilterCount++
  if (personaFilterActive) activeFilterCount++

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="mb-2 md:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient flex items-center gap-2">
            <BookOpen className="text-primary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
            Learning Workshops
          </h2>
          <p className="hidden lg:block text-muted-foreground">
            Interactive hands-on workshops to master cryptographic concepts.
          </p>
        </div>
        {onGoHome && (
          <Button variant="outline" size="sm" onClick={onGoHome}>
            <Home size={14} className="mr-1.5" />
            Personalize from home
          </Button>
        )}
      </div>

      {/* Progress overview strip */}
      {touchedCount > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <BookOpen size={12} aria-hidden="true" />
          <span>{totalModuleCount} modules</span>
          <span className="text-border">·</span>
          <span className="text-status-success">{completedCount} completed</span>
          <span className="text-border">·</span>
          <span className="text-status-info">{inProgressCount} in progress</span>
          <span className="text-border">·</span>
          <span>{totalModuleCount - touchedCount} not started</span>
        </p>
      )}

      {/* Desktop Profile Banner */}
      <div className="hidden md:flex justify-between items-center bg-muted/10 p-3 rounded-lg border border-border/50">
        <span className="text-sm font-medium text-foreground">Learning Journey Profile:</span>
        <FilterDropdown
          items={personaFilterItems}
          selectedId={selectedPersonaFilter}
          onSelect={handlePersonaFilterChange}
          defaultLabel={isCuriousMode ? 'All Paths' : 'All Roles'}
          noContainer
        />
      </div>

      {/* Mobile Search & Filter Drawer */}
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
            placeholder="Search modules…"
            aria-label="Search modules"
            className="pl-8 h-[44px] text-sm rounded-lg"
          />
        </div>
        <div className="w-[140px] shrink-0">
          <MobileLearnFilterDrawer
            activeFilterCount={activeFilterCount}
            onClearAll={clearFilters}
            filterContent={
              <div className="space-y-6">
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Learning Profile</span>
                  <FilterDropdown
                    items={personaFilterItems}
                    selectedId={selectedPersonaFilter}
                    onSelect={handlePersonaFilterChange}
                    defaultLabel={isCuriousMode ? 'All Paths' : 'All Roles'}
                    noContainer
                  />
                </div>
                {showTrackFilter && (
                  <div className="space-y-2 flex flex-col">
                    <span className="text-sm font-semibold text-foreground">Track</span>
                    <FilterDropdown
                      items={TRACK_FILTER_ITEMS}
                      selectedId={selectedTrack}
                      onSelect={setSelectedTrack}
                      defaultLabel="All Tracks"
                      noContainer
                    />
                  </div>
                )}
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Difficulty</span>
                  <FilterDropdown
                    items={DIFFICULTY_FILTER_ITEMS.map((d) => ({
                      id: d,
                      label: d === 'All' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1),
                    }))}
                    selectedId={selectedDifficulty}
                    onSelect={setSelectedDifficulty}
                    defaultLabel="All Levels"
                    noContainer
                  />
                </div>
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Status</span>
                  <FilterDropdown
                    items={STATUS_FILTER_ITEMS.map((s) => ({
                      id: s,
                      label: s === 'All' ? 'All Statuses' : (STATUS_LABELS[s] ?? s),
                    }))}
                    selectedId={selectedStatus}
                    onSelect={setSelectedStatus}
                    defaultLabel="All Statuses"
                    noContainer
                  />
                </div>
                <div className="space-y-2 flex flex-col pt-4 border-t border-border/50">
                  <span className="text-sm font-semibold text-foreground">Sort By</span>
                  <LearnSortControl value={sortBy} onChange={setSortBy} disabled={sortDisabled} />
                </div>
                <div className="space-y-2 flex flex-col pt-4 border-t border-border/50">
                  <span className="text-sm font-semibold text-foreground">View Mode</span>
                  <LearnViewToggle mode={viewMode} onChange={setViewMode} />
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Desktop Controls bar */}
      <div className="hidden md:flex flex-wrap items-center gap-2">
        {/* Search */}
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
            placeholder="Search modules…"
            aria-label="Search modules"
            className="pl-8 h-9 text-xs"
          />
        </div>

        {/* Track filter — hidden in stack mode */}
        {showTrackFilter && (
          <FilterDropdown
            items={TRACK_FILTER_ITEMS}
            selectedId={selectedTrack}
            onSelect={setSelectedTrack}
            defaultLabel="All Tracks"
            noContainer
          />
        )}

        {/* Difficulty */}
        <FilterDropdown
          items={DIFFICULTY_FILTER_ITEMS.map((d) => ({
            id: d,
            label: d === 'All' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1),
          }))}
          selectedId={selectedDifficulty}
          onSelect={setSelectedDifficulty}
          defaultLabel="All Levels"
          noContainer
        />

        {/* Status */}
        <FilterDropdown
          items={STATUS_FILTER_ITEMS.map((s) => ({
            id: s,
            label: s === 'All' ? 'All Statuses' : (STATUS_LABELS[s] ?? s),
          }))}
          selectedId={selectedStatus}
          onSelect={setSelectedStatus}
          defaultLabel="All Statuses"
          noContainer
        />

        {/* Sort — hidden in stack mode, disabled when persona active */}
        {viewMode !== 'stack' && (
          <LearnSortControl value={sortBy} onChange={setSortBy} disabled={sortDisabled} />
        )}

        {/* My Modules filter toggle */}
        {myLearnModules.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => setShowOnlyLearnModules(!showOnlyLearnModules)}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap ${
              showOnlyLearnModules
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
            aria-pressed={showOnlyLearnModules}
          >
            <CheckSquare size={12} />
            My ({myLearnModules.length})
          </Button>
        )}

        {/* View toggle */}
        <LearnViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Results count + clear (only in cards/table modes or when filters active in stack) */}
      {filtersActive && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {viewMode !== 'stack' && (
            <span>
              Showing <span className="font-semibold text-foreground">{moduleItemCount}</span> of{' '}
              <span className="font-semibold">{totalModuleCount}</span> modules
              {personaFilterActive && (
                <span className="text-secondary ml-1">
                  · {personaFilterItems.find((p) => p.id === selectedPersonaFilter)?.label} path
                </span>
              )}
            </span>
          )}
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

      {/* Empty state (cards/table only) */}
      {viewMode !== 'stack' && moduleItemCount === 0 && (
        <EmptyState
          icon={<Search size={32} />}
          title="No modules match your filters"
          description="Try adjusting the search text or filter criteria."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      )}

      {/* ── Stack mode ── */}
      {viewMode === 'stack' && (
        <LearnTrackStack
          navigate={navigate}
          navigateToQuiz={navigateToQuiz}
          filteredModuleIds={filteredModuleIds}
          isModuleRelevant={isModuleRelevant}
          isModuleAboveLevel={isModuleAboveLevel}
          onClearFilters={clearFilters}
        />
      )}

      {/* ── Cards mode ── */}
      {viewMode === 'cards' && moduleItemCount > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {personaFilterActive ? (
              /* Persona path with interleaved checkpoints */
              <div className="space-y-4">
                {filteredItems.map((item, idx) => {
                  if (item.kind === 'checkpoint') {
                    return (
                      <Button
                        variant="ghost"
                        key={item.id}
                        onClick={() => navigateToQuiz(item.categories)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-secondary/40 hover:border-secondary/70 hover:bg-secondary/5 transition-all text-left group"
                      >
                        <span className="text-xs font-mono uppercase tracking-widest text-secondary whitespace-nowrap shrink-0">
                          Quiz Checkpoint
                        </span>
                        <span className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors flex-1 min-w-0 truncate">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {item.categoryCount} topics
                        </span>
                      </Button>
                    )
                  }
                  return (
                    <ModuleCard
                      key={`${item.module.id}-${idx}`}
                      module={item.module}
                      onSelectModule={(id) => navigate(id)}
                      isRelevant={isModuleRelevant(item.module.id)}
                      isAboveLevel={isModuleAboveLevel(item.module.id)}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {(
                  filteredItems.filter((i) => i.kind === 'module') as Extract<
                    ModuleTableItem,
                    { kind: 'module' }
                  >[]
                ).map((item) => (
                  <ModuleCard
                    key={item.module.id}
                    module={item.module}
                    onSelectModule={(id) => navigate(id)}
                    isRelevant={isModuleRelevant(item.module.id)}
                    isAboveLevel={isModuleAboveLevel(item.module.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Table mode ── */}
      {viewMode === 'table' && moduleItemCount > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModuleTable
              items={filteredItems}
              navigate={navigate}
              navigateToQuiz={navigateToQuiz}
              isModuleRelevant={isModuleRelevant}
              isModuleAboveLevel={isModuleAboveLevel}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
