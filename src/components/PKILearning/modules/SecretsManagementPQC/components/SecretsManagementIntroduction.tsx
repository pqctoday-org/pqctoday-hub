// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Key,
  Shield,
  RefreshCw,
  Cloud,
  Terminal,
  ArrowRight,
  ChevronRight,
  Lock,
  Route,
  Workflow,
} from 'lucide-react'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel p-6">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </Button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

interface SecretsManagementIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const SecretsManagementIntroduction: React.FC<SecretsManagementIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1 */}
      <CollapsibleSection
        icon={<Key size={24} className="text-primary" />}
        title="Secrets vs Keys: What Needs PQC Protection"
        defaultOpen
      >
        <p>
          Organizations manage two distinct categories of sensitive material:{' '}
          <strong>secrets</strong> (API keys, credentials, tokens, seed phrases) and{' '}
          <strong>cryptographic keys</strong> (KEKs, signing keys, DEKs). Understanding the
          distinction matters for PQC migration because they have different protection mechanisms
          and different risk profiles.
        </p>

        <p>
          Secrets themselves are often not directly encrypted with asymmetric cryptography — they
          are stored in vaults that use <em>envelope encryption</em>. In envelope encryption, a Data
          Encryption Key (DEK) encrypts the secret, and a Key Encryption Key (KEK) wraps the DEK.
          The KEK is the quantum-vulnerable component when it uses RSA-OAEP or ECDH-ES. Migrating to{' '}
          <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> for the KEK protects all secrets in
          the vault without touching the secrets themselves.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Secret Type
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Classical Protection
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  PQC Protection
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  type: 'API Keys / Tokens',
                  classical: 'AES-256 DEK wrapped with RSA-OAEP KEK',
                  pqc: 'ML-KEM-768 KEK → AES-256 DEK',
                  priority: 'High',
                  priorityCls: 'text-status-warning',
                },
                {
                  type: 'DB Credentials',
                  classical: 'Vault master key (RSA unsealed)',
                  pqc: 'ML-KEM vault seal + dynamic secrets TTL 8h',
                  priority: 'Critical',
                  priorityCls: 'text-status-error',
                },
                {
                  type: 'TLS Private Keys',
                  classical: 'PKCS#12 encrypted with 3DES/AES',
                  pqc: 'ML-DSA key pair + HSM storage',
                  priority: 'Critical',
                  priorityCls: 'text-status-error',
                },
                {
                  type: 'Signing Keys',
                  classical: 'RSA-2048 / ECDSA P-256',
                  pqc: 'ML-DSA-65 or ML-DSA-87',
                  priority: 'Critical',
                  priorityCls: 'text-status-error',
                },
                {
                  type: 'OAuth JWT Signing',
                  classical: 'RS256 (RSA-2048)',
                  pqc: 'ML-DSA-65 JWK (JOSE PQC draft)',
                  priority: 'High',
                  priorityCls: 'text-status-warning',
                },
                {
                  type: 'AES-256-GCM DEKs',
                  classical: 'AES-256-GCM (direct)',
                  pqc: 'AES-256-GCM (unchanged, already safe)',
                  priority: 'Low',
                  priorityCls: 'text-status-success',
                },
              ].map((row) => (
                <tr key={row.type} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium text-foreground">{row.type}</td>
                  <td className="py-2 px-2 text-muted-foreground font-mono text-[10px]">
                    {row.classical}
                  </td>
                  <td className="py-2 px-2 text-primary font-mono text-[10px]">{row.pqc}</td>
                  <td className={`py-2 px-2 font-bold text-[10px] ${row.priorityCls}`}>
                    {row.priority}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-xs text-foreground/90">
            <strong>Key insight:</strong> The{' '}
            <InlineTooltip term="Secret Zero">&quot;Secret Zero&quot;</InlineTooltip> problem — how
            do you securely introduce an application to the vault without hardcoding a first
            credential? — is addressed by <strong>SPIFFE/SPIRE</strong> injecting verified workload
            identity. For the vault itself, migrating the master seal key to ML-KEM cascades PQC
            protection to all stored secrets.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 2 */}
      <CollapsibleSection
        icon={<Shield size={24} className="text-primary" />}
        title="HNDL Risk for Secrets in Transit and at Rest"
      >
        <p>
          <InlineTooltip term="HNDL">Harvest Now, Decrypt Later (HNDL)</InlineTooltip> applies
          differently to secrets than to general encrypted data. The risk depends on the
          secret&apos;s lifetime and the sensitivity of what it protects.
        </p>

        <p>
          A long-lived API key harvested from a TLS session today remains valid for months or years.
          When a{' '}
          <InlineTooltip term="CRQC">
            Cryptographically Relevant Quantum Computer (CRQC)
          </InlineTooltip>{' '}
          arrives, the attacker can decrypt the harvested TLS session, extract the API key, and use
          it to access your systems — or re-sell it. Short-lived OAuth tokens (1h TTL) have much
          lower HNDL risk since they expire before a CRQC is practically deployable.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Secret Type
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Typical Lifetime
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  HNDL Exposure
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  type: 'Seed Phrases',
                  lifetime: 'Permanent',
                  exposure: 'Immediate — direct use',
                  risk: 'Critical',
                  riskCls: 'text-status-error',
                },
                {
                  type: 'Code Signing Keys',
                  lifetime: '1–2 years',
                  exposure: 'Immediate — forgeable signatures',
                  risk: 'Critical',
                  riskCls: 'text-status-error',
                },
                {
                  type: 'TLS Certificates',
                  lifetime: '90 days',
                  exposure: 'Immediate — session decryption',
                  risk: 'Critical',
                  riskCls: 'text-status-error',
                },
                {
                  type: 'API Keys',
                  lifetime: '90–365 days',
                  exposure: 'Delayed — key still valid at CRQC arrival',
                  risk: 'High',
                  riskCls: 'text-status-warning',
                },
                {
                  type: 'Service Accounts',
                  lifetime: '1–2 years (static)',
                  exposure: 'Delayed — broad access scope',
                  risk: 'High',
                  riskCls: 'text-status-warning',
                },
                {
                  type: 'Database Creds (dynamic)',
                  lifetime: '1–8 hours',
                  exposure: 'Minimal — expired before CRQC',
                  risk: 'Low',
                  riskCls: 'text-status-success',
                },
                {
                  type: 'OAuth Access Tokens',
                  lifetime: '1 hour',
                  exposure: 'Minimal — expired immediately',
                  risk: 'Low',
                  riskCls: 'text-status-success',
                },
              ].map((row) => (
                <tr key={row.type} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium text-foreground">{row.type}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.lifetime}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.exposure}</td>
                  <td className={`py-2 px-2 font-bold text-[10px] ${row.riskCls}`}>{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Strategic insight:</strong> Switching static DB
            credentials to dynamic secrets (Vault DB engine, 8h TTL) eliminates their HNDL risk
            entirely — no algorithm migration needed. This &quot;quick win&quot; should be the first
            operational step before any cryptographic algorithm change.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 3 */}
      <CollapsibleSection
        icon={<RefreshCw size={24} className="text-primary" />}
        title="Automated Rotation with PQC Keys"
      >
        <p>
          <InlineTooltip term="Dynamic Secrets">Dynamic secrets</InlineTooltip> are credentials
          generated on-demand with a Time-To-Live (TTL) and automatically revoked on expiry or lease
          revocation. HashiCorp Vault&apos;s database secrets engine is the canonical example: Vault
          creates a unique DB user for each requester, with configurable TTL (1h to 24h), then drops
          the user automatically.
        </p>

        <p>
          The PQC consideration for dynamic secrets is not the secrets themselves (they expire too
          quickly to matter for HNDL) but the{' '}
          <strong>mechanisms that generate and deliver them</strong>. The TLS channel from Vault to
          the database backend must use hybrid <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>,
          and the Vault token used by the application to request secrets must be issued via an
          ML-DSA-verified identity.
        </p>

        {/* Rotation flow */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Dynamic Secret Flow (Vault)</div>
          <div className="space-y-2 text-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                Application Pod (K8s)
              </div>
              <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                Vault Agent Sidecar
              </div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-[10px] font-bold">
                HashiCorp Vault Server
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              &darr; Vault Agent authenticates via K8s SA JWT &darr;
            </div>
            <div className="p-2 rounded bg-muted text-foreground text-[10px] font-bold">
              Vault Issues Scoped Token (TTL = 24h) — Auth via ML-DSA K8s JWT (planned)
            </div>
            <div className="text-muted-foreground text-xs">
              &darr; Token presented to DB secrets engine &darr;
            </div>
            <div className="p-2 rounded bg-status-success/10 text-status-success text-[10px] font-bold border border-status-success/20">
              Dynamic DB Credentials Generated (TTL = 8h, unique per lease)
            </div>
            <div className="text-muted-foreground text-xs">
              &darr; Credentials written to /vault/secrets/ tmpfs &darr;
            </div>
            <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
              Application Reads Credentials from tmpfs (never stored in env vars)
            </div>
            <div className="text-muted-foreground text-xs">
              &darr; On expiry or pod shutdown &darr;
            </div>
            <div className="p-2 rounded bg-status-error/10 text-status-error text-[10px] font-bold border border-status-error/20">
              Vault Revokes Lease → DB User Dropped Automatically
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              <InlineTooltip term="Transit Encryption Engine">Transit Engine</InlineTooltip> PQC
              Upgrade Path
            </div>
            <p className="text-xs text-muted-foreground">
              Vault Transit Engine performs crypto operations server-side. Migrating key types from{' '}
              <code className="bg-muted px-1 rounded border border-border">rsa-4096</code> to{' '}
              <code className="bg-muted px-1 rounded border border-border">ml-kem-768</code> or{' '}
              <code className="bg-muted px-1 rounded border border-border">ml-dsa-65</code> (Vault
              1.18+) changes the internal transit key store without breaking the API surface.
              Applications simply update the <code>key_type</code> parameter during key creation,
              and Vault mechanically handles the larger PQC ciphertexts and nested encapsulation
              transparency.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              <InlineTooltip term="Lease/Renewal">Dynamic TTL vs Key Rotation</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              Dynamic credential TTLs (e.g., 1-8 hour bounds) completely eliminate HNDL risk for the
              credential itself, as it expires long before a CRQC appears. Contrast this with PQC
              rotation bounds for static KEKs (30-90 days), which require complex re-wrapping
              operations. Short TTLs negate the need for PQC migration of the secret value itself.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4 */}
      <CollapsibleSection
        icon={<Cloud size={24} className="text-primary" />}
        title="AWS / Azure / GCP / HashiCorp Vault / Delinea PQC Roadmaps"
      >
        <p>
          Cloud secrets managers vary significantly in their PQC readiness. Understanding each
          provider&apos;s roadmap is essential for multi-cloud strategies and migration timeline
          planning.
        </p>

        <div className="space-y-4">
          {[
            {
              provider: 'HashiCorp Vault (Enterprise)',
              status: 'Planned 2026',
              statusCls: 'text-status-warning bg-status-warning/10 border-status-warning/30',
              details: [
                'Transit engine PQC key types (ML-KEM-768, ML-DSA-65) — Vault 1.18 (H2 2026)',
                'ML-KEM envelope encryption for seal/unseal mechanism — Vault 1.19',
                'FIPS 140-3 validation for PQC algorithms — 2027 target',
                'Hybrid TLS (X25519+ML-KEM) for Vault API — via HPKE RFC 9180',
              ],
              note: 'On-premises deployment gives full control over upgrade timing. Dynamic secrets are available now and eliminate many HNDL risks without waiting for PQC algorithms.',
            },
            {
              provider: 'AWS Secrets Manager',
              status: 'Via KMS (GA)',
              statusCls: 'text-status-info bg-status-info/10 border-status-info/30',
              details: [
                'No native PQC — inherits from AWS KMS ML-KEM key spec (GA since 2024)',
                'Configure CMEK with ML-KEM key type for envelope encryption',
                'AWS SDK TLS uses hybrid ML-KEM (BoringSSL) since 2024',
                'No native dynamic secrets — use Lambda rotation or Vault AWS auth',
              ],
              note: 'The simplest path: create a KMS CMK with key spec ML-KEM-768, configure Secrets Manager to use it as CMEK. All secrets are then ML-KEM protected at rest.',
            },
            {
              provider: 'Azure Key Vault (Managed HSM)',
              status: 'Planned 2026',
              statusCls: 'text-status-warning bg-status-warning/10 border-status-warning/30',
              details: [
                'ML-KEM-768/1024 and ML-DSA-44/65/87 key types — planned 2026',
                'SymCrypt (underlying crypto library) already supports ML-KEM/ML-DSA internally',
                'Key Vault API exposure is the remaining gap',
                'Managed HSM HSM SKU required for PQC (Standard tier HSMs excluded)',
              ],
              note: 'Use Azure Key Vault with "Key Vault references" in App Service/Container Apps to avoid storing secrets in app config. When PQC keys are available, only the Key Vault config changes.',
            },
            {
              provider: 'GCP Secret Manager',
              status: 'Via Cloud KMS',
              statusCls: 'text-status-info bg-status-info/10 border-status-info/30',
              details: [
                'No direct PQC — relies on Cloud KMS CMEK for secret encryption',
                'Cloud KMS PQC preview: ML-KEM-768, ML-KEM-1024, X-Wing, ML-DSA-65, SLH-DSA',
                'Enable CMEK on Secret Manager with Cloud KMS ML-KEM key ring',
                'FIPS mode not available for Secret Manager',
              ],
              note: 'GCP Cloud KMS has the most advanced PQC preview among major cloud providers. Configure Secret Manager with a Cloud KMS CMEK using an ML-KEM key for immediate protection.',
            },
          ].map((item) => (
            <div key={item.provider} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm font-bold text-foreground">{item.provider}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${item.statusCls}`}
                >
                  {item.status}
                </span>
              </div>
              <ul className="space-y-1 mb-3">
                {item.details.map((d) => (
                  <li key={d} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-primary shrink-0 mt-0.5">&#8227;</span>
                    {d}
                  </li>
                ))}
              </ul>
              <div className="bg-background rounded-lg p-3 border border-border text-[10px] text-foreground/80">
                <strong>Recommended action:</strong> {item.note}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              <InlineTooltip term="Envelope Encryption (Secrets)">
                Envelope Encryption
              </InlineTooltip>{' '}
              Pattern
            </div>
            <p className="text-xs text-muted-foreground">
              All cloud providers use envelope encryption: DEK (AES-256-GCM) encrypts the secret,
              KEK wraps the DEK. The KEK is stored in the provider&apos;s KMS and is the
              quantum-vulnerable component. Switching the KEK to ML-KEM protects all secrets without
              re-encrypting secret content.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              <InlineTooltip term="BYOK">BYOK</InlineTooltip> (Bring Your Own Key)
            </div>
            <p className="text-xs text-muted-foreground">
              BYOK lets you generate and manage the KEK in your own HSM or Vault instance. With BYOK
              + ML-KEM, you control the PQC upgrade timeline independently of the cloud
              provider&apos;s roadmap. AWS CloudHSM and Azure Managed HSM support BYOK with
              HSM-backed keys.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 5 */}
      <CollapsibleSection
        icon={<Terminal size={24} className="text-primary" />}
        title="Kubernetes, CI/CD, and Zero-Trust Secrets"
      >
        <p>
          Kubernetes Secrets are base64-encoded, not encrypted — they are stored in etcd as
          plaintext unless encryption-at-rest is explicitly enabled. The CIS Kubernetes Benchmark
          v1.9 (section 1.2.33) mandates{' '}
          <InlineTooltip term="Secrets Manager">secrets encryption</InlineTooltip> for production
          clusters. Without it, <InlineTooltip term="Secret Sprawl">secret sprawl</InlineTooltip>{' '}
          into etcd creates a massive HNDL attack surface.
        </p>

        <div className="space-y-3">
          {[
            {
              title: 'Kubernetes Encryption at Rest',
              content:
                'Configure --encryption-provider-config on kube-apiserver with a KMS provider. Use the KMS v2 plugin (Kubernetes 1.25+) pointing to a cloud KMS or Vault instance. With AWS KMS ML-KEM key spec as the KMS provider, all etcd secrets are ML-KEM protected. The External Secrets Operator (ESO) pattern keeps secrets in the vault and injects them at runtime, so they are not duplicated into etcd.',
            },
            {
              title: 'External Secrets Operator (ESO)',
              content:
                "ESO syncs secrets from external stores (Vault, AWS Secrets Manager, Azure Key Vault) to Kubernetes Secret objects at runtime. The Secret lives only in the external vault (PQC-protected) and in-memory in the pod. GitOps repos never contain secret values. PQC protection comes entirely from the external store's KEK algorithm.",
            },
            {
              title: 'SPIFFE/SPIRE Workload Identity',
              content:
                'SPIFFE (Secure Production Identity Framework for Everyone) issues X.509-SVIDs (SPIFFE Verifiable Identity Documents) to workloads via short-lived certificates (TTL 5-60min). SPIRE (SPIFFE Runtime Environment) is the reference implementation. Migrating SVID signing from ECDSA to ML-DSA eliminates HNDL risk for workload identity entirely.',
            },
            {
              title: 'CI/CD OIDC Token Federation',
              content:
                'Modern CI/CD (GitHub Actions, GitLab CI, CircleCI) supports OIDC JWT tokens issued per job. These tokens authenticate to Vault or cloud IAM without static credentials. The OIDC JWT is currently RS256-signed (RSA). Migration to ML-DSA-signed OIDC tokens is pending provider roadmap. Short token TTL (15min per job) means HNDL risk is low despite classical signing.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">{item.title}</div>
              <p className="text-xs text-muted-foreground">{item.content}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <div className="text-xs font-bold text-primary mb-2">
            Zero-Trust Architecture for Secrets
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              Zero-trust secrets management eliminates static credentials entirely. Every workload
              authenticates via short-lived, dynamically issued credentials:
            </p>
            <ul className="space-y-1">
              {[
                'No static API keys in environment variables or config files',
                'No downloaded service account key files (JSON credentials)',
                'All identities attested via SPIFFE/SPIRE or cloud-native workload identity',
                'All secret access via audited vault with per-request leases',
                'Secrets never duplicated into Kubernetes etcd (ESO pattern)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Lock size={10} className="text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">
                KMS &amp; PQC Key Management
              </div>
              <div className="text-xs text-muted-foreground">
                Envelope encryption, ML-KEM key wrapping, multi-provider KMS
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC Operations</div>
              <div className="text-xs text-muted-foreground">
                PKCS#11 v3.2, HSM vendor migration, FIPS 140-3
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <RefreshCw size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Algorithm-agnostic design patterns for infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Catalog</div>
              <div className="text-xs text-muted-foreground">
                Vault, AWS, Azure, GCP PQC readiness tracker
              </div>
            </div>
          </Link>
          <Link
            to="/learn/platform-eng-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Workflow size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Platform Engineering</div>
              <div className="text-xs text-muted-foreground">
                CI/CD pipeline crypto, container signing, and policy enforcement
              </div>
            </div>
          </Link>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="Security Stack" />

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Classify secrets by risk, simulate Vault transit PQC, design rotation policies, and
          compare cloud providers.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
