// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import { W15_ACCESS_ROWS } from '../data/lifecycleOpsData'

export const AccessMatrixReviewWorkshop: React.FC = () => {
  const [marked, setMarked] = useState<Record<string, boolean>>({})
  const [checked, setChecked] = useState(false)

  const toggle = (id: string) => setMarked((prev) => ({ ...prev, [id]: !prev[id] }))

  const totalConflicts = W15_ACCESS_ROWS.filter((r) => r.isConflict).length
  const score = W15_ACCESS_ROWS.filter((r) => Boolean(marked[r.id]) === r.isConflict).length

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
            W15: Custody Effective-Permission Matrix Review ({totalConflicts} Planted Conflicts)
          </h3>
          {checked ? (
            <span className="text-xs font-bold text-primary">
              Score: {score} / {W15_ACCESS_ROWS.length}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Judge each role on its <strong>effective</strong> permissions (inherited groups, service
          identities, HSM SO privileges, and break-glass handling) rather than the nominal title
          alone. Mark every separation-of-duties or path-isolation conflict.
        </p>
      </div>

      <div className="space-y-3">
        {W15_ACCESS_ROWS.map((row) => {
          const isMarked = Boolean(marked[row.id])
          const isCorrect = isMarked === row.isConflict
          const inputId = `w15-${row.id}`
          return (
            <div key={row.id} className="glass-panel p-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isMarked}
                  onChange={() => toggle(row.id)}
                  className="mt-1 cursor-pointer"
                />
                <label htmlFor={inputId} className="flex-1 text-xs space-y-1 cursor-pointer">
                  <span className="block font-bold text-foreground">{row.role}</span>
                  <span className="block text-muted-foreground">
                    <strong>Listed:</strong> {row.listedPermission}
                  </span>
                  <span className="block text-foreground/90">
                    <strong>Effective:</strong> {row.effectivePermission}
                  </span>
                </label>
              </div>

              {checked ? (
                <div
                  className={`p-3 rounded-lg border space-y-2 text-xs ${
                    isCorrect
                      ? 'bg-status-success/10 border-status-success/30'
                      : 'bg-status-warning/10 border-status-warning/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    {isCorrect ? (
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
                      {row.isConflict ? 'Effective-Permission Conflict' : 'Sound Control'}
                    </span>
                  </div>
                  <p className="text-foreground/90">{row.explanation}</p>
                  <ClaimLine id={row.claimId} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => setChecked(true)}>Check Matrix Review</Button>
        <Button
          variant="outline"
          onClick={() => {
            setMarked({})
            setChecked(false)
          }}
        >
          Reset Review
        </Button>
      </div>
    </div>
  )
}
