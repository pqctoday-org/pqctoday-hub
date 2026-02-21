import React, { useState } from 'react'
import { AlertOctagon, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'
import type { ThreatItem } from '../../data/threatsData'
import { ThreatDetailDialog } from './ThreatDetailDialog'
import { AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

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
    classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  'Medium-High': {
    icon: AlertCircle,
    classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
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
      {items.map((item) => {
        const config =
          criticalityConfig[item.criticality as CriticalityKey] ?? criticalityConfig.Medium
        const Icon = config.icon

        return (
          <button
            key={item.threatId}
            type="button"
            onClick={() => setSelectedThreat(item)}
            className="w-full text-left glass-panel p-4 hover:border-primary/30 transition-colors active:scale-[0.99]"
          >
            {/* Header: criticality + industry + status */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold',
                  config.classes
                )}
              >
                <Icon size={11} />
                {item.criticality}
              </span>
              <span className="text-xs text-muted-foreground truncate">{item.industry}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-foreground leading-snug mb-2 line-clamp-3">
              {item.description}
            </p>

            {/* Crypto at risk + PQC replacement */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  At Risk
                </p>
                <p className="text-xs font-mono text-muted-foreground leading-snug">
                  {item.cryptoAtRisk}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  PQC Replacement
                </p>
                <p className="text-xs font-mono text-foreground leading-snug">
                  {item.pqcReplacement}
                </p>
              </div>
            </div>
          </button>
        )
      })}

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
