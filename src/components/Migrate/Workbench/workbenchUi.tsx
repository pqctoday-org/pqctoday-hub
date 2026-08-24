// SPDX-License-Identifier: GPL-3.0-only
// Small presentational helpers shared across the workbench. Semantic tokens only.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DecisionKey } from '@/data/migrationAssets'
import {
  CheckCircle2,
  Shuffle,
  RefreshCw,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Button, type ButtonProps } from '../../ui/button'
import { TONE_CLASS, type Tone } from '@/data/migrateToneClass'

export type { Tone }

/** tone → solid dot color (decision indicator). */
export const TONE_DOT: Record<Tone, string> = {
  success: 'bg-status-success',
  primary: 'bg-primary',
  info: 'bg-status-info',
  warning: 'bg-status-warning',
  destructive: 'bg-status-error',
  muted: 'bg-muted-foreground',
}

export function Pill({
  tone,
  icon: Icon,
  children,
  className = '',
  title,
}: {
  tone: Tone
  icon?: LucideIcon
  children: ReactNode
  className?: string
  /** Native tooltip text — e.g. the exact date behind a "Verified" badge. */
  title?: string
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]} ${className}`}
    >
      {Icon && <Icon size={11} aria-hidden />}
      {children}
    </span>
  )
}

export const DECISION_ICON: Record<DecisionKey, LucideIcon> = {
  dropin: CheckCircle2,
  hybrid: Shuffle,
  rekey: RefreshCw,
  roadmap: Clock,
  mitigate: AlertTriangle,
}

const ARM_MS = 3000

/** Arm-then-confirm destructive action: first click arms it (swapping to
 *  `confirmChildren` for a few seconds), second click within the window fires
 *  `onConfirm`. Cheaper than a dialog for low-stakes, reversible-by-redoing
 *  actions like clearing a plan. Auto-disarms if left untouched. */
export function ConfirmButton({
  children,
  confirmChildren,
  onConfirm,
  variant = 'ghost',
  confirmVariant = 'destructive',
  ...buttonProps
}: {
  children: ReactNode
  confirmChildren: ReactNode
  onConfirm: () => void
  confirmVariant?: ButtonProps['variant']
} & Omit<ButtonProps, 'onClick' | 'children'>) {
  const [armed, setArmed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return (
    <Button
      {...buttonProps}
      variant={armed ? confirmVariant : variant}
      onClick={() => {
        if (!armed) {
          setArmed(true)
          timerRef.current = setTimeout(() => setArmed(false), ARM_MS)
          return
        }
        if (timerRef.current) clearTimeout(timerRef.current)
        setArmed(false)
        onConfirm()
      }}
    >
      {armed ? confirmChildren : children}
    </Button>
  )
}
