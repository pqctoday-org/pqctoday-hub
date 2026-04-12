// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { AlertTriangle, Shield, ArrowUpDown, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IAM_COMPONENTS, type HNDLRisk, type MigrationPriority } from '../data/iamConstants'

type SortKey = 'name' | 'quantumRisk' | 'migrationPriority'
type SortDir = 'asc' | 'desc'

const RISK_ORDER: Record<HNDLRisk, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const PRIORITY_ORDER: Record<MigrationPriority, number> = {
  immediate: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const RISK_STYLES: Record<HNDLRisk, { badge: string; dot: string; label: string }> = {
  critical: {
    badge: 'bg-status-error/10 text-status-error border-status-error/30',
    dot: 'bg-status-error',
    label: 'Critical',
  },
  high: {
    badge: 'bg-warning/10 text-warning border-warning/30',
    dot: 'bg-warning',
    label: 'High',
  },
  medium: {
    badge: 'bg-primary/10 text-primary border-primary/30',
    dot: 'bg-primary',
    label: 'Medium',
  },
  low: {
    badge: 'bg-status-success/10 text-status-success border-status-success/30',
    dot: 'bg-status-success',
    label: 'Low',
  },
}

const PRIORITY_STYLES: Record<MigrationPriority, { className: string; label: string }> = {
  immediate: { className: 'text-status-error font-bold', label: 'Immediate' },
  high: { className: 'text-warning font-semibold', label: 'High' },
  medium: { className: 'text-primary', label: 'Medium' },
  low: { className: 'text-status-success', label: 'Low' },
}

export const IAMCryptoInventory: React.FC = () => {
  const [sortKey, setSortKey] = useState<SortKey>('quantumRisk')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...IAM_COMPONENTS].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortKey === 'quantumRisk') {
        cmp = RISK_ORDER[a.quantumRisk] - RISK_ORDER[b.quantumRisk]
      } else if (sortKey === 'migrationPriority') {
        cmp = PRIORITY_ORDER[a.migrationPriority] - PRIORITY_ORDER[b.migrationPriority]
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, sortDir])

  const summary = useMemo(() => {
    const counts: Record<HNDLRisk, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    IAM_COMPONENTS.forEach((c) => counts[c.quantumRisk]++)
    return counts
  }, [])

  const renderSortButton = (col: SortKey, label: string) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 text-muted-foreground font-medium hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown
        size={12}
        className={sortKey === col ? 'text-primary' : 'text-muted-foreground/50'}
      />
    </Button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">IAM Crypto Inventory</h3>
        <p className="text-sm text-muted-foreground">
          Review the cryptographic exposure of each IAM component. Sort by quantum risk or migration
          priority to identify where to focus your PQC migration effort.
        </p>
      </div>

      {/* Risk Summary */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Risk Summary — 8 IAM Components</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['critical', 'high', 'medium', 'low'] as HNDLRisk[]).map((risk) => {
            const style = RISK_STYLES[risk]
            return (
              <div
                key={risk}
                className={`rounded-lg p-3 border text-center ${style.badge.replace('text-', 'border-')} bg-muted/50`}
              >
                <div className={`text-2xl font-bold ${style.badge.split(' ')[1]}`}>
                  {summary[risk]}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">{risk} risk</div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <strong className="text-status-error">
            {summary.critical + summary.high} of 8 components
          </strong>{' '}
          have high or critical quantum risk. Immediate priority items should be in your 2025-2026
          migration plan.
        </p>
      </div>

      {/* Table */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left py-3 px-4 font-medium">
                  {renderSortButton('name', 'Component')}
                </th>
                <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">
                  Current Algorithm
                </th>
                <th className="text-center py-3 px-4 font-medium">
                  {renderSortButton('quantumRisk', 'Risk')}
                </th>
                <th className="text-center py-3 px-4 font-medium">
                  {renderSortButton('migrationPriority', 'Priority')}
                </th>
                <th className="text-center py-3 px-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((component) => {
                const riskStyle = RISK_STYLES[component.quantumRisk]
                const priorityStyle = PRIORITY_STYLES[component.migrationPriority]
                const isSelected = selectedId === component.id
                return (
                  <React.Fragment key={component.id}>
                    <tr
                      className={`border-b border-border/50 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${riskStyle.dot}`} />
                          <div>
                            <div className="font-medium text-foreground text-xs sm:text-sm">
                              {component.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {component.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <code className="text-[10px] text-muted-foreground font-mono">
                          {component.currentAlgorithm}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${riskStyle.badge}`}
                        >
                          {riskStyle.label}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-center text-xs ${priorityStyle.className}`}>
                        {priorityStyle.label}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedId(isSelected ? null : component.id)}
                          className="text-xs"
                        >
                          <Info size={14} />
                        </Button>
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className="bg-primary/5 border-b border-border/50">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-background rounded-lg p-3 border border-border">
                                <div className="text-[10px] font-bold text-status-error mb-1">
                                  Current (Quantum-Vulnerable)
                                </div>
                                <code className="text-muted-foreground font-mono">
                                  {component.currentAlgorithm}
                                </code>
                              </div>
                              <div className="bg-background rounded-lg p-3 border border-primary/20">
                                <div className="text-[10px] font-bold text-primary mb-1">
                                  PQC Replacement
                                </div>
                                <code className="text-muted-foreground font-mono">
                                  {component.pqcReplacement}
                                </code>
                              </div>
                            </div>
                            <div className="bg-background rounded-lg p-3 border border-border flex items-start gap-2">
                              <AlertTriangle
                                size={14}
                                className="text-warning shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <p className="text-muted-foreground">{component.notes}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immediate Action Items */}
      <div className="glass-panel p-5 border-status-error/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-status-error" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground">Immediate Migration Actions</h4>
        </div>
        <div className="space-y-2">
          {IAM_COMPONENTS.filter((c) => c.migrationPriority === 'immediate').map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
            >
              <CheckCircle2
                size={14}
                className="text-status-error shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground">{c.name}</div>
                <p className="text-[10px] text-muted-foreground">{c.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
