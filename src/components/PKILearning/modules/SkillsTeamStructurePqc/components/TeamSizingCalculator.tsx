// SPDX-License-Identifier: AGPL-3.0-only AND CC-BY-4.0
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ExportableArtifact } from '../../../common/executive'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROLE_DETAIL } from '../data/teamModel'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { ROLE_CROSSWALK, type FrameworkRoleId } from '@/data/roleCrosswalk'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import {
  ALLOCATION_ROLE_ORDER,
  allocationRowText,
  allocationReferenceNote,
  allocationMarkdown,
  assessTeamAllocation,
  editTeamAllocation,
  fteText,
  seedTeamAllocation,
  type TeamSizingContext,
} from '@/utils/teamSizingModel'

export const TeamAllocationEditor: React.FC<{
  context: TeamSizingContext
  draft: unknown
  onEdit: (id: FrameworkRoleId, value: string) => void
  onReset: () => void
  renderRoleDetail?: (id: FrameworkRoleId) => React.ReactNode
}> = ({ context, draft, onEdit, onReset, renderRoleDetail }) => {
  const assessment = assessTeamAllocation(context, draft)
  return (
    <section aria-label="Staffing allocation" className="space-y-4">
      <div className="glass-panel p-4 space-y-2">
        <h3 className="font-semibold">Fictional staffing allocation</h3>
        {assessment.status === 'ready' ? (
          <div aria-live="polite">
            <p>
              Allocated programme FTE: <strong>{fteText(assessment.total)}</strong>
            </p>
            {assessment.total === 0 && <p>Unstaffed draft: no incremental FTE allocated.</p>}
            <p>
              Delivery: {fteText(assessment.delivery)} FTE + coordination:{' '}
              {fteText(assessment.coordination)} FTE
            </p>
            <p>
              Ratio delivery reference: {fteText(assessment.reference)} FTE; delivery difference:{' '}
              {fteText(assessment.delivery - assessment.reference)} FTE
            </p>
          </div>
        ) : (
          <p role="status">Allocation unavailable: {assessment.reason}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Edit the role allocations below. Delivery plus coordination gives the programme total; OT
          stays inside delivery.
        </p>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">How the sample is allocated</summary>
          <p className="mt-2">
            The Hub uses the source ratio to seed delivery. Its reference-midpoint weights are
            security 3, AppSec 1 and vendor 0.5, plus OT 0.75 when selected. Shares are rounded to
            hundredths while preserving their total. Fictional coordination defaults are 0.5 QRPM +
            0.25 architect + 0.25 PMO below 1,000 instances, or 1 + 0.75 + 0.75 otherwise. Edit them
            to explore a different allocation. This convention is not a source-prescribed minimum or
            staffing-adequacy test.
          </p>
        </details>
        <p className="text-sm text-muted-foreground">{allocationReferenceNote(context)}</p>
        <Button variant="outline" onClick={onReset}>
          Reset sample allocations
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {ALLOCATION_ROLE_ORDER.map((id) => (
          <div
            key={id}
            role="group"
            aria-label={ROLE_CROSSWALK[id].label}
            className="glass-panel p-4 space-y-2"
          >
            {id === 'exec-sponsor' ? (
              <h4 className="text-sm font-semibold">{ROLE_CROSSWALK[id].label}</h4>
            ) : (
              <label className="block text-sm font-semibold" htmlFor={`allocation-${id}`}>
                {ROLE_CROSSWALK[id].label}
              </label>
            )}
            {id === 'exec-sponsor' ? (
              <p className="text-sm">Not counted in incremental FTE</p>
            ) : (
              <Input
                id={`allocation-${id}`}
                aria-label={`${ROLE_CROSSWALK[id].label} allocated FTE`}
                type="number"
                min="0"
                step="0.01"
                value={allocationRowText(draft, id)}
                disabled={id === 'ot-specialist' && !context.otInScope}
                onChange={(event) => onEdit(id, event.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Framework reference band: {ROLE_CROSSWALK[id].typicalFte}
            </p>
            {id === 'ot-specialist' && !context.otInScope && (
              <p className="text-xs">OT is outside the selected scope.</p>
            )}
            {id === 'exec-sponsor' && (
              <p className="text-xs">
                Existing sponsor participation remains necessary; this sample excludes it from the
                incremental staffing budget.
              </p>
            )}
            {renderRoleDetail?.(id)}
          </div>
        ))}
      </div>
    </section>
  )
}

interface SavedSizingInputs {
  instances: number | string
  phase: 'firstTwoYears' | 'productionRollout'
  otInScope: boolean
  seedCleared: boolean
  allocationDraft?: unknown
}
export const TeamSizingCalculator: React.FC = () => {
  const saved = useSavedArtifactInputs<SavedSizingInputs>('team-sizing-plan')
  const [state, setState] = useState(() => {
    const context: TeamSizingContext = {
      estateInstances: String(saved?.instances ?? 2000),
      sizingPhase: saved?.phase === 'productionRollout' ? 'production' : 'early',
      otInScope: saved?.otInScope ?? false,
    }
    return {
      context,
      draft:
        saved?.allocationDraft === undefined ? seedTeamAllocation(context) : saved.allocationDraft,
      seedCleared: saved?.seedCleared ?? false,
      notice: '',
    }
  })
  const { addExecutiveDocument } = useModuleStore()
  const { industry } = useExecutiveModuleData()
  const { context, draft } = state
  const assessment = assessTeamAllocation(context, draft)
  const markdown =
    '# PQC Team Sizing Plan\n\n' +
    allocationMarkdown(context, draft) +
    '\n\n## Reference staffing sources\n' +
    ALLOCATION_ROLE_ORDER.map(
      (id) => `- ${ROLE_CROSSWALK[id].label}: ${ROLE_DETAIL[id].source}`
    ).join('\n')
  const current = useRef({ state, assessment, markdown })
  useLayoutEffect(() => {
    current.current = { state, assessment, markdown }
  }, [state, assessment, markdown])
  const handleExport = useCallback(() => {
    const value = current.current
    if (value.assessment.status !== 'ready') return
    addExecutiveDocument({
      id: `skills-team-${Date.now()}`,
      moduleId: 'skills-team-structure',
      type: 'team-sizing-plan',
      title: 'PQC Team Sizing Plan',
      data: value.markdown,
      inputs: {
        instances: value.state.context.estateInstances,
        phase: value.state.context.sizingPhase === 'early' ? 'firstTwoYears' : 'productionRollout',
        otInScope: value.state.context.otInScope,
        seedCleared: value.state.seedCleared,
        allocationDraft: value.state.draft,
      } satisfies SavedSizingInputs,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument])
  const updateContext = (patch: Partial<TeamSizingContext>, clear = false) =>
    setState((previous) => {
      const next = { ...previous.context, ...patch }
      return {
        ...previous,
        context: next,
        draft: seedTeamAllocation(next),
        seedCleared: previous.seedCleared || clear,
        notice: 'Sample allocations reset for changed inputs.',
      }
    })
  return (
    <div className="space-y-6">
      {!state.seedCleared && (
        <PreFilledBanner
          summary={`Default estate of 2,000 cryptographic instances${industry ? ` (${industry} context)` : ''}. Replace with your CBOM count.`}
          onClear={() => updateContext({ estateInstances: '' }, true)}
        />
      )}
      <p className="text-sm text-muted-foreground">
        Use a consistent fictional CBOM instance count. Inspect and edit the work allocation; the
        framework ratios are planning references, not measured staffing requirements.
      </p>
      <div className="glass-panel p-4 space-y-3">
        <label htmlFor="sts-instances" className="block text-sm font-semibold">
          Cryptographic instances (CBOM)
        </label>
        <Input
          id="sts-instances"
          type="number"
          min="1"
          step="1"
          value={context.estateInstances}
          onChange={(event) => updateContext({ estateInstances: event.target.value })}
        />
        <div role="radiogroup" aria-label="Program phase" className="flex flex-wrap gap-2">
          <Button
            role="radio"
            aria-checked={context.sizingPhase === 'early'}
            onClick={() => updateContext({ sizingPhase: 'early' })}
          >
            First two years (1 / 500)
          </Button>
          <Button
            role="radio"
            aria-checked={context.sizingPhase === 'production'}
            onClick={() => updateContext({ sizingPhase: 'production' })}
          >
            Production rollout (1 / 1000)
          </Button>
        </div>
        <Button
          role="switch"
          aria-label="OT in scope"
          aria-checked={context.otInScope}
          onClick={() => updateContext({ otInScope: !context.otInScope })}
        >
          {context.otInScope ? 'OT included in delivery pool' : 'No OT systems'}
        </Button>
        {state.notice && (
          <p role="status" className="text-sm">
            {state.notice}
          </p>
        )}
      </div>
      <TeamAllocationEditor
        context={context}
        draft={draft}
        onEdit={(id, value) =>
          setState((previous) => ({
            ...previous,
            draft: editTeamAllocation(previous.context, previous.draft, id, value),
          }))
        }
        renderRoleDetail={(id) => (
          <p className="text-xs text-muted-foreground">
            Reference staffing source: {ROLE_DETAIL[id].source}
          </p>
        )}
        onReset={() =>
          setState((previous) => ({
            ...previous,
            draft: seedTeamAllocation(previous.context),
            notice: 'Sample allocations reset.',
          }))
        }
      />
      <p className="text-xs text-muted-foreground">
        Reference:{' '}
        <a
          href="https://pqcframework.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Applied Quantum PQC Migration Framework v2.1
        </a>
        , Skills &amp; Team Structure, p. 161 (Marin Ivezić / Applied Quantum, CC BY 4.0). The
        500/1000 ratios and source bands remain references; the delivery/coordination split,
        fractional defaults and allocation weights are Hub teaching assumptions.
      </p>
      {assessment.status === 'ready' ? (
        <ExportableArtifact
          title="Team Sizing Plan Export"
          exportData={markdown}
          filename="pqc-team-sizing-plan"
          formats={['markdown', 'pdf']}
          onExport={handleExport}
          wideTable
        >
          <p className="text-sm">Export the selected row allocations and their reconciled total.</p>
        </ExportableArtifact>
      ) : (
        <p className="text-sm">Correct the inputs to enable saving and export.</p>
      )}
    </div>
  )
}
