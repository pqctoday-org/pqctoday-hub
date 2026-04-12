// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, Key, Shield, Database, FileKey, Lock, UserCheck, Coins } from 'lucide-react'
import {
  SECRET_CATEGORIES,
  HNDL_RISK_LABELS,
  type SecretCategory,
  type PQCRiskLevel,
} from '../data/secretsConstants'
import { Button } from '@/components/ui/button'

const SECRET_TYPE_ICONS: Record<string, React.ReactNode> = {
  'api-key': <Key size={20} className="text-primary" />,
  'db-credential': <Database size={20} className="text-primary" />,
  'tls-cert': <Shield size={20} className="text-primary" />,
  'signing-key': <FileKey size={20} className="text-primary" />,
  'encryption-key': <Lock size={20} className="text-primary" />,
  'oauth-token': <UserCheck size={20} className="text-primary" />,
  'service-account': <UserCheck size={20} className="text-secondary" />,
  'seed-phrase': <Coins size={20} className="text-primary" />,
}

const RISK_BADGE_CLASSES: Record<PQCRiskLevel, string> = {
  critical: 'text-status-error bg-status-error/10 border-status-error/30',
  high: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  medium: 'text-status-info bg-status-info/10 border-status-info/30',
  low: 'text-status-success bg-status-success/10 border-status-success/30',
}

const HNDL_BADGE_CLASSES: Record<string, string> = {
  immediate: 'text-status-error',
  delayed: 'text-status-warning',
  none: 'text-status-success',
}

const HNDL_LABELS: Record<string, string> = {
  immediate: 'Immediate HNDL',
  delayed: 'Delayed HNDL',
  none: 'No HNDL Risk',
}

interface SecretCardProps {
  category: SecretCategory
  selected: boolean
  onToggle: () => void
}

const SecretCard: React.FC<SecretCardProps> = ({ category, selected, onToggle }) => {
  const [expanded, setExpanded] = useState(false)
  const riskClass = RISK_BADGE_CLASSES[category.pqcRisk]
  const hndlClass = HNDL_BADGE_CLASSES[category.hndlExposure]

  return (
    <div
      className={`glass-panel p-4 cursor-pointer transition-all border-2 ${
        selected ? 'border-primary' : 'border-border'
      }`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
            {SECRET_TYPE_ICONS[category.type]}
          </div>
          <span className="text-sm font-bold text-foreground">{category.name}</span>
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{category.description}</p>

      <div className="flex flex-wrap gap-2 mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${riskClass}`}>
          {HNDL_RISK_LABELS[category.pqcRisk]} Risk
        </span>
        <span className={`text-[10px] font-medium ${hndlClass}`}>
          {HNDL_LABELS[category.hndlExposure]}
        </span>
      </div>

      <Button
        variant="ghost"
        className="text-[10px] text-primary hover:underline"
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
      >
        {expanded ? 'Hide details' : 'Show mitigation'}
      </Button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-border pt-2">
          <div>
            <div className="text-[10px] font-bold text-foreground mb-1">Transit Risk</div>
            <p className="text-[10px] text-muted-foreground">{category.transitRisk}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold text-foreground mb-1">At-Rest Risk</div>
            <p className="text-[10px] text-muted-foreground">{category.atRestRisk}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold text-primary mb-1">Mitigation Strategy</div>
            <p className="text-[10px] text-muted-foreground">{category.mitigationStrategy}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground mb-1">Example Products</div>
            <div className="flex flex-wrap gap-1">
              {category.exampleProducts.map((p) => (
                <span
                  key={p}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const SecretsArchitectureMapper: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllCritical = () => {
    const criticalIds = SECRET_CATEGORIES.filter((c) => c.pqcRisk === 'critical').map((c) => c.id)
    setSelectedIds(new Set(criticalIds))
  }

  const clearAll = () => setSelectedIds(new Set())

  const selectedCategories = SECRET_CATEGORIES.filter((c) => selectedIds.has(c.id))
  const countByRisk = (risk: PQCRiskLevel) =>
    selectedCategories.filter((c) => c.pqcRisk === risk).length
  const totalCritical = SECRET_CATEGORIES.filter((c) => c.pqcRisk === 'critical').length
  const totalHigh = SECRET_CATEGORIES.filter((c) => c.pqcRisk === 'high').length

  const priorityActions = selectedCategories
    .filter((c) => c.pqcRisk === 'critical' || c.pqcRisk === 'high')
    .sort((a, b) => {
      const order: PQCRiskLevel[] = ['critical', 'high', 'medium', 'low']
      return order.indexOf(a.pqcRisk) - order.indexOf(b.pqcRisk)
    })

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-status-warning shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground mb-1">Select Your Secret Types</div>
            <p className="text-xs text-muted-foreground">
              Check each secret type present in your environment. The summary panel below will show
              your prioritized migration actions based on PQC risk and HNDL exposure.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={selectAllCritical}
          className="flex items-center gap-2 px-3 py-2 bg-status-error/10 text-status-error rounded-lg hover:bg-status-error/20 transition-colors text-sm border border-status-error/30 font-medium"
        >
          <AlertTriangle size={14} />
          Select All Critical ({totalCritical})
        </Button>
        <Button
          variant="ghost"
          onClick={clearAll}
          className="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
        >
          Clear All
        </Button>
        <span className="text-xs text-muted-foreground self-center ml-2">
          {selectedIds.size} of {SECRET_CATEGORIES.length} selected
        </span>
      </div>

      {/* Secret Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {SECRET_CATEGORIES.map((category) => (
          <SecretCard
            key={category.id}
            category={category}
            selected={selectedIds.has(category.id)}
            onToggle={() => toggleItem(category.id)}
          />
        ))}
      </div>

      {/* Summary Panel */}
      <div className="glass-panel p-6 border-primary/20">
        <h3 className="text-lg font-bold text-foreground mb-4">Risk Summary</h3>

        {selectedIds.size === 0 ? (
          <p className="text-muted-foreground text-sm">
            Select secret types above to see your risk summary and prioritized action list.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Risk counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  {
                    risk: 'critical',
                    label: 'Critical',
                    cls: 'text-status-error bg-status-error/10 border-status-error/30',
                  },
                  {
                    risk: 'high',
                    label: 'High',
                    cls: 'text-status-warning bg-status-warning/10 border-status-warning/30',
                  },
                  {
                    risk: 'medium',
                    label: 'Medium',
                    cls: 'text-status-info bg-status-info/10 border-status-info/30',
                  },
                  {
                    risk: 'low',
                    label: 'Low',
                    cls: 'text-status-success bg-status-success/10 border-status-success/30',
                  },
                ] as const
              ).map(({ risk, label, cls }) => (
                <div key={risk} className={`rounded-lg p-3 border text-center ${cls}`}>
                  <div className="text-xl font-bold">{countByRisk(risk as PQCRiskLevel)}</div>
                  <div className="text-[10px] font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Coverage hint */}
            {countByRisk('critical') < totalCritical && (
              <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-3 text-xs text-status-warning">
                <strong>Note:</strong> Your environment includes {totalCritical} critical-risk
                secret types, {totalHigh} high-risk types. Consider &quot;Select All Critical&quot;
                for a complete picture.
              </div>
            )}

            {/* Prioritized actions */}
            {priorityActions.length > 0 && (
              <div>
                <div className="text-sm font-bold text-foreground mb-2">
                  Prioritized Migration Actions
                </div>
                <div className="space-y-2">
                  {priorityActions.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
                    >
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${RISK_BADGE_CLASSES[cat.pqcRisk]}`}
                      >
                        P{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground">{cat.name}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {cat.mitigationStrategy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCategories.filter((c) => c.pqcRisk !== 'critical' && c.pqcRisk !== 'high')
              .length > 0 && (
              <p className="text-xs text-muted-foreground">
                Medium/low risk items: address after critical and high priorities are resolved.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
