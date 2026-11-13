// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  PHARMA_EXERCISE_COMPOUND,
  PHARMA_EXERCISE_CRQC_YEAR,
  PHARMA_SAMPLE_SCENARIO,
  computePharmaExerciseFigures,
} from '../data/pharmaIpModel'

const money = (millions: number): string => `$${millions.toLocaleString()}M`

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

export const HealthcarePQCExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()
  const figures = computePharmaExerciseFigures()

  const scenarios: Scenario[] = [
    {
      id: 'biometric-permanence-assessment',
      title: '1. Biometric Permanence Assessment — Compare HNDL exposure across biometric types',
      description:
        'Select DNA SNP Profile in the Biometric Vault Assessor. Compare its HNDL exposure against a fingerprint template. Note the template size difference and the implications for multi-generational privacy.',
      badge: 'Biometric',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'DNA SNP profiles are 5 MB vs 512 bytes for fingerprints, but neither can be reissued; whether exposure enables impersonation depends on template protection, presentation attack detection and a second factor. DNA data additionally affects biological relatives, making it the highest-priority biometric type for PQC migration.',
      config: { step: 0 },
    },
    {
      id: 'pharma-pipeline-financial-exposure',
      title: '2. Pharma Key-Protection Paths — Compare the value tied to the vulnerable path',
      description: `In the Pharma IP Calculator, open the first fictional compound: a ${money(PHARMA_EXERCISE_COMPOUND.commercialValueM)} record with ${PHARMA_EXERCISE_COMPOUND.confidentialityYearsRemaining} years of confidentiality from a ${PHARMA_SAMPLE_SCENARIO.baseYear} base year, whose AES-256-GCM record key is wrapped with RSA-2048. Set the CRQC year to ${PHARMA_EXERCISE_CRQC_YEAR}. Then switch its key protection to a pre-shared AES-256 key and to X25519 + ML-KEM-768, and edit the length of one omittable step.`,
      badge: 'Pharma IP',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe: `This is a fictional sample, not a forecast. With RSA-2048 wrapping the record key and the CRQC year set to ${PHARMA_EXERCISE_CRQC_YEAR}, the record stays confidential until ${figures.rsa.confidentialityEndYear}, so the sample ties ${money(figures.rsa.valueOnVulnerablePathM ?? 0)} of its ${money(figures.rsa.totalValueM)} total value to the vulnerable path. With a pre-shared AES-256 key or X25519 + ML-KEM-768 the total stays ${money(figures.preshared.totalValueM)} but the part tied to the vulnerable path is ${money(figures.preshared.valueOnVulnerablePathM ?? 0)}, because a recorded RSA exchange decrypted later does not expose either one (how the pre-shared key is distributed is not assessed). The sample assigns no probability and predicts no loss. The development steps total ${figures.rsa.developmentYearsTotal} years and the sample treats ${figures.rsa.rdYearsSaved} of them as omittable, so the time saved is ${figures.rsa.rdYearsSaved} years. That is the sum of the steps you can see and edit, not a claim that a stolen record replaces independent trials. Patent dates are shown separately and do not set the confidentiality period.`,
      config: { step: 1 },
    },
    {
      id: 'pediatric-privacy-timeline',
      title: '3. Pediatric Privacy Timeline — Map HNDL windows for pediatric and genomic data',
      description:
        'In the Patient Privacy Mapper, select Pediatric EHR and Genomic data. Set CRQC to 2035. Compare the HNDL window for each category.',
      badge: 'Privacy',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'This fictional scenario uses 25 years for pediatric records and a century-long confidentiality assumption for genomic data. These are sample planning inputs, not universal requirements. Compare those assumptions with migration time and the scenario’s quantum-threat horizon.',
      config: { step: 2 },
    },
    {
      id: 'pacemaker-attack-simulation',
      title:
        '4. Pacemaker Attack Simulation — Evaluate PQC feasibility on constrained medical devices',
      description:
        'Select the Cardiac Pacemaker in the Device Safety Simulator. Review the Command Injection attack scenario. Check which PQC algorithms are feasible on Cortex-M0+.',
      badge: 'Device Safety',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        "In this exercise's model, ML-DSA-44 needs more RAM than the 32 KB available, while LMS (H5/W8) and XMSS (H10) verification is assumed to fit, so they are feasible for firmware signing. The RAM figures are this module's planning assumptions, not measurements.",
      config: { step: 3 },
    },
    {
      id: 'hospital-migration-budget',
      title: '5. Hospital Migration Budget — Plan PQC deployment across 7 infrastructure layers',
      description:
        'In the Hospital Migration Planner, set Patient Portal and Research/Genomics to "Full PQC" and all other layers to "Hybrid". Calculate the total budget.',
      badge: 'Migration',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'Patient Portal and Research/Genomics are internet-facing and highest priority. Medical Devices layer has 2000 endpoints at $500 each (this module\'s planning assumption, not a measurement) but vendor readiness is "none" \u2014 This module\'s advice: hybrid mode is more realistic until vendors ship PQC firmware.',
      config: { step: 4 },
    },
    {
      id: 'end-to-end-healthcare-assessment',
      title:
        '6. End-to-End Healthcare Assessment — Full hospital PQC posture with compliance alignment',
      description:
        'Configure all 7 hospital layers with realistic PQC postures. Compare the auto-calculated priority matrix against the compliance milestone timeline.',
      badge: 'Capstone',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        "The priority matrix ranks Medical Devices and Research/Genomics highest due to critical data sensitivity and HNDL exposure. On the regulatory side, the FDA's premarket cybersecurity guidance is already final (first issued September 2023, current edition February 2026), while the HIPAA Security Rule in force names no encryption algorithm and sets no post-quantum date, and HHS lists OCR's proposed rewrite of it separately from the rule in effect (HHS page last reviewed 7 August 2026) \u2014 so plan migration phases against your own risk, and treat any specific HIPAA year you see quoted as a guess.",
      config: { step: 4 },
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
          Work through these scenarios to explore biometric threat assessment, pharmaceutical IP
          exposure, patient privacy mapping, medical device safety, and hospital migration planning.
          Each exercise pre-configures the Workshop &mdash; click &quot;Load &amp; Run&quot; to
          begin.
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
                Take the PQC quiz to test what you&apos;ve learned about healthcare PQC challenges
                and migration strategies.
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
