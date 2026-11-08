// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Key,
  Shield,
  RefreshCw,
  Cloud,
  Terminal,
  ArrowRight,
  Lock,
  Route,
  Workflow,
} from 'lucide-react'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

// Local CollapsibleSection replaced by the shared anchored LearnSection (2026-07-30).

interface SecretsManagementIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const SecretsManagementIntroduction: React.FC<SecretsManagementIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1 */}
      <LearnSection
        sectionId="secrets-vs-keys"
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
          Encryption Key (DEK) encrypts the secret, and a Key Encryption Key (KEK) protects the DEK.
          Which step is quantum-vulnerable depends on how the DEK is protected, so evaluate each
          boundary separately instead of replacing every KEK with{' '}
          <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Boundary</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Example</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Quantum exposure
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Migration step
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  boundary: 'Symmetric KEK',
                  example:
                    'An AES key in a KMS wraps the DEK. AWS Secrets Manager supports only symmetric encryption KMS keys; Google documents AES-256 or AES-128 KEKs.',
                  exposure:
                    "Shor's algorithm does not apply; only generic Grover search of the key.",
                  step: 'No ML-KEM needed. Keep key length and access policy in view.',
                },
                {
                  boundary: 'Asymmetric key transport',
                  example: 'A DEK encrypted to a public key with RSA-OAEP or ECDH-ES.',
                  exposure: 'Quantum-vulnerable: a recorded wrapped DEK can be attacked later.',
                  step: 'Replace this step with a post-quantum or hybrid KEM, where your product supports one.',
                },
                {
                  boundary: 'KEM-derived wrapping key',
                  example:
                    'A shared secret from ML-KEM encapsulation, turned into a wrapping key with a KDF.',
                  exposure: 'Post-quantum for this step, if implemented and reviewed correctly.',
                  step: 'Only where the provider, plugin or product exposes it; it does not touch the secrets themselves.',
                },
                {
                  boundary: 'Transport to the key service',
                  example: 'The TLS connection that carries KMS or vault API calls.',
                  exposure: 'The TLS key exchange has its own harvest-now-decrypt-later exposure.',
                  step: 'Hybrid post-quantum TLS where the service offers it.',
                },
              ].map((row) => (
                <tr key={row.boundary} className="border-b border-border/50 align-top">
                  <td className="py-2 px-2 font-medium text-foreground">{row.boundary}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.example}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.exposure}</td>
                  <td className="py-2 px-2 text-muted-foreground">{row.step}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                  classical: 'AES-256 DEK wrapped with RSA-OAEP (asymmetric transport)',
                  pqc: 'ML-KEM-derived wrapping key (where supported); an AES-256 KEK stays as is',
                  priority: 'High',
                  priorityCls: 'text-status-warning',
                },
                {
                  type: 'DB Credentials',
                  classical:
                    'Vault root key protected by its unseal key (Shamir shares or auto-unseal)',
                  pqc: 'Dynamic secrets TTL 8h; a post-quantum seal only if the platform documents one',
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
            identity. For the vault itself, the seal protects the root key; moving the seal to a
            post-quantum mechanism depends on the platform documenting one (the provider list below
            records that Vault documents no ML-KEM seal).
          </p>
        </div>
      </LearnSection>

      {/* Section 2 */}
      <LearnSection
        sectionId="hndl-risk"
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

        <p>
          Evaluate confidentiality and authentication separately. A recorded TLS session is
          decrypted by breaking its <strong>key exchange</strong>: static RSA key transport, where
          the client encrypts the premaster secret to the server certificate&apos;s public key (TLS
          1.2 and earlier, RFC 5246), or the (EC)DH values of an ephemeral exchange. TLS 1.3 removed
          static RSA key transport (RFC 8446). The certificate&apos;s ECDSA or RSA signing key
          instead <strong>authenticates</strong> the handshake: recovering it later lets an attacker
          impersonate the server while the certificate is still accepted, but it does not recover
          past session keys. Replace or rotate signing keys to address authentication risk, and use
          hybrid post-quantum key exchange to address harvested traffic; neither substitutes for the
          other.
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
                  exposure:
                    'Impersonation after a CRQC — recovering the signing key does not decrypt recorded sessions',
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
      </LearnSection>

      {/* Section 3 */}
      <LearnSection
        sectionId="automated-rotation"
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
              <code className="bg-muted px-1 rounded border border-border">ml-dsa-65</code> (an
              Enterprise-only transit key type in the Vault documentation) — with{' '}
              <code className="bg-muted px-1 rounded border border-border">ml-kem-768</code> not
              among the documented transit key types — changes the internal transit key store
              without breaking the API surface. Applications simply update the <code>key_type</code>{' '}
              parameter during key creation, and Vault mechanically handles the larger PQC
              ciphertexts and nested encapsulation transparency.
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
      </LearnSection>

      {/* Section 4 */}
      <LearnSection
        sectionId="provider-roadmaps"
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
              status: 'Enterprise (documented key types)',
              statusCls: 'text-status-warning bg-status-warning/10 border-status-warning/30',
              details: [
                'Transit ml-dsa, slh-dsa and hybrid sign/verify key types — Enterprise only, per the Vault transit documentation',
                'ML-KEM transit key types and PQC seal/unseal — not documented; we found none announced',
                'Hybrid TLS (X25519+ML-KEM) for Vault API — via HPKE RFC 9180',
              ],
              note: 'On-premises deployment gives full control over upgrade timing. Dynamic secrets are available now and eliminate many HNDL risks without waiting for PQC algorithms.',
            },
            {
              provider: 'AWS Secrets Manager',
              status: 'Via KMS (docs read 5 Nov 2026)',
              statusCls: 'text-status-info bg-status-info/10 border-status-info/30',
              details: [
                'No secrets-manager-native PQC: Secrets Manager encrypts each secret value with an AES-256 data key that AWS KMS generates and encrypts under a symmetric encryption KMS key, and it supports only symmetric encryption KMS keys, so it cannot use an ML-KEM or ML-DSA KMS key',
                'AWS KMS itself has ML-DSA-44/65/87 signing key specs (documented June 2025) and ML-KEM key specs ML_KEM_512/768/1024 with Encapsulate and Decapsulate operations (documentation history entry dated 23 October 2026)',
                'Encapsulate and Decapsulate are not available in China Regions; key material cannot be imported into ML-DSA or ML-KEM KMS keys',
                'AWS SDK for Java 2.x can enable hybrid post-quantum key agreement by calling .postQuantumTlsEnabled(true) when building the AWS Common Runtime HTTP client',
                'No native dynamic secrets — use Lambda rotation or Vault AWS auth',
              ],
              note: 'Keep the distinction explicit: AWS KMS now offers ML-KEM keys for key establishment, but Secrets Manager at-rest encryption still uses AES-256 data keys under symmetric KMS keys, so a secret is not ML-KEM-encrypted at rest. Use hybrid post-quantum TLS for the KMS / Secrets Manager API calls and an ML-KEM KMS key only where your own design needs key establishment. Re-check the AWS KMS documentation and region scope before relying on this.',
            },
            {
              provider: 'Azure Key Vault (Managed HSM)',
              status: 'Planned 2026',
              statusCls: 'text-status-warning bg-status-warning/10 border-status-warning/30',
              details: [
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
                'Cloud KMS PQC: ML-DSA, SLH-DSA and ML-KEM generally available (Google’s 28 July 2026 announcement)',
                'CMEK uses a symmetric AES-256 Cloud KMS key, which is already quantum-resistant; PQC keys cannot be used as CMEK',
                'FIPS mode not available for Secret Manager',
              ],
              note: 'Secret Manager has no PQC setting of its own. Data at rest is protected with AES-256 (optionally your own CMEK); the quantum-relevant exposure is the TLS connection to the API.',
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
              <InlineTooltip term="Envelope Encryption">Envelope Encryption</InlineTooltip> Pattern
            </div>
            <p className="text-xs text-muted-foreground">
              AWS Secrets Manager and Google&apos;s default encryption both use envelope encryption:
              a DEK encrypts the data and a KEK protects the DEK. In both documented designs the KEK
              is symmetric (AWS Secrets Manager supports only symmetric encryption KMS keys; Google
              wraps DEKs with AES-256 or AES-128 KEKs), and Shor&apos;s algorithm does not break a
              symmetric KEK. Migrate the boundary that is actually asymmetric, and use a provider
              KEM option only where its service accepts it.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              <InlineTooltip term="BYOK">BYOK</InlineTooltip> (Bring Your Own Key)
            </div>
            <p className="text-xs text-muted-foreground">
              BYOK lets you generate key material in your own HSM or Vault instance and import it
              into the provider&apos;s key service. Whether that gives you control of a post-quantum
              upgrade depends on the key types the provider accepts for import: AWS KMS imports
              symmetric encryption, HMAC and asymmetric keys except ML-DSA and ML-KEM keys, so an
              ML-KEM KMS key has to be generated inside AWS KMS. Check each provider&apos;s import
              documentation.
            </p>
          </div>
        </div>
      </LearnSection>

      {/* Section 5 */}
      <LearnSection
        sectionId="kubernetes-cicd"
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
                "By default the API server stores Secrets unencrypted in etcd. Configure --encryption-provider-config on kube-apiserver with a KMS provider and use KMS v2 (KMS v1 is deprecated since Kubernetes 1.28 and disabled by default since 1.29). The provider uses envelope encryption, so an attacker needs both etcd and the KMS. The key type is set by the KMS plugin: AWS KMS ML-KEM keys use Encapsulate and Decapsulate, while the Encrypt operation needs an ENCRYPT_DECRYPT key, so whether a given plugin can use an ML-KEM key is not verified here; check the plugin's documentation before claiming ML-KEM protection for etcd.",
            },
            {
              title: 'External Secrets Operator (ESO)',
              content:
                "ESO's controller fetches secrets from an external store (Vault, AWS Secrets Manager, Azure Key Vault and others) and creates Kubernetes Secret objects that it keeps in sync. Those Secrets are stored in etcd like any other Secret, so etcd encryption at rest and RBAC on Secrets still apply. This sync pattern differs from direct delivery: Vault Agent Injector renders secrets to a shared memory volume mounted in the pod, and the Secrets Store CSI Driver mounts them as a volume (it can optionally also sync them as Kubernetes Secrets). GitOps repos need not contain secret values with either pattern. Protection of the stored value in the external store is that store's own design.",
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
                'Few or no secret copies in Kubernetes etcd: volume or agent delivery avoids them, an ESO sync creates them, so encrypt etcd at rest either way',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Lock size={10} className="text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LearnSection>

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
            to="/migrate?domain=kms"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Workbench</div>
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

      <VendorCoverageNotice migrateLayer="Security Stack" migrateDomain="kms" />

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
