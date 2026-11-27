// SPDX-License-Identifier: AGPL-3.0-only
import { cn } from '@/lib/utils'
import { formatDate, type DateInput } from '@/lib/format'
import {
  chipRowViolation,
  chipWordSpec,
  type ChipBorder,
  type ChipFamily,
  type ChipSpec,
  type ChipTone,
} from './chipRegistry'

/** Tailwind needs whole class names, so each tone lists its three. */
const TONE_CLASS: Record<ChipTone, string> = {
  critical: 'bg-chip-critical-bg text-chip-critical-fg border-chip-critical-border',
  high: 'bg-chip-high-bg text-chip-high-fg border-chip-high-border',
  medium: 'bg-chip-medium-bg text-chip-medium-fg border-chip-medium-border',
  low: 'bg-chip-low-bg text-chip-low-fg border-chip-low-border',
  ok: 'bg-chip-ok-bg text-chip-ok-fg border-chip-ok-border',
  warn: 'bg-chip-warn-bg text-chip-warn-fg border-chip-warn-border',
  mute: 'bg-chip-mute-bg text-chip-mute-fg border-chip-mute-border',
  info: 'bg-chip-info-bg text-chip-info-fg border-chip-info-border',
  neutral: 'bg-chip-neutral-bg text-chip-neutral-fg border-chip-neutral-border',
}

const BORDER_CLASS: Record<ChipBorder, string> = {
  solid: '',
  highlight: 'border-highlight-border',
  dashed: 'border-dashed',
}

export type ChipProps = ChipSpec & {
  /** "Confidence 84": the number the Source family's Confidence chip shows. */
  value?: number
  /** "Verified 18 Nov 2026": the date the Freshness family's Verified chip shows. */
  date?: DateInput
  /** "Seeded from your assessment": what the Origin family's Seeded chip names. */
  from?: string
  className?: string
}

/** What the chip says: the word, plus a value, a date or a named source where the word takes one. */
export function chipLabel(
  p: Pick<ChipProps, 'family' | 'word' | 'value' | 'date' | 'from'>
): string {
  if (p.family === 'source' && p.word === 'Confidence' && p.value !== undefined)
    return `Confidence ${p.value}`
  if (p.family === 'freshness' && p.word === 'Verified' && p.date !== undefined)
    return `Verified ${formatDate(p.date, 'day')}`
  if (p.family === 'origin' && p.word === 'Seeded' && p.from) return `Seeded from ${p.from}`
  return p.word
}

/**
 * The one chip: a pill, 11 px, Nunito 800, a 1.5 px border, the word always visible. The family
 * and word come from the registry (chipRegistry.ts); a word the family does not hold renders
 * nothing and fails the type check.
 */
export function Chip(props: ChipProps) {
  const { family, word, className } = props
  const spec = chipWordSpec(family, word)
  if (!spec) return null
  return (
    <span
      data-chip-family={family}
      data-chip-tone={spec.tone}
      className={cn(
        'type-chip inline-flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-1 whitespace-nowrap',
        TONE_CLASS[spec.tone],
        BORDER_CLASS[spec.border ?? 'solid'],
        className
      )}
    >
      {spec.glyph && <span aria-hidden="true">{spec.glyph}</span>}
      {chipLabel(props)}
    </span>
  )
}

/**
 * A row of chips. Source (record provenance) and Evidence (a user's claim) never share a row:
 * that throws in development and tests, and drops the Evidence chip in production.
 */
export function ChipRow({
  chips,
  className,
  label,
}: {
  chips: ChipProps[]
  className?: string
  /** Names the group for assistive technology, e.g. "Status". */
  label?: string
}) {
  const violation = chipRowViolation(chips)
  if (violation && import.meta.env.DEV) throw new Error(violation)
  const shown = violation ? chips.filter((c) => c.family !== ('evidence' as ChipFamily)) : chips
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      {shown.map((c, i) => (
        <Chip key={`${c.family}:${c.word}:${i}`} {...c} />
      ))}
    </div>
  )
}
