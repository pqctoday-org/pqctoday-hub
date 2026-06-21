// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentsDrillBanner — shown on Explore only when filters arrived from a dashboard
 * (KPI / chart) click, so the drill-down handoff is obvious. Replaces the live
 * page's silent "set a filter, stay on Insights" dead-end.
 */
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PatentsDrillBannerProps {
  onClear: () => void
}

export function PatentsDrillBanner({ onClear }: PatentsDrillBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[12.5px]">
      <ArrowRight size={14} className="shrink-0 text-primary" aria-hidden="true" />
      <span className="text-foreground">
        Filtered from the <strong>dashboard</strong> — results are live below, no tab-hunting.
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={onClear}
        className="ml-auto h-auto px-2 py-1 text-[12px] text-primary"
      >
        Clear
      </Button>
    </div>
  )
}
