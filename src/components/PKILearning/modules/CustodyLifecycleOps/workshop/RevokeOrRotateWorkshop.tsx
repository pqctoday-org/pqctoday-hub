// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import { REVOKE_ACTION_LABELS, W9_ITEMS, type RevokeActionId } from '../data/lifecycleOpsData'

const ALL_ACTIONS: RevokeActionId[] = [
  'revoke',
  'rotate-in-place',
  'reshare',
  'sweep-funds',
  'revoke-allowances',
  'nothing-possible',
]

interface Props {
  initialPreset?: string
}

export const RevokeOrRotateWorkshop: React.FC<Props> = ({ initialPreset }) => {
  const initialIndex = Math.max(
    0,
    W9_ITEMS.findIndex((i) => i.id === initialPreset)
  )
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [picks, setPicks] = useState<Record<string, RevokeActionId[]>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const item = W9_ITEMS[selectedIndex] ?? W9_ITEMS[0]
  const currentPicks = picks[item.id] ?? []
  const isChecked = Boolean(checked[item.id])

  const toggleAction = (action: RevokeActionId) => {
    setPicks((prev) => {
      const existing = prev[item.id] ?? []
      const next = existing.includes(action)
        ? existing.filter((a) => a !== action)
        : [...existing, action]
      return { ...prev, [item.id]: next }
    })
  }

  const isExactMatch =
    currentPicks.length === item.expectedActions.length &&
    item.expectedActions.every((a) => currentPicks.includes(a))

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <RefreshCw size={16} className="text-primary" aria-hidden="true" />
            W9: Select a Custody Item (12 Scenarios)
          </h3>
          <span className="text-xs text-muted-foreground">
            Checked: {Object.values(checked).filter(Boolean).length} / {W9_ITEMS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {W9_ITEMS.map((entry, idx) => (
            <Button
              key={entry.id}
              variant={idx === selectedIndex ? 'default' : 'outline'}
              onClick={() => setSelectedIndex(idx)}
              className="h-auto p-2.5 flex flex-col items-start text-left whitespace-normal"
            >
              <span className="text-xs font-bold">{entry.label}</span>
              <span className="text-[10px] opacity-80">{entry.category}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div>
          <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30 mb-1">
            {item.category}
          </span>
          <h4 className="text-base font-bold text-foreground">{item.label}</h4>
          <p className="text-sm text-muted-foreground mt-1">{item.scenario}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-foreground mb-2">
            Select ALL actions required (several items need more than one):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ALL_ACTIONS.map((action) => (
              <label
                key={action}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20 cursor-pointer text-xs text-foreground"
              >
                <input
                  type="checkbox"
                  checked={currentPicks.includes(action)}
                  onChange={() => toggleAction(action)}
                />
                <span>{REVOKE_ACTION_LABELS[action]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setChecked((prev) => ({ ...prev, [item.id]: true }))}
            disabled={currentPicks.length === 0}
          >
            Evaluate Decision
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPicks((prev) => ({ ...prev, [item.id]: [] }))
              setChecked((prev) => ({ ...prev, [item.id]: false }))
            }}
          >
            Reset Item
          </Button>
        </div>

        {isChecked ? (
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isExactMatch
                ? 'bg-status-success/10 border-status-success/30'
                : 'bg-status-warning/10 border-status-warning/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {isExactMatch ? (
                <CheckCircle2
                  size={16}
                  className="text-status-success shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  size={16}
                  className="text-status-warning shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="text-xs font-bold text-foreground">
                {isExactMatch
                  ? 'Exact match'
                  : `Expected: ${item.expectedActions.map((a) => REVOKE_ACTION_LABELS[a]).join(' + ')}`}
              </span>
            </div>
            <p className="text-xs text-foreground/90">{item.explanation}</p>
            <p className="text-xs text-muted-foreground">
              <strong>Must exist beforehand:</strong> {item.mustExistBeforehand}
            </p>
            <ClaimLine id={item.claimId} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
