// SPDX-License-Identifier: AGPL-3.0-only
import type { MonitoringTool } from './platformEngConstants'

// ── Monitoring Tools ─────────────────────────────────────────────────────────

export const MONITORING_TOOLS: MonitoringTool[] = [
  {
    id: 'certmanager-metrics',
    name: 'cert-manager Prometheus Exporter',
    source: 'cert-manager',
    description:
      'Compare issuance readiness, expiry and observed certificate identity separately. Readiness and remaining lifetime do not establish the key algorithm or PQC posture. Verify the installed controller/exporter version and representative sample output.',
    metricExamples: [
      'Certificate identity, readiness state and observed validity period.',
      'A separately verified certificate key and signature algorithm source.',
      'Namespace/resource coverage, collection errors and last observation time.',
    ],
    alertExamples: [
      {
        name: 'Certificate policy and coverage check (conceptual)',
        expression:
          'Join observed certificate facts to inventory using stable identifiers, then compare known algorithms and expiry with the applicable policy.',
        threshold:
          'Missing algorithm or incomplete inventory is Unknown; expiry alone does not establish quantum exposure.',
        severity: 'warning',
      },
    ],
    pqcSignal: 'Certificate readiness and inventory requirements — verify sources and coverage',
    integrations: ['Prometheus', 'Grafana', 'AlertManager', 'PagerDuty'],
    exampleKind: 'capability-requirements',
  },
  {
    id: 'vault-audit',
    name: 'HashiCorp Vault Audit Log',
    source: 'vault',
    description:
      'Evaluate the configured audit devices, their schema and the services covered. Do not assume every record exposes plaintext key type or algorithm; check field availability, redaction and correlation to key metadata.',
    metricExamples: [
      'Operation, result, key identity/version and relevant service or mount.',
      'Verified key metadata needed to interpret the operation.',
      'Audit-device configuration, record schema, redaction and collection gaps.',
    ],
    alertExamples: [
      {
        name: 'Key-operation policy check (conceptual)',
        expression:
          'Use documented sample audit records and matching key metadata to distinguish actual algorithm use from an unsupported inference about a path or operation name.',
        threshold:
          'An observed classical operation is a fact to compare with policy, not proof of an attack. Missing required metadata is Unknown.',
        severity: 'warning',
      },
    ],
    pqcSignal: 'Key-operation audit requirements — verify sources and coverage',
    integrations: ['Splunk', 'Elastic SIEM', 'Datadog', 'Prometheus'],
    exampleKind: 'capability-requirements',
  },
  {
    id: 'istio-metrics',
    exampleKind: 'capability-requirements',
    name: 'Istio / Envoy TLS Observability Requirements',
    source: 'istio',
    description:
      'These are observation requirements, not claims that a particular Istio/Envoy version exports every field. A TLS 1.3 cipher-suite name does not identify the negotiated key-exchange group or authentication algorithm. Verify the exporter, collector version and field mappings before designing an alert.',
    metricExamples: [
      'Observed TLS version and negotiated key-exchange group as separate fields.',
      'Peer authentication signature algorithm and certificate-validation outcome.',
      'Connection or workload identity, timestamp and observation coverage.',
      'Exporter/collector versions and documented field mappings.',
    ],
    alertExamples: [
      {
        name: 'Negotiated-group policy check (conceptual)',
        expression:
          'Observe the negotiated key-exchange group separately from the TLS 1.3 cipher suite. Map an available, version-checked telemetry source before comparing a known group with the chosen policy.',
        threshold:
          'Only a known observed group can be compared with policy. If required group data is missing, report Unknown instead of non-PQC.',
        severity: 'warning',
      },
      {
        name: 'Credential rotation pattern (conceptual)',
        expression:
          'Use a documented source to count credential rotations over a defined window and compare them with an explicitly chosen baseline.',
        threshold:
          'Investigate unexpected rotations in context; a rotation count alone does not establish PQC posture or an incident.',
        severity: 'warning',
      },
    ],
    pqcSignal:
      'Evaluate negotiated TLS facts and collection coverage; no verified exporter mapping supplied.',
    integrations: ['Prometheus', 'Grafana', 'Kiali', 'Jaeger'],
  },
  {
    id: 'x509-exporter',
    name: 'x509-certificate-exporter',
    source: 'prometheus',
    description:
      'Evaluate which certificate sources the configured exporter watches and which fields its version emits. Expiry metrics do not identify the key algorithm; recording rules cannot create facts absent from their inputs.',
    metricExamples: [
      'Certificate validity, identity and collection health.',
      'A documented observation of public-key and certificate-signature algorithms.',
      'Configured sources, inaccessible certificates and freshness of each observation.',
    ],
    alertExamples: [
      {
        name: 'Certificate inventory completeness check (conceptual)',
        expression:
          'Inspect sample exported records and reconcile observed sources with the intended inventory before evaluating known algorithms against policy.',
        threshold:
          'Unknown algorithms or unobserved sources remain Unknown; do not describe a partial scan as full cluster coverage.',
        severity: 'warning',
      },
    ],
    pqcSignal: 'Certificate observation and coverage requirements — verify sources and coverage',
    integrations: ['Prometheus', 'Grafana', 'AlertManager'],
    exampleKind: 'capability-requirements',
  },
]

// ── SIEM Integration ──────────────────────────────────────────────────────────

export interface SIEMEventSchema {
  id: string
  name: string
  description: string
  platform: 'Splunk' | 'Elastic' | 'Datadog' | 'Microsoft Sentinel'
  query: string // Non-executable observation and decision guidance
  exampleKind: 'capability-requirements'
  mitreTactic: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export const SIEM_QUERIES: SIEMEventSchema[] = [
  {
    id: 'splunk-ecdsa-signing',
    name: 'Signing-operation policy check',
    description:
      'Conceptual capability checklist for this destination; no verified query or input-field mapping is supplied.',
    platform: 'Splunk',
    query:
      'Correlate a documented operation record with the exact key identity/version and algorithm. Verify the input schema and retention/redaction limits with sample records.\n\nDecision and limits: A known signing algorithm may be compared with the chosen policy. An absent algorithm or failed correlation is Unknown; use alone does not establish an incident.',
    mitreTactic: 'T1553.002 — Code Signing',
    severity: 'high',
    exampleKind: 'capability-requirements',
  },
  {
    id: 'elastic-rsa-cert-issue',
    name: 'Certificate-issuance policy check',
    description:
      'Conceptual capability checklist for this destination; no verified query or input-field mapping is supplied.',
    platform: 'Elastic',
    query:
      'Parse a sample issued certificate and correlate it with the issuance event. Observe its public-key and issuer-signature algorithms separately.\n\nDecision and limits: Missing ML-DSA text in a log does not establish RSA issuance. Unknown certificate facts remain Unknown; apply only a supported, scoped policy.',
    mitreTactic: 'T1587.003 — Digital Certificates',
    severity: 'medium',
    exampleKind: 'capability-requirements',
  },
  {
    id: 'datadog-pipeline-oidc',
    name: 'OIDC signing capability check',
    description:
      'Conceptual capability checklist for this destination; no verified query or input-field mapping is supplied.',
    platform: 'Datadog',
    query:
      'Observe the actual token signing algorithm and validate its issuer/key context using the supported JOSE profile. Check the exact provider version and available algorithms.\n\nDecision and limits: An observed ES256 or RS256 token is not by itself a downgrade. Do not assume the provider supports PQC signing; absent or unverified context is Unknown.',
    mitreTactic: 'T1552.004 — Private Keys',
    severity: 'high',
    exampleKind: 'capability-requirements',
  },
  {
    id: 'sentinel-tls-downgrade',
    name: 'Negotiated TLS group policy check',
    description:
      'Conceptual capability checklist for this destination; no verified query or input-field mapping is supplied.',
    platform: 'Microsoft Sentinel',
    query:
      'Obtain the negotiated group separately from the TLS version and cipher suite. Validate the source/version field mapping with known-group and missing-group sample observations.\n\nDecision and limits: Absence of a group name in log text does not prove non-PQC negotiation. Compare known observations with policy and report Unknown when the required group was not observed.',
    mitreTactic: 'T1040 — Network Sniffing',
    severity: 'medium',
    exampleKind: 'capability-requirements',
  },
]

// ── Capacity Planning Data ────────────────────────────────────────────────────

export interface PQCSizeComparison {
  id: string
  component: string
  classicalAlgo: string
  classicalSize: number // bytes
  pqcAlgo: string
  pqcSize: number // bytes
  hybridSize: number // bytes (classical + pqc combined)
  unit: string
  notes: string
}

export const SIZE_COMPARISONS: PQCSizeComparison[] = [
  {
    id: 'sig-mldsa44',
    component: 'Signature',
    classicalAlgo: 'ECDSA P-256',
    classicalSize: 64,
    pqcAlgo: 'ML-DSA-44',
    pqcSize: 2420,
    hybridSize: 2484,
    unit: 'bytes',
    notes:
      'Container image and artifact signatures increase 38×. OCI referrer layer storage expands accordingly.',
  },
  {
    id: 'sig-mldsa65',
    component: 'Signature',
    classicalAlgo: 'ECDSA P-256',
    classicalSize: 64,
    pqcAlgo: 'ML-DSA-65',
    pqcSize: 3309,
    hybridSize: 3373,
    unit: 'bytes',
    notes:
      'Recommended for container image signing. ~52× larger than ECDSA. TLS handshake Certificate Verify message grows accordingly.',
  },
  {
    id: 'pubkey-mldsa44',
    component: 'Public Key',
    classicalAlgo: 'ECDSA P-256',
    classicalSize: 65,
    pqcAlgo: 'ML-DSA-44',
    pqcSize: 1312,
    hybridSize: 1377,
    unit: 'bytes',
    notes:
      'Public key in X.509 SubjectPublicKeyInfo grows 20×. Affects certificate size and OCSP response payloads.',
  },
  {
    id: 'cert-hybrid',
    component: 'X.509 Certificate',
    classicalAlgo: 'ECDSA P-256 cert',
    classicalSize: 800,
    pqcAlgo: 'ML-DSA-65 cert',
    pqcSize: 5800,
    hybridSize: 6600,
    unit: 'bytes',
    notes: 'Full DER-encoded X.509 cert with SAN, AKI, SKI extensions.',
  },
  {
    id: 'tls-handshake',
    component: 'TLS 1.3 Handshake',
    classicalAlgo: 'ECDSA P-256 + X25519',
    classicalSize: 4096,
    pqcAlgo: 'ML-DSA-65 + ML-KEM-768',
    pqcSize: 18432,
    hybridSize: 20480,
    unit: 'bytes',
    notes:
      'Total bytes exchanged during TLS 1.3 handshake including key share, Certificate, CertificateVerify, and Finished messages. 4.5× increase affects connection latency.',
  },
  {
    id: 'etcd-secret',
    component: 'Kubernetes etcd Secret',
    classicalAlgo: 'RSA-2048 TLS key+cert',
    classicalSize: 3072,
    pqcAlgo: 'ML-DSA-65 TLS key+cert',
    pqcSize: 14336,
    hybridSize: 16384,
    unit: 'bytes',
    notes:
      'cert-manager stores issued key+cert pairs in etcd Secrets. Cluster with 1,000 certs: etcd grows from ~3MB to ~14MB for TLS secrets alone.',
  },
  {
    id: 'sbom-attestation',
    component: 'SBOM Attestation (DSSE)',
    classicalAlgo: 'ECDSA P-256 signature',
    classicalSize: 256,
    pqcAlgo: 'SLH-DSA-128f signature',
    pqcSize: 17088,
    hybridSize: 17344,
    unit: 'bytes',
    notes:
      'SLH-DSA-128f preferred for SBOMs (stateless, long-lived). Signature is 267× larger than ECDSA P-256. Acceptable since SBOMs are read rarely.',
  },
]

export interface CapacityMetric {
  id: string
  label: string
  baselinePerUnit: number // bytes or ms
  pqcPerUnit: number
  unit: string
  description: string
}

export const CAPACITY_METRICS: CapacityMetric[] = [
  {
    id: 'tls-handshake-latency',
    label: 'TLS Handshake Latency (P99)',
    baselinePerUnit: 12,
    pqcPerUnit: 28,
    unit: 'ms',
    description:
      "End-to-end TLS 1.3 handshake time including ML-DSA signature verification. ML-KEM key encapsulation adds ~4ms; ML-DSA verification adds ~10ms on 2024 hardware (this module's planning assumption, not a measurement).",
  },
  {
    id: 'cert-chain-size',
    label: 'TLS Certificate Chain Size',
    baselinePerUnit: 2400,
    pqcPerUnit: 17400,
    unit: 'bytes',
    description:
      '3-cert chain (leaf + intermediate + root). ML-DSA-65 chain is 7.25× larger. May exceed TLS record size limits with naïve implementation — use certificate compression (RFC 8879).',
  },
  {
    id: 'registry-manifest-size',
    label: 'OCI Manifest + Signature Size',
    baselinePerUnit: 512,
    pqcPerUnit: 4096,
    unit: 'bytes',
    description:
      'Container image manifest with embedded ML-DSA-65 cosign signature. Image pull operations fetch the manifest; larger manifests increase pull latency slightly.',
  },
]

// ── ACME + PQC Lifecycle ──────────────────────────────────────────────────────

export interface ACMEStep {
  id: string
  step: number
  title: string
  description: string
  pqcNote: string
  status: 'classical' | 'hybrid' | 'pqc' | 'agnostic'
}

export const ACME_LIFECYCLE_STEPS: ACMEStep[] = [
  {
    id: 'key-gen',
    step: 1,
    title: 'Key Generation',
    description:
      'cert-manager generates a private key for the Certificate resource. Key type is specified in spec.privateKey.algorithm.',
    pqcNote:
      'Check that the selected client, key generator, CSR flow and issuer support the same documented algorithm/profile. Issuer support alone does not add a new key type to the client configuration.',
    status: 'pqc',
  },
  {
    id: 'csr-gen',
    step: 2,
    title: 'CSR Generation',
    description:
      'A PKCS#10 CSR is generated from the private key. The CSR includes the Subject, SANs, and key usage extensions.',
    pqcNote:
      'Verify the algorithm identifiers, parameter rules, public-key and signature encodings in the chosen CSR profile with representative samples and an independent parser. Changing an identifier alone does not establish compatibility.',
    status: 'pqc',
  },
  {
    id: 'acme-order',
    step: 3,
    title: 'ACME Order Placement',
    description:
      "cert-manager places an ACME order with the CA (e.g., Let's Encrypt). The CA returns authorization challenges (HTTP-01 or DNS-01).",
    pqcNote:
      'Check the selected CA service and version for documented issuance support, supported client profiles and limitations. A roadmap or staging service does not establish production availability or client interoperability.',
    status: 'classical',
  },
  {
    id: 'challenge',
    step: 4,
    title: 'ACME Challenge Completion',
    description:
      'The configured client completes the selected challenge to demonstrate domain control under the applicable ACME validation method.',
    pqcNote:
      'A challenge demonstrates the specified domain-control check. Success does not establish support for the requested certificate key, signature algorithm or trust chain.',
    status: 'agnostic',
  },
  {
    id: 'cert-issuance',
    step: 5,
    title: 'Certificate Issuance',
    description:
      'The CA validates the CSR and issues a certificate binding the requested public key; it signs the certificate with its issuing key.',
    pqcNote:
      'Evaluate the subscriber key, issuing chain and relying-party algorithm policy separately. Inspect a sample certificate and verify the intended chain with supported clients; an algorithm selection alone does not establish end-to-end protection.',
    status: 'hybrid',
  },
  {
    id: 'rotation',
    step: 6,
    title: 'Automatic Rotation',
    description: 'cert-manager renews certificates.',
    pqcNote:
      'Inspect issued lifetime, renewal scheduling, successful replacement and stale-certificate coverage separately. A renewal lead time does not set certificate lifetime; shorter validity alone does not eliminate future forgery risk.',
    status: 'pqc',
  },
  {
    id: 'monitoring',
    step: 7,
    title: 'Algorithm Drift Detection',
    description:
      'Plan and evaluate certificate observations needed to identify policy drift; this walkthrough does not collect certificate or telemetry evidence.',
    pqcNote:
      'Capability requirement — not an alert rule: obtain certificate identities and algorithms from a documented source and verify collection coverage. Compare known facts with the applicable policy; missing algorithms or inaccessible certificates remain Unknown.',
    status: 'pqc',
  },
]

export const ACME_STATUS_COLORS: Record<ACMEStep['status'], string> = {
  classical: 'bg-status-error/15 text-status-error border-status-error/30',
  hybrid: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  pqc: 'bg-status-success/15 text-status-success border-status-success/30',
  agnostic: 'bg-muted text-muted-foreground border-border',
}

export const ACME_STATUS_LABELS: Record<ACMEStep['status'], string> = {
  classical: 'Existing-flow topic',
  hybrid: 'Transition topic',
  pqc: 'PQC capability topic',
  agnostic: 'Shared-process topic',
}
