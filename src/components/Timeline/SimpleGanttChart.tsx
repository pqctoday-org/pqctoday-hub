// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react'
import { useSearchParams } from 'react-router'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Flag,
  Layers,
  Filter,
  Download,
  Link2,
  Check,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { GanttCountryData, TimelinePhase, TimelineEvent, Phase } from '../../types/timeline'
import {
  phaseColors,
  getCountryLastVerified,
  eventLinkKey,
  findEventInGantt,
  phaseRowKey,
  GANTT_PHASE_TYPES,
  DEFAULT_GANTT_VIEW,
  readGanttViewParams,
  writeGanttViewParams,
  type GanttViewState,
  type ResolvedTimelineEvent,
} from '../../data/timelineData'
import { GanttDetailPopover } from './GanttDetailPopover'
import { DocumentTable } from './DocumentTable'
import type { TimelineDocumentRow } from './TimelineDocumentDetailPopover'
import { logEvent, logTimelineFilterText } from '../../utils/analytics'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '../../utils/endorsement'
import { CountryFlag } from '../common/CountryFlag'
import { FilterDropdown } from '../common/FilterDropdown'
import { StatusBadge } from '../common/StatusBadge'
import {
  filterGanttView,
  eventsInView,
  phaseOrgs,
  timelineRowDomId,
} from '../../data/timelineViewFilter'
import { TIMELINE_REGION_LABELS } from './timelineRegions'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { TIMELINE_CSV_COLUMNS } from '@/utils/csvExportConfigs'

import { FilterChip } from '../common/FilterChip'
import { Button } from '@/components/ui/button'
import { OPEN_ENDED_NOTE } from '@/utils/timelinePeriod'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'

interface SimpleGanttChartProps {
  data: GanttCountryData[]
  regionFilter: string
  onRegionSelect: (id: string) => void
  regionItems: Array<{ id: string; label: string }>
  selectedCountry: string
  onCountrySelect: (id: string) => void
  countryItems: Array<{ id: string; label: string; icon: React.ReactNode | null }>
  searchText?: string
  onSearchChange?: (text: string) => void
  myCountries?: string[]
  onToggleMyCountry?: (name: string) => void
  showOnlyMyCountries?: boolean
  onSetShowOnlyMyCountries?: (val: boolean) => void
  /**
   * Resets every filter in ONE URL write (the page's own Clear-all). Without
   * it, Clear-all falls back to the individual callbacks above.
   */
  onClearAll?: () => void
  /** When true, renders headless inside the simulation (Controls toolbar hidden). */
  embedded?: boolean
  /** Label shown in the scope chip when `embedded` (e.g. "Germany"). */
  scopeLabel?: string
  /** Year treated as "now" for current-year + elapsed-milestone state. Defaults to the real current year. */
  asOfYear?: number
  /** Lower-cased semantic-search hit ids for `searchText` (TimelineView), or null. */
  semanticHits?: readonly string[] | null
}

// The year axis auto-scales to whatever's actually in view (see `yearRange` below)
// instead of a fixed window — a hardcoded 2024–2035 clamp squashed every 2035+
// deadline (EU/JP/KR/UK, and any future later date) onto the same edge column with
// no breathing room. These are just the floor for the fallback/minimum span.
const YEAR_AXIS_PAD_END = 2
const YEAR_AXIS_MIN_SPAN = 6
const PHASE_ORDER = [
  'Guidance',
  'Policy',
  'Regulation',
  'Research',
  'Discovery',
  'Testing',
  'POC',
  'Migration',
  'Standardization',
  'Deadline',
]

export const SimpleGanttChart = ({
  data,
  regionFilter,
  onRegionSelect,
  regionItems,
  selectedCountry,
  onCountrySelect,
  countryItems,
  searchText = '',
  onSearchChange,
  myCountries = [],
  onToggleMyCountry,
  showOnlyMyCountries = false,
  onSetShowOnlyMyCountries,
  onClearAll,
  embedded = false,
  scopeLabel,
  asOfYear,
  semanticHits = null,
}: SimpleGanttChartProps) => {
  const currentYear = asOfYear ?? new Date().getFullYear()
  const [localSearchText, setLocalSearchText] = useState(searchText)
  const filterText = onSearchChange ? searchText : localSearchText

  const handleFilterTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (onSearchChange) {
      onSearchChange(val)
    } else {
      setLocalSearchText(val)
    }
  }
  const [countryCopied, setCountryCopied] = useState(false)
  // ?event=<event_id> deep-links the milestone/phase detail popover so it can be
  // shared/bookmarked. Resolved by event_id first, then by ANY event's title
  // (old title links keep working), so events that aren't first in their
  // grouped row are reachable too, and the popover shows the linked event.
  // Disabled when embedded in the sim so it never writes the /simulation route
  // (the popover then stays pure local state).
  const [searchParams, setSearchParams] = useSearchParams()
  const resolveEventPhase = useCallback(
    (param: string | null): ResolvedTimelineEvent | null => findEventInGantt(data, param),
    [data]
  )
  const [selection, setSelection] = useState<ResolvedTimelineEvent | null>(() =>
    embedded ? null : resolveEventPhase(searchParams.get('event'))
  )
  const selectedPhase = selection?.phase ?? null
  // Last ?event value this component wrote itself — anything else arriving in
  // the URL is a deep link (or back/forward) and gets scrolled to.
  const lastWrittenEventRef = useRef<string | null>(null)
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)
  useScrollToDeepLinkTarget(scrollTarget, scrollTarget ? deepLinkSelector(scrollTarget) : null)
  const writeEventParam = useCallback(
    (key: string | null, { push }: { push: boolean }) => {
      if (embedded) return
      lastWrittenEventRef.current = key
      setSearchParams(
        (sp) => {
          const params = new URLSearchParams(sp)
          if (key) params.set('event', key)
          else params.delete('event')
          return params
        },
        { replace: !push }
      )
    },
    [embedded, setSearchParams]
  )
  // Phase-type / event-type filters, the Deadlines toggle and the row sort live
  // in the URL (?phase / ?deadlines=1 / ?etype / ?gsort / ?gdir, all replace —
  // format documented next to readGanttViewParams), so they are read on load,
  // follow back/forward and same-route links, and are shareable. Inside the sim
  // embed they stay local state and never touch the URL.
  const [localView, setLocalView] = useState<GanttViewState>(DEFAULT_GANTT_VIEW)
  const urlView = useMemo(() => readGanttViewParams(searchParams), [searchParams])
  const view = embedded ? localView : urlView
  const {
    phase: selectedPhaseType,
    etype: selectedEventType,
    sort: sortField,
    dir: sortDirection,
  } = view
  const viewRef = useRef(view)
  viewRef.current = view
  const updateView = useCallback(
    (patch: Partial<GanttViewState>) => {
      if (embedded) {
        setLocalView((prev) => ({ ...prev, ...patch }))
        return
      }
      setSearchParams((sp) => writeGanttViewParams(sp, { ...readGanttViewParams(sp), ...patch }), {
        replace: true,
      })
    },
    [embedded, setSearchParams]
  )
  const setSelectedPhaseType = (phase: string) => updateView({ phase })
  const setSelectedEventType = (etype: string) => updateView({ etype })

  const phaseTypeItems = useMemo(() => GANTT_PHASE_TYPES.map((p) => ({ id: p, label: p })), [])

  const eventTypeItems = useMemo(
    () => [
      { id: 'Phase', label: 'Phases' },
      { id: 'Milestone', label: 'Milestones' },
    ],
    []
  )

  const handleSort = (field: 'country' | 'organization') => {
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      updateView({ dir: newDirection })
      logEvent('Timeline', `Sort ${field}`, newDirection)
    } else {
      updateView({ sort: field, dir: 'asc' })
      logEvent('Timeline', `Sort ${field}`, 'asc')
    }
  }

  // A row groups several events; the cell clicked names the event it shows
  // (the one in that year), falling back to the row's first.
  const handlePhaseClick = (
    phase: TimelinePhase,
    e: React.MouseEvent,
    focus: TimelineEvent | null = null
  ) => {
    e.stopPropagation()
    const shown = focus ?? phase.events[0] ?? null
    setSelection({ phase, event: shown })
    writeEventParam(shown ? eventLinkKey(shown) : phase.title, { push: true })
    logEvent('Timeline', 'View Phase Details', `${phase.phase}: ${shown?.title ?? phase.title}`)
  }

  // The popover's own event switcher (rows with several events).
  const handleFocusEvent = useCallback(
    (event: TimelineEvent) => {
      setSelection((prev) => (prev ? { phase: prev.phase, event } : prev))
      writeEventParam(eventLinkKey(event), { push: false })
    },
    [writeEventParam]
  )

  const handleClosePopover = () => {
    setSelection(null)
    writeEventParam(null, { push: false })
  }

  // Document detail popover (the Documents panel under the chart). Which
  // surface a `?event=` opens: the Gantt popover is THE target for every
  // arriving ?event (cold link, reload, back/forward, same-route link) because
  // the chart is always rendered wherever the Documents panel is. The document
  // popover opens only from a click in the Documents panel; that click still
  // writes ?event=<event_id> (push) so Back closes it and the URL is shareable,
  // and closing it removes ?event (replace). docKeyRef remembers which ?event
  // value belongs to the document popover so the reconcile effect below does
  // not also open the Gantt popover for it.
  const [docRow, setDocRow] = useState<TimelineDocumentRow | null>(null)
  const docKeyRef = useRef<string | null>(null)
  const handleSelectDocRow = (row: TimelineDocumentRow | null) => {
    if (!row) {
      docKeyRef.current = null
      setDocRow(null)
      writeEventParam(null, { push: false })
      return
    }
    setDocRow(row)
    setSelection(null)
    if (embedded) return
    const key = row.eventId || row.title
    docKeyRef.current = key
    writeEventParam(key, { push: true })
    logEvent('Timeline', 'View Document Details', `${row.phase}: ${row.title}`)
  }

  // Reconcile the popover with ?event= on back/forward / external navigation.
  const eventParam = embedded ? null : searchParams.get('event')
  useEffect(() => {
    if (embedded) return
    if (docKeyRef.current) {
      if (docKeyRef.current === eventParam) {
        setSelection(null)
        return
      }
      // ?event moved on (Back, another link): the document popover closes.
      docKeyRef.current = null
      setDocRow(null)
    }
    const next = resolveEventPhase(eventParam)
    const keyOf = (s: ResolvedTimelineEvent | null) =>
      s ? `${phaseRowKey(s.phase)}|${s.event ? eventLinkKey(s.event) : ''}` : ''
    setSelection((prev) => (keyOf(prev) === keyOf(next) ? prev : next))
    if (next && eventParam !== lastWrittenEventRef.current) {
      // Arrived by link: make sure the phase/event-type filters don't hide the
      // row (TimelineView's ?event handler clears them too, with a notice), then
      // scroll to and highlight it.
      lastWrittenEventRef.current = eventParam
      const cur = viewRef.current
      const patch: Partial<GanttViewState> = {}
      if (cur.phase !== 'All' && cur.phase !== next.phase.phase) patch.phase = 'All'
      if (cur.etype !== 'All' && cur.etype !== next.phase.type) patch.etype = 'All'
      if (patch.phase || patch.etype) updateView(patch)
      setScrollTarget(phaseRowKey(next.phase))
    }
  }, [embedded, eventParam, resolveEventPhase, updateView])

  const handleFilterBlur = () => {
    if (filterText) logTimelineFilterText(filterText)
  }

  const processedData = useMemo(() => {
    // Region/country/search/phase/type/"My countries" — the same filter the
    // page's exports and the executive card use (timelineViewFilter.ts).
    const filtered = filterGanttView(data, {
      region: regionFilter,
      country: selectedCountry,
      query: filterText,
      semanticHits,
      phase: selectedPhaseType,
      etype: selectedEventType,
      onlyMyCountries: showOnlyMyCountries,
      myCountries,
    })

    const sorted = filtered.sort((a, b) => {
      let compare = 0
      if (sortField === 'country') {
        compare = a.country.countryName.localeCompare(b.country.countryName)
      } else {
        const aOrg = a.country.bodies[0]?.name || ''
        const bOrg = b.country.bodies[0]?.name || ''
        compare = aOrg.localeCompare(bOrg)
      }
      return sortDirection === 'asc' ? compare : -compare
    })

    // Rows within a country in date order (start, then end year); same-year
    // rows put milestones first, then the fixed phase order.
    return sorted.map((c) => ({
      ...c,
      phases: [...c.phases].sort((a, b) => {
        if (a.startYear !== b.startYear) return a.startYear - b.startYear
        if (a.type !== b.type) return a.type === 'Milestone' ? -1 : 1
        if (a.endYear !== b.endYear) return a.endYear - b.endYear
        const aIdx = PHASE_ORDER.indexOf(a.phase)
        const bIdx = PHASE_ORDER.indexOf(b.phase)
        const aVal = aIdx === -1 ? 999 : aIdx
        const bVal = bIdx === -1 ? 999 : bIdx
        return aVal - bVal
      }),
    }))
  }, [
    data,
    filterText,
    semanticHits,
    sortField,
    sortDirection,
    regionFilter,
    selectedCountry,
    selectedPhaseType,
    selectedEventType,
    showOnlyMyCountries,
    myCountries,
  ])

  const totalPhaseCount = useMemo(
    () => processedData.reduce((sum, d) => sum + d.phases.length, 0),
    [processedData]
  )

  // Auto-scaled year axis: min/max computed from what's actually in view, with a
  // couple of padding columns past the latest deadline so 2035+ (or later) dates
  // don't sit flush against the chart's right edge, plus a minimum span so a
  // narrow filtered view doesn't look absurdly zoomed in.
  const yearRange = useMemo(() => {
    let minYear = Infinity
    let maxYear = -Infinity
    for (const c of processedData) {
      for (const p of c.phases) {
        if (p.startYear < minYear) minYear = p.startYear
        if (p.endYear > maxYear) maxYear = p.endYear
      }
    }
    if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
      return { start: currentYear, end: currentYear + YEAR_AXIS_MIN_SPAN }
    }
    let end = maxYear + YEAR_AXIS_PAD_END
    if (end - minYear < YEAR_AXIS_MIN_SPAN) end = minYear + YEAR_AXIS_MIN_SPAN
    return { start: minYear, end }
  }, [processedData, currentYear])

  const years = useMemo(
    () =>
      Array.from({ length: yearRange.end - yearRange.start + 1 }, (_, i) => yearRange.start + i),
    [yearRange]
  )

  const hasActiveFilters =
    regionFilter !== 'All' ||
    selectedCountry !== 'All' ||
    selectedPhaseType !== 'All' ||
    selectedEventType !== 'All' ||
    showOnlyMyCountries ||
    filterText !== ''

  const clearAllFilters = useCallback(() => {
    setLocalSearchText('')
    if (onClearAll) {
      // One URL write for region/country/search/phase/etype/deadlines/sort and
      // "My countries only" — separate setSearchParams calls in one tick would
      // overwrite each other.
      onClearAll()
      return
    }
    if (onSearchChange) onSearchChange('')
    updateView(DEFAULT_GANTT_VIEW)
    onSetShowOnlyMyCountries?.(false)
    onRegionSelect('All')
    onCountrySelect('All')
  }, [
    onClearAll,
    onSearchChange,
    updateView,
    onSetShowOnlyMyCountries,
    onRegionSelect,
    onCountrySelect,
  ])

  // One row per source event (not per grouped row), with each event's own
  // issuer — the same columns as the page's top-bar export.
  const handleExportCSV = useCallback(() => {
    const events = eventsInView(processedData)
    if (events.length === 0) return
    downloadCsv(generateCsv(events, TIMELINE_CSV_COLUMNS), csvFilename('pqc-timeline'))
    logEvent('Timeline', 'Export CSV', `${events.length} rows`)
  }, [processedData])

  const tableRef = useRef<HTMLDivElement>(null)

  const handlePhaseKeyDown = useCallback(
    (e: React.KeyboardEvent, phaseData: TimelinePhase, rowIdx: number, phaseIdx: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handlePhaseClick(phaseData, e as unknown as React.MouseEvent)
        return
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))
        return
      e.preventDefault()

      const container = tableRef.current
      if (!container) return

      let targetSelector = ''
      if (e.key === 'ArrowUp' && rowIdx > 0) {
        targetSelector = `[data-phase-row="${rowIdx - 1}"]`
      } else if (e.key === 'ArrowDown') {
        targetSelector = `[data-phase-row="${rowIdx + 1}"]`
      } else if (e.key === 'ArrowLeft' && phaseIdx > 0) {
        targetSelector = `[data-phase-row="${rowIdx}"][data-phase-col="${phaseIdx - 1}"]`
      } else if (e.key === 'ArrowRight') {
        targetSelector = `[data-phase-row="${rowIdx}"][data-phase-col="${phaseIdx + 1}"]`
      } else if (e.key === 'Home') {
        targetSelector = `[data-phase-row="${rowIdx}"][data-phase-col="0"]`
      } else if (e.key === 'End') {
        // Find last phase in this row
        const allInRow = container.querySelectorAll(`[data-phase-row="${rowIdx}"]`)
        if (allInRow.length > 0) {
          ;(allInRow[allInRow.length - 1] as HTMLElement).focus()
          return
        }
      }

      if (targetSelector) {
        const target = container.querySelector(targetSelector) as HTMLElement | null
        target?.focus()
      }
    },
    []
  )

  const renderPhaseCells = (phaseData: TimelinePhase, rowIdx: number, phaseIdx: number) => {
    const cells: React.ReactNode[] = []
    const colors = phaseColors[phaseData.phase as Phase] || {
      start: 'hsl(var(--muted-foreground))',
      end: 'hsl(var(--muted))',
      glow: 'hsl(var(--ring))',
    }
    const isMilestone = phaseData.type === 'Milestone'
    const emptyCell = (year: number) => (
      <td
        key={year}
        className={`p-0 h-10 border-r border-border ${year === currentYear ? 'border-l-2 border-primary/50' : ''}`}
      ></td>
    )

    if (isMilestone) {
      // A milestone row groups several dated records. Each year that holds one
      // gets its own flag (with a count when it holds more), and a record that
      // states a span (2026–2031, or "from 2030") draws a thin line to its end —
      // before 2026-11-14 only the row's first year had a flag and every later
      // record (FIPS 203/204/205, HQC, NIST IR 8547…) sat in blank cells.
      // A row with no source events (sim embed, synthetic rows) is its own record.
      type Mark = Pick<TimelineEvent, 'startYear' | 'endYear' | 'openEnded' | 'title'> & {
        event: TimelineEvent | null
      }
      const marks: Mark[] =
        phaseData.events.length > 0
          ? phaseData.events.map((e) => ({ ...e, event: e }))
          : [{ ...phaseData, event: null }]
      const spanEnd = (m: Mark) => (m.openEnded ? yearRange.end : m.endYear)
      let tabbable = true
      for (let year = yearRange.start; year <= yearRange.end; year++) {
        const starting = marks.filter((m) => m.startYear === year)
        const spanning = marks.filter((m) => m.startYear < year && year <= spanEnd(m))
        if (starting.length === 0 && spanning.length === 0) {
          cells.push(emptyCell(year))
          continue
        }
        const focus = (starting[0] ?? spanning[0]).event
        const isFlag = starting.length > 0
        const elapsed = year < currentYear
        const active = year === currentYear
        const label = isFlag
          ? `${phaseData.phase}: ${starting.map((m) => m.title).join('; ')} (${year})`
          : `${phaseData.phase}: ${spanning[0].title} (continues ${year})`
        const isFirstFlag = isFlag && year === phaseData.startYear
        const tabIndex = isFlag && tabbable ? 0 : -1
        if (isFlag) tabbable = false
        cells.push(
          <td
            key={year}
            className={`p-0 h-10 overflow-visible relative ${year === currentYear ? 'border-l-2 border-primary/50' : ''}`}
            data-open-ended={!isFlag && spanning.some((m) => m.openEnded) ? 'true' : undefined}
            style={{ zIndex: isFlag ? 20 : 0, contain: 'layout style' }}
          >
            <Button
              variant="ghost"
              className="w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent z-20"
              onClick={(e) => handlePhaseClick(phaseData, e, focus)}
              onKeyDown={(e) => handlePhaseKeyDown(e, phaseData, rowIdx, phaseIdx)}
              data-phase-row={rowIdx}
              data-phase-col={phaseIdx}
              data-year={year}
              aria-label={label}
              tabIndex={tabIndex}
            >
              {isFlag ? (
                <div
                  className="relative flex items-center justify-center"
                  title={
                    elapsed
                      ? `Recorded for ${year}`
                      : active
                        ? 'Recorded for this year'
                        : `Upcoming (${year})`
                  }
                >
                  <Flag
                    data-testid="milestone-flag"
                    className={`w-4 h-4 ${elapsed ? 'opacity-60' : ''}`}
                    style={{ color: colors.start, fill: colors.start }}
                  />
                  {starting.length > 1 && (
                    <span
                      data-testid="milestone-count"
                      className="absolute -top-2 -right-2.5 rounded-full bg-background px-1 text-[9px] font-bold leading-tight border border-border text-foreground"
                    >
                      {starting.length}
                    </span>
                  )}
                  {isFirstFlag && (
                    <span
                      className="absolute left-full ml-1 text-[10px] font-semibold whitespace-nowrap select-none pointer-events-none z-20 drop-shadow-md"
                      style={{ color: colors.start }}
                    >
                      {phaseData.phase}
                      {(elapsed || active) && (
                        <span className="ml-1 font-normal text-[9px] uppercase tracking-wide text-primary">
                          {active ? 'this year' : 'recorded'}
                        </span>
                      )}
                    </span>
                  )}
                  {isFirstFlag && phaseData.status && (
                    <div className="absolute -top-3 -right-3 z-20 scale-75 origin-bottom-left">
                      <StatusBadge status={phaseData.status} size="sm" />
                    </div>
                  )}
                </div>
              ) : (
                <span
                  data-testid="milestone-span"
                  aria-hidden="true"
                  className="block h-0.5 w-full"
                  style={{ backgroundColor: colors.start, opacity: 0.5 }}
                />
              )}
            </Button>
          </td>
        )
      }
      return cells
    }

    const startYear = Math.max(yearRange.start, phaseData.startYear)
    // Open-ended (D22): the source states no end, so the bar runs to the chart's
    // edge and fades instead of stopping at an invented year.
    const openEnded = Boolean(phaseData.openEnded)
    const endYear = openEnded ? yearRange.end : Math.min(yearRange.end, phaseData.endYear)
    const fadeFor = (year: number) =>
      openEnded && endYear > startYear ? 1 - (0.75 * (year - startYear)) / (endYear - startYear) : 1

    for (let year = yearRange.start; year <= yearRange.end; year++) {
      const isInPhase = year >= startYear && year <= endYear
      const isFirst = year === startYear
      const isLast = year === endYear
      if (!isInPhase) {
        cells.push(emptyCell(year))
        continue
      }
      // The record this year belongs to (rows can group several phases).
      const focus =
        phaseData.events.find(
          (e) => e.startYear <= year && year <= (e.openEnded ? yearRange.end : e.endYear)
        ) ?? null
      cells.push(
        <td
          key={year}
          className={`p-0 h-10 overflow-visible relative ${year === currentYear ? 'border-l-2 border-primary/50' : ''}`}
          title={openEnded && isFirst ? `${phaseData.title}: ${OPEN_ENDED_NOTE}` : undefined}
          data-open-ended={openEnded ? 'true' : undefined}
          style={{
            borderRight: isLast && !openEnded ? '1px solid var(--color-border)' : 'none',
            backgroundColor: colors.start,
            boxShadow: `0 0 8px ${colors.glow}`,
            opacity: 0.9 * fadeFor(year),
            zIndex: isFirst ? 20 : 0,
            contain: 'layout style', // Optimize WebKit rendering
          }}
        >
          <Button
            variant="ghost"
            className={`w-full h-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-0 bg-transparent ${isFirst ? 'z-20' : 'z-0'}`}
            onClick={(e) => handlePhaseClick(phaseData, e, focus)}
            onKeyDown={(e) => handlePhaseKeyDown(e, phaseData, rowIdx, phaseIdx)}
            data-phase-row={rowIdx}
            data-phase-col={phaseIdx}
            data-year={year}
            aria-label={`${phaseData.phase}: ${(focus ?? phaseData).title}${openEnded ? ` (${OPEN_ENDED_NOTE})` : ''}`}
            tabIndex={isFirst ? 0 : -1}
          >
            {isFirst ? (
              <div className="relative flex items-center">
                <span className="absolute left-2 text-[10px] font-bold text-foreground bg-background/70 px-1 rounded whitespace-nowrap drop-shadow-md select-none z-20 pointer-events-none">
                  {phaseData.phase}
                </span>
                {phaseData.status && (
                  <div className="absolute -top-2 -right-3 z-20 scale-75 origin-top-left">
                    <StatusBadge status={phaseData.status} size="sm" />
                  </div>
                )}
              </div>
            ) : null}
          </Button>
        </td>
      )
    }
    return cells
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Embedded scope label (replaces the Controls toolbar when inside the sim) */}
      {embedded && scopeLabel && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-primary">
            Timeline
          </span>
          <span>{scopeLabel}</span>
        </div>
      )}
      {/* Controls — hidden in embedded/sim mode */}
      {!embedded && (
        <>
          <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-2 flex flex-col md:flex-row md:flex-wrap items-center gap-4 relative z-40">
            <div className="flex items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex-1 min-w-[120px]">
                <FilterDropdown
                  items={regionItems}
                  selectedId={regionFilter}
                  onSelect={onRegionSelect}
                  defaultLabel="Region"
                  opaque
                  className="mb-0 w-full"
                  noContainer
                />
              </div>
            </div>
            <div className="flex items-center gap-1 w-full md:w-auto text-xs">
              <div className="flex-1 min-w-[150px]">
                <FilterDropdown
                  items={countryItems}
                  selectedId={selectedCountry}
                  onSelect={onCountrySelect}
                  defaultLabel="Country"
                  opaque
                  className="mb-0 w-full"
                  noContainer
                />
              </div>
              {myCountries.length > 0 && onSetShowOnlyMyCountries && (
                <Button
                  variant="ghost"
                  onClick={() => onSetShowOnlyMyCountries(!showOnlyMyCountries)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap ${
                    showOnlyMyCountries
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                  }`}
                  aria-pressed={showOnlyMyCountries}
                >
                  <BookmarkCheck size={12} />
                  My ({myCountries.length})
                </Button>
              )}
              {selectedCountry !== 'All' && (
                <Button
                  variant="ghost"
                  type="button"
                  aria-label="Copy country timeline link"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/timeline?country=${encodeURIComponent(selectedCountry)}`
                    )
                    toast.success('Link copied!')
                    setCountryCopied(true)
                    setTimeout(() => setCountryCopied(false), 2000)
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors flex-shrink-0"
                >
                  {countryCopied ? (
                    <Check size={16} className="text-accent" />
                  ) : (
                    <Link2 size={16} />
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex-1 min-w-[120px]">
                <FilterDropdown
                  items={phaseTypeItems}
                  selectedId={selectedPhaseType}
                  onSelect={(id) => {
                    setSelectedPhaseType(id)
                    logEvent('Timeline', 'Filter Phase Type', id)
                  }}
                  defaultLabel="All Phases"
                  defaultIcon={<Layers size={16} className="text-primary" />}
                  opaque
                  className="mb-0 w-full"
                  noContainer
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex-1 min-w-[120px]">
                <FilterDropdown
                  items={eventTypeItems}
                  selectedId={selectedEventType}
                  onSelect={(id) => {
                    setSelectedEventType(id)
                    logEvent('Timeline', 'Filter Event Type', id)
                  }}
                  defaultLabel="All Types"
                  defaultIcon={<Filter size={16} className="text-primary" />}
                  opaque
                  className="mb-0 w-full"
                  noContainer
                />
              </div>
            </div>
            <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
            <div className="relative flex-1 min-w-0 md:min-w-[200px] w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search countries, agencies or records..."
                value={filterText}
                onChange={handleFilterTextChange}
                onBlur={handleFilterBlur}
                className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                const next = selectedPhaseType === 'Deadline' ? 'All' : 'Deadline'
                setSelectedPhaseType(next)
                logEvent('Timeline', 'Quick Filter Deadlines', next)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors whitespace-nowrap ${
                selectedPhaseType === 'Deadline'
                  ? 'bg-destructive/20 border-destructive/50 text-destructive hover:bg-destructive/30'
                  : 'bg-muted/30 hover:bg-muted/50 border-border text-foreground'
              }`}
              aria-label="Show deadlines only"
              aria-pressed={selectedPhaseType === 'Deadline'}
            >
              <Flag size={16} />
              <span className="hidden md:inline">Deadlines</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleExportCSV}
              disabled={processedData.length === 0}
              className="flex items-center justify-center px-2.5 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export filtered timeline as CSV"
            >
              <Download size={16} />
            </Button>
          </div>

          {/* Active filter chips + result count */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              {regionFilter !== 'All' && (
                <FilterChip
                  // eslint-disable-next-line security/detect-object-injection -- label lookup
                  label={TIMELINE_REGION_LABELS[regionFilter] ?? regionFilter}
                  onClear={() => onRegionSelect('All')}
                />
              )}
              {selectedCountry !== 'All' && (
                <FilterChip label={selectedCountry} onClear={() => onCountrySelect('All')} />
              )}
              {selectedPhaseType !== 'All' && (
                <FilterChip label={selectedPhaseType} onClear={() => setSelectedPhaseType('All')} />
              )}
              {selectedEventType !== 'All' && (
                <FilterChip
                  label={selectedEventType === 'Phase' ? 'Phases only' : 'Milestones only'}
                  onClear={() => setSelectedEventType('All')}
                />
              )}
              {showOnlyMyCountries && (
                <FilterChip
                  label="My countries only"
                  onClear={() => onSetShowOnlyMyCountries?.(false)}
                />
              )}
              {filterText && (
                <FilterChip
                  label={`"${filterText}"`}
                  onClear={() => {
                    if (onSearchChange) onSearchChange('')
                    else setLocalSearchText('')
                  }}
                />
              )}
              <span className="text-xs text-muted-foreground">
                {totalPhaseCount} {totalPhaseCount === 1 ? 'result' : 'results'}
                {processedData.length !== data.length
                  ? ` · ${processedData.length} of ${data.length} countries`
                  : ''}
              </span>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {processedData.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No results match your filters.</p>
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="mt-2 text-primary text-xs hover:underline"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card" ref={tableRef}>
        <table className="w-full min-w-[600px] border-collapse table-fixed">
          <caption className="sr-only">
            Post-quantum cryptography migration timeline by country and phase
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={
                  sortField === 'country'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className="sticky left-0 z-30 bg-background p-4 text-left w-[180px] cursor-pointer hover:bg-muted/50 transition-colors border-b border-r border-border"
                onClick={() => handleSort('country')}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Country</span>
                  {sortField === 'country' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-primary" />
                    ))}
                  {sortField !== 'country' && (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                aria-sort={
                  sortField === 'organization'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className="sticky left-[180px] z-30 bg-background p-4 text-left w-[200px] cursor-pointer hover:bg-muted/50 transition-colors border-b border-r border-border"
                onClick={() => handleSort('organization')}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Organization</span>
                  {sortField === 'organization' &&
                    (sortDirection === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-primary" />
                    ))}
                  {sortField !== 'organization' && (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
                  )}
                </div>
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  scope="col"
                  className="p-2 text-center min-w-[80px] bg-background/80 border-b border-r border-border"
                >
                  <span
                    className={`font-mono text-sm ${year === currentYear ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
                  >
                    {/* The first column is the earliest recorded year itself, not
                        "before" it; the last is padding past the latest record. */}
                    {year === yearRange.end ? `${yearRange.end}+` : year}
                    {year === currentYear && (
                      <span className="ml-1 text-[8px] uppercase tracking-wide text-primary align-top">
                        now
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              let globalRowIdx = 0
              return processedData.map((countryData) => {
                const { country, phases } = countryData
                const totalRows = phases.length
                const countryLastVerified = getCountryLastVerified(country)
                return (
                  <Fragment key={country.countryName}>
                    {phases.map((phaseData, idx) => {
                      const currentRowIdx = globalRowIdx++
                      const isLastRow = idx === totalRows - 1
                      return (
                        <tr
                          key={`${country.countryName}-${phaseData.phase}-${idx}`}
                          id={idx === 0 ? timelineRowDomId(country.countryName) : undefined}
                          data-deeplink-id={phaseRowKey(phaseData)}
                          className="hover:bg-muted/50 transition-colors"
                          style={
                            isLastRow
                              ? { borderBottom: '1px solid var(--color-border)' }
                              : undefined
                          }
                        >
                          {idx === 0 && (
                            <td
                              rowSpan={totalRows}
                              className="sticky left-0 z-20 bg-background p-3 align-top border-r border-border"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex items-center justify-center w-5 h-3.5 flex-shrink-0 overflow-hidden rounded-sm"
                                  aria-label={`Flag of ${country.countryName}`}
                                >
                                  <CountryFlag
                                    code={country.flagCode}
                                    width={20}
                                    height={14}
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-bold text-foreground text-sm">
                                  {country.countryName}
                                </span>
                              </div>
                              {countryLastVerified && (
                                <div
                                  className="text-[9px] text-muted-foreground font-mono mt-0.5"
                                  title="Most recent date this country's source documents were re-fetched or re-checked. Not a per-claim review date."
                                >
                                  Sources checked {countryLastVerified}
                                </div>
                              )}
                              <div className="flex items-center gap-0.5 -ml-1 mt-0.5">
                                {onToggleMyCountry && (
                                  <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onToggleMyCountry(country.countryName)
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      myCountries.includes(country.countryName)
                                        ? 'text-primary hover:text-primary/80'
                                        : 'text-muted-foreground/40 hover:text-primary'
                                    }`}
                                    aria-label={
                                      myCountries.includes(country.countryName)
                                        ? 'Remove from My Countries'
                                        : 'Add to My Countries'
                                    }
                                  >
                                    {myCountries.includes(country.countryName) ? (
                                      <BookmarkCheck size={14} />
                                    ) : (
                                      <Bookmark size={14} />
                                    )}
                                  </Button>
                                )}
                                <EndorseButton
                                  endorseUrl={buildEndorsementUrl({
                                    category: 'timeline-endorsement',
                                    title: `Endorse: ${country.countryName} PQC Timeline`,
                                    resourceType: 'Country Timeline',
                                    resourceId: country.countryName,
                                    resourceDetails: [
                                      `**Country:** ${country.countryName}`,
                                      `**Organizations:** ${country.bodies.map((b) => b.name).join(', ')}`,
                                      `**Phases:** ${phases.length}`,
                                    ].join('\n'),
                                    pageUrl: `/timeline?country=${encodeURIComponent(country.countryName)}`,
                                  })}
                                  resourceLabel={`${country.countryName} Timeline`}
                                  resourceType="Country Timeline"
                                  variant="icon"
                                />
                                <FlagButton
                                  flagUrl={buildFlagUrl({
                                    category: 'timeline-endorsement',
                                    title: `Flag: ${country.countryName} PQC Timeline`,
                                    resourceType: 'Country Timeline',
                                    resourceId: country.countryName,
                                    resourceDetails: [
                                      `**Country:** ${country.countryName}`,
                                      `**Organizations:** ${country.bodies.map((b) => b.name).join(', ')}`,
                                      `**Phases:** ${phases.length}`,
                                    ].join('\n'),
                                    pageUrl: `/timeline?country=${encodeURIComponent(country.countryName)}`,
                                  })}
                                  resourceLabel={`${country.countryName} Timeline`}
                                  resourceType="Country Timeline"
                                  variant="icon"
                                />
                              </div>
                            </td>
                          )}
                          {/* Each row names its own issuer(s): a country lane holds
                              records from several bodies (NIST, CISA, NIAP…), and
                              one rowSpan cell showed only the first for all of them. */}
                          <td
                            className="sticky left-[180px] z-20 bg-background px-3 py-2 align-middle border-r border-border"
                            data-testid="gantt-row-org"
                          >
                            <span
                              className="block text-xs text-muted-foreground truncate"
                              title={phaseOrgs(phaseData)
                                .map((o) => (o.fullName ? `${o.name} — ${o.fullName}` : o.name))
                                .join('\n')}
                            >
                              {phaseOrgs(phaseData)
                                .map((o) => o.name)
                                .join(', ') || country.bodies[0]?.name}
                            </span>
                          </td>
                          {renderPhaseCells(phaseData, currentRowIdx, idx)}
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })
            })()}
          </tbody>
        </table>
      </div>

      {/* Document Table — appears below Gantt when a country filter is active */}
      {selectedCountry !== 'All' && processedData.length > 0 && (
        <DocumentTable
          data={processedData}
          title={`Documents · ${selectedCountry}`}
          selectedRow={docRow}
          onSelectRow={handleSelectDocRow}
          syncViewToUrl={!embedded}
        />
      )}

      <GanttDetailPopover
        isOpen={!!selectedPhase}
        onClose={handleClosePopover}
        phase={selectedPhase}
        focusEvent={selection?.event}
        onFocusEvent={handleFocusEvent}
      />
    </div>
  )
}
