// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Key,
  Database,
  BarChart3,
  Shield,
  ArrowRight,
  Lock,
  BookOpen,
  Route,
  Wifi,
} from 'lucide-react'
import {
  IAM_PROTOCOLS,
  DIRECTORY_SERVICES,
  ZERO_TRUST_LAYERS,
  CRYPTO_RISKS,
  SIGNATURE_SIZE_DATA,
} from '../data/iamConstants'
import { IAM_VENDORS, PQC_STATUS_LABELS, getVendorPqcStatus } from '../data/iamProviderData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface IAMPQCIntroductionProps {
  onNavigateToWorkshop: () => void
}

// Local CollapsibleSection replaced by the shared anchored LearnSection (2026-07-30).

export const IAMPQCIntroduction: React.FC<IAMPQCIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Crypto in IAM Foundations */}
      <LearnSection
        sectionId="iam-crypto-foundations"
        icon={<Lock size={24} className="text-primary" />}
        title="Crypto in IAM: Tokens, Certificates, MFA"
        defaultOpen
      >
        <p>
          Identity and Access Management relies on cryptography at every layer. From{' '}
          <strong>
            <InlineTooltip term="JWT">JWT</InlineTooltip>
          </strong>{' '}
          and{' '}
          <strong>
            <InlineTooltip term="SAML">SAML</InlineTooltip>
          </strong>{' '}
          token signing to{' '}
          <strong>
            <InlineTooltip term="TLS">TLS</InlineTooltip>
          </strong>{' '}
          channels and{' '}
          <strong>
            <InlineTooltip term="PKI">PKI</InlineTooltip>
          </strong>{' '}
          certificates, a quantum computer running{' '}
          <strong>
            <InlineTooltip term="Shor's Algorithm">Shor&rsquo;s Algorithm</InlineTooltip>
          </strong>{' '}
          can break the RSA and ECDSA signatures that protect every identity assertion in your
          enterprise.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-status-error/20">
          <div className="text-sm font-bold text-status-error mb-2">
            Harvest Now, Decrypt Later (HNDL) Threat to IAM
          </div>
          <p className="text-xs text-muted-foreground">
            Adversaries are recording encrypted network traffic today. When a Cryptographically
            Relevant Quantum Computer (CRQC) becomes available, they will decrypt all captured
            Kerberos ticket exchanges, SAML assertions, and JWT signing key exchanges &mdash;
            granting retroactive access to every identity token ever issued.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-bold text-foreground">HNDL Risk by Token Type</div>
          {CRYPTO_RISKS.map((risk) => {
            const riskColor =
              risk.hndlRisk === 'critical'
                ? 'border-status-error/30 bg-status-error/5'
                : risk.hndlRisk === 'high'
                  ? 'border-warning/30 bg-warning/5'
                  : risk.hndlRisk === 'medium'
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-status-success/30 bg-status-success/5'
            const riskLabelColor =
              risk.hndlRisk === 'critical'
                ? 'text-status-error'
                : risk.hndlRisk === 'high'
                  ? 'text-warning'
                  : risk.hndlRisk === 'medium'
                    ? 'text-primary'
                    : 'text-status-success'
            return (
              <div key={risk.tokenType} className={`rounded-lg p-3 border ${riskColor}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-foreground">{risk.tokenType}</span>
                  <span className={`text-[10px] font-bold ${riskLabelColor} uppercase`}>
                    {risk.hndlRisk} risk
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Lifetime: {risk.typicalLifetime}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{risk.rationale}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            Signature Size: Classical vs PQC
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Algorithm
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Sig Bytes
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Sign Time
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SIGNATURE_SIZE_DATA).map(([alg, data]) => {
                  const isPqc = alg.startsWith('ML-DSA')
                  return (
                    <tr key={alg} className="border-b border-border/50">
                      <td
                        className={`py-2 px-2 font-mono ${isPqc ? 'text-primary' : 'text-status-error'}`}
                      >
                        {alg}
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">
                        {data.bytes.toLocaleString()} B
                      </td>
                      <td className="py-2 px-2 text-right text-foreground">{data.timingMs}ms</td>
                      <td
                        className={`py-2 px-2 ${isPqc ? 'text-status-success' : 'text-status-error'}`}
                      >
                        {isPqc ? 'Quantum-Safe' : 'Vulnerable'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </LearnSection>

      {/* Section 2: Token Migration */}
      <LearnSection
        sectionId="token-migration"
        icon={<Key size={24} className="text-primary" />}
        title="JWT, SAML, and OIDC Token Signing with ML-DSA"
      >
        <p>
          <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (FIPS 204, formerly
          CRYSTALS-Dilithium) is the primary NIST-standardized replacement for RSA and ECDSA in all
          token signing operations. Its three parameter sets (ML-DSA-44, ML-DSA-65, ML-DSA-87) allow
          calibrating security level against signature size.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const).map((alg) => {
            const levels: Record<string, { level: string; use: string }> = {
              'ML-DSA-44': {
                level: 'NIST Level 2',
                use: 'Short-lived tokens (OAuth2 access tokens ≤1h)',
              },
              'ML-DSA-65': {
                level: 'NIST Level 3',
                use: 'Enterprise IAM (SSO, SAML, OIDC ID tokens)',
              },
              'ML-DSA-87': {
                level: 'NIST Level 5',
                use: 'Government / NSS (CNSA 2.0 compliant)',
              },
            }
            const info = levels[alg]
            return (
              <div key={alg} className="bg-muted/50 rounded-lg p-3 border border-primary/20">
                <div className="text-xs font-bold text-primary mb-1 font-mono">{alg}</div>
                <div className="text-[10px] text-muted-foreground mb-1">{info.level}</div>
                <div className="text-[10px] text-foreground/80">{info.use}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Signature:{' '}
                  {SIGNATURE_SIZE_DATA[
                    alg as keyof typeof SIGNATURE_SIZE_DATA
                  ].bytes.toLocaleString()}{' '}
                  bytes
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-bold text-foreground">Protocol Migration Reference</div>
          {IAM_PROTOCOLS.map((protocol) => (
            <div key={protocol.id} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">{protocol.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {protocol.tokenType}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-status-error/5 rounded p-2 border border-status-error/20">
                  <div className="text-[9px] font-bold text-status-error mb-0.5">Classical</div>
                  <code className="text-[10px] text-muted-foreground font-mono">
                    {protocol.signingAlgorithm}
                  </code>
                </div>
                <div className="bg-primary/5 rounded p-2 border border-primary/20">
                  <div className="text-[9px] font-bold text-primary mb-0.5">PQC Replacement</div>
                  <code className="text-[10px] text-muted-foreground font-mono">
                    {protocol.pqcReplacement}
                  </code>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{protocol.notes}</p>
            </div>
          ))}
        </div>
      </LearnSection>

      {/* Section 3: Directory Services */}
      <LearnSection
        sectionId="directory-services"
        icon={<Database size={24} className="text-primary" />}
        title="Active Directory, LDAP, and Kerberos Under Quantum Threat"
      >
        <p>
          Enterprise directory services &mdash; Active Directory,{' '}
          <InlineTooltip term="LDAP">LDAP</InlineTooltip>, and{' '}
          <InlineTooltip term="Kerberos">Kerberos</InlineTooltip> &mdash; all rely on classical
          cryptography for key exchange, authentication, and session establishment. Kerberos PKINIT
          uses RSA for initial authentication; LDAP channels use TLS with classical ciphers.
        </p>

        <div className="space-y-3">
          {DIRECTORY_SERVICES.map((service) => {
            const hndlColor =
              service.hndlScore >= 8
                ? 'text-status-error'
                : service.hndlScore >= 6
                  ? 'text-warning'
                  : 'text-primary'
            const hndlLabel =
              service.hndlScore >= 8 ? 'Critical' : service.hndlScore >= 6 ? 'High' : 'Medium'

            return (
              <div key={service.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{service.name}</span>
                  <span className={`text-[10px] font-bold ${hndlColor}`}>
                    HNDL Score: {service.hndlScore}/10 ({hndlLabel})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {service.protocols.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{service.migrationPath}</p>
                <div className="text-[10px] text-primary/80">{service.vendorTimeline}</div>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-status-error/20">
          <div className="text-sm font-bold text-foreground mb-2">
            Why Kerberos Is the Highest Priority
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              &bull; PKINIT (RFC 4556) uses RSA to encrypt the initial authentication exchange
            </li>
            <li>
              &bull; TGTs are valid 10 hours; service tickets 10 hours &mdash; long HNDL windows
            </li>
            <li>
              &bull; A CRQC decrypting PKINIT exchanges enables domain-wide ticket forgery (Golden
              Ticket equivalent)
            </li>
            <li>
              &bull; Windows Server 2025 experimental PKINIT PQC available; GA expected 2026-2027
            </li>
          </ul>
        </div>
      </LearnSection>

      {/* Section 4: Vendor Roadmaps */}
      <LearnSection
        sectionId="vendor-roadmaps"
        icon={<BarChart3 size={24} className="text-primary" />}
        title="Okta, Entra, PingFederate, ForgeRock Migration Paths"
      >
        <p>
          IAM vendors are at different stages of PQC adoption. Understanding each vendor&rsquo;s
          roadmap is critical for procurement decisions and migration planning. Vendors with GA or
          Preview status can begin pilots today.
        </p>

        <div className="space-y-3">
          {IAM_VENDORS.slice(0, 4).map((vendor) => {
            const status = PQC_STATUS_LABELS[getVendorPqcStatus(vendor)]
            return (
              <div key={vendor.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{vendor.vendor}</span>
                      <span className="text-[10px] text-muted-foreground">{vendor.product}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{vendor.notes}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">Vendor Selection Criteria</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                item: 'Published PQC roadmap with clear timelines',
                detail: 'Vendors without a documented roadmap will create migration blockers',
              },
              {
                item: 'Hybrid mode support during transition',
                detail: 'Cannot force cut-over; need classical+PQC parallel operation',
              },
              {
                item: 'FIPS 204 (ML-DSA) compliance',
                detail: 'Only NIST-standardized algorithms qualify for regulated environments',
              },
              {
                item: 'JWK Set (JWKS) PQC key publishing',
                detail: 'Relying parties need JWKS endpoint to verify PQC-signed tokens',
              },
            ].map((criterion) => (
              <div key={criterion.item} className="bg-background rounded p-2 border border-border">
                <div className="text-[10px] font-bold text-foreground mb-0.5">{criterion.item}</div>
                <p className="text-[10px] text-muted-foreground">{criterion.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </LearnSection>

      {/* Section 5: Zero Trust Identity */}
      <LearnSection
        sectionId="zero-trust-identity"
        icon={<Shield size={24} className="text-primary" />}
        title="PQC-Aware Zero Trust Identity Architecture"
      >
        <p>
          <InlineTooltip term="Zero Trust Architecture">Zero Trust</InlineTooltip> architectures
          assume no implicit trust and verify every identity claim explicitly. Migrating to PQC
          strengthens the cryptographic foundation of each zero trust pillar.
        </p>

        <div className="space-y-3">
          {ZERO_TRUST_LAYERS.map((layer) => {
            const complexityColor =
              layer.migrationComplexity === 'high'
                ? 'text-status-error'
                : layer.migrationComplexity === 'medium'
                  ? 'text-warning'
                  : 'text-status-success'
            return (
              <div key={layer.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{layer.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {layer.pillar} Pillar
                  </span>
                  <span className={`text-[10px] font-medium ${complexityColor}`}>
                    {layer.migrationComplexity.charAt(0).toUpperCase() +
                      layer.migrationComplexity.slice(1)}{' '}
                    complexity
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{layer.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-status-error/5 rounded p-2 border border-status-error/20">
                    <div className="text-[9px] font-bold text-status-error mb-0.5">Current</div>
                    <code className="text-[10px] text-muted-foreground font-mono">
                      {layer.currentCrypto}
                    </code>
                  </div>
                  <div className="bg-primary/5 rounded p-2 border border-primary/20">
                    <div className="text-[9px] font-bold text-primary mb-0.5">PQC Approach</div>
                    <p className="text-[10px] text-muted-foreground">{layer.pqcApproach}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">Architecture Flow</div>
          <div className="space-y-2 text-center">
            <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
              PQC-Signed Identity Assertion (ML-DSA-65 JWT / SAML)
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-secondary/10 text-secondary text-[10px] font-bold">
              Hybrid TLS Channel (ML-KEM-768 + X25519)
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-muted text-foreground text-[10px] font-bold">
              PQC Device Attestation (ML-DSA-44 Certificate)
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold">
              Policy Enforcement Point (HMAC-256 or ML-DSA authorization tokens)
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-status-success/10 text-status-success text-[10px] font-bold">
              SLH-DSA Signed Audit Log (tamper-evident, non-repudiable)
            </div>
          </div>
        </div>
      </LearnSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                PKI &amp; Certificate Authority
              </div>
              <div className="text-xs text-muted-foreground">
                Certificate lifecycle, CA hierarchies, and PQC certificate formats
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                KMS &amp; PQC Key Management
              </div>
              <div className="text-xs text-muted-foreground">
                Envelope encryption, key hierarchy, and cross-provider KMS strategies
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Algorithm-agnostic design patterns for IAM infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Workbench</div>
              <div className="text-xs text-muted-foreground">
                IAM vendor migration status and PQC product catalog
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
          Start Workshop <ArrowRight size={18} aria-hidden="true" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Audit IAM crypto, migrate JWT signing, analyze directory services, and design a zero trust
          PQC roadmap.
        </p>
      </div>

      <LearnSection
        sectionId="federation-eap"
        title="Identity Federation at Scale (eduroam &amp; EAP)"
        icon={<Wifi size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Enterprise IAM usually means web SSO. Federated network access is a different problem:
          EAP-TLS inside RADIUS, across thousands of independently operated institutions, with a
          supplicant on the far end that may be a decade old. eduroam is the canonical example — one
          credential authenticating across research and education networks worldwide.
        </p>
        <p className="text-muted-foreground">
          Two properties make this harder than web SSO under PQC. EAP fragments over RADIUS, so
          larger certificates and signatures multiply round trips on exactly the link where they
          hurt. And the supplicant is often embedded firmware that cannot be updated on the
          federation&rsquo;s schedule, so the classical path has to stay open far longer than the
          server operator would like.
        </p>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-semibold text-foreground">Where the research is</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            This is one of the better-served areas in the literature, which is why the section can
            be grounded rather than speculative.
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>
              <Link
                to="/library?ref=Post-Quantum-Enhancements-to-TLS-Based-EAP-Methods-WG-draft"
                className="text-primary hover:underline"
              >
                Post-Quantum Enhancements to TLS-Based EAP Methods
              </Link>
            </li>
            <li>
              <Link
                to="/library?ref=Post-Quantum-Key-Encapsulation-Mechanisms-PQ-KEMs-in-EAP-AKA"
                className="text-primary hover:underline"
              >
                Post-Quantum KEMs in EAP
              </Link>
            </li>
            <li>
              <Link
                to="/library?ref=Enhancing-Security-in-EAP-AKA-prime-with-Hybrid-Post-Quantum"
                className="text-primary hover:underline"
              >
                Hybrid PQC in EAP-AKA&rsquo;
              </Link>
            </li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          Education / Research in the Industry Landscape links to{' '}
          <Link to="/learn/research-quantum-impact" className="text-primary hover:underline">
            Researcher Quantum Impact
          </Link>{' '}
          for the long-lived-data framing; the federation mechanics live here, because they are an
          IAM problem rather than a sector one.
        </p>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
