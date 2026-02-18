import { ExternalLink, Flag } from 'lucide-react'
import type { GanttCountryData, Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { StatusBadge } from '../common/StatusBadge'

interface DocumentTableProps {
  data: GanttCountryData[]
  title?: string
}

interface DocumentRow {
  countryName: string
  org: string
  phase: string
  type: string
  title: string
  startYear: number
  endYear: number
  description: string
  sourceUrl?: string
  sourceDate?: string
  status?: string
}

export const DocumentTable = ({ data, title }: DocumentTableProps) => {
  const rows: DocumentRow[] = data.flatMap((countryData) =>
    countryData.phases.map((phase) => ({
      countryName: countryData.country.countryName,
      org: countryData.country.bodies.map((b) => b.name).join(', '),
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

  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-bold text-gradient mb-3">
        {title ?? `Documents (${rows.length} results)`}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          — {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
        </span>
      </h3>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Organization
              </th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Phase
              </th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Type
              </th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Period
              </th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const colors = phaseColors[row.phase as Phase] || {
                start: 'hsl(var(--muted-foreground))',
                end: 'hsl(var(--muted))',
                glow: 'hsl(var(--ring))',
              }
              const truncatedDesc =
                row.description.length > 120 ? row.description.slice(0, 120) + '…' : row.description

              return (
                <tr
                  key={idx}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  {/* Organization */}
                  <td className="px-3 py-2 text-foreground font-medium whitespace-nowrap">
                    {row.org}
                  </td>

                  {/* Phase badge */}
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-black whitespace-nowrap"
                      style={{ backgroundColor: colors.start }}
                    >
                      {row.phase}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2">
                    {row.type === 'Milestone' ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Flag size={10} />
                        <span>Milestone</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Phase</span>
                    )}
                  </td>

                  {/* Title */}
                  <td className="px-3 py-2 text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{row.title}</span>
                      {row.status && (
                        <StatusBadge status={row.status as 'New' | 'Updated'} size="sm" />
                      )}
                    </div>
                  </td>

                  {/* Period */}
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                    {row.startYear < 2025 ? '<2024' : row.startYear}
                    {row.startYear !== row.endYear && ` – ${row.endYear}`}
                  </td>

                  {/* Description */}
                  <td className="px-3 py-2 text-muted-foreground max-w-xs" title={row.description}>
                    {truncatedDesc}
                  </td>

                  {/* Source */}
                  <td className="px-3 py-2">
                    {row.sourceUrl ? (
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                        title={row.sourceUrl}
                        aria-label={`Source for ${row.title}`}
                      >
                        <ExternalLink size={12} />
                        <span>View</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
