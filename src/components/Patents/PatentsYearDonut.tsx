// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import type { PatentItem } from '@/types/PatentTypes'

interface Segment {
  label: string
  count: number
  color: string
}

// Undated patents (no priority year) get their own muted slice so the centre
// total always equals the full patent count shown in the header — nothing is
// silently dropped.
const UNKNOWN_COLOR = 'hsl(var(--muted-foreground) / 0.45)'

/**
 * Compact donut showing the patent count per (priority) year, with the running
 * total in the centre. Hovering reveals a per-year breakdown. Designed to sit
 * inline in the page header in place of a bare "N patents" count.
 *
 * Year slices use a single-hue (primary) ramp ordered by year — older years are
 * more transparent, the newest is full strength — so the wedge reads as a time
 * sweep. Patents with no priority year are collected into a muted "Unknown"
 * slice; the centre total counts every patent so it matches the header.
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
  const { segments, total, conic } = useMemo(() => {
    const counts = new Map<number, number>()
    let unknown = 0
    for (const p of patents) {
      const y = p.priorityYear || 0
      if (y > 0) counts.set(y, (counts.get(y) ?? 0) + 1)
      else unknown++
    }
    const years = Array.from(counts.keys()).sort((a, b) => a - b)
    const rampColor = (i: number): string => {
      const opacity = years.length <= 1 ? 1 : 0.4 + (0.6 * i) / (years.length - 1)
      return `hsl(var(--primary) / ${opacity.toFixed(3)})`
    }
    const yearSegments: Segment[] = years.map((y, i) => ({
      label: String(y),
      count: counts.get(y) as number,
      color: rampColor(i),
    }))
    const segments: Segment[] =
      unknown > 0
        ? [...yearSegments, { label: 'Unknown', count: unknown, color: UNKNOWN_COLOR }]
        : yearSegments
    const total = patents.length
    // Cumulative percentages via reduce (no render-time mutation), matching the
    // pattern in PatentsInsights' DonutChart.
    const cumulative = segments.reduce<number[]>((acc, s) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0
      return [...acc, prev + s.count]
    }, [])
    const stops = segments.map((s, i) => {
      const start = total > 0 ? ((cumulative[i] - s.count) / total) * 100 : 0
      const end = total > 0 ? (cumulative[i] / total) * 100 : 0
      return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    })
    const conic = `conic-gradient(${stops.join(', ')})`
    return { segments, total, conic }
  }, [patents])

  if (total === 0) return null

  const maxCount = Math.max(1, ...segments.map((s) => s.count))
  // Display order: years newest-first, then Unknown last.
  const ordered = [
    ...segments.filter((s) => s.label !== 'Unknown').reverse(),
    ...segments.filter((s) => s.label === 'Unknown'),
  ]
  const ariaLabel = `Patents by priority year. Total ${total}. ${ordered
    .map((s) => `${s.label}: ${s.count}`)
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
            {ordered.map((s) => (
              <span key={s.label} className="flex items-center gap-2 text-[11px]">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: s.color }}
                />
                <span className="w-14 tabular-nums text-muted-foreground">{s.label}</span>
                <span
                  className="h-2 rounded-sm"
                  style={{
                    width: `${Math.max(6, (s.count / maxCount) * 64)}px`,
                    background: s.color,
                  }}
                />
                <span className="w-8 text-right font-semibold tabular-nums text-foreground">
                  {s.count}
                </span>
              </span>
            ))}
          </span>
        </span>
      </span>
    </span>
  )
}
