// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import { W17_CASES, type DecommItemId } from '../data/lifecycleOpsData'

export const DecommissionChecklistWorkshop: React.FC = () => {
  const [caseId, setCaseId] = useState<DecommItemId>('hot-wallet-address')
  const [orders, setOrders] = useState<Record<string, number>>({})
  const [keepFlags, setKeepFlags] = useState<Record<string, 'keep' | 'destroy'>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const activeCase = W17_CASES.find((c) => c.id === caseId) ?? W17_CASES[0]
  const isChecked = Boolean(checked[activeCase.id])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Trash2 size={16} className="text-primary" aria-hidden="true" />
          W17: Sequence Decommissioning &amp; Keep-vs-Destroy Decisions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {W17_CASES.map((c) => (
            <Button
              key={c.id}
              variant={c.id === activeCase.id ? 'default' : 'outline'}
              onClick={() => setCaseId(c.id)}
              className="h-auto p-3 flex flex-col items-start text-left whitespace-normal"
            >
              <span className="text-xs font-bold">{c.title}</span>
              <span className="text-[10px] opacity-80 mt-0.5">{c.summary}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {activeCase.steps.map((step) => {
          const pickedOrder = orders[step.id] ?? step.correctOrder
          const pickedKeep =
            keepFlags[step.id] ?? (step.disposition === 'keep' ? 'keep' : 'destroy')
          const expectedKeep = step.disposition === 'keep' ? 'keep' : 'destroy'
          const stepOk = pickedOrder === step.correctOrder && pickedKeep === expectedKeep

          return (
            <div key={step.id} className="glass-panel p-4 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p className="font-semibold text-foreground flex-1">{step.label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label={`Order for ${step.label}`}
                  >
                    <span className="text-muted-foreground mr-1">Order:</span>
                    {[1, 2, 3, 4].map((n) => (
                      <Button
                        key={n}
                        size="sm"
                        variant={pickedOrder === n ? 'default' : 'outline'}
                        onClick={() => setOrders((prev) => ({ ...prev, [step.id]: n }))}
                        className="h-7 px-2 text-xs"
                      >
                        #{n}
                      </Button>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label={`Disposition for ${step.label}`}
                  >
                    <Button
                      size="sm"
                      variant={pickedKeep === 'destroy' ? 'default' : 'outline'}
                      onClick={() => setKeepFlags((prev) => ({ ...prev, [step.id]: 'destroy' }))}
                      className="h-7 px-2 text-xs"
                    >
                      Execute / Destroy
                    </Button>
                    <Button
                      size="sm"
                      variant={pickedKeep === 'keep' ? 'default' : 'outline'}
                      onClick={() => setKeepFlags((prev) => ({ ...prev, [step.id]: 'keep' }))}
                      className="h-7 px-2 text-xs"
                    >
                      Retain
                    </Button>
                  </div>
                </div>
              </div>

              {isChecked ? (
                <div
                  className={`p-3 rounded-lg border space-y-1.5 ${
                    stepOk
                      ? 'bg-status-success/10 border-status-success/30'
                      : 'bg-status-warning/10 border-status-warning/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    {stepOk ? (
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
                      Expected Step #{step.correctOrder} ·{' '}
                      {expectedKeep === 'keep' ? 'Retain evidence/address' : 'Execute / Destroy'}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{step.hazardIfWrong}</p>
                  <ClaimLine id={step.claimId} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => setChecked((prev) => ({ ...prev, [activeCase.id]: true }))}>
          Validate Decommission Sequence
        </Button>
        <Button
          variant="outline"
          onClick={() => setChecked((prev) => ({ ...prev, [activeCase.id]: false }))}
        >
          Hide Feedback
        </Button>
      </div>
    </div>
  )
}
