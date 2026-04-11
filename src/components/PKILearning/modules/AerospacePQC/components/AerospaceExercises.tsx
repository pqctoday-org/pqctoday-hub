// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
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

export const AerospaceExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'acars-signature-overhead',
      title: '1. ACARS Signature Overhead — Evaluate PQC feasibility for air-ground messaging',
      description:
        'Select ACARS in the Avionics Protocol Impact Analyzer. Compare ML-DSA-65 and ML-DSA-44 signature sizes against the 220-byte ACARS block limit. Evaluate whether multi-block fragmentation is operationally acceptable.',
      badge: 'Protocol',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'ML-DSA-65 signatures (3,309 bytes) require 16 ACARS blocks per signed message, increasing VHF channel occupancy by 16x. ML-DSA-44 (2,420 bytes) requires 11 blocks. LMS (H10/W4) signatures (~1,840 B) require 9 blocks — still heavy but the most practical option.',
      config: { step: 0 },
    },
    {
      id: 'geo-satellite-link-budget',
      title:
        '2. GEO Satellite PQC Link Budget — Calculate handshake overhead for geostationary orbit',
      description:
        'Configure a GEO satellite with Ka-band, 10 Mbps data rate. Compare ML-KEM-768 hybrid handshake latency against classical X25519 at 600 ms RTT. Set solar activity to maximum and observe SEU impact on key material.',
      badge: 'Satellite',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'GEO RTT of 600 ms means a 3-round PQC handshake takes 1.8 seconds minimum. At solar maximum, SEU rate increases 10x, requiring key refresh every 4-8 hours instead of every 24 hours. This doubles the handshake overhead budget.',
      config: { step: 1 },
    },
    {
      id: 'fms-dal-a-recertification',
      title: '3. Flight Management System Recertification — Estimate DO-178C cost for PQC upgrade',
      description:
        'Select Flight Management System (FMS) at DAL-A in the Certification Impact Analyzer. Compare the clean-sheet vs retrofit certification timelines and costs.',
      badge: 'Certification',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'DAL-A FMS recertification for PQC takes 18-24 months and costs $5-10M for retrofit. Clean-sheet costs $2-4M because PQC is designed in from the start. MC/DC test case explosion adds ~40% to the structural coverage testing effort.',
      config: { step: 2 },
    },
    {
      id: 'mixed-fleet-gateway-strategy',
      title:
        '4. Mixed-Fleet Gateway Strategy — Plan PQC interoperability across 3 aircraft generations',
      description:
        'Build a fleet with a legacy B737-800 (ARINC 429), current A320neo (mixed 429/664), and next-gen A350 (ARINC 664 native). Evaluate the interoperability matrix and determine gateway placement.',
      badge: 'Fleet',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'The B737-800 can only communicate via legacy ACARS (no PQC possible). The A320neo supports gateway-mediated PQC for AFDX-connected systems. Only the A350 can run native PQC. At 30% fleet PQC penetration, 70% of air-ground messages still traverse unprotected links.',
      config: { step: 3 },
    },
    {
      id: 'military-uav-export',
      title: '5. Military UAV Export Classification — Navigate ITAR/EAR for a PQC-equipped UAV',
      description:
        'Select UAV Flight Controller and classify it for export to (a) an AUKUS partner (Australia), (b) a NATO ally (Germany), and (c) a non-aligned nation (India). Compare license requirements and sovereign mandates.',
      badge: 'Export',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/30',
      observe:
        'AUKUS export is streamlined under bilateral agreement with no individual license. NATO ally requires a DSP-5 license under ITAR Category VIII. Non-aligned nation faces case-by-case review. Germany additionally mandates BSI evaluation of any imported PQC system for Bundeswehr use.',
      config: { step: 4 },
    },
    {
      id: 'full-mission-lifecycle',
      title:
        '6. End-to-End Mission Lifecycle — Build a 15-year PQC migration plan for a GEO satellite',
      description:
        'Configure a GEO communications satellite with 15-year service life. Set CRQC estimate to 2035. Generate a complete crypto lifecycle plan from design through decommission.',
      badge: 'Capstone',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'A GEO satellite launched in 2028 will operate until 2043 — 8 years past the 2035 CRQC estimate. All crypto must be PQC from launch day. Key provisioning occurs pre-launch only. The lifecycle plan shows crypto algorithm selection must happen in 2026-2027 (design phase) to meet the 2028 launch window.',
      config: { step: 5 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to explore avionics protocol constraints, satellite link
          budgets, certification costs, fleet interoperability, export controls, and mission
          lifecycle planning. Each exercise pre-configures the Workshop &mdash; click &quot;Load
          &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
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
                Take the PQC quiz to test what you&apos;ve learned about aerospace and space PQC
                challenges and migration strategies.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
