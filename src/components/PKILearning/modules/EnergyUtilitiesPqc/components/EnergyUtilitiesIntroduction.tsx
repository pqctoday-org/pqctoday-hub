// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import {
  Zap,
  ShieldAlert,
  Radio,
  Clock,
  Scale,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'

interface EnergyUtilitiesIntroductionProps {
  onNavigateToWorkshop: (step?: number) => void
}

export const EnergyUtilitiesIntroduction: React.FC<EnergyUtilitiesIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()

  return (
    <div className="space-y-8">
      {/* Educational Scope Banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/85">
        <div className="flex items-start gap-3">
          <Zap size={18} className="mt-0.5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Educational Scope &amp; Production Verification
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This module uses fictional utility architectures, sample link budgets, and simulated
              asset lifecycles to teach how to plan post-quantum migration in energy and power-grid
              environments. Completing exercises here does not verify your deployed substations,
              SCADA gateways, or AMI fleets — apply the lab validation methods and vendor evidence
              checks below using your own OT/IT testbeds and production tools.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Grid Threat Model & Protected Assets */}
      <section
        data-section-id="grid-threat-model"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <ShieldAlert size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            1. Grid Threat Model: Services vs. Protected Assets
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Power grids face two distinct quantum risks. First,{' '}
          <InlineTooltip term="HNDL">harvest-now-decrypt-later (HNDL)</InlineTooltip> adversaries
          can record encrypted inter-control-center telemetry, grid topology transfers, and
          smart-meter backhaul today to decrypt later. Second, once a cryptographically relevant
          quantum computer (CRQC) arrives, forged classical signatures could authorize malicious
          breaker trips or counterfeit firmware updates on field devices that cannot be physically
          replaced overnight.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Distinguish Operational Services from Protected Assets
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Always separate the <strong>operational grid service</strong> from the{' '}
              <strong>protected asset</strong>. The SCADA telemetry/control service, AMI head-end
              collection service, and substation firmware-update service are business and
              operational services. Long-lived grid topology records, customer metering histories,
              and field IED root-of-trust keys are the protected assets those services guard.
              Prioritization depends on both the asset’s confidentiality/trust lifetime and the
              service’s physical safety impact.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              What to Evaluate in Production OT/IT Tooling
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>
                <strong>Passive OT network discovery:</strong> Can your sensor inspect TLS, IKEv2,
                DNP3-SA, and IEC 62351 handshakes without injecting active probes into deterministic
                substation LANs?
              </li>
              <li>
                <strong>HIL relay &amp; gateway testbeds:</strong> Can you benchmark handshake
                fragmentation and trip latency before touching energized BES assets?
              </li>
              <li>
                <strong>Limitation:</strong> A paper architecture diagram or vendor brochure never
                proves live cipher negotiation — packet captures and HIL timing logs are required.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Substation & SCADA Protocols */}
      <section
        data-section-id="substation-and-scada"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Radio size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            2. Substation &amp; SCADA Protocols: Real-Time Loops vs. Control Planes
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Grid protocols cannot adopt post-quantum algorithms uniformly. In an IEC 61850 digital
          substation secured by IEC 62351, Generic Object Oriented Substation Events (GOOSE) and
          Sampled Values (SV) carry protection-relay tripping messages under a strict{' '}
          <strong>&lt;4 ms</strong> end-to-end latency budget on 1,500-byte Layer 2 Ethernet frames.
          An <InlineTooltip term="ML-DSA">ML-DSA-44</InlineTooltip> signature is 2,420 bytes (and
          ML-DSA-65 is 3,309 bytes) — exceeding a single Ethernet MTU and making per-frame
          asymmetric PQC signatures unusable inside the protection loop.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              IEC 62351-6 &amp; GDOI (RFC 8052)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keep symmetric <strong>HMAC-SHA-256</strong> (32-byte MAC) or{' '}
              <strong>AES-256-GCM</strong> on the &lt;4 ms GOOSE/SV data plane. Migrate out-of-band
              group key distribution (GDOI KDC) and MMS supervisory TLS sessions to hybrid{' '}
              <InlineTooltip term="ML-KEM">ML-KEM-768</InlineTooltip>.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">DNP3-SA (IEEE 1815)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DNP3 Secure Authentication authenticates telecontrol messages with symmetric
              HMAC-SHA-256 session keys. Protect update-key distribution and wrap WAN transport in
              hybrid <InlineTooltip term="TLS 1.3">TLS 1.3</InlineTooltip> (RFC 9846 / RFC 10024) or
              IKEv2 (RFC 9370).
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              SCADA WAN &amp; Failover Links
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inter-control-center (ICCP/TASE.2) and substation WAN gateways should deploy hybrid
              ML-KEM-768 via RFC 10024 (<code className="text-xs">X25519MLKEM768</code>) and IKEv2
              RFC 9370 across both primary fiber and backup cellular/microwave paths.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: AMI & Field Lifecycles */}
      <section
        data-section-id="ami-and-field-lifecycles"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Clock size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            3. AMI Smart Meters, DER Edge &amp; 15–25 Year Field Lifecycles
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Protection relays, RTUs, smart meters (DLMS/COSEM over IEEE 802.15.4g RF-mesh or NB-IoT),
          and utility-scale DER inverters routinely remain energized for{' '}
          <strong>15 to 25 years</strong>. An asset installed today will still operate well past
          2040, making Mosca-window planning essential: if the asset’s confidentiality or firmware
          trust horizon plus fleet migration lead time exceeds the quantum threat horizon, interim
          mitigations are required long before physical truck rolls finish.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Interim Compensating Controls (Today–2030)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Terminate hybrid ML-KEM-768 VPN/TLS tunnels at ruggedized substation routers, AMI
              collectors, and DER site gateways. On constrained RF-mesh meters (127-byte MAC
              frames), use 256-bit symmetric AES/HMAC session keys with diversified master keys
              instead of pushing multi-kilobyte PQC certificate chains over narrowband radio.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Next-Generation Procurement &amp; Firmware Roots
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every new IED, RTU, smart-meter, and inverter RFP issued now should require
              crypto-agile bootloaders supporting hash-based firmware verification (
              <InlineTooltip term="LMS">LMS-SHA256</InlineTooltip> under NIST SP 800-208 or{' '}
              <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>) or ML-DSA-44/65 where flash and
              RAM allow, alongside active FIPS 140-3 validated cryptographic modules.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Regulatory Scope & Verifiable Evidence */}
      <section
        data-section-id="regulatory-and-migration"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Scale size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            4. Regulatory Scope &amp; Verifiable Vendor Evidence
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Energy compliance frameworks rarely share a single algorithm clock. Misstating a
          regulation to a utility board or regulator undermines credibility and funding:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">NERC CIP (North America)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              NERC CIP (CIP-005, CIP-007, CIP-010, CIP-011, CIP-012, CIP-013) mandates Bulk Electric
              System (BES) cyber security, control-center link protection, and supply-chain risk
              management. It does <strong>not</strong> establish a standalone PQC algorithm
              deadline.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              NIS2 &amp; EU PQC Roadmap v1.1
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The EU NIS2 Directive establishes cybersecurity risk-management duties for critical
              energy entities and does <strong>not</strong> set a fixed PQC deadline. The 2030
              high-risk and 2035 full-transition targets come from the non-binding EU NIS
              Cooperation Group PQC Roadmap v1.1.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">NIST IR 8547 &amp; EO 14412</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip> (final October 2026)
              sets 2030 classical deprecation and 2035 disallowance targets. EO 14412 and OMB
              M-26-15 apply to US federal civilian systems (such as federal power marketing
              administrations), targeting 2030 key establishment and 2031 signatures.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle size={16} className="text-status-warning shrink-0" />
            <span>Core Governance Rule: Unknown Never Means Low Exposure</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When an IED, RTU, AMI, or DER vendor leaves a PQC supply-chain question blank, replies
            “on roadmap”, or cites a Historical FIPS 140-2 certificate (retired September 2026),
            classify that control as <strong>Unverified / Evidence Gap</strong> — never as low
            exposure. Demand verifiable <InlineTooltip term="CBOM">CBOM</InlineTooltip> artifacts,
            active CMVP FIPS 140-3 IDs, and lab test outputs.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 size={14} className="text-status-success shrink-0" />
            <span>
              Ready to map grid protocols, check substation MTU/latency budgets, and plan 20-year
              field lifecycles?
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
