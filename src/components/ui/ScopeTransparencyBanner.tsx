// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { CheckCircle2, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ScopeTransparencyBannerProps {
  realOps: string[]
  simulatedOps: string[]
  className?: string
}

export const ScopeTransparencyBanner = ({
  realOps,
  simulatedOps,
  className,
}: ScopeTransparencyBannerProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-3', className)}>
      <Button
        type="button"
        variant="ghost"
        className="flex w-full items-center gap-2 text-left h-auto p-0 hover:bg-transparent"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <FlaskConical size={14} className="shrink-0 text-muted-foreground" />
        <span className="flex-1 text-xs font-semibold text-foreground">
          What runs live vs. simulated?
        </span>
        {open ? (
          <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        )}
      </Button>
      {open && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-status-success">
              Live WASM / PKCS#11
            </p>
            <ul className="space-y-1">
              {realOps.map((op) => (
                <li key={op} className="flex items-start gap-1.5 text-xs text-foreground">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-status-success" />
                  {op}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Simulated / Illustrative
            </p>
            <ul className="space-y-1">
              {simulatedOps.map((op) => (
                <li key={op} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <FlaskConical size={12} className="mt-0.5 shrink-0" />
                  {op}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
