// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, LayoutGrid, List, Bookmark, SlidersHorizontal, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import type { PersonaId } from '@/data/learningPersonas'
import type { NiceProficiencyTier } from '@/data/niceFramework'
import { useModuleStore } from '@/store/useModuleStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useModuleTopicKeywords } from '@/hooks/useModuleTopicKeywords'
import { getNiceMapping } from '@/data/niceModuleMapping'
import { ModuleCard } from '../ModuleCard'
import { NiceView } from '../NiceView'
import { ResearcherTaxonomyFilter, type TaxonomySelection } from '../ResearcherTaxonomyFilter'
import { modulesByAlgorithm, modulesByStandard } from '../moduleEnrichment'
import { MODULE_TRACKS, MODULE_TO_TRACK, TRACK_COLORS } from '../moduleData'
import {
  BROWSE_ALL,
  BROWSE_SORT_ITEMS,
  BROWSE_STATUS_ITEMS,
  NICE_AFFINITY_PERSONAS,
  TOTAL_MODULE_COUNT,
  filterAndSortModules,
  resolveBrowseTrack,
  type BrowseSortMode,
} from './learnRedesign.helpers'

const TIER_LEVELS: Record<NiceProficiencyTier, number> = {
  awareness: 0,
  practitioner: 1,
  expert: 2,
}
const TIERS: { id: NiceProficiencyTier; label: string }[] = [
  { id: 'awareness', label: 'Awareness' },
  { id: 'practitioner', label: 'Practitioner' },
  { id: 'expert', label: 'Expert' },
]

function passesTier(moduleId: string, maxTier: NiceProficiencyTier): boolean {
  const m = getNiceMapping(moduleId)
  if (!m) return true
  return TIER_LEVELS[m.tier] <= TIER_LEVELS[maxTier]
}

/**
 * "Browse all" — answers "where's that one module?". The full catalog grouped by
 * track, with search/status/sort/saved filtering, a grid↔list density toggle, and
 * the power-user axes (NICE proficiency, researcher taxonomy, the workforce lens)
 * in an opt-in Advanced tray. The workforce (NICE) lens is auto-surfaced in the
 * main bar for the Executive, GRC and Researcher roles (Decision 1; GRC added
 * 2026-09-07 alongside the Executive/GRC persona split).
 */
export const BrowseAllView = ({
  personaId,
  initialNiceMode = false,
  initialTrack,
}: {
  personaId: PersonaId | null
  /** Land directly on the workforce (NICE) lens — used by the ?view=nice redirect. */
  initialNiceMode?: boolean
  /** Preset the track filter (from the ?track= deep link). Ignored if unknown. */
  initialTrack?: string
}) => {
  const navigate = useNavigate()
  const modules = useModuleStore((s) => s.modules)
  const myLearnModules = useBookmarkStore((s) => s.myLearnModules)

  const [search, setSearch] = useState('')
  // Curated per-module topic keywords (e.g. "Purdue model" for IoT & OT), loaded lazily on the
  // first search; until they arrive, title + description still match.
  const hasSearch = search.trim().length > 0
  const topicKeywords = useModuleTopicKeywords(hasSearch)
  const [status, setStatus] = useState(BROWSE_ALL)
  const [sort, setSort] = useState<BrowseSortMode>('default')
  const [track, setTrack] = useState(() => resolveBrowseTrack(initialTrack))
  const [savedOnly, setSavedOnly] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [advancedOpen, setAdvancedOpen] = useState(initialNiceMode)
  const [niceMode, setNiceMode] = useState(initialNiceMode)
  const [tier, setTier] = useState<NiceProficiencyTier>('expert')
  const [taxonomy, setTaxonomy] = useState<TaxonomySelection>({ algorithm: null, standard: null })

  const niceAffinity = personaId != null && NICE_AFFINITY_PERSONAS.has(personaId)
  // The browse-by-algorithm / standard taxonomy serves both roles that read
  // modules against a specification: researcher and cert-engineer.
  const showTaxonomyFilter = personaId === 'researcher' || personaId === 'cert-engineer'

  const taxonomyIds = useMemo<Set<string> | null>(() => {
    if (taxonomy.algorithm) return new Set(modulesByAlgorithm(taxonomy.algorithm))
    if (taxonomy.standard) return new Set(modulesByStandard(taxonomy.standard))
    return null
  }, [taxonomy])

  const savedSet = useMemo(() => new Set(myLearnModules), [myLearnModules])

  // The workforce proficiency tier and the algorithm / standard taxonomy are desktop-only
  // narrowing; the phone catalogue shares everything else through filterAndSortModules.
  const matches = useMemo(
    () =>
      filterAndSortModules({
        tracks: MODULE_TRACKS,
        search,
        topicKeywords,
        track,
        status,
        sort,
        savedOnly,
        savedIds: savedSet,
        progress: modules,
        extraFilter: (id) => passesTier(id, tier) && (!taxonomyIds || taxonomyIds.has(id)),
      }),
    [search, status, sort, track, savedOnly, savedSet, tier, taxonomyIds, modules, topicKeywords]
  )

  const shownCount = matches.reduce((n, g) => n + g.modules.length, 0)
  const trackChips = [BROWSE_ALL, ...MODULE_TRACKS.map((t) => t.track)]

  const WorkforceToggle = (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={niceMode}
      onClick={() => setNiceMode((v) => !v)}
      className={`gap-1.5 text-xs border ${
        niceMode
          ? 'border-primary/40 text-primary bg-primary/10'
          : 'border-border text-muted-foreground'
      }`}
    >
      <Network size={14} aria-hidden="true" />
      Workforce view
    </Button>
  )

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="glass-panel rounded-xl p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules — try 'TLS' or 'HSM'"
              aria-label="Search modules"
              className="pl-8 h-8 text-xs"
            />
          </div>
          <FilterDropdown
            items={BROWSE_STATUS_ITEMS}
            selectedId={status}
            onSelect={setStatus}
            size="sm"
            defaultLabel="All statuses"
          />
          <FilterDropdown
            items={BROWSE_SORT_ITEMS}
            selectedId={sort}
            onSelect={(id) => setSort(id as BrowseSortMode)}
            size="sm"
            defaultLabel="Recommended"
          />
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{shownCount}</span> of{' '}
              {TOTAL_MODULE_COUNT}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
              className={`gap-1.5 text-xs ${savedOnly ? 'text-status-warning' : 'text-muted-foreground'}`}
            >
              <Bookmark size={14} fill={savedOnly ? 'currentColor' : 'none'} aria-hidden="true" />
              Saved ({myLearnModules.length})
            </Button>
            <div className="flex items-center border border-border rounded-md p-0.5">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
                className={`h-6 px-2 ${view === 'grid' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <LayoutGrid size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="List view"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                className={`h-6 px-2 ${view === 'list' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <List size={14} />
              </Button>
            </div>
            {niceAffinity && WorkforceToggle}
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={advancedOpen}
              onClick={() => setAdvancedOpen((v) => !v)}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              Advanced
            </Button>
          </div>
        </div>

        {/* Track chips */}
        <div className="flex flex-wrap gap-1.5">
          {trackChips.map((t) => {
            const active = track === t
            const count =
              t === BROWSE_ALL
                ? TOTAL_MODULE_COUNT
                : (MODULE_TRACKS.find((x) => x.track === t)?.modules.length ?? 0)
            return (
              <Button
                key={t}
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setTrack(t)}
                className={`h-auto text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? `${TRACK_COLORS[t] ?? 'bg-primary/10 text-primary'} border-transparent`
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === BROWSE_ALL ? 'All tracks' : t} · {count}
              </Button>
            )
          })}
        </div>

        {/* Advanced tray */}
        {advancedOpen && (
          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                NICE proficiency
              </span>
              {TIERS.map((t) => (
                <Button
                  key={t.id}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setTier(t.id)}
                  className={`h-auto text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    tier === t.id
                      ? 'border-primary/40 text-primary bg-primary/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </Button>
              ))}
              {!niceAffinity && WorkforceToggle}
            </div>
            {showTaxonomyFilter && (
              <ResearcherTaxonomyFilter selection={taxonomy} onChange={setTaxonomy} />
            )}
            <p className="text-[11px] text-muted-foreground">
              These power-user filters are opt-in, so newcomers never meet the jargon on first
              paint.
            </p>
          </div>
        )}
      </div>

      {/* Body: workforce lens OR the catalog */}
      {niceMode ? (
        <NiceView navigate={(id: string) => navigate(id)} activePersonaId={personaId} />
      ) : shownCount === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-sm text-muted-foreground">
          No modules match your filters.
        </div>
      ) : view === 'grid' ? (
        <div className="space-y-6">
          {matches.map((g) => (
            <div key={g.track}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${TRACK_COLORS[g.track] ?? 'bg-primary/40'}`}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-foreground">{g.track}</h3>
                <span className="text-xs text-muted-foreground">{g.modules.length}</span>
              </div>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
                {g.modules.map((m) => (
                  <ModuleCard
                    key={m.id}
                    module={m}
                    onSelectModule={(id) => navigate(`/learn/${id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-xl divide-y divide-border">
          {matches
            .flatMap((g) => g.modules)
            .map((m) => {
              const st = modules[m.id]?.status ?? 'not-started'
              return (
                <Button
                  key={m.id}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => navigate(`/learn/${m.id}`)}
                  className="h-auto w-full flex items-center justify-start gap-3 px-4 py-2.5 text-left whitespace-normal rounded-none hover:bg-muted/30 transition-colors"
                >
                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                    {MODULE_TO_TRACK[m.id]}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0 w-20 hidden md:inline">
                    {st === 'completed' ? 'Completed' : st === 'in-progress' ? 'In progress' : '—'}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0 capitalize hidden md:inline">
                    {m.difficulty ?? ''}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{m.duration}</span>
                </Button>
              )
            })}
        </div>
      )}
    </div>
  )
}
