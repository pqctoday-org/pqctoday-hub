// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyTester — a Plane-1 "what would the policy decide?" dry-run. Pick an
// algorithm and whether it's a NEW key or an EXISTING one, and see the engine's
// decision (Allow / Deny / Rekey) WITHOUT creating any keys or touching the
// store. Teaches the agility engine directly and lets you probe a policy before
// running a lifecycle.
import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipEngine, DryRunResult } from '@/wasm/kmip/kmipEngine'

const TEST_ALGOS: { value: string; kind: 'sig' | 'kem' | 'sym' }[] = [
  { value: 'ECDSA-P256', kind: 'sig' },
  { value: 'RSA-3072', kind: 'sig' },
  { value: 'ECDH-P256', kind: 'kem' },
  { value: 'ML-DSA-65', kind: 'sig' },
  { value: 'ML-DSA-87', kind: 'sig' },
  { value: 'ML-KEM-768', kind: 'kem' },
  { value: 'ML-KEM-1024', kind: 'kem' },
  { value: 'AES-256', kind: 'sym' },
]

const decisionTone: Record<DryRunResult['kind'], string> = {
  Allow: 'bg-status-success/15 text-status-success',
  Rekey: 'bg-status-warning/15 text-status-warning',
  Deny: 'bg-destructive/15 text-destructive',
}

export function PolicyTester({ engine }: { engine: KmipEngine }) {
  const [algo, setAlgo] = useState('ECDSA-P256')
  const [existing, setExisting] = useState(false)
  const [result, setResult] = useState<DryRunResult | null>(null)

  const test = () => {
    const kind = TEST_ALGOS.find((a) => a.value === algo)?.kind ?? 'sig'
    const newOp =
      kind === 'sym'
        ? 'Create'
        : kind === 'kem'
          ? 'CreateKeyPair:KeyAgreement'
          : 'CreateKeyPair:Sign'
    const existOp = kind === 'sig' ? 'Sign' : 'Encrypt'
    const spec = existing ? { op: existOp, currentAlgorithm: algo } : { op: newOp, algorithm: algo }
    setResult(engine.dryRun(spec))
  }

  const summary = (r: DryRunResult): string => {
    if (r.kind === 'Rekey')
      return `policy would migrate ${r.from} → ${r.to}${r.reason ? ` — ${r.reason}` : ''}`
    if (r.kind === 'Deny') return r.reason ?? 'denied by policy'
    return r.algorithm
      ? `allowed; policy resolves the algorithm to ${r.algorithm}`
      : 'allowed by policy'
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
        <FlaskConical size={12} className="text-primary" /> Test a decision (dry-run, nothing is
        created)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value)}
          aria-label="Algorithm to test"
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          {TEST_ALGOS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.value}
            </option>
          ))}
        </select>
        <label className="text-[11px] text-muted-foreground flex items-center gap-1">
          <input
            type="checkbox"
            checked={existing}
            onChange={(e) => setExisting(e.target.checked)}
          />
          existing key (test migration)
        </label>
        <Button size="sm" variant="secondary" onClick={test} className="h-7 px-2 text-xs gap-1">
          <FlaskConical size={12} /> Test
        </Button>
      </div>
      {result && (
        <div className="mt-2 text-xs">
          <span className={`px-1.5 py-0.5 rounded font-semibold ${decisionTone[result.kind]}`}>
            {result.kind}
          </span>
          <span className="text-muted-foreground ml-2">{summary(result)}</span>
        </div>
      )}
    </div>
  )
}
