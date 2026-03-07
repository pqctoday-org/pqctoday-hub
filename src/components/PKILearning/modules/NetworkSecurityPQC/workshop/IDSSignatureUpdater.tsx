// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Bell, Shield, AlertTriangle, CheckCircle, Info, Activity } from 'lucide-react'
import { IDS_RULE_CATEGORIES } from '../data/networkConstants'
import { Button } from '@/components/ui/button'

type IDSRule = (typeof IDS_RULE_CATEGORIES)[number] & { enabled: boolean }

const RISK_COLORS: Record<string, string> = {
  low: 'text-status-success',
  medium: 'text-status-warning',
  high: 'text-status-error',
}

const RISK_BG: Record<string, string> = {
  low: 'bg-success/10 border-success/30',
  medium: 'bg-warning/10 border-warning/30',
  high: 'bg-destructive/10 border-destructive/30',
}

export const IDSSignatureUpdater: React.FC = () => {
  const [rules, setRules] = useState<IDSRule[]>(IDS_RULE_CATEGORIES.map((r) => ({ ...r })))
  const [fpRate, setFpRate] = useState(5) // false positive rate slider 0-20%
  const [expandedId, setExpandedId] = useState<string | null>('hybrid-kem-detection')

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const enableAll = () => setRules((prev) => prev.map((r) => ({ ...r, enabled: true })))
  const disableAll = () => setRules((prev) => prev.map((r) => ({ ...r, enabled: false })))

  const stats = useMemo(() => {
    const enabledRules = rules.filter((r) => r.enabled)
    const avgCoverage =
      enabledRules.length > 0
        ? Math.round(
            enabledRules.reduce((s, r) => s + r.detectionCoverage, 0) / enabledRules.length
          )
        : 0

    // Weighted detection coverage considering overlap
    const uniqueCoverage = Math.min(
      99,
      Math.round(enabledRules.reduce((acc, r) => acc + r.detectionCoverage * (1 - acc / 100), 0))
    )

    // High FP rules amplify alerts
    const highFpEnabled = enabledRules.filter((r) => r.falsePositiveRisk === 'high').length
    const fpMultiplier = 1 + highFpEnabled * 0.4

    const adjustedFpRate = Math.min(95, Math.round(fpRate * fpMultiplier * 10) / 10)

    return {
      enabledCount: enabledRules.length,
      totalCount: rules.length,
      avgCoverage,
      uniqueCoverage,
      adjustedFpRate,
      highFpEnabled,
    }
  }, [rules, fpRate])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">IDS/IPS Signature Updater</h3>
        <p className="text-sm text-muted-foreground">
          Configure IDS/IPS rule categories for PQC-aware traffic detection. Toggle rules on and off
          to balance detection coverage against false positive rates.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.enabledCount}</div>
          <div className="text-[10px] text-muted-foreground">Active Rule Sets</div>
          <div className="text-[10px] text-muted-foreground">of {stats.totalCount} total</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div
            className={`text-2xl font-bold ${stats.uniqueCoverage > 80 ? 'text-status-success' : stats.uniqueCoverage > 50 ? 'text-status-warning' : 'text-status-error'}`}
          >
            {stats.uniqueCoverage}%
          </div>
          <div className="text-[10px] text-muted-foreground">Detection Coverage</div>
          <div className="text-[10px] text-muted-foreground">PQC traffic</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div
            className={`text-2xl font-bold ${stats.adjustedFpRate > 15 ? 'text-status-error' : stats.adjustedFpRate > 8 ? 'text-status-warning' : 'text-status-success'}`}
          >
            {stats.adjustedFpRate}%
          </div>
          <div className="text-[10px] text-muted-foreground">Est. False Positive</div>
          <div className="text-[10px] text-muted-foreground">rate</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div
            className={`text-2xl font-bold ${stats.highFpEnabled > 0 ? 'text-status-warning' : 'text-status-success'}`}
          >
            {stats.highFpEnabled}
          </div>
          <div className="text-[10px] text-muted-foreground">High-FP Rules</div>
          <div className="text-[10px] text-muted-foreground">active</div>
        </div>
      </div>

      {/* Coverage Bar */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Detection Coverage</h4>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-500 bg-primary"
            style={{ width: `${stats.uniqueCoverage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span className="font-bold text-primary">{stats.uniqueCoverage}% coverage</span>
          <span>100%</span>
        </div>
        {stats.uniqueCoverage < 70 && (
          <div className="mt-3 flex items-start gap-2 bg-warning/5 rounded-lg p-3 border border-warning/30">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Coverage below 70%. Enable at minimum <strong>Hybrid KEM Detection</strong>,{' '}
              <strong>Certificate Size Threshold</strong>, and{' '}
              <strong>PQC Algorithm Inventory</strong> rules for baseline visibility.
            </p>
          </div>
        )}
      </div>

      {/* FP Rate Slider */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Base False Positive Rate: {fpRate}%</h4>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={fpRate}
          onChange={(e) => setFpRate(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Base false positive rate"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>1% (tight tuning)</span>
          <span>20% (broad detection)</span>
        </div>
        {stats.highFpEnabled > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Adjusted FP rate is{' '}
            <span className="font-bold text-status-warning">{stats.adjustedFpRate}%</span> —
            elevated by {stats.highFpEnabled} high-risk rule
            {stats.highFpEnabled > 1 ? 's' : ''} requiring environment-specific tuning.
          </p>
        )}
      </div>

      {/* Rule Controls */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={enableAll}>
          Enable All
        </Button>
        <Button variant="ghost" onClick={disableAll}>
          Disable All
        </Button>
      </div>

      {/* Rule List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="glass-panel overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                    rule.enabled ? 'bg-primary' : 'bg-muted border border-border'
                  }`}
                  aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      rule.enabled ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-sm font-bold ${rule.enabled ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {rule.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${RISK_BG[rule.falsePositiveRisk]}`}
                    >
                      <span className={RISK_COLORS[rule.falsePositiveRisk]}>
                        FP: {rule.falsePositiveRisk}
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Coverage: {rule.detectionCoverage}%
                    </span>
                    {rule.enabled ? (
                      <CheckCircle size={12} className="text-status-success" />
                    ) : (
                      <Shield size={12} className="text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Toggle rule details"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === rule.id && (
              <div className="border-t border-border bg-muted/30 p-4">
                <div className="text-xs font-bold text-foreground mb-2">Example Patterns</div>
                <div className="space-y-1 mb-3">
                  {rule.examplePatterns.map((pattern, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-background rounded px-3 py-2 border border-border"
                    >
                      <span className="text-muted-foreground shrink-0">•</span>
                      <code className="text-[10px] text-foreground font-mono">{pattern}</code>
                    </div>
                  ))}
                </div>
                {rule.falsePositiveRisk === 'high' && (
                  <div className="flex items-start gap-2 bg-destructive/5 rounded-lg p-3 border border-destructive/30">
                    <AlertTriangle size={12} className="text-status-error shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground">
                      <strong className="text-status-error">High false positive risk:</strong> This
                      rule requires environment-specific tuning and baselining before production
                      deployment. Consider deploying in alert-only mode for 30 days first.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
