// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState, type FC } from 'react'
import { AlertTriangle, BookOpen, Rocket, ClipboardCheck } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { DEV_GUIDE_DATA } from './data'
import { DEV_QUANTUM_EXERCISES } from './exercises'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Understand how the quantum threat impacts the code you write, the libraries you use, and the protocols you integrate.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description: 'Identify the PQC skills and knowledge gaps that developers need to close.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build a practical action plan from auditing your crypto usage to deploying hybrid TLS.',
    icon: Rocket,
  },
  {
    id: 'self-assessment',
    title: 'Step 4: Skill Self-Assessment',
    description:
      'Score your current PQC readiness across nine developer competencies to identify where to focus first.',
    icon: ClipboardCheck,
  },
]

function SelfAssessmentStep() {
  const items = DEV_GUIDE_DATA.selfAssessment
  const maxScore = items.reduce((sum, item) => sum + item.weight, 0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const score = items.reduce((sum, item) => sum + (checked[item.id] ? item.weight : 0), 0)
  const pct = Math.round((score / maxScore) * 100)

  const band =
    pct >= 70
      ? { label: 'High Exposure', color: 'text-status-error' }
      : pct >= 40
        ? { label: 'Moderate Exposure', color: 'text-status-warning' }
        : { label: 'Low Exposure', color: 'text-status-success' }

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Developer PQC Exposure Checklist</h3>
        <p className="text-sm text-muted-foreground">
          Check every statement that applies to your current work. Your score reflects how much of
          your codebase is directly at risk from the quantum transition.
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only"
                checked={!!checked[item.id]}
                onChange={() => toggle(item.id)}
              />
              <div
                aria-hidden="true"
                className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${checked[item.id] ? 'border-primary bg-primary' : 'border-border bg-background group-hover:border-primary/60'}`}
              >
                {checked[item.id] && (
                  <svg className="w-3 h-3 text-background" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-foreground leading-snug">{item.label}</span>
              <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                +{item.weight}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Your exposure score</span>
          <span className={`text-lg font-bold ${band.color}`}>
            {score}/{maxScore} — {band.label}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 70 ? 'bg-status-error' : pct >= 40 ? 'bg-status-warning' : 'bg-status-success'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {pct >= 70
            ? 'Your codebase has significant PQC exposure. Prioritize crypto inventory and abstraction layer work now.'
            : pct >= 40
              ? 'Moderate exposure. Start with a crypto inventory and schedule a hybrid TLS pilot.'
              : 'Low direct exposure. Review your dependencies and monitor library PQC roadmaps.'}
        </p>
      </div>
    </div>
  )
}

function ExercisesTab() {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Developer Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these developer-focused scenarios.
        </p>
        <div className="space-y-4">
          {DEV_QUANTUM_EXERCISES.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use the Why It Matters (Step 1), What to Learn (Step 2), and How to Act (Step 3)
                  tools in the Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const DevQuantumImpactModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand how the quantum threat impacts your code, libraries, and protocols — and what to do about it."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={<ExercisesTab />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={DEV_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={DEV_GUIDE_DATA} />
        case 2:
          return <RoleHowToAct key={`how-${configKey}`} data={DEV_GUIDE_DATA} />
        case 3:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
