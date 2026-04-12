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

export const HealthcarePQCExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'biometric-permanence-assessment',
      title: '1. Biometric Permanence Assessment — Compare HNDL exposure across biometric types',
      description:
        'Select DNA SNP Profile in the Biometric Vault Assessor. Compare its HNDL exposure against a fingerprint template. Note the template size difference and the implications for multi-generational privacy.',
      badge: 'Biometric',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'DNA SNP profiles are 5 MB vs 512 bytes for fingerprints, but both are permanently compromised. DNA data additionally affects biological relatives, making it the highest-priority biometric type for PQC migration.',
      config: { step: 0 },
    },
    {
      id: 'pharma-pipeline-financial-exposure',
      title: '2. Pharma Pipeline Financial Exposure — Calculate HNDL risk for a discovery compound',
      description:
        'In the Pharma IP Calculator, add a Discovery-phase compound worth $800M encrypted with RSA-2048. Set CRQC year to 2033. Calculate the HNDL exposure.',
      badge: 'Pharma IP',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Discovery-phase compounds have 20 years to patent expiry. With CRQC at 2033, the entire commercial value is at risk. A competitor decrypting this data skips 15+ years of R&D.',
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
        'Pediatric records have 25-year true retention. Genomic data is effectively lifetime (100+ years). Both exceed the CRQC timeline, making them immediate HNDL targets.',
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
        'ML-DSA-44 requires ~90 KB RAM \u2014 exceeding the 32 KB available. LMS (H5/W8) and XMSS (H10) are feasible for firmware signing with only ~4\u20135 KB RAM for verification.',
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
        'Patient Portal and Research/Genomics are internet-facing and highest priority. Medical Devices layer has 2000 endpoints at $500 each but vendor readiness is "none" \u2014 hybrid mode is more realistic until vendors ship PQC firmware.',
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
        'The priority matrix ranks Medical Devices and Research/Genomics highest due to critical data sensitivity and HNDL exposure. The compliance timeline shows FDA guidance in 2026 and HIPAA modernization in 2027 \u2014 aligning migration phases with regulatory pressure.',
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
