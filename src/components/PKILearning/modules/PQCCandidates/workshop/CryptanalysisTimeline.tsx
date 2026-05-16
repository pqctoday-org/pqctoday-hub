// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, ShieldOff, Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LIFECYCLE_EVENTS } from '../data/rounds'
import { CANDIDATES_BY_ID } from '../data/candidates'

const KIND_ICON: Record<string, React.ReactNode> = {
  cryptanalysis: <ShieldOff size={14} className="text-status-error" />,
  reparameterisation: <Wrench size={14} className="text-status-warning" />,
  selection: <AlertTriangle size={14} className="text-status-info" />,
  milestone: <AlertTriangle size={14} className="text-primary" />,
  standardisation: <AlertTriangle size={14} className="text-status-success" />,
}

const KIND_TONE: Record<string, string> = {
  cryptanalysis: 'border-status-error/40 bg-status-error/5',
  reparameterisation: 'border-status-warning/40 bg-status-warning/5',
  selection: 'border-status-info/40 bg-status-info/5',
  milestone: 'border-primary/30 bg-primary/5',
  standardisation: 'border-status-success/40 bg-status-success/5',
}

const KIND_LESSON: Record<string, string> = {
  cryptanalysis:
    'A cryptanalytic discovery — the public-review process at work. These events either eliminate a scheme or force a reparameterisation. Both are healthy outcomes.',
  reparameterisation:
    'A submission team responding to cryptanalysis by tightening parameters or switching to a more conservative field. The scheme itself survives; specific parameter sets do not.',
  selection: 'A NIST decision event — candidates move forward, fall behind, or are eliminated.',
  milestone: 'A process-level event — call opening, evaluation period start, etc.',
  standardisation:
    'A specification reaches FIPS-publishable form, or an existing standard is updated.',
}

export const CryptanalysisTimeline: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Only cryptanalysis + reparameterisation events are the focus here
  const filtered = LIFECYCLE_EVENTS.filter(
    (e) => e.kind === 'cryptanalysis' || e.kind === 'reparameterisation'
  )

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="text-base font-bold text-foreground mb-2">
          Cryptanalysis is part of the process
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every event below shaped the surviving candidates. Click an entry to see the schemes it
          affected and how each team responded. The PQC standardisation portfolio is more
          trustworthy <em>because</em> these attacks happened — not despite them.
        </p>
      </div>

      <div className="space-y-2">
        {filtered.map((evt) => {
          const isOpen = expanded === evt.id
          const affected = (evt.affects ?? [])
            .map((id) => CANDIDATES_BY_ID[id]) // eslint-disable-line security/detect-object-injection
            .filter(Boolean)
          return (
            <div key={evt.id} className={`rounded-lg border ${KIND_TONE[evt.kind]} p-3`}>
              <Button
                variant="ghost"
                onClick={() => setExpanded(isOpen ? null : evt.id)}
                className="w-full text-left flex items-start gap-3 p-0 h-auto bg-transparent hover:bg-transparent"
              >
                <div className="shrink-0 pt-0.5">{KIND_ICON[evt.kind]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{evt.date}</span>
                    <span className="text-sm font-semibold text-foreground">{evt.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-normal">
                    {evt.detail}
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </Button>

              {isOpen && (
                <div className="mt-3 pl-7 space-y-3 border-l-2 border-border/60">
                  <div className="text-xs text-foreground/85 italic">{KIND_LESSON[evt.kind]}</div>
                  {affected.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Schemes affected — and their response
                      </div>
                      {affected.map((c) => (
                        <div key={c.id} className="rounded border border-border bg-card/40 p-2">
                          <div className="text-xs font-semibold text-foreground">{c.name}</div>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                            {c.caveats}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No specific candidate flagged for this event — broader process implication.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
