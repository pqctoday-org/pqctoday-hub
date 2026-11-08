// SPDX-License-Identifier: AGPL-3.0-only
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import React, { useMemo, useState } from 'react'
import { AlertTriangle, Globe, Info, ChevronRight } from 'lucide-react'
import {
  JURISDICTION_FRAMEWORKS,
  getJurisdictionFramework,
  type FrameworkRequirement,
} from '../data/complianceFrameworks'

import {
  CASE_TOPICS,
  emptyCaseAnswers,
  loadedCaseAnswers,
  evaluateCase,
  type Applicability,
  type CaseAnswer,
  type CaseTopicId,
} from './regulatoryGapCase'

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
  Low: 'bg-muted text-muted-foreground border-border',
}

export const RegulatoryGapAssessment: React.FC<RegulatoryGapAssessmentProps> = ({
  selectedJurisdictions,
}) => {
  const [answers, setAnswers] = useState(emptyCaseAnswers)
  const [caseLoaded, setCaseLoaded] = useState(false)
  const results = evaluateCase(answers)
  const updateAnswer = (
    id: CaseTopicId,
    field: 'applicability' | 'answer',
    value: Applicability | CaseAnswer
  ) => {
    setAnswers((current) => ({
      ...current,
      [id]: { ...Object.entries(current).find(([key]) => key === id)![1], [field]: value },
    }))
  }
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
          here to explore the catalogue review topics.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Fictional records-service assessment"
        className="glass-panel p-4 space-y-4"
      >
        <h4 className="font-semibold">Fictional records-service assessment</h4>
        <p className="text-sm text-muted-foreground">
          Editable case answers establish only this teaching scenario’s results, not legal
          compliance or deployed controls. Jurisdiction selection does not supply answers. Use your
          production tools to establish applicable obligations, control facts and dependencies.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="btn-primary"
            onClick={() => {
              setAnswers(loadedCaseAnswers())
              setCaseLoaded(true)
            }}
          >
            Load fictional case
          </Button>
          <Button
            className="btn-secondary"
            onClick={() => {
              setAnswers(emptyCaseAnswers())
              setCaseLoaded(false)
            }}
          >
            Clear case answers
          </Button>
        </div>
        <p className="text-sm">
          {caseLoaded
            ? 'Fictional case loaded; answers remain editable.'
            : 'No case loaded; answer explicitly or load the fictional facts.'}
        </p>
        <p role="status" className="text-sm">
          Case results: {results.filter((r) => r.outcome === 'Gap').length} gaps;{' '}
          {results.filter((r) => r.outcome === 'Met').length} Met;{' '}
          {results.filter((r) => r.outcome === 'Unknown').length} Unknown;{' '}
          {results.filter((r) => r.outcome === 'Not applicable').length} Not applicable.
        </p>
        <p className="text-xs text-muted-foreground">
          Planning order follows the declared inventory-before-plan dependency. Unknown facts need
          investigation, not a remediation rank. Effort is a separate fictional assumption, not a
          risk score.
        </p>
        {CASE_TOPICS.map((topic) => {
          const result = results.find((row) => row.id === topic.id)!
          return (
            <section
              key={topic.id}
              aria-label={topic.title}
              className="rounded-lg border border-border p-3 space-y-2 min-w-0"
            >
              <h5 className="font-semibold">{topic.title}</h5>
              <p className="text-sm">{topic.question}</p>
              <p className="text-xs text-muted-foreground">Fictional fact: {topic.fact}</p>
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1">
                  <p className="text-xs">Applicability</p>
                  <FilterDropdown
                    items={['Unknown', 'Applies', 'Not applicable']}
                    selectedId={result.applicability}
                    onSelect={(value) =>
                      updateAnswer(topic.id, 'applicability', value as Applicability)
                    }
                    ariaLabel={`Applicability — ${topic.title}`}
                    hideDefaultOption
                    className="max-w-full"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs">Answer</p>
                  <FilterDropdown
                    items={['Unknown', 'Missing', 'Partial', 'Met']}
                    selectedId={result.answer}
                    onSelect={(value) => updateAnswer(topic.id, 'answer', value as CaseAnswer)}
                    ariaLabel={`Answer — ${topic.title}`}
                    hideDefaultOption
                    className="max-w-full"
                  />
                </div>
              </div>
              <p className="text-sm">
                Case-question result: {result.outcome}. Action: {result.action}. Case effort:{' '}
                {topic.effort}.
              </p>
              <p className="text-xs">{result.rationale}</p>
            </section>
          )
        })}
      </section>
      <div className="glass-panel p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Catalogue implementation status: Not assessed
        </p>
        <p className="text-sm text-muted-foreground">
          Selecting a jurisdiction chooses catalogue topics; it does not establish that requirements
          are met or that a control gap exists. Catalogue flags suggest topics to review, not
          findings about the sample organization.
        </p>
      </div>
      {/* Summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 text-center border bg-primary/5 border-primary/20">
          <div className="text-3xl font-bold text-primary">{selectedJurisdictions.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Jurisdictions</div>
        </div>
        <div className="glass-panel p-4 text-center border bg-status-error/5 border-status-error/20">
          <div className="text-3xl font-bold text-status-error">{consolidatedGaps.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Flagged Review Topics</div>
        </div>
        <div className="glass-panel p-4 text-center border bg-status-error/5 border-status-error/20">
          <div className="text-3xl font-bold text-status-error">
            {consolidatedGaps.filter((g) => g.effort === 'High').length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">High Effort</div>
        </div>
        <div className="glass-panel p-4 text-center border bg-muted/30 border-border">
          <div className="text-3xl font-bold text-foreground">
            {coveredJurisdictions.reduce(
              (sum, jf) => sum + jf.requirements.filter((r) => !r.commonGap).length,
              0
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Other Review Topics</div>
        </div>
      </div>

      {/* Per-jurisdiction breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Per-Jurisdiction Review Topics</h4>
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
                      {gaps.length} flagged topic{gaps.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {met.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/20">
                      {met.length} other topics
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
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    {req.commonGap ? (
                      <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
                    ) : (
                      <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
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
            Consolidated Planning Topics
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              effort-first review order, not a risk priority
            </span>
          </h4>
          <p className="text-xs text-muted-foreground">
            Set priorities using applicability, risk, dependencies and timing; effort alone does not
            establish migration priority.
          </p>
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
