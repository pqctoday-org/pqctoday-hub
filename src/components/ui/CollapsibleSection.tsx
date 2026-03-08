// SPDX-License-Identifier: GPL-3.0-only
import React, { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import clsx from 'clsx'

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  infoTip,
  className,
  headerExtra,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  infoTip?: React.ReactNode
  className?: string
  headerExtra?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  return (
    <div className={clsx('glass-panel p-6 print:border print:border-border', className)}>
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full h-auto items-center justify-between print:hidden"
        aria-expanded={open}
        aria-controls={contentId}
        aria-label={title}
      >
        <div className="flex items-center gap-2 font-semibold text-foreground">
          {icon}
          {title}
          {infoTip}
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <ChevronDown
            size={18}
            className={clsx(
              'text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </div>
      </Button>
      {/* Print-only static title (no button/chevron) */}
      <div className="hidden print:flex items-center gap-2 font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <div id={contentId} className={clsx('mt-4', !open && 'hidden print:block')}>
        {children}
      </div>
    </div>
  )
}
