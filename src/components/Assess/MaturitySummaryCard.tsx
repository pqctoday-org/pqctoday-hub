// SPDX-License-Identifier: GPL-3.0-only
/**
 * MaturitySummaryCard — read-only summary of the seven-domain Program Maturity
 * self-assessment, sourced from the shared assessment-result store. Renders
 * nothing until the user has self-assessed (on /assess). Reused across surfaces
 * (the Report, and available to the Command Center) so the one "today maturity"
 * signal shows consistently everywhere the assessment is consumed.
 */
import React from 'react'
import { Gauge } from 'lucide-react'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { MATURITY_DOMAINS, MATURITY_LEVELS } from '@/data/maturityModel'

export const MaturitySummaryCard: React.FC = () => {
  const maturity = useAssessmentResultStore((s) => s.maturity)
  if (!maturity) return null
  const level = MATURITY_LEVELS[maturity.overall]
  const gating = MATURITY_DOMAINS.filter((d) => maturity.scores[d.id] === maturity.overall)
  return (
    <section className="glass-panel border border-border rounded-lg p-4 mb-4 space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Gauge size={16} className="text-primary" />
        Program maturity (self-assessed) — Level {maturity.overall} · {level.name}
      </h2>
      <p className="text-xs text-muted-foreground">{level.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {MATURITY_DOMAINS.map((d) => {
          const s = maturity.scores[d.id]
          const isGating = maturity.overall < 5 && s === maturity.overall
          return (
            <span
              key={d.id}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                isGating
                  ? 'border-warning/50 bg-warning/10 text-warning'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {d.name}: L{s}
            </span>
          )
        })}
      </div>
      {gating.length > 0 && maturity.overall < 5 && (
        <p className="text-[10px] text-muted-foreground">
          Overall = your weakest domain. Gating: {gating.map((d) => d.name).join(' · ')}.
        </p>
      )}
    </section>
  )
}

export default MaturitySummaryCard
