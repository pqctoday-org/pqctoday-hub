// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, AlertTriangle, BookOpen, Rocket, Radar, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Introduction } from './components/Introduction'
import { SOC_GUIDE_DATA } from './data'
import { SOC_QUANTUM_EXERCISES } from './exercises'
import { DETECTION_USE_CASES } from './detectionUseCases'
import { RoleWhyItMatters, RoleWhatToLearn, RoleHowToAct } from '../../common/roleGuide'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ModuleTabBar } from '@/components/PKILearning/common/ModuleTabBar'
import { ModuleReferencesTab } from '../../common/ModuleReferencesTab'
import { ModuleMigrateTab } from '../../common/ModuleMigrateTab'
import { ModuleVisualTab } from '../../common/ModuleVisualTab'
import { WorkshopStepHeader } from '../../common/WorkshopStepHeader'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { WORKSHOP_STEPS } from '@/components/PKILearning/moduleData'

const MODULE_ID = 'soc-implementation-pqc'

const PARTS = [
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

export const SocImplementationPqcModule: React.FC = () => {
  const deepLink = getModuleDeepLink({ maxStep: PARTS.length - 1 })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete, modules } = useModuleStore()

  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMs = Date.now() - startTimeRef.current
      const elapsed = elapsedMs / 60000
      const current = useModuleStore.getState().modules[MODULE_ID]
      updateModuleProgress(MODULE_ID, {
        timeSpent: (current?.timeSpent || 0) + elapsed,
      })
    }
  }, [updateModuleProgress])

  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  const navigateToWorkshop = useCallback(() => {
    markStepComplete(MODULE_ID, activeTab)
    setActiveTab('workshop')
  }, [activeTab, markStepComplete])

  const handlePartChange = useCallback(
    (newPart: number) => {
      const partIds = PARTS.map((p) => p.id)
      if (newPart > currentPart) {
        markStepComplete(MODULE_ID, partIds[currentPart])
      }
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete]
  )

  const handleReset = () => {
    if (confirm('Restart SOC Implementation for PQC module?')) {
      setCurrentPart(0)
      setConfigKey((prev) => prev + 1)
      startTimeRef.current = Date.now()
      updateModuleProgress(MODULE_ID, {
        status: 'in-progress',
        completedSteps: [],
        timeSpent: 0,
      })
    }
  }

  const workshopSteps = WORKSHOP_STEPS[MODULE_ID] ?? []
  const completedSteps = modules[MODULE_ID]?.completedSteps ?? []
  const workshopDone = workshopSteps.filter((s) => completedSteps.includes(s.id)).length
  const workshopDot = workshopDone > 0 && workshopDone < workshopSteps.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">SOC Implementation for PQC</h1>
          <p className="text-muted-foreground mt-2">
            Build the SOC&rsquo;s quantum security capability &mdash; five detection use cases,
            three-horizon threat intelligence, four incident-response playbooks, and the named
            tabletop exercises that prove them.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ModuleTabBar
          tabs={[
            { value: 'learn', label: 'Learn' },
            { value: 'visual', label: 'Visual' },
            { value: 'workshop', label: 'Workshop', hasDot: workshopDot },
            { value: 'exercises', label: 'Exercises' },
            { value: 'references', label: 'References' },
            { value: 'tools', label: 'Tools & Products' },
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
        />

        <TabsContent value="learn">
          <GlossaryAutoWrap>
            <Introduction onNavigateToWorkshop={navigateToWorkshop} />
          </GlossaryAutoWrap>
        </TabsContent>

        <TabsContent value="visual">
          <ModuleVisualTab moduleId={MODULE_ID} />
        </TabsContent>

        <TabsContent value="workshop">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:bg-destructive/10 border border-destructive/20"
              >
                <Trash2 size={16} />
                Reset
              </Button>
            </div>

            <div className="overflow-x-auto px-2 sm:px-0">
              <div className="flex justify-evenly relative min-w-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
                {PARTS.map((part, idx) => {
                  const Icon = part.icon
                  return (
                    <Button
                      variant="ghost"
                      key={part.id}
                      onClick={() => handlePartChange(idx)}
                      className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                          ${
                            idx === currentPart
                              ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              : idx < currentPart
                                ? 'border-success text-success'
                                : 'border-border text-muted-foreground'
                          }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-sm font-medium hidden md:block">
                        {part.title.split(':')[0]}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
              <WorkshopStepHeader
                moduleId={MODULE_ID}
                stepId={PARTS[currentPart].id}
                stepTitle={PARTS[currentPart].title}
                stepDescription={PARTS[currentPart].description}
                stepIndex={currentPart}
                totalSteps={PARTS.length}
                steps={PARTS.map((p) => ({ id: p.id, label: p.title }))}
                onStepClick={handlePartChange}
              />
              {currentPart === 0 && (
                <RoleWhyItMatters key={`why-${configKey}`} data={SOC_GUIDE_DATA} />
              )}
              {currentPart === 1 && (
                <RoleWhatToLearn key={`what-${configKey}`} data={SOC_GUIDE_DATA} />
              )}
              {currentPart === 2 && <RoleHowToAct key={`how-${configKey}`} data={SOC_GUIDE_DATA} />}
              {currentPart === 3 && <DetectionPlannerStep key={`planner-${configKey}`} />}
              {currentPart === 4 && <SelfAssessmentStep key={`assess-${configKey}`} />}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                data-workshop-target="learn-stepper-prev"
                variant="outline"
                size="lg"
                onClick={() => handlePartChange(Math.max(0, currentPart - 1))}
                disabled={currentPart === 0}
              >
                &larr; Previous Step
              </Button>
              {currentPart === PARTS.length - 1 ? (
                <Button
                  data-workshop-target="learn-stepper-complete"
                  variant="gradient"
                  size="lg"
                  onClick={() => markStepComplete(MODULE_ID, PARTS[currentPart].id)}
                >
                  Complete Module
                </Button>
              ) : (
                <Button
                  data-workshop-target="learn-stepper-next"
                  size="lg"
                  onClick={() => handlePartChange(currentPart + 1)}
                >
                  Next Step &rarr;
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises">
          <ExercisesTab />
        </TabsContent>

        <TabsContent value="references">
          <ModuleReferencesTab moduleId={MODULE_ID} />
        </TabsContent>
        <TabsContent value="tools">
          <ModuleMigrateTab moduleId={MODULE_ID} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
