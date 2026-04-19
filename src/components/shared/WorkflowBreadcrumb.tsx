// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ClipboardCheck, FileBarChart, LayoutDashboard, ShieldCheck } from 'lucide-react'

export type WorkflowPhase = 'assess' | 'report' | 'business' | 'compliance'

interface Step {
  id: WorkflowPhase
  label: string
  path: string
  icon: typeof ClipboardCheck
}

const STEPS: readonly Step[] = [
  { id: 'assess', label: 'Assess', path: '/assess', icon: ClipboardCheck },
  { id: 'report', label: 'Report', path: '/report', icon: FileBarChart },
  { id: 'business', label: 'Command Center', path: '/business', icon: LayoutDashboard },
  { id: 'compliance', label: 'Comply', path: '/compliance', icon: ShieldCheck },
] as const

/**
 * Minimal workflow breadcrumb: Assess → Report → Business → Comply.
 * Highlights the current phase and exposes each step as a navigation link so
 * users can orient themselves inside the four-step readiness workflow.
 */
export function WorkflowBreadcrumb({ current }: { current: WorkflowPhase }) {
  return (
    <nav
      aria-label="PQC readiness workflow"
      className="mb-4 flex flex-wrap items-center gap-1 text-xs print:hidden"
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon
        const isCurrent = step.id === current
        return (
          <span key={step.id} className="flex items-center gap-1">
            {idx > 0 && <span className="text-muted-foreground/50 mx-0.5">›</span>}
            <Link
              to={step.path}
              aria-current={isCurrent ? 'step' : undefined}
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                isCurrent
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon size={12} />
              {step.label}
            </Link>
          </span>
        )
      })}
    </nav>
  )
}
