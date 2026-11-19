// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useRef, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ModuleCapabilitySpec } from '@/data/moduleCapabilityChecklists'
import { downloadBlob } from '@/services/exportBundle'
import type {
  ProductionEvidenceDraft,
  ProductionEvidenceObservation,
} from '@/services/storage/types'
import { useModuleStore } from '@/store/useModuleStore'

const EMPTY_DRAFT: ProductionEvidenceDraft = { scope: '', observations: [] }

function markdownText(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/[\\<>`*_[\]]/g, '\\$&')
}

function observationLabel(observation?: ProductionEvidenceObservation): string {
  const reference = observation?.reference.trim()
  if (!observation || !reference) return 'Evidence missing'
  if (observation.result === 'excluded') return `Proposed scope exclusion: ${reference}`
  return `Observed ${observation.result === 'pass' ? 'pass' : 'failure'}: ${reference}`
}

function scopeVerdict(observations: (ProductionEvidenceObservation | undefined)[]) {
  const cited = observations.filter((entry) => entry?.reference.trim())
  const label = cited.some((entry) => entry?.result === 'fail')
    ? 'A requirement failed'
    : cited.length !== observations.length
      ? 'Evidence missing'
      : cited.some((entry) => entry?.result === 'excluded')
        ? 'Scope exclusions require review'
        : 'Ready for review'
  return { label, count: cited.length }
}

export function ProductionEvidenceWorksheet({
  spec,
  ref,
  onReturn,
}: {
  spec: ModuleCapabilitySpec
  ref?: Ref<HTMLDetailsElement>
  onReturn?: () => void
}) {
  const id = useId()
  const scopeInput = useRef<HTMLInputElement>(null)
  const draft = useModuleStore(
    (state) => state.modules[spec.moduleId]?.productionEvidence ?? EMPTY_DRAFT
  )
  const scope = draft.scope.trim()
  const availableScopes = [...new Set(draft.observations.map((entry) => entry.scope))].filter(
    (previous) => previous !== scope
  )
  const comparisonScope =
    scope && availableScopes.find((previous) => previous === draft.comparisonScope)
  const save = (next: ProductionEvidenceDraft) =>
    useModuleStore.getState().updateModuleProgress(spec.moduleId, { productionEvidence: next })

  const rows = spec.productionCapabilities.map((requirement) => {
    const history = draft.observations.filter((entry) => entry.requirement === requirement)
    return {
      requirement,
      last: history.at(-1),
      current: history.find((entry) => entry.scope === scope),
      baseline: history.find((entry) => entry.scope === comparisonScope),
    }
  })
  const result = scopeVerdict(rows.map(({ current }) => current))
  const baselineResult = scopeVerdict(rows.map(({ baseline }) => baseline))

  const record = (entry: ProductionEvidenceObservation) =>
    save({
      ...draft,
      observations: [
        ...draft.observations.filter(
          (previous) => previous.requirement !== entry.requirement || previous.scope !== entry.scope
        ),
        entry,
      ],
    })

  const download = () => {
    const report = [
      '# Production evidence worksheet',
      '',
      `Workshop: ${spec.moduleId}`,
      `Roles: ${spec.roleFocus}`,
      `Environment and build: ${markdownText(scope || 'Unspecified')}`,
      `Review status: ${result.label}`,
      '',
      'Learner-recorded observations. Review the referenced evidence before making a deployment decision.',
      'A proposed scope exclusion records why a requirement may not apply to this build. The reviewer decides whether to accept the exclusion.',
      '',
      ...rows.flatMap(({ requirement, last, current }) => [
        `## ${requirement}`,
        current?.reference.trim()
          ? markdownText(observationLabel(current))
          : last && !current
            ? `Prior observation applies to ${markdownText(last.scope)}. Collect evidence for the current scope.`
            : 'Evidence missing.',
        '',
      ]),
      ...(comparisonScope
        ? [
            '## Build comparison',
            '',
            `Baseline: ${markdownText(comparisonScope)}`,
            `Current: ${markdownText(scope)}`,
            `Baseline review status: ${baselineResult.label}`,
            `Current review status: ${result.label}`,
            '',
            ...rows.flatMap(({ requirement, baseline, current }) => [
              `### ${requirement}`,
              `Baseline — ${markdownText(observationLabel(baseline))}`,
              `Current — ${markdownText(observationLabel(current))}`,
              '',
            ]),
          ]
        : []),
      '## How to evaluate',
      spec.evaluationMethod,
      '',
      '## Evidence to collect',
      spec.evidenceRequired,
      '',
      ...(spec.sources?.length
        ? [
            '## References for requirement scope',
            '',
            ...spec.sources.map(({ label, href }) => `- [${markdownText(label)}](<${href}>)`),
            '',
          ]
        : []),
      spec.educationalBoundary,
      '',
    ].join('\n')
    downloadBlob(
      new Blob([report], { type: 'text/markdown;charset=utf-8' }),
      `production-evidence-${spec.moduleId}.md`
    )
  }

  return (
    <details
      ref={ref}
      id="production-evidence-worksheet"
      className="rounded-lg border border-border p-3"
    >
      <summary className="scroll-mt-24 cursor-pointer font-semibold text-foreground">
        Record evidence for your environment
      </summary>
      <div className="mt-3 space-y-3">
        <p id={`${id}-scope-help`} className="text-xs">
          Identify the tested build and configuration. Use reference IDs for observations. For a
          proposed exclusion, record the system boundary or rule and why it excludes this build.
        </p>
        <label htmlFor={`${id}-scope`} className="block space-y-1 text-foreground">
          <span>Environment and build</span>
          <Input
            id={`${id}-scope`}
            ref={scopeInput}
            value={draft.scope}
            maxLength={200}
            aria-describedby={`${id}-scope-help`}
            onChange={(event) => save({ ...draft, scope: event.target.value })}
          />
        </label>
        {rows.map(({ requirement, last, current }, index) => (
          <fieldset
            key={requirement}
            className="min-w-0 space-y-2 rounded-md border border-border p-3"
          >
            <legend className="max-w-full px-1 font-medium text-foreground">{requirement}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block space-y-1">
                <span>Observation</span>
                {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
                <select
                  className="block min-h-11 w-full rounded-md border border-input bg-background px-2 text-foreground"
                  value={current?.result ?? ''}
                  disabled={!scope}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value === 'pass' || value === 'fail' || value === 'excluded') {
                      record({ requirement, scope, result: value, reference: '' })
                    } else {
                      save({
                        ...draft,
                        observations: draft.observations.filter(
                          (previous) =>
                            previous.requirement !== requirement || previous.scope !== scope
                        ),
                      })
                    }
                  }}
                >
                  <option value="">Not tested</option>
                  <option value="pass">Observed pass</option>
                  <option value="fail">Observed failure</option>
                  <option value="excluded">Propose scope exclusion</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span>
                  {current?.result === 'excluded'
                    ? 'Scope rationale and reference'
                    : 'Evidence reference'}
                </span>
                <Input
                  value={current?.reference ?? ''}
                  disabled={!current}
                  maxLength={300}
                  aria-describedby={last && !current ? `${id}-prior-${index}` : undefined}
                  onChange={(event) => {
                    if (current) record({ ...current, reference: event.target.value })
                  }}
                />
              </label>
            </div>
            {last && !current && (
              <p id={`${id}-prior-${index}`} className="break-words text-xs">
                Prior observation applies to {last.scope}. Collect evidence for this scope.
              </p>
            )}
          </fieldset>
        ))}
        <p role="status" className="font-medium text-foreground">
          {result.label}. {result.count} of {rows.length} requirements have a reference or scope
          rationale.
        </p>
        {scope && availableScopes.length > 0 && (
          <section
            aria-labelledby={`${id}-comparison`}
            className="space-y-2 rounded-md border border-border p-3"
          >
            <h3 id={`${id}-comparison`} className="font-medium text-foreground">
              Compare builds
            </h3>
            <label className="block space-y-1">
              <span>Baseline environment and build</span>
              {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
              <select
                className="block min-h-11 w-full rounded-md border border-input bg-background px-2 text-foreground"
                value={comparisonScope || ''}
                onChange={(event) =>
                  save({ ...draft, comparisonScope: event.target.value || undefined })
                }
              >
                <option value="">Choose a saved build</option>
                {availableScopes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            {comparisonScope && (
              <>
                <p>Baseline review status: {baselineResult.label}</p>
                <p>Current review status: {result.label}</p>
                {rows.map(({ requirement, baseline, current }) => (
                  <dl key={requirement} className="space-y-1 border-t border-border pt-2">
                    <dt className="font-medium text-foreground">{requirement}</dt>
                    <dd className="break-words">Baseline — {observationLabel(baseline)}</dd>
                    <dd className="break-words">Current — {observationLabel(current)}</dd>
                  </dl>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => {
                    save({ ...draft, scope: comparisonScope, comparisonScope: scope })
                    scopeInput.current?.focus()
                  }}
                >
                  Open baseline as current build
                </Button>
              </>
            )}
          </section>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={download}>
            Download evidence worksheet
          </Button>
          {onReturn && (
            <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={onReturn}>
              Return to workshop
            </Button>
          )}
        </div>
      </div>
    </details>
  )
}
