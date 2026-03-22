// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface EnergyUtilitiesExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: WorkshopConfig
}

export const EnergyUtilitiesExercises: React.FC<EnergyUtilitiesExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'dnp3-sa-analysis',
      title: '1. Analyze DNP3-SA key distribution vulnerability',
      description:
        'In the Protocol Security Analyzer, select DNP3-SA. Identify the quantum-vulnerable layer (Update Key distribution via RSA). Calculate how many bytes an ML-KEM-768 key exchange adds to a DNP3 fragment and whether it fits within the 2048-byte maximum.',
      badge: 'Protocols',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'DNP3-SA session authentication uses HMAC-SHA256 (quantum-safe). Only the Update Key distribution layer is vulnerable (RSA-2048 key transport). ML-KEM-768 ciphertext is 1088 bytes, well within DNP3\u2019s 2048-byte fragment limit. No fragmentation needed \u2014 a clean single-fragment migration.',
      config: { step: 0 },
    },
    {
      id: 'substation-cip012',
      title: '2. Plan PQC migration for a High-Impact transmission substation',
      description:
        'In the Substation Planner, configure a Transmission substation with 80 IEDs, Fiber WAN, Full IEC 62351, and High BES Impact. Review the generated zone migration plan. Which zone has the highest priority and why? Which NERC CIP standards does it address?',
      badge: 'Substation',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'The WAN/ICCP zone has the highest migration priority: it is internet-facing and High BES Impact, and CIP-012 mandates encrypted inter-control-center communications. Station Bus (MMS/TLS) uses asymmetric auth and requires migration. Process Bus (GOOSE HMAC) uses symmetric authentication, which is already quantum-safe, so its migration priority is lower.',
      config: { step: 1 },
    },
    {
      id: 'meter-rotation',
      title: '3. Calculate PQC key rotation time for 5 million meters on PLC',
      description:
        'In the Smart Meter Key Manager, set fleet size to 5M, communication to PLC (100 kbps), Security Suite 1, Annual rotation, and ML-KEM-768. Compare the rotation duration against ECDH P-256. Then switch to NB-IoT and observe the duration change.',
      badge: 'Metering',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'PLC at 100 kbps: ECDH rotation takes a few hours for 5M meters. ML-KEM-768 rotation takes several days \u2014 a significant increase due to 1088-byte ciphertexts vs 33-byte ECDH shares. On NB-IoT (62.5 kbps), the duration increases further. Staggered zone rotation mitigates this by spreading the load across geographic zones.',
      config: { step: 2 },
    },
    {
      id: 'blackout-scenario',
      title: '4. Score the safety risk of a transmission SCADA quantum attack',
      description:
        'In the Safety Risk Scorer, select the "Transmission SCADA" scenario. Review the consequence chain from ICCP decryption through to wide-area blackout. Adjust population exposure to 10 million. Compare the compound risk score to a "Smart Metering" scenario.',
      badge: 'Safety',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'Transmission SCADA with 10M population exposure scores critical risk \u2014 the catastrophic physical consequence and Tier 1 asset criticality dominate the formula. Smart Metering scores medium risk \u2014 the consequence is billing fraud and localized outage, not cascading blackout. This stark difference drives migration priority ordering.',
      config: { step: 3 },
    },
    {
      id: 'utility-roadmap',
      title: '5. Build a 5-year PQC migration roadmap for a large IOU',
      description:
        'In the Grid Migration Roadmap, configure: IOU, Large territory (5M customers), Normal budget, Moderate CRQC (2033), NERC jurisdiction. Set 50 substations and 5M meters. Review the 6-phase Gantt chart. Which phase is most expensive and why?',
      badge: 'Roadmap',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'Phase 4 (Field Devices & Metering) is the most expensive because it involves millions of smart meter key rotations, DER certificate reissuance, and DNP3-SA key transport upgrades across hundreds of field locations. Phase 1 (Internet-Facing Perimeter) is the highest priority but lowest cost \u2014 mostly software/configuration changes.',
      config: { step: 4 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to understand energy-sector PQC challenges: protocol
          vulnerabilities, substation migration planning, smart meter key rotation at scale, safety
          risk scoring, and utility-wide roadmap generation. Each exercise pre-configures the
          Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about energy &amp; utilities PQC
                migration, NERC CIP compliance, and grid-scale cryptographic challenges.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
