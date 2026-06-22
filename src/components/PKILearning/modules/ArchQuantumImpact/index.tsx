// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState, type FC } from 'react'
import { AlertTriangle, BookOpen, Rocket, ClipboardCheck, GitMerge } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { StranglerFigArchitect } from './components/StranglerFigArchitect'
import { ARCH_GUIDE_DATA } from './data'
import { ARCH_QUANTUM_EXERCISES } from './exercises'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Understand how the quantum threat impacts architecture decisions, key management, and infrastructure design.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description: 'Identify architecture and design skills needed for quantum-safe systems.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build an architecture action plan from crypto mapping to reference architecture delivery.',
    icon: Rocket,
  },
  {
    id: 'self-assessment',
    title: 'Step 4: Architecture Readiness',
    description:
      'Score your architecture exposure across nine criteria to identify which systems need crypto-agility work first.',
    icon: ClipboardCheck,
  },
  {
    id: 'strangler-fig',
    title: 'Step 5: Strangler Fig',
    description:
      'Model the gradual migration of a legacy monolithic service using a PQC API Gateway.',
    icon: GitMerge,
  },
]

function SelfAssessmentStep() {
  const items = ARCH_GUIDE_DATA.selfAssessment
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
          Architecture Crypto Exposure Checklist
        </h3>
        <p className="text-sm text-muted-foreground">
          Check every statement that applies to your architecture. Your score reflects how much
          rework PQC migration will require across your systems.
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
            ? 'High architectural exposure. Prioritise adding a cryptographic abstraction layer and auditing your PKI and KMS designs now.'
            : pct >= 40
              ? 'Moderate exposure. Focus on identifying which system boundaries carry the most cryptographic coupling.'
              : 'Lower direct exposure. Review your dependency graph for transitive crypto assumptions and document current choices as ADRs.'}
        </p>
      </div>
    </div>
  )
}

function ExercisesTab() {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Architecture Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these architecture-focused scenarios.
        </p>
        <div className="space-y-4">
          {ARCH_QUANTUM_EXERCISES.map((exercise, idx) => (
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

export const ArchQuantumImpactModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Understand how the quantum threat impacts system architecture, key management, and infrastructure design decisions."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={<ExercisesTab />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={ARCH_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={ARCH_GUIDE_DATA} />
        case 2:
          return <RoleHowToAct key={`how-${configKey}`} data={ARCH_GUIDE_DATA} />
        case 3:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        case 4:
          return <StranglerFigArchitect key={`strangler-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
