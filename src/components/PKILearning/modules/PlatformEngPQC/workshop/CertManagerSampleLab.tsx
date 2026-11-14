// SPDX-License-Identifier: AGPL-3.0-only
import {
  CERT_MANAGER_SAMPLE,
  CERT_MANAGER_CI_MLDSA_MANIFESTS,
  CERT_MANAGER_MLDSA_MANIFESTS,
  CERT_MANAGER_MLDSA_POLICY,
  CERT_MANAGER_ALPHA_GATE_VALUES,
} from '../data/certManagerAlphaSample'

const policyInput =
  JSON.stringify(
    {
      review: {
        object: {
          apiVersion: 'cert-manager.io/v1',
          kind: 'Certificate',
          spec: {
            privateKey: {
              algorithm: 'MLDSA',
              size: 65,
              encoding: 'PKCS8',
              rotationPolicy: 'Always',
            },
          },
        },
      },
    },
    null,
    2
  ) + '\n'

export function CertManagerSampleLab() {
  const files = {
    'fictional-certificates.yaml': CERT_MANAGER_MLDSA_MANIFESTS,
    'fictional-ci-certificates.yaml': CERT_MANAGER_CI_MLDSA_MANIFESTS,
    'snapshot-gates.yaml': CERT_MANAGER_ALPHA_GATE_VALUES,
    'sample-certificate-policy.rego': CERT_MANAGER_MLDSA_POLICY,
    'sample-review.json': policyInput,
  }
  return (
    <section aria-label="Pinned cert-manager ML-DSA sample" className="glass-panel p-4 space-y-4">
      <h3 className="font-bold">Issue and renew an ML-DSA certificate</h3>
      <p className="text-sm font-semibold">{CERT_MANAGER_SAMPLE.stage}</p>
      <p className="text-sm text-muted-foreground">
        {CERT_MANAGER_SAMPLE.stableBoundary} The copied request targets source commit{' '}
        <a
          className="text-primary underline break-all"
          href={CERT_MANAGER_SAMPLE.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {CERT_MANAGER_SAMPLE.sourceCommit}
        </a>
        . Build the controller, webhook and chart from that same snapshot; enable MLDSAPrivateKeys
        on both processes. Do not apply these values to a released stable chart and expect ML-DSA
        issuance.
      </p>
      <p className="text-sm text-muted-foreground">
        The fictional namespace and SelfSigned issuer issue a certificate with algorithm MLDSA, size
        65, PKCS8 encoding and rotationPolicy Always. A policy match only checks the declared
        profile. Inspect the real issued Secret and certificate, then trigger renewal in your
        management tool and confirm that the new certificate contains a different public key.
      </p>
      <div className="flex flex-wrap gap-3">
        {Object.entries(files).map(([name, content]) => (
          <a
            key={name}
            className="text-primary underline text-sm"
            download={name}
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`}
          >
            Download {name}
          </a>
        ))}
      </div>
      <details open>
        <summary>Inspect the complete fictional manifests</summary>
        <pre className="text-xs overflow-x-auto">{CERT_MANAGER_MLDSA_MANIFESTS}</pre>
      </details>
      <details>
        <summary>Inspect both feature gates</summary>
        <pre className="text-xs overflow-x-auto">{CERT_MANAGER_ALPHA_GATE_VALUES}</pre>
      </details>
      <details>
        <summary>Inspect and evaluate the companion Rego v1 policy</summary>
        <pre className="text-xs overflow-x-auto">{CERT_MANAGER_MLDSA_POLICY}</pre>
        <pre className="text-xs overflow-x-auto">
          {
            'opa check --strict sample-certificate-policy.rego\nopa eval --data sample-certificate-policy.rego --input sample-review.json data.certmanager.pqc.violation'
          }
        </pre>
        <p className="text-xs">
          The valid sample returns an empty violation collection. Change algorithm to MLDSA44 or
          size to 66: the policy reports a violation. A missing size uses the snapshot’s ML-DSA-44
          default. The native API also validates the rest of the resource schema and feature-gate
          state; this companion policy does not replace it.
        </p>
      </details>
      <p className="text-xs text-muted-foreground">
        A SelfSigned certificate is not automatically trusted elsewhere. This sample checks
        certificate signing keys, not TLS key exchange, ACME support or compatibility with every TLS
        consumer. For production, evaluate your selected issuer, consumer, trust configuration,
        feature lifecycle and renewal behavior with the actual versions you plan to operate.
      </p>
    </section>
  )
}
