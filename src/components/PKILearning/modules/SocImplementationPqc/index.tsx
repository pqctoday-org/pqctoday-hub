// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState, type FC } from 'react'
import { AlertTriangle, BookOpen, Rocket, Radar, ClipboardCheck } from 'lucide-react'
import { Introduction } from './components/Introduction'
import { SOC_GUIDE_DATA } from './data'
import { SOC_QUANTUM_EXERCISES } from './exercises'
import { DETECTION_USE_CASES } from './detectionUseCases'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'why-it-matters',
    title: 'Step 1: Why It Matters',
    description:
      'Understand the five PQC detection use cases — hybrid downgrade, crypto drift, certificate-lifecycle anomalies, TNFL/signature integrity, and HNDL indicators — and the posture registry they all depend on.',
    icon: AlertTriangle,
  },
  {
    id: 'what-to-learn',
    title: 'Step 2: What to Learn',
    description:
      'Identify the detection-engineering, threat-intelligence, and incident-response skills the SOC must build, and where to build, borrow, or buy them.',
    icon: BookOpen,
  },
  {
    id: 'how-to-act',
    title: 'Step 3: How to Act',
    description:
      'Build a phased SOC implementation plan from operationalizing the posture registry to exercising the four quantum playbooks.',
    icon: Rocket,
  },
  {
    id: 'detection-planner',
    title: 'Step 4: Detection Planner',
    description:
      'Plan coverage across the five detection use cases — set each capability to not-started, building, or operational and watch your SOC detection coverage score.',
    icon: Radar,
  },
  {
    id: 'self-assessment',
    title: 'Step 5: SOC Readiness',
    description:
      'Score your SOC readiness across nine criteria to identify which detection, CTI, and IR gaps need the most urgent attention.',
    icon: ClipboardCheck,
  },
]

type CoverageState = 'none' | 'building' | 'operational'

const COVERAGE_WEIGHT: Record<CoverageState, number> = {
  none: 0,
  building: 1,
  operational: 2,
}

const COVERAGE_LABEL: Record<CoverageState, string> = {
  none: 'Not started',
  building: 'Building',
  operational: 'Operational',
}

const COVERAGE_ORDER: CoverageState[] = ['none', 'building', 'operational']

function DetectionPlannerStep() {
  const useCases = DETECTION_USE_CASES
  const maxScore = useCases.length * COVERAGE_WEIGHT.operational
  const [states, setStates] = useState<Record<string, CoverageState>>(() =>
    Object.fromEntries(useCases.map((u) => [u.id, 'none' as CoverageState]))
  )

  const score = useCases.reduce((sum, u) => sum + COVERAGE_WEIGHT[states[u.id] ?? 'none'], 0)
  const pct = Math.round((score / maxScore) * 100)

  const band =
    pct >= 75
      ? { label: 'Strong Coverage', color: 'text-status-success' }
      : pct >= 40
        ? { label: 'Partial Coverage', color: 'text-status-warning' }
        : { label: 'Minimal Coverage', color: 'text-status-error' }

  const cycle = (id: string) =>
    setStates((prev) => {
      const current = prev[id] ?? 'none'
      const next = COVERAGE_ORDER[(COVERAGE_ORDER.indexOf(current) + 1) % COVERAGE_ORDER.length]
      return { ...prev, [id]: next }
    })

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">SOC Detection Coverage Planner</h3>
        <p className="text-sm text-muted-foreground">
          The SOC&rsquo;s contribution to quantum security centers on five detection capabilities,
          each built on existing SIEM, network-monitoring, and certificate-management
          infrastructure. Set the current state of each capability to see your detection coverage.
          Activate a row to cycle Not started &rarr; Building &rarr; Operational.
        </p>
        <div className="space-y-3">
          {useCases.map((uc) => {
            const state = states[uc.id] ?? 'none'
            return (
              <div
                key={uc.id}
                role="button"
                tabIndex={0}
                onClick={() => cycle(uc.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    cycle(uc.id)
                  }
                }}
                aria-label={`${uc.title}: currently ${COVERAGE_LABEL[state]}. Activate to advance state.`}
                className="glass-panel p-4 flex flex-col sm:flex-row sm:items-start gap-3 cursor-pointer border border-border hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{uc.code}</span>
                    <span className="text-sm font-semibold text-foreground">{uc.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{uc.summary}</p>
                  <p className="text-xs text-foreground/70 leading-snug">
                    <span className="font-medium text-foreground/90">Severity:</span> {uc.severity}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={`self-start sm:self-center flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border
                    ${
                      state === 'operational'
                        ? 'border-status-success text-status-success bg-status-success/10'
                        : state === 'building'
                          ? 'border-status-warning text-status-warning bg-status-warning/10'
                          : 'border-border text-muted-foreground bg-muted/40'
                    }`}
                >
                  {COVERAGE_LABEL[state]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Detection coverage score</span>
          <span className={`text-lg font-bold ${band.color}`}>
            {score}/{maxScore} &mdash; {band.label}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-status-success' : pct >= 40 ? 'bg-status-warning' : 'bg-status-error'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {pct >= 75
            ? 'Strong coverage. Fold cryptographic posture monitoring into your permanent detection library and shift focus to exercising the four quantum incident-response playbooks.'
            : pct >= 40
              ? 'Partial coverage. Prioritise the highest-severity gaps — hybrid downgrade and TNFL signature integrity — and confirm the posture registry is SIEM-integrated before extending rules enterprise-wide.'
              : 'Minimal coverage. Start with the prerequisite: a machine-readable cryptographic posture registry. Without it, none of these detection rules can function reliably.'}
        </p>
      </div>
    </div>
  )
}

function SelfAssessmentStep() {
  const items = SOC_GUIDE_DATA.selfAssessment
  const maxScore = items.reduce((sum, item) => sum + item.weight, 0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const score = items.reduce((sum, item) => sum + (checked[item.id] ? item.weight : 0), 0)
  const pct = Math.round((score / maxScore) * 100)

  // Higher score = more capability in place, so lower residual gap.
  const band =
    pct >= 70
      ? { label: 'Mature SOC Posture', color: 'text-status-success' }
      : pct >= 40
        ? { label: 'Developing Posture', color: 'text-status-warning' }
        : { label: 'Early-Stage Posture', color: 'text-status-error' }

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">SOC Quantum-Readiness Checklist</h3>
        <p className="text-sm text-muted-foreground">
          Check every statement that is already true of your SOC. Your score reflects how much of
          the quantum detection, threat-intelligence, and incident-response capability you have
          built.
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
          <span className="text-sm font-medium text-foreground">Your readiness score</span>
          <span className={`text-lg font-bold ${band.color}`}>
            {score}/{maxScore} &mdash; {band.label}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 70 ? 'bg-status-success' : pct >= 40 ? 'bg-status-warning' : 'bg-status-error'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {pct >= 70
            ? 'Mature posture. Sustain the capability: keep cryptographic posture monitoring in the permanent detection library and run the named tabletops at least annually.'
            : pct >= 40
              ? 'Developing posture. The biggest leverage is usually the posture registry and PQC NamedGroup parsing — without those, downgrade and drift detection cannot function.'
              : 'Early-stage posture. Start with Roadmap Phase 1: operationalise the posture registry for SOC access, stand up tactical CTI, and draft the PQC Algorithm Vulnerability Disclosure playbook.'}
        </p>
      </div>
    </div>
  )
}

function ExercisesTab() {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">SOC Tabletop Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Run these named tabletop scenarios at least annually with the migration program office,
          the CISO, GRC, and relevant application owners. Produce a structured after-action report
          for each.
        </p>
        <div className="space-y-4">
          {SOC_QUANTUM_EXERCISES.map((exercise, idx) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{exercise.title}</h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  Use the Why It Matters (Step 1), What to Learn (Step 2), How to Act (Step 3), and
                  Detection Planner (Step 4) tools in the Workshop tab to model your response.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const SocImplementationPqcModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description={
      <>
        Build the SOC&rsquo;s quantum security capability &mdash; five detection use cases,
        three-horizon threat intelligence, four incident-response playbooks, and the named tabletop
        exercises that prove them.
      </>
    }
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={<ExercisesTab />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <RoleWhyItMatters key={`why-${configKey}`} data={SOC_GUIDE_DATA} />
        case 1:
          return <RoleWhatToLearn key={`what-${configKey}`} data={SOC_GUIDE_DATA} />
        case 2:
          return <RoleHowToAct key={`how-${configKey}`} data={SOC_GUIDE_DATA} />
        case 3:
          return <DetectionPlannerStep key={`planner-${configKey}`} />
        case 4:
          return <SelfAssessmentStep key={`assess-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
