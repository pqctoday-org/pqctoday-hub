// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useEffect, type FC } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  BookOpen,
  Rocket,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Introduction } from './components/Introduction'
import { CERT_GUIDE_DATA } from './data'
import { CERT_QUANTUM_EXERCISES } from './exercises'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { useModuleStore } from '@/store/useModuleStore'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Examine six PQC impacts on FIPS 140-3, ACVP, ESV, EUCC, NIAP Policy #33, and PCI validation workflows.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description:
      'Identify validation skill gaps and build a targeted certification engineering learning path.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build a phased validation-readiness plan from immediate certificate audits through six-month lifecycle tracking.',
    icon: Rocket,
  },
  {
    id: 'self-assessment',
    title: 'Step 4: Certification Evidence Scope',
    description:
      'Identify applicable validation drivers and missing evidence without turning an incomplete checklist into a low-exposure score.',
    icon: ClipboardCheck,
  },
]

export function SelfAssessmentStep() {
  const items = CERT_GUIDE_DATA.selfAssessment
  type Answer = 'yes' | 'no' | 'unknown'
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const markStepComplete = useModuleStore((s) => s.markStepComplete)
  const answered = Object.keys(answers).length
  const applicable = items.filter((item) => answers[item.id] === 'yes')
  const unknownItems = items.filter((item) => !answers[item.id] || answers[item.id] === 'unknown')
  const unknownCount = unknownItems.length
  const completionPct = Math.round((answered / items.length) * 100)

  useEffect(() => {
    if (answered === items.length && items.length > 0) {
      markStepComplete(manifest.id, 'self-assessment')
    }
  }, [answered, items.length, markStepComplete])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Certification Evidence Scope</h3>
        <p className="text-sm text-muted-foreground">
          Answer every question with Yes, No, or Unknown. This educational checklist surfaces
          applicable validation drivers and missing evidence; it is not a formal CSTL/ITSEF audit or
          certification decision.
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
            <div className="space-y-3">
              <div>
                <p>
                  <strong className="text-foreground">Applicable drivers:</strong>{' '}
                  {applicable.length}
                </p>
                {applicable.length > 0 && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-foreground/80">
                    {applicable.map((item) => (
                      <li key={item.id}>{item.label}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p>
                  <strong className="text-foreground">Questions requiring evidence:</strong>{' '}
                  {unknownCount}
                </p>
                {unknownItems.length > 0 && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-foreground/80">
                    {unknownItems.map((item) => (
                      <li key={item.id}>
                        {item.label}{' '}
                        <span className="text-muted-foreground">
                          ({answers[item.id] === 'unknown' ? 'Marked Unknown' : 'Unanswered'})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p>
                Verify every Yes or Unknown against primary CMVP, ACVP, ESV, EUCC, NIAP, or PCI SSC
                registry records before locking submission schedules or procurement sign-offs.
              </p>
            </div>
          )}
        </div>
        <Link
          to="/learn/crypto-product-certification"
          className="mt-2 inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Explore the Cryptographic Product Certification guide
        </Link>
      </div>
    </div>
  )
}

function ExercisesTab({ onGoToWorkshop }: { onGoToWorkshop: (step?: number) => void }) {
  const [openRubrics, setOpenRubrics] = useState<Set<number>>(() => new Set())

  const toggleRubric = (idx: number) => {
    setOpenRubrics((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Certification Engineering Exercises
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply the workshop framework to three validation-engineering scenarios. Open the decision
          checklist on each scenario to verify your scoping against CMVP, ACVP, ESV, EUCC, NIAP, and
          PCI evidence rules.
        </p>
        <div className="space-y-4">
          {CERT_QUANTUM_EXERCISES.map((exercise, idx) => {
            const isOpen = openRubrics.has(idx)
            return (
              <div key={idx} className="glass-panel p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToWorkshop(exercise.workshopStepIndex)}
                  >
                    Open {exercise.workshopStepLabel} &rarr;
                  </Button>
                </div>
                <p className="text-sm text-foreground/80">{exercise.prompt}</p>
                <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground italic">
                      Separate algorithm validation from module validation, mark unverified scope as
                      Unknown, and check primary registry records before sign-off.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRubric(idx)}
                      className="shrink-0 text-xs"
                    >
                      {isOpen ? (
                        <>
                          Hide decision checklist <ChevronUp size={14} className="ml-1" />
                        </>
                      ) : (
                        <>
                          Show decision checklist <ChevronDown size={14} className="ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                  {isOpen && (
                    <ul className="list-disc list-inside space-y-1.5 pt-2 border-t border-border text-xs text-foreground/90">
                      {exercise.decisionChecklist.map((point, pointIdx) => (
                        <li key={pointIdx}>{point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const CertQuantumImpactModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand how post-quantum cryptography transforms cryptographic module validation — why it matters, what to learn, and how to act."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <ExercisesTab onGoToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={CERT_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={CERT_GUIDE_DATA} />
        case 2:
          return (
            <RoleHowToAct moduleId={manifest.id} key={`how-${configKey}`} data={CERT_GUIDE_DATA} />
          )
        case 3:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
