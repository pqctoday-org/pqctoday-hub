// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, BarChart3, BookOpen } from 'lucide-react'
import {
  SOURCING_STRATEGIES,
  WIZARD_QUESTIONS,
  CASE_STUDIES,
  type SourcingStrategy,
} from '../data/buildBuyData'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  assessBuildBuy,
  emptyCosts,
  emptyFacts,
  REQUIREMENTS,
  sampleCostTotals,
  workedComparison,
  type SampleFact,
} from './buildBuyAssessment'

const STRATEGY_COLORS: Record<SourcingStrategy, { bg: string; border: string; text: string }> = {
  build: { bg: 'bg-status-error/10', border: 'border-status-error/40', text: 'text-status-error' },
  'open-source': {
    bg: 'bg-status-success/10',
    border: 'border-status-success/40',
    text: 'text-status-success',
  },
  commercial: {
    bg: 'bg-status-info/10',
    border: 'border-status-info/40',
    text: 'text-status-info',
  },
}

const IMPACT_COLORS = {
  high: 'text-status-error',
  medium: 'text-status-warning',
  low: 'text-status-success',
}

export const BuildBuyAnalyzer: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [facts, setFacts] = useState(emptyFacts)
  const [costs, setCosts] = useState(emptyCosts)
  const [expandedStrategies, setExpandedStrategies] = useState<Set<SourcingStrategy>>(new Set())
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())
  const assessment = useMemo(() => assessBuildBuy(answers, facts), [answers, facts])
  const { scores, eligibility, leaders, contributions } = assessment
  const totalAnswered = assessment.answered
  const totalQuestions = WIZARD_QUESTIONS.length

  const toggleStrategy = (id: SourcingStrategy) =>
    setExpandedStrategies((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const toggleCase = (id: string) =>
    setExpandedCases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <div className="space-y-6">
      {/* Strategy Cards */}
      <div>
        <h3 className="font-bold text-foreground mb-3">Sourcing Strategies</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SOURCING_STRATEGIES.map((s) => {
            const colors = STRATEGY_COLORS[s.id]
            const isExpanded = expandedStrategies.has(s.id)
            return (
              <div key={s.id} className={`glass-panel overflow-hidden border ${colors.border}`}>
                <Button
                  variant="ghost"
                  className="h-auto whitespace-normal w-full text-left p-4"
                  onClick={() => toggleStrategy(s.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold text-base ${colors.text}`}>{s.name}</div>
                      <div className="text-xs text-muted-foreground italic">{s.tagline}</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </div>
                </Button>
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                    <div>
                      <div className="font-semibold text-xs text-status-success mb-1">Pros</div>
                      <ul className="space-y-0.5">
                        {s.pros.map((p, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1">
                            <span className={`shrink-0 font-bold ${IMPACT_COLORS[p.impact]}`}>
                              +
                            </span>{' '}
                            {p.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-status-error mb-1">Cons</div>
                      <ul className="space-y-0.5">
                        {s.cons.map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1">
                            <span className={`shrink-0 font-bold ${IMPACT_COLORS[c.impact]}`}>
                              −
                            </span>{' '}
                            {c.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground mb-1">
                        PQC Implications
                      </div>
                      <p className="text-xs text-muted-foreground">{s.pqcImplications}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="font-semibold text-xs text-foreground mb-1 flex items-center gap-1">
                        <BarChart3 size={12} className="text-primary" /> Illustrative TCO bands
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Authored planning ranges, not supplier quotes or a cost calculation from
                        your answers.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                        {(['year1', 'year3', 'year5'] as const).map((yr) => (
                          <div key={yr} className="text-center">
                            <div className="text-muted-foreground">
                              {yr.replace('year', 'Year ')}
                            </div>
                            <div className="font-mono font-bold text-foreground">
                              {s.estimatedTCO[yr]}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.estimatedTCO.breakdown}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">
          Fictional candidate assumptions and worked costs
        </h3>
        <p className="text-sm text-muted-foreground">
          These editable facts describe fictional candidates, not properties inferred from a
          sourcing category or proof about a real product. A selected mandatory requirement must be
          recorded Yes for a candidate to lead; No blocks it and Unknown remains unassessed. Answer
          all three requirement questions (validation, portability and source access).
        </p>
        <Button
          variant="outline"
          className="h-auto whitespace-normal"
          onClick={() => {
            const example = workedComparison()
            setAnswers(example.answers)
            setFacts(example.facts)
            setCosts(example.costs)
          }}
        >
          Load fictional worked comparison
        </Button>
        <p className="text-xs text-muted-foreground">
          Worked case: the in-house candidate has not completed validation; the open-source
          candidate is assumed to meet all three requirements; the commercial candidate is assumed
          to lack required portability and source access. Change these assumptions for another
          sample. They are not vendor or certification claims.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SOURCING_STRATEGIES.map((strategy) => {
            const totals = sampleCostTotals(costs[strategy.id])
            return (
              <fieldset
                key={strategy.id}
                className="min-w-0 border border-border rounded-lg p-3 space-y-3"
              >
                <legend className="px-1 font-semibold">{strategy.name} candidate</legend>
                {REQUIREMENTS.map((requirement) => (
                  <div key={requirement.id} className="text-sm">
                    <span>{requirement.label}</span>
                    <FilterDropdown
                      ariaLabel={`${strategy.name} ${requirement.label} assumption`}
                      className="mt-1 w-full"
                      selectedId={facts[strategy.id][requirement.id]}
                      items={[
                        { id: 'unknown', label: 'Unknown' },
                        { id: 'yes', label: 'Yes' },
                        { id: 'no', label: 'No' },
                      ]}
                      onSelect={(value) =>
                        setFacts((current) => ({
                          ...current,
                          [strategy.id]: {
                            ...current[strategy.id],
                            [requirement.id]: value as SampleFact,
                          },
                        }))
                      }
                      noContainer
                      hideDefaultOption
                    />
                  </div>
                ))}
                {(['setup', 'annual'] as const).map((field) => (
                  <label key={field} className="block text-sm">
                    {field === 'setup' ? 'One-time setup (USD)' : 'Annual recurring cost (USD)'}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      aria-label={`${strategy.name} ${field} cost`}
                      className="mt-1 w-full min-w-0 rounded border border-border bg-background p-2"
                      value={
                        field === 'setup' ? costs[strategy.id].setup : costs[strategy.id].annual
                      }
                      onChange={(event) =>
                        setCosts((current) => ({
                          ...current,
                          [strategy.id]: { ...current[strategy.id], [field]: event.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
                <div className="space-y-1 text-sm">
                  {[1, 3, 5].map((year, index) => (
                    <div key={year} className="flex justify-between gap-2 flex-wrap">
                      <span>Year {year} sample total</span>
                      <output aria-label={`${strategy.name} Year ${year} sample cost`}>
                        {totals
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 2,
                            }).format(totals.at(index)!)
                          : 'Unassessed'}
                      </output>
                    </div>
                  ))}
                </div>
              </fieldset>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Sample arithmetic: setup once + years × annual recurring cost, for 1, 3 and 5 completed
          years. No discounting, tax or inflation. Zero is valid; missing or invalid costs are
          unassessed. These totals are separate from the authored TCO ranges above and do not change
          the preference weights or establish affordability. For your own tools, check the actual
          validation boundary/configuration, portability and source-access terms, and build a costed
          work plan with your own quantities and rates.
        </p>
      </div>

      {/* Scoring Wizard */}
      <div className="glass-panel p-4">
        <h3 className="font-bold text-foreground mb-4">Decision Wizard</h3>
        <div className="space-y-4">
          {WIZARD_QUESTIONS.map((q) => (
            <div key={q.id} className="border border-border rounded-lg p-3">
              <div className="font-semibold text-sm text-foreground mb-1">{q.question}</div>
              <p className="text-xs text-muted-foreground mb-2">{q.description}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, idx) => (
                  <Button
                    variant="ghost"
                    key={idx}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                    }}
                    className={`h-auto min-w-0 max-w-full whitespace-normal text-left text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      answers[q.id] === idx
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        {totalAnswered > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="font-semibold text-sm text-foreground mb-3">
              Illustrative weighted scores ({totalAnswered}/{totalQuestions} answered)
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Hub-authored answer weights compare options for discussion. Eligibility screens only
              the entered fictional facts; scores do not verify real candidate capabilities or cost.
            </p>
            <div className="space-y-2">
              {(Object.entries(scores) as [SourcingStrategy, number][]).map(([strategy, score]) => {
                const s = SOURCING_STRATEGIES.find((s) => s.id === strategy)
                const colors = STRATEGY_COLORS[strategy]
                const maxPossible = 5 + totalQuestions * 2
                const pct = Math.max(0, Math.min(100, (score / maxPossible) * 100))
                return (
                  <div key={strategy} className="flex items-center gap-3">
                    <span className={`w-28 text-sm shrink-0 ${colors.text}`}>{s?.name}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          strategy === 'build'
                            ? 'bg-status-error'
                            : strategy === 'open-source'
                              ? 'bg-status-success'
                              : 'bg-status-info'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-muted-foreground">{score}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {SOURCING_STRATEGIES.map((strategy) => {
                const result = eligibility[strategy.id]
                return (
                  <div
                    key={strategy.id}
                    role="status"
                    aria-label={`${strategy.name} sample eligibility`}
                    className="rounded border border-border p-3 text-sm"
                  >
                    <strong>
                      {strategy.name}:{' '}
                      {result.status === 'eligible'
                        ? 'Eligible for this sample'
                        : result.status === 'ineligible'
                          ? 'Not eligible for this sample'
                          : 'Unassessed'}
                    </strong>
                    {result.failed.length > 0 && <p>Not met: {result.failed.join('; ')}</p>}
                    {result.unknown.length > 0 && <p>Unassessed: {result.unknown.join('; ')}</p>}
                  </div>
                )
              })}
            </div>
            {leaders.length > 0 ? (
              <div className="mt-3 rounded border border-primary/30 bg-primary/10 p-3">
                <div className="font-bold text-sm text-foreground">
                  {leaders.length === 1
                    ? 'Leading eligible sample candidate'
                    : 'Joint leading eligible sample candidates'}
                  :{' '}
                  {leaders
                    .map((id) => SOURCING_STRATEGIES.find((strategy) => strategy.id === id)!.name)
                    .join(', ')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Highest score among assessed eligible candidates for the {totalAnswered} answered
                  questions. Unassessed candidates are not a confirmed comparison; this is not a
                  procurement approval.
                </p>
              </div>
            ) : (
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                No assessed eligible leader. Complete the requirement questions and selected
                candidate assumptions; failed requirements cannot be compensated by preference
                points.
              </p>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Inspect selected answer contributions
              </summary>
              <p className="my-2">
                Each strategy starts at 5 points. Add the unchanged authored weights below.
              </p>
              <ul className="space-y-2">
                {contributions.map((row) => (
                  <li key={row.questionId}>
                    <strong>{row.question}</strong> {row.option}
                    <div>
                      Build {row.weights.build >= 0 ? '+' : ''}
                      {row.weights.build}; Open Source {row.weights['open-source'] >= 0 ? '+' : ''}
                      {row.weights['open-source']}; Commercial{' '}
                      {row.weights.commercial >= 0 ? '+' : ''}
                      {row.weights.commercial}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>

      {/* Case Studies */}
      <div>
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" /> Named examples and fictional scenarios
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          The two typical-organization scenarios are fictional. Named company descriptions are
          supplied reference examples, not outcomes verified by this activity.
        </p>
        <div className="space-y-3">
          {CASE_STUDIES.map((cs) => {
            const colors = STRATEGY_COLORS[cs.strategy]
            const isExpanded = expandedCases.has(cs.id)
            return (
              <div key={cs.id} className={`glass-panel overflow-hidden border ${colors.border}`}>
                <Button
                  variant="ghost"
                  className="h-auto whitespace-normal w-full text-left p-4"
                  onClick={() => toggleCase(cs.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{cs.company}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${colors.border} ${colors.text}`}
                        >
                          {cs.strategy}
                        </span>
                        <span className="text-xs text-muted-foreground">{cs.industry}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{cs.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cs.id === 'enterprise-openssl' || cs.id === 'startup-bc'
                          ? 'Fictional planning scenario — illustrative outcome'
                          : 'Named reference example'}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                    )}
                  </div>
                </Button>
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div className="font-semibold text-xs text-muted-foreground mb-1">
                          Situation
                        </div>
                        <p className="text-sm text-foreground">{cs.situation}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-muted-foreground mb-1">
                          Decision
                        </div>
                        <p className="text-sm text-foreground">{cs.decision}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-muted-foreground mb-1">
                          Outcome
                        </div>
                        <p className="text-sm text-foreground">{cs.outcome}</p>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground mb-1">
                        Library Used
                      </div>
                      <code className="text-sm font-mono text-primary">{cs.libraryUsed}</code>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground mb-1">
                        Lessons Learned
                      </div>
                      <ul className="space-y-0.5">
                        {cs.lessonsLearned.map((l, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
