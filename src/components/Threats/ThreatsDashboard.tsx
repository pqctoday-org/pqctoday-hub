// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  AlertTriangle,
  Info,
  AlertOctagon,
  AlertCircle,
  CheckCircle,
  Filter,
  Briefcase,
  BookmarkCheck,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { threatsData, threatsMetadata } from '../../data/threatsData'
import type { ThreatItem } from '../../data/threatsData'
import { AnimatePresence } from 'framer-motion'
import { FilterDropdown } from '../common/FilterDropdown'
import { logEvent } from '../../utils/analytics'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import { INDUSTRY_TO_THREATS_MAP } from '../../data/personaConfig'
import clsx from 'clsx'
import { PageHeader } from '../common/PageHeader'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { Button } from '../ui/button'

type SortField = 'industry' | 'threatId' | 'criticality'
type SortDirection = 'asc' | 'desc'

import { getIndustryIcon } from './threatsHelper'
import { ThreatsViewToggle, type ThreatsViewMode } from './ThreatsViewToggle'
import { LeftNavTOC } from '@/components/common/LeftNavTOC'
import { ThreatsCardGrid } from './ThreatsCardGrid'
import { ThreatsTable } from './ThreatsTable'
import { IndustryStack } from './IndustryStack'

import { ThreatDetailDialog } from './ThreatDetailDialog'
import { MobileThreatsList } from './MobileThreatsList'

// Threat Detail Dialog Component - Moved outside to ./ThreatDetailDialog.tsx

export const ThreatsDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedIndustries: storeIndustries, selectedPersona } = usePersonaStore()

  const initialIndustries = useMemo(() => {
    const param = searchParams.get('industry')
    // URL param takes precedence — supports comma-separated multi-industry
    if (param) {
      return param.split(',').flatMap((p) => {
        const match = threatsData.find((d) => d.industry.toLowerCase() === p.trim().toLowerCase())
        return match ? [match.industry] : []
      })
    }
    // Map all home-page selected industries through the threats name mapping
    return (
      storeIndustries
        // eslint-disable-next-line security/detect-object-injection
        .flatMap((ind) => INDUSTRY_TO_THREATS_MAP[ind] ?? [])
        .filter((mapped) => threatsData.some((d) => d.industry === mapped))
    )
  }, [searchParams, storeIndustries])

  const { myThreats, showOnlyThreats, setShowOnlyThreats } = useBookmarkStore()

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(initialIndustries)
  const [selectedCriticality, setSelectedCriticality] = useState<string>(
    () => searchParams.get('criticality') ?? 'All'
  )
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [sortField, setSortField] = useState<SortField>(
    () => (searchParams.get('sort') as SortField | null) ?? 'industry'
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => (searchParams.get('dir') as SortDirection | null) ?? 'asc'
  )
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      return threatsData.find((t) => t.threatId === idParam) ?? null
    }
    return null
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ThreatsViewMode>(
    () => (searchParams.get('mode') as ThreatsViewMode | null) ?? 'table'
  )
  const [activeLayer, setActiveLayer] = useState<string>('All')

  // Sync all filter params on same-route navigations (e.g. chatbot deep links).
  // Functional setters prevent infinite loops when syncFiltersToUrl triggers a searchParams update.
  useEffect(() => {
    const indParam = searchParams.get('industry')
    const idParam = searchParams.get('id')
    const nextCrit = searchParams.get('criticality') ?? 'All'
    const nextQ = searchParams.get('q') ?? ''
    const nextSort = (searchParams.get('sort') as SortField | null) ?? 'industry'
    const nextDir = (searchParams.get('dir') as SortDirection | null) ?? 'asc'
    const nextMode = (searchParams.get('mode') as ThreatsViewMode | null) ?? 'table'

    if (indParam) {
      const matches = indParam.split(',').flatMap((p) => {
        const m = threatsData.find((d) => d.industry.toLowerCase() === p.trim().toLowerCase())
        return m ? [m.industry] : []
      })
      if (matches.length > 0)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- URL→state sync is the purpose of this effect
        setSelectedIndustries((prev) =>
          JSON.stringify(prev) !== JSON.stringify(matches) ? matches : prev
        )
    }
    if (idParam) {
      const found = threatsData.find((t) => t.threatId === idParam)
      if (found) setSelectedThreat(found)
    }
    setSelectedCriticality((prev) => (prev !== nextCrit ? nextCrit : prev))
    setSearchQuery((prev) => (prev !== nextQ ? nextQ : prev))
    setSortField((prev) => (prev !== nextSort ? nextSort : prev))
    setSortDirection((prev) => (prev !== nextDir ? nextDir : prev))
    setViewMode((prev) => (prev !== nextMode ? nextMode : prev))
  }, [searchParams])

  /** Write all current filter state back to URL. Call with overrides for the value that just
   *  changed so the URL reflects it immediately. Uses replace:true to avoid history spam. */
  const syncFiltersToUrl = useCallback(
    (overrides: {
      industry?: string[]
      criticality?: string
      q?: string
      sort?: SortField
      dir?: SortDirection
      id?: string | null
      mode?: ThreatsViewMode
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const inds = overrides.industry ?? selectedIndustries
          const crit = overrides.criticality ?? selectedCriticality
          const q = overrides.q ?? searchQuery
          const sort = overrides.sort ?? sortField
          const dir = overrides.dir ?? sortDirection
          const id = overrides.id !== undefined ? overrides.id : (selectedThreat?.threatId ?? null)
          const mode = overrides.mode ?? viewMode

          if (inds.length > 0) next.set('industry', inds.join(','))
          else next.delete('industry')
          if (crit !== 'All') next.set('criticality', crit)
          else next.delete('criticality')
          if (q) next.set('q', q)
          else next.delete('q')
          if (sort !== 'industry') next.set('sort', sort)
          else next.delete('sort')
          if (dir !== 'asc') next.set('dir', dir)
          else next.delete('dir')
          if (id) next.set('id', id)
          else next.delete('id')
          if (mode !== 'table') next.set('mode', mode)
          else next.delete('mode')
          return next
        },
        { replace: true }
      )
    },
    [
      selectedIndustries,
      selectedCriticality,
      searchQuery,
      sortField,
      sortDirection,
      selectedThreat,
      viewMode,
      setSearchParams,
    ]
  )

  // Extract unique industries for filter
  const industryItems = useMemo(() => {
    const unique = new Set(threatsData.map((d) => d.industry))
    return Array.from(unique)
      .sort()
      .map((ind) => {
        return { id: ind, label: ind, icon: getIndustryIcon(ind, 16) }
      })
  }, [])

  // Criticality items
  const criticalityItems = useMemo(() => {
    return [
      { id: 'All', label: 'All Levels', icon: null },
      {
        id: 'Critical',
        label: 'Critical',
        icon: <AlertOctagon size={16} className="text-status-error" />,
      },
      {
        id: 'High',
        label: 'High',
        icon: <AlertTriangle size={16} className="text-status-error" />,
      },
      {
        id: 'Medium-High',
        label: 'Medium-High',
        icon: <AlertCircle size={16} className="text-status-warning" />,
      },
      { id: 'Medium', label: 'Medium', icon: <Info size={16} className="text-primary" /> },
      { id: 'Low', label: 'Low', icon: <CheckCircle size={16} className="text-status-success" /> },
    ]
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      const newDir: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDir)
      syncFiltersToUrl({ dir: newDir })
    } else {
      setSortField(field)
      setSortDirection('asc')
      syncFiltersToUrl({ sort: field, dir: 'asc' })
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...threatsData]

    // Filter by Industry (multi-select: empty = all)
    if (selectedIndustries.length > 0) {
      data = data.filter((item) => selectedIndustries.includes(item.industry))
    }

    // Filter by Criticality
    if (selectedCriticality !== 'All') {
      data = data.filter((item) => item.criticality === selectedCriticality)
    }

    // Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(
        (item) =>
          item.threatId.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.industry.toLowerCase().includes(query) ||
          item.cryptoAtRisk.toLowerCase().includes(query) ||
          item.pqcReplacement.toLowerCase().includes(query)
      )
    }

    // Sort
    data.sort((a, b) => {
      // Helper for criticality value
      const criticalityOrder: Record<string, number> = {
        Critical: 3,
        High: 2,
        'Medium-High': 1.5,
        Medium: 1,
        Low: 0,
      }
      // eslint-disable-next-line security/detect-object-injection
      const getCriticalityVal = (c: string) => criticalityOrder[c] ?? 0

      if (sortField === 'industry') {
        if (a.industry !== b.industry) {
          return sortDirection === 'asc'
            ? a.industry.localeCompare(b.industry)
            : b.industry.localeCompare(a.industry)
        }
        // Secondary Sort: Criticality (Highest First -> Descending)
        return getCriticalityVal(b.criticality) - getCriticalityVal(a.criticality)
      }

      let valA: string | number = ''
      let valB: string | number = ''

      if (sortField === 'threatId') {
        valA = a.threatId
        valB = b.threatId
      } else if (sortField === 'criticality') {
        valA = getCriticalityVal(a.criticality)
        valB = getCriticalityVal(b.criticality)
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    // My Threats filter
    if (showOnlyThreats) {
      data = data.filter((item) => myThreats.includes(item.threatId))
    }

    return data
  }, [
    selectedIndustries,
    selectedCriticality,
    searchQuery,
    sortField,
    sortDirection,
    showOnlyThreats,
    myThreats,
  ])

  // When a persona is set but no explicit industry filter is active, compute the persona's
  // relevant industries to drive card dimming — irrelevant threats remain visible but faded.
  const personaRelevantIndustries = useMemo<Set<string> | undefined>(() => {
    if (!selectedPersona || selectedIndustries.length > 0 || storeIndustries.length === 0)
      return undefined
    const mapped = storeIndustries
      .flatMap((ind) => INDUSTRY_TO_THREATS_MAP[ind] ?? []) // eslint-disable-line security/detect-object-injection
      .filter((ind) => threatsData.some((d) => d.industry === ind))
    return mapped.length > 0 ? new Set(mapped) : undefined
  }, [selectedPersona, selectedIndustries, storeIndustries])

  // Persona-aware summary statistics
  const personaSummary = useMemo(() => {
    if (!selectedPersona || selectedIndustries.length === 0) return null
    const industryThreats = threatsData.filter((t) => selectedIndustries.includes(t.industry))
    const criticalHigh = industryThreats.filter(
      (t) => t.criticality === 'Critical' || t.criticality === 'High'
    )
    const PERSONA_FRAMING: Record<string, string> = {
      executive: `${criticalHigh.length} high-impact threat${criticalHigh.length !== 1 ? 's' : ''} across ${selectedIndustries.length} industr${selectedIndustries.length !== 1 ? 'ies' : 'y'} require board-level attention`,
      developer: `${criticalHigh.length} critical/high threat${criticalHigh.length !== 1 ? 's' : ''} affect algorithms in your stack — review migration paths`,
      architect: `${industryThreats.length} threat${industryThreats.length !== 1 ? 's' : ''} across ${selectedIndustries.length} industr${selectedIndustries.length !== 1 ? 'ies' : 'y'} — ${criticalHigh.length} require architectural mitigation`,
      ops: `${criticalHigh.length} high-priority threat${criticalHigh.length !== 1 ? 's' : ''} require configuration updates across your infrastructure`,
      researcher: `${industryThreats.length} threat${industryThreats.length !== 1 ? 's' : ''} cataloged — ${criticalHigh.length} critical/high severity with active quantum exposure`,
    }
    return PERSONA_FRAMING[selectedPersona] ?? null // eslint-disable-line security/detect-object-injection
  }, [selectedPersona, selectedIndustries])

  return (
    <div>
      <PageHeader
        icon={AlertTriangle}
        pageId="threats"
        title="Quantum Threats"
        description="Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements."
        dataSource={`${threatsMetadata?.filename ?? 'quantum_threats_hsm_industries.csv'} • Updated: ${threatsMetadata?.lastUpdate?.toLocaleDateString() ?? 'Unknown'}`}
        viewType="Threats"
        shareTitle="Quantum Threats Dashboard — Industry Risk Analysis"
        shareText="Detailed analysis of quantum threats across industries — criticality ratings, at-risk cryptography, and PQC replacements."
        endorseUrl={buildEndorsementUrl({
          category: 'threat-endorsement',
          title: 'Endorse: Quantum Threats Dashboard',
          resourceType: 'Threats Page',
          resourceId: 'Quantum Threats Dashboard',
          resourceDetails:
            '**Page:** Quantum Threats — Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements.',
          pageUrl: '/threats',
        })}
        endorseLabel="Threats Page"
        endorseResourceType="Threats"
        flagUrl={buildFlagUrl({
          category: 'threat-endorsement',
          title: 'Flag: Quantum Threats Dashboard',
          resourceType: 'Threats Page',
          resourceId: 'Quantum Threats Dashboard',
          resourceDetails:
            '**Page:** Quantum Threats — Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements.',
          pageUrl: '/threats',
        })}
        flagLabel="Threats Page"
        flagResourceType="Threats"
      />

      {/* Persona summary card */}
      {personaSummary && (
        <div className="glass-panel p-3 mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Info size={14} className="text-primary flex-shrink-0" />
          <span>{personaSummary}</span>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-8 flex flex-col items-center gap-4">
        {/* Mobile: Header to toggle filters + Search */}
        <div className="flex w-full md:hidden items-center justify-between gap-2">
          <div className="flex relative w-full flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search threats..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                syncFiltersToUrl({ q: e.target.value })
              }}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            aria-label="Toggle filters"
          >
            <Filter size={18} />
          </Button>
        </div>

        {/* Filters Container: Hidden on mobile unless showMobileFilters is true */}
        <div
          className={clsx(
            'w-full md:w-full md:flex flex-col md:flex-row items-center gap-4',
            showMobileFilters ? 'flex' : 'hidden'
          )}
        >
          <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto text-xs">
            <div className="flex-1 w-full md:min-w-[120px]">
              <FilterDropdown
                items={industryItems}
                selectedId="All"
                onSelect={() => {}}
                multiSelectedIds={selectedIndustries}
                onMultiSelect={(ids) => {
                  setSelectedIndustries(ids)
                  syncFiltersToUrl({ industry: ids })
                  logEvent('Threats', 'Filter Industry', ids.join(','))
                }}
                defaultLabel="Industry"
                defaultIcon={<Briefcase size={14} className="text-primary" />}
                opaque
                className="mb-0 w-full"
                noContainer
              />
            </div>

            <div className="flex-1 w-full md:min-w-[120px]">
              <FilterDropdown
                items={criticalityItems}
                selectedId={selectedCriticality}
                onSelect={(id) => {
                  setSelectedCriticality(id)
                  syncFiltersToUrl({ criticality: id })
                  logEvent('Threats', 'Filter Criticality', id)
                }}
                defaultLabel="Criticality"
                defaultIcon={<AlertCircle size={14} className="text-primary" />}
                opaque
                className="mb-0 w-full"
                noContainer
              />
            </div>
          </div>

          <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
          <div className="hidden md:flex relative w-full md:flex-1 md:min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search threats..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                syncFiltersToUrl({ q: e.target.value })
              }}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {myThreats.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowOnlyThreats(!showOnlyThreats)}
              className={`hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap ${
                showOnlyThreats
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
              aria-pressed={showOnlyThreats}
            >
              <BookmarkCheck size={12} />
              My ({myThreats.length})
            </Button>
          )}
          <div className="hidden md:block">
            <ThreatsViewToggle
              mode={viewMode}
              onChange={(mode) => {
                setViewMode(mode)
                syncFiltersToUrl({ mode })
              }}
            />
          </div>
        </div>
      </div>

      {/* View Rendering — left-rail TOC of filtered threats + main view */}
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <LeftNavTOC
            title="Threats"
            ariaLabel="Filtered threats"
            targetPrefix="threats-toc"
            activeItemId={selectedThreat?.threatId ?? null}
            onSelect={(id) => {
              const item = filteredAndSortedData.find((t) => t.threatId === id)
              if (!item) return
              setSelectedThreat(item)
              syncFiltersToUrl({ id })
              // Scroll the corresponding card into view (cards mode anchors via id="threat-<id>").
              const target = document.getElementById(`threat-${id}`)
              target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            groups={(() => {
              const byIndustry = new Map<string, typeof filteredAndSortedData>()
              for (const item of filteredAndSortedData) {
                if (!byIndustry.has(item.industry)) byIndustry.set(item.industry, [])
                byIndustry.get(item.industry)!.push(item)
              }
              return Array.from(byIndustry.entries()).map(([ind, items]) => ({
                id: ind.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                label: ind,
                items: items.map((i) => {
                  const desc = i.threatDescription ?? ''
                  const summary = desc.split(':')[0].slice(0, 60)
                  return {
                    id: i.threatId,
                    label: summary ? `${i.threatId} — ${summary}` : i.threatId,
                    hint: i.criticality,
                  }
                }),
              }))
            })()}
            emptyMessage="No threats match the current filters."
          />
        </aside>

        <div className="flex-1 min-w-0">
          {viewMode === 'stack' && (
            <IndustryStack
              activeLayer={activeLayer}
              onSelectLayer={setActiveLayer}
              items={filteredAndSortedData}
              expandedContent={
                <ThreatsTable
                  items={filteredAndSortedData.filter(
                    (t) => t.industry === activeLayer || activeLayer === 'All'
                  )}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onItemClick={(item) => {
                    setSelectedThreat(item)
                    syncFiltersToUrl({ id: item.threatId })
                  }}
                />
              }
            />
          )}
          {viewMode === 'cards' && (
            <div className="mb-8">
              <ThreatsCardGrid
                items={filteredAndSortedData}
                onItemClick={(item) => {
                  setSelectedThreat(item)
                  syncFiltersToUrl({ id: item.threatId })
                }}
                relevantIndustries={personaRelevantIndustries}
              />
            </div>
          )}
          {viewMode === 'table' && (
            <>
              <div className="hidden md:block">
                <ThreatsTable
                  items={filteredAndSortedData}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onItemClick={(item) => {
                    setSelectedThreat(item)
                    syncFiltersToUrl({ id: item.threatId })
                  }}
                />
              </div>
              <div className="md:hidden">
                <MobileThreatsList
                  items={filteredAndSortedData}
                  onItemClick={(item) => {
                    setSelectedThreat(item)
                    syncFiltersToUrl({ id: item.threatId })
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {/* End detail dialog wrapper */}
      <AnimatePresence>
        {selectedThreat && (
          <ThreatDetailDialog
            threat={selectedThreat}
            onClose={() => {
              setSelectedThreat(null)
              syncFiltersToUrl({ id: null })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
