// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'

export type StatusType = 'New' | 'Updated' | undefined

interface StatusBadgeProps {
  status: StatusType
  className?: string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  if (!status) return null

  const isNew = status === 'New'

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-bold rounded-full select-none animate-in fade-in zoom-in duration-300',
        isNew
          ? 'bg-success text-success-foreground shadow-[0_0_8px_hsl(var(--success)/0.35)] border border-success/60'
          : 'bg-primary text-primary-foreground shadow-[0_0_8px_hsl(var(--primary)/0.35)] border border-primary/60',
        size === 'sm'
          ? 'text-[10px] px-1.5 py-0.5 min-w-[32px]'
          : 'text-xs px-2 py-0.5 min-w-[40px]',
        className
      )}
    >
      {status}
    </span>
  )
}
