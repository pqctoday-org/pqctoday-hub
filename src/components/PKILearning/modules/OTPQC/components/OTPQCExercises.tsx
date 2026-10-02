// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import type { SubstationProfile } from '../data/substationData'
import type { RoadmapInputs } from '../data/roadmapData'
import type { SigningPlanInputs } from '../data/signingLabData'
import {
  zoneRanking,
  substationExercise,
  EXERCISE_SUBSTATION,
  consequenceDefaults,
  gasWithPqcFirmware,
  roadmapDefault,
  roadmapLargeFleet,
  EXERCISE_ROADMAP,
  signingProjectLms,
} from '../data/learnFigures'

export interface WorkshopConfig {
  step: number
  protocols?: string[]
  substation?: Partial<SubstationProfile>
  scenario?: string
  roadmap?: Partial<RoadmapInputs>
  signing?: Partial<SigningPlanInputs>
}

interface OTPQCExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

export interface OTExerciseScenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: WorkshopConfig
}

const sub = (id: string) => substationExercise.find((z) => z.id === id)!
const zone = (id: string) => zoneRanking.find((z) => z.id === id)!

/**
 * Every "what to observe" number below is read from learnFigures.ts — the same
 * functions the workshop runs — so an exercise can never disagree with the
 * tool it opens (plan finding E23).
 */
export const OT_EXERCISES: OTExerciseScenario[] = [
  {
    id: 'dnp3-goose-symmetric',
    title: '1. Find where the quantum exposure really is in DNP3 and GOOSE',
    description:
      'In the Protocol Analyzer, open DNP3 Secure Authentication v5 and IEC 61850 GOOSE. Count the symmetric layers and find the single layer in each that a quantum computer could attack. Then run the KAT panel.',
    badge: 'Protocols',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'DNP3 SAv5 has three symmetric layers (HMAC challenge-response, AES key wrap of session keys, and the default symmetric update-key change). Only the optional asymmetric update-key change is exposed. GOOSE authenticates each frame with HMAC or GMAC; its exposure is the GDOI key-distribution channel (IEC 62351-9 / RFC 8052), not the frame. The KAT panel checks HMAC-SHA-256 against a NIST ACVP vector and AES-256 key wrap against RFC 3394.',
    config: { step: 0, protocols: ['dnp3-sav5', 'iec61850-goose'] },
  },
  {
    id: 'zones-forgery-vs-hndl',
    title: '2. Why Level 1 outranks the enterprise zone',
    description:
      'Open the Zone & Conduit Planner with its defaults. Compare the drivers of the top two zones with those of Basic control and the SIS. Then set Basic control to "ML-DSA / LMS".',
    badge: 'Zones',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    observe: `Remote & vendor access and the Industrial DMZ rank first at ${zone('remote-access').priority}, both driven by HNDL. Basic control and the SIS come next at ${zone('control').priority}, driven by forgery — above the Enterprise zone (${zone('enterprise').priority}). Switching Basic control to a PQC signature scheme drops its forgery score to 0: the signing root, not the traffic, was the exposure.`,
    config: { step: 1 },
  },
  {
    id: 'substation-transmission',
    title: '3. Prioritise a high-impact transmission substation',
    description:
      'The Substation Planner opens with a transmission substation: 80 IEDs, utility fibre, IEC 62351 Parts 3/4/6/8/9, High impact. Which zone is first, and where does the process bus land?',
    badge: 'Substation',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    observe: `WAN / control-centre links come first (${sub('wan-iccp').priority}), then the station bus (${sub('station-bus').priority}) and engineering access (${sub('engineering').priority}). The process bus scores only ${sub('process-bus').priority}: GOOSE and SV keep their symmetric MAC, so only the GDOI key channel needs work — even though it is the highest-complexity zone. The trip-message budget shows 3 ms (TT6).`,
    config: { step: 2, substation: EXERCISE_SUBSTATION },
  },
  {
    id: 'consequence-firmware',
    title: '4. What PQC firmware signing does to a pipeline score',
    description:
      'In the Safety & Consequence Scorer, open the gas pipeline compressor station. Note the score, then change Controller firmware to "LMS / ML-DSA signed". Compare with the hydro dam spillway.',
    badge: 'Safety',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    observe: `The pipeline starts at ${consequenceDefaults['gas-pipeline'].compound} (${consequenceDefaults['gas-pipeline'].riskLevel}): its DNP3 SAv5 commands are symmetric, so the exposure is firmware signing. With PQC firmware it falls to ${gasWithPqcFirmware.compound} (${gasWithPqcFirmware.riskLevel}). The spillway scores ${consequenceDefaults['hydro-spillway'].compound} (${consequenceDefaults['hydro-spillway'].riskLevel}) because no independent safety layer bounds the outcome.`,
    config: { step: 3, scenario: 'gas-pipeline' },
  },
  {
    id: 'roadmap-site-count',
    title: '5. When site count, not technology, sets the finish date',
    description:
      'Open the Sector Roadmap with its defaults (energy, medium programme, 50 sites, US, planning year 2033), then raise the number of sites to 400.',
    badge: 'Roadmap',
    badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
    observe: `With 50 sites the programme takes ${roadmapDefault.totalMonths} months and ends in ${roadmapDefault.finishYear}, with signing roots done by ${roadmapDefault.signingRootsFinish}. At 400 sites the site rollout alone runs ${roadmapLargeFleet.phases.find((p) => p.id === 'site-rollout')!.durationMonths} months and the programme ends in ${roadmapLargeFleet.finishYear} — ${roadmapLargeFleet.lateCount} phase lands after the 2033 planning year. Signing roots still finish in ${roadmapLargeFleet.signingRootsFinish}, which is why they are scheduled early.`,
    config: { step: 4, roadmap: EXERCISE_ROADMAP },
  },
  {
    id: 'signing-project-lms',
    title: '6. Why project signing should not use a small LMS tree',
    description:
      'In the Firmware & Project Signing Lab, choose LMS H10/W8, "PLC project / logic downloads", 5,000 signatures a year, 1 HSM, 15 years. Then switch the scheme to ML-DSA-87.',
    badge: 'Signing',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe: `An H10 tree holds 1,024 signatures, so at 5,000 a year the key is exhausted after ${signingProjectLms.yearsToExhaustion} years, and the lab warns that keeping a counter consistent across engineering workstations is hard. ML-DSA-87 is stateless — no counter, no exhaustion — at the cost of a 4,627-byte signature. Keep LMS for rare, central vendor firmware releases.`,
    config: {
      step: 5,
      signing: {
        scheme: 'lms-h10-w8',
        use: 'project',
        signaturesPerYear: 5000,
        statePartitions: 1,
        serviceYears: 15,
      },
    },
  },
]

export const OTPQCExercises: React.FC<OTPQCExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const handleLoadAndRun = (scenario: OTExerciseScenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Six scenarios, one per workshop step. Each pre-configures its step — click &quot;Load
          &amp; Run&quot; — and every number in &quot;What to observe&quot; is what that step
          computes.
        </p>
      </div>

      <div className="space-y-4">
        {OT_EXERCISES.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
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

      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz on OT protocols, IEC 62443, safety-critical timing and OT
                regulations.
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
