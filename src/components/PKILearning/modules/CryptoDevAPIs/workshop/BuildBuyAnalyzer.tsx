// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, BarChart3, BookOpen } from 'lucide-react'
import {
  SOURCING_STRATEGIES,
  WIZARD_QUESTIONS,
  CASE_STUDIES,
  type SourcingStrategy,
} from '../data/buildBuyData'
import { Button } from '@/components/ui/button'

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

type ScoresMap = Record<SourcingStrategy, number>

export const BuildBuyAnalyzer: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [expandedStrategies, setExpandedStrategies] = useState<Set<SourcingStrategy>>(new Set())
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())

  const scores: ScoresMap = useMemo(() => {
    const s: ScoresMap = { build: 5, 'open-source': 5, commercial: 5 }
    Object.entries(answers).forEach(([qId, optionIdx]) => {
      const q = WIZARD_QUESTIONS.find((q) => q.id === qId)
      if (!q) return
      const opt = q.options[optionIdx]
      if (!opt) return
      ;(Object.keys(opt.weights) as SourcingStrategy[]).forEach((k) => {
        s[k] += opt.weights[k]
      })
    })
    return s
  }, [answers])

  const totalAnswered = Object.keys(answers).length
  const totalQuestions = WIZARD_QUESTIONS.length
  const maxScore = Math.max(...Object.values(scores))
  const recommendation = (Object.keys(scores) as SourcingStrategy[]).find(
    (k) => scores[k] === maxScore
  )

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
                  className="w-full text-left p-4"
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
                        <BarChart3 size={12} className="text-primary" /> TCO Estimate
                      </div>
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
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
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
              Score ({totalAnswered}/{totalQuestions} answered)
            </div>
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
            {recommendation && totalAnswered >= 3 && (
              <div
                className={`mt-3 p-3 rounded-lg border ${STRATEGY_COLORS[recommendation].border} ${STRATEGY_COLORS[recommendation].bg}`}
              >
                <div className="font-bold text-sm text-foreground">
                  Recommendation: {SOURCING_STRATEGIES.find((s) => s.id === recommendation)?.name}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {SOURCING_STRATEGIES.find((s) => s.id === recommendation)?.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case Studies */}
      <div>
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" /> Real-World Case Studies
        </h3>
        <div className="space-y-3">
          {CASE_STUDIES.map((cs) => {
            const colors = STRATEGY_COLORS[cs.strategy]
            const isExpanded = expandedCases.has(cs.id)
            return (
              <div key={cs.id} className={`glass-panel overflow-hidden border ${colors.border}`}>
                <Button
                  variant="ghost"
                  className="w-full text-left p-4"
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
