// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ScrollText, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import { W12_SCRIPT_STEPS } from '../data/lifecycleOpsData'

export const CeremonyScriptReviewWorkshop: React.FC = () => {
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const toggleFlag = (id: string) => {
    setFlagged((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const totalDefects = W12_SCRIPT_STEPS.filter((s) => s.isDefect).length
  const correctCount = W12_SCRIPT_STEPS.filter((s) => Boolean(flagged[s.id]) === s.isDefect).length

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ScrollText size={16} className="text-primary" aria-hidden="true" />
            W12: Audit Sample Key-Ceremony Script ({totalDefects} Planted Defects)
          </h3>
          {submitted ? (
            <span className="text-xs font-bold text-primary">
              Score: {correctCount} / {W12_SCRIPT_STEPS.length}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Check every step that violates custody ceremony controls or cited standards. Do not flag
          steps that the cited reference text permits (for example, CA/B Forum TLS BR §6.1.1.1
          allows either a Qualified Auditor witness OR a full video recording).
        </p>
      </div>

      <div className="space-y-3">
        {W12_SCRIPT_STEPS.map((step) => {
          const isMarked = Boolean(flagged[step.id])
          const isRight = isMarked === step.isDefect
          const inputId = `w12-${step.id}`
          return (
            <div key={step.id} className="glass-panel p-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isMarked}
                  onChange={() => toggleFlag(step.id)}
                  className="mt-1 cursor-pointer"
                />
                <label htmlFor={inputId} className="flex-1 cursor-pointer">
                  <span className="block text-xs font-bold text-foreground">
                    Step {step.stepNumber}: {step.title}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {step.scriptExcerpt}
                  </span>
                </label>
              </div>

              {submitted ? (
                <div
                  className={`p-3 rounded-lg border space-y-2 text-xs ${
                    isRight
                      ? 'bg-status-success/10 border-status-success/30'
                      : 'bg-status-warning/10 border-status-warning/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    {isRight ? (
                      <CheckCircle2
                        size={14}
                        className="text-status-success shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldAlert
                        size={14}
                        className="text-status-warning shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      {step.isDefect ? 'Planted Defect' : 'Valid Step'} — {step.controlName}
                    </span>
                  </div>
                  <p className="text-foreground/90">{step.explanation}</p>
                  <ClaimLine id={step.claimId} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => setSubmitted(true)}>Check Audit Findings</Button>
        <Button
          variant="outline"
          onClick={() => {
            setFlagged({})
            setSubmitted(false)
          }}
        >
          Reset Audit
        </Button>
      </div>
    </div>
  )
}
