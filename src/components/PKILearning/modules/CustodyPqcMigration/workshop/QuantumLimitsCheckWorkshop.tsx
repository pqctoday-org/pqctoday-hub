// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldAlert, CheckCircle2, XCircle, Radio, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QUANTUM_STACK_SCENARIOS, HNDL_CHANNEL_MESSAGES } from '../data/custodyPqcData'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'

interface Props {
  initialPreset?: string
}

export const QuantumLimitsCheckWorkshop: React.FC<Props> = ({ initialPreset }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    initialPreset && QUANTUM_STACK_SCENARIOS.some((s) => s.id === initialPreset)
      ? initialPreset
      : QUANTUM_STACK_SCENARIOS[0].id
  )
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [hndlPicks, setHndlPicks] = useState<Record<string, boolean | undefined>>({})

  const scenario =
    QUANTUM_STACK_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? QUANTUM_STACK_SCENARIOS[0]
  const chosenOptionId = selectedAnswers[scenario.id]
  const chosenOption = scenario.firstBreakOptions.find((o) => o.id === chosenOptionId)

  const hndlScore = HNDL_CHANNEL_MESSAGES.filter((m) => {
    const pick = hndlPicks[m.id]
    return pick !== undefined && pick === m.hndlExposed
  }).length
  const hndlAnswered = HNDL_CHANNEL_MESSAGES.filter((m) => {
    return hndlPicks[m.id] !== undefined
  }).length

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-primary" size={20} aria-hidden="true" />
          <h2 className="text-xl font-bold text-gradient">
            W5: Quantum Limits &amp; HNDL Channel Check
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          For each fictional custody stack below, identify what a cryptographically relevant quantum
          computer (CRQC) breaks first — and which change addresses it. Then audit five
          party-to-party messages to separate immediate harvest-now-decrypt-later (HNDL)
          confidentiality exposure from future signature forgery.
        </p>
      </div>

      {/* Part A: Stack selector & first-break diagnosis */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-base font-bold text-foreground">
          Part 1: What Breaks First in Each Custody Combination?
        </h3>
        <div className="flex flex-wrap gap-2">
          {QUANTUM_STACK_SCENARIOS.map((s) => {
            const active = s.id === scenario.id
            return (
              <Button
                key={s.id}
                variant="ghost"
                onClick={() => setSelectedScenarioId(s.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border ${
                  active
                    ? 'bg-primary/15 text-primary border-primary/50'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted/70'
                }`}
              >
                {s.name}
              </Button>
            )
          })}
        </div>

        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
          <p className="text-sm font-semibold text-foreground">{scenario.name}</p>
          <p className="text-sm text-muted-foreground">{scenario.summary}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select the earliest quantum failure mode:
          </p>
          {scenario.firstBreakOptions.map((opt) => {
            const isSelected = chosenOptionId === opt.id
            return (
              <Button
                key={opt.id}
                variant="ghost"
                onClick={() =>
                  setSelectedAnswers((prev) => ({
                    ...prev,
                    [scenario.id]: opt.id,
                  }))
                }
                className={`w-full h-auto justify-start text-left whitespace-normal p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? opt.isFirstBreak
                      ? 'bg-status-success/10 border-status-success/50 text-foreground'
                      : 'bg-status-error/10 border-status-error/50 text-foreground'
                    : 'bg-background/60 border-border hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isSelected ? (
                    opt.isFirstBreak ? (
                      <CheckCircle2
                        size={16}
                        className="text-status-success shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="text-status-error shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )
                  ) : (
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-sm">{opt.label}</span>
                </div>
              </Button>
            )
          })}
        </div>

        {chosenOption ? (
          <div className="space-y-3 pt-2">
            <div
              className={`p-4 rounded-lg border text-sm ${
                chosenOption.isFirstBreak
                  ? 'bg-status-success/10 border-status-success/40 text-foreground'
                  : 'bg-status-warning/10 border-status-warning/40 text-foreground'
              }`}
            >
              <p className="font-semibold mb-1">
                {chosenOption.isFirstBreak ? 'Diagnosis confirmed' : 'Re-check the failure order'}
              </p>
              <p className="text-muted-foreground">{chosenOption.explanation}</p>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Targeted change ({scenario.remediation.maturity})
              </p>
              <p className="text-sm text-foreground">{scenario.remediation.action}</p>
            </div>

            <ClaimLine id={scenario.remediation.claimId} chip="Primary reference" />

            <ReadingNote title="Rule G1 authority assumption">{scenario.g1Note}</ReadingNote>
          </div>
        ) : null}
      </div>

      {/* Part B: HNDL Party-to-Party Message Panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-primary" aria-hidden="true" />
            <h3 className="text-base font-bold text-foreground">
              Part 2: Party-to-Party HNDL Exposure Panel
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
            Classified: {hndlAnswered}/{HNDL_CHANNEL_MESSAGES.length} · Correct: {hndlScore}/
            {HNDL_CHANNEL_MESSAGES.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Mark which messages carried over classical key exchange or classical envelopes are exposed
          to harvest-now-decrypt-later (confidentiality) today versus future forgery
          (authentication) only.
        </p>

        <div className="space-y-3">
          {HNDL_CHANNEL_MESSAGES.map((item) => {
            const pick = hndlPicks[item.id]
            const isCorrect = pick !== undefined && pick === item.hndlExposed
            return (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-muted/40 border border-border space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.message}</p>
                    <p className="text-xs text-muted-foreground">Transport: {item.carriedOver}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => setHndlPicks((prev) => ({ ...prev, [item.id]: true }))}
                      className={`px-3 py-1.5 text-xs rounded border ${
                        pick === true
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-background/60 text-foreground border-border'
                      }`}
                    >
                      HNDL target now
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setHndlPicks((prev) => ({ ...prev, [item.id]: false }))}
                      className={`px-3 py-1.5 text-xs rounded border ${
                        pick === false
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-background/60 text-foreground border-border'
                      }`}
                    >
                      Not HNDL (auth / public)
                    </Button>
                  </div>
                </div>
                {pick !== undefined ? (
                  <p
                    className={`text-xs ${isCorrect ? 'text-status-success' : 'text-status-error'}`}
                  >
                    {isCorrect ? 'Correct: ' : 'Check again: '}
                    {item.reason}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        <ClaimLine id="DA-6.6a" chip="HNDL vs Forgery" />
      </div>
    </div>
  )
}
