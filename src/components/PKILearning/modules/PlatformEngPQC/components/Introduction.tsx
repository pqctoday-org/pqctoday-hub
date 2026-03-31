// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldX,
  ChevronDown,
  ChevronUp,
  Container,
  FileCode,
  Shield,
  Activity,
  Map,
  AlertTriangle,
  ArrowRight,
  Brain,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

// ── Local CollapsibleSection ──────────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// ── Introduction Component ────────────────────────────────────────────────────

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-6">
      {/* Section 1: Quantum Threats to Platform Cryptography */}
      <CollapsibleSection
        title="1. Quantum Threats to Platform Cryptography"
        icon={<ShieldX size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          Every layer of the software delivery pipeline embeds classical cryptography: ECDSA P-256
          signing keys for container images, RSA-2048 certificates for TLS sessions to Vault and the
          Kubernetes API server, and HMAC-SHA-256 for webhook secrets. A cryptographically relevant
          quantum computer (CRQC) running{' '}
          <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip> breaks all
          public-key schemes currently used in CI/CD infrastructure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="text-sm font-bold text-status-error mb-2">Broken by Shor&apos;s</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• ECDSA P-256 / P-384 (signing)</li>
              <li>• RSA-2048 / RSA-4096 (signing, KEX)</li>
              <li>• ECDH / ECDHE (key exchange)</li>
              <li>• Ed25519 / Ed448 (signing)</li>
              <li>• DH / DHE (key exchange)</li>
            </ul>
          </div>
          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="text-sm font-bold text-status-warning mb-2">
              Weakened by Grover&apos;s
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• AES-128 → 64-bit effective security</li>
              <li>• SHA-256 → 128-bit pre-image security</li>
              <li>• HMAC-SHA-256 → still safe (128-bit)</li>
              <li>• AES-256 → 128-bit effective (safe)</li>
            </ul>
          </div>
          <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
            <div className="text-sm font-bold text-status-success mb-2">Quantum-Safe</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                • <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (FIPS 204)
              </li>
              <li>
                • <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> (FIPS 203)
              </li>
              <li>
                • <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (FIPS 205)
              </li>
              <li>• AES-256 (symmetric)</li>
              <li>• HMAC-SHA-256 / SHA-384</li>
            </ul>
          </div>
        </div>

        <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
          <div className="text-sm font-bold text-foreground mb-2">
            The Harvest-Now-Decrypt-Later (HNDL) Threat
          </div>
          <p className="text-sm text-muted-foreground">
            Adversaries are recording encrypted TLS sessions <em>today</em> — Vault mTLS,
            kube-apiserver traffic, registry pulls — and storing them for decryption once a CRQC is
            available. Even if your certificates expire in 90 days, the data they protected may
            remain sensitive for 10–20 years. This makes TLS key exchange (ECDHE) the most critical
            asset to migrate, ahead of signing keys.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 2: Crypto Asset Discovery in CI/CD Pipelines */}
      <CollapsibleSection
        title="2. Crypto Asset Discovery in CI/CD Pipelines"
        icon={<Map size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Before migration, you must know <em>what</em> to migrate. CI/CD pipelines embed
          cryptographic primitives at every stage — many invisible to standard security scanners
          because they live inside tool configuration rather than source code.
        </p>

        <div className="space-y-3">
          {[
            {
              stage: 'Source Control',
              assets:
                'Git commit signing (ECDSA P-256), SSH deploy keys (RSA/ECDSA), webhook HMAC secrets',
              risk: 'medium',
            },
            {
              stage: 'CI/CD Build',
              assets: 'OIDC JWT tokens (ES256), Vault mTLS sessions (ECDHE), registry auth TLS',
              risk: 'high',
            },
            {
              stage: 'Artifact Signing',
              assets: 'Container image signing keys (ECDSA), SBOM attestation, SLSA provenance',
              risk: 'high',
            },
            {
              stage: 'Container Registry',
              assets: 'Registry TLS certificate (ECDSA), OCI manifest signatures',
              risk: 'medium',
            },
            {
              stage: 'Kubernetes Deploy',
              assets:
                'kube-apiserver TLS cert (ECDSA/RSA), admission webhook TLS, Helm GPG signing',
              risk: 'high',
            },
            {
              stage: 'Runtime / Service Mesh',
              assets: 'SPIFFE SVIDs (ECDSA), mTLS cipher suites, cert-manager issued certs',
              risk: 'high',
            },
          ].map((s) => (
            <div
              key={s.stage}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
            >
              <div
                className={`text-[10px] px-1.5 py-1 rounded border font-bold shrink-0 mt-0.5 ${
                  s.risk === 'high'
                    ? 'bg-status-error/15 text-status-error border-status-error/30'
                    : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                }`}
              >
                {s.risk.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">{s.stage}</div>
                <div className="text-xs text-muted-foreground">{s.assets}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Use a <InlineTooltip term="CBOM">Cryptographic Bill of Materials (CBOM)</InlineTooltip>{' '}
          scanner (Syft, OCI manifest scan, or custom Prometheus queries) to produce a
          machine-readable inventory of every algorithm OID in your running cluster.
        </p>
      </CollapsibleSection>

      {/* Section 3: Container & Artifact Signing */}
      <CollapsibleSection
        title="3. Container &amp; Artifact Signing: ECDSA → ML-DSA"
        icon={<Container size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Container image signatures anchor the entire supply chain trust model. If the signing key
          is broken, every image in your registry can be forged. Current tools —
          <InlineTooltip term="cosign">cosign</InlineTooltip> and{' '}
          <InlineTooltip term="Notation">Notation</InlineTooltip> — use ECDSA P-256, which
          Shor&apos;s algorithm breaks in polynomial time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">Classical (today)</div>
            <div className="bg-status-error/10 rounded p-3 border border-status-error/20 space-y-1 text-xs text-muted-foreground">
              <div>Signing key: ECDSA P-256</div>
              <div>
                Signature size: <span className="font-mono text-foreground">64 bytes</span>
              </div>
              <div>OCI format: COSE Sign1 / JWS</div>
              <div className="text-status-error font-medium">
                Quantum-vulnerable — Shor&apos;s breaks P-256
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">PQC Migration</div>
            <div className="bg-status-success/10 rounded p-3 border border-status-success/20 space-y-1 text-xs text-muted-foreground">
              <div>Signing key: ML-DSA-65 (FIPS 204)</div>
              <div>
                Signature size: <span className="font-mono text-foreground">3,309 bytes</span>
              </div>
              <div>OCI format: COSE Sign1 (PQC profile)</div>
              <div className="text-status-success font-medium">
                Quantum-safe — NIST standardised 2024
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Notation + AWS Crypto plugin</strong> — supports
              ML-DSA-65 today (beta). Best option for new deployments.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">cosign v2.x</strong> — ML-DSA support on roadmap
              for 2026. Rekor transparency log must also be migrated.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">SLH-DSA for SBOMs</strong> — stateless hash-based
              signatures preferred for long-lived attestation documents (20+ year validity).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Docker Content Trust (DCT)</strong> — no PQC
              roadmap. Migrate to Notation immediately; Notary v1 is in maintenance mode.
            </span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: IaC Crypto Configuration */}
      <CollapsibleSection
        title="4. IaC Crypto Configuration &amp; Quantum-Vulnerable Defaults"
        icon={<FileCode size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Infrastructure-as-Code tools bake classical cryptography into defaults that persist for
          years without active change. Terraform, Helm, and cert-manager all default to RSA-2048 or
          ECDSA P-256 — every resource provisioned without explicit PQC configuration is a
          quantum-vulnerable asset.
        </p>

        <div className="space-y-3">
          {[
            {
              tool: 'cert-manager ClusterIssuer',
              problem:
                'Default key type is RSA-2048. Every cert issued from this root is quantum-vulnerable.',
              fix: 'Set algorithm: MLDSA44 in Certificate.spec.privateKey (cert-manager v1.17+).',
            },
            {
              tool: 'HashiCorp Vault PKI role',
              problem: 'Default key_type=rsa, key_bits=2048. All pipeline auth certs use RSA.',
              fix: 'Set key_type=ml-dsa-44 in Vault PKI role (planned — monitor Vault PQC roadmap).',
            },
            {
              tool: 'nginx-ingress Helm chart',
              problem:
                'Default ssl-ecdh-curve=X25519:P-256. All HTTPS sessions use ECDHE key exchange.',
              fix: 'Add X25519MLKEM768 to ssl-ecdh-curve. This provides ML-KEM hybrid key exchange.',
            },
            {
              tool: 'Terraform (AWS ACM)',
              problem:
                'aws_acm_certificate defaults to RSA_2048. All ALB/CloudFront TLS is HNDL-exposed.',
              fix: 'Enable PQC TLS policy at ALB level for hybrid key exchange (check AWS docs for current policy name).',
            },
            {
              tool: 'kubeconfig client certs',
              problem: 'CI/CD deploy certs are ECDSA P-256. All kubectl sessions are HNDL targets.',
              fix: 'Rotate to ML-DSA-44 via cert-manager Certificate (usages: client auth).',
            },
          ].map((item) => (
            <div
              key={item.tool}
              className="p-3 rounded-lg bg-muted/30 border border-border space-y-1"
            >
              <div className="text-sm font-bold text-foreground">{item.tool}</div>
              <div className="text-xs text-status-error">{item.problem}</div>
              <div className="text-xs text-status-success">
                <ArrowRight size={10} className="inline mr-1" />
                {item.fix}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Policy Enforcement */}
      <CollapsibleSection
        title="5. Policy Enforcement for Algorithm Agility"
        icon={<Shield size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Policy-as-Code ensures that quantum-vulnerable algorithm choices are caught at admission
          time — before resources enter the cluster. Both{' '}
          <InlineTooltip term="OPA (Open Policy Agent)">OPA Gatekeeper</InlineTooltip> and{' '}
          <InlineTooltip term="Kyverno">Kyverno</InlineTooltip> can block RSA/ECDSA algorithm OIDs
          in cert-manager Certificate resources, Ingress TLS annotations, and image signature
          attestations.
        </p>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">OPA Gatekeeper ConstraintTemplate</strong> —
              evaluates cert-manager Certificate.spec.privateKey.algorithm; rejects anything that
              doesn&apos;t start with &quot;ml&quot; or &quot;slh&quot;.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Kyverno ClusterPolicy</strong> — verifyImages rule
              requires ML-DSA-65 cosign or Notation signature on all Pods in production namespace.
              Blocks unsigned or ECDSA-only images.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">SLSA Level 3 (projected PQC requirement)</strong>{' '}
              — ML-DSA or SLH-DSA signature on build provenance. Enforce via OPA Deployment
              annotation check.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Rollout strategy</strong> — deploy in Audit mode
              first (validationFailureAction: Audit), baseline violations for 2 weeks, then switch
              to Enforce after remediation window.
            </span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 6: Monitoring Cryptographic Posture */}
      <CollapsibleSection
        title="6. Monitoring Cryptographic Posture"
        icon={<Activity size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Continuous monitoring detects algorithm drift — when classical certs re-enter the cluster
          through CA fallback, manual issuance, or operator error. Four Prometheus-based exporters
          cover the full platform crypto surface.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              tool: 'cert-manager Prometheus Exporter',
              signal: 'Detects ECDSA/RSA certs still in Ready state after migration deadline',
              metric: 'certmanager_certificate_ready_status{key_algorithm=~"ECDSA.*"}',
            },
            {
              tool: 'x509-certificate-exporter',
              signal: 'Cluster-wide scan of all TLS Secrets; identifies non-PQC key algorithms',
              metric: 'x509_cert_key_algorithm{algorithm!~"id-ML-DSA.*"}',
            },
            {
              tool: 'HashiCorp Vault Audit Log',
              signal: 'Detects ECDSA transit signing operations in Vault',
              metric: 'vault_transit_sign_requests_total{key_type="ecdsa-p256"}',
            },
            {
              tool: 'Istio / Envoy TLS Metrics',
              signal: 'Monitors PQC cipher suite adoption in service mesh connections',
              metric: 'envoy_ssl_handshake{cipher_suite!~".*X25519MLKEM768.*"}',
            },
          ].map((item) => (
            <div
              key={item.tool}
              className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5"
            >
              <div className="font-bold text-foreground">{item.tool}</div>
              <div className="text-muted-foreground">{item.signal}</div>
              <div className="font-mono text-[10px] text-primary bg-muted rounded px-1.5 py-0.5 break-all">
                {item.metric}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          SIEM integration (Splunk, Elastic, Datadog, Microsoft Sentinel) extends monitoring to
          cross-platform detection — catching algorithm-downgrade events, CI/CD OIDC token algorithm
          drift, and TLS cipher negotiation without ML-KEM.
        </p>
      </CollapsibleSection>

      {/* Section 7: Migration Runway */}
      <CollapsibleSection
        title="7. Migration Runway, Rollback &amp; Cut-Over Planning"
        icon={<AlertTriangle size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          A phased migration protects against rollback failures and ensures compatibility with
          clients that haven&apos;t yet updated. The six phases progress from inventory to complete
          cut-over, with explicit rollback procedures at each step.
        </p>

        <div className="space-y-2">
          {[
            { phase: 0, title: 'Inventory & Baseline', weeks: '2w', priority: 'medium' },
            { phase: 1, title: 'Root CA Migration (ML-DSA-65)', weeks: '4w', priority: 'critical' },
            {
              phase: 2,
              title: 'TLS Key Exchange (X-Wing hybrid)',
              weeks: '3w',
              priority: 'critical',
            },
            { phase: 3, title: 'Artifact Signing (ML-DSA)', weeks: '6w', priority: 'high' },
            { phase: 4, title: 'Source Control & CI Identity', weeks: '4w', priority: 'high' },
            { phase: 5, title: 'Policy Enforcement Cut-Over', weeks: '2w', priority: 'medium' },
          ].map((p) => (
            <div
              key={p.phase}
              className="flex items-center gap-3 p-2 rounded bg-muted/30 border border-border text-xs"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {p.phase}
              </div>
              <span className="flex-1 text-foreground font-medium">{p.title}</span>
              <span className="text-muted-foreground">{p.weeks}</span>
              <span
                className={`px-1.5 py-0.5 rounded border text-[10px] font-bold shrink-0 ${
                  p.priority === 'critical'
                    ? 'bg-status-error/15 text-status-error border-status-error/30'
                    : p.priority === 'high'
                      ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                      : 'bg-status-info/15 text-status-info border-status-info/30'
                }`}
              >
                {p.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Key insight:</strong> Phases 1 and 2 (Root CA + TLS
          Key Exchange) address HNDL directly and should begin immediately, regardless of your CRQC
          timeline estimate. Even if a CRQC is 15 years away, encrypted traffic recorded today will
          be decryptable in 2039.
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          <Link to="/learn/migration-program">
            <Button variant="outline" size="sm">
              <ArrowRight size={14} className="mr-1" />
              Migration Program module
            </Button>
          </Link>
          <Link to="/learn/kms-pqc">
            <Button variant="outline" size="sm">
              <ArrowRight size={14} className="mr-1" />
              KMS & PQC module
            </Button>
          </Link>
          <Link to="/learn/ai-security-pqc">
            <Button variant="outline" size="sm">
              <Brain size={14} className="mr-1" />
              AI Security & PQC
            </Button>
          </Link>
        </div>
      </CollapsibleSection>

      <VendorCoverageNotice migrateLayer="Libraries" />

      {/* ── Workshop CTA ────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Ready to audit your platform crypto?</h3>
            <p className="text-sm text-muted-foreground">
              Inventory your CI/CD pipeline crypto assets, migrate container signing to ML-DSA, and
              enforce PQC policy across your Kubernetes cluster in the interactive workshop.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Open Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/migration-program"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Map size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Program</div>
              <div className="text-xs text-muted-foreground">
                Phase-based PQC rollout planning for platform teams
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                Key management backends for platform secret injection
              </div>
            </div>
          </Link>
          <Link
            to="/learn/code-signing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FileCode size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Code Signing</div>
              <div className="text-xs text-muted-foreground">
                Sigstore and Notation migration to ML-DSA in CI/CD pipelines
              </div>
            </div>
          </Link>
          <Link
            to="/learn/ai-security-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Brain size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">AI Security &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                PQC considerations for ML pipelines and model signing
              </div>
            </div>
          </Link>
        </div>
      </section>
      <ReadingCompleteButton />
    </div>
  )
}
