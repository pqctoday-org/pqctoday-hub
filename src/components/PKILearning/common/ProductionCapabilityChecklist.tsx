// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck, ChevronDown, CheckCircle2, AlertTriangle, FlaskConical } from 'lucide-react'
import { getModuleCapabilityChecklist } from '@/data/moduleCapabilityChecklists'

export interface ProductionCapabilityChecklistProps {
  moduleId: string
  defaultOpen?: boolean
}

export const ProductionCapabilityChecklist: React.FC<ProductionCapabilityChecklistProps> = ({
  moduleId,
  defaultOpen = false,
}) => {
  const spec = getModuleCapabilityChecklist(moduleId)
  const [verificationMode, setVerificationMode] = useState<'positive' | 'adversarial' | null>(null)

  if (!spec) return null

  const { adversarialChallenge } = spec

  return (
    <details
      open={defaultOpen}
      data-testid="production-capability-checklist"
      data-module-id={moduleId}
      aria-label="Production Tool Capabilities and Verification Checklist"
      className="group mt-6 rounded-xl border border-primary/25 bg-card/80 p-4 text-sm shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground select-none">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Production Tool Capabilities &amp; Verification Checklist</span>
          <span className="hidden sm:inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {spec.roleFocus}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3 space-y-3 border-t border-border/60 pt-3 text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">
            Capabilities to require in your production tools:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            {spec.productionCapabilities.map((cap, idx) => (
              <li key={idx}>{cap}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              How to evaluate in your environment
            </p>
            <p className="mt-1 text-xs leading-relaxed">{spec.evaluationMethod}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Production evidence to collect
            </p>
            <p className="mt-1 text-xs leading-relaxed">{spec.evidenceRequired}</p>
          </div>
        </div>

        <div
          data-testid="module-adversarial-lab"
          className="rounded-lg border border-primary/30 bg-muted/30 p-3 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                Break &amp; Verify — Failure/Refusal Lab: {adversarialChallenge.scenarioTitle}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="module-verify-positive-btn"
                onClick={() => setVerificationMode('positive')}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  verificationMode === 'positive'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-foreground'
                    : 'border-border bg-background hover:bg-muted text-foreground'
                }`}
              >
                Run Valid Sample Baseline
              </button>
              <button
                type="button"
                data-testid="module-verify-adversarial-btn"
                onClick={() => setVerificationMode('adversarial')}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  verificationMode === 'adversarial'
                    ? 'border-amber-500/60 bg-amber-500/15 text-foreground'
                    : 'border-border bg-background hover:bg-muted text-foreground'
                }`}
              >
                Inject Fault / Policy Violation
              </button>
            </div>
          </div>

          {verificationMode === 'positive' && (
            <div
              data-testid="module-verify-receipt"
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  STATUS: PASS — {adversarialChallenge.positiveCase.label}
                </span>
                <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  {adversarialChallenge.positiveCase.telemetryCode}
                </code>
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Sample Input:</span>{' '}
                {adversarialChallenge.positiveCase.inputSummary}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Deterministic Outcome:</span>{' '}
                {adversarialChallenge.positiveCase.expectedResult}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Production Decision Lesson:</span>{' '}
                {adversarialChallenge.adversarialCase.productionLesson}
              </p>
            </div>
          )}

          {verificationMode === 'adversarial' && (
            <div
              data-testid="module-verify-receipt"
              className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  STATUS: REFUSED / TAMPER DETECTED — {adversarialChallenge.adversarialCase.label}
                </span>
                <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  {adversarialChallenge.adversarialCase.telemetryCode}
                </code>
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Fault / Violation Injected:</span>{' '}
                {adversarialChallenge.adversarialCase.faultInjected}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Expected Tool Refusal:</span>{' '}
                {adversarialChallenge.adversarialCase.expectedRefusal}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Production Decision Lesson:</span>{' '}
                {adversarialChallenge.adversarialCase.productionLesson}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs italic text-muted-foreground">{spec.educationalBoundary}</p>
      </div>
    </details>
  )
}
