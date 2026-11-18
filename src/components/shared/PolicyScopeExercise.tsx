// SPDX-License-Identifier: AGPL-3.0-only
import { useContext, useState } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { LearnModuleContext } from '@/components/PKILearning/common/useLearnPath'
import { getModuleDecisionScenario } from '@/data/moduleDecisionScenarios'
import { evaluateSamplePolicy } from '@/utils/policyContradictionEvaluator'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { rowsToCsv } from '@/services/export/csvExport'

export function PolicyScopeExercise({ moduleId }: { moduleId?: string } = {}) {
  const contextModuleId = useContext(LearnModuleContext)
  const resolvedModuleId = moduleId ?? contextModuleId
  const scenario = resolvedModuleId ? getModuleDecisionScenario(resolvedModuleId) : undefined

  const [algorithm, setAlgorithm] = useState('ML-DSA-65')
  const [useCase, setUseCase] = useState<'signature' | 'key-establishment'>('key-establishment')
  const [year, setYear] = useState('2031')
  const [applies, setApplies] = useState(true)
  const [longRetention, setLongRetention] = useState(true)
  const [result, setResult] = useState<ReturnType<typeof evaluateSamplePolicy> | null>(null)
  const [receiptInputs, setReceiptInputs] = useState('')
  const [error, setError] = useState('')
  const clear = () => {
    setResult(null)
    setError('')
  }
  const policy = {
    id: scenario ? `FICTIONAL-${scenario.moduleId.toUpperCase()}` : 'FICTIONAL-PORTAL',
    revision: '1',
    source: scenario
      ? `Hub-authored fictional policy (${scenario.domainTitle})`
      : 'Hub-authored fictional organizational policy',
    applies,
    deadlineYear: 2030,
  }
  return (
    <details className="glass-panel p-4 space-y-3">
      <summary className="font-semibold cursor-pointer">
        Practice: policy scope, algorithm use and retention risk
      </summary>
      {scenario && (
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
        Fictional customer-portal policy revision 1 requires migration by 2030 where it applies.
        This is a sample organizational choice. The portal currently uses quantum-vulnerable key
        establishment; compare its transition with an assumed eight-year threat horizon. Predict
        which problems are policy violations, primitive mismatches or scenario risks before
        checking.
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
        <FilterDropdown
          ariaLabel="Sample operation"
          selectedId={useCase}
          hideDefaultOption
          items={['signature', 'key-establishment']}
          onSelect={(id) => {
            setUseCase(id as typeof useCase)
            clear()
          }}
        />
      </div>
      <label className="block text-sm">
        Migration completion year
        <input
          className="ml-2 border rounded bg-background p-1 w-24"
          type="number"
          min={2026}
          max={2100}
          value={year}
          onChange={(event) => {
            setYear(event.target.value)
            clear()
          }}
        />
      </label>
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
      <label className="flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={longRetention}
          onChange={(event) => {
            setLongRetention(event.target.checked)
            clear()
          }}
        />
        Long-lived data: retention 10 years and migration 3 years (otherwise 3 + 2)
      </label>
      <Button
        onClick={() => {
          if (!/^\d{4}$/.test(year) || Number(year) < 2026 || Number(year) > 2100) {
            setResult(null)
            setError('Enter a whole completion year from 2026 to 2100.')
            return
          }
          setError('')
          const inputs = {
            algorithm,
            useCase,
            completionYear: Number(year),
            quantumVulnerableDuringTransition: true,
            policy,
            retentionYears: longRetention ? 10 : 3,
            migrationYears: longRetention ? 3 : 2,
            threatHorizonYears: 8,
          }
          setResult(evaluateSamplePolicy(inputs))
          setReceiptInputs(JSON.stringify(inputs))
        }}
      >
        Evaluate the fictional scenario
      </Button>
      {error && (
        <p role="alert" className="text-sm text-status-error">
          {error}
        </p>
      )}
      <div role="status" aria-live="polite" className="text-sm">
        {result && (
          <>
            <p>Scenario arithmetic: {result.exposureYears} years beyond the assumed horizon.</p>
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
              Try ML-KEM-768 for key establishment, completion 2030 and the shorter
              retention/migration assumptions; then remove policy applicability and explain why a
              risk can remain.
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
          exportData={`# Fictional policy exercise\n\nInputs: ${receiptInputs}\n\n${result.findings.map((f) => `${f.kind}: ${f.message}`).join('\n\n')}\n\nScenario excess: ${result.exposureYears} years. Sample results, separate from evidence checklists.`}
          csvData={rowsToCsv([
            ['Kind', 'Value'],
            ['Inputs', receiptInputs],
            ['Scenario excess years', result.exposureYears],
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
