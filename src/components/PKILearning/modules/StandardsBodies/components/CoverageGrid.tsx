// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React from 'react'
import { COVERAGE_GRID, REGION_LABELS, ORG_TYPE_LABELS } from '../data'
import type { RegionKey, OrgTypeKey } from '../data'

export interface GridSelection {
  region: RegionKey
  orgType: OrgTypeKey
}

interface CoverageGridProps {
  selection: GridSelection | null
  onSelect: (selection: GridSelection) => void
}

const REGIONS: RegionKey[] = ['global', 'us', 'eu', 'uk', 'asia-pacific']
const ORG_TYPES: OrgTypeKey[] = [
  'standards-body',
  'certification-body',
  'compliance-framework',
  'regulatory-agency',
]

function orgTypeBadgeClass(type: OrgTypeKey): string {
  switch (type) {
    case 'standards-body':
      return 'text-primary'
    case 'certification-body':
      return 'text-status-info'
    case 'compliance-framework':
      return 'text-status-warning'
    case 'regulatory-agency':
      return 'text-status-error'
  }
}

export const CoverageGrid: React.FC<CoverageGridProps> = ({ selection, onSelect }) => {
  const selectedCell = selection ? COVERAGE_GRID[selection.region][selection.orgType] : null

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Click any cell in the grid to see which organizations operate in that region and category.
      </p>

      {/* Scrollable grid wrapper */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              {/* Region header column */}
              <th className="text-left py-2 pr-3 w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Region
              </th>
              {ORG_TYPES.map((type) => (
                <th
                  key={type}
                  className={`text-center py-2 px-2 text-xs font-semibold uppercase tracking-wide ${orgTypeBadgeClass(type)}`}
                >
                  {ORG_TYPE_LABELS[type]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((region, rowIdx) => (
              <tr key={region} className={rowIdx % 2 === 0 ? 'bg-muted/10' : ''}>
                <td className="py-2 pr-3 text-sm font-semibold text-foreground whitespace-nowrap">
                  {REGION_LABELS[region]}
                </td>
                {ORG_TYPES.map((type) => {
                  const cell = COVERAGE_GRID[region][type]
                  const isSelected = selection?.region === region && selection?.orgType === type

                  return (
                    <td key={type} className="py-1 px-1">
                      <button
                        onClick={() => onSelect({ region, orgType: type })}
                        className={`w-full text-left p-2 rounded-lg border text-xs transition-colors min-h-[52px]
                          ${
                            isSelected
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/30 hover:text-foreground'
                          }`}
                      >
                        <div className="line-clamp-2 leading-tight">
                          {cell.orgs[0] === '—'
                            ? '—'
                            : cell.orgs.slice(0, 2).join(', ') +
                              (cell.orgs.length > 2 ? ` +${cell.orgs.length - 2}` : '')}
                        </div>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selectedCell && selection && (
        <div className="bg-muted/30 rounded-xl border border-border p-4 sm:p-6 space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {REGION_LABELS[selection.region]} — {ORG_TYPE_LABELS[selection.orgType]}
              </div>
              <h3 className="text-lg font-bold text-foreground">Organizations</h3>
            </div>
          </div>

          {/* Org list */}
          <div className="flex flex-wrap gap-2">
            {selectedCell.orgs.map((org, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border font-medium ${
                  org === '—'
                    ? 'text-muted-foreground border-border bg-muted/20'
                    : 'text-foreground border-primary/30 bg-primary/5'
                }`}
              >
                {org}
              </span>
            ))}
          </div>

          {/* Note */}
          {selectedCell.note && (
            <div className="bg-background rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground italic">{selectedCell.note}</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-4">
        {ORG_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`font-semibold ${orgTypeBadgeClass(type)}`}>■</span>
            <span>{ORG_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
