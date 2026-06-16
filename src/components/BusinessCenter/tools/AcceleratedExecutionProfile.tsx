// SPDX-License-Identifier: GPL-3.0-only
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
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'

/** Common acceleration triggers offered as toggle chips. */
const TRIGGER_OPTIONS = [
  'CRQC milestone announced',
  'Regulatory deadline pulled forward',
  'Active HNDL campaign detected',
  'Vendor critical-path slip',
] as const
type TriggerOption = (typeof TRIGGER_OPTIONS)[number]

interface ProfileState {
  triggers: Record<TriggerOption, boolean>
  otherTrigger: string
  compressedSequence: string
  riskAcceptances: string
  resourceRequest: string
  activationAuthority: string
}

function buildMarkdown(s: ProfileState): string {
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
    '*Pre-drafted per the Applied Quantum Phase 4 Activity 4.7 contingency framework. ' +
      'Exercise this profile annually as a tabletop so it can be pulled off the shelf and ' +
      'activated without delay.*'
  )
  return lines.join('\n')
}

export const AcceleratedExecutionProfile: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const [state, setState] = useState<ProfileState>(() => ({
    triggers: {
      'CRQC milestone announced': true,
      'Regulatory deadline pulled forward': false,
      'Active HNDL campaign detected': false,
      'Vendor critical-path slip': false,
    },
    otherTrigger: '',
    compressedSequence: '',
    riskAcceptances: '',
    resourceRequest: '',
    activationAuthority: '',
  }))

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
          <h2 className="text-lg font-semibold text-foreground">Accelerated Execution Profile</h2>
          <p className="text-sm text-muted-foreground">
            Phase 4 — Activity 4.7. A pre-drafted contingency package activated if the quantum
            timeline accelerates: triggers, a compressed sequence, pre-approved risk acceptances, an
            emergency resource ask, and the activation authority.
          </p>
        </div>
      </header>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
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

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">2. Compressed sequence</h3>
        <div className="block">
          <label
            htmlFor="aep-compressed-sequence"
            className="text-xs font-medium text-muted-foreground"
          >
            Compressed wave order
          </label>
          <Input
            id="aep-compressed-sequence"
            className="mt-1"
            value={state.compressedSequence}
            onChange={(e) => set('compressedSequence', e.target.value)}
            placeholder="e.g. Wave 1 (crown-jewel HNDL data) → Wave 2 (external TLS) → defer low-risk waves"
          />
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">3. Pre-approved risk acceptances</h3>
        <div className="block">
          <label
            htmlFor="aep-risk-acceptances"
            className="text-xs font-medium text-muted-foreground"
          >
            Risk acceptances cleared in advance
          </label>
          <Input
            id="aep-risk-acceptances"
            className="mt-1"
            value={state.riskAcceptances}
            onChange={(e) => set('riskAcceptances', e.target.value)}
            placeholder="e.g. Accept temporary perf regression on internal APIs during rollout"
          />
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">4. Emergency resource request</h3>
        <div className="block">
          <label
            htmlFor="aep-resource-request"
            className="text-xs font-medium text-muted-foreground"
          >
            Pre-drafted budget / headcount ask
          </label>
          <Input
            id="aep-resource-request"
            className="mt-1"
            value={state.resourceRequest}
            onChange={(e) => set('resourceRequest', e.target.value)}
            placeholder="e.g. +$2M surge budget, 4 contract engineers for 90 days"
          />
        </div>
      </section>

      <section className="glass-panel border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">5. Activation authority</h3>
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
