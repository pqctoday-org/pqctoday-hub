// SPDX-License-Identifier: AGPL-3.0-only
import type { SshOperationChecks as Checks } from '@/wasm/openssh'

/** Report only executed model checks; legacy or real-protocol results may not
 * carry this separate operation receipt. Never infer checks from old flags. */
export function SshOperationChecks({ checks }: { checks?: Checks }) {
  if (!checks) return null
  return (
    <section
      aria-label="Executed SSH sample checks"
      className="my-3 rounded border border-border p-3 text-xs space-y-1"
    >
      <p className="font-semibold">
        {checks.outcome === 'passed'
          ? 'Sample checks passed'
          : checks.outcome === 'failed'
            ? 'Sample checks failed'
            : 'Sample checks incomplete — operation error'}
      </p>
      <dl>
        {[
          ['Both peers’ shared secrets equal', checks.shared_secret_equal],
          ['Host sample signature verified', checks.host_signature_valid],
          ['Client sample signature verified', checks.client_signature_valid],
        ].map(([label, valid]) => (
          <div key={String(label)} className="flex flex-wrap justify-between gap-x-3">
            <dt>{label}</dt>
            <dd>{valid === null ? 'Not completed' : valid ? 'Pass' : 'Fail'}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground">
        These token-operation checks do not establish full SSH transcript serialization, server
        trust, user authorization or a network connection. Evaluate those separately with your SSH
        tools.
      </p>
    </section>
  )
}
