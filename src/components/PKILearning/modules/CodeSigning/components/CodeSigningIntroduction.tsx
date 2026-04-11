// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
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
  const allAlgorithms = [...CODE_SIGNING_ALGORITHMS.classical, ...CODE_SIGNING_ALGORITHMS.pqc]

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;A compromised signing key is a skeleton key to every machine that trusts
              it.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; Lessons from the SolarWinds supply chain attack (2020)
            </p>
          </div>
          <div className="space-y-2">
            {[
              {
                t: 'SolarWinds (2020)',
                d: 'Attackers injected malicious code into the Orion build pipeline. The trojanized update was signed with a legitimate certificate and deployed to ~18,000 organizations.',
              },
              {
                t: '3CX Supply Chain (2023)',
                d: 'A cascading supply chain attack: a compromised upstream dependency led to trojanized 3CX desktop clients signed with valid certificates.',
              },
              {
                t: 'Codecov Bash Uploader (2021)',
                d: 'Attackers modified a CI/CD script without signature verification, exfiltrating environment variables from thousands of CI pipelines.',
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
            must protect not only against today&apos;s threats but also against{' '}
            <InlineTooltip term="HNDL">harvest-now-decrypt-later</InlineTooltip> attacks where
            adversaries collect signed artifacts to forge signatures once quantum computers become
            available.
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
                d: 'The average enterprise application pulls in 200\u2013500 transitive dependencies. Each dependency is a link in the trust chain \u2014 and each link is only as strong as its maintainer\u2019s signing practices.',
              },
              {
                t: 'The Transitive Trust Problem',
                d: 'You audit your direct dependencies, but do you audit their dependencies? A malicious package five levels deep in the dependency tree can execute arbitrary code in your application. The 3CX attack exploited exactly this pattern.',
              },
              {
                t: 'CI/CD Pipeline as Attack Surface',
                d: 'Build systems, artifact registries, and deployment pipelines are high-value targets. The Codecov bash uploader attack demonstrates that unsigned CI scripts can be silently replaced. Every step from source code to deployed binary is an attack surface.',
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
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Today, a supply chain attacker must steal a signing key. Tomorrow, a
              quantum-capable adversary can forge any signature without stealing anything.&rdquo;
            </blockquote>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                Key Theft &rarr; Key Forgery
              </div>
              <p className="text-xs text-muted-foreground">
                Today&apos;s supply chain attacks require compromising a specific publisher&apos;s
                signing key. A quantum attacker running{' '}
                <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip> could
                derive <em>any</em> publisher&apos;s private key from their public certificate
                &mdash; no infiltration, no social engineering, no insider threat required.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                HNDL Applied to Signed Artifacts
              </div>
              <p className="text-xs text-muted-foreground">
                Adversaries can harvest signed binaries and code signing certificates today. Once
                quantum computers arrive, they could forge new signatures that chain to existing
                certificates, or create fake artifacts that appear legitimately signed by any
                publisher. This is the{' '}
                <InlineTooltip term="HNDL">harvest-now-decrypt-later</InlineTooltip> threat applied
                to code integrity.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-warning mb-1">Cascading Trust Breakdown</div>
              <p className="text-xs text-muted-foreground">
                A quantum-compromised <InlineTooltip term="Root CA">Root CA</InlineTooltip> key
                would let an attacker sign software as <em>any</em> publisher in that CA&apos;s
                trust hierarchy. Unlike a stolen intermediate key (scoped to one publisher),
                breaking the Root CA&apos;s algorithm affects the entire ecosystem simultaneously.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-warning mb-1">Scale: One Key vs All Keys</div>
              <p className="text-xs text-muted-foreground">
                A stolen signing key compromises one publisher. A quantum break of{' '}
                <InlineTooltip term="ECDSA">ECDSA</InlineTooltip> or{' '}
                <InlineTooltip term="RSA">RSA</InlineTooltip> compromises{' '}
                <em>every publisher simultaneously</em> &mdash; every code signing certificate using
                that algorithm becomes forgeable. This is a systemic, not isolated, risk.
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
              today with classical signatures will still be operating 15&ndash;25 years from now.
              These systems cannot be easily patched and will be running in a post-quantum threat
              environment. Their classical signatures will offer zero protection against firmware
              forgery.
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
      <section className="glass-panel p-6">
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
                desc: 'Self-signed trust anchor. Installed in OS/browser trust stores. Uses strongest algorithm (ML-DSA-87).',
                color: 'border-primary/50 bg-primary/5',
              },
              {
                level: 'Intermediate CA',
                desc: 'Signed by Root. Issues end-entity certificates. Uses ML-DSA-65 for balance of security and size.',
                color: 'border-secondary/50 bg-secondary/5',
              },
              {
                level: 'Code Signing Certificate',
                desc: 'End-entity cert with Extended Key Usage: Code Signing (OID 1.3.6.1.5.5.7.3.3). Short validity (1 year). Uses ML-DSA-44.',
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
      <section className="glass-panel p-6">
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
            10, while most others rely on upstream Sigstore PQC adoption.
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
              Red Hat&apos;s RPM implementation uses ML-DSA-87+Ed448 composite signatures per the
              IETF composite signatures draft.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Sigstore & Keyless Signing */}
      <section className="glass-panel p-6">
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
            is an open-source project that eliminates the need for long-term signing key management.
            Instead of distributing and protecting private keys, developers authenticate with their
            existing identity (GitHub, Google) and receive short-lived certificates. All signatures
            are recorded in a public transparency log.
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
                No long-term private keys to manage, rotate, or protect. Identity-based trust
                replaces key-based trust. This dramatically simplifies PQC migration &mdash; only
                the Sigstore infrastructure needs to upgrade, not every individual developer.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">PQC Migration Path</div>
              <p className="text-xs text-muted-foreground">
                Sigstore&apos;s architecture centralizes cryptographic operations in{' '}
                <InlineTooltip term="Fulcio">Fulcio</InlineTooltip> (CA) and{' '}
                <InlineTooltip term="Rekor">Rekor</InlineTooltip> (transparency log). Upgrading
                these two services to ML-DSA automatically provides PQC protection to all downstream
                consumers (npm, PyPI, etc.).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Secure Boot & Firmware Signing */}
      <section className="glass-panel p-6">
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
            Firmware signing is a critical PQC migration target because firmware keys have
            10&ndash;20 year lifetimes, and devices deployed today will still be in the field when
            cryptographically relevant quantum computers arrive. An attacker who harvests firmware
            update signatures today could forge malicious firmware updates in the future.
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
            <div className="text-xs font-bold text-primary mb-2">CNSA 2.0 Mandate</div>
            <p className="text-xs text-muted-foreground mb-2">
              The NSA&apos;s <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> guidance
              mandates stateful hash-based signatures (
              <InlineTooltip term="LMS/HSS">LMS/HSS</InlineTooltip> or{' '}
              <InlineTooltip term="XMSS">XMSS</InlineTooltip>) for firmware and software signing in
              National Security Systems &mdash; ahead of{' '}
              <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> for general use.
            </p>
            <div className="space-y-1">
              {[
                {
                  year: '2025',
                  text: 'New software/firmware should support and prefer CNSA 2.0 algorithms',
                },
                { year: '2030', text: 'All deployed NSS must use CNSA 2.0 signatures' },
                { year: '2033\u201335', text: 'Full quantum-resistant enforcement' },
              ].map((m) => (
                <div key={m.year} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
                    {m.year}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LMS vs ML-DSA Tradeoff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-warning/20">
              <div className="text-xs font-bold text-warning mb-1">
                Why Stateful (LMS) for Firmware?
              </div>
              <p className="text-xs text-muted-foreground">
                Compact signatures (2.5 KB) and tiny public keys (56 bytes) &mdash; ideal for
                hardware-constrained boot ROM. Fast verification (~0.1 ms). CNSA 2.0 compliant.
                Security derives solely from hash functions (minimal cryptographic assumptions).
                Trade-off: requires a monotonic state counter managed in an HSM or TPM.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-success/20">
              <div className="text-xs font-bold text-success mb-1">ML-DSA Alternative</div>
              <p className="text-xs text-muted-foreground">
                Fully stateless &mdash; no counter, no state management burden. Simpler operations
                for environments where maintaining state is impractical (distributed build systems,
                CI/CD pipelines). Trade-off: larger signatures (3.3 KB) and public keys (1.9 KB).
                Not mandated by CNSA 2.0 for firmware signing.
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
            to="/library"
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
          variant="ghost"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try it in the Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Sign binaries, build certificate chains, explore Sigstore keyless signing, and verify
          secure boot trust chains.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Libraries" />
      <ReadingCompleteButton />
    </div>
  )
}
