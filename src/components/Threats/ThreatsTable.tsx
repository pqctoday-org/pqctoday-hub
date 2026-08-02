// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, ChevronDown, ShieldAlert, BookmarkCheck, Bookmark } from 'lucide-react'
import type { ThreatItem } from '../../data/threatsData'
import { StatusBadge } from '../common/StatusBadge'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { ThreatActionsMenu } from './ThreatActionsMenu'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import clsx from 'clsx'
import { getIndustryIcon, capChips } from './threatsHelper'
import { ThreatClassBadge, ShorTierBadge } from './ThreatClassBadges'
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
        {/* min-w lowered from 1035px — the crypto/PQC-replacement columns no
          longer need as much room now that their chip lists are capped
          (Threats #6), so the table reflows into scroll-free range sooner. */}
        <table className="w-full min-w-[925px] text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[140px]" />
            <col className="w-[130px]" />
            <col className="w-[190px]" />
            <col className="w-[80px]" />
            <col className="w-[165px]" />
            <col className="w-[170px]" />
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
            {(() => {
              const groups: [string, ThreatItem[]][] = []
              const seen = new Map<string, ThreatItem[]>()
              for (const item of items) {
                if (!seen.has(item.industry)) {
                  seen.set(item.industry, [])
                  groups.push([item.industry, seen.get(item.industry)!])
                }
                seen.get(item.industry)!.push(item)
              }
              return groups.map(([industry, groupItems]) => {
                const slug = industry.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                return (
                  <React.Fragment key={industry}>
                    <tr id={`industry-${slug}`} className="bg-muted/10 border-b border-border/40">
                      <td colSpan={8} className="px-4 py-2">
                        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {getIndustryIcon(industry, 13)}
                          {industry}
                        </span>
                      </td>
                    </tr>
                    <AnimatePresence mode="popLayout">
                      {groupItems.map((item) => (
                        <motion.tr
                          key={item.threatId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-border hover:bg-muted/30 transition-colors group cursor-pointer"
                          // 2026-08-02 a11y: the row was `role="button"
                          // tabIndex={0}`, i.e. a focusable widget containing
                          // other focusable widgets (StatusBadge/TrustScoreBadge
                          // render controls) — `nested-interactive`, 114 nodes
                          // on /threats, and the inner controls were unreachable
                          // to a screen reader. The threat-id cell below is now
                          // the row's one focusable action; this click stays as
                          // a redundant mouse convenience.
                          onClick={() => onItemClick(item)}
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
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onItemClick(item)
                                }}
                                aria-label={`Open ${item.threatId}`}
                                className="h-auto p-0 font-mono text-sm text-primary hover:bg-transparent"
                              >
                                {item.threatId}
                              </Button>
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
                            {/* Derived dimension: threat class — Threats #2 */}
                            <div className="hidden md:flex flex-wrap gap-1 mt-1.5">
                              <ThreatClassBadge threat={item} />
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono overflow-hidden">
                            <div className="flex flex-wrap items-center gap-1">
                              {/* Shor tier describes the urgency of breaking this specific
                              crypto, so it lives alongside the at-risk chips it qualifies
                              rather than as a co-equal pill next to Criticality. */}
                              <ShorTierBadge threat={item} />
                              {(() => {
                                const { visible, hiddenCount } = capChips(item.cryptoAtRisk)
                                return (
                                  <>
                                    {visible.map((c, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 rounded-sm bg-muted/50 border border-border/50 text-muted-foreground break-words"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                    {hiddenCount > 0 && (
                                      <span
                                        className="px-1.5 py-0.5 rounded-sm bg-muted/30 border border-border/50 text-muted-foreground"
                                        title={item.cryptoAtRisk}
                                      >
                                        +{hiddenCount} more
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono overflow-hidden">
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const { visible, hiddenCount } = capChips(item.pqcReplacement)
                                return (
                                  <>
                                    {visible.map((c, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 rounded-sm bg-status-success/10 border border-status-success/20 text-status-success/80 break-words"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                    {hiddenCount > 0 && (
                                      <span
                                        className="px-1.5 py-0.5 rounded-sm bg-status-success/5 border border-status-success/10 text-status-success/60"
                                        title={item.pqcReplacement}
                                      >
                                        +{hiddenCount} more
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
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
                              <ThreatActionsMenu
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
                  </React.Fragment>
                )
              })
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
