// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { claimText } from '../data/sourceClaims'
import { rawRows, rawSum } from '../data/transitionData'

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

const SECOND_BLOCK_SUM = rawSum(rawRows('second-block', 'ML-DSA-65'))

export const SoftwareSupplyChainExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'root-threshold',
      title: '1. Two of three root keys: what does the specification say to do?',
      description:
        'Open Roles and Thresholds on the TUF roles. The root role starts with 3 keys and a threshold of 2. Set the attacker to hold 1 root key, then 2. Read which sentences appear when the attacker can sign for the role alone.',
      badge: 'TUF',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'With 1 of 3 keys the count is below the threshold of 2; with 2 of 3 it reaches it. At the threshold the step shows the sentences about the root role, including: ' +
        claimText('SC-3.9'),
      config: { step: 0 },
    },
    {
      id: 'uptane-both',
      title: '2. Uptane: one repository, then both',
      description:
        'Open Roles and Thresholds, switch to the Uptane repositories, and set the attacker to control the Director repository with full verification on. Then change it to both repositories, and then turn full verification off.',
      badge: 'Uptane',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'With one repository the step is inside the attacker the standard assumes. With both it is outside, and the step says so. Without full verification the comparison between the two repositories is not made on that ECU: ' +
        claimText('SC-3.10'),
      config: { step: 0 },
    },
    {
      id: 'which-documents',
      title: '3. Which documents specify SLH-DSA, and in what form?',
      description:
        'Open the Provenance Chain Check. At the signature stage choose SLH-DSA and read, ecosystem by ecosystem, which documents the lesson holds a sentence for. Then choose HSS/LMS and compare.',
      badge: 'Reading',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'For SLH-DSA the COSE document is a draft and the CMS and X.509 documents are RFCs. For both algorithms the CA/Browser Forum code signing requirements v3.11 and UEFI Release 2.11 appear as silent in the held editions. An ecosystem with no sentence in the lesson is a gap in the lesson, not a finding about the ecosystem.',
      config: { step: 1 },
    },
    {
      id: 'rom-transition',
      title: '4. Plan a change for a verifier that cannot be updated',
      description:
        'Open the Transition Planner. Choose the unchangeable (ROM) verifier, the second authentication block and ML-DSA-65. Read the sentences, then switch the verifier to updatable and the option to replace the algorithm.',
      badge: 'Planning',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'For the second authentication block with ML-DSA-65 the raw rows add up to ' +
        `${SECOND_BLOCK_SUM.publicKeyBytes.toLocaleString('en-US')} bytes of public keys and ` +
        `${SECOND_BLOCK_SUM.signatureBytes.toLocaleString('en-US')} bytes of signatures (raw sizes from the registry, nothing else counted). The sentence for the unchangeable verifier reads: ` +
        claimText('SC-5.1'),
      config: { step: 2 },
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
          Work through these scenarios to read the signature links of a software supply chain from
          their documents: roles and thresholds, which documents specify an algorithm, and what a
          change involves when a verifier has already shipped. Each exercise opens the matching
          Workshop step &mdash; click &quot;Load &amp; Run&quot; to begin.
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

      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about signature links in the
                software supply chain.
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
