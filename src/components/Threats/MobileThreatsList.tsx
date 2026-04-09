// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { AlertOctagon, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'
import type { ThreatItem } from '../../data/threatsData'
import { ThreatDetailDialog } from './ThreatDetailDialog'
import { AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'

interface MobileThreatsListProps {
  items: ThreatItem[]
}

const criticalityConfig = {
  Critical: {
    icon: AlertOctagon,
    classes: 'bg-status-error/10 text-status-error border-status-error/30',
  },
  High: {
    icon: AlertTriangle,
    classes: 'bg-status-error text-status-error border-status-error',
  },
  'Medium-High': {
    icon: AlertCircle,
    classes: 'bg-status-warning text-status-warning border-status-warning',
  },
  Medium: {
    icon: Info,
    classes: 'bg-status-info/10 text-status-info border-status-info/30',
  },
  Low: {
    icon: CheckCircle,
    classes: 'bg-status-success/10 text-status-success border-status-success/30',
  },
} as const

type CriticalityKey = keyof typeof criticalityConfig

export const MobileThreatsList: React.FC<MobileThreatsListProps> = ({ items }) => {
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null)

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((item) => {
          const config =
            criticalityConfig[item.criticality as CriticalityKey] ?? criticalityConfig.Medium
          const Icon = config.icon

          return (
            <li key={item.threatId}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedThreat(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedThreat(item)
                }}
                className="w-full text-left glass-panel p-4 hover:border-primary/30 transition-colors active:scale-[0.99] cursor-pointer"
              >
                {/* Header: criticality + industry + status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold',
                      config.classes
                    )}
                  >
                    <Icon size={11} aria-hidden="true" />
                    {item.criticality}
                  </span>
                  <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    {item.industry}
                    {item.mainSource && (
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] opacity-70 uppercase tracking-wider">
                        {item.mainSource.length > 20
                          ? item.mainSource.substring(0, 20) + '...'
                          : item.mainSource}
                      </span>
                    )}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-foreground leading-snug mb-2 line-clamp-3">
                  {item.description}
                </p>

                {/* Crypto at risk + PQC replacement */}
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                      At Risk
                    </p>
                    <p className="text-xs font-mono text-muted-foreground leading-snug">
                      {item.cryptoAtRisk}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                      PQC Replacement
                    </p>
                    <p className="text-xs font-mono text-foreground leading-snug">
                      {item.pqcReplacement}
                    </p>
                  </div>
                </div>
                {/* Actions Footer */}
                <div className="flex pt-3 mt-3 border-t border-border/50 items-center justify-end gap-2">
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
                        `**At-Risk Crypto:** ${item.cryptoAtRisk}`,
                        `**PQC Mitigation:** ${item.pqcReplacement}`,
                      ].join('\n'),
                      pageUrl: `/threats?threat=${encodeURIComponent(item.threatId)}`,
                    })}
                    resourceLabel={item.threatId}
                    resourceType="Threat"
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {items.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No threats found matching your filters.
        </div>
      )}

      <AnimatePresence>
        {selectedThreat && (
          <ThreatDetailDialog threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
