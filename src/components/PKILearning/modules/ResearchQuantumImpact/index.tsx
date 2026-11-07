// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState, type FC } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, BookOpen, Rocket, ClipboardCheck } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { RESEARCH_GUIDE_DATA } from './data'
import { RESEARCH_QUANTUM_EXERCISES } from './exercises'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Understand how the quantum threat impacts research data, academic publishing, and institutional infrastructure.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description:
      'Identify PQC knowledge areas from algorithm foundations to cross-disciplinary applications.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build a research action plan from data risk assessment to PQC publication and collaboration.',
    icon: Rocket,
  },
  {
    id: 'self-assessment',
    title: 'Step 4: Research Readiness',
    description:
      'Score your quantum risk exposure across nine research-specific criteria to prioritise protective actions.',
    icon: ClipboardCheck,
  },
]

function SelfAssessmentStep() {
  const items = RESEARCH_GUIDE_DATA.selfAssessment
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
        <h3 className="text-lg font-semibold text-foreground">Research Data Risk Checklist</h3>
        <p className="text-sm text-muted-foreground">
          Check every statement that applies to your research context. Your score reflects how much
          of your work is directly exposed to the quantum threat.
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
            ? 'Your research data carries significant quantum exposure. Prioritise data classification and ML-KEM migration for long-lived datasets now.'
            : pct >= 40
              ? 'Moderate exposure. Start with an HNDL risk assessment for your most sensitive datasets and review your HPC key infrastructure.'
              : 'Lower direct exposure. Monitor NIST standards adoption by your funding agencies and collaborative partners.'}
        </p>
      </div>
    </div>
  )
}

function ExercisesTab() {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Researcher Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned to these research-focused scenarios. Each one gives fictional
          inputs and the Hub pages to work with. Attempt it first, then open the check to compare
          your answer with the criteria and the worked reasoning.
        </p>
        <div className="space-y-4">
          {RESEARCH_QUANTUM_EXERCISES.map((exercise) => (
            <div key={exercise.title} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-xs text-muted-foreground italic">{exercise.audience}</p>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">Fictional inputs</p>
                <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-0.5">
                  {exercise.inputs.map((input) => (
                    <li key={input}>{input}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1">
                <p className="text-xs font-semibold text-foreground">Work with</p>
                <ul className="list-disc pl-5 text-xs space-y-0.5">
                  {exercise.resources.map((resource) => (
                    <li key={resource.to}>
                      <Link to={resource.to} className="text-primary hover:underline">
                        {resource.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-primary">
                  Check your answer
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      A correct answer contains
                    </p>
                    <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-0.5">
                      {exercise.checks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">Worked reasoning</p>
                    <p className="text-sm text-foreground/80">{exercise.workedCheck}</p>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ResearchQuantumImpactModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand how the quantum threat impacts research data, academic infrastructure, and emerging PQC research opportunities."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={<ExercisesTab />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={RESEARCH_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={RESEARCH_GUIDE_DATA} />
        case 2:
          return <RoleHowToAct key={`how-${configKey}`} data={RESEARCH_GUIDE_DATA} />
        case 3:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
