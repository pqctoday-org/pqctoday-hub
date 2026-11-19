// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert, ClipboardCheck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'
import { GRID_EVIDENCE_ITEMS } from '../data/energyGridData'

export type GridChecklistAnswer = 'yes' | 'no' | 'unknown'

export const GridEvidenceScope: React.FC = () => {
  const markStepComplete = useModuleStore((s) => s.markStepComplete)
  const [answers, setAnswers] = useState<Record<string, GridChecklistAnswer>>(() =>
    Object.fromEntries(GRID_EVIDENCE_ITEMS.map((item) => [item.id, 'unknown']))
  )
  const [savedNotice, setSavedNotice] = useState(false)

  const setAnswer = (id: string, value: GridChecklistAnswer) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setSavedNotice(false)
  }

  const yesCount = GRID_EVIDENCE_ITEMS.filter((i) => answers[i.id] === 'yes').length
  const noCount = GRID_EVIDENCE_ITEMS.filter((i) => answers[i.id] === 'no').length
  const unknownCount = GRID_EVIDENCE_ITEMS.filter((i) => answers[i.id] === 'unknown').length

  // Critical invariant: Unknown or unanswered items NEVER produce a "low exposure" verdict.
  const verdict = (() => {
    if (unknownCount > 0) {
      return {
        label: 'Unverified / Evidence Gap — Unknown Never Means Low Exposure',
        tone: 'border-status-warning/50 bg-status-warning/10 text-status-warning',
        detail: `${unknownCount} utility control(s) remain Unknown. Treat every unanswered OT gateway, relay OEM, or AMI backhaul question as an active evidence gap until lab captures or signed vendor documentation close it.`,
      }
    }
    if (noCount > 0) {
      return {
        label: 'Confirmed Grid Migration Gaps Identified',
        tone: 'border-status-error/50 bg-status-error/10 text-status-error',
        detail: `${noCount} control(s) answered No. Log remediation milestones or formal exception controls in your OT/IT PQC program register.`,
      }
    }
    return {
      label: 'Sample Utility Evidence Scope Complete (Re-Verify in Production)',
      tone: 'border-status-success/50 bg-status-success/10 text-status-success',
      detail:
        'All sample items are marked Yes. Completing this educational checklist does not certify a Bulk Electric System or utility fleet — retain HIL test reports, packet captures, and active CMVP FIPS 140-3 IDs in production.',
    }
  })()

  const handleRecordCompletion = () => {
    markStepComplete('energy-utilities-pqc', 'grid-evidence-scope', 3)
    setSavedNotice(true)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational Utility Evidence Checklist:</strong> Triage a fictional power
          utility’s OT/IT and OEM supply-chain PQC readiness. Every control starts as{' '}
          <strong>Unknown</strong> — unanswered fields never imply low exposure.
        </span>
      </div>

      {/* Verdict Banner */}
      <div className={`rounded-xl border p-4 space-y-2 ${verdict.tone}`} role="status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            {unknownCount > 0 ? (
              <AlertTriangle size={17} className="shrink-0" />
            ) : noCount > 0 ? (
              <ShieldAlert size={17} className="shrink-0" />
            ) : (
              <CheckCircle2 size={17} className="shrink-0" />
            )}
            <span>{verdict.label}</span>
          </div>
          <span className="text-xs font-semibold">
            Yes: {yesCount} · No: {noCount} · Unknown: {unknownCount}
          </span>
        </div>
        <p className="text-xs text-foreground/85 leading-relaxed">{verdict.detail}</p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {GRID_EVIDENCE_ITEMS.map((item) => {
          const current = answers[item.id] ?? 'unknown'
          return (
            <article key={item.id} className="glass-panel p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-[220px]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {item.domainLabel}
                  </span>
                  <h3 className="text-sm font-bold text-foreground leading-snug">
                    {item.question}
                  </h3>
                </div>

                <div
                  role="group"
                  aria-label={`Answer for ${item.domainLabel}: ${item.id}`}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  {(
                    [
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'unknown', label: 'Unknown' },
                    ] as const
                  ).map((opt) => (
                    <Button
                      key={opt.value}
                      variant={current === opt.value ? 'gradient' : 'outline'}
                      size="sm"
                      aria-pressed={current === opt.value}
                      onClick={() => setAnswer(item.id, opt.value)}
                      className="h-8 px-3 text-xs"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{item.whyItMatters}</p>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 text-xs">
                <span className="font-semibold text-foreground">Drivers:</span>
                {item.drivers.map((drv) => (
                  <span
                    key={drv}
                    className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px]"
                  >
                    {drv}
                  </span>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <strong className="text-foreground">Evidence to Request / Verify: </strong>
                <span className="text-muted-foreground">{item.evidenceRequest}</span>
              </div>
            </article>
          )
        })}
      </div>

      {/* Record Workshop Step Completion */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {savedNotice ? (
            <span className="text-status-success font-semibold">
              Step 4 marked complete in your learning progress.
            </span>
          ) : (
            <span>
              Record completion once you have reviewed the utility evidence requests and governance
              rules.
            </span>
          )}
        </div>
        <Button variant="gradient" size="sm" onClick={handleRecordCompletion}>
          <ClipboardCheck size={15} className="mr-1.5" />
          Complete Grid Evidence Review
        </Button>
      </div>
    </div>
  )
}
