// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ESCALATION_TIERS,
  EXCEPTION_CRITERIA,
  COMPENSATING_CONTROLS,
} from '../data/governanceTemplates'

type ExceptionRating = 'yes' | 'partial' | 'no' | ''

interface ExceptionState {
  ratings: Record<string, ExceptionRating>
  selectedControls: string[]
  systemName: string
  exceptionOwner: string
}

const RATING_LABELS: Record<ExceptionRating, string> = {
  yes: 'Yes',
  partial: 'Partial',
  no: 'No',
  '': '—',
}

const RATING_COLORS: Record<ExceptionRating, string> = {
  yes: 'bg-status-error/20 text-status-error border-status-error/40',
  partial: 'bg-status-warning/20 text-status-warning border-status-warning/40',
  no: 'bg-status-success/20 text-status-success border-status-success/40',
  '': 'bg-muted text-muted-foreground border-border',
}

const WEIGHT_MULTIPLIER: Record<string, number> = { high: 3, medium: 2, low: 1 }

function computeRiskScore(ratings: Record<string, ExceptionRating>): number {
  let total = 0
  let max = 0
  for (const criterion of EXCEPTION_CRITERIA) {
    const mult = WEIGHT_MULTIPLIER[criterion.weight] ?? 1
    max += mult * 2
    const r = ratings[criterion.id]
    if (r === 'yes') total += mult * 2
    else if (r === 'partial') total += mult * 1
  }
  if (max === 0) return 0
  return Math.round((total / max) * 100)
}

function getRiskLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'High Risk — Escalate to CISO', color: 'text-status-error' }
  if (score >= 40)
    return { label: 'Medium Risk — Program Manager Review', color: 'text-status-warning' }
  return { label: 'Low Risk — Team Lead Approval', color: 'text-status-success' }
}

function cycleRating(current: ExceptionRating): ExceptionRating {
  const order: ExceptionRating[] = ['', 'yes', 'partial', 'no']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

export const EscalationFramework: React.FC = () => {
  const [expandedTier, setExpandedTier] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'tiers' | 'exception'>('tiers')
  const [exState, setExState] = useState<ExceptionState>({
    ratings: {},
    selectedControls: [],
    systemName: '',
    exceptionOwner: '',
  })

  const riskScore = computeRiskScore(exState.ratings)
  const riskInfo = getRiskLabel(riskScore)

  const toggleControl = (id: string) => {
    setExState((prev) => ({
      ...prev,
      selectedControls: prev.selectedControls.includes(id)
        ? prev.selectedControls.filter((c) => c !== id)
        : [...prev.selectedControls, id],
    }))
  }

  const cycleRatingForCriterion = (id: string) => {
    setExState((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [id]: cycleRating((prev.ratings[id] as ExceptionRating) || '') },
    }))
  }

  const resetException = () => {
    setExState({ ratings: {}, selectedControls: [], systemName: '', exceptionOwner: '' })
  }

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'tiers' ? 'gradient' : 'ghost'}
          onClick={() => setActiveView('tiers')}
          className="px-4 py-2 text-sm font-medium rounded-lg"
        >
          Escalation Tiers
        </Button>
        <Button
          variant={activeView === 'exception' ? 'gradient' : 'ghost'}
          onClick={() => setActiveView('exception')}
          className="px-4 py-2 text-sm font-medium rounded-lg"
        >
          Exception Request Builder
        </Button>
      </div>

      {/* ─── ESCALATION TIERS ─── */}
      {activeView === 'tiers' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click a tier to see trigger examples and resolution timelines. Use this framework to
            define who owns each class of PQC governance conflict.
          </p>

          {ESCALATION_TIERS.map((tier) => {
            const isOpen = expandedTier === tier.tier
            return (
              <div
                key={tier.tier}
                className="glass-panel rounded-lg overflow-hidden border border-border"
              >
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors h-auto rounded-none"
                  onClick={() => setExpandedTier(isOpen ? null : tier.tier)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold border border-primary/40 shrink-0">
                      T{tier.tier}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{tier.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {tier.owner}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                      <Clock size={12} />
                      {tier.resolutionTimelineDays}d SLA
                    </span>
                    {isOpen ? (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                  </div>
                </Button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Trigger Examples
                        </p>
                        <ul className="space-y-1">
                          {tier.triggerExamples.map((ex, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground/80"
                            >
                              <AlertTriangle
                                size={12}
                                className="text-status-warning mt-0.5 shrink-0"
                              />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Resolution SLA
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {tier.resolutionTimelineDays} calendar days
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Escalates To
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {tier.escalatesTo ?? 'Board of Directors (final)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── EXCEPTION REQUEST BUILDER ─── */}
      {activeView === 'exception' && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Use this tool to evaluate a policy exception request. Rate each criterion, select
            compensating controls, and the builder will recommend the appropriate approval tier.
          </p>

          {/* System info */}
          <div className="glass-panel p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">System Under Review</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="escalation-system-name"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  System / Application Name
                </label>
                <input
                  id="escalation-system-name"
                  type="text"
                  value={exState.systemName}
                  onChange={(e) => setExState((prev) => ({ ...prev, systemName: e.target.value }))}
                  placeholder="e.g., Payment Gateway v2"
                  className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="escalation-exception-owner"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Exception Owner
                </label>
                <input
                  id="escalation-exception-owner"
                  type="text"
                  value={exState.exceptionOwner}
                  onChange={(e) =>
                    setExState((prev) => ({ ...prev, exceptionOwner: e.target.value }))
                  }
                  placeholder="e.g., Payments Engineering Lead"
                  className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Criteria rating */}
          <div className="glass-panel p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Exception Criteria{' '}
              <span className="text-muted-foreground font-normal text-xs">
                — click rating to cycle Yes / Partial / No
              </span>
            </p>
            <div className="space-y-3">
              {EXCEPTION_CRITERIA.map((criterion) => {
                const rating = (exState.ratings[criterion.id] as ExceptionRating) || ''
                return (
                  <div
                    key={criterion.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {criterion.label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${
                            criterion.weight === 'high'
                              ? 'bg-status-error/10 text-status-error border-status-error/30'
                              : criterion.weight === 'medium'
                                ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                                : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {criterion.weight}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{criterion.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => cycleRatingForCriterion(criterion.id)}
                      className={`shrink-0 px-3 py-1.5 h-auto rounded border text-xs font-bold transition-colors ${RATING_COLORS[rating]}`}
                    >
                      {RATING_LABELS[rating]}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Compensating controls */}
          <div className="glass-panel p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Compensating Controls</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {COMPENSATING_CONTROLS.map((control) => {
                const selected = exState.selectedControls.includes(control.id)
                return (
                  <Button
                    key={control.id}
                    variant="ghost"
                    onClick={() => toggleControl(control.id)}
                    className={`text-left p-3 h-auto rounded-lg border transition-colors justify-start ${
                      selected
                        ? 'bg-primary/10 border-primary/40'
                        : 'bg-muted/30 border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2
                        size={14}
                        className={`mt-0.5 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{control.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {control.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Risk score result */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Exception Risk Assessment</p>
              <Button
                variant="ghost"
                onClick={resetException}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 h-auto"
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold shrink-0"
                style={{
                  borderColor:
                    riskScore >= 70
                      ? 'hsl(var(--status-error))'
                      : riskScore >= 40
                        ? 'hsl(var(--status-warning))'
                        : 'hsl(var(--status-success))',
                  color:
                    riskScore >= 70
                      ? 'hsl(var(--status-error))'
                      : riskScore >= 40
                        ? 'hsl(var(--status-warning))'
                        : 'hsl(var(--status-success))',
                }}
              >
                {riskScore}
              </div>
              <div>
                <p className={`text-sm font-bold ${riskInfo.color}`}>{riskInfo.label}</p>
                {exState.selectedControls.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {exState.selectedControls.length} compensating control
                    {exState.selectedControls.length !== 1 ? 's' : ''} selected — include in
                    exception package
                  </p>
                )}
                {exState.systemName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    System: <span className="text-foreground">{exState.systemName}</span>
                    {exState.exceptionOwner && (
                      <>
                        {' '}
                        &mdash; Owner:{' '}
                        <span className="text-foreground">{exState.exceptionOwner}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${riskScore}%`,
                  backgroundColor:
                    riskScore >= 70
                      ? 'hsl(var(--status-error))'
                      : riskScore >= 40
                        ? 'hsl(var(--status-warning))'
                        : 'hsl(var(--status-success))',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
