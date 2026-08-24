// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search, Wrench, Filter } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { Input } from '../ui/input'
import { EmptyState } from '../ui/empty-state'
import {
  BUSINESS_TOOLS,
  BUSINESS_CATEGORIES,
  type BusinessToolAudience,
} from './businessToolsRegistry'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CSWP39_ZONE_ORDER, CSWP39_ZONE_DETAILS, type ZoneId } from '@/data/cswp39ZoneData'
import { PHASE_ORDER, FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { Cswp39SectionBadge } from './widgets/Cswp39SectionBadge'
import { logBusinessToolsSearch, logBusinessToolsFilter } from '@/utils/analytics'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileBusinessToolsView } from '@/components/Mobile/screens/MobileBusinessToolsView'

// Badge shown only for the non-default (technical) audiences, so an executive can
// tell at a glance which tools are meant for architects/developers. Business/GRC
// tools — the vast majority — carry no badge (they are the expected default).
const AUDIENCE_BADGE: Record<Exclude<BusinessToolAudience, 'business'>, string> = {
  architect: 'For architects',
  developer: 'For developers',
}

// A recommended starting sequence for an executive, so the toolbox reads as a
// path rather than an unordered A-Z list. Each id resolves to a real tool.
const START_HERE: { step: number; label: string; id: string }[] = [
  { step: 1, label: 'Business case', id: 'roi-calculator' },
  { step: 2, label: 'Risk', id: 'risk-register' },
  { step: 3, label: 'Governance', id: 'raci-builder' },
  { step: 4, label: 'Roadmap', id: 'roadmap-builder' },
  { step: 5, label: 'Verify', id: 'migration-verification' },
]

// Every tool already carries CSWP.39 zone / framework-phase / audience metadata
// in the registry — these facets expose it in the grid's filter UI (additive,
// on top of the existing category + text search).
const ZONE_FILTER_ITEMS = [
  { id: 'all', label: 'All Zones' },
  ...CSWP39_ZONE_ORDER.map((z) => ({ id: z, label: CSWP39_ZONE_DETAILS[z].title })),
]
const PHASE_FILTER_ITEMS = [
  { id: 'all', label: 'All Phases' },
  ...PHASE_ORDER.map((p) => ({ id: p, label: FRAMEWORK_PHASES[p].name })),
]
const AUDIENCE_FILTER_ITEMS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Audiences' },
  { id: 'business', label: 'Business / GRC' },
  { id: 'architect', label: 'Architect' },
  { id: 'developer', label: 'Developer' },
]

/** Query-param names for the grid's five facets, plus the grouping mode. */
const PARAM = {
  q: 'q',
  category: 'cat',
  zone: 'zone',
  phase: 'phase',
  audience: 'audience',
  group: 'group',
} as const

// WS6c: the zone/phase metadata every tool already carries was only ever
// exposed as a *filter* (narrow to one zone, lose everything else). Grouping
// is the other half — see the whole catalogue organized by zone or phase at
// once, the same way it's always been organized by category. `groupBy`
// defaults to 'category' so today's view is unchanged unless a visitor
// explicitly asks for the other lens.
type GroupMode = 'category' | 'phase' | 'zone'
const GROUP_MODE_ITEMS: { id: GroupMode; label: string }[] = [
  { id: 'category', label: 'Category' },
  { id: 'phase', label: 'Framework phase' },
  { id: 'zone', label: 'CSWP.39 zone' },
]

export const BusinessToolsGrid = () => {
  const isMobileShell = useIsMobileShell()
  // WS6b (2026-08-02) — all five facets live in the URL. They were local
  // useState, so no filtered view of the Command Center was linkable,
  // shareable, or reachable from another surface: the grid filtered correctly
  // and then threw the result away on navigation. Mirrors the `update()`
  // pattern in Algorithms/IndustryLandscapeView.tsx, including `replace: true`
  // so filtering does not stack history entries.
  const [searchParams, setSearchParams] = useSearchParams()

  const searchQuery = searchParams.get(PARAM.q) ?? ''
  const activeCategory = searchParams.get(PARAM.category)
  const zoneFilter = (searchParams.get(PARAM.zone) ?? 'all') as 'all' | ZoneId
  const phaseFilter = (searchParams.get(PARAM.phase) ?? 'all') as 'all' | PhaseId
  const audienceFilter = (searchParams.get(PARAM.audience) ?? 'all') as 'all' | BusinessToolAudience
  const groupBy = (searchParams.get(PARAM.group) ?? 'category') as GroupMode

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(updates)) {
            // `all` and empty string are the defaults — omit them so a default
            // view has a clean URL rather than ?zone=all&phase=all&...
            if (v === null || v === '' || v === 'all') next.delete(k)
            else next.set(k, v)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setSearchQuery = useCallback((v: string) => update({ [PARAM.q]: v }), [update])
  const setActiveCategory = useCallback(
    (v: string | null) => update({ [PARAM.category]: v }),
    [update]
  )
  const setZoneFilter = useCallback((v: 'all' | ZoneId) => update({ [PARAM.zone]: v }), [update])
  const setPhaseFilter = useCallback((v: 'all' | PhaseId) => update({ [PARAM.phase]: v }), [update])
  const setAudienceFilter = useCallback(
    (v: 'all' | BusinessToolAudience) => update({ [PARAM.audience]: v }),
    [update]
  )
  // 'category' is the default lens (matches every prior release), so it is
  // omitted from the URL the same way 'all' is for the other facets — a
  // default view keeps a clean URL.
  const setGroupBy = useCallback(
    (v: GroupMode) => update({ [PARAM.group]: v === 'category' ? null : v }),
    [update]
  )

  useEffect(() => {
    if (!searchQuery.trim()) return
    const t = window.setTimeout(() => logBusinessToolsSearch(searchQuery), 600)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return BUSINESS_TOOLS.filter((t) => {
      const matchesCategory = !activeCategory || t.category === activeCategory
      const matchesZone = zoneFilter === 'all' || t.cswp39Zone === zoneFilter
      const matchesPhase = phaseFilter === 'all' || t.frameworkPhase === phaseFilter
      const matchesAudience =
        audienceFilter === 'all' || (t.audience ?? 'business') === audienceFilter
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.category.toLowerCase().includes(q)
      return matchesCategory && matchesZone && matchesPhase && matchesAudience && matchesSearch
    })
  }, [searchQuery, activeCategory, zoneFilter, phaseFilter, audienceFilter])

  // Section order + label per grouping mode. `frameworkPhase`/`cswp39Zone` are
  // required (non-optional) fields on every BusinessTool — verified against
  // businessToolsRegistry.tsx — so grouping by either needs no "uncategorized"
  // fallback bucket the way an optional field would.
  const groupSections: { key: string; label: string }[] = useMemo(() => {
    if (groupBy === 'phase') {
      return PHASE_ORDER.map((p) => ({ key: p, label: FRAMEWORK_PHASES[p].name }))
    }
    if (groupBy === 'zone') {
      return CSWP39_ZONE_ORDER.map((z) => ({ key: z, label: CSWP39_ZONE_DETAILS[z].title }))
    }
    return BUSINESS_CATEGORIES.map((c) => ({ key: c, label: c }))
  }, [groupBy])

  const groupKeyFor = useCallback(
    (t: (typeof filteredTools)[number]): string =>
      groupBy === 'phase' ? t.frameworkPhase : groupBy === 'zone' ? t.cswp39Zone : t.category,
    [groupBy]
  )

  const groupedTools: Record<string, typeof filteredTools> = {}
  for (const section of groupSections) {
    const tools = filteredTools.filter((t) => groupKeyFor(t) === section.key)
    if (tools.length > 0) groupedTools[section.key] = tools
  }

  // mobile-ux-layer Phase 9: placed after every hook above (React rules; the
  // desktop-only ones just run and are discarded) but before the desktop
  // JSX — a pure early return with zero risk to the flag-off path (Rule 1).
  // BusinessToolsGrid takes no simEmbed-style prop and is never rendered
  // inside the simulation, so this needs no second guard.
  if (isMobileShell) {
    return <MobileBusinessToolsView />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        icon={Wrench}
        title="Business Tools"
        description="Interactive planning and governance tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, and more."
      />

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search business tools"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (activeCategory !== null) logBusinessToolsFilter(null)
              setActiveCategory(null)
            }}
            aria-pressed={activeCategory === null}
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
              {BUSINESS_TOOLS.length}
            </span>
          </Button>
          {BUSINESS_CATEGORIES.map((cat) => {
            const count = BUSINESS_TOOLS.filter((t) => t.category === cat).length
            const isActive = activeCategory === cat
            return (
              <Button
                variant="ghost"
                key={cat}
                onClick={() => {
                  const next = isActive ? null : cat
                  logBusinessToolsFilter(next)
                  setActiveCategory(next)
                }}
                aria-pressed={isActive}
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
              </Button>
            )
          })}
        </div>

        {/* Zone / phase / audience facets — same registry metadata each tool card
            already carries, just exposed as filters (additive to category + text). */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <FilterDropdown
            items={ZONE_FILTER_ITEMS}
            selectedId={zoneFilter}
            onSelect={(id) => {
              logBusinessToolsFilter(id === 'all' ? null : `zone:${id}`)
              setZoneFilter(id as 'all' | ZoneId)
            }}
            label="Zone"
            size="sm"
            noContainer
            className="max-md:[&_button]:min-h-[44px]"
          />
          <FilterDropdown
            items={PHASE_FILTER_ITEMS}
            selectedId={phaseFilter}
            onSelect={(id) => {
              logBusinessToolsFilter(id === 'all' ? null : `phase:${id}`)
              setPhaseFilter(id as 'all' | PhaseId)
            }}
            label="Phase"
            size="sm"
            noContainer
            className="max-md:[&_button]:min-h-[44px]"
          />
          <FilterDropdown
            items={AUDIENCE_FILTER_ITEMS}
            selectedId={audienceFilter}
            onSelect={(id) => {
              logBusinessToolsFilter(id === 'all' ? null : `audience:${id}`)
              setAudienceFilter(id as 'all' | BusinessToolAudience)
            }}
            label="Audience"
            size="sm"
            noContainer
            className="max-md:[&_button]:min-h-[44px]"
          />
        </div>

        {/* WS6c: how the grid is sectioned — independent of the facets above,
            which narrow WHICH tools show; this changes how the remaining
            ones are organized into headed groups. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Group by</span>
          {GROUP_MODE_ITEMS.map((mode) => (
            <Button
              key={mode.id}
              variant="ghost"
              onClick={() => setGroupBy(mode.id)}
              aria-pressed={groupBy === mode.id}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors max-md:min-h-[44px] ${
                groupBy === mode.id
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground border-border hover:text-foreground hover:border-border/60'
              }`}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Start-here sequence — only on the unfiltered view, so it reads as a
          suggested path without fighting an active search/category. */}
      {!searchQuery.trim() && !activeCategory && (
        <div className="glass-panel p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            New here? Start with the essentials
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {START_HERE.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <Link
                  to={`/business/tools/${s.id}`}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-primary/40 hover:text-primary transition-colors max-md:min-h-[44px]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {s.step}
                  </span>
                  {s.label}
                </Link>
                {i < START_HERE.length - 1 && (
                  <span className="text-muted-foreground" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {Object.keys(groupedTools).length === 0 && (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title={`No tools match \u201c${searchQuery}\u201d`}
        />
      )}

      {/* Tool grid, sectioned per the active Group-by mode */}
      {groupSections.map((section) => {
        const tools = groupedTools[section.key]
        if (!tools) return null
        return (
          <div key={section.key}>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {section.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.id}
                    to={`/business/tools/${tool.id}`}
                    className="glass-panel p-4 h-auto text-left hover:border-primary/40 transition-colors cursor-pointer group items-start justify-start flex"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {tool.name}
                          </p>
                          {tool.audience && tool.audience !== 'business' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary/10 text-secondary shrink-0">
                              {}
                              {AUDIENCE_BADGE[tool.audience]}
                            </span>
                          )}
                          {/* Standards provenance — the registry comment's
                              "small provenance chip on each tool card", which
                              had never actually been rendered here. Renders
                              spans only, so it stays a11y-safe inside the Link. */}
                          <Cswp39SectionBadge
                            sectionRef={tool.cswp39SectionRef}
                            subSection={tool.cswp39SubSection}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {tool.description}
                        </p>
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
  )
}
