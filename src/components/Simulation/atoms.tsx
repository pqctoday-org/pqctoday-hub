// SPDX-License-Identifier: GPL-3.0-only
/**
 * Presentational atoms for the Simulation console (WS-05 extraction). Pure,
 * prop-driven, no store access — the building blocks the SimulationView shell and
 * its sub-sections compose.
 */
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PHASE_WIN_LEVEL } from '@/data/phaseMaturity'
import { TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME } from '@/data/timelineFacts.generated'
import { cn } from '@/lib/utils'

export const eyebrow =
  'font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-muted-foreground'

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`${eyebrow} ${className}`}>{children}</span>
}

/**
 * Marks a figure as an illustrative *planning anchor* rather than a published
 * standard (shelf-lives, government deadlines, the Q-Day year). The contrast
 * with un-badged standards (FIPS params, RFC numbers) is what teaches the
 * difference — so badge ONLY soft figures, never algorithm/standard chips.
 *
 * Accessibility: a real focusable `<button>` carrying the full explanation in
 * `aria-label` (reachable by keyboard + screen reader) — never a bare `title`.
 * `title` is supplied additionally for sighted hover. 10px keeps it above the
 * chip floor. `label` / `tip` let each site phrase the affordance for its figure.
 */
export function PlanningBadge({
  label = 'planning estimate',
  tip = 'Illustrative planning anchor, not a published standard — re-check the live source.',
  className = '',
}: {
  label?: string
  tip?: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      title={tip}
      aria-label={`${label}: ${tip}`}
      data-testid="planning-badge"
      className={cn(
        'inline-flex h-auto cursor-help items-center rounded-sm border border-warning/40 bg-warning/10 px-1 py-0 font-mono text-sim-chip font-semibold uppercase leading-tight tracking-[0.06em] text-warning underline decoration-dotted decoration-warning/60 underline-offset-2 hover:bg-warning/20',
        className
      )}
    >
      {label}
    </Button>
  )
}

/**
 * Marks whether the jurisdiction's PQC migration deadline is a binding legal
 * mandate (`HARD` — law / regulation / executive order) or soft published guidance
 * (`SOFT` — a target, not binding). Single source: the timeline CSV `mandate_type`
 * via TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME (keyed by full country name, as the
 * sim's `country` is). Renders nothing for jurisdictions with no curated national
 * deadline — keeps the sim honest: a guidance year is not a law.
 */
export function MandateBadge({
  country,
  className = '',
}: {
  country?: string
  className?: string
}) {
  // eslint-disable-next-line security/detect-object-injection
  const mandate = country ? TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME[country] : undefined
  if (mandate !== 'HARD' && mandate !== 'SOFT') return null
  const hard = mandate === 'HARD'
  const label = hard ? 'binding' : 'guidance'
  const tip = hard
    ? "This jurisdiction's PQC deadline is a binding legal mandate (law / regulation / executive order)."
    : "This jurisdiction's PQC date is published guidance — a target, not a binding legal mandate."
  return (
    <Button
      type="button"
      variant="ghost"
      title={tip}
      aria-label={`${label}: ${tip}`}
      data-testid="mandate-badge"
      className={`inline-flex h-auto cursor-help items-center rounded-sm border px-1 py-0 font-mono text-sim-chip font-semibold uppercase leading-tight tracking-[0.06em] ${
        hard
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-border bg-muted text-muted-foreground'
      } ${className}`}
    >
      {label}
    </Button>
  )
}

export function Ring({ level, sz = 30 }: { level: number; sz?: number }) {
  const stroke = 3.5
  const r = sz / 2 - stroke
  const C = 2 * Math.PI * r
  const col = level >= PHASE_WIN_LEVEL ? 'hsl(var(--success))' : 'hsl(var(--primary))'
  return (
    <div
      className="relative shrink-0"
      style={{ width: sz, height: sz }}
      role="img"
      aria-label={`Maturity level ${level} of 4${level >= PHASE_WIN_LEVEL ? ' — cleared' : ''}`}
    >
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={`${(C * level) / 4} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 grid place-items-center font-mono font-extrabold"
        style={{ fontSize: Math.max(10, sz * 0.3), color: col }}
      >
        {level}
      </div>
    </div>
  )
}

export function Radial({
  yearsToHorizon,
  safeYears,
  sz = 92,
}: {
  yearsToHorizon: number
  safeYears: number
  sz?: number
}) {
  const r = sz / 2 - 8
  const C = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, yearsToHorizon / safeYears))
  return (
    <div
      className="relative shrink-0"
      style={{ width: sz, height: sz }}
      role="img"
      aria-label={`${yearsToHorizon} years to Q-Day`}
    >
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="9"
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth="9"
          strokeDasharray={String(C)}
          strokeDashoffset={C * frac}
          strokeLinecap="round"
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="9"
          strokeDasharray={`${C * frac} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className="font-extrabold leading-none text-foreground"
            style={{ fontSize: sz * 0.24 }}
          >
            {yearsToHorizon}y
          </div>
          <div
            className="mt-0.5 font-mono tracking-[0.1em] text-muted-foreground"
            style={{ fontSize: Math.max(10, sz * 0.08) }}
          >
            TO Q-DAY
          </div>
        </div>
      </div>
    </div>
  )
}

export function Dial({
  label,
  value,
  hint,
  onClick,
  title = 'click to change',
  valueLabel,
}: {
  label: string
  value: string
  hint: string
  onClick: () => void
  /** Tooltip — defaults to "click to change"; override to explain what the dial does. */
  title?: string
  /** W6.6 — the FULL spoken form when the visible `value` is abbreviated to fit
   *  the pill. The Seat dial shows "Security" for "Security Architect", so a
   *  screen reader heard the truncation rather than the role. Visible text is
   *  unchanged; only the accessible name is expanded. */
  valueLabel?: string
}) {
  // Single-line pill (2026-08-02, header compaction) — was a 3-line stack
  // (LABEL ⟳ / value / hint). `hint` no longer has room to stay always-visible,
  // so it folds into the tooltip/aria-label instead of being dropped.
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      title={`${title} — ${hint}`}
      aria-label={`${label}: ${valueLabel ?? value}. ${hint}. Activate to change.`}
      className="h-auto flex-row items-center gap-1.5 whitespace-nowrap rounded-full border border-background/20 bg-background/10 px-3 py-1.5 hover:bg-background/20"
    >
      <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.1em] text-background/70">
        {label}
      </span>
      <span aria-hidden="true" className="text-background/40">
        ⟳
      </span>
      {/* aria-live so cycling the dial announces the new value to screen
          readers (07-29 review U7) — the button's aria-label alone is only
          read on focus, not on value change. */}
      <span aria-live="polite" className="text-[12.5px] font-bold text-background">
        {value}
      </span>
    </Button>
  )
}
