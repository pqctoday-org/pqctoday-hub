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
          ? 'bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-[0_0_10px_hsl(var(--success)/0.4)] border border-success/50'
          : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)] border border-primary/50',
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
