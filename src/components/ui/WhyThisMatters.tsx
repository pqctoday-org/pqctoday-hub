// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface WhyThisMattersProps {
  title?: string
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: 'info' | 'warning' | 'highlight'
  className?: string
}

const VARIANT_STYLES = {
  info: 'bg-status-info/10 border-status-info/30 text-status-info',
  warning: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
  highlight: 'bg-primary/10 border-primary/30 text-primary',
}

export const WhyThisMatters = ({
  title = 'Why This Matters',
  children,
  defaultOpen = false,
  variant = 'info',
  className,
}: WhyThisMattersProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('rounded-lg border p-3', VARIANT_STYLES[variant], className)}>
      <Button
        type="button"
        variant="ghost"
        className="flex w-full items-center gap-2 text-left h-auto p-0 hover:bg-transparent"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Info size={14} className="shrink-0" />
        <span className="flex-1 text-xs font-semibold">{title}</span>
        {open ? (
          <ChevronUp size={14} className="shrink-0" />
        ) : (
          <ChevronDown size={14} className="shrink-0" />
        )}
      </Button>
      {open && (
        <div className="mt-2 text-xs text-muted-foreground leading-relaxed space-y-1.5 text-left">
          {children}
        </div>
      )}
    </div>
  )
}
