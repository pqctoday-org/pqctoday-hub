// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable no-restricted-syntax -- these are the Storybook Blue button primitives: the styled replacement for ui/button.tsx's variants, so they render the raw <button> themselves */
import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { chipVariants, statusToneClass, statusWord, type StatusKind } from './variants'

export interface ChipProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Interactive chips are buttons with the 2px ink outline; static chips are plain labels. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** For interactive chips: the pressed (selected) state. */
  pressed?: boolean
}

/** Chip and kind chip. Static unless `onClick` is given. */
export function Chip({ onClick, pressed, className, children, ...props }: ChipProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed === undefined ? undefined : pressed}
        className={cn(chipVariants({ interactive: true }), className)}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    )
  }
  return (
    <span className={cn(chipVariants({ interactive: false }), className)} {...props}>
      {children}
    </span>
  )
}

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusKind
  /** Replaces the default word for the status (for example "Changed since 12 Nov"). */
  label?: string
}

/** Status chip: a chip whose status word is always present, so colour never carries it alone. */
export function StatusChip({ status, label, className, ...props }: StatusChipProps) {
  return (
    <span
      data-status={status}
      className={cn(
        chipVariants({ interactive: false }),
        statusToneClass[status],
        // Highlight statuses also take the highlight border; the others stay unbordered like static chips.
        status === 'in-focus' || status === 'now' ? 'border border-highlight-border' : '',
        className
      )}
      {...props}
    >
      {status === 'completed' && <Check size={12} aria-hidden="true" />}
      {label ?? statusWord[status]}
    </span>
  )
}
