// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import {
  Play,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  ShieldAlert,
  Cpu,
  Clock,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EnergyUtilitiesWorkshopConfig {
  step: number
}

interface EnergyUtilitiesExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: EnergyUtilitiesWorkshopConfig) => void
}

interface GridRoleExercise {
  id: string
  role: string
  roleBadgeColor: string
  title: string
  scenario: string
  decisionPrompt: string
  workshopStep: number
  workshopLabel: string
  icon: React.ReactNode
  checklist: string[]
  evidenceToCollect: string
  limitationNote: string
}

const ROLE_EXERCISES: GridRoleExercise[] = [
  {
    id: 'architect-substation-split',
    role: 'Security Architect',
    roleBadgeColor: 'bg-primary/15 text-primary border-primary/40',
    title: '1. Separate Real-Time Substation Loops from PQC Key Distribution',
    scenario:
      'A transmission utility modernizing 40 IEC 61850 substations is asked by an auditor to replace all classical cryptography with ML-DSA-44 signatures, including on GOOSE protection-relay tripping messages.',
    decisionPrompt:
      'Why does placing 2,420-byte ML-DSA-44 signatures directly on GOOSE frames fail engineering constraints, and what architecture achieves quantum-safe protection without breaking the <4 ms trip budget?',
    workshopStep: 1,
    workshopLabel: 'Open Step 2: Substation MTU & Latency Lab',
    icon: <Cpu size={18} className="text-primary" />,
    checklist: [
      'Show that a 2,420-byte ML-DSA-44 signature exceeds a 1,500-byte Layer 2 Ethernet MTU and introduces unacceptable signing/verification jitter inside the <4 ms protection-relay loop.',
      'Retain symmetric HMAC-SHA-256 (32-byte MAC tag, 256-bit key) or AES-256-GCM on the real-time GOOSE/SV data plane.',
      'Migrate out-of-band group key distribution (IEC 62351-9 / GDOI RFC 8052) and MMS supervisory TLS sessions to hybrid ML-KEM-768 (RFC 10024).',
      'Distinguish the substation protection/firmware-update service from protected assets (field IED root-of-trust keys and relay settings).',
    ],
    evidenceToCollect:
      'Hardware-in-the-loop (HIL) GOOSE trip latency report (<4 ms pass), GDOI KDC cipher configuration, and IEC 62351-6 architecture decision record.',
    limitationNote:
      'Lab MTU calculations in this Hub illustrate byte and latency budgets; production relay deployments must be validated on vendor HIL testbeds before energizing.',
  },
  {
    id: 'ops-scada-wan-failover',
    role: 'IT Ops / OT Network Engineer',
    roleBadgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
    title: '2. Upgrade SCADA Control-Center & Failover WAN Gateways Without Blind Spots',
    scenario:
      'Primary fiber links between two regional SCADA control centers (ICCP/TASE.2 and DNP3-SA) are scheduled for hybrid TLS 1.3 and IKEv2 RFC 9370 upgrades, while narrowband microwave and cellular failover links remain on legacy IPsec routers.',
    decisionPrompt:
      'How should OT operations sequence primary and failover WAN gateway upgrades while preventing IP fragmentation drops and verifying both paths under NERC CIP-012?',
    workshopStep: 0,
    workshopLabel: 'Open Step 1: Grid Protocol Mapper',
    icon: <ShieldAlert size={18} className="text-status-warning" />,
    checklist: [
      'Map the SCADA telemetry/control service separately from protected assets (long-lived grid topology records and state-estimator models).',
      'Verify hybrid ML-KEM-768 negotiation (X25519MLKEM768 0x11EC for TLS 1.3; RFC 9370 additional KE payloads for IKEv2) on BOTH primary fiber and failover microwave/cellular gateways.',
      'Test IKEv2 fragmentation (RFC 7383) and TCP MSS clamping on 1,400-byte WAN links so 1,184-byte ML-KEM-768 public keys do not stall failover re-keying.',
      'Confirm DNP3-SA retains HMAC-SHA-256 per-message authentication while update-key distribution rides over PQC-protected tunnels.',
    ],
    evidenceToCollect:
      'Primary and failover gateway packet captures, negotiated IKEv2/TLS cipher telemetry, and CIP-010/CIP-012 change-control records.',
    limitationNote:
      'Protocol mapping here teaches boundary analysis; live failover testing must follow approved utility outage and change-management windows.',
  },
  {
    id: 'researcher-ami-lifecycle',
    role: 'OT Architect / Researcher',
    roleBadgeColor: 'bg-secondary/20 text-secondary-foreground border-secondary/40',
    title: '3. Plan a 20-Year AMI Smart-Meter Fleet Across Mosca Windows',
    scenario:
      'A distribution utility operates 1.2 million DLMS/COSEM smart meters deployed in 2023 over a 127-byte IEEE 802.15.4g RF-mesh with an 18-year asset lifespan and 10-year customer metering history retention.',
    decisionPrompt:
      'Why can the utility neither wait for full meter replacement nor push ML-DSA certificate chains over the RF-mesh today, and what two-track strategy closes the Mosca gap?',
    workshopStep: 2,
    workshopLabel: 'Open Step 3: Field Asset Lifecycle Planner',
    icon: <Clock size={18} className="text-primary" />,
    checklist: [
      'Calculate the Mosca horizon showing that 18-year meter lifespans and 7-year fleet replacement lead times extend past 2030/2035 transition targets.',
      'Separate the AMI head-end collection service from protected assets (10-year customer metering histories and fleet master keys).',
      'Apply interim compensating controls immediately: hybrid TLS 1.3 (X25519MLKEM768) on collector-to-head-end backhaul plus diversified 256-bit symmetric DLMS/COSEM session keys.',
      'Specify LMS-SHA256 (NIST SP 800-208) or ML-DSA-44 bootloader verification and ML-KEM-768 provisioning support in next-generation meter RFPs.',
    ],
    evidenceToCollect:
      'Fleet Mosca-window risk register, collector-to-HES TLS logs, DLMS/COSEM key-diversification audit, and RFP cryptographic requirements annex.',
    limitationNote:
      'Mosca calculators illustrate timing sensitivity using configurable assumptions; quantum threat arrival remains uncertain and requires periodic review.',
  },
  {
    id: 'grc-utility-evidence',
    role: 'GRC & Supply-Chain Risk',
    roleBadgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
    title: '4. Scope Utility Regulatory Duties & OEM Evidence Without Overclaiming',
    scenario:
      'An executive briefing draft claims "NERC CIP and NIS2 mandate full PQC migration by 2030," while two tier-1 relay OEMs left PQC bootloader and FIPS 140-3 questions unanswered.',
    decisionPrompt:
      'How must GRC correct the regulatory framing for the board and classify the unanswered OEM supply-chain items?',
    workshopStep: 3,
    workshopLabel: 'Open Step 4: Grid Evidence Checklist',
    icon: <ClipboardCheck size={18} className="text-status-success" />,
    checklist: [
      'Correct the regulatory claim: neither NERC CIP nor NIS2 sets a standalone PQC algorithm deadline — NERC CIP governs BES cyber controls (CIP-005/012/013) and NIS2 sets EU risk-management duties, while 2030/2035 targets come from the non-binding EU PQC Roadmap v1.1 and NIST IR 8547 (and EO 14412 / OMB M-26-15 for covered US federal civilian systems).',
      'Classify every unanswered OEM questionnaire item as Unverified / Evidence Gap — never as low exposure.',
      'Reject Historical FIPS 140-2 certificates (retired September 2026) and request active FIPS 140-3 CMVP certificate numbers under CIP-013 supply-chain reviews.',
      'Track dated vendor milestones for LMS-SHA256 / ML-DSA firmware signing and IEC 62351-9 PQC support.',
    ],
    evidenceToCollect:
      'Corrected board regulatory matrix, CIP-013 vendor evidence-gap register, active CMVP FIPS 140-3 IDs, and signed OEM roadmaps.',
    limitationNote:
      'Educational checklists clarify what evidence to request and how to frame compliance accurately; they do not constitute legal advice or formal NERC/NIS2 audit sign-off.',
  },
]

export const EnergyUtilitiesExercises: React.FC<EnergyUtilitiesExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const [openRubrics, setOpenRubrics] = useState<string[]>([])

  const toggleRubric = (id: string) => {
    setOpenRubrics((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleJump = (step: number) => {
    if (onSetWorkshopConfig) {
      onSetWorkshopConfig({ step })
    } else {
      onNavigateToWorkshop()
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-2">
        <h2 className="text-lg font-bold text-gradient">
          Utility Decision Exercises &amp; Production Evidence Rubrics
        </h2>
        <p className="text-sm text-muted-foreground">
          Each scenario pairs a realistic power-grid engineering or governance decision with a
          direct jump into the matching Workshop step and an expandable{' '}
          <strong>Decision &amp; Production Evidence Checklist</strong>.
        </p>
      </div>

      <div className="space-y-4">
        {ROLE_EXERCISES.map((ex) => {
          const isOpen = openRubrics.includes(ex.id)
          return (
            <article key={ex.id} className="glass-panel p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">{ex.icon}</div>
                  <div className="space-y-1 min-w-0">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${ex.roleBadgeColor}`}
                    >
                      {ex.role}
                    </span>
                    <h3 className="text-base font-bold text-foreground">{ex.title}</h3>
                  </div>
                </div>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => handleJump(ex.workshopStep)}
                  aria-label={ex.workshopLabel}
                >
                  <Play size={14} className="mr-1.5" />
                  {ex.workshopLabel}
                </Button>
              </div>

              <div className="space-y-2 text-sm text-foreground/85">
                <p>
                  <span className="font-semibold text-foreground">Scenario: </span>
                  {ex.scenario}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Decision Prompt: </span>
                  {ex.decisionPrompt}
                </p>
              </div>

              <div className="pt-1 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRubric(ex.id)}
                  aria-expanded={isOpen}
                  className="px-2 text-primary hover:text-primary"
                >
                  <CheckSquare size={15} className="mr-1.5" />
                  Decision &amp; Production Evidence Checklist
                  {isOpen ? (
                    <ChevronUp size={15} className="ml-1.5" />
                  ) : (
                    <ChevronDown size={15} className="ml-1.5" />
                  )}
                </Button>

                {isOpen && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-xs">
                    <ul className="space-y-1.5 list-disc pl-4 text-foreground/90">
                      {ex.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <p className="text-foreground">
                        <strong>Production Evidence to Collect:</strong>{' '}
                        <span className="text-muted-foreground">{ex.evidenceToCollect}</span>
                      </p>
                      <p className="text-muted-foreground italic">{ex.limitationNote}</p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
