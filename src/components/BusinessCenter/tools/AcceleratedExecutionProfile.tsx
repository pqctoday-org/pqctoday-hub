// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Accelerated Execution Profile — Phase 4 Activity 4.7 contingency package.
 *
 * A PRE-DRAFTED contingency package that is activated if the quantum timeline
 * accelerates (e.g. an earlier-than-expected CRQC milestone). It captures the
 * framework's five elements so the program can compress its migration without
 * re-running governance under pressure: (1) trigger conditions, (2) a compressed
 * migration sequence, (3) pre-approved risk acceptances, (4) a pre-drafted
 * emergency resource request, and (5) the activation authority.
 *
 * Emits a downloadable markdown artifact and saves it to the Command Center
 * under the migration-program module, like the other Phase-4 tools. The profile
 * should be exercised annually as a tabletop so it is ready to pull off the shelf.
 */
import React, { useMemo, useState } from 'react'
import { isAutoRunFillActive } from '@/components/Simulation/autorun/autoRunFill'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'

/** Common acceleration triggers offered as toggle chips — the three trigger
 *  types named by framework Activity 4.7. */
export const TRIGGER_OPTIONS = [
  'CRQC milestone announced',
  'Regulatory deadline pulled forward',
  'Cryptanalytic event against a deployed algorithm',
  'Active HNDL campaign detected',
  'Vendor critical-path slip',
] as const
export type TriggerOption = (typeof TRIGGER_OPTIONS)[number]

export interface ProfileState {
  triggers: Record<TriggerOption, boolean>
  otherTrigger: string
  compressedSequence: string
  deadlineDays?: string
  prerequisiteDays?: string
  rolloutDays?: string
  riskAcceptances: string
  resourceRequest: string
  activationAuthority: string
}

function calendarFit(state: ProfileState): string {
  const values = [state.deadlineDays ?? '', state.prerequisiteDays ?? '', state.rolloutDays ?? '']
  if (values.every((value) => value === '')) return 'Enter the target and both sequence durations.'
  if (values.some((value) => !/^\d{1,4}$/.test(value))) {
    return 'Use whole numbers from 0 to 9,999 for all three durations.'
  }
  const [deadline, prerequisite, rollout] = values.map(Number)
  const finish = prerequisite + rollout
  const difference = deadline - finish
  if (difference < 0) {
    const lateDays = -difference
    return `The sequence finishes on day ${finish}, ${lateDays} ${lateDays === 1 ? 'day' : 'days'} after the target. Rework the sequence or resolve the remaining schedule risk.`
  }
  return `The sequence finishes on day ${finish}, with ${difference} ${difference === 1 ? 'day' : 'days'} of margin before the target.`
}

export function buildMarkdown(s: ProfileState): string {
  const lines: string[] = []
  lines.push('# Accelerated Execution Profile')
  lines.push('')
  lines.push(
    '*Phase 4 — Activity 4.7. A pre-drafted contingency package activated if the ' +
      'quantum timeline accelerates, so migration can be compressed without re-running ' +
      'governance under pressure.*'
  )
  lines.push('')

  lines.push('## 1. Trigger Conditions')
  lines.push('')
  const selected = TRIGGER_OPTIONS.filter((t) => s.triggers[t])
  const other = s.otherTrigger.trim()
  if (selected.length === 0 && !other) {
    lines.push('_No trigger conditions selected._')
  } else {
    for (const t of selected) {
      lines.push(`- ${t}`)
    }
    if (other) {
      lines.push(`- ${other}`)
    }
  }
  lines.push('')

  lines.push('## 2. Compressed Sequence')
  lines.push('')
  lines.push(s.compressedSequence.trim() || '_(compressed wave order not yet defined)_')
  lines.push('')
  lines.push(`- **Target from activation:** ${s.deadlineDays || '_(TBD)_'} calendar days`)
  lines.push(
    `- **Prerequisite and compatibility checks:** ${s.prerequisiteDays || '_(TBD)_'} calendar days`
  )
  lines.push(`- **Rollout after prerequisite:** ${s.rolloutDays || '_(TBD)_'} calendar days`)
  lines.push(`- **Sequence check:** ${calendarFit(s)}`)
  lines.push('')

  lines.push('## 3. Pre-Approved Risk Acceptances')
  lines.push('')
  lines.push(s.riskAcceptances.trim() || '_(no pre-approved risk acceptances recorded)_')
  lines.push('')

  lines.push('## 4. Emergency Resource Request')
  lines.push('')
  lines.push(s.resourceRequest.trim() || '_(emergency budget / headcount ask not yet drafted)_')
  lines.push('')

  lines.push('## 5. Activation Authority')
  lines.push('')
  lines.push(`- **Who can pull the trigger:** ${s.activationAuthority.trim() || '_(unassigned)_'}`)
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push(
    '*Hub educational contingency tabletop template — recording risk acceptances, resource requests, or activation authority here does not constitute formal organizational pre-approval or budget authorization.*'
  )
  lines.push('')
  lines.push(
    '*Pre-drafted per the Applied Quantum Phase 4 Activity 4.7 contingency framework. ' +
      'Exercise this profile annually as a tabletop so it can be pulled off the shelf and ' +
      'activated without delay.*'
  )
  return lines.join('\n')
}

export const AcceleratedExecutionProfile: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const savedInputs = useSavedArtifactInputs<ProfileState>('accelerated-execution-profile')
  const [state, setState] = useState<ProfileState>(() => {
    const base: ProfileState = {
      triggers: {
        'CRQC milestone announced': true,
        'Regulatory deadline pulled forward': false,
        'Cryptanalytic event against a deployed algorithm': false,
        'Active HNDL campaign detected': false,
        'Vendor critical-path slip': false,
      },
      otherTrigger: '',
      compressedSequence: '',
      deadlineDays: '',
      prerequisiteDays: '',
      rolloutDays: '',
      riskAcceptances: '',
      resourceRequest: '',
      activationAuthority: '',
    }
    // Auto-run demo fill — framework Phase 4 activity 4.7 contingency package.
    if (isAutoRunFillActive()) {
      return {
        ...base,
        triggers: {
          ...base.triggers,
          'CRQC milestone announced': true,
          'Regulatory deadline pulled forward': true,
          'Active HNDL campaign detected': true,
        },
        deadlineDays: '90',
        prerequisiteDays: '40',
        rolloutDays: '30',
        compressedSequence:
          'Collapse Phases 4–6: run discovery, risk scoring and Tier-1 pilots in parallel; pre-approve hybrid (X25519MLKEM768 / RFC 10024) for all internet-facing TLS; defer long-tail / OT to a contained track.',
        riskAcceptances:
          'Pre-approved: temporary classical fallback for non-Tier-1 systems during transition; vendor roadmap commitments accepted for up to two quarters; residual risk re-reviewed quarterly.',
        resourceRequest:
          'Emergency budget uplift (~30% of Year 1) for surge cryptographic-engineering contractors and expedited HSM firmware procurement.',
        activationAuthority: 'Executive Sponsor (CISO), on SteerCo recommendation.',
      }
    }
    // Restore the user's last-saved profile so it round-trips across visits.
    if (savedInputs) {
      return {
        ...base,
        ...savedInputs,
        triggers: { ...base.triggers, ...savedInputs.triggers },
      }
    }
    return base
  })

  const set = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  const toggleTrigger = (t: TriggerOption) =>
    setState((prev) => ({
      ...prev,
      triggers: { ...prev.triggers, [t]: !prev.triggers[t] },
    }))

  const exportMarkdown = useMemo(() => buildMarkdown(state), [state])

  const triggerCount =
    TRIGGER_OPTIONS.filter((t) => state.triggers[t]).length + (state.otherTrigger.trim() ? 1 : 0)

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <Zap size={24} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold font-display text-heading">
            Accelerated Execution Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Phase 4 — Activity 4.7. A pre-drafted contingency package activated if the quantum
            timeline accelerates: triggers, a compressed sequence, pre-approved risk acceptances, an
            emergency resource ask, and the activation authority.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            These 5 elements mirror the framework&apos;s own Activity 4.7 pre-approved package —
            each one removes a decision that would otherwise wait on a committee cycle when the
            timeline compresses.
          </p>
          {/* The framework names three trigger conditions; two of the five
              offered here are this app's additions. A reader would otherwise
              take all five as framework-sourced. (Audit 2026-08-10, W5.) */}
          <p className="text-xs text-muted-foreground mt-1">
            Activity 4.7 names three trigger conditions — a credible reassessment of CRQC timelines,
            regulatory deadline compression, and a cryptanalytic event against a deployed algorithm.
            &ldquo;Active HNDL campaign detected&rdquo; and &ldquo;Vendor critical-path slip&rdquo;
            are this tool&apos;s additions, not the framework&apos;s. This is an educational
            tabletop template; formal risk acceptances, emergency budgets, and activation authority
            must be ratified in your organization&apos;s own governance and incident-response
            systems.
          </p>
        </div>
      </header>

      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">
          1. Trigger conditions · {triggerCount} selected
        </h3>
        <p className="text-xs text-muted-foreground">
          Pick the conditions that would activate the accelerated profile, or add your own.
        </p>
        <div className="flex flex-wrap gap-2">
          {TRIGGER_OPTIONS.map((t) => {
            const on = state.triggers[t]
            return (
              <Button
                key={t}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleTrigger(t)}
                aria-pressed={on}
                className={`h-7 px-3 rounded-full border text-[11px] font-semibold transition-all ${
                  on
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {t}
              </Button>
            )
          })}
        </div>
        <div className="block">
          <label htmlFor="aep-other-trigger" className="text-xs font-medium text-muted-foreground">
            Other trigger
          </label>
          <Input
            id="aep-other-trigger"
            className="mt-1"
            value={state.otherTrigger}
            onChange={(e) => set('otherTrigger', e.target.value)}
            placeholder="e.g. Board directive to accelerate"
          />
        </div>
      </section>

      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">2. Compressed sequence</h3>
        <div className="block">
          <label
            htmlFor="aep-compressed-sequence"
            className="text-xs font-medium text-muted-foreground"
          >
            Compressed wave order
          </label>
          <Textarea
            id="aep-compressed-sequence"
            className="mt-1"
            rows={3}
            value={state.compressedSequence}
            onChange={(e) => set('compressedSequence', e.target.value)}
            placeholder="e.g. Wave 1 (crown-jewel HNDL data) → Wave 2 (external TLS) → defer low-risk waves"
          />
        </div>
      </section>

      <section className="glass-panel p-4 space-y-3" aria-labelledby="aep-schedule-check">
        <h3 id="aep-schedule-check" className="text-sm font-semibold font-display text-heading">
          Check the shortened schedule
        </h3>
        <p className="text-xs text-muted-foreground">
          Treat activation as day zero. The rollout starts only after the prerequisite and its
          compatibility checks finish. Record staffing and risk acceptance below before committing.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ['deadlineDays', 'Target from activation (days)'],
              ['prerequisiteDays', 'Prerequisite and checks (days)'],
              ['rolloutDays', 'Rollout after prerequisite (days)'],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="block">
              <label htmlFor={`aep-${field}`} className="block text-xs font-medium">
                {label}
              </label>
              <Input
                id={`aep-${field}`}
                type="number"
                min={0}
                max={9999}
                className="mt-1"
                value={state[field] ?? ''}
                onChange={(event) => set(field, event.target.value)}
              />
            </div>
          ))}
        </div>
        <p role="status" aria-label="Accelerated schedule result" className="text-sm font-semibold">
          {calendarFit(state)}
        </p>
      </section>

      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">
          3. Pre-approved risk acceptances
        </h3>
        <div className="block">
          <label
            htmlFor="aep-risk-acceptances"
            className="text-xs font-medium text-muted-foreground"
          >
            Risk acceptances cleared in advance
          </label>
          <Textarea
            id="aep-risk-acceptances"
            className="mt-1"
            rows={3}
            value={state.riskAcceptances}
            onChange={(e) => set('riskAcceptances', e.target.value)}
            placeholder="e.g. Accept temporary perf regression on internal APIs during rollout"
          />
        </div>
      </section>

      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">
          4. Emergency resource request
        </h3>
        <div className="block">
          <label
            htmlFor="aep-resource-request"
            className="text-xs font-medium text-muted-foreground"
          >
            Pre-drafted budget / headcount ask
          </label>
          <Textarea
            id="aep-resource-request"
            className="mt-1"
            rows={3}
            value={state.resourceRequest}
            onChange={(e) => set('resourceRequest', e.target.value)}
            placeholder="e.g. +$2M surge budget, 4 contract engineers for 90 days"
          />
        </div>
      </section>

      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold font-display text-heading">5. Activation authority</h3>
        <div className="block">
          <label
            htmlFor="aep-activation-authority"
            className="text-xs font-medium text-muted-foreground"
          >
            Who can pull the trigger
          </label>
          <Input
            id="aep-activation-authority"
            className="mt-1"
            value={state.activationAuthority}
            onChange={(e) => set('activationAuthority', e.target.value)}
            placeholder="e.g. Executive Sponsor + SteerCo chair"
          />
        </div>
      </section>

      <ExportableArtifact
        title="Accelerated Execution Profile — Export"
        exportData={exportMarkdown}
        filename="accelerated-execution-profile"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `accelerated-execution-profile-${Date.now()}`,
            moduleId: 'migration-program',
            type: 'accelerated-execution-profile',
            title: `Accelerated Execution Profile — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              ...state,
              triggerCount,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this pre-drafted contingency package to your Command Center, or export as markdown /
          PDF / Word. This is the Phase-4 Activity 4.7 artifact — exercise it annually as a tabletop
          so it can be activated without delay if the quantum timeline accelerates.
        </p>
      </ExportableArtifact>
    </div>
  )
}

export default AcceleratedExecutionProfile
