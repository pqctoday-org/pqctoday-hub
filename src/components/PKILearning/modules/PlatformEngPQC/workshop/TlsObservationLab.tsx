// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  TLS_CAPTURE_SAMPLES,
  TLS_SAMPLE_ALERT_RULES,
  TLS_PROMTOOL_TESTS,
  parseTlsObservation,
  tlsObservationMetric,
  groupDecision,
} from '../data/tlsObservationSample'

export function TlsObservationLab() {
  const [output, setOutput] = useState<string>(TLS_CAPTURE_SAMPLES.hybrid.output)
  const [exitCode, setExitCode] = useState(0)
  const observation = useMemo(() => parseTlsObservation(output, exitCode), [output, exitCode])
  return (
    <section className="glass-panel p-4 space-y-4" aria-label="TLS observation sample lab">
      <h3 className="text-sm font-bold">Test a negotiated-group alert</h3>
      <p className="text-sm text-muted-foreground">
        These two OpenSSL 3.6.3 captures use a fictional service. Their TLS cipher suite and RSA-PSS
        authentication are identical; the separately observed key-exchange group differs. This
        sample policy permits both X25519MLKEM768 and classical X25519 fallback. Neither establishes
        PQC authentication.
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          { kind: 'hybrid', sample: TLS_CAPTURE_SAMPLES.hybrid },
          { kind: 'classical', sample: TLS_CAPTURE_SAMPLES.classical },
        ].map(({ kind, sample }) => (
          <Button
            key={kind}
            variant="outline"
            onClick={() => {
              setOutput(sample.output)
              setExitCode(0)
            }}
          >
            Load {kind} capture
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() =>
            setOutput(
              TLS_CAPTURE_SAMPLES.hybrid.output.replace(
                'Negotiated TLS1.3 group: X25519MLKEM768\n',
                ''
              )
            )
          }
        >
          Remove group observation
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setOutput(TLS_CAPTURE_SAMPLES.hybrid.output.replace('X25519MLKEM768', 'secp384r1'))
            setExitCode(0)
          }}
        >
          Load authored outside-policy case
        </Button>
      </div>
      <label className="block text-sm">
        OpenSSL brief output
        <textarea
          className="w-full min-h-48 font-mono text-xs bg-muted border rounded p-2"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Process exit code
        <input
          type="number"
          value={exitCode}
          className="ml-2 border rounded p-1 bg-muted"
          onChange={(e) => setExitCode(e.target.value === '' ? 1 : Number(e.target.value))}
        />
      </label>
      <p role="status" className="font-semibold">
        {groupDecision(observation)}
      </p>
      <p className="text-xs text-muted-foreground">
        The browser parses this supplied observation; it does not contact a server or run
        Prometheus. Editing an observation immediately changes the result. A missing group never
        becomes a guess from the cipher suite.
      </p>
      <details open>
        <summary>Derived sample metric (schema 1)</summary>
        <pre className="text-xs overflow-x-auto">{tlsObservationMetric(observation)}</pre>
      </details>
      <details>
        <summary>Copy sample-rules.yml</summary>
        <pre className="text-xs overflow-x-auto">{TLS_SAMPLE_ALERT_RULES}</pre>
      </details>
      <details>
        <summary>Copy sample-tests.yml and run promtool</summary>
        <pre className="text-xs overflow-x-auto">{JSON.stringify(TLS_PROMTOOL_TESTS, null, 2)}</pre>
        <pre className="text-xs overflow-x-auto">
          {'promtool check rules sample-rules.yml\npromtool test rules sample-tests.yml'}
        </pre>
        <p className="text-xs">
          Tested with promtool 3.15.0. The seven cases check allowed hybrid, permitted classical
          fallback, missing group, outside-policy group, failed/incomplete observations and missing
          collection. Only the first two inputs are captured connections; the other cases are
          authored tests.
        </p>
      </details>
      <p className="text-xs text-muted-foreground">
        For your production tools, establish an exporter contract for these separate fields, verify
        peer validation and group collection, bound target labels, replace old observations on each
        scrape, and test collection outages. This custom metric is not an existing Istio/Envoy
        metric. An outside-policy group calls for investigation; it does not by itself prove an
        attack.
      </p>
    </section>
  )
}
