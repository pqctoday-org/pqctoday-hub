// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SQUEEZE_2026_2030,
  CAB_FORUM_CERT_LIFETIME,
  type SqueezeEvent,
} from '@/data/regulatoryTimelines'

/**
 * "2026–2030 Squeeze" ribbon (PER-PAGE-CHANGES Timeline #2).
 *
 * Assembles the converging-deadline sequence from the Phase 4 Reg & Standards
 * Alignment Map (p.157) into one cross-jurisdiction lane — FIPS 140-2 sunset,
 * CMMC L2, the CNSA 2.0 procurement gate, the CA/Browser Forum SC-081v3
 * certificate-lifetime steps (200d → 100d → 47d) and the new 2026 developments
 * (NIS2 amendment, G7 financial, MTC / Chrome Q3 2027). Data lives in
 * `regulatoryTimelines.ts` (`SQUEEZE_2026_2030`, `CAB_FORUM_CERT_LIFETIME`).
 *
 * Additive: collapsed by default — the Gantt is unchanged unless expanded.
 */

const TRACK_LABELS: Record<SqueezeEvent['track'], string> = {
  standards: 'Standards',
  'cab-forum': 'CA/Browser Forum',
  regulation: 'Regulation',
  cnsa: 'CNSA 2.0',
}

const TRACK_COLORS: Record<SqueezeEvent['track'], string> = {
  standards: 'border-primary/40 bg-primary/10 text-primary',
  'cab-forum': 'border-warning/40 bg-warning/10 text-warning',
  regulation: 'border-accent/40 bg-accent/10 text-accent',
  cnsa: 'border-destructive/40 bg-destructive/10 text-destructive',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDate = (iso: string): string => {
  const [y, m] = iso.split('-')
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`
}

export const SqueezeRibbon: React.FC = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="squeeze-ribbon-heading"
      data-testid="squeeze-ribbon"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="squeeze-ribbon-heading"
              className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap"
            >
              The 2026–2030 Squeeze
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-warning/30 bg-warning/10 text-warning uppercase tracking-wide">
                Phase 4 · Converging deadlines
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {SQUEEZE_2026_2030.length} regulatory deadlines compress into a ~48-month window —
              including the CA/Browser Forum certificate-lifetime track.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="squeeze-ribbon-body"
          className="shrink-0 text-xs gap-1"
        >
          {expanded ? 'Hide' : 'Show squeeze'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {expanded && (
        <div id="squeeze-ribbon-body" className="mt-4 space-y-4">
          {/* CA/Browser Forum certificate-lifetime track */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <h3 className="text-xs font-bold text-foreground mb-2">
              CA/Browser Forum SC-081v3 — TLS certificate lifetime
            </h3>
            <ol className="flex items-center gap-2 flex-wrap" data-testid="cab-forum-track">
              {CAB_FORUM_CERT_LIFETIME.map((step, i) => (
                <li key={step.date} className="flex items-center gap-2">
                  <span className="flex flex-col items-center">
                    <span className="text-sm font-bold text-warning">{step.maxDays}d</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(step.date)}
                    </span>
                  </span>
                  {i < CAB_FORUM_CERT_LIFETIME.length - 1 && (
                    <span aria-hidden="true" className="text-muted-foreground">
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Converging-deadline sequence */}
          <ol className="space-y-1.5" data-testid="squeeze-sequence">
            {SQUEEZE_2026_2030.map((ev) => (
              <li
                key={`${ev.date}-${ev.label}`}
                className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-2.5 py-1.5"
              >
                <span className="text-[11px] font-mono text-muted-foreground w-16 shrink-0 pt-0.5">
                  {formatDate(ev.date)}
                </span>
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${TRACK_COLORS[ev.track]}`}
                >
                  {TRACK_LABELS[ev.track]}
                </span>
                <span className="text-xs text-foreground">
                  <span className="font-semibold">{ev.label}</span>
                  <span className="text-muted-foreground"> — {ev.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-muted-foreground">
            Source: Applied Quantum Reg &amp; Standards Alignment Map / &ldquo;2026–2030
            Squeeze&rdquo; (p.157).
          </p>
        </div>
      )}
    </section>
  )
}
