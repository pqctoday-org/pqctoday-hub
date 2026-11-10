// SPDX-License-Identifier: AGPL-3.0-only
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { TeamAllocationEditor } from '@/components/PKILearning/modules/SkillsTeamStructurePqc/components/TeamSizingCalculator'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import {
  ROLE_CROSSWALK,
  INSTANCES_PER_PRODUCT_ESTIMATE,
  FTE_PER_CRYPTO_INSTANCES,
  FTE_PER_CRYPTO_INSTANCES_PRODUCTION,
  type FrameworkRoleId,
} from '@/data/roleCrosswalk'
import { NICE_WORK_ROLES } from '@/data/niceFramework'
import { FRAMEWORK_NAME, FRAMEWORK_URL } from '@/data/frameworkPhases'
import {
  ALLOCATION_ROLE_ORDER,
  allocationMarkdown,
  assessTeamAllocation,
  editTeamAllocation,
  seedTeamAllocation,
  type TeamSizingContext,
} from '@/utils/teamSizingModel'

const SOURCING_OPTIONS = ['build', 'borrow', 'buy'] as const
type Sourcing = (typeof SOURCING_OPTIONS)[number]
const SOURCING_LABEL: Record<Sourcing, string> = {
  build: 'Build (hire / train internally)',
  borrow: 'Borrow (contractors / partners)',
  buy: 'Buy (managed service / outsource)',
}
export const ROLE_ORDER = ALLOCATION_ROLE_ORDER
const DEFAULT_SOURCING: Record<FrameworkRoleId, Sourcing> = {
  qrpm: 'build',
  'exec-sponsor': 'build',
  'crypto-architect': 'build',
  'security-eng': 'borrow',
  'appsec-lead': 'build',
  'ot-specialist': 'borrow',
  'vendor-lead': 'build',
  'pmo-analyst': 'build',
}
export interface PlanState {
  estateInstances: string
  sizingPhase: 'early' | 'production'
  sourcing: Record<FrameworkRoleId, Sourcing>
  otInScope?: boolean
  allocationDraft?: unknown
}
const contextFor = (state: PlanState): TeamSizingContext => ({
  estateInstances: state.estateInstances,
  sizingPhase: state.sizingPhase,
  otInScope: state.otInScope ?? false,
})
function niceTitles(id: FrameworkRoleId): string {
  return ROLE_CROSSWALK[id].niceRoles.map((nid) => NICE_WORK_ROLES[nid]?.title ?? nid).join(', ')
}
export function buildMarkdown(state: PlanState): string {
  const context = contextFor(state)
  const draft =
    state.allocationDraft === undefined ? seedTeamAllocation(context) : state.allocationDraft
  return [
    '# Skills & Team Plan',
    '',
    allocationMarkdown(context, draft),
    '',
    '## Build / borrow / buy summary',
    ...SOURCING_OPTIONS.map(
      (option) =>
        `- **${SOURCING_LABEL[option]}:** ${
          ROLE_ORDER.filter((id) => state.sourcing[id] === option)
            .map((id) => ROLE_CROSSWALK[id].label)
            .join(', ') || '(none)'
        }`
    ),
    '',
    '## NICE work roles',
    ...ROLE_ORDER.map((id) => `- ${ROLE_CROSSWALK[id].label}: ${niceTitles(id)}`),
    '',
    `Reference: ${FRAMEWORK_NAME} §5, ${FRAMEWORK_URL}. Ratios and role bands are references; fractional defaults and allocation weights are Hub teaching assumptions. Governance reading: https://doi.org/10.6028/NIST.CSWP.39-upd1`,
  ].join('\n')
}
export const SkillsTeamPlan: React.FC = () => {
  const addExecutiveDocument = useModuleStore((state) => state.addExecutiveDocument)
  const saved = useSavedArtifactInputs<PlanState>('skills-team-plan')
  const { myProducts } = useExecutiveModuleData()
  const seedInstances = myProducts.length
    ? String(myProducts.length * INSTANCES_PER_PRODUCT_ESTIMATE)
    : ''
  const [state, setState] = useState<PlanState>(() => {
    const initial = {
      estateInstances: saved?.estateInstances ?? seedInstances,
      sizingPhase: saved?.sizingPhase ?? 'early',
      otInScope: saved?.otInScope ?? false,
      sourcing: { ...DEFAULT_SOURCING, ...saved?.sourcing },
    } satisfies PlanState
    return {
      ...initial,
      allocationDraft:
        saved?.allocationDraft === undefined
          ? seedTeamAllocation(contextFor(initial))
          : saved.allocationDraft,
    }
  })
  const [notice, setNotice] = useState('')
  const context = contextFor(state)
  const assessment = assessTeamAllocation(context, state.allocationDraft)
  const markdown = buildMarkdown(state)
  const current = useRef({ state, assessment, markdown })
  useLayoutEffect(() => {
    current.current = { state, assessment, markdown }
  }, [state, assessment, markdown])
  const handleExport = useCallback(() => {
    const value = current.current
    if (value.assessment.status !== 'ready') return
    addExecutiveDocument({
      id: `skills-team-plan-${Date.now()}`,
      moduleId: 'pqc-governance',
      type: 'skills-team-plan',
      title: `Skills & Team Plan — ${new Date().toLocaleDateString()}`,
      data: value.markdown,
      inputs: { ...value.state },
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument])
  const updateContext = (patch: Partial<TeamSizingContext>) => {
    setState((previous) => {
      const next = { ...previous, ...patch }
      return { ...next, allocationDraft: seedTeamAllocation(contextFor(next)) }
    })
    setNotice('Sample allocations reset for changed inputs.')
  }
  return (
    <div className="space-y-4">
      {seedInstances !== '' && (
        <PreFilledBanner
          summary={`Estate size seeded from ${myProducts.length} product${myProducts.length === 1 ? '' : 's'} in your /migrate selection. This is an editable instance-count assumption.`}
          onClear={() => updateContext({ estateInstances: '' })}
        />
      )}
      <header>
        <h2 className="text-lg font-semibold">Skills &amp; Team Plan</h2>
        <p className="text-sm text-muted-foreground">
          Size and source a fictional migration team. Delivery and coordination allocations add to
          the same headline shown in the export.
        </p>
      </header>
      <section className="glass-panel p-4 space-y-3">
        <label htmlFor="skills-estate-instances" className="block text-sm font-semibold">
          Estate-size estimate
        </label>
        <p className="text-xs text-muted-foreground">
          Use one consistent CBOM instance-count definition; do not add unlike counts of endpoints,
          HSMs and suppliers.
        </p>
        <Input
          id="skills-estate-instances"
          type="number"
          min="1"
          step="1"
          value={state.estateInstances}
          onChange={(event) => updateContext({ estateInstances: event.target.value })}
        />
        <div role="radiogroup" aria-label="Program stage" className="flex flex-wrap gap-2">
          <Button
            role="radio"
            aria-checked={state.sizingPhase === 'early'}
            onClick={() => updateContext({ sizingPhase: 'early' })}
          >
            Year 1–2 (1:{FTE_PER_CRYPTO_INSTANCES})
          </Button>
          <Button
            role="radio"
            aria-checked={state.sizingPhase === 'production'}
            onClick={() => updateContext({ sizingPhase: 'production' })}
          >
            Production rollout (1:{FTE_PER_CRYPTO_INSTANCES_PRODUCTION})
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
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
      </section>
      <TeamAllocationEditor
        context={context}
        draft={state.allocationDraft}
        onEdit={(id, value) =>
          setState((previous) => ({
            ...previous,
            allocationDraft: editTeamAllocation(
              contextFor(previous),
              previous.allocationDraft,
              id,
              value
            ),
          }))
        }
        onReset={() => {
          setState((previous) => ({
            ...previous,
            allocationDraft: seedTeamAllocation(contextFor(previous)),
          }))
          setNotice('Sample allocations reset.')
        }}
        renderRoleDetail={(id) => (
          <>
            <p className="text-xs text-muted-foreground">NICE work roles: {niceTitles(id)}</p>
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label={`${ROLE_CROSSWALK[id].label} sourcing`}
            >
              {SOURCING_OPTIONS.map((option) => (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  aria-pressed={state.sourcing[id] === option}
                  className={
                    state.sourcing[id] === option
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/40'
                      : 'text-muted-foreground'
                  }
                  title={SOURCING_LABEL[option]}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      sourcing: { ...previous.sourcing, [id]: option },
                    }))
                  }
                >
                  {option}
                </Button>
              ))}
            </div>
          </>
        )}
      />
      <section className="glass-panel p-4 text-xs text-muted-foreground">
        <h3 className="font-semibold">Where this sizing comes from</h3>
        <p>
          Reference:{' '}
          <a
            href={FRAMEWORK_URL}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {FRAMEWORK_NAME} §5
          </a>
          . Reference ratio: one FTE per {FTE_PER_CRYPTO_INSTANCES} instances in the early phase,
          then one per {FTE_PER_CRYPTO_INSTANCES_PRODUCTION} during production rollout. The Hub uses
          that ratio to seed delivery and adds coordination separately; this population split is a
          fictional teaching assumption, not a source-prescribed staffing allocation or adequacy
          finding.
        </p>
        <p>
          Governance reading:{' '}
          <a
            href="https://doi.org/10.6028/NIST.CSWP.39-upd1"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            NIST CSWP 39 §5
          </a>
          .
        </p>
      </section>
      {assessment.status === 'ready' ? (
        <ExportableArtifact
          title="Skills & Team Plan — Export"
          exportData={markdown}
          filename="skills-team-plan"
          formats={['markdown', 'pdf', 'docx']}
          wideTable
          onExport={handleExport}
        >
          <p className="text-sm">
            Save or export the current role allocations, total and sourcing choices.
          </p>
        </ExportableArtifact>
      ) : (
        <p className="text-sm">Correct the inputs to enable saving and export.</p>
      )}
    </div>
  )
}
export default SkillsTeamPlan
