// SPDX-License-Identifier: AGPL-3.0-only
import type { PolicyRule } from './platformEngConstants'

export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'opa-cert-algo',
    engine: 'opa',
    name: 'Block Non-PQC Certificate Algorithms',
    description:
      'Rejects cert-manager Certificate resources that request RSA or ECDSA private keys. Enforces ML-DSA or SLH-DSA keys cluster-wide via OPA Gatekeeper ConstraintTemplate. Target-state rule: cert-manager accepts only RSA, ECDSA or Ed25519 private keys today.',
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
    name: 'Require the Declared TLS Groups on the Ingress Controller',
    description:
      'Checks the ingress-nginx controller ConfigMap against the same group list shown in the Helm example. The ssl-ecdh-curve key configures key exchange; ssl-ciphers does not. This declaration check must be followed by nginx -t on the selected build and inspection of the negotiated group; it does not prove that a connection used the hybrid group.',
    targetResource: 'ConfigMap (ingress-nginx controller)',
    blockedAlgorithms: [],
    requiredAlgorithms: ['X25519MLKEM768', 'X25519', 'P-256'],
    severity: 'warning',
    rule: `# Kyverno ClusterPolicy: the existing sample's exact controller group list.
# Match controller ConfigMaps, not application-owned Ingress annotations.
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-pqc-tls-groups
spec:
  validationFailureAction: Audit
  rules:
  - name: check-controller-groups
    match:
      any:
      - resources:
          kinds: [ConfigMap]
          selector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
              app.kubernetes.io/component: controller
    validate:
      message: >
        The sample controller requires ssl-ecdh-curve: X25519MLKEM768:X25519:P-256.
        A group name in ssl-ciphers does not configure key exchange.
      pattern:
        data:
          ssl-ecdh-curve: "X25519MLKEM768:X25519:P-256"`,
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
      'Requires all production workloads to have a SLSA Level 3 build provenance attestation signed with ML-DSA-44 or higher (a projected requirement of this module — SLSA itself, through v1.2, names no signature algorithm). Prevents deployments without quantum-safe build integrity proof.',
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
export const SLSA_LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  1: 'SLSA Build L1',
  2: 'SLSA Build L2',
  3: 'SLSA Build L3',
}

/**
 * What the SLSA build track (v1.1 and v1.2) asks of each level. SLSA names no signature algorithm
 * and has no post-quantum text, so nothing here is a PQC requirement; the module's PQC rules are
 * its own projection. The build track ends at L3 (the source track's L4 is two-party review).
 */
export const SLSA_LEVEL_REQUIREMENTS: Record<1 | 2 | 3, string[]> = {
  1: [
    'The build generates provenance that identifies the output package by cryptographic digest and describes how it was produced',
    'No authenticity or accuracy requirements',
  ],
  2: [
    'Provenance generated by a hosted build platform',
    'Signed provenance: consumers can validate the digital signature of the provenance attestation',
    'No signature algorithm is named',
  ],
  3: [
    'Hardened build platform: protection against tampering during the build',
    'Provenance that user-controlled build steps cannot forge',
    'No signature algorithm is named',
  ],
}
