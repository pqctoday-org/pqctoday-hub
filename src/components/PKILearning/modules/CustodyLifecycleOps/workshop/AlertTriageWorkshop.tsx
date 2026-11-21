// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { BellRing, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import { W14_EVENTS, type AlertResponse, type AlertSeverity } from '../data/lifecycleOpsData'

interface Props {
  initialPreset?: string
}

export const AlertTriageWorkshop: React.FC<Props> = ({ initialPreset }) => {
  const [selectedId, setSelectedId] = useState(
    W14_EVENTS.some((e) => e.id === initialPreset) ? (initialPreset as string) : W14_EVENTS[0].id
  )
  const [choices, setChoices] = useState<
    Record<string, { severity: AlertSeverity; response: AlertResponse; checked: boolean }>
  >({})

  const ev = W14_EVENTS.find((e) => e.id === selectedId) ?? W14_EVENTS[0]
  const current = choices[ev.id] ?? { severity: 'high', response: 'page', checked: false }

  const updateCurrent = (
    patch: Partial<{ severity: AlertSeverity; response: AlertResponse; checked: boolean }>
  ) => {
    setChoices((prev) => ({
      ...prev,
      [ev.id]: { ...current, ...patch },
    }))
  }

  const exact = current.severity === ev.expectedSeverity && current.response === ev.expectedResponse

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BellRing size={16} className="text-primary" aria-hidden="true" />
            W14: Replayed Custody Event Stream (12 Events)
          </h3>
          <span className="text-xs text-muted-foreground">
            Triaged: {Object.values(choices).filter((c) => c.checked).length} / {W14_EVENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {W14_EVENTS.map((item) => (
            <Button
              key={item.id}
              variant={item.id === ev.id ? 'default' : 'outline'}
              onClick={() => setSelectedId(item.id)}
              className="h-auto p-2.5 flex flex-col items-start text-left whitespace-normal"
            >
              <span className="text-[10px] opacity-75">
                {item.timestamp} · {item.sourceCategory}
              </span>
              <span className="text-xs font-semibold line-clamp-2">{item.signal}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/10 text-primary border-primary/30">
              {ev.sourceCategory}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-muted text-foreground border-border">
              Stage: {ev.stage}
            </span>
            <span className="text-xs text-muted-foreground">{ev.timestamp}</span>
          </div>
          <h4 className="text-base font-bold text-foreground">{ev.signal}</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
            <span className="font-semibold text-foreground block">Assign Severity</span>
            <div className="flex gap-2">
              {(['low', 'high', 'critical'] as const).map((sev) => (
                <Button
                  key={sev}
                  size="sm"
                  variant={current.severity === sev ? 'default' : 'outline'}
                  onClick={() => updateCurrent({ severity: sev })}
                >
                  {sev.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
            <span className="font-semibold text-foreground block">Assign Response</span>
            <div className="flex gap-2">
              {(['log', 'page', 'auto-pause'] as const).map((resp) => (
                <Button
                  key={resp}
                  size="sm"
                  variant={current.response === resp ? 'default' : 'outline'}
                  onClick={() => updateCurrent({ response: resp })}
                >
                  {resp}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={() => updateCurrent({ checked: true })}>Check Triage Decision</Button>

        {current.checked ? (
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs ${
              exact
                ? 'bg-status-success/10 border-status-success/30'
                : 'bg-status-warning/10 border-status-warning/30'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-foreground">
              {exact ? (
                <CheckCircle2
                  size={15}
                  className="text-status-success shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  size={15}
                  className="text-status-warning shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>
                Recommended: {ev.expectedSeverity.toUpperCase()} · {ev.expectedResponse}
              </span>
            </div>
            <p className="text-foreground/90">
              <strong>Pattern match:</strong> {ev.caseStudyMatch}
            </p>
            <p className="text-muted-foreground">
              <strong>Finality &amp; what response can still change:</strong>{' '}
              {ev.whatResponseCanChange}
            </p>
            <ClaimLine id={ev.claimId} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
