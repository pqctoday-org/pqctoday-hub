// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
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
        'At 220 bytes per block, the analyzer gives signature-byte lower bounds of 16 blocks for ML-DSA-65, 11 for ML-DSA-44 and 12 for LMS (H10/W4). These counts exclude message content and framing; they do not establish a 16x increase in channel occupancy. ML-DSA-44 is smaller than LMS in this comparison, but size alone does not establish operational suitability. Evaluate full-message fragmentation, transport overhead and verification requirements with production tools.',
      config: { step: 0 },
    },
    {
      id: 'geo-satellite-link-budget',
      title:
        '2. GEO Satellite PQC Link Budget — Calculate handshake overhead for geostationary orbit',
      description:
        'Configure the illustrative GEO model with Ka-band and a 10 Mbps data rate. Compare its classical and ML-KEM byte estimates and its 600 ms RTT assumption. Select Solar Minimum, then Solar Maximum, and compare the modelled refresh upper bound and handshake count.',
      badge: 'Satellite',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Both classical and PQC exchanges use the same three-round assumption: 3 x 600 ms gives a 1.8-second modelled propagation term. This term does not include transmission or processing time. Solar maximum multiplies the assumed SEU rate by 10; inspect the current refresh upper bound and handshakes per day rather than substituting fixed 4-8-hour intervals. These are model assumptions, not a measured TLS handshake or an operational key-rotation prescription.',
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
        'For a DAL-A FMS the retrofit path comes out longer and costlier than clean-sheet, because PQC changes already-certified software instead of being designed in, and new decision logic must reach MC/DC structural coverage. The months, costs and MC/DC percentage are this tool\u2019s planning assumptions, not published DO-178C benchmarks: compare the paths, not the absolute figures.',
      config: { step: 2 },
    },
    {
      id: 'mixed-fleet-gateway-strategy',
      title:
        '4. Mixed-Fleet Gateway Strategy — Plan PQC interoperability across 3 aircraft generations',
      description:
        'Select the three sample models B737-800, A320neo and A350. Set PQC deployment to 30% of the capable fleet. Inspect the model’s authored aircraft counts and planning classifications; these inputs do not establish the capabilities of real aircraft. Compare the aircraft deployment share with the gateway planning cases.',
      badge: 'Fleet',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'The sample contains 8,600 aircraft: 4,500 in its gateway-only planning case and 4,100 in its native/retrofit planning cases. At 30% deployment within the capable group, 1,230 aircraft are counted as deployed: 14% of the total, with 86% other sample aircraft. These are aircraft counts, not percentages of messages or protected links. Evaluate actual endpoint capabilities, routes and observed negotiations with production tools before estimating traffic protection; a ground gateway does not protect an unchanged aircraft-to-ground hop.',
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
        'Select GEO Satellite, launch year 2028 and a 15-year service life. Set the assumed CRQC year to 2035. Inspect the model’s algorithm-selection, integration, provisioning and operational phases. These are explicit sample planning inputs, not a forecast.',
      badge: 'Capstone',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'With these inputs, the model ends service in 2043 and shows 8 years of operational overlap with the assumed 2035 CRQC year. Its authored schedule places algorithm selection in 2025-2026 and library integration in 2026-2027. Changing the launch year shifts those windows. Use the sample to evaluate algorithm support, update and provisioning capabilities, retained-data confidentiality and signature/trust lifetimes with your production tools; these windows are not universal deadlines or proof that a deployed mission is protected.',
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
