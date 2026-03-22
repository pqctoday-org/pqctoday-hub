// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  Rocket,
  Radio,
  Radiation,
  ShieldCheck,
  Scale,
  Clock,
  Truck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  Satellite,
  Plane,
  Cpu,
  HardDrive,
  FileCheck,
  GitBranch,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

// -- Local CollapsibleSection ------------------------------------------------

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

// -- Introduction Component --------------------------------------------------

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const AerospaceIntroduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* -- Section 1: The Quantum Threat to Aerospace ----------------------- */}
      <CollapsibleSection
        title="The Quantum Threat to Aerospace"
        icon={<Rocket size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Aerospace is uniquely vulnerable to the quantum threat because its cryptographic systems
            must protect data across <strong>three segments</strong> with fundamentally different
            upgrade cadences &mdash; and because its equipment lifetimes span the entire PQC
            transition window.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Plane size={16} className="text-status-success" /> Ground Segment
              </h4>
              <p className="text-xs text-muted-foreground">
                ATC centers, ground stations, airline ops. Standard{' '}
                <InlineTooltip term="TLS">TLS</InlineTooltip>/IPsec stack. Patched in{' '}
                <strong>weeks</strong>. PQC migration via standard IT change management.
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Plane size={16} className="text-status-warning" /> Airborne Segment
              </h4>
              <p className="text-xs text-muted-foreground">
                Avionics with RSA-2048 / ECDSA P-256 for nav database auth and SATCOM. Crypto
                libraries certified under <InlineTooltip term="DO-178C">DO-178C</InlineTooltip>.
                Fleet-wide PQC rollout:
                <strong> 5&ndash;10 years</strong>.
              </p>
            </div>
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Satellite size={16} className="text-status-error" /> Space Segment
              </h4>
              <p className="text-xs text-muted-foreground">
                Command/telemetry encrypted with AES + RSA/ECDH key exchange. Satellites{' '}
                <strong>cannot be physically accessed</strong> post-launch. Crypto must be
                provisioned pre-launch for 15&ndash;20 year GEO missions.
              </p>
            </div>
          </div>

          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  HNDL: Satellite Command &amp; Telemetry
                </h4>
                <p className="text-xs text-muted-foreground">
                  Adversaries can intercept encrypted satellite command uplinks and telemetry
                  downlinks today. With a future <InlineTooltip term="CRQC">CRQC</InlineTooltip>,
                  they could decrypt command sequences and forge authenticated commands &mdash;
                  potentially taking control of communications satellites, GPS constellations, or
                  military reconnaissance platforms. A GEO satellite launched in 2028 with RSA-2048
                  key exchange will still be operating in 2043, well past credible CRQC timelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 2: PQC Algorithm Sizes vs. Aviation Protocols ------------- */}
      <CollapsibleSection
        title="PQC Algorithm Sizes vs. Aviation Protocol Limits"
        icon={<Radio size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Aviation communication protocols were designed with classical cryptography &mdash; or no
            cryptography at all. PQC signatures and key exchanges are 10&ndash;50x larger than their
            classical counterparts, creating fundamental compatibility problems:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Protocol
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Max Payload
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    <InlineTooltip term="ML-DSA">ML-DSA-65</InlineTooltip> Sig
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Blocks</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">
                    <InlineTooltip term="ACARS">ACARS</InlineTooltip>
                  </td>
                  <td className="text-right py-2 px-3">220 B</td>
                  <td className="text-right py-2 px-3">3,309 B</td>
                  <td className="text-right py-2 px-3">16</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Infeasible</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">
                    <InlineTooltip term="CPDLC">CPDLC</InlineTooltip>
                  </td>
                  <td className="text-right py-2 px-3">1,024 B</td>
                  <td className="text-right py-2 px-3">3,309 B</td>
                  <td className="text-right py-2 px-3">4</td>
                  <td className="py-2 px-3">
                    <span className="text-status-warning font-medium">Marginal</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">
                    <InlineTooltip term="ADS-B">ADS-B</InlineTooltip>
                  </td>
                  <td className="text-right py-2 px-3">14 B</td>
                  <td className="text-right py-2 px-3">3,309 B</td>
                  <td className="text-right py-2 px-3">&mdash;</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Infeasible</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">ARINC 429</td>
                  <td className="text-right py-2 px-3">4 B</td>
                  <td className="text-right py-2 px-3">3,309 B</td>
                  <td className="text-right py-2 px-3">&mdash;</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Infeasible</span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">
                    <InlineTooltip term="ARINC 653">ARINC 664</InlineTooltip> / AFDX
                  </td>
                  <td className="text-right py-2 px-3">1,471 B</td>
                  <td className="text-right py-2 px-3">3,309 B</td>
                  <td className="text-right py-2 px-3">3</td>
                  <td className="py-2 px-3">
                    <span className="text-status-success font-medium">Feasible</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">MIL-STD-1553</td>
                  <td className="text-right py-2 px-3">64 B</td>
                  <td className="text-right py-2 px-3">3,309 B</td>
                  <td className="text-right py-2 px-3">&mdash;</td>
                  <td className="py-2 px-3">
                    <span className="text-status-error font-medium">Infeasible</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Only <strong>ARINC 664/AFDX</strong> (modern Ethernet-based avionics bus in A350, B787)
            can accommodate PQC overhead. Legacy protocols require{' '}
            <strong>gateway-mediated PQC</strong>: a quantum-safe appliance terminates the legacy
            session and re-wraps traffic in <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>
            -protected channels.
          </p>

          <p>
            Algorithm selection matters enormously: <strong>LMS (H10/W4)</strong> signatures (1,840
            B) are 44% smaller than ML-DSA-65 (3,309 B). For bandwidth-constrained aviation links,
            hash-based stateful signatures may be the only viable PQC option &mdash; but they
            require secure monotonic counters to prevent state reuse.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 3: Radiation & Key Material Integrity -------------------- */}
      <CollapsibleSection
        title="Radiation & Cryptographic Key Material Integrity"
        icon={<Radiation size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Space electronics face{' '}
            <InlineTooltip term="Single-Event Upset">
              <strong>Single-Event Upsets (SEUs)</strong>
            </InlineTooltip>{' '}
            &mdash; cosmic ray bit flips that can corrupt cryptographic key material in memory. This
            is a threat unique to aerospace with no parallel in terrestrial IT.
          </p>

          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Lattice-Based PQC Is Especially Vulnerable
                </h4>
                <p className="text-xs text-muted-foreground">
                  A bit flip in an <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> private key
                  corrupts <strong>all subsequent signatures</strong>. A corrupted{' '}
                  <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> decapsulation key produces
                  garbage shared secrets. Unlike classical ECDSA (where a bad signature simply fails
                  verification), lattice-based algorithms can produce{' '}
                  <strong>subtly wrong outputs</strong> that may pass basic checks.
                </p>
              </div>
            </div>
          </div>

          <h4 className="text-sm font-bold text-foreground">Algorithm Resilience Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2">
                Hash-Based (LMS/XMSS) &mdash; More Resilient
              </h4>
              <p className="text-xs text-muted-foreground">
                Verification relies on SHA-256 hashes computed from <strong>public data</strong>,
                not stored private key material. If a signing key buffer is corrupted, the satellite
                switches to a backup key. Verification of past signatures is unaffected.
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-2">
                Lattice-Based (ML-DSA/ML-KEM) &mdash; Vulnerable
              </h4>
              <p className="text-xs text-muted-foreground">
                Private keys are large structured matrices (1,312&ndash;2,592 bytes). A single bit
                flip changes the algebraic structure, producing valid-looking but{' '}
                <strong>cryptographically incorrect</strong> outputs. ECC memory helps but adds
                12&ndash;25% overhead.
              </p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-foreground">
            <InlineTooltip term="Rad-Hardened Processor">Rad-Hard Processor</InlineTooltip> PQC
            Capability
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Processor
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Clock</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">RAM</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">TID</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    ML-KEM
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                    ML-DSA
                  </th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">LMS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">BAE RAD750</td>
                  <td className="text-right py-2 px-3">200 MHz</td>
                  <td className="text-right py-2 px-3">256 MB</td>
                  <td className="text-right py-2 px-3">200 krad</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">BAE RAD5545</td>
                  <td className="text-right py-2 px-3">466 MHz</td>
                  <td className="text-right py-2 px-3">2 GB</td>
                  <td className="text-right py-2 px-3">100 krad</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">Cobham GR740</td>
                  <td className="text-right py-2 px-3">250 MHz</td>
                  <td className="text-right py-2 px-3">128 MB</td>
                  <td className="text-right py-2 px-3">300 krad</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                  <td className="text-center py-2 px-3 text-status-warning">&#9675;</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">Vorago VA10820</td>
                  <td className="text-right py-2 px-3">50 MHz</td>
                  <td className="text-right py-2 px-3">128 KB</td>
                  <td className="text-right py-2 px-3">50 krad</td>
                  <td className="text-center py-2 px-3 text-status-error">&#10007;</td>
                  <td className="text-center py-2 px-3 text-status-error">&#10007;</td>
                  <td className="text-center py-2 px-3 text-status-success">&#10003;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            &#10003; = feasible, &#9675; = limited (smaller variants only), &#10007; = infeasible.
            Ultra-constrained CubeSat processors (Vorago class) can only run hash-based signatures.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 4: Certification Cost of PQC Integration ----------------- */}
      <CollapsibleSection
        title="Certification Cost of PQC Crypto Library Integration"
        icon={<ShieldCheck size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Adding a PQC library to certified avionics software is not a simple dependency update.
            It triggers a formal <InlineTooltip term="DO-178C">DO-178C</InlineTooltip>{' '}
            recertification cycle whose cost scales with the{' '}
            <strong>Design Assurance Level (DAL)</strong>:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">DAL</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Failure Effect
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Test Coverage
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    PQC Retrofit Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-status-error">A</td>
                  <td className="py-2 px-3">Catastrophic</td>
                  <td className="py-2 px-3">MC/DC + 100% structural</td>
                  <td className="py-2 px-3">$5&ndash;20M, 18&ndash;36 mo</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-status-warning">B</td>
                  <td className="py-2 px-3">Hazardous</td>
                  <td className="py-2 px-3">Decision coverage</td>
                  <td className="py-2 px-3">$2&ndash;5M, 12&ndash;18 mo</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-bold text-status-info">C</td>
                  <td className="py-2 px-3">Major</td>
                  <td className="py-2 px-3">Statement coverage</td>
                  <td className="py-2 px-3">$0.5&ndash;1M, 6&ndash;12 mo</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-muted-foreground">D/E</td>
                  <td className="py-2 px-3">Minor / No effect</td>
                  <td className="py-2 px-3">Review only / None</td>
                  <td className="py-2 px-3">&lt;$500K, 3&ndash;6 mo</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <InlineTooltip term="DO-326A">DO-326A</InlineTooltip> (Airborne Security Process
            Specification, mandated since 2021) requires threat modeling of all cryptographic
            systems. <InlineTooltip term="ARINC 653">ARINC 653</InlineTooltip> partitioned RTOS
            constraints mean PQC libraries must fit within 1&ndash;4 MB memory budgets and complete
            all operations within deterministic time windows.
          </p>

          <p>
            <strong>Clean-sheet vs. retrofit:</strong> Designing PQC into a new aircraft program
            from day one costs 40&ndash;60% less than retrofitting PQC into existing certified
            software. This makes new-build aircraft like the Boeing NMA or Airbus A350 variants the
            optimal first targets for native PQC integration.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 5: Algorithm Selection Under Export Constraints ----------- */}
      <CollapsibleSection
        title="PQC Algorithm Selection Under Export Constraints"
        icon={<Scale size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Unlike terrestrial IT where NIST-standardized PQC algorithms can be deployed globally,
            aerospace faces <InlineTooltip term="ITAR">ITAR</InlineTooltip>/EAR export controls that
            restrict which PQC implementations can be shipped to which countries:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">Military Crypto (ITAR)</h4>
              <p className="text-xs text-muted-foreground mb-2">
                USML Category XI: PQC-enhanced COMSEC modules, crypto key loaders, and military
                avionics firmware. Requires State Department license for every foreign transfer
                &mdash; even to NATO allies.
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded border bg-status-error/15 text-status-error border-status-error/30 font-bold">
                Per-Destination License
              </span>
            </div>
            <div className="glass-panel p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">Civil Crypto (EAR)</h4>
              <p className="text-xs text-muted-foreground mb-2">
                ECCN 5A002/5D002: PQC libraries in commercial avionics. License Exception ENC (15
                CFR 740.17) covers most civil deployments, but requires BIS classification ruling
                for novel algorithms.
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded border bg-status-warning/15 text-status-warning border-status-warning/30 font-bold">
                License Exception Available
              </span>
            </div>
          </div>

          <p>
            <strong>Sovereignty mandates</strong> compound the problem: France (ANSSI) requires
            national crypto evaluation for military platforms. Germany (BSI) mandates independent
            validation. An aircraft manufacturer cannot ship a single global PQC firmware build
            &mdash; each destination may require different algorithm configurations, key management
            regimes, and compliance evidence.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 6: Crypto Lifecycle Across Decades ----------------------- */}
      <CollapsibleSection
        title="Crypto Lifecycle Across Multi-Decade Equipment Life"
        icon={<Clock size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The fundamental crypto challenge: aerospace equipment service lives (20&ndash;55 years)
            span the entire quantum transition. A Boeing 737 MAX delivered in 2025 with RSA-2048
            will still be flying in 2055 &mdash; long past any credible CRQC timeline.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Platform
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Life</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Current Crypto
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    PQC Upgrade Path
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">A350 XWB</td>
                  <td className="text-right py-2 px-3">30+ yr</td>
                  <td className="py-2 px-3">RSA-2048, ECDSA P-256</td>
                  <td className="py-2 px-3 text-status-success">Native PQC via AFDX</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">737 MAX</td>
                  <td className="text-right py-2 px-3">30+ yr</td>
                  <td className="py-2 px-3">RSA-2048</td>
                  <td className="py-2 px-3 text-status-warning">Retrofit (partial AFDX)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">F-35</td>
                  <td className="text-right py-2 px-3">55+ yr</td>
                  <td className="py-2 px-3">Type 1 (classified)</td>
                  <td className="py-2 px-3 text-status-warning">Block upgrade + retrofit</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">GEO Satellite</td>
                  <td className="text-right py-2 px-3">15&ndash;20 yr</td>
                  <td className="py-2 px-3">AES-256 + RSA/ECDH</td>
                  <td className="py-2 px-3 text-status-error">Pre-launch provisioning only</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>Crypto agility in aerospace</strong> means planning for algorithm transitions
            that will happen <em>during</em> equipment service life. Satellites must launch with
            crypto-agile firmware that can switch algorithms via software-defined radio updates.
            Aircraft need <InlineTooltip term="Line-Replaceable Unit">LRU</InlineTooltip> designs
            that allow crypto module replacement without re-certifying the entire avionics suite.
          </p>

          <p>
            <strong>Mixed-fleet interoperability:</strong> ATC data links must simultaneously serve
            a 2005 E-175 (ACARS-only, no PQC) and a 2030 A350neo (full PQC). The solution is{' '}
            <strong>gateway-mediated PQC</strong>: ground-side appliances that bridge legacy
            sessions into quantum-safe channels, providing crypto protection even for aircraft that
            will never receive PQC firmware.
          </p>
        </div>
      </CollapsibleSection>

      {/* -- Section 7: Key Provisioning for Unreachable Platforms ------------- */}
      <CollapsibleSection
        title="Key Provisioning for Unreachable Platforms"
        icon={<Truck size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Satellite key management is the most extreme cryptographic challenge in aerospace: keys
            must be provisioned <strong>pre-launch</strong> and last the entire mission &mdash; 15+
            years for GEO, with no physical access for rotation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Pre-Launch Key Loading</h4>
              <p className="text-xs text-muted-foreground">
                PQC key pairs generated in ground HSMs and loaded into satellite crypto modules
                during integration. Multiple backup key sets provisioned for failover. Hash-based
                signature trees (LMS/XMSS) pre-computed with sufficient leaves for entire mission
                life.
              </p>
            </div>
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Over-the-Air Key Update</h4>
              <p className="text-xs text-muted-foreground">
                Software-defined radios allow limited crypto firmware updates. But updating the key
                exchange algorithm (RSA &rarr; ML-KEM) on orbit risks bricking the satellite if the
                update fails. <strong>No rollback possible</strong> for hardware crypto.
              </p>
            </div>
          </div>

          <p>
            <strong>HNDL timeline pressure:</strong> A satellite launching in 2028 must use PQC for
            its key exchange from day one, because adversaries are already harvesting encrypted
            command uplinks. The 3&ndash;5 year satellite development cycle means PQC algorithm
            selection must happen in <strong>2025&ndash;2026</strong> &mdash; during the current
            standardization window.
          </p>

          <p>
            The aerospace supply chain compounds this: crypto ASICs for military satellites must be
            fabricated at DMEA-accredited trusted foundries (12&ndash;18 month qualification).
            Counterfeit part detection (SAE AS6171) can leverage PQC-signed component authentication
            certificates for supply chain integrity.
          </p>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/iot-ot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">IoT &amp; OT Security</div>
              <div className="text-xs text-muted-foreground">PQC migration for embedded and space-rated processors</div>
            </div>
          </Link>
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <HardDrive size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC</div>
              <div className="text-xs text-muted-foreground">Radiation-hardened HSMs for ML-KEM and ML-DSA key storage</div>
            </div>
          </Link>
          <Link
            to="/learn/code-signing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FileCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Code Signing</div>
              <div className="text-xs text-muted-foreground">PQC firmware signing for flight-critical and satellite systems</div>
            </div>
          </Link>
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <GitBranch size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Stateful Signatures</div>
              <div className="text-xs text-muted-foreground">LMS and XMSS for long-lived aerospace mission signing keys</div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="Hardware" />

      {/* -- Reading Complete + Workshop CTA ----------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6">
        <ReadingCompleteButton />
        <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
          Ready for Workshop <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
