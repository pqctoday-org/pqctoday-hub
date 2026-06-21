// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle2, Circle, Flag } from 'lucide-react'
import type { PathProgress } from './learnRedesign.helpers'

/**
 * Compact SVG donut summarising path progress, with a legend for done / to-go /
 * checkpoints. Uses semantic tokens via currentColor + status utility classes so
 * it tracks the theme rather than hard-coded hex.
 */
export const ProgressDial = ({ progress }: { progress: PathProgress }) => {
  const { pct, doneModules, totalModules, checkpointsPassed, checkpointsTotal } = progress
  const r = 27
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  const toGo = Math.max(0, totalModules - doneModules)

  return (
    <div className="glass-panel w-full sm:w-[230px] shrink-0 p-4 flex items-center gap-4">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        className="shrink-0"
        role="img"
        aria-label={`${pct}% of your path complete`}
      >
        <circle cx="32" cy="32" r={r} fill="none" className="stroke-muted" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          className="stroke-primary transition-all"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 32 32)"
        />
        <text
          x="32"
          y="32"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-foreground text-[14px] font-bold"
        >
          {pct}%
        </text>
      </svg>
      <ul className="space-y-1.5 text-xs">
        <li className="flex items-center gap-1.5 text-status-success">
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>
            <span className="font-semibold text-foreground">{doneModules}</span> done
          </span>
        </li>
        <li className="flex items-center gap-1.5 text-primary">
          <Circle size={13} aria-hidden="true" />
          <span>
            <span className="font-semibold text-foreground">{toGo}</span> to go
          </span>
        </li>
        <li className="flex items-center gap-1.5 text-accent">
          <Flag size={13} aria-hidden="true" />
          <span>
            <span className="font-semibold text-foreground">
              {checkpointsPassed}/{checkpointsTotal}
            </span>{' '}
            checkpoints
          </span>
        </li>
      </ul>
    </div>
  )
}
