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

export const MediaDrmExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'aacs-revocation-trace',
      title: '1. Trace an AACS revocation: which keys change, and which signature carries it',
      description:
        'Open the Key Ladder Explorer on AACS. A set of Device Keys has been compromised. Walk rungs 1 to 6 and write down, for each rung, whether it changes when AACS LA releases an updated Media Key Block, and which primitive protects the new block.',
      badge: 'AACS',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Rungs 1 to 4 (Device Keys, Processing Keys, the Media Key, the revocation itself) are built from 128-bit keys and AES-based functions. Rung 5, the signature on the Media Key Block, uses ECDSA, and rung 6, the Bus Key exchange, uses an elliptic-curve exchange signed with ECDSA. The document says the block of a subset-difference system is of the same order in size as a public-key certificate revocation list.',
      config: { step: 0 },
    },
    {
      id: 'classify-ci-plus',
      title: '2. Classify the CI Plus rungs against the NIST tables',
      description:
        'Open the Key Ladder Explorer on CI Plus. For each rung decide whether it is a public-key primitive of a kind NIST IR 8547 lists, and in which table. Then find the hash used for the certificate signatures.',
      badge: 'CI Plus',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'The authentication signatures (RSASSA-PSS) fall under Table 2 and the Diffie-Hellman negotiation under Table 4. DES-56, AES-128 and the hash functions are not signature or key-establishment schemes. The certificate signatures use SHA-1 (Table 9.1 and Annex I of the specification); SHA-256 is used for derived values such as the UCK. The lesson draws no conclusion about the strength of DES-56 or AES-128.',
      config: { step: 0 },
    },
    {
      id: 'same-sentence-different-claim',
      title: '3. Two sentences that sound alike: what can each edition support?',
      description:
        'Open Spec vs Quantum and read the four editions. For each, write down whether its text mentions quantum computing. Then try to write a sentence about what the organisation behind that edition plans to do about quantum computers, and say what in the edition would support it.',
      badge: 'Reading',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'The text of each edition does not mention quantum computing. That supports the sentence “this edition does not mention quantum computing”. Nothing in it supports a sentence about what anyone plans, and nothing in it describes other editions or generations of the same scheme.',
      config: { step: 1 },
    },
    {
      id: 'provenance-assumptions',
      title: '4. A provenance claim that must be checked years later: state your assumptions',
      description:
        'Open the Provenance Algorithm Check. Pick an allowed signature algorithm. Then write down your own assumptions: how long the signer’s certificate is valid, whether a time-stamp is attached, and which of the trust list, the time-stamp authority trust list and the revocation data you would still need to hold. Compare what you assumed with what the specification names.',
      badge: 'C2PA',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'The specification makes the time-stamp optional, names a signer Trust List and a separate time-stamp authority Trust List, and has validation check the signer credential’s revocation information. It states no certificate validity period, and this exercise supplies none: any lifetime you assume is yours. For long-term signatures and revocation evidence, see Trust Services & Long-Term Signatures.',
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
          Work through these scenarios to read content-protection and provenance specifications
          precisely: what each one specifies, what its text says about quantum computing, and what a
          sentence about it can and cannot support. Each exercise opens the matching Workshop step
          &mdash; click &quot;Load &amp; Run&quot; to begin.
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
                Take the PQC quiz to test what you&apos;ve learned about content protection,
                broadcast conditional access and content provenance.
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
