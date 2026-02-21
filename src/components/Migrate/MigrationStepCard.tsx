import React from 'react'
import {
  ClipboardList,
  Target,
  Wrench,
  FlaskConical,
  ArrowRightLeft,
  Rocket,
  TrendingUp,
  AlertTriangle,
  ArrowDown,
  ScanSearch,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MigrationStep } from '../../types/MigrateTypes'
import { STEP_PHASE_COLORS } from '../../data/migrationWorkflowData'

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  ClipboardList,
  Target,
  Wrench,
  FlaskConical,
  ArrowRightLeft,
  Rocket,
  TrendingUp,
}

interface MigrationStepCardProps {
  step: MigrationStep
  onViewSoftware: (step: MigrationStep) => void
}

export const MigrationStepCard: React.FC<MigrationStepCardProps> = ({ step, onViewSoftware }) => {
  const IconComponent = ICON_MAP[step.icon]
  const phaseColor = STEP_PHASE_COLORS[step.id]

  return (
    <div className="glass-panel p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{
              backgroundColor: `hsl(var(--${phaseColor}) / 0.15)`,
              color: `hsl(var(--${phaseColor}))`,
            }}
          >
            {IconComponent && <IconComponent size={20} />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Step {step.stepNumber}: {step.title}
            </h3>
            <span className="text-xs text-muted-foreground">
              Est. duration: {step.estimatedDuration}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{step.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tasks */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Key Tasks</h4>
          <ul className="space-y-2.5">
            {step.tasks.map((task, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `hsl(var(--${phaseColor}))` }}
                />
                <div>
                  <span className="font-medium text-foreground">{task.title}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Framework Alignment + NSA Timeline */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Framework Alignment</h4>
            <div className="space-y-2">
              {step.frameworks.map((fw, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm bg-muted/20 rounded-md px-3 py-2"
                >
                  <span className="font-medium text-primary whitespace-nowrap">{fw.source}</span>
                  <span className="text-muted-foreground">{fw.mapping}</span>
                </div>
              ))}
            </div>
          </div>

          {step.nsaTimeline && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20">
              <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-warning">NSA CNSA 2.0 Deadline</span>
                <p className="text-xs text-muted-foreground mt-0.5">{step.nsaTimeline}</p>
              </div>
            </div>
          )}

          {step.relevantSoftwareCategories.length > 0 && (
            <button
              onClick={() => onViewSoftware(step)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-2 cursor-pointer"
            >
              <ArrowDown size={14} />
              View Related Software
            </button>
          )}

          {/* CBOM scanner deep-link — only on the Assessment step */}
          {step.id === 'assess' && (
            <Link
              to="/learn/crypto-agility"
              className="inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors mt-2"
            >
              <ScanSearch size={14} />
              Try interactive CBOM Scanner →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
