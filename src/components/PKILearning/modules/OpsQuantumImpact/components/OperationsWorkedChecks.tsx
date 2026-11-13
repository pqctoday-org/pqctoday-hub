// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  REWRAP_INVENTORY,
  applyRewrapObservation,
  evaluateModeledKeyGeneration,
  rewrapCounts,
  type ModeledKeyGenerationResponse,
} from '../data/operationsWorkedChecks'

export function OperationsWorkedChecks() {
  const [inventory, setInventory] = useState(REWRAP_INVENTORY)
  const [ledgerMessage, setLedgerMessage] = useState('No observations applied.')
  const [generation, setGeneration] = useState<ReturnType<typeof evaluateModeledKeyGeneration>>()
  const counts = rewrapCounts(inventory)
  const record = (itemId: string, outcome: 'success' | 'failure') => {
    const next = applyRewrapObservation(inventory, {
      itemId,
      requestKeyName: 'sample-app',
      outcome,
      response: { data: { ciphertext: 'vault:v2:abcdefgh' } },
    })
    setInventory(next.inventory)
    setLedgerMessage(next.message)
  }
  const model = (response: ModeledKeyGenerationResponse) =>
    setGeneration(evaluateModeledKeyGeneration(response))

  return (
    <section className="space-y-6 mt-6" aria-label="Worked operations checks">
      <p className="text-sm text-muted-foreground">
        These fictional observations exercise local accounting and decision rules. No Vault server
        or HSM operation runs here, and these controls do not award progress or update an evidence
        store.
      </p>
      <article className="glass-panel p-5 space-y-3" aria-labelledby="rewrap-worked-title">
        <h2 id="rewrap-worked-title" className="text-lg font-semibold">
          Count completed rewraps, not request latency
        </h2>
        <p className="text-sm">
          The existing AES-256-GCM96 example rotates the same named key, sample-app, to version 2. A
          and B start at version 1; C is already at version 2. The caller correlates each result
          with its item and requested key. The ciphertext prefix alone cannot establish key identity
          or authenticate a response.
        </p>
        <ul className="text-sm" aria-label="Rewrap inventory">
          {inventory.map((item) => (
            <li key={item.id}>
              {item.id}: version {item.version}
            </li>
          ))}
        </ul>
        <p aria-live="polite">
          {counts.confirmed} of 3 recorded at target version; {counts.remaining} remaining.
        </p>
        <div className="flex flex-wrap gap-2">
          {(['A', 'B'] as const).map((id) => (
            <Button
              variant="secondary"
              key={id}
              className="min-h-11"
              onClick={() => record(id, 'success')}
            >
              Record {id} success
            </Button>
          ))}
          <Button variant="secondary" className="min-h-11" onClick={() => record('B', 'failure')}>
            Record B failure
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => record('unknown', 'success')}
          >
            Try unknown item
          </Button>
        </div>
        <p className="text-sm" role="status" aria-label="Rewrap observation result">
          {ledgerMessage}
        </p>
        <p className="text-sm text-muted-foreground">
          Apply A success and B failure: 2 recorded, 1 remaining. Repeating A does not count twice.
          A failed B stays pending until a valid correlated result arrives. In your own tooling,
          retain per-item outcomes, checkpoints and retries; a duration metric cannot supply a
          backlog count. These authored responses do not prove ciphertext validity or a real
          migration.
        </p>
        <Link className="text-primary underline" to="/learn/kms-pqc?tab=workshop&step=4">
          Open the maintained KMS migration commands
        </Link>
      </article>
      <article className="glass-panel p-5 space-y-3" aria-labelledby="custody-worked-title">
        <h2 id="custody-worked-title" className="text-lg font-semibold">
          Keep an HSM-required request pending until its requirement is met
        </h2>
        <p className="text-sm">
          This existing signing scenario requires a new HSM-held ML-DSA-65 private key. Select an
          authored response to test the decision. An audit trail records an event; it cannot make a
          software key HSM-held.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => model({ result: 'error' })}
          >
            Model generation error
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() =>
              model({
                result: 'success',
                custody: 'software',
                privateKeyHandle: 257,
                auditRecorded: true,
              })
            }
          >
            Model software key with audit
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => model({ result: 'success', auditRecorded: true })}
          >
            Model audit record only
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => model({ result: 'success', custody: 'hsm', privateKeyHandle: 257 })}
          >
            Model restored HSM response
          </Button>
        </div>
        <p role="status" aria-label="Modeled key request result" className="text-sm">
          {generation
            ? `${generation.state}: ${generation.reason}`
            : 'Not run: no modeled response selected.'}
        </p>
        <p className="text-sm text-muted-foreground">
          A modeled successful response completes only this new-key request. A handle alone does not
          prove hardware custody. In your production tool, inspect the operation result, provider,
          returned key object and required sensitive/non-extractable attributes. Restore a supported
          HSM path or follow the applicable recovery procedure; this exercise does not demonstrate
          backup recovery, preservation of an old key, or high availability. The linked PKCS#11
          lesson executes software-token sample operations, not hardware failover.
        </p>
        <Link className="text-primary underline" to="/learn/hsm-pqc?tab=workshop&step=0">
          Open the PKCS#11 sample operations
        </Link>
      </article>
      <Button
        variant="secondary"
        className="min-h-11"
        onClick={() => {
          setInventory(REWRAP_INVENTORY)
          setLedgerMessage('No observations applied.')
          setGeneration(undefined)
        }}
      >
        Reset worked checks
      </Button>
    </section>
  )
}
