// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import {
  ShieldAlert,
  ShieldCheck,
  Link2,
  Package,
  Globe,
  ArrowRight,
  Terminal,
  FileKey,
  Library,
  Layers,
  AlertTriangle,
  Cpu,
  Shield,
  Boxes,
  HardDrive,
  Workflow,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { CODE_SIGNING_ALGORITHMS, PACKAGE_MANAGERS, SIGSTORE_STEPS } from '../constants'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface CodeSigningIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const CodeSigningIntroduction: React.FC<CodeSigningIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()

  const allAlgorithms = [...CODE_SIGNING_ALGORITHMS.classical, ...CODE_SIGNING_ALGORITHMS.pqc]

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Why Code Signing Matters */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldAlert size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Why Code Signing Matters</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>Code signing</strong> is the cryptographic mechanism that guarantees software
            integrity and publisher authenticity. Every operating system, package manager, and app
            store relies on digital signatures to ensure that binaries have not been tampered with
            after publication.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-medium text-foreground/90">
              A compromised signing key is a skeleton key to every machine that trusts it.
            </p>
          </div>
          <div className="space-y-2">
            {[
              {
                t: 'SolarWinds (2020)',
                d: 'Attackers compromised the Orion software build system, so a vulnerability shipped inside Orion updates released between March and June 2020; it was not present in the source code repository. CISA reports that the adversary added a malicious version of an Orion library to the software lifecycle and that it was then signed by the legitimate SolarWinds code signing certificate. SolarWinds believed fewer than 18,000 customers may have had an installation of the affected Orion products.',
              },
              {
                t: '3CX Supply Chain (2023)',
                d: 'Mandiant found that 3CX\u2019s network was first breached through malicious software downloaded from the Trading Technologies website: a tampered X_TRADER installer, signed with the subject \u201cTrading Technologies International, Inc\u201d. The attackers then distributed a trojanized 3CX DesktopApp (18.12.416 and earlier) that 3CX offered for download. Mandiant called it the first time it had seen one software supply chain attack lead to another.',
              },
              {
                t: 'Codecov Bash Uploader (2021)',
                d: 'A malicious party gained access to Codecov’s Bash Uploader script and modified it without authorization, so it exported CI-related information to a third-party server. That information could include API keys, deploy keys, passwords and authentication tokens.',
              },
            ].map((attack) => (
              <div key={attack.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{attack.t}</div>
                  <p className="text-xs text-muted-foreground">{attack.d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            These attacks exploited trust in code signing infrastructure. Post-quantum code signing
            must protect not only against today&apos;s threats but also against future signature
            forgery: once a quantum computer can derive private keys from public keys, an attacker
            could sign code that verifiers still accept. Unlike{' '}
            <InlineTooltip term="HNDL">harvest-now-decrypt-later</InlineTooltip>, which concerns
            encrypted data recorded today, this risk needs nothing to be collected in advance,
            because public keys and certificates are already public.
          </p>
        </div>
      </section>

      {/* Section 2: Supply Chain Risk & the Quantum Amplifier */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Boxes size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Supply Chain Risk &amp; the Quantum Amplifier
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The attacks above are symptoms of deeper structural problems in modern{' '}
            <InlineTooltip term="Software Supply Chain">software supply chains</InlineTooltip>. As
            software composition grows more complex, the attack surface expands &mdash; and quantum
            computing threatens to break the cryptographic foundations that hold it together.
          </p>

          {/* Part A: Supply Chain Attack Surface */}
          <div className="text-xs font-bold text-foreground uppercase tracking-wide">
            The Software Supply Chain Attack Surface
          </div>
          <div className="space-y-2">
            {[
              {
                t: 'Dependency Sprawl',
                d: 'Applications pull in many transitive dependencies. Each dependency is a link in the trust chain \u2014 and each link is only as strong as its maintainer\u2019s signing practices.',
              },
              {
                t: 'The Transitive Trust Problem',
                d: 'You audit your direct dependencies, but do you audit their dependencies? A malicious package five levels deep in the dependency tree can execute arbitrary code in your application.',
              },
              {
                t: 'CI/CD Pipeline as Attack Surface',
                d: 'Build systems, artifact registries, and deployment pipelines are high-value targets. The Codecov Bash Uploader attack shows that a script a pipeline downloads and runs can be modified at its source, and the modified script then runs in the CI systems that fetch it. The SolarWinds compromise shows that checking only the source repository is not enough, because the vulnerability came from the build system. Every step from source code to deployed binary is an attack surface.',
              },
              {
                t: 'Build Provenance & SBOM',
                d: 'An SBOM documents what goes into a build, but build provenance answers how it was built and who built it. Without cryptographically signed provenance, an attacker can substitute a tampered artifact that passes all hash checks.',
              },
              {
                t: 'Verification Frameworks',
                d: 'Frameworks like SLSA and in-toto provide structured approaches to supply chain verification \u2014 defining security levels based on how much of the build pipeline is cryptographically attested. Their guarantees depend entirely on the strength of the underlying signatures.',
              },
            ].map((challenge) => (
              <div key={challenge.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{challenge.t}</div>
                  <p className="text-xs text-muted-foreground">{challenge.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Part B: How Quantum Computing Changes the Equation */}
          <div className="text-xs font-bold text-foreground uppercase tracking-wide mt-6">
            How Quantum Computing Changes the Equation
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground/90">
              Today, supply chain attackers get malicious code signed or distributed by compromising
              a build system, an identity or a signing key. A quantum-capable adversary would add
              another route: deriving a private key from its public key, without breaking into the
              key holder.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                Another Route: Key Derivation
              </div>
              <p className="text-xs text-muted-foreground">
                Today&apos;s attacks work through build-system or identity compromise as well as key
                theft (the SolarWinds and 3CX cases above). A quantum attacker running{' '}
                <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip> could
                add a further route for any key whose algorithm it can break (RSA, ECDSA): deriving
                the private key from the public key, with no infiltration of the key holder. It
                would not remove the other routes.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Long-Lived Trust, Not HNDL</div>
              <p className="text-xs text-muted-foreground">
                Signed binaries and certificates carry only public keys, so nothing secret has to be
                harvested. The risk is future forgery: once a quantum computer can derive private
                keys, an attacker could create new signatures that chain to certificates verifiers
                still trust, or artifacts that appear signed by a publisher whose old key is still
                accepted. <InlineTooltip term="HNDL">Harvest-now-decrypt-later</InlineTooltip> is
                reserved for encrypted data. For signatures the controls are to stop trusting
                vulnerable keys in time, and to validate old signatures with timestamps and archive
                evidence that remain trustworthy.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-warning mb-1">Cascading Trust Breakdown</div>
              <p className="text-xs text-muted-foreground">
                An attacker holding the private key of a{' '}
                <InlineTooltip term="Root CA">Root CA</InlineTooltip> or of an issuing CA could
                issue certificates for any subject that CA vouches for, and so sign software as{' '}
                <em>any</em> publisher under it. A publisher&apos;s own leaf key is scoped to that
                publisher, while an issuing CA key is scoped to everything the CA issues (limited
                only by constraints in the chain). If a quantum computer can break the CA&apos;s
                algorithm, that CA private key can be derived from its public key.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-warning mb-1">
                Scale: One Key vs a Shared Weakness
              </div>
              <p className="text-xs text-muted-foreground">
                A stolen leaf signing key compromises one publisher, and a stolen issuing CA key
                compromises everything that CA vouches for. A quantum break of{' '}
                <InlineTooltip term="ECDSA">ECDSA</InlineTooltip> or{' '}
                <InlineTooltip term="RSA">RSA</InlineTooltip> is a <em>shared weakness</em>: every
                key of that algorithm becomes derivable from its public key once a capable computer
                exists. That does not mean one event recovers all private keys &mdash; each key must
                still be attacked separately, at the attacker&apos;s cost &mdash; but migration
                cannot be limited to one publisher.
              </p>
            </div>
          </div>

          {/* Full-width long-lived software card */}
          <div className="bg-muted/50 rounded-lg p-4 border border-destructive/20">
            <div className="text-xs font-bold text-destructive mb-1">
              Long-Lived Software in the Field
            </div>
            <p className="text-xs text-muted-foreground">
              SCADA controllers, medical devices, avionics, and industrial infrastructure deployed
              today with classical signatures may stay in service for many years. Their signature
              verification is often hard to update, so they may still be running when a quantum
              computer can forge classical signatures. Until the verifier is updated, those
              signatures offer no protection against firmware forgery.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            This is why PQC migration for code signing is not just about upgrading algorithms
            &mdash; it requires rethinking the entire supply chain trust model, from{' '}
            <InlineTooltip term="Build Provenance">build provenance</InlineTooltip> to signature
            verification to certificate chain management.
          </p>
        </div>
      </section>

      {/* Section 3: Classical vs PQC Code Signing */}
      <section data-section-id="classical" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <ShieldCheck size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Classical vs PQC Code Signing</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Classical code signing relies on <InlineTooltip term="RSA">RSA</InlineTooltip> and{' '}
            <InlineTooltip term="ECDSA">ECDSA</InlineTooltip>, both of which are vulnerable to{' '}
            <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip> on a
            cryptographically relevant quantum computer.{' '}
            <InlineTooltip term="NIST">NIST</InlineTooltip> has standardized{' '}
            <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (
            <InlineTooltip term="FIPS 204">FIPS 204</InlineTooltip>) and{' '}
            <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (
            <InlineTooltip term="FIPS 205">FIPS 205</InlineTooltip>) as PQC replacements for digital
            signatures.
          </p>

          {/* Size Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">
                    Public Key (bytes)
                  </th>
                  <th className="text-right p-2 text-muted-foreground font-medium">
                    Signature (bytes)
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Quantum Safe
                  </th>
                </tr>
              </thead>
              <tbody>
                {allAlgorithms.map((alg) => (
                  <tr key={alg.name} className="border-b border-border/50">
                    <td className="p-2 font-mono text-xs text-foreground">{alg.name}</td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {alg.keyBytes.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {alg.sigBytes.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      {alg.broken ? (
                        <span className="text-destructive font-bold text-xs">No</span>
                      ) : (
                        <span className="text-success font-bold text-xs">Yes</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Size Impact Visual */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Signature Size Comparison (bytes)
            </div>
            <div className="space-y-2">
              {[
                { name: 'ECDSA P-256', size: 64, pct: 1, color: 'bg-destructive/60' },
                { name: 'RSA-4096', size: 512, pct: 7, color: 'bg-destructive/60' },
                { name: 'ML-DSA-44', size: 2420, pct: 31, color: 'bg-success/60' },
                { name: 'ML-DSA-87', size: 4627, pct: 59, color: 'bg-success/60' },
                { name: 'SLH-DSA-128s', size: 7856, pct: 100, color: 'bg-primary/60' },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-mono text-foreground">
                      {item.size.toLocaleString()} B
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.max(item.pct, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              PQC signatures are 38&ndash;123x larger than ECDSA. For code signing this is
              acceptable &mdash; signatures are verified once per install, and bandwidth is not the
              primary constraint.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Code Signing Certificate Chains */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Link2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Code Signing Certificate Chains</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Code signing certificates form a trust chain from a{' '}
            <InlineTooltip term="Root CA">Root CA</InlineTooltip> down to the signing certificate.
            The chain establishes that a trusted authority vouches for the identity of the software
            publisher.
          </p>

          {/* Chain Visualization */}
          <div className="space-y-3">
            {[
              {
                level: 'Root CA',
                desc: 'Self-signed trust anchor, installed in a trust store (OS, browser or enterprise). This sample uses ML-DSA-87.',
                color: 'border-primary/50 bg-primary/5',
              },
              {
                level: 'Intermediate CA',
                desc: 'Signed by Root. Issues end-entity certificates. This sample uses ML-DSA-65.',
                color: 'border-secondary/50 bg-secondary/5',
              },
              {
                level: 'Code Signing Certificate',
                desc: 'End-entity cert with Extended Key Usage: Code Signing (OID 1.3.6.1.5.5.7.3.3). Sample validity: 1 year. This sample uses ML-DSA-44.',
                color: 'border-success/50 bg-success/5',
              },
            ].map((item, idx) => (
              <React.Fragment key={item.level}>
                {idx > 0 && (
                  <div className="flex justify-center text-muted-foreground text-lg">&darr;</div>
                )}
                <div className={`rounded-lg p-4 border ${item.color}`}>
                  <div className="text-sm font-bold text-foreground mb-1">{item.level}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Timestamping</div>
            <p className="text-xs text-muted-foreground">
              Code signing certificates expire, but signed software must remain valid long after.{' '}
              <strong>Timestamping</strong> (RFC 3161) proves the signature was created while the
              certificate was still valid. PQC timestamping requires PQC-capable{' '}
              <InlineTooltip term="Time Stamping Authority">
                Time Stamping Authorities (TSAs)
              </InlineTooltip>{' '}
              &mdash; a critical dependency for migration.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Package Manager Signing */}
      <section data-section-id="packages" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Package size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Package Manager Signing</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Every major package manager uses code signing to verify package authenticity. Migration
            to PQC varies widely &mdash; RPM is leading with hybrid ML-DSA-87+Ed448 support in RHEL
            10.1, while npm and PyPI sign through Sigstore, whose ML-DSA support is listed as
            experimental.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Package Manager
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    Current Signing
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-medium">PQC Status</th>
                </tr>
              </thead>
              <tbody>
                {PACKAGE_MANAGERS.map((pm) => (
                  <tr key={pm.name} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{pm.name}</td>
                    <td className="p-2 font-mono text-xs text-foreground">{pm.sigAlg}</td>
                    <td className="p-2 text-xs">
                      {pm.adopted ? (
                        <span className="text-success font-bold">{pm.pqcStatus}</span>
                      ) : (
                        <span className="text-muted-foreground">{pm.pqcStatus}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Hybrid Signing</div>
            <p className="text-xs text-muted-foreground">
              <strong>Hybrid signing</strong> (also called composite signing) attaches both a
              classical and PQC signature to the same artifact. This provides backward compatibility
              &mdash; older tools verify the classical signature, while PQC-aware tools verify both.
              Red Hat&apos;s RPM PQC signing uses OpenPGP v6 (RFC 9580, via Sequoia) with the RPM v6
              package format.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Sigstore & Keyless Signing */}
      <section data-section-id="sigstore" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Sigstore &amp; Keyless Signing</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>
              <InlineTooltip term="Sigstore">Sigstore</InlineTooltip>
            </strong>{' '}
            is an open-source project that removes the need for developers to manage long-term
            artifact-signing keys. Instead of distributing and protecting such keys, developers
            authenticate with an existing identity (for example GitHub or Google) and receive a
            short-lived certificate for an ephemeral key. Signing events are recorded in a
            transparency log.
          </p>

          {/* Sigstore Flow Steps */}
          <div className="space-y-2">
            {SIGSTORE_STEPS.map((s, idx) => (
              <div key={s.step} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{s.title}</div>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Key Advantage</div>
              <p className="text-xs text-muted-foreground">
                No long-term artifact-signing private keys to manage, rotate, or protect: each
                signature uses an ephemeral key. Identity-based trust replaces key-based trust for
                the signer, but verifiers still need a trust root and an expected-identity policy.
                This removes one part of the migration burden (no developer-held long-lived keys to
                replace); it does not make the migration automatic.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">PQC Migration Path</div>
              <p className="text-xs text-muted-foreground">
                Sigstore centralizes the CA and the log in{' '}
                <InlineTooltip term="Fulcio">Fulcio</InlineTooltip> and{' '}
                <InlineTooltip term="Rekor">Rekor</InlineTooltip>, but migration still needs
                coordinated change in the signing clients (key generation, signature algorithm,
                certificate requests), the artifact signatures themselves, the CA chain, the
                transparency log, and verifiers (algorithm support, trust-root distribution and
                identity policy). Upgrading Fulcio and Rekor does not change signatures already
                made, and a client or verifier that does not support the new algorithm cannot use
                the new ones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Secure Boot & Firmware Signing */}
      <section data-section-id="secure-boot" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cpu size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Secure Boot &amp; Firmware Signing</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Every platform depends on a <strong>chain of trust</strong> that starts at an immutable{' '}
            <InlineTooltip term="Root of Trust">root of trust</InlineTooltip> and extends through
            bootloaders, the OS kernel, and runtime firmware. Each link in the chain verifies a
            cryptographic signature before passing execution to the next stage. If any signature
            fails, the boot process halts.
          </p>
          <p>
            Firmware signing is a critical PQC migration target because the verification algorithm
            in deployed devices is often hard to update, and devices deployed today may still be in
            the field when cryptographically relevant quantum computers arrive. Once a quantum
            computer can derive the signing key from its public key, an attacker could forge
            firmware updates that a device with a classical-only root of trust would still accept;
            nothing needs to be harvested in advance, because the public key is on the device.
          </p>

          {/* Boot Chain Visualization */}
          <div className="space-y-3">
            {[
              {
                level: 'Root of Trust (ROM / TPM)',
                desc: 'Immutable hardware anchor. Public key burned into OTP fuses or stored in TPM NVRAM. If compromised, the entire chain collapses.',
                color: 'border-primary/50 bg-primary/5',
              },
              {
                level: 'Bootloader Verification (UEFI Secure Boot)',
                desc: 'UEFI firmware verifies the bootloader signature against keys in the Secure Boot database before allowing execution.',
                color: 'border-secondary/50 bg-secondary/5',
              },
              {
                level: 'OS Kernel & Driver Loading',
                desc: 'Kernel signature verified. Signed drivers loaded into protected memory. Measured boot extends TPM PCR registers for remote attestation.',
                color: 'border-success/50 bg-success/5',
              },
              {
                level: 'Runtime Firmware (NIC, GPU, BMC)',
                desc: 'Device firmware verified before execution. Over-the-air updates require re-verification against the trust chain before flashing.',
                color: 'border-warning/50 bg-warning/5',
              },
            ].map((item, idx) => (
              <React.Fragment key={item.level}>
                {idx > 0 && (
                  <div className="flex justify-center text-muted-foreground text-lg">&darr;</div>
                )}
                <div className={`rounded-lg p-4 border ${item.color}`}>
                  <div className="text-sm font-bold text-foreground mb-1">{item.level}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* CNSA 2.0 Callout */}
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">CNSA 2.0 guidance</div>
            <p className="text-xs text-muted-foreground mb-2">
              The NSA&apos;s <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> guidance lists
              stateful hash-based signatures (<InlineTooltip term="LMS/HSS">LMS</InlineTooltip> or{' '}
              <InlineTooltip term="XMSS">XMSS</InlineTooltip>) for firmware and software signing in
              National Security Systems, and its FAQ says NSA wants them used whenever possible
              rather than waiting for <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>, which is
              also approved for all signing use cases.
            </p>
            <div className="space-y-1">
              {[
                {
                  year: '2025',
                  text: "Software and firmware signing: support and prefer CNSA 2.0 (NSA's 2022 category guidance; superseded for planning by the dates in NSA's CNSA 2.0 FAQ, version 2.2; this date has passed)",
                },
                {
                  year: '2030',
                  text: "Software and firmware signing: exclusively use CNSA 2.0 (NSA's 2022 category guidance; superseded for planning by the dates in NSA's CNSA 2.0 FAQ, version 2.2; its other equipment categories carry different dates)",
                },
              ].map((m) => (
                <div key={m.year} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
                    {m.year}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.text}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Separate general dates, not specific to signing (NSA CNSA 2.0 FAQ v2.2, October 2026):
              CNSA 2.0 required in new NSS acquisitions from 1 January 2027; NSS equipment and
              services that cannot support CNSA 2.0 phased out by 31 December 2030 unless excepted;
              CNSA 2.0 algorithms mandated by 31 December 2031 unless otherwise noted; NSM-10 sets a
              2035 goal for quantum-resistant NSS. Check NSA&apos;s current documents for the date
              that applies to your equipment type.
            </p>
          </div>

          {/* LMS vs ML-DSA Tradeoff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-warning/20">
              <div className="text-xs font-bold text-warning mb-1">
                Why Stateful (LMS) for Firmware?
              </div>
              <p className="text-xs text-muted-foreground">
                Compact signatures (2,512 B, about 2.5 KB) and tiny public keys (56 bytes), per RFC
                8554 &mdash; ideal for hardware-constrained boot ROM. Fast verification (~0.1 ms).
                CNSA 2.0 compliant. Security derives solely from hash functions (minimal
                cryptographic assumptions). Trade-off: the signer must manage a monotonic state
                counter, typically in an HSM; verification keeps no state.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-success/20">
              <div className="text-xs font-bold text-success mb-1">ML-DSA Alternative</div>
              <p className="text-xs text-muted-foreground">
                No signing state &mdash; the signer needs no counter, which suits environments where
                maintaining state is impractical (distributed build systems, CI/CD pipelines).
                Verifiers of LMS and XMSS keep no state either; the state burden sits with the
                signer. Trade-off: larger signatures (ML-DSA-65: 3,309 B) and public keys (1,952 B)
                per FIPS 204. CNSA 2.0 approves only the ML-DSA-87 parameter set (4,627 B signature,
                2,592 B public key) and approves it for all signing use cases, including firmware.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            For a deep dive into LMS/XMSS parameter selection, Merkle tree mechanics, and the state
            management challenge, see the{' '}
            <Link
              to="/learn/stateful-signatures"
              className="text-primary hover:underline font-bold"
            >
              Stateful Hash Signatures module
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/openssl"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Terminal size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">OpenSSL Studio</div>
              <div className="text-xs text-muted-foreground">
                Run ML-DSA signing and verification commands interactively
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FileKey size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">PKI Workshop</div>
              <div className="text-xs text-muted-foreground">
                Certificate chains, X.509 structure, and trust models
              </div>
            </div>
          </Link>
          <Link
            to="/library?cat=Digital%20Signature"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Library size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Standards Library</div>
              <div className="text-xs text-muted-foreground">
                Browse FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and signing standards
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Layers size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Composite signatures and dual-algorithm approaches
              </div>
            </div>
          </Link>
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Stateful Hash Signatures</div>
              <div className="text-xs text-muted-foreground">
                LMS/XMSS deep dive, state management, and CNSA 2.0 timelines
              </div>
            </div>
          </Link>
          <Link
            to="/learn/secure-boot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <HardDrive size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Secure Boot</div>
              <div className="text-xs text-muted-foreground">
                UEFI PK/KEK migration, TPM 2.0, and ML-DSA firmware signing
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
                CI/CD pipeline crypto, container signing, and OPA/Kyverno policy
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Try it in the Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Sign binaries, build certificate chains, explore Sigstore keyless signing, and verify
          secure boot trust chains.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Libraries" migrateDomain="codesign" />
      <ReadingCompleteButton />
    </div>
  )
}
