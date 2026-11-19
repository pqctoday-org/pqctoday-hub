// SPDX-License-Identifier: AGPL-3.0-only
import { useContext, useState } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { LearnModuleContext } from '@/components/PKILearning/common/useLearnPath'
import { getModuleDecisionScenario } from '@/data/moduleDecisionScenarios'
import { evaluateSamplePolicy, type SamplePolicyInputs } from '@/utils/policyContradictionEvaluator'
import { modulePolicyScopeSample } from '@/data/modulePolicyScopeSamples'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { rowsToCsv } from '@/services/export/csvExport'

const SAMPLE_MIGRATION_START = 2028

export function PolicyScopeExercise({ moduleId }: { moduleId?: string } = {}) {
  const contextModuleId = useContext(LearnModuleContext)
  const resolvedModuleId = moduleId ?? contextModuleId
  const scenario = resolvedModuleId ? getModuleDecisionScenario(resolvedModuleId) : undefined

  const sample = modulePolicyScopeSample(resolvedModuleId)
  const [algorithm, setAlgorithm] = useState(
    sample?.operation === 'signature' ? 'ML-KEM-768' : 'ML-DSA-65'
  )
  const [useCase, setUseCase] = useState<SamplePolicyInputs['useCase']>(
    sample?.operation ?? 'key-establishment'
  )
  const [year, setYear] = useState('2031')
  const [applies, setApplies] = useState(true)
  const [longRetention, setLongRetention] = useState(true)
  const [checked, setChecked] = useState<{
    inputs: SamplePolicyInputs & { selectedScope?: string }
    result: ReturnType<typeof evaluateSamplePolicy>
  } | null>(null)
  const result = checked?.result
  const receiptInputs = checked ? JSON.stringify(checked.inputs) : ''
  const retentionYears = longRetention
    ? (sample?.longRetentionYears ?? 10)
    : (sample?.shortRetentionYears ?? 3)
  const migrationYears = sample ? Number(year) - SAMPLE_MIGRATION_START : longRetention ? 3 : 2
  const threatHorizonYears = sample?.horizonYears ?? 8
  const horizonSummary =
    result &&
    (useCase === 'signature'
      ? 'HNDL arithmetic applies to confidentiality during key establishment. Evaluate the required lifetime of signing trust separately.'
      : result.exposureYears > 0
        ? `Scenario arithmetic: ${result.exposureYears} years beyond the assumed horizon.`
        : result.exposureYears === 0
          ? 'Scenario arithmetic: retention plus migration reaches the assumed horizon with zero margin.'
          : `Scenario arithmetic: ${Math.abs(result.exposureYears)} years of margin before the assumed horizon.`)
  const [error, setError] = useState('')
  const clear = () => {
    setChecked(null)
    setError('')
  }
  const policy = {
    id: scenario ? `FICTIONAL-${scenario.moduleId.toUpperCase()}` : 'FICTIONAL-PORTAL',
    revision: '1',
    source: sample?.clause ?? 'Hub-authored fictional organizational policy',
    applies,
    deadlineYear: 2030,
  }
  return (
    <details className="glass-panel p-4 space-y-3">
      <summary className="font-semibold cursor-pointer">
        Practice: policy scope, algorithm use and retention risk
      </summary>
      {scenario && !sample && (
        <div className="rounded border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1">
          <p className="font-semibold text-foreground">{scenario.domainTitle}</p>
          <p className="text-muted-foreground">{scenario.roleDecisionPrompt}</p>
          <p>
            <strong>Transfer question:</strong> {scenario.transferQuestion.prompt}
          </p>
          <details>
            <summary className="cursor-pointer">Compare your reasoning</summary>
            <p>{scenario.transferQuestion.changedAssumptionOutcome}</p>
          </details>
        </div>
      )}
      <p className="text-sm">
        {sample
          ? `${sample.clause} The sample migration starts in ${SAMPLE_MIGRATION_START}. Predict what changes if you evaluate this instead: ${sample.outside}.`
          : 'Fictional customer-portal policy revision 1 requires migration by 2030 where it applies. The portal uses classical key establishment during transition. Compare the sample with an assumed eight-year horizon.'}{' '}
        Predict which outcomes concern the policy, the chosen primitive or the exposure model.
      </p>
      <div className="flex flex-wrap gap-3">
        <FilterDropdown
          ariaLabel="Sample algorithm"
          selectedId={algorithm}
          hideDefaultOption
          items={['ML-KEM-768', 'ML-DSA-65']}
          onSelect={(id) => {
            setAlgorithm(id)
            clear()
          }}
        />
        {sample ? (
          <p className="self-center text-sm">
            Required operation:{' '}
            {sample.operation === 'signature' ? 'digital signature' : 'key establishment'}
          </p>
        ) : (
          <FilterDropdown
            ariaLabel="Sample operation"
            selectedId={useCase}
            hideDefaultOption
            items={['signature', 'key-establishment']}
            onSelect={(id) => {
              setUseCase(id as SamplePolicyInputs['useCase'])
              clear()
            }}
          />
        )}
      </div>
      <label className="block text-sm">
        Migration completion year
        <input
          className="ml-2 border rounded bg-background p-1 w-24"
          type="number"
          min={sample ? SAMPLE_MIGRATION_START : 2026}
          max={2100}
          value={year}
          onChange={(event) => {
            setYear(event.target.value)
            clear()
          }}
        />
      </label>
      {sample ? (
        <label className="block text-sm">
          System or artifact to evaluate
          {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserves <label> association, combobox role, and selectOption() form/test semantics */}
          <select
            className="mt-1 block max-w-full rounded border bg-background p-2"
            value={applies ? 'covered' : 'outside'}
            onChange={(event) => {
              setApplies(event.target.value === 'covered')
              clear()
            }}
          >
            <option value="covered">{sample.covered}</option>
            <option value="outside">{sample.outside}</option>
          </select>
        </label>
      ) : (
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={applies}
            onChange={(event) => {
              setApplies(event.target.checked)
              clear()
            }}
          />
          The fictional portal policy applies
        </label>
      )}
      {useCase === 'key-establishment' && (
        <div className="space-y-1">
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={longRetention}
              onChange={(event) => {
                setLongRetention(event.target.checked)
                clear()
              }}
            />
            {sample
              ? `Long-lived data: ${sample.longRetentionYears} years of retention (otherwise ${sample.shortRetentionYears})`
              : 'Long-lived data: retention 10 years and migration 3 years (otherwise 3 + 2)'}
          </label>
          {sample && (
            <p className="text-xs text-muted-foreground">
              Sample horizon: {threatHorizonYears} years. Until the migration finishes, key
              establishment is classical. The model adds the duration from {SAMPLE_MIGRATION_START}
              to the completion year to the retention period.
            </p>
          )}
        </div>
      )}
      <Button
        onClick={() => {
          const firstYear = sample ? SAMPLE_MIGRATION_START : 2026
          if (!/^\d{4}$/.test(year) || Number(year) < firstYear || Number(year) > 2100) {
            setChecked(null)
            setError(`Enter a whole completion year from ${firstYear} to 2100.`)
            return
          }
          setError('')
          const inputs = {
            algorithm,
            useCase,
            completionYear: Number(year),
            quantumVulnerableDuringTransition: true,
            policy,
            retentionYears,
            migrationYears,
            threatHorizonYears,
            ...(sample && { selectedScope: applies ? sample.covered : sample.outside }),
          }
          setChecked({ inputs, result: evaluateSamplePolicy(inputs) })
        }}
      >
        Evaluate the fictional scenario
      </Button>
      {error && (
        <p role="alert" className="text-sm text-status-error">
          {error}
        </p>
      )}
      <div role="status" aria-label="Policy scenario result" className="text-sm">
        {result && (
          <>
            <p>{horizonSummary}</p>
            {result.findings.length ? (
              <ul className="list-disc pl-5">
                {result.findings.map((finding) => (
                  <li key={finding.kind}>
                    <strong>{finding.kind}:</strong> {finding.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No contradiction under these sample inputs. Explain which changes removed each
                finding.
              </p>
            )}
            <p>
              {sample
                ? 'Try completing by 2030 and choosing an algorithm for the required operation. Then change the scope and compare the findings.'
                : 'Try ML-KEM-768 for key establishment, completion in 2030 and the shorter retention and migration assumptions. Change policy applicability and explain why a risk can remain.'}
            </p>
          </>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {scenario ? `${scenario.productionToolCheck} ` : ''}
        Evaluate production tools for versioned source clauses and applicability, algorithm/use-case
        checks, transparent assumptions, boundary tests and reproducible outputs. A real deadline
        must be sourced and scoped to the authority, system and use case before enforcement. Passing
        this fictional scenario does not verify a deployed system.
      </p>
      {result && (
        <ExportableArtifact
          title="Fictional policy exercise"
          filename="fictional-policy-exercise"
          formats={['markdown', 'csv']}
          exportData={`# Fictional policy exercise\n\nInputs: ${receiptInputs}\n\n${result.findings.map((f) => `${f.kind}: ${f.message}`).join('\n\n')}\n\n${horizonSummary}`}
          csvData={rowsToCsv([
            ['Kind', 'Value'],
            ['Inputs', receiptInputs],
            ['Horizon interpretation', horizonSummary ?? ''],
            ...result.findings.map((f) => [f.kind, f.message]),
          ])}
        >
          <p className="text-sm">
            Export this sample calculation separately from educational evidence checklists.
          </p>
        </ExportableArtifact>
      )}
    </details>
  )
}
