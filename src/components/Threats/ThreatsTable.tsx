// SPDX-License-Identifier: GPL-3.0-only
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, ChevronDown, ShieldAlert, BookmarkCheck, Bookmark } from 'lucide-react'
import type { ThreatItem } from '../../data/threatsData'
import { StatusBadge } from '../common/StatusBadge'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import clsx from 'clsx'
import { getIndustryIcon } from './threatsHelper'
import { EmptyState } from '../ui/empty-state'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import { Button } from '@/components/ui/button'

export type SortField = 'industry' | 'threatId' | 'criticality'
export type SortDirection = 'asc' | 'desc'

interface ThreatsTableProps {
  items: ThreatItem[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onItemClick: (item: ThreatItem) => void
}

export const ThreatsTable = ({
  items,
  sortField,
  sortDirection,
  onSort,
  onItemClick,
}: ThreatsTableProps) => {
  const myThreats = useBookmarkStore((s) => s.myThreats)
  const toggleMyThreat = useBookmarkStore((s) => s.toggleMyThreat)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert size={32} />}
        title="No threats found"
        description="No threats match your current filters. Try adjusting the industry or search query."
      />
    )
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[155px]" />
            <col className="w-[155px]" />
            <col className="w-[215px]" />
            <col className="w-[95px]" />
            <col className="w-[185px]" />
            <col className="w-[195px]" />
            <col className="w-[95px]" />
            <col className="w-[50px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th
                className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => onSort('industry')}
              >
                <div className="flex items-center gap-1 justify-center md:justify-start">
                  <span className="md:hidden">Ind.</span>
                  <span className="hidden md:inline">Industry</span>
                  {sortField === 'industry' &&
                    (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th
                className="hidden md:table-cell p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => onSort('threatId')}
              >
                <div className="flex items-center gap-1">
                  ID
                  {sortField === 'threatId' &&
                    (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="hidden md:table-cell p-4 font-semibold text-sm">Description</th>
              <th
                className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => onSort('criticality')}
              >
                <div className="flex items-center gap-1 justify-center md:justify-start">
                  <span className="md:hidden">Crit.</span>
                  <span className="hidden md:inline">Criticality</span>
                  {sortField === 'criticality' &&
                    (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="p-4 font-semibold text-sm">Crypto</th>
              <th className="p-4 font-semibold text-sm">PQC Repl.</th>
              <th className="hidden lg:table-cell p-4 font-semibold text-sm text-center">
                Actions
              </th>
              <th className="p-4 font-semibold text-sm text-center">Info</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.tr
                  key={item.threatId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => onItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onItemClick(item)
                    }
                  }}
                >
                  <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors text-center md:text-left">
                    <span
                      className="md:hidden flex items-center justify-center text-primary"
                      title={item.industry}
                    >
                      {getIndustryIcon(item.industry, 16)}
                    </span>
                    <span className="hidden md:inline">{item.industry}</span>
                  </td>
                  <td className="hidden md:table-cell p-4 text-sm font-mono text-primary/80">
                    <div className="flex items-center gap-2">
                      {item.threatId}
                      <StatusBadge status={item.status} size="sm" />
                      <TrustScoreBadge
                        resourceType="threats"
                        resourceId={item.threatId}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="hidden md:table-cell p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors overflow-hidden">
                    <div className="line-clamp-2 md:line-clamp-3">{item.description}</div>
                    <div className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-wider truncate">
                      Source: {item.mainSource}
                    </div>
                  </td>
                  <td className="p-4 text-center md:text-left overflow-hidden">
                    <span
                      className={clsx(
                        'hidden md:inline-block px-2 py-1 rounded text-xs font-bold border',
                        item.criticality.toLowerCase() === 'critical' ||
                          item.criticality.toLowerCase() === 'high'
                          ? 'bg-status-error text-status-error border-status-error'
                          : 'bg-primary/10 text-primary border-primary/20'
                      )}
                    >
                      {item.criticality}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono overflow-hidden">
                    <div className="flex flex-wrap gap-1">
                      {item.cryptoAtRisk.split(',').map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-sm bg-muted/50 border border-border/50 text-muted-foreground break-words"
                        >
                          {c.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono overflow-hidden">
                    <div className="flex flex-wrap gap-1">
                      {item.pqcReplacement.split(',').map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-sm bg-status-success/10 border border-status-success/20 text-status-success/80 break-words"
                        >
                          {c.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell p-4 text-center">
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                      className="flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => toggleMyThreat(item.threatId)}
                        className={`p-1 rounded transition-colors ${
                          myThreats.includes(item.threatId)
                            ? 'text-primary hover:text-primary/80'
                            : 'text-muted-foreground/40 hover:text-primary'
                        }`}
                        aria-label={
                          myThreats.includes(item.threatId)
                            ? 'Remove from My Threats'
                            : 'Add to My Threats'
                        }
                      >
                        {myThreats.includes(item.threatId) ? (
                          <BookmarkCheck size={16} />
                        ) : (
                          <Bookmark size={16} />
                        )}
                      </Button>
                      <EndorseButton
                        endorseUrl={buildEndorsementUrl({
                          category: 'threat-endorsement',
                          title: `Endorse: ${item.threatId} — ${item.industry}`,
                          resourceType: 'Threat Assessment',
                          resourceId: item.threatId,
                          resourceDetails: [
                            `**Threat ID:** ${item.threatId}`,
                            `**Industry:** ${item.industry}`,
                            `**Criticality:** ${item.criticality}`,
                          ].join('\n'),
                          pageUrl: `/threats?threat=${encodeURIComponent(item.threatId)}`,
                        })}
                        resourceLabel={item.threatId}
                        resourceType="Threat"
                      />
                      <FlagButton
                        flagUrl={buildFlagUrl({
                          category: 'threat-endorsement',
                          title: `Flag: ${item.threatId} — ${item.industry}`,
                          resourceType: 'Threat Assessment',
                          resourceId: item.threatId,
                          resourceDetails: [
                            `**Threat ID:** ${item.threatId}`,
                            `**Industry:** ${item.industry}`,
                            `**Criticality:** ${item.criticality}`,
                          ].join('\n'),
                          pageUrl: `/threats?threat=${encodeURIComponent(item.threatId)}`,
                        })}
                        resourceLabel={item.threatId}
                        resourceType="Threat"
                      />
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="text-muted-foreground group-hover:text-primary transition-colors flex justify-center items-center h-full">
                      <ChevronDown className="-rotate-90" size={16} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
