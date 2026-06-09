// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import type { PatentItem } from '@/types/PatentTypes'

interface YearBucket {
  year: number
  count: number
}

/**
 * Compact donut showing the patent count per (priority) year, with the running
 * total in the centre. Hovering or focusing the donut reveals a per-year
 * breakdown. Designed to sit inline in the page header in place of a bare
 * "N patents" count.
 *
 * Slices use a single-hue (primary) ramp ordered by year — older years are more
 * transparent, the newest is full strength — so the wedge reads as a time
 * sweep. Exact figures come from the tooltip, so colour distinguishability of
 * individual years is secondary.
 */
export function PatentsYearDonut({
  patents,
  size = 44,
  ring = 7,
}: {
  patents: PatentItem[]
  size?: number
  ring?: number
}) {
  const { buckets, total } = useMemo(() => {
    const counts = new Map<number, number>()
    for (const p of patents) {
      const y = p.priorityYear || 0
      if (y > 0) counts.set(y, (counts.get(y) ?? 0) + 1)
    }
    const buckets: YearBucket[] = Array.from(counts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)
    return { buckets, total: buckets.reduce((s, b) => s + b.count, 0) }
  }, [patents])

  // Opacity ramp: oldest year faintest (0.35), newest full strength.
  const colorFor = (index: number): string => {
    const opacity = buckets.length <= 1 ? 1 : 0.35 + (0.65 * index) / (buckets.length - 1)
    return `hsl(var(--primary) / ${opacity.toFixed(3)})`
  }

  const conic = useMemo(() => {
    if (total === 0) return 'hsl(var(--muted))'
    let acc = 0
    const stops = buckets.map((b, i) => {
      const start = (acc / total) * 100
      acc += b.count
      const end = (acc / total) * 100
      return `${colorFor(i)} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    })
    return `conic-gradient(${stops.join(', ')})`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, total])

  if (total === 0) return null

  const maxCount = Math.max(...buckets.map((b) => b.count))
  const ariaLabel = `Patents by priority year. Total ${total}. ${buckets
    .map((b) => `${b.year}: ${b.count}`)
    .join(', ')}.`

  return (
    <span className="group relative inline-flex items-center">
      {/* role=img + aria-label carries the full per-year breakdown for screen
          readers; the hover tooltip is a pointer-only visual enhancement. */}
      <span
        role="img"
        aria-label={ariaLabel}
        className="relative block shrink-0 rounded-full"
        style={{ width: size, height: size, background: conic }}
      >
        {/* Donut hole with the running total */}
        <span
          className="absolute flex items-center justify-center rounded-full bg-card"
          style={{ inset: ring }}
        >
          <span className="text-[11px] font-semibold leading-none text-foreground">
            {total.toLocaleString()}
          </span>
        </span>
      </span>

      {/* Per-year breakdown — shown on hover/focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 group-hover:block"
      >
        <span className="block w-max rounded-lg border border-border bg-popover p-3 text-left shadow-xl">
          <span className="mb-2 block text-[11px] font-medium normal-case text-muted-foreground">
            Patents by priority year
          </span>
          <span className="flex flex-col gap-1">
            {buckets
              .map((b, i) => ({ ...b, i }))
              .slice()
              .reverse()
              .map((b) => (
                <span key={b.year} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: colorFor(b.i) }}
                  />
                  <span className="w-9 tabular-nums text-muted-foreground">{b.year}</span>
                  <span
                    className="h-2 rounded-sm"
                    style={{
                      width: `${Math.max(6, (b.count / maxCount) * 64)}px`,
                      background: colorFor(b.i),
                    }}
                  />
                  <span className="w-8 text-right font-semibold tabular-nums text-foreground">
                    {b.count}
                  </span>
                </span>
              ))}
          </span>
        </span>
      </span>
    </span>
  )
}
