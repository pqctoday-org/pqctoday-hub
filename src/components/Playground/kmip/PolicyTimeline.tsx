// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyTimeline — the "visual diagram" half of the Policy view: every rule that
// carries a temporal bound (`effective_from` / `effective_until` / `after`) drawn
// as a bar on a shared year axis, with a "today" marker. Makes a migration
// roadmap (e.g. "classical Sign banned after 2030", "hybrid required 2026–2029")
// legible at a glance instead of buried in dates.
import type { ParsedRule } from './policyModel'

const YEAR_MS = 365.25 * 24 * 3600 * 1000

/** Parse a YAML TimeBound to epoch-ms. `always` / unparseable → null (open). */
function dateMs(v?: string): number | null {
  if (!v || v === 'always') return null
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

interface Bar {
  rule: ParsedRule
  /** start/end in epoch-ms; null = open on that side. */
  start: number | null
  end: number | null
  oneSided: boolean
}

export function PolicyTimeline({ rules }: { rules: ParsedRule[] }) {
  const bars: Bar[] = rules.map((r) => {
    const after = dateMs(r.after)
    if (after !== null && !r.effectiveFrom && !r.effectiveUntil) {
      return { rule: r, start: after, end: null, oneSided: true } // active from `after` onward
    }
    return {
      rule: r,
      start: dateMs(r.effectiveFrom),
      end: dateMs(r.effectiveUntil),
      oneSided: false,
    }
  })

  // Domain: span the concrete dates (+ today), padded to whole years.
  const now = Date.now()
  const pts = bars.flatMap((b) => [b.start, b.end]).filter((v): v is number => v !== null)
  pts.push(now)
  const minY = new Date(Math.min(...pts)).getUTCFullYear()
  const maxY = new Date(Math.max(...pts)).getUTCFullYear()
  const domStart = Date.UTC(minY, 0, 1)
  const domEnd = Date.UTC(maxY + 1, 0, 1)
  const span = domEnd - domStart || YEAR_MS
  const pct = (ms: number) => Math.max(0, Math.min(100, ((ms - domStart) / span) * 100))

  const years: number[] = []
  for (let y = minY; y <= maxY + 1; y++) years.push(y)
  const nowPct = pct(now)

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* Year axis */}
      <div className="relative h-4 ml-[148px]">
        {years.map((y) => (
          <span
            key={y}
            className="absolute -translate-x-1/2 text-[9px] font-mono text-muted-foreground"
            style={{ left: `${pct(Date.UTC(y, 0, 1))}%` }}
          >
            {y}
          </span>
        ))}
      </div>

      <div className="relative">
        {/* "today" marker spanning all rows */}
        <div
          className="absolute top-0 bottom-0 w-px bg-primary/70 z-10"
          style={{ left: `calc(148px + ${nowPct}% * (100% - 148px) / 100)` }}
          aria-hidden
        >
          <span className="absolute -top-0.5 left-1 text-[8px] font-semibold text-primary whitespace-nowrap">
            today
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {bars.map((b, i) => {
            const left = b.start === null ? 0 : pct(b.start)
            const right = b.end === null ? 100 : pct(b.end)
            const width = Math.max(1.5, right - left)
            const toneText =
              b.rule.tone === 'deny' || b.rule.tone === 'temporal'
                ? 'text-destructive'
                : b.rule.tone === 'hybrid'
                  ? 'text-status-success'
                  : 'text-status-warning'
            const toneBg =
              b.rule.tone === 'deny' || b.rule.tone === 'temporal'
                ? 'bg-destructive/30 border-destructive/60'
                : b.rule.tone === 'hybrid'
                  ? 'bg-status-success/30 border-status-success/60'
                  : 'bg-status-warning/30 border-status-warning/60'
            return (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <div className="w-[140px] shrink-0 truncate text-right">
                  <span className={`font-semibold ${toneText}`}>{b.rule.title}</span>{' '}
                  <span className="text-muted-foreground">
                    {b.rule.ops[0] ?? b.rule.algorithms[0] ?? ''}
                  </span>
                </div>
                <div className="relative h-3.5 flex-1 rounded bg-muted/40">
                  <div
                    className={`absolute top-0 bottom-0 rounded border ${toneBg} ${
                      b.oneSided ? 'rounded-r-none' : ''
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${b.rule.effectiveFrom ?? b.rule.after ?? 'always'} → ${b.rule.effectiveUntil ?? (b.oneSided ? 'onward' : 'always')}`}
                  />
                  {b.oneSided && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-destructive text-[9px]"
                      style={{ left: `calc(${right}% - 6px)` }}
                    >
                      ▸
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[9.5px] text-muted-foreground">
        Bars show when each time-bounded rule is in force; ▸ = one-sided (in force from that date
        onward). The vertical line is today.
      </p>
    </div>
  )
}
