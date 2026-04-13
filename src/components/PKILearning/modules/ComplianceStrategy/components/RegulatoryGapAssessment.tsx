// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Globe, Info, ChevronRight } from 'lucide-react'
import {
  JURISDICTION_FRAMEWORKS,
  getJurisdictionFramework,
  type FrameworkRequirement,
} from '../data/complianceFrameworks'

interface RegulatoryGapAssessmentProps {
  selectedJurisdictions: string[]
}

const EFFORT_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 }

const CATEGORY_COLORS: Record<string, string> = {
  Inventory: 'bg-primary/10 text-primary border-primary/20',
  Algorithm: 'bg-status-error/10 text-status-error border-status-error/20',
  Certification: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  Policy: 'bg-status-info/10 text-status-info border-status-info/20',
  'Supply Chain': 'bg-accent/10 text-accent border-accent/20',
  Timeline: 'bg-secondary/10 text-secondary border-secondary/20',
}

const EFFORT_BADGE: Record<string, string> = {
  High: 'bg-status-error/10 text-status-error border-status-error/20',
  Medium: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  Low: 'bg-status-success/10 text-status-success border-status-success/20',
}

export const RegulatoryGapAssessment: React.FC<RegulatoryGapAssessmentProps> = ({
  selectedJurisdictions,
}) => {
  const coveredJurisdictions = useMemo(
    () =>
      selectedJurisdictions
        .map((id) => getJurisdictionFramework(id))
        .filter((jf): jf is NonNullable<typeof jf> => jf !== undefined),
    [selectedJurisdictions]
  )

  const uncoveredJurisdictions = useMemo(
    () =>
      selectedJurisdictions.filter(
        (id) => !JURISDICTION_FRAMEWORKS.some((jf) => jf.jurisdictionId === id)
      ),
    [selectedJurisdictions]
  )

  const consolidatedGaps = useMemo(() => {
    const allGaps: (FrameworkRequirement & { jurisdictionLabel: string })[] = []
    for (const jf of coveredJurisdictions) {
      for (const req of jf.requirements) {
        if (req.commonGap) {
          allGaps.push({ ...req, jurisdictionLabel: jf.jurisdictionLabel })
        }
      }
    }
    return allGaps.sort((a, b) => (EFFORT_ORDER[a.effort] ?? 3) - (EFFORT_ORDER[b.effort] ?? 3))
  }, [coveredJurisdictions])

  if (selectedJurisdictions.length === 0) {
    return (
      <div className="glass-panel p-8 text-center space-y-4">
        <Globe size={32} className="text-muted-foreground mx-auto" />
        <p className="text-foreground font-semibold">No jurisdictions selected</p>
        <p className="text-sm text-muted-foreground">
          Go to Step 1 — Jurisdiction Mapper and select your operating jurisdictions, then return
          here to see your regulatory gap analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 text-center border bg-primary/5 border-primary/20">
          <div className="text-3xl font-bold text-primary">{selectedJurisdictions.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Jurisdictions</div>
        </div>
        <div className="glass-panel p-4 text-center border bg-status-error/5 border-status-error/20">
          <div className="text-3xl font-bold text-status-error">{consolidatedGaps.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Common Gaps</div>
        </div>
        <div className="glass-panel p-4 text-center border bg-status-error/5 border-status-error/20">
          <div className="text-3xl font-bold text-status-error">
            {consolidatedGaps.filter((g) => g.effort === 'High').length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">High Effort</div>
        </div>
        <div className="glass-panel p-4 text-center border bg-status-success/5 border-status-success/20">
          <div className="text-3xl font-bold text-status-success">
            {coveredJurisdictions.reduce(
              (sum, jf) => sum + jf.requirements.filter((r) => !r.commonGap).length,
              0
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Met Requirements</div>
        </div>
      </div>

      {/* Per-jurisdiction breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Per-Jurisdiction Requirements</h4>
        {coveredJurisdictions.map((jf) => {
          const gaps = jf.requirements.filter((r) => r.commonGap)
          const met = jf.requirements.filter((r) => !r.commonGap)
          return (
            <div key={jf.jurisdictionId} className="glass-panel p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="font-semibold text-foreground">{jf.jurisdictionLabel}</h5>
                  <p className="text-xs text-muted-foreground">Primary: {jf.primaryFramework}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {gaps.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-error/10 text-status-error border border-status-error/20">
                      {gaps.length} gap{gaps.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {met.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/20">
                      {met.length} met
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary frameworks */}
              <div className="flex flex-wrap gap-1">
                {jf.secondaryFrameworks.map((sf) => (
                  <span
                    key={sf}
                    className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground"
                  >
                    {sf}
                  </span>
                ))}
              </div>

              {/* Requirements list */}
              <div className="space-y-2">
                {jf.requirements.map((req) => (
                  <div
                    key={req.id}
                    className={`rounded-lg p-3 border flex items-start gap-3 ${
                      req.commonGap
                        ? 'bg-status-error/5 border-status-error/20'
                        : 'bg-status-success/5 border-status-success/20'
                    }`}
                  >
                    {req.commonGap ? (
                      <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs text-foreground leading-relaxed">{req.requirement}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[req.category] ?? 'bg-muted text-muted-foreground border-border'}`}
                        >
                          {req.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{req.framework}</span>
                        {req.deadline && (
                          <span className="text-xs text-primary font-semibold">
                            → {req.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 ${EFFORT_BADGE[req.effort] ?? ''}`}
                    >
                      {req.effort}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {uncoveredJurisdictions.length > 0 && (
          <div className="glass-panel p-4 border border-border/50">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Framework data not yet available for:{' '}
                <strong>{uncoveredJurisdictions.join(', ')}</strong>. Monitor those jurisdictions'
                regulatory bodies directly for PQC guidance updates.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Consolidated action plan */}
      {consolidatedGaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Consolidated Remediation Plan
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              sorted by effort (highest first)
            </span>
          </h4>
          <div className="glass-panel p-4 space-y-2">
            {consolidatedGaps.map((gap, idx) => (
              <div
                key={`${gap.id}-${gap.jurisdictionLabel}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
              >
                <span className="text-xs font-bold text-muted-foreground shrink-0 w-5 text-right">
                  {idx + 1}
                </span>
                <ChevronRight size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{gap.requirement}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {gap.jurisdictionLabel} — {gap.framework}
                    {gap.deadline && (
                      <span className="ml-2 text-primary font-semibold">
                        Deadline: {gap.deadline}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 ${EFFORT_BADGE[gap.effort] ?? ''}`}
                >
                  {gap.effort}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
