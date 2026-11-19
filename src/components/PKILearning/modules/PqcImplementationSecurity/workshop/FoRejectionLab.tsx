// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FO_TRACE_STEPS } from '../data/implSecurityData'

type FoScenarioMode = 'valid' | 'tampered' | 'broken-oracle'

const SCENARIO_META: Record<
  FoScenarioMode,
  {
    label: string
    badge: string
    tone: string
    summary: string
    outcomeKey: string
    apiStatus: string
    timingProfile: string
  }
> = {
  valid: {
    label: 'Valid Ciphertext (Compliant FIPS 203)',
    badge: 'IND-CCA2 Compliant',
    tone: 'border-status-success/40 bg-status-success/10 text-status-success',
    summary:
      'Received ciphertext c matches re-encrypted c′ across all 1,088 bytes. Constant-time cmov selects K′; K̄ = J(z || c) was still computed unconditionally so timing and power profiles match the tampered case.',
    outcomeKey: "K' = 0x3b91...a02e (32-byte shared secret)",
    apiStatus: 'OK (0x00)',
    timingProfile: 'Constant — 100% identical branch & memory trace',
  },
  tampered: {
    label: '1-Bit Tampered Ciphertext (Implicit Rejection)',
    badge: 'Implicit Rejection Active',
    tone: 'border-primary/40 bg-primary/10 text-primary',
    summary:
      'A single bit flipped in c causes K-PKE.Decrypt to yield corrupted m′, so re-encrypted c′ != c. Constant-time cmov silently selects pseudorandom K̄ = J(z || c) and returns OK — denying the attacker any validity oracle.',
    outcomeKey: 'K̄ = J(z || c) = 0xc4a1...5b09 (32-byte pseudorandom key)',
    apiStatus: 'OK (0x00 — no mismatch error returned)',
    timingProfile: 'Constant — indistinguishable from valid decapsulation',
  },
  'broken-oracle': {
    label: 'Tampered Ciphertext (Broken Early-Exit / Error)',
    badge: 'Vulnerable CCA Oracle',
    tone: 'border-status-error/50 bg-status-error/10 text-status-error',
    summary:
      'Anti-pattern: early-exit memcmp stops at byte 0 and the API returns ERR_INVALID_CIPHERTEXT while skipping J(z || c). An active attacker uses the timing and error oracle to recover ML-KEM secret key coefficients.',
    outcomeKey: 'None (aborted with error)',
    apiStatus: 'ERR_INVALID_CIPHERTEXT (leaks c != c′)',
    timingProfile: 'Variable — early exit + skipped SHAKE-256 J(z || c)',
  },
}

function getScenarioMeta(mode: FoScenarioMode) {
  switch (mode) {
    case 'valid':
      return SCENARIO_META.valid
    case 'tampered':
      return SCENARIO_META.tampered
    case 'broken-oracle':
      return SCENARIO_META['broken-oracle']
  }
}

export const FoRejectionLab: React.FC = () => {
  const [scenario, setScenario] = useState<FoScenarioMode>('valid')
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1)

  const meta = getScenarioMeta(scenario)
  const currentStep =
    FO_TRACE_STEPS.find((s) => s.stepNumber === activeStepNumber) ?? FO_TRACE_STEPS[0]

  const getStepStateText = (step: (typeof FO_TRACE_STEPS)[number]) => {
    if (scenario === 'valid') return step.validState
    if (scenario === 'tampered') return step.tamperedState
    return step.brokenState
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational FIPS 203 Walkthrough:</strong> Compare how compliant{' '}
          <code>ML-KEM.Decaps</code> handles a valid ciphertext vs. a 1-bit tampered ciphertext
          using implicit rejection (<code>K̄ = J(z || c)</code>), and contrast both against a broken
          early-exit implementation.
        </span>
      </div>

      {/* Scenario Selector */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Select Ciphertext &amp; Implementation Scenario
        </span>
        <div
          role="group"
          aria-label="FO decapsulation scenario selector"
          className="grid grid-cols-1 md:grid-cols-3 gap-2.5"
        >
          {(
            [
              { id: 'valid', label: 'Valid Ciphertext (Compliant)' },
              { id: 'tampered', label: 'Tampered Ciphertext (Implicit Reject)' },
              { id: 'broken-oracle', label: 'Broken Explicit-Error / memcmp' },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              variant={scenario === item.id ? 'gradient' : 'outline'}
              aria-pressed={scenario === item.id}
              onClick={() => setScenario(item.id)}
              className="h-auto py-2.5 px-3 text-xs whitespace-normal text-left justify-start"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Scenario Outcome Banner */}
      <div className={`rounded-xl border p-4 space-y-3 ${meta.tone}`} role="status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            {scenario === 'broken-oracle' ? (
              <ShieldAlert size={17} className="shrink-0" />
            ) : scenario === 'tampered' ? (
              <ShieldCheck size={17} className="shrink-0" />
            ) : (
              <CheckCircle2 size={17} className="shrink-0" />
            )}
            <span>{meta.label}</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-background/60 border border-current/30">
            {meta.badge}
          </span>
        </div>
        <p className="text-xs text-foreground/85 leading-relaxed">{meta.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-current/20 text-xs">
          <div className="rounded bg-background/60 p-2.5 text-foreground">
            <span className="block text-[11px] text-muted-foreground">Returned Key</span>
            <span className="font-mono font-semibold">{meta.outcomeKey}</span>
          </div>
          <div className="rounded bg-background/60 p-2.5 text-foreground">
            <span className="block text-[11px] text-muted-foreground">API Status</span>
            <span className="font-mono font-semibold">{meta.apiStatus}</span>
          </div>
          <div className="rounded bg-background/60 p-2.5 text-foreground">
            <span className="block text-[11px] text-muted-foreground">Timing / Trace Profile</span>
            <span className="font-semibold">{meta.timingProfile}</span>
          </div>
        </div>
      </div>

      {/* 5-Stage Step-Through Trace */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">
            ML-KEM-768 Decapsulation Trace (FIPS 203 Algorithm 18)
          </h3>
          <div
            role="group"
            aria-label="Decapsulation trace stage selector"
            className="flex gap-1.5"
          >
            {FO_TRACE_STEPS.map((st) => (
              <Button
                key={st.stepNumber}
                variant={activeStepNumber === st.stepNumber ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={activeStepNumber === st.stepNumber}
                onClick={() => setActiveStepNumber(st.stepNumber)}
                className="h-7 px-2.5 text-xs"
              >
                Stage {st.stepNumber}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-foreground text-sm">
              Stage {currentStep.stepNumber}: {currentStep.stage}
            </span>
          </div>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Operation: </strong>
            {currentStep.operation}
          </p>
          <div
            className={`rounded-md border p-3 font-mono text-xs ${
              scenario === 'broken-oracle'
                ? 'border-status-error/40 bg-status-error/10 text-foreground'
                : 'border-border bg-background/70 text-foreground'
            }`}
          >
            {getStepStateText(currentStep)}
          </div>
          <div className="flex items-start gap-2 pt-1 text-muted-foreground">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            <span>{currentStep.securityNote}</span>
          </div>
        </div>

        {/* Full 5-Stage Overview Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Stage</th>
                <th className="py-2 font-semibold">Active Scenario Behavior</th>
              </tr>
            </thead>
            <tbody>
              {FO_TRACE_STEPS.map((st) => (
                <tr
                  key={st.stepNumber}
                  className={`border-b border-border/50 ${
                    st.stepNumber === activeStepNumber ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="py-2 pr-3 font-semibold text-foreground whitespace-nowrap">
                    {st.stepNumber}. {st.stage}
                  </td>
                  <td className="py-2 text-muted-foreground font-mono">{getStepStateText(st)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
