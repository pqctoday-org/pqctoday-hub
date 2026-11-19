// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import {
  Cloud,
  Globe,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'

interface CloudPqcIntroductionProps {
  onNavigateToWorkshop: (step?: number) => void
}

export const CloudPqcIntroduction: React.FC<CloudPqcIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()

  return (
    <div className="space-y-8">
      {/* Educational Scope Banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/85">
        <div className="flex items-start gap-3">
          <Cloud size={18} className="mt-0.5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Educational Scope &amp; Production Verification
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This module uses fictional multi-cloud workloads and sample configurations to teach
              how to evaluate cryptographic boundaries and plan PQC cutovers. Completing exercises
              here does not verify your deployed cloud accounts or SaaS tenants — apply the
              verification commands and evidence checks below using your own production tools.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Shared Responsibility & Protected Assets */}
      <section
        data-section-id="shared-responsibility"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Layers size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            1. Shared Responsibility &amp; Protected Assets
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Moving workloads to AWS, Azure, GCP, or SaaS does not hand post-quantum migration to the
          provider. Cloud shared responsibility splits cryptography across three layers:{' '}
          <strong>provider-managed infrastructure</strong> (physical HSMs, hypervisors, default
          service endpoints), <strong>shared configuration surfaces</strong> (CDN/load-balancer TLS
          policies, KMS key specs, regional endpoints), and{' '}
          <strong>customer-controlled choices</strong> (origin-leg TLS, client SDK group
          preferences, BYOK key-import ceremonies, and SaaS vendor governance).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Distinguish Business Services from Protected Assets
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A cloud storage or records-archiving service is a <strong>business service</strong>;
              the long-lived encrypted records stored inside it are the{' '}
              <strong>protected asset</strong>. Prioritizing migration requires classifying the
              asset’s confidentiality horizon (for example, 10–30 years of{' '}
              <InlineTooltip term="HNDL">harvest-now-decrypt-later (HNDL)</InlineTooltip> exposure)
              and tracing every transport and key-wrapping surface that touches it.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              What to Evaluate in Production Cloud Tooling
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>
                <strong>Cloud posture &amp; IaC scanners:</strong> Can they flag classical-only TLS
                policies, legacy HSM tiers, and unapproved KMS key specs across all accounts?
              </li>
              <li>
                <strong>Telemetry pipelines:</strong> Do load-balancer logs and CloudTrail record
                negotiated TLS NamedGroups rather than only protocol version?
              </li>
              <li>
                <strong>Limitation:</strong> Passing a static IaC check does not prove live traffic
                negotiates hybrid key exchange — runtime handshake telemetry is required.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Edge, CDN & Origin TLS */}
      <section data-section-id="edge-and-tls" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Globe size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            2. Edge, CDN &amp; Origin TLS (RFC 9846 &amp; RFC 10024)
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          TLS 1.3 (<InlineTooltip term="TLS 1.3">RFC 9846</InlineTooltip>, which obsoleted RFC 8446
          in July 2026) paired with PQ/T hybrid key agreement (RFC 10024, led by{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">X25519MLKEM768</code>, IANA
          NamedGroup <code className="text-xs bg-muted px-1.5 py-0.5 rounded">0x11EC</code>) is the
          highest-leverage control against HNDL interception across cloud edges. Note that TLS
          hybrid groups are defined by RFC 10024 and negotiated via NamedGroup codepoints — not by{' '}
          <InlineTooltip term="HPKE">HPKE (RFC 9180)</InlineTooltip>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Client-to-Edge Leg</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CloudFront, AWS ALB, Google Cloud Load Balancing, and Azure Front Door terminate
              browser and API traffic at the edge. Enabling a hybrid TLS 1.3 policy protects only
              this outer hop.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Edge-to-Origin &amp; Mesh</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CDN-to-origin pools, API gateways, and cross-region service meshes (Envoy/Istio) are
              configured independently. An external scanner showing{' '}
              <code className="text-xs">0x11EC</code> at the CDN does not verify the origin leg.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Middlebox ClientHello Size</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An <code className="text-xs">X25519MLKEM768</code> key share adds ~1,216 bytes
              (32-byte X25519 + 1,184-byte <InlineTooltip term="ML-KEM">ML-KEM-768</InlineTooltip>{' '}
              public key), pushing ClientHello across two TCP segments (~1,460-byte MSS). Legacy DPI
              proxies or WAFs can truncate or reset the handshake unless tested in canary rollouts.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Cloud KMS, BYOK & Storage */}
      <section
        data-section-id="kms-byok-storage"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <KeyRound size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            3. Cloud KMS, BYOK &amp; Storage Boundaries (Late 2026)
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Object storage and managed databases encrypt data at rest with symmetric AES-256 keys
          (already quantum-resistant at 256-bit strength), while cloud KMS protects key-encryption
          keys (KEKs) and signing keys. Late-2026 provider capabilities vary significantly by key
          family, region, and import path — never generalize one cloud’s model to another:
        </p>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">AWS KMS &amp; AWS CloudHSM</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AWS KMS offers FIPS 204 <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> signing
              keys (since June 2025) and FIPS 203 ML-KEM key-establishment keys (launched 26 October
              2026 in commercial and GovCloud Regions; unavailable in China, Middle East UAE, and
              Middle East Bahrain Regions). Important boundaries: AWS KMS import wrapping is
              RSA-only (RSA_2048, RSA_3072, or RSA_4096, or SM2 in China Regions) and cannot import
              material into ML-DSA or ML-KEM keys; AWS KMS has no KMIP endpoint;{' '}
              <code className="text-xs">Decapsulate</code> returns the 32-byte ML-KEM shared secret
              in plaintext to the caller; and no KMS key policy condition can require post-quantum
              TLS (TLS group negotiation is a client setting verified via CloudTrail{' '}
              <code className="text-xs">tlsDetails.keyExchange</code>). AWS CloudHSM documents
              ML-DSA (FIPS mode on <code className="text-xs">hsm2m.medium</code> clusters from 1
              September 2026) but documents no ML-KEM command.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Google Cloud KMS</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Google Cloud KMS offers generally available ML-DSA and{' '}
              <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> signing (July 2026). Its
              quantum-safe key import (in Preview for software-protected keys) wraps imported key
              material with HPKE (RFC 9180) using X-Wing, ML-KEM-768, or ML-KEM-1024; standard Cloud
              KMS key import uses RSA wrapping. Because Google’s July 2026 announcement and release
              notes differ on ML-KEM GA vs. Preview status, verify SLA and protection level in your
              target project and region.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              Azure Key Vault / Managed HSM &amp; FIPS 140-3 Cutover
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Azure Key Vault and Managed HSM BYOK transfer keys wrapped with{' '}
              <code className="text-xs">CKM_RSA_AES_KEY_WRAP</code> under an RSA-HSM key exchange
              key (2048, 3072, or 4096 bits), with no documented KMIP endpoint. Across all three
              clouds, verify active FIPS 140-3 CMVP certificates: NIST moved FIPS 140-2 validations
              to Historical status in September 2026.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: SaaS, Federation & Evidence */}
      <section
        data-section-id="saas-and-governance"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            4. SaaS, Federation &amp; Verifiable Evidence
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          In third-party SaaS and federated identity (OIDC/SAML), you cannot directly edit the
          vendor’s TLS stack or signing HSM. Your control shifts from configuration to{' '}
          <strong>evidence-based governance</strong> under frameworks such as{' '}
          <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip> (final October 2026) and
          US federal civilian mandates (EO 14412 and OMB M-26-15).
        </p>

        <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle size={16} className="text-status-warning shrink-0" />
            <span>Core Governance Rule: Unknown Never Means Low Exposure</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When a SaaS vendor leaves a PQC questionnaire blank, answers “roadmap TBD”, or cites
            only a marketing page, record that surface as <strong>Unverified / Evidence Gap</strong>
            — never as low risk. Pair vendor <InlineTooltip term="CBOM">CBOM</InlineTooltip>{' '}
            requests with independent external TLS probes, clear BYOK boundary definitions (primary
            DB vs. backups/logs), IdP token-size testing for future ML-DSA JWTs/SAML assertions, and
            subprocessor inheritance checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 size={14} className="text-status-success shrink-0" />
            <span>
              Ready to map a multi-cloud estate, verify provider commands, and test cutover failure
              modes?
            </span>
          </div>
          <Button variant="gradient" size="sm" onClick={() => onNavigateToWorkshop(0)}>
            Launch Workshop
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>
      </section>

      <ReadingCompleteButton />
    </div>
  )
}
