// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  Shield,
  Network,
  Key,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Scale,
  GitBranch,
  ArrowRight,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { NERC_CIP_STANDARDS, IEC_62351_PARTS } from '../data/nercCipData'
import { ENERGY_PROTOCOLS } from '../data/substationProtocolData'
import { EQUIPMENT_LIFECYCLES } from '../data/energyConstants'

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

export const EnergyUtilitiesIntroduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  const URGENCY_COLORS: Record<string, string> = {
    critical: 'bg-status-error/20 text-status-error border-status-error/50',
    high: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    medium: 'bg-status-info/20 text-status-info border-status-info/50',
    low: 'bg-status-success/20 text-status-success border-status-success/50',
  }

  const FEASIBILITY_COLORS: Record<string, string> = {
    good: 'bg-status-success/20 text-status-success border-status-success/50',
    challenging: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    problematic: 'bg-status-error/20 text-status-error border-status-error/50',
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* -- Section 1: Why Energy & Utilities Is Different ------------------- */}
      <CollapsibleSection
        title="Why Energy & Utilities Is Different"
        icon={<Zap size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The energy sector faces a uniquely difficult PQC migration challenge. Unlike IT systems
            with 3&ndash;5 year refresh cycles, energy infrastructure operates on{' '}
            <strong>20&ndash;40 year asset lifecycles</strong>. A substation IED deployed today will
            still be operational in 2050 &mdash; well past the expected arrival of cryptographically
            relevant quantum computers (CRQCs).
          </p>

          <p>
            Energy systems are <strong>safety-critical</strong>: cryptographic failures do not
            merely expose data &mdash; they can cause physical harm. A forged breaker command can
            de-energize a transmission line, triggering cascading protection relay trips and
            wide-area blackouts. A compromised pipeline valve command can cause overpressure
            conditions leading to rupture and explosion. No other sector combines this level of{' '}
            <InlineTooltip term="HNDL">
              <strong>Harvest Now, Decrypt Later (HNDL)</strong>
            </InlineTooltip>{' '}
            exposure with life-safety consequences.
          </p>

          {/* Key differentiators grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Safety-Critical</h4>
              <p className="text-xs text-muted-foreground">
                Crypto failures can cascade into physical consequences: grid destabilization,
                pipeline overpressure, dam flooding, and water contamination. No tolerance for
                authentication bypass.
              </p>
            </div>
            <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Extreme Lifecycles</h4>
              <p className="text-xs text-muted-foreground">
                IEDs last 20&ndash;25 years, transformers 30&ndash;40 years. Equipment deployed in
                2026 must withstand threats through 2050+, well beyond CRQC arrival estimates.
              </p>
            </div>
            <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Regulatory Density</h4>
              <p className="text-xs text-muted-foreground">
                NERC CIP (North America), IEC 62351 (international), IEEE 2030.5 (DERs), plus
                cross-sector mandates like NIS2 and NIST frameworks. Multiple overlapping compliance
                obligations.
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="text-sm font-bold text-foreground mb-2">Environmental Risk</h4>
              <p className="text-xs text-muted-foreground">
                Loss of grid control causes cascading failures affecting millions. Pipeline
                incidents contaminate soil and waterways. Dam failures flood downstream communities.
              </p>
            </div>
          </div>

          {/* HNDL window calculation */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              HNDL Window Example
            </h4>
            <p className="text-xs text-muted-foreground">
              A substation IED deployed in 2026 with a 25-year lifecycle will be operational until{' '}
              <strong>2051</strong>. If a CRQC becomes available around 2030&ndash;2035, that
              device&apos;s communications are vulnerable for <strong>16&ndash;21 years</strong>{' '}
              after the quantum threat materializes. Data harvested today from these devices could
              be decrypted by an adversary with a future CRQC, revealing grid topology, protection
              settings, and operational patterns.
            </p>
          </div>

          {/* Cross-reference to IoT/OT */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Network size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Prerequisites: IoT &amp; OT Security
                </h4>
                <p className="text-xs text-muted-foreground">
                  This module builds on the IoT &amp; OT Security module, which covers the Purdue
                  model, constrained device PQC patterns, and gateway-mediated security. Start there
                  if you are unfamiliar with OT network architecture concepts.
                </p>
                <Link
                  to="/learn/iot-ot-pqc"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2 font-medium"
                >
                  <ArrowRight size={12} />
                  Open IoT &amp; OT Security Module
                </Link>
              </div>
            </div>
          </div>

          {/* Equipment lifecycle table */}
          <h4 className="text-sm font-bold text-foreground">Equipment Lifecycle Overview</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Asset</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Lifecycle (years)
                  </th>
                  <th className="text-left p-2 text-muted-foreground font-medium">
                    HNDL Exposure Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {EQUIPMENT_LIFECYCLES.map((eq) => (
                  <tr key={eq.id} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{eq.name}</td>
                    <td className="p-2 text-center text-xs text-foreground">
                      {eq.typicalLifeYears[0]}&ndash;{eq.typicalLifeYears[1]}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{eq.hndlExposureNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 2: NERC CIP & IEC 62351 Compliance ---------------------- */}
      <CollapsibleSection
        title="NERC CIP & IEC 62351 Compliance"
        icon={<Shield size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            North American bulk electric system operators must comply with{' '}
            <InlineTooltip term="NERC CIP">
              <strong>NERC CIP</strong>
            </InlineTooltip>{' '}
            reliability standards, which mandate cybersecurity controls for Critical Infrastructure
            Protection. Internationally, <strong>IEC 62351</strong> defines cryptographic profiles
            for power system communication protocols. Both frameworks assume classical cryptography
            &mdash; PQC migration will require updates to compliance baselines, vendor contracts,
            and audit procedures.
          </p>

          {/* NERC CIP standards */}
          <h4 className="text-sm font-bold text-foreground">
            NERC CIP Standards &mdash; PQC Impact
          </h4>
          <div className="space-y-3">
            {NERC_CIP_STANDARDS.map((std) => (
              <div key={std.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground font-mono">{std.name}</span>
                    <span className="text-xs text-muted-foreground">&mdash; {std.title}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${URGENCY_COLORS[std.urgency]}`}
                  >
                    {std.urgency.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{std.pqcImpact}</p>
                <div className="flex flex-wrap gap-1">
                  {std.affectedAssets.map((asset) => (
                    <span
                      key={asset}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* IEC 62351 parts */}
          <h4 className="text-sm font-bold text-foreground">IEC 62351 Parts &mdash; PQC Impact</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Part</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Title</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">PQC Impact</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Quantum Vulnerable
                  </th>
                </tr>
              </thead>
              <tbody>
                {IEC_62351_PARTS.map((part) => (
                  <tr key={part.part} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground font-mono">
                      Part {part.part}
                    </td>
                    <td className="p-2 text-xs text-foreground">{part.title}</td>
                    <td className="p-2 text-xs text-muted-foreground">{part.pqcImpact}</td>
                    <td className="p-2 text-center">
                      {part.quantumVulnerable ? (
                        <span className="text-status-error text-xs font-bold">Yes</span>
                      ) : (
                        <span className="text-status-success text-xs font-bold">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* IEEE 2030.5 callout */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2">
              IEEE 2030.5 (Smart Energy Profile 2.0)
            </h4>
            <p className="text-xs text-muted-foreground">
              The communication standard for Distributed Energy Resources (solar inverters, battery
              storage, EV chargers) mandates TLS 1.2 with ECDSA P-256 device certificates. Every DER
              has a unique device identity certificate issued by the utility CA. PQC migration
              requires fleet-wide certificate reissuance &mdash; a logistics challenge when millions
              of devices are deployed across a service territory.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 3: Substation Protocols ---------------------------------- */}
      <CollapsibleSection
        title="Substation Protocols"
        icon={<Network size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Energy sector protocols differ fundamentally from IT protocols. Many use multicast
            (GOOSE, Sampled Values) with sub-millisecond timing requirements, operate over serial
            links (DNP3), or run on bandwidth-constrained powerline carriers (DLMS/COSEM). The key
            insight:{' '}
            <strong>
              HMAC-based per-message authentication is already quantum-safe &mdash; only the
              asymmetric key distribution channels are vulnerable
            </strong>
            .
          </p>

          {/* Protocol cards for first 5 protocols */}
          <div className="space-y-3">
            {ENERGY_PROTOCOLS.slice(0, 5).map((protocol) => (
              <div key={protocol.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{protocol.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-mono">
                      {protocol.transport}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${FEASIBILITY_COLORS[protocol.pqcFeasibility]}`}
                  >
                    PQC: {protocol.pqcFeasibility.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{protocol.description}</p>
                {protocol.timingRequirement && (
                  <p className="text-[10px] text-status-warning font-medium mb-2">
                    Timing: {protocol.timingRequirement}
                  </p>
                )}

                {/* Crypto layers mini-table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-1.5 text-muted-foreground font-medium">Layer</th>
                        <th className="text-left p-1.5 text-muted-foreground font-medium">
                          Current
                        </th>
                        <th className="text-center p-1.5 text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="text-left p-1.5 text-muted-foreground font-medium">
                          PQC Replacement
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocol.cryptoLayers.map((layer) => (
                        <tr key={layer.layerName} className="border-b border-border/50">
                          <td className="p-1.5 text-foreground font-medium">{layer.layerName}</td>
                          <td className="p-1.5 text-muted-foreground font-mono">
                            {layer.currentAlgorithm.split('(')[0].trim()}
                          </td>
                          <td className="p-1.5 text-center">
                            {layer.quantumVulnerable ? (
                              <span className="text-status-error font-bold">Vulnerable</span>
                            ) : (
                              <span className="text-status-success font-bold">Safe</span>
                            )}
                          </td>
                          <td className="p-1.5 text-muted-foreground font-mono">
                            {layer.pqcReplacement ?? 'None needed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Key insight callout */}
          <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-status-success shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Key Insight: HMAC Is Already Quantum-Safe
                </h4>
                <p className="text-xs text-muted-foreground">
                  GOOSE, Sampled Values, and DNP3-SA all use <strong>HMAC-SHA256</strong> for
                  per-message authentication. As a symmetric primitive, HMAC is not vulnerable to
                  Shor&apos;s algorithm. Only the{' '}
                  <strong>asymmetric key distribution channel</strong> (RSA-2048 certificates) that
                  seeds these HMAC keys needs PQC migration. This dramatically reduces the attack
                  surface and simplifies the migration.
                </p>
              </div>
            </div>
          </div>

          {/* DNP3-SA fit callout */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Network size={16} className="text-primary" />
              DNP3-SA: Clean Single-Fragment Migration
            </h4>
            <p className="text-xs text-muted-foreground">
              DNP3 Secure Authentication uses a 2,048-byte maximum fragment size. An{' '}
              <InlineTooltip term="ML-KEM">
                <strong>ML-KEM-768</strong>
              </InlineTooltip>{' '}
              ciphertext is <strong>1,088 bytes</strong> &mdash; comfortably within the fragment
              limit. This means PQC key transport can be accomplished in a single DNP3 fragment
              without protocol-level changes, making it one of the cleanest migration paths in the
              energy sector.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 4: Smart Meter Key Management at Scale ------------------- */}
      <CollapsibleSection
        title="Smart Meter Key Management at Scale"
        icon={<Key size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Smart metering infrastructure uses{' '}
            <InlineTooltip term="DLMS/COSEM">
              <strong>DLMS/COSEM</strong>
            </InlineTooltip>{' '}
            for communication between meters and head-end systems. Security Suite 1 (the most widely
            deployed) uses AES-GCM-128 for encryption, ECDSA P-256 for authentication, and ECDH
            P-256 for key agreement. The asymmetric components are quantum-vulnerable and must
            migrate to PQC algorithms.
          </p>

          {/* Bandwidth multiplier callout */}
          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  The 33x Bandwidth Problem
                </h4>
                <p className="text-xs text-muted-foreground">
                  An ECDH P-256 compressed public key is <strong>33 bytes</strong>. An ML-KEM-768
                  ciphertext is <strong>1,088 bytes</strong> &mdash; a{' '}
                  <strong>33x size increase</strong>. On bandwidth-constrained PLC networks
                  (10&ndash;200 kbps), this transforms a routine key rotation from a background task
                  into a multi-day network operation.
                </p>
              </div>
            </div>
          </div>

          {/* Scale calculation */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Key size={16} className="text-primary" />
              Scale Calculation: 10 Million Meters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="bg-background/50 rounded-lg p-3 border border-border text-center">
                <div className="text-lg font-bold text-primary">~10 GB</div>
                <div className="text-[10px] text-muted-foreground">
                  PQC key exchange data
                  <br />
                  (10M meters x 1,088 bytes)
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border text-center">
                <div className="text-lg font-bold text-status-warning">~9 days</div>
                <div className="text-[10px] text-muted-foreground">
                  At PLC speeds (100 kbps)
                  <br />
                  with 60% utilization
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border text-center">
                <div className="text-lg font-bold text-status-success">&lt; 1 hour</div>
                <div className="text-[10px] text-muted-foreground">
                  At cellular speeds (5 Mbps)
                  <br />
                  if infrastructure available
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The gap between PLC and cellular speeds illustrates why communication technology
              selection is the single most important variable in smart meter PQC migration planning.
            </p>
          </div>

          {/* Mitigation strategies */}
          <h4 className="text-sm font-bold text-foreground">Mitigation Strategies</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">Staggered Rotation</div>
              <p className="text-xs text-muted-foreground">
                Divide the fleet into geographic zones and rotate keys zone-by-zone over weeks.
                Reduces peak network load and HSM throughput requirements.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">Group Keys</div>
              <p className="text-xs text-muted-foreground">
                Use a shared group key for meters in the same transformer zone, reducing the number
                of individual key exchanges. Trade-off: compromising one meter exposes the group.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">Overnight Pre-Positioning</div>
              <p className="text-xs text-muted-foreground">
                Schedule PQC key material distribution during off-peak hours (02:00&ndash;06:00)
                when meter polling traffic is minimal, maximizing available bandwidth.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">HSM Capacity Planning</div>
              <p className="text-xs text-muted-foreground">
                ML-KEM encapsulation at scale requires dedicated HSM throughput. A fleet of 10M
                meters rotated over 9 days requires ~13 encapsulations per second &mdash; well
                within modern HSM capacity.
              </p>
            </div>
          </div>

          {/* Cross-ref to KMS module */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Key size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Explore Key Management Systems
                </h4>
                <p className="text-xs text-muted-foreground">
                  The KMS &amp; PQC module covers KMIP protocol integration, cross-provider key
                  synchronization, and HSM capacity planning in depth &mdash; directly applicable to
                  smart meter head-end key management.
                </p>
                <Link
                  to="/learn/kms-pqc"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2 font-medium"
                >
                  <ArrowRight size={12} />
                  Open KMS &amp; PQC Module
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 5: Safety & Environmental Risk --------------------------- */}
      <CollapsibleSection
        title="Safety & Environmental Risk"
        icon={<AlertTriangle size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Unlike IT systems where a security breach causes data loss, energy sector crypto
            failures can cascade into <strong>physical consequences</strong>. Risk assessment must
            account for both human safety and environmental impact &mdash; dimensions absent from
            standard cybersecurity frameworks.
          </p>

          {/* Physical consequence categories */}
          <h4 className="text-sm font-bold text-foreground">Physical Consequence Categories</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Severity</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    level: 'Catastrophic',
                    color: 'text-status-error',
                    desc: 'Loss of life, widespread destruction',
                    example: 'Transmission grid collapse, pipeline explosion, dam failure',
                  },
                  {
                    level: 'Critical',
                    color: 'text-status-error',
                    desc: 'Serious injury, major infrastructure damage',
                    example: 'Water contamination, substation fire, gas leak',
                  },
                  {
                    level: 'Major',
                    color: 'text-status-warning',
                    desc: 'Extended outage, significant disruption',
                    example: 'Distribution blackout (200K+ customers), DER instability',
                  },
                  {
                    level: 'Moderate',
                    color: 'text-status-info',
                    desc: 'Localized disruption, recoverable',
                    example: 'Meter fleet compromise, billing fraud, data exposure',
                  },
                  {
                    level: 'Minor',
                    color: 'text-muted-foreground',
                    desc: 'Minimal impact, contained',
                    example: 'Single device compromise, log tampering',
                  },
                ].map((row) => (
                  <tr key={row.level} className="border-b border-border/50">
                    <td className={`p-2 text-xs font-bold ${row.color}`}>{row.level}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.desc}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Environmental categories */}
          <h4 className="text-sm font-bold text-foreground">
            Environmental Consequence Categories
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Severity</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Zone Impact</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    level: 'Severe',
                    color: 'text-status-error',
                    desc: 'Irreversible environmental damage',
                    zone: 'Protected ecosystems: 3x severity multiplier',
                  },
                  {
                    level: 'Significant',
                    color: 'text-status-warning',
                    desc: 'Long-term contamination requiring remediation',
                    zone: 'Urban areas: 2x multiplier (population density)',
                  },
                  {
                    level: 'Moderate',
                    color: 'text-status-info',
                    desc: 'Contained impact, natural recovery expected',
                    zone: 'Suburban: 1.5x; Rural: 1x multiplier',
                  },
                  {
                    level: 'Minor',
                    color: 'text-muted-foreground',
                    desc: 'Negligible environmental effect',
                    zone: 'Industrial zones: 0.8x (pre-existing exposure)',
                  },
                ].map((row) => (
                  <tr key={row.level} className="border-b border-border/50">
                    <td className={`p-2 text-xs font-bold ${row.color}`}>{row.level}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.desc}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.zone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Crypto-to-physical consequence chain */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-status-error" />
              Crypto Failure to Physical Consequence Chain
            </h4>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                <strong>Quantum attacker breaks RSA/ECDSA key distribution</strong> &mdash;
                compromises the asymmetric channel that seeds symmetric session keys
              </li>
              <li>
                <strong>Derives session authentication keys</strong> &mdash; can now forge HMAC tags
                or decrypt TLS sessions
              </li>
              <li>
                <strong>Injects forged control commands</strong> &mdash; breaker open/close, valve
                position, setpoint changes
              </li>
              <li>
                <strong>Physical process enters unsafe state</strong> &mdash; overpressure,
                overload, loss of synchronization
              </li>
              <li>
                <strong>Safety systems may not compensate</strong> &mdash; if the attacker has
                mapped protection settings via HNDL
              </li>
              <li>
                <strong>Physical consequence materializes</strong> &mdash; blackout, explosion,
                flooding, contamination
              </li>
            </ol>
          </div>

          {/* Cross-ref to Data Asset Sensitivity */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">Explore Risk Frameworks</h4>
                <p className="text-xs text-muted-foreground">
                  The Data Asset Sensitivity module covers NIST RMF, ISO 27005, and FAIR risk
                  frameworks that underpin the consequence scoring used in energy sector PQC risk
                  assessments.
                </p>
                <Link
                  to="/learn/data-asset-sensitivity"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2 font-medium"
                >
                  <ArrowRight size={12} />
                  Open Data Asset Sensitivity Module
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 6: Extended Lifecycles & Connectivity Challenges ---------- */}
      <CollapsibleSection
        title="Extended Lifecycles & Connectivity Challenges"
        icon={<Clock size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Energy infrastructure spans vast geographic areas with highly variable connectivity.
            Substations may be air-gapped, connected via 9.6 kbps serial links, or located at remote
            generation sites accessible only by helicopter. PQC migration strategies must account
            for these physical realities.
          </p>

          {/* Connectivity challenges grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Network size={14} className="text-primary" />
                Air-Gapped Substations
              </h4>
              <p className="text-xs text-muted-foreground">
                Firmware updates and key rotations require physical site visits
                (&ldquo;truck-rolls&rdquo;). A utility with 200 substations and 4-hour truck-roll
                per site needs <strong>800 labor-hours</strong> for a single fleet-wide update.
                Scheduling around maintenance windows and crew availability can extend this to
                months.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Network size={14} className="text-primary" />
                Serial DNP3 Links
              </h4>
              <p className="text-xs text-muted-foreground">
                Many RTUs communicate via serial DNP3 at <strong>9.6 kbps</strong>. An ML-KEM-768
                key exchange (1,088 bytes) takes approximately <strong>0.9 seconds</strong> at this
                speed &mdash; acceptable for key rotation but too slow for frequent re-keying. PQC
                key transport must be carefully scheduled to avoid disrupting SCADA polling cycles.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Zap size={14} className="text-primary" />
                Remote Generation Sites
              </h4>
              <p className="text-xs text-muted-foreground">
                Wind farms on ridgelines and offshore platforms, solar plants in deserts, and small
                hydro in mountainous terrain. Connectivity varies from cellular to satellite. Some
                sites use bandwidth-constrained microwave links. PQC key sizes stress these already
                limited channels.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Shield size={14} className="text-primary" />
                PLC Networks (Smart Meters)
              </h4>
              <p className="text-xs text-muted-foreground">
                Powerline communication operates at <strong>10&ndash;200 kbps</strong> and is
                sensitive to electrical noise from transformers, motors, and switching events.
                Effective throughput can drop to 60% of nominal. PQC key rotation for millions of
                meters is a multi-day network operation.
              </p>
            </div>
          </div>

          {/* Gateway-mediated PQC */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Gateway-Mediated PQC
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              For devices that cannot be upgraded to PQC (serial RTUs, legacy PLCs, air-gapped
              IEDs), a <strong>crypto gateway</strong> can terminate classical crypto on the field
              bus side and establish PQC-protected tunnels on the WAN side. This is the pragmatic
              solution for the &ldquo;last mile&rdquo; of energy infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs font-mono text-foreground justify-center">
              <div className="bg-status-warning/10 border border-status-warning/30 rounded px-4 py-2 text-center">
                Legacy Device
                <div className="text-[10px] text-muted-foreground font-sans">Classical crypto</div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground sm:rotate-0 rotate-90" />
              <div className="bg-primary/10 border border-primary/30 rounded px-4 py-2 text-center font-bold">
                Crypto Gateway
                <div className="text-[10px] text-muted-foreground font-sans font-normal">
                  Translate &amp; re-encrypt
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground sm:rotate-0 rotate-90" />
              <div className="bg-status-success/10 border border-status-success/30 rounded px-4 py-2 text-center">
                WAN / Control Center
                <div className="text-[10px] text-muted-foreground font-sans">PQC-protected</div>
              </div>
            </div>
          </div>

          {/* Cross-ref to IoT/OT */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Network size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">Gateway Architecture</h4>
                <p className="text-xs text-muted-foreground">
                  The IoT &amp; OT Security module covers gateway-mediated PQC in detail, including
                  the Purdue model zones where crypto gateways are deployed and protocol translation
                  patterns for constrained devices.
                </p>
                <Link
                  to="/learn/iot-ot-pqc"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2 font-medium"
                >
                  <ArrowRight size={12} />
                  Open IoT &amp; OT Security Module
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Workshop CTA ----------------------------------------------------- */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">
              Ready to assess your utility&apos;s PQC readiness?
            </h3>
            <p className="text-sm text-muted-foreground">
              Model substation protocol migrations, simulate smart meter key rotation at scale,
              evaluate safety risk scenarios, and build a phased migration roadmap in the
              interactive workshop.
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
            to="/learn/iot-ot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">IoT &amp; OT Security</div>
              <div className="text-xs text-muted-foreground">
                PQC for RTUs, PLCs, and SCADA field devices
              </div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Scale size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">
                NERC CIP and IEC 62351 regulatory alignment
              </div>
            </div>
          </Link>
          <Link
            to="/learn/stateful-signatures"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <GitBranch size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Stateful Signatures</div>
              <div className="text-xs text-muted-foreground">
                LMS for firmware signing on long-lifecycle grid equipment
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Key size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                Key management for substation and SCADA communication channels
              </div>
            </div>
          </Link>
          <Link
            to="/learn/data-asset-sensitivity"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Data Asset Sensitivity</div>
              <div className="text-xs text-muted-foreground">
                Classify OT data and prioritize PQC migration by impact
              </div>
            </div>
          </Link>
          <Link
            to="/learn/migration-program"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Clock size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Program</div>
              <div className="text-xs text-muted-foreground">
                Phase-based PQC rollout planning for critical infrastructure
              </div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="AppServers" />

      {/* -- Reading Complete ------------------------------------------------- */}
      <ReadingCompleteButton />
    </div>
  )
}
