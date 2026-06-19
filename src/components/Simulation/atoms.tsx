// SPDX-License-Identifier: GPL-3.0-only
/**
 * Presentational atoms for the Simulation console (WS-05 extraction). Pure,
 * prop-driven, no store access — the building blocks the SimulationView shell and
 * its sub-sections compose.
 */
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PHASE_WIN_LEVEL } from '@/data/phaseMaturity'

export const eyebrow =
  'font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground'

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
      className={`inline-flex h-auto cursor-help items-center rounded-sm border border-warning/40 bg-warning/10 px-1 py-0 font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-warning underline decoration-dotted decoration-warning/60 underline-offset-2 hover:bg-warning/20 ${className}`}
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
        style={{ fontSize: sz * 0.3, color: col }}
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
            style={{ fontSize: sz * 0.08 }}
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
}: {
  label: string
  value: string
  hint: string
  onClick: () => void
  /** Tooltip — defaults to "click to change"; override to explain what the dial does. */
  title?: string
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      title={title}
      aria-label={`${label}: ${value}. Activate to change.`}
      className="h-auto items-start justify-start whitespace-normal flex flex-col gap-px rounded-lg border border-background/20 bg-background/10 px-3 py-1.5 text-left hover:bg-background/20"
    >
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
        {label} ⟳
      </span>
      <span className="text-[12.5px] font-bold text-background">{value}</span>
      <span className="text-[9.5px] text-background/50">{hint}</span>
    </Button>
  )
}

/**
 * Read-only counterpart to {@link Dial} for org facts that now come from the
 * user's assessment (single source of truth) — no click-to-cycle, no ⟳ glyph.
 * Renders as a static value tile with a "from your assessment" hint; `note`
 * surfaces extra context (e.g. the mapped industry, or a modelled-archetype note).
 */
export function ReadonlyDial({
  label,
  value,
  hint,
  note,
  title,
  badge,
}: {
  label: string
  value: string
  hint: string
  note?: string
  title?: string
  /** Optional affordance (e.g. a {@link PlanningBadge}) shown next to the label. */
  badge?: ReactNode
}) {
  return (
    <div
      title={title}
      aria-label={`${label}: ${value}. ${hint}.`}
      className="flex flex-col gap-px rounded-lg border border-background/20 bg-background/5 px-3 py-1.5 text-left"
    >
      <span className="flex items-center gap-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
        {label}
        {badge}
      </span>
      <span className="text-[12.5px] font-bold text-background">{value}</span>
      <span className="text-[9.5px] text-background/50">{hint}</span>
      {note && <span className="text-[8.5px] italic text-background/40">{note}</span>}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'text-foreground',
}: {
  label: string
  value: string
  sub: string
  tone?: string
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-2.5">
      <Eyebrow>{label}</Eyebrow>
      <div className={`mt-0.5 text-xl font-extrabold ${tone}`}>{value}</div>
      <div className="truncate text-[10.5px] text-muted-foreground">{sub}</div>
    </div>
  )
}
