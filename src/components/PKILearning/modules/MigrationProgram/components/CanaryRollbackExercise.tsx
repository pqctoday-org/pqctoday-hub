// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'

const EXPECTED_PROBES = 20
const MAX_FAILURE_PERCENT = 5
type Stage = 'ready' | 'held' | 'restored' | 'recovered' | 'passed'

export function CanaryRollbackExercise() {
  const id = useId()
  const [failures, setFailures] = useState(3)
  const [stage, setStage] = useState<Stage>('ready')
  const failurePercent = (failures / EXPECTED_PROBES) * 100
  const rollbackPending = stage === 'held' || stage === 'restored'

  return (
    <section aria-labelledby={id} className="space-y-3 rounded-lg border border-border p-4">
      <h3 id={id} className="font-semibold">
        Decide whether to roll back the canary
      </h3>
      <p className="text-sm text-muted-foreground">
        Review fictional results for 20 connection probes from a gateway pilot. This sample change
        policy holds rollout when more than 5% of probes fail. If the gate fails, restore the
        approved baseline and check its health before attempting another canary.
      </p>
      <div className="space-y-1">
        <label htmlFor={`${id}-failures`} className="block text-sm font-medium">
          Canary probe results
        </label>
        {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright selectOption tests */}
        <select
          id={`${id}-failures`}
          value={failures}
          disabled={rollbackPending}
          onChange={(event) => {
            setFailures(Number(event.target.value))
            setStage('ready')
          }}
          className="w-full rounded-md border border-input bg-background p-2 text-sm sm:w-auto"
        >
          <option value={3}>3 of 20 failed</option>
          <option value={1}>1 of 20 failed</option>
          <option value={0}>All 20 passed</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setStage(failurePercent > MAX_FAILURE_PERCENT ? 'held' : 'passed')}
          disabled={rollbackPending}
        >
          Evaluate canary results
        </Button>
        <Button variant="outline" disabled={stage !== 'held'} onClick={() => setStage('restored')}>
          Restore approved baseline
        </Button>
        <Button
          variant="outline"
          disabled={stage !== 'restored'}
          onClick={() => setStage('recovered')}
        >
          Check baseline health
        </Button>
      </div>
      <div role="status" aria-label="Canary decision" className="space-y-1 text-sm">
        {stage !== 'ready' && (
          <p>
            Canary result {failures} of {EXPECTED_PROBES} probes failed ({failurePercent}%).
          </p>
        )}
        {stage === 'held' && <p>Rollout held. The canary exceeded the sample failure limit.</p>}
        {stage === 'restored' && (
          <p>Baseline restored in the sample. Health checks are still pending.</p>
        )}
        {stage === 'recovered' && (
          <p>
            Baseline health check passed. All 20 sample probes succeeded. Run a new canary before
            expanding rollout.
          </p>
        )}
        {stage === 'passed' && (
          <p>
            The canary meets the sample acceptance threshold. Review it with the change owner before
            expanding rollout.
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        The results come from a training fixture. For a real change, record the tested peer
        configuration, any security exception for the baseline, the recovery probes, and the owner’s
        decision.
      </p>
    </section>
  )
}
