// SPDX-License-Identifier: GPL-3.0-only
/**
 * ExecutiveWalkthrough — "Board pack in 3 steps," shown once to first-time
 * executive visitors on /business, per design_handoff_2026_pages/
 * IMPLEMENTATION-PLAN-COMMAND-CENTER-2026-08-01.md §3.1 (user decision:
 * simple 3 steps, first-time use only). The six-zone strategic-plan map
 * stays the only view for every other visit — this is an additional
 * first-look shortcut, not a replacement.
 */
import { X, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { BUSINESS_TOOLS } from './businessToolsRegistry'
import { useCommandCenterOnboardingStore } from '@/store/useCommandCenterOnboardingStore'

// Real registry ids, verified against businessToolsRegistry.tsx — the design
// mockup's prose named these "board-deck / ROI-model / policy-draft," which
// don't exist; see the plan's §3.1 correction.
const WALKTHROUGH_TOOL_IDS = ['board-pitch', 'roi-calculator', 'policy-generator']

export function ExecutiveWalkthrough() {
  const dismiss = useCommandCenterOnboardingStore((s) => s.dismissExecWalkthrough)
  const steps = WALKTHROUGH_TOOL_IDS.map((id) => BUSINESS_TOOLS.find((t) => t.id === id)).filter(
    (t): t is (typeof BUSINESS_TOOLS)[number] => Boolean(t)
  )

  if (steps.length === 0) return null

  return (
    <div className="glass-panel p-5 md:p-6 mb-6 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={dismiss}
        aria-label="Dismiss walkthrough"
        className="absolute right-3 top-3 h-7 w-7 p-0"
      >
        <X size={14} />
      </Button>
      <h2 className="text-base font-bold text-foreground mb-1">Board pack in 3 steps</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-lg">
        The fastest path to a board-ready package — build these in order, or jump straight to the
        full zone map below.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((tool, i) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.id}
              to={`/business/tools/${tool.id}`}
              onClick={dismiss}
              className="glass-panel p-4 hover:border-primary/40 transition-colors group flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <Icon className="w-4 h-4 text-primary shrink-0" />
              </div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {tool.name}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
              <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
                Start <ArrowRight size={12} />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
