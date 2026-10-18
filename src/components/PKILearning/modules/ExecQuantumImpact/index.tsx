// SPDX-License-Identifier: AGPL-3.0-only
import { useState, type FC } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BookOpen, Rocket, ClipboardCheck } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { EXEC_GUIDE_DATA } from './data'
import { EXEC_QUANTUM_EXERCISES } from './exercises'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Assess how the quantum threat impacts executive decision-making, governance, and organizational risk.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description:
      'Identify knowledge gaps and build a personalized executive learning path for PQC readiness.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build a phased action plan with concrete milestones from this week through six months.',
    icon: Rocket,
  },
  {
    id: 'self-assessment',
    title: 'Step 4: Organisational Evidence Scope',
    description:
      'Identify applicable decision drivers and unanswered evidence questions without turning an incomplete checklist into a risk score.',
    icon: ClipboardCheck,
  },
]

export function SelfAssessmentStep() {
  const items = EXEC_GUIDE_DATA.selfAssessment
  type Answer = 'yes' | 'no' | 'unknown'
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const answered = Object.keys(answers).length
  const applicable = items.filter((item) => answers[item.id] === 'yes')
  const unknownCount =
    items.filter((item) => answers[item.id] === 'unknown').length + (items.length - answered)
  const completionPct = Math.round((answered / items.length) * 100)

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Organisational Evidence Scope</h3>
        <p className="text-sm text-muted-foreground">
          Answer every question with Yes, No, or Unknown. This educational checklist identifies
          decision drivers and evidence requests; it is not a risk score or audit.
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <fieldset key={item.id} className="glass-panel p-3 space-y-2">
              <legend className="text-sm text-foreground leading-snug">{item.label}</legend>
              <div className="flex flex-wrap gap-2">
                {(['yes', 'no', 'unknown'] as const).map((answer) => (
                  <Button
                    key={answer}
                    type="button"
                    size="sm"
                    variant={answers[item.id] === answer ? 'default' : 'outline'}
                    aria-pressed={answers[item.id] === answer}
                    onClick={() => setAnswers((current) => ({ ...current, [item.id]: answer }))}
                    className="capitalize"
                  >
                    {answer}
                  </Button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Evidence scope completed</span>
          <span className="text-lg font-bold text-primary">
            {answered}/{items.length}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-primary"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
          {answered === 0 ? (
            <p>No conclusion is shown until you answer. Unanswered never means low exposure.</p>
          ) : (
            <>
              <p>
                <strong className="text-foreground">Applicable drivers:</strong> {applicable.length}
              </p>
              <p>
                <strong className="text-foreground">Questions requiring evidence:</strong>{' '}
                {unknownCount}
              </p>
              <p>
                Ask accountable teams to validate every Yes or Unknown before using it in a board
                decision or KPI.
              </p>
            </>
          )}
        </div>
        <Link
          to="/business/tools/kpi-dashboard"
          className="mt-2 inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Build the executive measurement pack
        </Link>
      </div>
    </div>
  )
}

function ExercisesTab() {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Executive Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these executive-level scenarios.
        </p>
        <div className="space-y-4">
          {EXEC_QUANTUM_EXERCISES.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use all four workshop steps. Classify claims by authority, record Unknown where
                  evidence is missing, and carry only verified organizational measurements into the
                  KPI Dashboard.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ExecQuantumImpactModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand the quantum threat from an executive and governance perspective — why it matters, what to learn, and how to act."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={<ExercisesTab />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={EXEC_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={EXEC_GUIDE_DATA} />
        case 2:
          return <RoleHowToAct key={`how-${configKey}`} data={EXEC_GUIDE_DATA} />
        case 3:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
