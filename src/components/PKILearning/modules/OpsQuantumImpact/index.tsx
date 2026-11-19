// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState, type FC } from 'react'
import { AlertTriangle, BookOpen, Rocket, ClipboardCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Introduction } from './components/Introduction'
import { OPS_GUIDE_DATA } from './data'
import { OPS_QUANTUM_EXERCISES } from './exercises'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Understand how the quantum threat impacts certificate operations, VPN/SSH infrastructure, and deployment pipelines.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description:
      'Identify operational skills needed for PQC certificate management, network protocol migration, and monitoring.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build an operational action plan from infrastructure inventory to pilot migration execution.',
    icon: Rocket,
  },
  {
    id: 'self-assessment',
    title: 'Step 4: Ops Readiness',
    description:
      'Score your operational exposure across nine criteria to identify which infrastructure areas need the most urgent attention.',
    icon: ClipboardCheck,
  },
]

function SelfAssessmentStep() {
  const items = OPS_GUIDE_DATA.selfAssessment
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
        <h3 className="text-lg font-semibold text-foreground">
          Operational Infrastructure Exposure Checklist
        </h3>
        <p className="text-sm text-muted-foreground">
          Check every statement that applies to your operational environment. Your score reflects
          how much of your infrastructure is directly in the path of PQC migration work.
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
            ? 'High operational exposure. Start with a certificate inventory and automate any remaining manual renewal processes before migrating algorithms.'
            : pct >= 40
              ? 'Moderate exposure. Prioritise building PQC operational playbooks and identifying which CA and VPN vendors have published migration timelines.'
              : 'Lower direct exposure. Review your monitoring baselines now so you have a clean pre-migration benchmark when the time comes.'}
        </p>
      </div>
    </div>
  )
}

function ExercisesTab({ onOpenWorkshopStep }: { onOpenWorkshopStep: (step: number) => void }) {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Ops Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these operations-focused scenarios. Each
          exercise includes a concise decision checklist for what to verify in your own production
          tools.
        </p>
        <div className="space-y-4">
          {OPS_QUANTUM_EXERCISES.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenWorkshopStep(exercise.recommendedStep)}
                  className="shrink-0"
                >
                  {exercise.recommendedStepLabel}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
                <p className="text-xs font-semibold text-foreground">
                  Operational decision checklist
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                  {exercise.decisionChecklist.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const OpsQuantumImpactModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand how the quantum threat impacts IT operations — certificates, VPN/SSH, monitoring, and deployment pipelines."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <ExercisesTab onOpenWorkshopStep={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={OPS_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={OPS_GUIDE_DATA} />
        case 2:
          return (
            <RoleHowToAct moduleId={manifest.id} key={`how-${configKey}`} data={OPS_GUIDE_DATA} />
          )
        case 3:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
