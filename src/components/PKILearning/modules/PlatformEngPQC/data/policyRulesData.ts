// SPDX-License-Identifier: GPL-3.0-only
import type { PolicyRule } from './platformEngConstants'

export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'opa-cert-algo',
    engine: 'opa',
    name: 'Block Non-PQC Certificate Algorithms',
    description:
      'Rejects cert-manager Certificate resources that request RSA or ECDSA private keys. Enforces ML-DSA or SLH-DSA keys cluster-wide via OPA Gatekeeper ConstraintTemplate.',
    targetResource: 'certificates.cert-manager.io',
    blockedAlgorithms: ['RSA', 'ECDSA', 'Ed25519'],
    requiredAlgorithms: ['MLDSA44', 'MLDSA65', 'MLDSA87', 'SLH-DSA-128'],
    severity: 'error',
    rule: `# OPA Gatekeeper ConstraintTemplate
package certmanager.pqc

violation[{"msg": msg}] {
  input.review.object.kind == "Certificate"
  algo := input.review.object.spec.privateKey.algorithm
  not startswith(lower(algo), "ml")
  not startswith(lower(algo), "slh")
  msg := sprintf(
    "Certificate %v uses quantum-vulnerable algorithm %v. Use MLDSA44, MLDSA65, or SLH-DSA.",
    [input.review.object.metadata.name, algo]
  )
}`,
  },
  {
    id: 'kyverno-image-sig',
    engine: 'kyverno',
    name: 'Require PQC-Signed Container Images',
    description:
      'Blocks any Pod that references a container image without a valid ML-DSA cosign or Notation signature. Prevents unsigned or ECDSA-only signed images from running in production namespaces.',
    targetResource: 'Pod',
    blockedAlgorithms: ['ECDSA-P256', 'RSA-PSS'],
    requiredAlgorithms: ['ML-DSA-65', 'ML-DSA-44'],
    slsaLevel: 3,
    severity: 'error',
    rule: `# Kyverno ClusterPolicy
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-pqc-image-signature
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-pqc-signature
    match:
      any:
      - resources:
          kinds: [Pod]
          namespaces: [production, staging]
    verifyImages:
    - imageReferences: ["*"]
      attestors:
      - count: 1
        entries:
        - keys:
            # ML-DSA-65 cosign public key
            publicKeys: |-
              -----BEGIN PUBLIC KEY-----
              <ML-DSA-65 PUBLIC KEY>
              -----END PUBLIC KEY-----
            signatureAlgorithm: ml-dsa-65
      mutateDigest: true`,
  },
  {
    id: 'kyverno-tls-cipher',
    engine: 'kyverno',
    name: 'Enforce PQC TLS Cipher Groups on Ingress',
    description:
      'Validates nginx Ingress resources to ensure the ssl-ciphers annotation includes the X-Wing hybrid group (X25519MLKEM768) and blocks ECDHE-only cipher configurations.',
    targetResource: 'Ingress',
    blockedAlgorithms: ['ECDHE-RSA', 'ECDHE-ECDSA'],
    requiredAlgorithms: ['X25519MLKEM768', 'X-Wing'],
    severity: 'warning',
    rule: `# Kyverno ClusterPolicy
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-pqc-tls-cipher
spec:
  validationFailureAction: Audit
  rules:
  - name: check-cipher-groups
    match:
      any:
      - resources:
          kinds: [Ingress]
    validate:
      message: >
        Ingress TLS must include X25519MLKEM768 cipher group
        to enable ML-KEM hybrid key exchange.
      pattern:
        metadata:
          annotations:
            nginx.ingress.kubernetes.io/ssl-ciphers: "*X25519MLKEM768*"`,
  },
  {
    id: 'opa-helm-sig',
    engine: 'opa',
    name: 'Require ML-DSA Helm Chart Provenance',
    description:
      'OPA policy evaluated by the Helm admission webhook. Rejects Helm release installations where the chart provenance file (chart.prov) is absent or signed with RSA/ECDSA.',
    targetResource: 'HelmRelease (Flux)',
    blockedAlgorithms: ['RSA-4096', 'ECDSA-P256'],
    requiredAlgorithms: ['ML-DSA-87', 'ML-DSA-65'],
    severity: 'error',
    rule: `# OPA policy for Flux HelmRelease
package flux.helmrelease.pqc

violation[{"msg": msg}] {
  input.review.object.kind == "HelmRelease"
  verify := input.review.object.spec.chart.spec.verify
  verify.provider != "cosign-pqc"
  msg := sprintf(
    "HelmRelease %v must use cosign-pqc ML-DSA provider for chart verification.",
    [input.review.object.metadata.name]
  )
}`,
  },
  {
    id: 'kyverno-vault-key-type',
    engine: 'kyverno',
    name: 'Block Quantum-Vulnerable Vault Transit Keys',
    description:
      'Prevents creation of Vault Transit keys with RSA or ECDSA type via the Vault Secrets Operator. Enforces ml-dsa-44 or aes-256-gcm96 as the only allowed types.',
    targetResource: 'VaultStaticSecret (VSO)',
    blockedAlgorithms: ['ecdsa-p256', 'rsa-2048', 'rsa-4096', 'ed25519'],
    requiredAlgorithms: ['ml-dsa-44', 'ml-dsa-65', 'aes-256-gcm96'],
    severity: 'error',
    rule: `# Kyverno policy for Vault Secrets Operator
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-pqc-vault-transit
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-transit-key-type
    match:
      any:
      - resources:
          kinds: [VaultStaticSecret]
    validate:
      message: >
        Vault Transit keys must use ml-dsa-44, ml-dsa-65, or aes-256-gcm96.
        RSA and ECDSA transit keys are quantum-vulnerable.
      deny:
        conditions:
          any:
          - key: "{{request.object.spec.mount}}"
            operator: Equals
            value: "transit"
          - key: "{{request.object.spec.path}}"
            operator: Contains
            value: "ecdsa"`,
  },
  {
    id: 'opa-slsa-level',
    engine: 'opa',
    name: 'Enforce SLSA Level 3 + PQC Attestation',
    description:
      'Requires all production workloads to have a SLSA Level 3 build provenance attestation signed with ML-DSA-44 or higher (projected requirement — current SLSA v1.0 is algorithm-agnostic). Prevents deployments without quantum-safe build integrity proof.',
    targetResource: 'Deployment',
    blockedAlgorithms: ['ECDSA-P256', 'RSA-PSS'],
    requiredAlgorithms: ['ML-DSA-44', 'ML-DSA-65'],
    slsaLevel: 3,
    severity: 'error',
    rule: `# OPA Gatekeeper ConstraintTemplate
package slsa.pqc

violation[{"msg": msg}] {
  input.review.object.kind == "Deployment"
  ns := input.review.object.metadata.namespace
  ns == "production"

  # Check for SLSA Level 3 PQC attestation annotation
  not input.review.object.metadata.annotations["slsa.dev/pqc-provenance-verified"]

  msg := sprintf(
    "Deployment %v in production requires SLSA Level 3 provenance signed with ML-DSA.",
    [input.review.object.metadata.name]
  )
}`,
  },
]

/** SLSA level labels for display */
export const SLSA_LEVEL_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'SLSA Level 1',
  2: 'SLSA Level 2',
  3: 'SLSA Level 3',
  4: 'SLSA Level 4',
}

/** SLSA requirements per level (PQC-specific projections — current SLSA v1.0 is algorithm-agnostic) */
export const SLSA_LEVEL_REQUIREMENTS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['Build scripts available', 'Build artifacts available', 'Provenance available'],
  2: ['Hosted build platform', 'Authenticated provenance', 'Provenance signed (any algorithm)'],
  3: [
    'Hardened build platform',
    'Non-falsifiable provenance',
    'Provenance signed with ML-DSA or SLH-DSA (projected PQC requirement)',
    'Build environment isolated',
  ],
  4: [
    'Two-party review',
    'Hermetic, reproducible builds',
    'Provenance signed with ML-DSA-87 or SLH-DSA-256 (projected PQC requirement)',
    'All dependencies have SLSA 4 provenance',
  ],
}
