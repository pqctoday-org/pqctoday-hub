// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  KeyRound,
  Lock,
  Shuffle,
  Cloud,
  RefreshCw,
  Building2,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Wrench,
  Route,
  Shield,
} from 'lucide-react'
import {
  KEY_SIZE_COMPARISONS,
  ENVELOPE_ENCRYPTION_STEPS,
  HYBRID_COMBINER_MODES,
  ENTERPRISE_SCENARIO,
} from '../data/kmsConstants'
import { KMS_PROVIDERS, KMS_STATUS_LABELS } from '../data/kmsProviderData'

interface KmsPqcIntroductionProps {
  onNavigateToWorkshop: () => void
}

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

export const KmsPqcIntroduction: React.FC<KmsPqcIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: PQC Key Management Fundamentals */}
      <CollapsibleSection
        icon={<KeyRound size={24} className="text-primary" />}
        title="PQC Key Management Fundamentals"
        defaultOpen
      >
        <p>
          Post-quantum cryptography fundamentally changes how organizations manage keys.{' '}
          <strong>
            <InlineTooltip term="NIST SP 800-227">NIST SP 800-227</InlineTooltip>
          </strong>{' '}
          establishes that <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> is a{' '}
          <strong>Key Encapsulation Mechanism only</strong> &mdash; it cannot sign. Similarly,{' '}
          <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> is for signatures only &mdash; it
          cannot encapsulate. This strict algorithm separation replaces the dual-use nature of{' '}
          <InlineTooltip term="RSA">RSA</InlineTooltip>, which could both encrypt and sign.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;A KEM can only establish a shared secret, not directly encrypt arbitrary data.
            Applications that relied on RSA PKCS#1 v1.5 or RSA-OAEP for direct encryption must adopt
            an envelope encryption pattern when migrating to ML-KEM.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; NIST SP 800-227, Recommendations for Key-Encapsulation Mechanisms
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="text-xs font-bold text-destructive mb-2">Classical: RSA Dual-Use</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; RSA-OAEP: direct encryption of data/keys</li>
              <li>&bull; RSA-PSS: digital signatures</li>
              <li>&bull; One key pair serves both purposes</li>
              <li>&bull; Simple key inventory: 1 key pair per entity</li>
            </ul>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">PQC: Strict Separation</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; ML-KEM: key encapsulation only (KEM)</li>
              <li>&bull; ML-DSA: digital signatures only</li>
              <li>&bull; Two key pairs per entity minimum</li>
              <li>&bull; Key inventory doubles during transition</li>
            </ul>
          </div>
        </div>

        {/* Key Size Explosion Table */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Key Size Comparison</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Algorithm
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Public Key
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Private Key
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                    Sig / CT
                  </th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    Security
                  </th>
                </tr>
              </thead>
              <tbody>
                {KEY_SIZE_COMPARISONS.filter((k) => k.type === 'classical').map((k) => (
                  <tr key={k.algorithm} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-destructive">{k.algorithm}</td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {k.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {k.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {k.signatureOrCiphertextBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-destructive">{k.nistLevel}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="py-1">
                    <div className="border-t-2 border-primary/30" />
                  </td>
                </tr>
                {KEY_SIZE_COMPARISONS.filter((k) => k.type === 'pqc').map((k) => (
                  <tr key={k.algorithm} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono text-primary">{k.algorithm}</td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {k.publicKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {k.privateKeyBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-right text-foreground">
                      {k.signatureOrCiphertextBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 px-2 text-success">{k.nistLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            PQC public keys are 4&ndash;8x larger than classical equivalents, impacting HSM storage,
            certificate sizes, and network bandwidth during key distribution.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 2: Envelope Encryption with ML-KEM */}
      <CollapsibleSection
        icon={<Lock size={24} className="text-primary" />}
        title="Envelope Encryption with ML-KEM"
      >
        <p>
          Because <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> produces a random shared
          secret (not a direct encryption),{' '}
          <strong>
            <InlineTooltip term="Envelope Encryption">envelope encryption</InlineTooltip>
          </strong>{' '}
          requires an extra KDF step compared to RSA-OAEP. RSA directly wraps the DEK in one step;
          ML-KEM encapsulates &rarr; derives a wrapping key via HKDF &rarr; wraps the DEK with
          AES-KW.
        </p>

        <div className="space-y-3">
          {ENVELOPE_ENCRYPTION_STEPS.map((step) => (
            <div key={step.id} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Step {step.step}
                </span>
                <span className="text-sm font-bold text-foreground">{step.title}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                  <div className="text-[10px] font-bold text-destructive mb-1">
                    Classical (RSA-OAEP)
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{step.classicalDescription}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground/70">{step.classicalArtifact}</span>
                    <span className="font-mono text-destructive">{step.classicalSize}</span>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <div className="text-[10px] font-bold text-primary mb-1">PQC (ML-KEM)</div>
                  <p className="text-xs text-muted-foreground mb-2">{step.pqcDescription}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground/70">{step.pqcArtifact}</span>
                    <span className="font-mono text-primary">{step.pqcSize}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data flow summary */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Envelope Encryption Flow</div>
          <div className="space-y-2 text-center">
            <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
              ML-KEM.Encaps(ek) &rarr; ciphertext + shared_secret
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
              HKDF-SHA-256(shared_secret, info=&quot;envelope-kek&quot;) &rarr; 256-bit wrapping key
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
              AES-256-KW(wrapping_key, DEK) &rarr; wrapped DEK
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-warning/10 text-warning text-xs font-bold">
              Store: KEM ciphertext + wrapped DEK (1,128 bytes total vs 256 bytes RSA)
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: Hybrid Key Wrapping */}
      <CollapsibleSection
        icon={<Shuffle size={24} className="text-primary" />}
        title="Hybrid Key Wrapping"
      >
        <p>
          <strong>
            <InlineTooltip term="NIST SP 800-227">SP 800-227</InlineTooltip>
          </strong>{' '}
          recommends hybrid combiners that derive a single key from both a classical and PQC shared
          secret:{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
            KDF(classical_shared || pqc_shared)
          </code>
          . This ensures that if either algorithm is broken, the derived key remains secure.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HYBRID_COMBINER_MODES.map((mode) => (
            <div key={mode.id} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-sm font-bold text-foreground mb-2">{mode.name}</div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-destructive font-bold shrink-0">Classical:</span>
                  <span>{mode.classical}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">PQC:</span>
                  <span>{mode.pqc}</span>
                </div>
                <div className="bg-background p-2 rounded border border-border font-mono text-[10px] break-all">
                  {mode.combiner}
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>
                    Output: <strong>{mode.outputKeySize * 8}-bit</strong> key
                  </span>
                  <span className="text-warning">{mode.totalOverhead}</span>
                </div>
                <p className="text-[10px] text-foreground/70">{mode.useCase}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 4: KMS Provider PQC Landscape */}
      <CollapsibleSection
        icon={<Cloud size={24} className="text-primary" />}
        title="KMS Provider PQC Landscape"
      >
        <p>
          Cloud <InlineTooltip term="KMS">KMS</InlineTooltip> providers and on-premises key
          management solutions are at different stages of PQC adoption. Understanding each
          provider&apos;s capabilities is critical for multi-cloud strategies.
        </p>

        <div className="space-y-4">
          {KMS_PROVIDERS.map((provider) => {
            const status = KMS_STATUS_LABELS[provider.pqcStatus]
            return (
              <div key={provider.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{provider.product}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border uppercase">
                    {provider.type}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                  {provider.fipsLevel && (
                    <span className="text-[10px] text-muted-foreground">{provider.fipsLevel}</span>
                  )}
                </div>

                {/* Algorithms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {provider.pqcAlgorithms.kem.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-primary mb-1">KEM</div>
                      <div className="space-y-1">
                        {provider.pqcAlgorithms.kem.map((algo) => (
                          <div key={algo.name} className="text-[10px] text-muted-foreground">
                            {algo.name}{' '}
                            <span className="text-foreground/50">&mdash; {algo.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {provider.pqcAlgorithms.sign.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-secondary mb-1">Signing</div>
                      <div className="space-y-1">
                        {provider.pqcAlgorithms.sign.map((algo) => (
                          <div key={algo.name} className="text-[10px] text-muted-foreground">
                            {algo.name}{' '}
                            <span className="text-foreground/50">&mdash; {algo.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* API Pattern */}
                <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre mb-2">
                  {provider.apiPattern}
                </pre>

                <p className="text-[10px] text-muted-foreground">{provider.notes}</p>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Section 5: PQC Key Rotation Strategies */}
      <CollapsibleSection
        icon={<RefreshCw size={24} className="text-primary" />}
        title="PQC Key Rotation Strategies"
      >
        <p>
          Key rotation with PQC algorithms introduces significant bandwidth and storage overhead.
          Enterprises must plan phased rotation aligned with compliance deadlines from{' '}
          <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> and{' '}
          <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip>.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            Bandwidth Impact: {ENTERPRISE_SCENARIO.name}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">
                {ENTERPRISE_SCENARIO.totalCertificates}
              </div>
              <div className="text-[10px] text-muted-foreground">Total Certificates</div>
            </div>
            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
              <div className="text-lg font-bold text-destructive">400</div>
              <div className="text-[10px] text-muted-foreground">Quantum-Vulnerable</div>
            </div>
            <div className="bg-success/5 rounded-lg p-3 border border-success/20 text-center">
              <div className="text-lg font-bold text-success">100</div>
              <div className="text-[10px] text-muted-foreground">Already Safe (AES-256)</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Rotating 300 TLS certificates from RSA-2048 (256 B pub key) to hybrid ML-DSA-65 + ECDSA
            (2,017 B) increases per-rotation bandwidth by approximately 528 KB for public keys
            alone. Certificate chains with larger signatures add more overhead.
          </p>
        </div>

        {/* Phased rotation approach */}
        <div className="space-y-2">
          {[
            {
              phase: 'Phase 1: Inventory',
              timeline: '2025-2026',
              description:
                'Catalog all cryptographic assets, identify quantum-vulnerable keys, establish baseline metrics. Required by PCI DSS v4.0.1 Req. 12.3.3.',
            },
            {
              phase: 'Phase 2: Hybrid Deploy',
              timeline: '2026-2028',
              description:
                'Issue hybrid certificates (classical + PQC) for TLS, upgrade HSM firmware, configure dual-key rotation policies in KMS.',
            },
            {
              phase: 'Phase 3: Full PQC',
              timeline: '2028-2033',
              description:
                'Deprecate classical-only keys per NIST IR 8547. Migrate all remaining certificates to PQC-only or composite. CNSA 2.0 exclusively PQC by 2033.',
            },
          ].map((p) => (
            <div key={p.phase} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-foreground">{p.phase}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {p.timeline}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Compliance deadlines */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Compliance Deadlines</div>
          <div className="space-y-2">
            {ENTERPRISE_SCENARIO.complianceDeadlines.map((d) => (
              <div
                key={d.framework}
                className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border"
              >
                <span className="text-sm font-bold text-primary shrink-0 w-16">{d.deadline}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">{d.framework}</div>
                  <p className="text-[10px] text-muted-foreground">{d.requirement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 6: Enterprise Architecture Patterns */}
      <CollapsibleSection
        icon={<Building2 size={24} className="text-primary" />}
        title="Enterprise Architecture Patterns"
      >
        <p>
          Multi-cloud PQC key management requires a unified architecture that abstracts
          provider-specific APIs while maintaining centralized policy control.{' '}
          <InlineTooltip term="KMIP">KMIP</InlineTooltip> (Key Management Interoperability Protocol)
          provides a vendor-neutral interface for cross-provider key operations.
        </p>

        {/* Architecture diagram */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            Multi-Cloud PQC Key Architecture
          </div>
          <div className="space-y-2 text-center">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                Applications
              </div>
              <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                Microservices
              </div>
              <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                IoT / Edge
              </div>
            </div>
            <div className="text-muted-foreground text-xs">&darr; REST / gRPC &darr;</div>
            <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
              Enterprise KMS Orchestrator (KMIP + policy engine)
            </div>
            <div className="text-muted-foreground text-xs">&darr; Provider APIs &darr;</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                AWS KMS
              </div>
              <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                Google Cloud KMS
              </div>
              <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                Azure Key Vault
              </div>
            </div>
            <div className="text-muted-foreground text-xs">&darr; HSM-backed &darr;</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold">
                On-Prem HSM (Thales / Entrust)
              </div>
              <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold">
                Vault Transit Engine
              </div>
            </div>
          </div>
        </div>

        {/* Key principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">KMIP Interoperability</div>
            <p className="text-xs text-muted-foreground">
              KMIP 2.1+ supports PQC key types. Use KMIP as the abstraction layer for cross-provider
              key operations: create, wrap, unwrap, rotate, destroy. Thales CipherTrust and
              HashiCorp Vault both support KMIP server mode.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Key Backup Strategy</div>
            <p className="text-xs text-muted-foreground">
              PQC key backup requires quantum-safe wrapping for the backup envelope. Use ML-KEM to
              wrap backup keys, with M-of-N key splitting for disaster recovery. Ensure backup HSMs
              support PQC firmware.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Crypto Agility</div>
            <p className="text-xs text-muted-foreground">
              Design the KMS abstraction layer to support algorithm swaps without application
              changes. Tag keys with algorithm metadata, version them, and use feature flags to
              route traffic between classical and PQC paths.
            </p>
          </div>
        </div>

        {/* Provider rotation section */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">
            Provider-Specific Auto-Rotation
          </div>
          <div className="space-y-2">
            {ENTERPRISE_SCENARIO.kmsProviders.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border"
              >
                <Shield size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">{p.name}</div>
                  <p className="text-[10px] text-muted-foreground">{p.rotationFeature}</p>
                  <p className="text-[10px] text-primary/80">{p.pqcCapability}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC Operations</div>
              <div className="text-xs text-muted-foreground">
                PKCS#11 v3.2 mechanisms, firmware migration, and FIPS validation
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Wrench size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Design patterns for algorithm-agnostic cryptographic infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Classical + PQC hybrid schemes for the transition period
              </div>
            </div>
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Guide</div>
              <div className="text-xs text-muted-foreground">
                Software catalog and migration workflows
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Design key hierarchies, visualize envelope encryption, and plan PQC rotation strategies.
        </p>
      </div>
    </div>
  )
}
