// SPDX-License-Identifier: GPL-3.0-only
import React, { useId, useState, useContext, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './button'
import clsx from 'clsx'
import { SectionExpandContext } from '@/contexts/sectionExpandContext'

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  infoTip,
  className,
  headerExtra,
  id,
  targetId,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  infoTip?: React.ReactNode
  className?: string
  headerExtra?: React.ReactNode
  id?: string
  /**
   * Stable workshop selector slug. When provided, the toggle button gets
   * `data-workshop-target="section-<targetId>"` so workshop cues
   * (`expand-section` / `collapse-section`) can target it reliably.
   */
  targetId?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  const { expandToken, collapseToken } = useContext(SectionExpandContext)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (expandToken > 0) setOpen(true)
  }, [expandToken])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (collapseToken > 0) setOpen(false)
  }, [collapseToken])

  return (
    <div id={id} className={clsx('glass-panel p-6 print:border print:border-border', className)}>
      <div className="flex items-center justify-between w-full print:hidden gap-2">
        <Button
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 h-auto items-center justify-between p-2"
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={title}
          {...(targetId ? { 'data-workshop-target': `section-${targetId}` } : {})}
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {icon}
            {title}
          </div>
          <div className="flex items-center gap-2">
            <ChevronDown
              size={18}
              className={clsx(
                'text-muted-foreground transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </div>
        </Button>
        <div className="shrink-0 flex items-center gap-2">
          {headerExtra}
          {infoTip}
        </div>
      </div>
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
