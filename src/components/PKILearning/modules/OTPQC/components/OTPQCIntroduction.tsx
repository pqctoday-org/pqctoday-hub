// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  Factory,
  Layers,
  Network,
  Timer,
  FileSignature,
  DoorOpen,
  Building2,
  Wrench,
  Scale,
  ArrowRight,
  Cpu,
  GitBranch,
  Key,
  Clock,
  Route,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { OT_PROTOCOLS, summarizeProtocol } from '../data/otProtocolData'
import { OT_ZONES } from '../data/zoneConduitData'
import { EQUIPMENT_LIFECYCLES } from '../data/substationData'
import { NERC_CIP_STANDARDS, IEC_62351_PARTS, CNSA_2_0_CATEGORIES } from '../data/regulationsData'
import {
  svIntervals,
  zoneRanking,
  lmsH20Bytes,
  mldsa87Bytes,
  signingProjectLms,
} from '../data/learnFigures'

type PathId = 'A' | 'B' | 'C'

const PATH_TONE: Record<PathId, string> = {
  A: 'bg-primary/10 text-primary',
  B: 'bg-status-warning/15 text-status-warning',
  C: 'bg-status-error/10 text-status-error',
}

/** Where each attack path enters, crosses and ends on the Purdue stack. */
const ATTACK_SURFACE_ROWS: {
  level: string
  what: string
  paths: { path: PathId; role: string }[]
}[] = [
  {
    level: 'L4–5',
    what: 'Enterprise: email, ERP, identity provider, corporate PKI',
    paths: [{ path: 'A', role: 'starts here' }],
  },
  {
    level: 'L3.5',
    what: 'Industrial DMZ, remote-access jump hosts, IIoT segment',
    paths: [
      { path: 'A', role: 'crosses' },
      { path: 'B', role: 'ends here' },
    ],
  },
  {
    level: 'L3',
    what: 'Site operations: engineering workstations, OT domain',
    paths: [{ path: 'A', role: 'spreads' }],
  },
  {
    level: 'L2',
    what: 'Supervisory: SCADA, HMI, OPC UA servers',
    paths: [{ path: 'A', role: 'reaches control' }],
  },
  {
    level: 'L1',
    what: 'Basic control and SIS: PLCs, RTUs, IEDs',
    paths: [{ path: 'C', role: 'on site' }],
  },
  {
    level: 'L0',
    what: 'Field: sensors, actuators, drives',
    paths: [{ path: 'C', role: 'on site' }],
  },
]

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

const LibLink: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <Link to={`/library?ref=${encodeURIComponent(id)}`} className="text-primary hover:underline">
    {children}
  </Link>
)

const Card: React.FC<{ title: string; tone?: string; children: React.ReactNode }> = ({
  title,
  tone = 'bg-muted/50 border-border',
  children,
}) => (
  <div className={`rounded-lg p-4 border ${tone}`}>
    <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
    <div className="text-xs text-muted-foreground space-y-1">{children}</div>
  </div>
)

export const OTPQCIntroduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const zone = (id: string) => zoneRanking.find((z) => z.id === id)!
  const sv = (rate: number) => svIntervals.find((s) => s.rate === rate)!.micros

  return (
    <div className="space-y-8 w-full">
      {/* 1 ─ Why OT is different ───────────────────────────────────────── */}
      <LearnSection
        sectionId="why-ot"
        title="Why OT Is Different"
        icon={<Factory size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Operational technology (OT) runs physical processes: grids, pipelines, water plants,
            railways, factories and buildings. IT security usually ranks confidentiality first. OT
            turns the order around:{' '}
            <strong>safety, then availability, then integrity, then confidentiality</strong>. A
            control system that leaks data is a problem; one that accepts a forged command can hurt
            people.
          </p>
          <p>
            That changes what the quantum threat means here. In IT the headline risk is{' '}
            <InlineTooltip term="HNDL">harvest now, decrypt later</InlineTooltip>. In OT the bigger
            risk is <strong>authenticity</strong>: a{' '}
            <InlineTooltip term="CRQC">cryptographically relevant quantum computer</InlineTooltip>{' '}
            could forge the RSA or ECDSA signatures that controllers use to accept firmware, project
            downloads, certificates and commands. Forgery needs no harvesting — it starts the day
            such a machine exists — and the devices that trust the old keys stay in service for
            decades.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card
              title="Forged commands and firmware"
              tone="bg-status-error/10 border-status-error/20"
            >
              <p>
                Signing roots (vendor firmware keys, engineering-tool keys, device CAs) are the
                first thing to migrate. Step 2 of the workshop scores this as its own axis.
              </p>
            </Card>
            <Card title="Harvested traffic" tone="bg-status-warning/10 border-status-warning/20">
              <p>
                Still real at the boundary: remote-access sessions, inter-site links and vendor VPNs
                carry credentials, topology and settings worth recording now.
              </p>
            </Card>
            <Card title="20–50-year assets">
              <p>
                A relay or PLC installed today may still run in the 2040s; substation primary plant
                lasts longer still (see the table below).
              </p>
            </Card>
            <Card title="Recertification cost">
              <p>
                Changing crypto in a safety-related device can mean re-testing a protection scheme,
                re-running a SIL assessment or re-opening a rail safety case — far more than a
                software update.
              </p>
            </Card>
          </div>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 font-medium">Asset</th>
                  <th className="text-center p-2 font-medium">Typical life (years)</th>
                  <th className="text-left p-2 font-medium">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {EQUIPMENT_LIFECYCLES.map((eq) => (
                  <tr key={eq.id} className="border-b border-border/50">
                    <td className="p-2 font-bold text-foreground">{eq.name}</td>
                    <td className="p-2 text-center">
                      {eq.typicalLifeYears[0]}&ndash;{eq.typicalLifeYears[1]}
                    </td>
                    <td className="p-2 text-muted-foreground">{eq.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Smart meters, AMI head-ends and RF-mesh networks are covered in{' '}
            <Link to="/learn/iot-pqc" className="text-primary hover:underline">
              IoT &amp; Embedded Device PQC
            </Link>
            , which deals with fleets of constrained devices.
          </p>
        </div>
      </LearnSection>

      {/* 2 ─ Architecture ───────────────────────────────────────────────── */}
      <LearnSection
        sectionId="architecture"
        title="Architecture: Purdue Levels, IEC 62443 Zones and Conduits"
        icon={<Layers size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The <strong>Purdue model</strong> stacks an industrial network into levels — field
            devices (L0), controllers (L1), supervisory systems (L2), site operations (L3), an
            industrial DMZ (L3.5) and the enterprise (L4–5). <strong>IEC 62443</strong> turns that
            picture into something you can secure: assets with the same security needs form a{' '}
            <strong>zone</strong>, and every communication path between zones is a{' '}
            <strong>conduit</strong> with its own controls.
          </p>
          <p>Each zone carries three security levels (SL 1–4):</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong>SL-T</strong> (target) — what the zone needs, from the risk assessment.
            </li>
            <li>
              <strong>SL-C</strong> (capability) — what a component or system can deliver.
            </li>
            <li>
              <strong>SL-A</strong> (achieved) — what the installed zone actually reaches.
            </li>
          </ul>
          <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/20 text-xs">
            <strong className="text-foreground">No PQC wording yet.</strong> SR 4.3 (IEC 62443-3-3)
            and CR 4.3 (
            <LibLink id="IEC-62443-4-2-2019-Security-for-industrial-automation-and-co">
              IEC 62443-4-2
            </LibLink>
            ), both titled &lsquo;Use of cryptography&rsquo; and applying from SL 1, ask for
            cryptography that follows commonly accepted (SR 4.3) or internationally recognized and
            proven (CR 4.3) security practice; neither names an algorithm or PQC. So PQC enters
            through risk assessment and procurement, not through the standard&rsquo;s text.
          </div>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 font-medium">Purdue</th>
                  <th className="text-left p-2 font-medium">Zone (Step 2)</th>
                  <th className="text-center p-2 font-medium">SL-T</th>
                  <th className="text-left p-2 font-medium">Authenticity anchor</th>
                </tr>
              </thead>
              <tbody>
                {OT_ZONES.map((z) => (
                  <tr key={z.id} className="border-b border-border/50">
                    <td className="p-2 font-mono">{z.purdue}</td>
                    <td className="p-2 text-foreground">{z.name}</td>
                    <td className="p-2 text-center">{z.slTarget}</td>
                    <td className="p-2 text-muted-foreground">{z.authenticityAnchor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            With its default settings, the Zone &amp; Conduit Planner ranks IIoT &amp; cloud
            connectors, Remote &amp; vendor access and the Industrial DMZ first (
            {zone('remote-access').priority}, driven by HNDL), and Basic control and the SIS next (
            {zone('control').priority}, driven by firmware and project-signing forgery) — ahead of
            the Enterprise zone ({zone('enterprise').priority}). An HNDL-only view would have put
            Level 0–1 last. The ranking says where a quantum computer hurts most; the next section
            shows how attackers get there.
          </p>
        </div>
      </LearnSection>

      {/* 2b ─ Attack surface ─────────────────────────────────────────────── */}
      <LearnSection
        sectionId="attack-surface"
        title="OT Attack Surface: Three Paths In"
        icon={<Route size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Zones say what is at stake; they do not say how an attacker gets there. OT is reached
            along three paths, and each needs a different fix. Step 2 of the workshop tags every
            conduit with its path.
          </p>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Purdue levels and the three attack paths"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 font-medium">Purdue</th>
                  <th className="text-left p-2 font-medium">What sits there</th>
                  <th className="text-left p-2 font-medium">Paths</th>
                </tr>
              </thead>
              <tbody>
                {ATTACK_SURFACE_ROWS.map((r) => (
                  <tr key={r.level} className="border-b border-border/50 align-top">
                    <td className="p-2 font-mono whitespace-nowrap">{r.level}</td>
                    <td className="p-2 text-muted-foreground">{r.what}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {r.paths.map((x) => (
                          <span
                            key={x.path + x.role}
                            className={`text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap ${PATH_TONE[x.path]}`}
                          >
                            {x.path} · {x.role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Card
              title="A · IT-to-OT lateral movement (L4/5 → L3.5 → L3 → L2)"
              tone="bg-primary/5 border-primary/20"
            >
              <p>
                The most common way in starts on the business network: a phished laptop, stolen
                credentials, then a pivot through the DMZ into site operations and supervisory
                control. CISA notes that OT may be exposed to a quantum computer precisely
                &ldquo;due to connectivity or association with IT platforms&rdquo; and their
                identity and access management (<LibLink id="US-CISA-PQC-OT-2024">CISA</LibLink>).
                Corporate PKI, identity providers and Active Directory trust vouch for every hop, so
                a CRQC that forges them makes lateral movement quiet. Migrating the IT side is part
                of protecting OT. NIST SP 800-82r3 asks for separate OT accounts and a monitored DMZ
                &ldquo;to avoid compromises that allow attackers to pivot to the OT
                environment&rdquo; (<LibLink id="NIST SP 800-82 Rev. 3">SP 800-82r3</LibLink>; see
                also{' '}
                <LibLink id="CISA-OT-Primary-Mitigations-2025">
                  CISA&rsquo;s primary OT mitigations
                </LibLink>
                ). An IT-only incident can still stop the plant: in 2021 a pipeline operator
                disconnected OT systems after ransomware hit its IT network (
                <LibLink id="CISA-AA21-131A-DarkSide">CISA AA21-131A</LibLink>).
              </p>
            </Card>
            <Card
              title="B · Remote access and connected devices (ending at L3.5)"
              tone="bg-status-warning/10 border-status-warning/20"
            >
              <p>
                Vendor VPNs, jump hosts and IIoT platforms that send plant data to the cloud. In
                NIST&rsquo;s reference architecture, communication from the IIoT platform tier is
                routed through the DMZ border firewall; IIoT that connects straight to the cloud
                from L1 or L2 changes the boundaries the zone model relies on (
                <LibLink id="NIST SP 800-82 Rev. 3">SP 800-82r3 §5.4.2, §5.3.7</LibLink>). This is
                where recorded traffic matters most, so hybrid ML-KEM on the VPN, SSH or TLS link is
                the first PQC step; phishing-resistant MFA and private links come first of all.
              </p>
            </Card>
            <Card
              title="C · Physical or local access (L1/L0)"
              tone="bg-status-error/10 border-status-error/20"
            >
              <p>
                Sometimes called close access: someone on site or nearby, on a field network, serial
                link or wireless segment. Only a small minority of installed field-level traffic is
                authenticated or encrypted. CISA found that &ldquo;many OT systems built in 2026
                still rely on protocol implementations designed decades ago, leaving their networks
                fully trusting anyone with access&rdquo; (
                <LibLink id="Barriers-to-Secure-OT-Communication-Why-Johnny-Can-t-Authent">
                  CISA, 2026
                </LibLink>
                ), and many Level 0 devices cannot be authenticated at all (SP 800-82r3 §5.3.6).
                That is a present-day gap: fix it with classical authentication or an authenticating
                gateway. PQC belongs in firmware signing and key distribution here, not in the
                real-time path. The same CISA study warns that PQC will meet the same adoption
                barriers: cost, downtime and complexity.
              </p>
            </Card>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border text-xs space-y-1">
            <p className="text-foreground font-bold">Worked example: Ukraine, December 2015</p>
            <p className="text-muted-foreground">
              One incident used all three paths (
              <LibLink id="CISA-IR-ALERT-H-16-056-01">CISA IR-ALERT-H-16-056-01</LibLink>). Spear
              phishing put BlackEnergy malware on the companies&rsquo; networks, where it was
              probably used to obtain legitimate credentials (A). The attackers then operated
              breakers remotely through VPN connections and ICS client software (B). They also
              rendered serial-to-Ethernet devices at substations inoperable by corrupting their
              firmware (C).
            </p>
          </div>
        </div>
      </LearnSection>

      {/* 3 ─ OT protocols ───────────────────────────────────────────────── */}
      <LearnSection
        sectionId="ot-protocols"
        title="OT Protocol Native Security"
        icon={<Network size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Most OT protocols already protect their real-time messages with{' '}
            <strong>symmetric</strong> crypto — HMAC, GMAC, AES key wrap — which a quantum computer
            does not break. The exposure sits in the public-key parts around them: certificates, key
            distribution and TLS handshakes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card title="IEC 61850 GOOSE / SV / MMS (energy)">
              <p>
                <LibLink id="IEC-62351-6-2020-Power-systems-management-and-associated-inf">
                  IEC 62351-6
                </LibLink>{' '}
                (2020) protects GOOSE and Sampled Values with profiles that include HMAC-SHA256 and
                AES-GMAC. Group keys come from a key distribution centre over GDOI (IEC 62351-9,{' '}
                <LibLink id="RFC-8052">RFC 8052</LibLink>) — not from RSA certificates. MMS uses TLS
                per IEC 62351-3. IEC 62351-3:2023 adds a TLS 1.3 profile and now lists the mandatory
                TLS 1.2 cipher suites itself; it profiles conventional TLS cipher suites and does
                not specify PQC key-exchange or signature algorithms.
              </p>
            </Card>
            <Card title="DNP3 SAv5 and IEC 60870-5-104">
              <p>
                DNP3 Secure Authentication v5 uses an HMAC challenge-response and wraps session keys
                with AES key wrap. Update keys are pre-shared by default; where they are changed
                remotely, the <strong>default</strong> method is symmetric (AES-256 key wrap plus
                HMAC-SHA-256) and the RSA/DSA methods are optional. IEEE moved 1815-2012 to inactive
                status in 2023, the P1815 revision runs to 2027, and &ldquo;SAv6&rdquo; is
                unpublished. IEC 104 uses IEC 62351-3 TLS and IEC 62351-5 authentication.
              </p>
            </Card>
            <Card title="OPC UA">
              <p>
                SecurityPolicies use RSA (e.g. Basic256Sha256) or ECC (nistP256, nistP384,
                brainpool, curve25519) for certificates and key establishment (
                <LibLink id="OPC-10000-2">OPC 10000-2</LibLink>,{' '}
                <LibLink id="OPC-10000-7">OPC 10000-7</LibLink>). A PQC policy would arrive through
                the Part 7 profiles; none is published.
              </p>
            </Card>
            <Card title="CIP Security and PROFINET">
              <p>
                <LibLink id="ODVA-PUB00319-CIP-Security">CIP Security</LibLink> secures EtherNet/IP
                with TLS/DTLS, X.509 or pre-shared keys across five profiles.{' '}
                <LibLink id="PI-PROFINET-Security-Whitepaper-V105-2019">PROFINET</LibLink> defines
                Security Class 1 (robustness, e.g. signed GSD files), Class 2 (integrity and
                authenticity via device certificates and a MAC over cyclic frames) and Class 3 (adds
                confidentiality).
              </p>
            </Card>
            <Card title="Modbus/TCP Security and BACnet/SC">
              <p>
                Modbus/TCP Security wraps Modbus in mutual TLS; plain Modbus has no security at all.{' '}
                <LibLink id="ASHRAE-135-2016-Addendum-bj">BACnet/SC</LibLink> runs building
                automation over TLS 1.3 WebSockets with elliptic-curve crypto only.
              </p>
            </Card>
            <Card title="DLMS/COSEM (metering)">
              <p>
                Suite 0 is AES-GCM-128 only; Suite 1 adds ECDH/ECDSA P-256 and AES key wrap; Suite 2
                uses P-384 and AES-GCM-256. None of them uses RSA.
              </p>
            </Card>
          </div>
          <h3 className="text-sm font-bold text-foreground">IEC 62351 parts at a glance</h3>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 font-medium">Part</th>
                  <th className="text-left p-2 font-medium">Scope</th>
                  <th className="text-left p-2 font-medium">Quantum exposure</th>
                </tr>
              </thead>
              <tbody>
                {IEC_62351_PARTS.map((p) => (
                  <tr key={p.part} className="border-b border-border/50 align-top">
                    <td className="p-2 font-bold text-foreground whitespace-nowrap">
                      {p.part} — {p.title}
                    </td>
                    <td className="p-2 text-muted-foreground">{p.scope}</td>
                    <td className="p-2 text-muted-foreground">{p.quantumExposure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            The workshop&rsquo;s Protocol Analyzer covers {OT_PROTOCOLS.length} protocols;{' '}
            {OT_PROTOCOLS.filter((p) => summarizeProtocol(p).symmetricSafe > 0).length} of them
            already have at least one symmetric layer that needs no PQC change. Survey background:{' '}
            <LibLink id="PNNL-29313-RADIANCE">PNNL-29313 (RADIANCE)</LibLink>.
          </p>
        </div>
      </LearnSection>

      {/* 4 ─ Safety-critical timing ─────────────────────────────────────── */}
      <LearnSection
        sectionId="safety-timing"
        title="Safety-Critical Timing and Safety Systems"
        icon={<Timer size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            IEC 61850-5 gives GOOSE type 1A trip messages two performance classes: P1, transfer-time
            class <strong>TT6, 3 ms or less</strong>, and P2, TT5, 10 ms or less (
            <LibLink id="Torres-ICREPQ-2024-341">Torres et al., ICREPQ 2024</LibLink>, which
            tabulates the classes). IEC 61869-9 defines Sampled Value rates including{' '}
            <strong>4,000, 4,800 and 14,400 samples per second</strong> — a frame every {sv(4000)},{' '}
            {sv(4800)} and {sv(14400)} µs (
            <LibLink id="Chen-Sensors-2020-20-7345">Chen et al., Sensors 2020</LibLink>).
          </p>
          <p>
            That is why <strong>PQC stays out of the trip path</strong>. A{' '}
            {lmsH20Bytes.toLocaleString()}
            -byte LMS or {mldsa87Bytes.toLocaleString()}-byte ML-DSA-87 signature on every GOOSE
            frame is neither needed nor practical: the symmetric MAC is already quantum-safe. The
            PQC work goes into key distribution, firmware and the boundary.
          </p>
          <p>
            Time sync matters too. Substation PTP uses the IEC 61850-9-3 power profile, and its
            security is <strong>IEEE 1588-2019 Annex P</strong> (integrated group-key
            authentication, transport security, architecture and monitoring) — not NTS, which
            secures NTP (
            <LibLink id="Alghamdi-Schukat-Cybersecurity-2021-4-12">
              Alghamdi &amp; Schukat, 2021
            </LibLink>
            ).
          </p>
          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/30 text-xs space-y-1">
            <p className="text-foreground font-bold">Safety instrumented systems (IEC 61511)</p>
            <p className="text-muted-foreground">
              Edition 2 of IEC 61511 added clause 8.2.4: a security risk assessment of the SIS is
              mandatory (
              <LibLink id="Derbyshire-IChemE-Hazards26-2016">Derbyshire, IChemE Hazards 26</LibLink>
              ; see also the{' '}
              <LibLink id="HSE-ECI-Functional-Safety">UK HSE functional-safety guidance</LibLink>).
              A networked SIS that accepts signed logic or firmware has a signing root like any
              other controller. Safety and security have to be engineered together: an independent,
              non-programmable protection layer bounds the harm whatever the crypto — which is why
              Step 4 scores it.
            </p>
          </div>
        </div>
      </LearnSection>

      {/* 5 ─ Firmware & project signing ─────────────────────────────────── */}
      <LearnSection
        sectionId="firmware-project-signing"
        title="Firmware and Project Signing"
        icon={<FileSignature size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Two kinds of signature decide what a controller runs. <strong>Firmware</strong> is
            signed by the vendor and checked by the device&rsquo;s bootloader or update agent.{' '}
            <strong>Projects</strong> — the logic, configuration and settings an engineer downloads
            from a workstation — are increasingly signed too. Both are forgeable once RSA and ECDSA
            fall.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong>NERC CIP-010-4 R1.6</strong> requires verifying the software source and
              integrity before a baseline change on high and medium impact systems (
              <LibLink id="NERC-CIP-010-4">CIP-010-4</LibLink>) — firmware integrity lives here, not
              in CIP-007.
            </li>
            <li>
              <strong>IEC 62443-4-1</strong> (secure development lifecycle) covers how vendors sign
              and deliver updates; <strong>IEC 62443-4-2</strong> CR 3.4 requires software and
              information integrity in the component.
            </li>
            <li>
              <strong>CNSA 2.0</strong> (<LibLink id="NSA CNSA 2.0">NSA</LibLink>) lists LMS and
              XMSS (per <LibLink id="NIST SP 800-208">SP 800-208</LibLink>) for software and
              firmware signing, with ML-DSA-87 as its general signature. Software and firmware
              signing should prefer CNSA 2.0 from 2025 and use it exclusively by 2030.
            </li>
          </ul>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card title="LMS / HSS (stateful)">
              <p>
                Small public key, fast verification, conservative hash-only security — but every
                signature uses a one-time key from a fixed budget, and the counter must never
                repeat. SP 800-208 requires signing in hardware modules that do not let the state be
                cloned.
              </p>
            </Card>
            <Card title="ML-DSA (stateless)">
              <p>
                No counter to protect, so it suits many signers and offline workstations. Larger
                signatures ({mldsa87Bytes.toLocaleString()} B for ML-DSA-87) and public keys.
              </p>
            </Card>
          </div>
          <p>
            In the Signing Lab, an LMS H10 tree used for project signing at 5,000 signatures a year
            is exhausted after {signingProjectLms.yearsToExhaustion} years. The usual split: LMS or
            HSS in a vendor HSM for rare firmware releases, ML-DSA for high-volume project signing.
          </p>
        </div>
      </LearnSection>

      {/* 6 ─ Remote access & boundaries ─────────────────────────────────── */}
      <LearnSection
        sectionId="remote-access"
        title="Remote Access and Boundaries"
        icon={<DoorOpen size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The boundary is where HNDL matters most in OT. Remote sessions carry credentials and
            engineering traffic, and they cross networks an adversary can record.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong>Industrial DMZ (L3.5)</strong> — no direct path from enterprise to control;
              data is brokered through replicas and file-transfer services.
            </li>
            <li>
              <strong>Jump hosts</strong> — interactive sessions terminate on an intermediate system
              with MFA before reaching anything in L1–L2. Hybrid ML-KEM on the VPN or SSH in front
              of them protects the recorded session.
            </li>
            <li>
              <strong>IIoT platforms</strong> — gateways and cloud connectors belong on their own
              segment, routed through the DMZ border firewall; a direct cloud link from L1–L2 is a
              DMZ bypass. Hybrid ML-KEM on the cloud link and PQC-ready gateway certificates cover
              the quantum side.
            </li>
            <li>
              <strong>Data diodes</strong> — one-way hardware has no key exchange to break, but the
              files and updates it passes still need PQC signature checks.
            </li>
            <li>
              <strong>NERC CIP-005-7</strong> (<LibLink id="NERC-CIP-005-7">CIP-005-7</LibLink>) —
              R2 requires Interactive Remote Access through an intermediate system with encryption
              and multi-factor authentication, and the ability to detect and disable vendor
              sessions; R3 adds vendor remote-access management for EACMS and PACS. No algorithm is
              named.
            </li>
          </ul>
        </div>
      </LearnSection>

      {/* 7 ─ Sectors ─────────────────────────────────────────────────────── */}
      <LearnSection
        sectionId="sectors"
        title="Sector Deep Dives"
        icon={<Building2 size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <Card title="Energy — substations, control centres, pipelines">
            <p>
              IEC 61850 substations, DNP3 and IEC 104 telecontrol, ICCP between control centres. In
              North America NERC CIP applies: CIP-005-7 for remote access, CIP-010-4 for software
              integrity, and <LibLink id="NERC-CIP-012-2">CIP-012-2</LibLink> — effective 2026-07-01
              — which protects confidentiality, integrity and availability of real-time data between
              Control Centers and is technology-neutral (encryption is one way to meet it, not a
              mandate). US pipelines fall under{' '}
              <LibLink id="TSA-SD-PIPELINE-2021-02G">
                TSA Security Directive Pipeline-2021-02G
              </LibLink>
              . Step 3 works through a substation in detail.
            </p>
          </Card>
          <Card title="Water and wastewater">
            <p>
              The same SCADA, PLCs and vendor VPNs as energy, under a much lighter regime.
              EPA&rsquo;s 2023 move to require cybersecurity in sanitary surveys was withdrawn the
              same year; what remains is the AWIA §2013 risk-and-resilience assessment (
              <LibLink id="EPA-America-s-Water-Infrastructure-Act-AWIA-Section-2013">
                EPA AWIA
              </LibLink>
              ) and voluntary guidance from EPA and AWWA (
              <LibLink id="EPA-Cybersecurity-for-the-Water-Sector">
                EPA water-sector guidance
              </LibLink>
              ). Neither names a crypto mechanism, so the migration case rests on operational risk.
            </p>
          </Card>
          <Card title="Rail and transit">
            <p>
              Signalling has a 25–40-year life and a safety case behind every change. ERTMS/ETCS
              distributes keys through a Key Management Centre specified in{' '}
              <LibLink id="UNISIG-SUBSET-137-ERTMS-ETCS-On-line-Key-Management-FFFIS">
                UNISIG SUBSET-137
              </LibLink>
              , which names RSA and ECDH directly — the one rail document with a concrete migration
              target. The successor radio system, FRMCS (
              <LibLink id="ETSI-TS-103-764-Rail-Telecommunications-RT-FRMCS-System-Arch">
                ETSI TS 103 764
              </LibLink>{' '}
              and the TS 103 765 series), names no mechanism and delegates crypto to 3GPP. US
              Positive Train Control (
              <LibLink id="49-CFR-Part-236-Subpart-I-Positive-Train-Control-Systems">
                49 CFR Part 236 Subpart I
              </LibLink>
              ) is a safety-performance rule and names no algorithm either.
            </p>
          </Card>
          <Card title="Manufacturing and process">
            <p>
              PLCs and DCS controllers talking OPC UA, EtherNet/IP with CIP Security, and PROFINET;
              safety PLCs under IEC 61511. The signing roots are vendor firmware keys and the
              engineering tools that sign projects — and in process plants the SIS is in scope of
              the IEC 61511 security risk assessment.
            </p>
          </Card>
          <Card title="Building automation">
            <p>
              BACnet/SC brings TLS 1.3 and X.509 to HVAC, lighting and access control (
              <LibLink id="ASHRAE-BACnet-SC-Whitepaper-2019">ASHRAE BACnet/SC white paper</LibLink>
              ). Because it already uses TLS 1.3, adding a hybrid ML-KEM group is a stack update;
              its elliptic-curve certificates are the forgery exposure. Most installed BACnet/IP and
              MS/TP has no security at all.
            </p>
          </Card>
        </div>
      </LearnSection>

      {/* 8 ─ Retrofit ────────────────────────────────────────────────────── */}
      <LearnSection
        sectionId="retrofit"
        title="Brownfield Retrofit Strategy"
        icon={<Wrench size={24} className="text-primary" />}
      >
        <div className="space-y-3 text-sm text-foreground/80">
          <p>Four options, from least to most disruptive:</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>
              <strong>Firmware update</strong> — where the device has the CPU, memory and vendor
              support for PQC (and its bootloader can accept a new signature scheme).
            </li>
            <li>
              <strong>VPN overlay</strong> — hybrid ML-KEM tunnels between sites or zones protect
              traffic the devices themselves cannot.
            </li>
            <li>
              <strong>Bump-in-the-wire / inline appliance</strong> — a security appliance in front
              of a legacy device or serial link adds authentication and encryption without touching
              the device.
            </li>
            <li>
              <strong>Replacement</strong> — at end of life, buy devices whose firmware signing and
              certificates are PQC-ready, and write it into the procurement contract.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Overlays and appliances protect the wire, not the device&rsquo;s own firmware trust: a
            controller that still verifies firmware with an RSA key needs option 1 or 4 eventually.
          </p>
        </div>
      </LearnSection>

      {/* 9 ─ Regulations ─────────────────────────────────────────────────── */}
      <LearnSection
        sectionId="regulations"
        title="Key Regulations"
        icon={<Scale size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <strong>
                <LibLink id="IEC 62443">IEC 62443</LibLink>
              </strong>{' '}
              — the cross-sector OT security series; crypto requirements (SR/CR 4.3) do not mention
              PQC yet.
            </li>
            <li>
              <strong>
                <LibLink id="NIST SP 800-82 Rev. 3">NIST SP 800-82 Rev. 3</LibLink>
              </strong>{' '}
              — the US OT security guide. It does not mention quantum computing at all; see{' '}
              <LibLink id="US-CISA-PQC-OT-2024">CISA&rsquo;s PQC considerations for OT</LibLink> for
              the quantum angle.
            </li>
            <li>
              <strong>
                <LibLink id="NIS2-DIRECTIVE-2022-2555">NIS2</LibLink>
              </strong>{' '}
              Article 21(2)(h) requires policies on cryptography and, where appropriate, encryption.
              The <LibLink id="EU-NIS-CG-Roadmap-v1.1">EU coordinated PQC roadmap</LibLink> asks
              Member States to start by end of 2026, finish high-risk use cases by end of 2030 and
              migrate as much as feasible by 2035.
            </li>
            <li>
              <strong>TSA SD Pipeline-2021-02G</strong> — mandatory measures for designated US
              pipelines, including encryption of data in transit; in force 3 May 2026 to 2 May 2027.
            </li>
          </ul>
          <h3 className="text-sm font-bold text-foreground">NERC CIP (North American grid)</h3>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 font-medium">Standard</th>
                  <th className="text-left p-2 font-medium">Scope</th>
                  <th className="text-left p-2 font-medium">PQC relevance</th>
                </tr>
              </thead>
              <tbody>
                {NERC_CIP_STANDARDS.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 align-top">
                    <td className="p-2 font-bold text-foreground whitespace-nowrap">
                      {s.id}
                      <div className="font-normal text-muted-foreground">{s.title}</div>
                    </td>
                    <td className="p-2 text-muted-foreground">{s.scope}</td>
                    <td className="p-2 text-muted-foreground">{s.pqcRelevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="text-sm font-bold text-foreground">CNSA 2.0 — per-category dates</h3>
          <p className="text-xs text-muted-foreground">
            For US National Security Systems and their suppliers. There is no universal
            &ldquo;hybrid by&rdquo; or &ldquo;PQC-only by&rdquo; date and no hybrid mandate — each
            category has its own. AES-256 is a CNSA 2.0 algorithm with no sunset.
          </p>
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
            tabIndex={0}
            role="region"
            aria-label="Scrollable table"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-center p-2 font-medium">Prefer CNSA 2.0 from</th>
                  <th className="text-center p-2 font-medium">Exclusive by</th>
                </tr>
              </thead>
              <tbody>
                {CNSA_2_0_CATEGORIES.map((c) => (
                  <tr key={c.category} className="border-b border-border/50">
                    <td className="p-2 text-foreground">{c.category}</td>
                    <td className="p-2 text-center">{c.prefer ?? '—'}</td>
                    <td className="p-2 text-center">{c.exclusive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LearnSection>

      {/* Workshop CTA */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Try it on your own plant</h3>
            <p className="text-sm text-muted-foreground">
              Six steps: tag protocol layers, rank zones by forgery and HNDL, plan a substation,
              score consequences, build a sector roadmap and size a firmware-signing scheme.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Open Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              to: '/learn/iot-pqc',
              icon: Cpu,
              title: 'IoT & Embedded Device PQC',
              sub: 'Constrained devices, smart-meter fleets and LPWAN',
            },
            {
              to: '/learn/stateful-signatures',
              icon: GitBranch,
              title: 'Stateful Signatures',
              sub: 'LMS and XMSS state management in depth',
            },
            {
              to: '/learn/secure-boot-pqc',
              icon: FileSignature,
              title: 'Secure Boot PQC',
              sub: 'Bootloader verification of PQC firmware signatures',
            },
            {
              to: '/learn/hsm-pqc',
              icon: Key,
              title: 'HSM & PQC',
              sub: 'Where OT signing keys and their state should live',
            },
            {
              to: '/learn/vpn-ssh-pqc',
              icon: DoorOpen,
              title: 'VPN & SSH PQC',
              sub: 'Hybrid key exchange for remote access and overlays',
            },
            {
              to: '/learn/migration-program',
              icon: Clock,
              title: 'Migration Program',
              sub: 'Multi-year programme governance for critical infrastructure',
            },
          ].map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
            >
              <r.icon size={18} className="text-primary shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-foreground">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="AppServers" />

      <ReadingCompleteButton />
    </div>
  )
}
