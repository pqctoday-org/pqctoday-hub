// SPDX-License-Identifier: AGPL-3.0-only
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useState } from 'react'
import { PROVENANCE_PUBLIC_KEY_SHA256, provenanceFilesForCase } from '../data/provenanceSample'

export function ProvenanceSampleLab() {
  const [kind, setKind] = useState<'trusted' | 'changed-artifact' | 'changed-statement'>('trusted')
  const files = provenanceFilesForCase(kind)
  return (
    <section aria-label="Signed provenance sample" className="glass-panel p-4 space-y-4">
      <h3 className="font-bold">Verify a signed fictional build statement</h3>
      <p className="text-sm text-muted-foreground">
        Download all six files into one empty directory, then run the copied Python verifier with
        cosign 3.0.6 and OPA 1.19.1 in your Sandbox terminal. The verifier checks a pinned fictional
        public key, verifies the exact statement bytes, then asks OPA to match the artifact digest
        and allowed builder. The example uses an ECDSA P-256 signature and an in-toto statement with
        a SLSA provenance predicate.
      </p>
      <FilterDropdown
        label="Provenance test case"
        items={[
          { id: 'trusted', label: 'Trusted signed sample' },
          { id: 'changed-artifact', label: 'Artifact changed after signing' },
          { id: 'changed-statement', label: 'Signed statement changed' },
        ]}
        selectedId={kind}
        onSelect={(id) => setKind(id as typeof kind)}
        hideDefaultOption
        noContainer
      />
      <p className="text-sm">
        Expected outcome when you run the verifier:{' '}
        <strong>
          {kind === 'trusted'
            ? 'accepted'
            : kind === 'changed-artifact'
              ? 'rejected by artifact-digest policy'
              : 'rejected by signature verification'}
        </strong>
        . Selecting a case here does not run either tool.
      </p>
      <div className="flex flex-wrap gap-3">
        {Object.entries(files).map(([name, content]) => (
          <a
            className="text-primary underline text-sm"
            key={name}
            download={name}
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`}
          >
            Download {name}
          </a>
        ))}
      </div>
      <pre className="text-xs overflow-x-auto">{'python3 verify-sample.py'}</pre>
      <p className="text-xs break-all">
        Trusted public-key SHA-256: {PROVENANCE_PUBLIC_KEY_SHA256}
      </p>
      <details>
        <summary>Inspect the statement for this case</summary>
        <pre className="text-xs overflow-x-auto">{files['statement.json']}</pre>
      </details>
      <details>
        <summary>Inspect the evidence policy</summary>
        <pre className="text-xs overflow-x-auto">{files['sample-policy.rego']}</pre>
      </details>
      <details>
        <summary>Inspect the verifier and trust pins</summary>
        <pre className="text-xs overflow-x-auto">{files['verify-sample.py']}</pre>
      </details>
      <p className="text-xs text-muted-foreground">
        The offline trust model intentionally omits transparency-log and online identity checks; it
        still verifies the signature. The bundled public key is fictional and its private key was
        discarded. The tested Sandbox build reports cosign v3.0.6+dirty and OPA 1.19.1 with local
        build metadata. Check the versions in your test environment.
      </p>
      <p className="text-xs text-muted-foreground">
        For production, protect the verifier, trust pins and policy as trusted configuration, verify
        signed provenance before passing its contents to policy, and bind it to the artifact
        actually deployed. An annotation—even “true”—is not evidence. This sample does not establish
        SLSA Build L3 isolation or PQC signing; evaluate those capabilities separately.
      </p>
    </section>
  )
}
