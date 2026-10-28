// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { XwingKatResult } from '../xwingKat'

export function XwingEvidence() {
  const [results, setResults] = useState<XwingKatResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(false)
  const run = async () => {
    setRunning(true)
    setError(false)
    setResults(null)
    try {
      const { runXwingKat } = await import('../xwingKat')
      setResults(await runXwingKat())
    } catch {
      setError(true)
    } finally {
      setRunning(false)
    }
  }
  return (
    <div className="glass-panel p-4 space-y-3">
      <h4 className="text-sm font-bold">X-Wing reference checks</h4>
      <p className="text-xs text-muted-foreground">
        These checks always run the browser noble implementation, independently of the JWE backend
        picker. They compare public reference inputs with external expected bytes: 3 X-Wing author
        KATs (key generation, encapsulation and decapsulation), 32 NIST ML-KEM-768 ACVP component
        samples, and 1 published X25519 example. Normal encryption uses fresh randomness.
      </p>
      <p className="text-xs text-muted-foreground">
        <a
          className="text-primary underline"
          href="https://github.com/dconnolly/draft-connolly-cfrg-xwing-kem/blob/984c2f7a93b8f8d8f8073ebb53f9f4ce50b5babd/spec/test-vectors.json"
          target="_blank"
          rel="noopener noreferrer"
        >
          X-Wing author source
        </a>{' '}
        · SHA-256 <code>409efe19…3e614d</code>. Construction: draft-connolly-cfrg-xwing-kem-11. The
        draft KATs remain quarantined in the evidence manifest pending independent source/license
        review. A successful comparison does not promote that evidence or establish certification.
      </p>
      <p className="text-xs text-muted-foreground">
        <a
          className="text-primary underline"
          href="https://github.com/usnistgov/ACVP-Server/tree/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files"
          target="_blank"
          rel="noopener noreferrer"
        >
          NIST samples @ 975de31e
        </a>{' '}
        test the ML-KEM component, including modified-ciphertext implicit rejection. The HSM ACVP
        panel additionally checks valid and invalid keys. These are reference samples, not an ACVTS
        session for X-Wing.
      </p>
      <Button variant="outline" onClick={run} disabled={running}>
        {running ? 'Checking reference values…' : 'Run X-Wing reference checks (noble)'}
      </Button>
      <div role="status" aria-live="polite" className="text-xs">
        {error && 'Reference checks could not run. No cases counted as passed.'}
        {!running && !error && !results && 'Not run in this session.'}
        {results &&
          [...new Set(results.map((r) => r.source))].map((source) => {
            const rows = results.filter((r) => r.source === source)
            return (
              <p key={source}>
                {source}: {rows.filter((r) => r.status === 'pass').length}/{rows.length} passed
              </p>
            )
          })}
        {results
          ?.filter((r) => r.status === 'fail')
          .map((r) => (
            <p key={r.id}>Failed: {r.id}</p>
          ))}
      </div>
      <p className="text-xs text-muted-foreground">
        SoftHSM candidate CKM_HPKE is checked separately against seeded CFRG KATs and published
        HPKE/JWE examples in the integration suite. The token does not expose its shared secret;
        direct secret comparisons belong to the engine tests. This panel does not run those tests.
        The JWE example button below checks the selected backend; a normal round trip is separate
        functional evidence.
      </p>
    </div>
  )
}
