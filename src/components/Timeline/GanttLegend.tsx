import { Flag } from 'lucide-react'
import { phaseColors, type Phase } from '../../data/timelineData'

interface GanttLegendProps {
  className?: string
}

export const GanttLegend = ({ className = '' }: GanttLegendProps) => {
  const phases: Phase[] = [
    'Discovery',
    'Testing',
    'POC',
    'Migration',
    'Standardization',
    'Guidance',
    'Policy',
    'Regulation',
    'Research',
    'Deadline',
  ]

  return (
    <div className={`glass-panel p-4 ${className}`}>
      <h3 className="text-sm font-bold text-foreground mb-4 border-b border-border pb-2">
        Phase Color Code
      </h3>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              {phases.map((phase) => {
                // eslint-disable-next-line security/detect-object-injection
                const colors = phaseColors[phase]
                return (
                  <td
                    key={phase}
                    className="p-3 text-center border-r border-border last:border-r-0 transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
                      boxShadow: `inset 0 0 10px ${colors.glow}`,
                    }}
                  >
                    <span className="text-xs font-bold text-foreground drop-shadow-md">
                      {phase}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Flag className="w-4 h-4 text-primary fill-primary" />
            <Flag className="w-4 h-4 text-secondary fill-secondary" />
          </div>
          <span className="text-xs text-muted-foreground">
            <strong>Milestones:</strong> Flag markers indicate key events, colored according to
            their phase.
          </span>
        </div>
      </div>
    </div>
  )
}
