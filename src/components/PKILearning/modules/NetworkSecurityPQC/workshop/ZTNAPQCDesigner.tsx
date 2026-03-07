// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Network, Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { ZTNA_COMPONENTS } from '../data/networkConstants'

type MigrationApproach = 'classical' | 'hybrid' | 'pure-pqc'

interface ComponentConfig {
  approach: MigrationApproach
}

const APPROACH_LABELS: Record<
  MigrationApproach,
  { label: string; colorClass: string; bg: string; border: string }
> = {
  classical: {
    label: 'Classical',
    colorClass: 'text-status-error',
    bg: 'bg-destructive/5',
    border: 'border-destructive/30',
  },
  hybrid: {
    label: 'Hybrid',
    colorClass: 'text-status-warning',
    bg: 'bg-warning/5',
    border: 'border-warning/30',
  },
  'pure-pqc': {
    label: 'Pure PQC',
    colorClass: 'text-status-success',
    bg: 'bg-success/5',
    border: 'border-success/30',
  },
}

function RiskScore({ score }: { score: number }) {
  const color =
    score <= 30 ? 'text-status-success' : score <= 60 ? 'text-status-warning' : 'text-status-error'
  const label = score <= 30 ? 'Low Risk' : score <= 60 ? 'Moderate Risk' : 'High Risk'
  return (
    <div className="text-center">
      <div className={`text-4xl font-bold ${color}`}>{score}</div>
      <div className={`text-xs font-bold ${color}`}>{label}</div>
      <div className="text-[10px] text-muted-foreground mt-1">Transition Risk Score</div>
    </div>
  )
}

function ArchitectureDiagram({ configs }: { configs: Record<string, ComponentConfig> }) {
  const components = ZTNA_COMPONENTS

  const getApproachStyle = (id: string) => {
    const approach = configs[id]?.approach ?? 'classical'
    return APPROACH_LABELS[approach]
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border">
      <div className="text-xs font-bold text-foreground mb-4 flex items-center gap-2">
        <Network size={14} className="text-primary" />
        ZTNA Architecture — PQC Migration State
      </div>

      {/* User → Identity → Device → Policy → App → Data */}
      <div className="flex flex-col items-center gap-2 text-[10px]">
        {/* External User */}
        <div className="bg-muted border border-border rounded-lg px-4 py-2 font-bold text-muted-foreground">
          External User
        </div>
        <div className="w-0.5 h-3 bg-border" />

        {/* Row 1: Identity + Device */}
        <div className="flex items-start gap-4 w-full justify-center">
          {components.slice(0, 2).map((comp) => {
            const style = getApproachStyle(comp.id)
            return (
              <div
                key={comp.id}
                className={`flex-1 max-w-[140px] rounded-lg p-2 border text-center transition-all ${style.bg} ${style.border}`}
              >
                <div className={`font-bold ${style.colorClass} mb-0.5`}>{comp.name}</div>
                <div className="text-muted-foreground text-[9px]">
                  {APPROACH_LABELS[configs[comp.id]?.approach ?? 'classical'].label}
                </div>
              </div>
            )
          })}
        </div>
        <div className="w-0.5 h-3 bg-border" />

        {/* Policy Engine */}
        {components.slice(2, 3).map((comp) => {
          const style = getApproachStyle(comp.id)
          return (
            <div
              key={comp.id}
              className={`w-full max-w-xs rounded-lg p-2 border text-center transition-all ${style.bg} ${style.border}`}
            >
              <div className={`font-bold ${style.colorClass}`}>{comp.name}</div>
              <div className="text-muted-foreground text-[9px]">
                {APPROACH_LABELS[configs[comp.id]?.approach ?? 'classical'].label}
              </div>
            </div>
          )
        })}
        <div className="w-0.5 h-3 bg-border" />

        {/* Row 2: Micro-seg + App Gateway */}
        <div className="flex items-start gap-4 w-full justify-center">
          {components.slice(3, 5).map((comp) => {
            const style = getApproachStyle(comp.id)
            return (
              <div
                key={comp.id}
                className={`flex-1 max-w-[140px] rounded-lg p-2 border text-center transition-all ${style.bg} ${style.border}`}
              >
                <div className={`font-bold ${style.colorClass} mb-0.5`}>{comp.name}</div>
                <div className="text-muted-foreground text-[9px]">
                  {APPROACH_LABELS[configs[comp.id]?.approach ?? 'classical'].label}
                </div>
              </div>
            )
          })}
        </div>
        <div className="w-0.5 h-3 bg-border" />

        {/* Application Resources */}
        <div className="bg-muted border border-border rounded-lg px-4 py-2 font-bold text-muted-foreground">
          Protected Applications
        </div>
      </div>
    </div>
  )
}

export const ZTNAPQCDesigner: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, ComponentConfig>>(
    Object.fromEntries(
      ZTNA_COMPONENTS.map((c) => [
        c.id,
        { approach: c.pqcMigrationPath === 'not-applicable' ? 'classical' : 'hybrid' },
      ])
    )
  )

  const setApproach = (id: string, approach: MigrationApproach) => {
    setConfigs((prev) => ({ ...prev, [id]: { approach } }))
  }

  const riskScore = useMemo(() => {
    let score = 0
    for (const comp of ZTNA_COMPONENTS) {
      const approach = configs[comp.id]?.approach ?? 'classical'
      const complexityWeight =
        comp.migrationComplexity === 'high' ? 20 : comp.migrationComplexity === 'medium' ? 10 : 5
      if (approach === 'classical') score += complexityWeight
      else if (approach === 'hybrid') score += Math.round(complexityWeight * 0.4)
      // pure-pqc adds operational complexity but reduces crypto risk
      else if (approach === 'pure-pqc') score += Math.round(complexityWeight * 0.15)
    }
    return Math.min(100, score)
  }, [configs])

  const readinessScore = useMemo(() => {
    const pqcCount = Object.values(configs).filter(
      (c) => c.approach === 'hybrid' || c.approach === 'pure-pqc'
    ).length
    return Math.round((pqcCount / ZTNA_COMPONENTS.length) * 100)
  }, [configs])

  const weakestLink = useMemo(() => {
    const classical = ZTNA_COMPONENTS.filter((c) => configs[c.id]?.approach === 'classical')
    if (classical.length === 0) return null
    return classical.reduce((worst, comp) =>
      comp.migrationComplexity === 'high' ||
      (worst.migrationComplexity !== 'high' && comp.migrationComplexity === 'medium')
        ? comp
        : worst
    )
  }, [configs])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">ZTNA PQC Designer</h3>
        <p className="text-sm text-muted-foreground">
          Design your Zero Trust Network Access architecture for PQC transition. Select the
          migration approach for each ZTNA component and see the overall risk profile.
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-center">
          <RiskScore score={riskScore} />
        </div>
        <div className="glass-panel p-4 text-center">
          <div
            className={`text-4xl font-bold ${readinessScore >= 80 ? 'text-status-success' : readinessScore >= 50 ? 'text-status-warning' : 'text-status-error'}`}
          >
            {readinessScore}%
          </div>
          <div className="text-xs font-bold text-foreground mt-1">PQC Readiness</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {Object.values(configs).filter((c) => c.approach !== 'classical').length} of{' '}
            {ZTNA_COMPONENTS.length} components protected
          </div>
        </div>
        <div className="glass-panel p-4">
          {weakestLink ? (
            <>
              <div className="text-xs font-bold text-status-warning mb-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Weakest Link
              </div>
              <div className="text-sm font-bold text-foreground">{weakestLink.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Still using classical crypto — upgrade to hybrid minimum.
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-status-success mb-1 flex items-center gap-1">
                <CheckCircle size={12} /> All Protected
              </div>
              <div className="text-sm text-muted-foreground">
                All ZTNA components are using PQC-protected algorithms.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Component Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {ZTNA_COMPONENTS.map((comp) => {
            const currentApproach = configs[comp.id]?.approach ?? 'classical'
            const style = APPROACH_LABELS[currentApproach]
            return (
              <div key={comp.id} className={`glass-panel p-4 border-l-4 ${style.border}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold text-foreground">{comp.name}</div>
                    <div className="text-[10px] text-muted-foreground">{comp.description}</div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${
                      comp.migrationComplexity === 'high'
                        ? 'bg-destructive/10 text-status-error border-destructive/30'
                        : comp.migrationComplexity === 'medium'
                          ? 'bg-warning/10 text-status-warning border-warning/30'
                          : 'bg-success/10 text-status-success border-success/30'
                    }`}
                  >
                    {comp.migrationComplexity} complexity
                  </span>
                </div>

                <div className="flex gap-1 mt-3">
                  {(['classical', 'hybrid', 'pure-pqc'] as MigrationApproach[]).map((approach) => (
                    <button
                      key={approach}
                      onClick={() => setApproach(comp.id, approach)}
                      className={`flex-1 py-1.5 text-[10px] font-medium rounded border transition-colors ${
                        currentApproach === approach
                          ? approach === 'classical'
                            ? 'bg-destructive/20 text-status-error border-destructive/50'
                            : approach === 'hybrid'
                              ? 'bg-warning/20 text-status-warning border-warning/50'
                              : 'bg-success/20 text-status-success border-success/50'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
                      }`}
                    >
                      {approach === 'classical'
                        ? 'Classical'
                        : approach === 'hybrid'
                          ? 'Hybrid'
                          : 'Pure PQC'}
                    </button>
                  ))}
                </div>

                {/* Show key algorithm when not classical */}
                {currentApproach !== 'classical' && (
                  <div className="mt-2 flex items-start gap-1">
                    <Info size={10} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground">
                      <strong className="text-foreground">Algorithm:</strong> {comp.keyAlgorithm}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Architecture Diagram */}
        <div className="space-y-4">
          <ArchitectureDiagram configs={configs} />

          {/* Recommendations */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">Migration Guidance</h4>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {riskScore > 60 && (
                <div className="flex items-start gap-2 bg-destructive/5 rounded-lg p-3 border border-destructive/30">
                  <AlertTriangle size={12} className="text-status-error shrink-0 mt-0.5" />
                  <span>
                    High transition risk — multiple critical components remain on classical crypto.
                    Prioritize Identity Provider and Policy Engine migration first.
                  </span>
                </div>
              )}
              {riskScore > 30 && riskScore <= 60 && (
                <div className="flex items-start gap-2 bg-warning/5 rounded-lg p-3 border border-warning/30">
                  <AlertTriangle size={12} className="text-status-warning shrink-0 mt-0.5" />
                  <span>
                    Moderate risk — hybrid mode provides good interim protection. Plan complete
                    migration before CNSA 2.0 deadline (2033).
                  </span>
                </div>
              )}
              {riskScore <= 30 && (
                <div className="flex items-start gap-2 bg-success/5 rounded-lg p-3 border border-success/30">
                  <CheckCircle size={12} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    Low risk configuration. All critical ZTNA components protected against
                    harvest-now-decrypt-later attacks. Document current state for compliance audit.
                  </span>
                </div>
              )}
              <p>
                <strong className="text-foreground">Recommended order:</strong> Identity Provider →
                Policy Engine → Application Gateway → Device Posture → Micro-Segmentation
              </p>
              <p>
                <strong className="text-foreground">Hybrid mode:</strong> The safest migration path
                — provides quantum resistance while maintaining backwards compatibility. Recommended
                by NIST SP 800-227 (draft) and BSI for the 2025-2030 transition period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
