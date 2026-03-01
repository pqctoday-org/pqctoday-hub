// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Flag, Info, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import type { GanttCountryData, Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import {
  timelineEnrichments,
  hasSubstantiveEnrichment,
  getTimelineEnrichmentKey,
} from '../../data/timelineEnrichmentData'
import { StatusBadge } from '../common/StatusBadge'
import { ViewToggle } from '../Library/ViewToggle'
import type { ViewMode } from '../Library/ViewToggle'
import { TimelineDocumentCard } from './TimelineDocumentCard'
import {
  TimelineDocumentDetailPopover,
  type TimelineDocumentRow,
} from './TimelineDocumentDetailPopover'

interface DocumentTableProps {
  data: GanttCountryData[]
  title?: string
}

type SortKey = keyof Pick<TimelineDocumentRow, 'phase' | 'title' | 'type' | 'org' | 'startYear'>
type SortDirection = 'asc' | 'desc'

const SORT_HEADERS: { key: SortKey; label: string }[] = [
  { key: 'phase', label: 'Phase' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'org', label: 'Organization' },
  { key: 'startYear', label: 'Period' },
]

export const DocumentTable = ({ data, title }: DocumentTableProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [selectedRow, setSelectedRow] = useState<TimelineDocumentRow | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'startYear',
    direction: 'asc',
  })

  const rows: TimelineDocumentRow[] = data.flatMap((countryData) =>
    countryData.phases.map((phase) => ({
      countryName: countryData.country.countryName,
      org: phase.events[0]?.orgName || countryData.country.bodies.map((b) => b.name).join(', '),
      phase: phase.phase,
      type: phase.type,
      title: phase.title,
      startYear: phase.startYear,
      endYear: phase.endYear,
      description: phase.description,
      sourceUrl: phase.events[0]?.sourceUrl,
      sourceDate: phase.events[0]?.sourceDate,
      status: phase.status,
    }))
  )

  if (rows.length === 0) return null

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedRows = [...rows].sort((a, b) => {
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return sortConfig.direction === 'asc' ? cmp : -cmp
  })

  const formatPeriod = (row: TimelineDocumentRow) =>
    row.startYear < 2025
      ? `< 2024${row.startYear !== row.endYear ? ` – ${row.endYear}` : ''}`
      : row.startYear === row.endYear
        ? String(row.startYear)
        : `${row.startYear} – ${row.endYear}`

  return (
    <div className="glass-panel p-4 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-gradient">
          {title ?? `Documents`}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            — {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
        </h3>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {/* Cards view */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {rows.map((row, i) => (
              <TimelineDocumentCard
                key={`${row.org}-${row.phase}-${row.title}-${i}`}
                row={row}
                onViewDetails={setSelectedRow}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {SORT_HEADERS.map((header) => (
                    <th
                      key={header.key}
                      scope="col"
                      aria-sort={
                        sortConfig.key === header.key
                          ? sortConfig.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className="p-4 font-semibold text-sm"
                    >
                      <button
                        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 -ml-1"
                        onClick={() => handleSort(header.key)}
                      >
                        {header.label}
                        {sortConfig.key === header.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={14} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={14} aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown
                            size={14}
                            className="text-muted-foreground/50"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </th>
                  ))}
                  {/* Actions column */}
                  <th scope="col" className="p-4 font-semibold text-sm" />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, idx) => {
                  const colors = phaseColors[row.phase as Phase] || {
                    start: 'hsl(var(--muted-foreground))',
                    end: 'hsl(var(--muted))',
                    glow: 'hsl(var(--ring))',
                  }
                  const enrichmentKey = getTimelineEnrichmentKey(
                    row.countryName,
                    row.org,
                    row.title
                  )
                  const enrichment = timelineEnrichments[enrichmentKey]
                  const rowIsEnriched = !!enrichment && hasSubstantiveEnrichment(enrichment)
                  return (
                    <tr
                      key={`${row.org}-${row.phase}-${idx}`}
                      className="border-b border-border hover:bg-muted/50 transition-colors group"
                    >
                      {/* Phase */}
                      <td className="p-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-black whitespace-nowrap"
                          style={{ backgroundColor: colors.start }}
                        >
                          {row.phase}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{row.title}</span>
                          {row.sourceUrl && (
                            <a
                              href={row.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded"
                              aria-label={`Open source for ${row.title}`}
                            >
                              <ExternalLink size={14} aria-hidden="true" />
                            </a>
                          )}
                          <StatusBadge
                            status={row.status as 'New' | 'Updated' | undefined}
                            size="sm"
                          />
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                        <span
                          className={clsx('inline-flex items-center gap-1', {
                            'text-muted-foreground': row.type !== 'Milestone',
                          })}
                        >
                          {row.type === 'Milestone' && <Flag size={12} aria-hidden="true" />}
                          {row.type}
                        </span>
                      </td>

                      {/* Organization */}
                      <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        <span className="font-mono text-primary/80">{row.org}</span>
                      </td>

                      {/* Period */}
                      <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap font-mono">
                        {formatPeriod(row)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-sm">
                        <button
                          onClick={() => setSelectedRow(row)}
                          className={clsx(
                            'p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                            rowIsEnriched
                              ? 'text-primary hover:text-primary/80 hover:bg-primary/10'
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                          )}
                          title={
                            rowIsEnriched
                              ? 'View details (document analysis available)'
                              : 'View details'
                          }
                          aria-label={`View details for ${row.title}`}
                        >
                          {rowIsEnriched ? (
                            <Sparkles size={16} aria-hidden="true" />
                          ) : (
                            <Info size={16} aria-hidden="true" />
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TimelineDocumentDetailPopover
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
    </div>
  )
}
