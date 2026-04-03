// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { getIndustryIcon } from './threatsHelper'
import type { ThreatItem } from '../../data/threatsData'
import { StatusBadge } from '../common/StatusBadge'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import clsx from 'clsx'

interface ThreatCardProps {
  item: ThreatItem
  index?: number
  onClick?: (item: ThreatItem) => void
}

export const ThreatCard = ({ item, index = 0, onClick }: ThreatCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="glass-panel p-5 flex flex-col h-full hover:border-secondary/50 transition-colors bg-card/50 relative cursor-pointer"
      onClick={() => onClick?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(item)
        }
      }}
    >
      {/* Top row: layer badge + status */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs"
          title={item.industry}
        >
          {getIndustryIcon(item.industry, 12)}
          <span className="hidden sm:inline">{item.industry}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {item.status && <StatusBadge status={item.status} size="sm" />}
          <span
            className={clsx(
              'px-2 py-0.5 rounded text-xs font-bold border',
              item.criticality.toLowerCase() === 'critical'
                ? 'bg-status-error text-status-error border-status-error'
                : item.criticality.toLowerCase() === 'high'
                  ? 'bg-status-error text-status-error border-status-error'
                  : 'bg-primary/10 text-primary border-primary/20'
            )}
          >
            {item.criticality}
          </span>
        </div>
      </div>

      {/* Threat title & id */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground leading-snug font-mono">
          {item.threatId}
        </h3>
        <TrustScoreBadge resourceType="threats" resourceId={item.threatId} size="sm" />
      </div>

      <p className="text-xs text-muted-foreground mb-4 line-clamp-3 leading-relaxed min-h-[4.5em]">
        {item.description}
      </p>

      {/* Crypto & PQC Replacements block */}
      <div className="flex flex-col gap-2 mt-auto text-xs font-mono">
        <div className="flex flex-wrap gap-1">
          <span className="text-muted-foreground/50 mr-1 text-[10px] uppercase font-sans tracking-wide self-center">
            At Risk:
          </span>
          {item.cryptoAtRisk.split(',').map((c, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded-sm bg-muted/50 border border-border/50 text-muted-foreground whitespace-nowrap"
            >
              {c.trim()}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-status-success/50 mr-1 text-[10px] uppercase font-sans tracking-wide self-center">
            PQC Repl:
          </span>
          {item.pqcReplacement.split(',').map((c, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded-sm bg-status-success/10 border border-status-success/20 text-status-success/80 whitespace-nowrap"
            >
              {c.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                `**At-Risk Crypto:** ${item.cryptoAtRisk}`,
                `**PQC Mitigation:** ${item.pqcReplacement}`,
              ].join('\n'),
              pageUrl: `/threats?threat=${encodeURIComponent(item.threatId)}`,
            })}
            resourceLabel="Endorse"
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
                `**At-Risk Crypto:** ${item.cryptoAtRisk}`,
                `**PQC Mitigation:** ${item.pqcReplacement}`,
              ].join('\n'),
              pageUrl: `/threats?threat=${encodeURIComponent(item.threatId)}`,
            })}
            resourceLabel="Flag"
            resourceType="Threat"
          />
        </div>
      </div>
    </motion.article>
  )
}
