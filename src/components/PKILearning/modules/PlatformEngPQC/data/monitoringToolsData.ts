// SPDX-License-Identifier: GPL-3.0-only
import type { MonitoringTool } from './platformEngConstants'

// ── Monitoring Tools ─────────────────────────────────────────────────────────

export const MONITORING_TOOLS: MonitoringTool[] = [
  {
    id: 'certmanager-metrics',
    name: 'cert-manager Prometheus Exporter',
    source: 'cert-manager',
    description:
      'cert-manager exposes Prometheus metrics on port 9402. Standard metrics track certificate expiry and readiness. Pair with x509-certificate-exporter to add key algorithm visibility for PQC posture monitoring.',
    metricExamples: [
      'certmanager_certificate_expiration_timestamp_seconds{name, namespace, issuer_name}',
      'certmanager_certificate_ready_status{name, namespace, condition}',
      'certmanager_controller_sync_call_count{controller}',
    ],
    alertExamples: [
      {
        name: 'LongLivedCertExpiresAfterCRQCWindow',
        expression: '(certmanager_certificate_expiration_timestamp_seconds - time()) / 86400 > 730',
        threshold: '> 730 days remaining (potential HNDL exposure)',
        severity: 'warning',
      },
      {
        name: 'CertNotReady',
        expression: 'certmanager_certificate_ready_status{condition="Ready"} == 0',
        threshold: 'Certificate not in Ready state',
        severity: 'warning',
      },
      {
        name: 'CertRotationLag',
        expression: '(certmanager_certificate_expiration_timestamp_seconds - time()) / 86400 < 30',
        threshold: '< 30 days until expiry',
        severity: 'warning',
      },
    ],
    pqcSignal: 'Identifies certs with quantum-vulnerable key algorithms still active in cluster',
    integrations: ['Prometheus', 'Grafana', 'AlertManager', 'PagerDuty'],
  },
  {
    id: 'vault-audit',
    name: 'HashiCorp Vault Audit Log',
    source: 'vault',
    description:
      'Vault audit logs every cryptographic operation including key type, algorithm, and path. Shipping Vault audit logs to a SIEM enables detection of RSA/ECDSA key usage and algorithm-downgrade attempts.',
    metricExamples: [
      'vault_transit_encrypt_requests_total{key_type, mount}',
      'vault_transit_sign_requests_total{key_type, mount, algorithm}',
      'vault_pki_issue_requests_total{role, key_type, mount}',
      'vault_pki_sign_requests_total{role, key_type}',
    ],
    alertExamples: [
      {
        name: 'VaultECDSASigningKeyUsed',
        expression: 'increase(vault_transit_sign_requests_total{key_type="ecdsa-p256"}[5m]) > 0',
        threshold: 'Any ECDSA transit signing in last 5 min',
        severity: 'warning',
      },
      {
        name: 'VaultRSAPKIIssuance',
        expression: 'increase(vault_pki_issue_requests_total{key_type=~"rsa.*"}[1h]) > 0',
        threshold: 'Any RSA certificate issued in last hour',
        severity: 'critical',
      },
    ],
    pqcSignal: 'Detects quantum-vulnerable signing and encryption operations in Vault',
    integrations: ['Splunk', 'Elastic SIEM', 'Datadog', 'Prometheus'],
  },
  {
    id: 'istio-metrics',
    name: 'Istio / Envoy TLS Metrics',
    source: 'istio',
    description:
      'Istio exposes per-connection TLS cipher suite and certificate algorithm information via Envoy stats. Enables monitoring for non-PQC mTLS connections in the service mesh.',
    metricExamples: [
      'envoy_ssl_handshake{listener_address, alpn, tls_version}',
      'envoy_ssl_connection_error{listener_address}',
      'istio_requests_total{connection_security_policy, source_workload, destination_workload}',
      'pilot_xds_cds_reject{node, error}',
    ],
    alertExamples: [
      {
        name: 'NonPQCServiceMeshConnections',
        expression:
          'sum(envoy_ssl_handshake{cipher_suite!~"TLS_AES_256_GCM_SHA384.*X25519MLKEM768.*"}) by (listener_address) > 0',
        threshold: 'Any non-PQC cipher suite active in mesh',
        severity: 'warning',
      },
      {
        name: 'SVIDRotationAnomalyDetection',
        expression: 'increase(spire_agent_svid_rotation_total[1h]) > 10',
        threshold:
          'Excessive SVID rotations (may indicate config instability during PQC migration)',
        severity: 'warning',
      },
    ],
    pqcSignal: 'Monitors PQC cipher suite adoption across all service-to-service connections',
    integrations: ['Prometheus', 'Grafana', 'Kiali', 'Jaeger'],
  },
  {
    id: 'x509-exporter',
    name: 'x509-certificate-exporter',
    source: 'prometheus',
    description:
      'Kubernetes-native Prometheus exporter that scans TLS secrets and certificates cluster-wide. Exposes certificate expiry, issuer, and serial number. Pair with custom recording rules or a PQC-aware fork to add key algorithm labels for crypto posture baseline.',
    metricExamples: [
      'x509_cert_expired{secret_namespace, secret_name, issuer_cn}',
      'x509_cert_not_after{secret_namespace, secret_name, issuer_cn, serial_number}',
      'x509_cert_not_before{secret_namespace, secret_name}',
    ],
    alertExamples: [
      {
        name: 'LongLivedCertInCluster',
        expression: '(x509_cert_not_after - time()) / 86400 > 730',
        threshold: 'Certificate with > 2 years validity (HNDL window risk)',
        severity: 'warning',
      },
      {
        name: 'ExpiredCertInCluster',
        expression: 'x509_cert_expired == 1',
        threshold: 'Expired certificate found in cluster',
        severity: 'critical',
      },
    ],
    pqcSignal: 'Full cluster inventory of TLS certificate key algorithms — baseline for migration',
    integrations: ['Prometheus', 'Grafana', 'AlertManager'],
  },
]

// ── SIEM Integration ──────────────────────────────────────────────────────────

export interface SIEMEventSchema {
  id: string
  name: string
  description: string
  platform: 'Splunk' | 'Elastic' | 'Datadog' | 'Microsoft Sentinel'
  query: string
  mitreTactic: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export const SIEM_QUERIES: SIEMEventSchema[] = [
  {
    id: 'splunk-ecdsa-signing',
    name: 'ECDSA Signing Key Usage (Vault)',
    description:
      'Detects Vault transit signing operations using quantum-vulnerable ECDSA keys. Indicates pipeline artifacts being signed with keys that will be breakable post-CRQC.',
    platform: 'Splunk',
    query: `index=vault_audit sourcetype=vault:audit
  operation=sign
  key_type IN ("ecdsa-p256", "ecdsa-p384")
| stats count by user, mount, path, key_type, _time
| where count > 0
| eval risk="QUANTUM-VULNERABLE SIGNING"
| table _time, user, mount, path, key_type, risk`,
    mitreTactic: 'T1553.002 — Code Signing',
    severity: 'high',
  },
  {
    id: 'elastic-rsa-cert-issue',
    name: 'RSA Certificate Issuance (cert-manager)',
    description:
      'Alerts when cert-manager issues RSA certificates. Helps track compliance with PQC migration policy — each issuance should be using ML-DSA during the transition window.',
    platform: 'Elastic',
    query: `event.kind: "event"
  AND kubernetes.labels.app: "cert-manager"
  AND message: "certificate issued"
  AND NOT message: "ml-dsa" AND NOT message: "MLDSA"
| stats count by kubernetes.namespace, cert_name, key_algorithm
| sort -count`,
    mitreTactic: 'T1587.003 — Digital Certificates',
    severity: 'medium',
  },
  {
    id: 'datadog-pipeline-oidc',
    name: 'CI/CD OIDC Token Algorithm Downgrade',
    description:
      'Detects GitHub Actions OIDC tokens signed with ES256 (ECDSA P-256) instead of ML-DSA. Indicates pipeline identity not yet migrated to PQC signing.',
    platform: 'Datadog',
    query: `source:github-actions
  @evt.name:workflow_job
  @oidc.key_algorithm:(ES256 OR RS256)
  -@oidc.key_algorithm:ML-DSA-65
| groupby @repository, @workflow
| alert when count > 0`,
    mitreTactic: 'T1552.004 — Private Keys',
    severity: 'high',
  },
  {
    id: 'sentinel-tls-downgrade',
    name: 'TLS Non-PQC Cipher Suite Detection',
    description:
      'Detects ingress TLS sessions that completed without an ML-KEM hybrid key exchange. Indicates traffic exposed to harvest-now-decrypt-later attack.',
    platform: 'Microsoft Sentinel',
    query: `ContainerLog
  | where ContainerID contains "nginx-ingress"
  | where LogEntry contains "TLSv1.3"
  | where LogEntry !contains "X25519MLKEM768"
  | project TimeGenerated, LogEntry, Computer, Namespace
  | extend risk = "NO_PQC_KEY_EXCHANGE"
  | summarize count() by Computer, risk, bin(TimeGenerated, 1h)`,
    mitreTactic: 'T1040 — Network Sniffing',
    severity: 'medium',
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
    notes:
      'Full DER-encoded X.509 cert with SAN, AKI, SKI extensions. TLS certificate chain (3 certs) grows from ~2.4KB to ~17.4KB.',
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
      'SLH-DSA-128f preferred for SBOMs (stateless, long-lived). Signature is 67× larger than ECDSA. Acceptable since SBOMs are read rarely.',
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
      'End-to-end TLS 1.3 handshake time including ML-DSA signature verification. ML-KEM key encapsulation adds ~4ms; ML-DSA verification adds ~10ms on 2024 hardware.',
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
      'Set algorithm: MLDSA44 in cert-manager v1.17+ to generate an ML-DSA-44 key. Until CA ACME supports PQC, use hybrid: set algorithm: MLDSA44 + hybridAlgorithm: ECDSA-P256.',
    status: 'pqc',
  },
  {
    id: 'csr-gen',
    step: 2,
    title: 'CSR Generation',
    description:
      'A PKCS#10 CSR is generated from the private key. The CSR includes the Subject, SANs, and key usage extensions.',
    pqcNote:
      'ML-DSA CSRs use OID 2.16.840.1.101.3.4.3.17 (ML-DSA-44) in the SubjectPublicKeyInfo. CSR format is identical to classical — only the algorithm OID changes.',
    status: 'pqc',
  },
  {
    id: 'acme-order',
    step: 3,
    title: 'ACME Order Placement',
    description:
      "cert-manager places an ACME order with the CA (e.g., Let's Encrypt). The CA returns authorization challenges (HTTP-01 or DNS-01).",
    pqcNote:
      "Let's Encrypt ACME PQC support is planned for 2026 (Staging) → 2027 (Production). Until then, ACME orders with ML-DSA keys are rejected by production CAs. Use internal CAs (Vault PKI, EJBCA) for ML-DSA certificates in the interim.",
    status: 'classical',
  },
  {
    id: 'challenge',
    step: 4,
    title: 'ACME Challenge Completion',
    description:
      'cert-manager completes the HTTP-01 or DNS-01 challenge to prove domain ownership.',
    pqcNote:
      'Challenge protocol is algorithm-agnostic — the challenge verifies domain control, not the key type. HTTP-01 and DNS-01 both work with ML-DSA keys once the CA supports them.',
    status: 'agnostic',
  },
  {
    id: 'cert-issuance',
    step: 5,
    title: 'Certificate Issuance',
    description:
      'The CA signs the CSR with its own signing key and returns the DER-encoded X.509 certificate.',
    pqcNote:
      "For end-to-end PQC: both the subscriber cert (ML-DSA leaf) AND the CA signing key must be ML-DSA. Let's Encrypt staging will use ML-DSA-65 for its ACME CA signing key in 2026.",
    status: 'hybrid',
  },
  {
    id: 'rotation',
    step: 6,
    title: 'Automatic Rotation',
    description:
      'cert-manager renews certificates at 2/3 of the certificate lifetime (e.g., 60 days into a 90-day cert).',
    pqcNote:
      'ML-DSA certificates have the same rotation logic. Shorter TTLs (30 days) are recommended for PQC transition to reduce HNDL exposure window. cert-manager renewBefore: 20d achieves this.',
    status: 'pqc',
  },
  {
    id: 'monitoring',
    step: 7,
    title: 'Algorithm Drift Detection',
    description:
      'Automated monitoring checks that all issued certs use approved PQC algorithms. Alerts fire on classical algorithm drift.',
    pqcNote:
      "Use x509-certificate-exporter + the cert algorithm Prometheus metric to detect if cert-manager rolled back to ECDSA (e.g., after CA fallback). Alert: x509_cert_key_algorithm{algorithm!~'id-ML-DSA.*'} == 1",
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
  classical: 'Classical only',
  hybrid: 'Hybrid transition',
  pqc: 'PQC ready',
  agnostic: 'Algorithm-agnostic',
}
