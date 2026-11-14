// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useNavigate } from 'react-router'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface AISecurityExercisesProps {
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

const SCENARIOS: Scenario[] = [
  {
    id: 'pipeline-audit',
    title: '1. Training Data HNDL Assessment',
    description:
      'In the Data Protection Analyzer, select "LLM Pre-Training" pipeline. Walk through all stages and identify which cryptographic operations have HNDL exposure. Count the quantum-vulnerable touchpoints for a financial services company with 10+ years of customer transaction data.',
    badge: 'Pipeline',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      '3 of the 7 stages are HNDL-exposed: the two encryption stages and the key-wrapping stage, because encrypted data can be harvested now and decrypted once quantum technology matures (NIST IR 8547). The two signing stages are quantum-vulnerable but not HNDL-exposed: IR 8547 says the authentication algorithm "may be transitioned at a different time". Which stage has the highest migration priority? Toggle to PQC view to verify all stages turn green.',
    config: { step: 0 },
  },
  {
    id: 'synthetic-defense',
    title: '2. Synthetic Data Contamination Defense',
    description:
      'In the Data Authenticity Verifier, evaluate the eight fictional observations. In the synthetic-content question, load balanced observations and count true positives, false negatives, false positives and true negatives. Then load imbalanced observations and compare accuracy with recall. Switch to near-duplicate and selected-watermark questions to inspect their distinct reference labels.',
    badge: 'Authenticity',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    observe:
      'The balanced example has 3 true positives, 1 missed positive, 1 false positive and 3 true negatives: accuracy, precision and recall are each 75%. The imbalanced example gets 7 of 8 right (87.5% accuracy) but misses its only positive (0% recall); precision is undefined because there are no predicted positives. Edit a result or leave a label unanswered and inspect the recalculated counts. Similarity and watermark presence do not establish synthetic origin. Selecting verification layers or a signing algorithm does not create evaluation evidence.',
    config: { step: 1 },
  },
  {
    id: 'model-protection',
    title: '3. Securing a 70B Parameter Model',
    description:
      'In the Model Weight Vault, select 70B parameters. Configure ML-KEM-768 key wrapping and ML-DSA-65 signing with Cloud TEE deployment. Compare the overhead against RSA-2048 + ECDSA P-256 classical baseline.',
    badge: 'Model',
    badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
    observe:
      'The model wraps an independent 32-byte symmetric DEK: 1,088 bytes of ML-KEM-768 ciphertext plus 40 bytes of AES-KW wrapped DEK = 1,128 bytes of data fields (not a complete envelope; a complete HKE1 project sample envelope for ML-KEM-768 is 1,191 bytes). The ML-DSA-65 signature is 3,309 bytes against 64 bytes for the sample raw ECDSA P-256 signature. Compare these per-key and per-signature bytes with the 140 GB model file, then consider how many keys, models and operations your system needs. The time cells are authored scenario inputs, not a benchmark.',
    config: { step: 2 },
  },
  {
    id: 'trading-delegation',
    title: '4. Trading Bot Delegation Chain',
    description:
      'In the Agent Auth Designer, select "Human-Delegated" agent type and "Trading Bot with Market Data" chain. Examine the 3-hop delegation chain. Calculate the total PQC chain size vs classical.',
    badge: 'Identity',
    badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
    observe:
      'The PQC chain is ~3-4x larger than classical. All 3 links are quantum-vulnerable. Identify which link has the longest credential lifetime and thus the longest window for forgery.',
    config: { step: 3 },
  },
  {
    id: 'commerce-simulation',
    title: '5. PQC Agentic Commerce',
    description:
      'In the Agentic Commerce Simulator, select "Multi-Agent Negotiation". Enable the quantum overlay. Step through all 6 steps and count how many use quantum-vulnerable signing.',
    badge: 'Commerce',
    badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
    observe:
      'All 6 steps are quantum-vulnerable. The authored sequential inputs total 220 ms classical and 244 ms PQC: (244 − 220) ÷ 220 × 100 = 10.9%, in the Moderate teaching band (5% to below 15%). These are not measured latencies or a decision that the flow meets your budget. Inspect which steps contribute the extra 24 ms, then compare measurements from your own tools with your service latency budget.',
    config: { step: 4 },
  },
  {
    id: 'a2a-protocol',
    title: '6. Agent-to-Agent PQC Protocol',
    description:
      'In the Protocol designer, configure TLS 1.3 + mTLS ML-DSA + ML-KEM-768 + Signed JSON. Compare bandwidth overhead at 1,000 messages/second against classical ECDSA + ECDH.',
    badge: 'Protocol',
    badgeColor: 'bg-accent/20 text-accent border-accent/50',
    observe:
      'With ML-DSA-44 and Signed JSON, the sample adds a 2,420-byte signature and 200 authored format bytes = 2,620 bytes per message. At 1,000 messages/second, that is 2,620,000 bytes/second before transport overhead. ML-KEM-768 is category 3; ML-DSA-44 is category 2. Neither establishes an overall protocol category or tested interoperability. Change the signing, format and transport selections and compare their separate properties.',
    config: { step: 5 },
  },
  {
    id: 'scale-migration',
    title: '7. Enterprise AI Scale Migration',
    description:
      'In the Scale Encryption Planner, load the Enterprise preset (100 TB, 10M requests/day, 3 regions), then explicitly enter 12 models, 50 agents and 7-year retention to complete this fictional case. Review the key counts, KMS operations, authored schedule and illustrative retention bands. Which values are calculated from workload, and which remain fixed assumptions?',
    badge: 'Scale',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    observe:
      '100,000 GB plus 12 × 10 model shards gives 100,120 DEKs; 3 + 3 × 12 gives 39 KEKs. Daily operations = 10,000,000 inference unwraps + 50 × 10 agent operations + ceil(100,120 × 1%) rotations = 10,001,502. Retention from the exercise base year 2026 to 2033 is Medium under its illustrative bands; these dates are not a CRQC forecast. The fixed sequential phase assumptions total 3 + 6 + 6 + 12 = 27 months. Changing workload does not compute a new schedule or establish which phase has the best production return.',
    config: { step: 6 },
  },
]

export const AISecurityExercises: React.FC<AISecurityExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these 7 scenarios to practice securing AI systems with post-quantum
          cryptography. Each exercise links directly to the relevant workshop tool.
        </p>
      </div>

      <div className="space-y-4">
        {SCENARIOS.map((scenario) => (
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
              <Button
                variant="gradient"
                onClick={() => handleLoadAndRun(scenario)}
                className="flex items-center gap-1.5 px-4 py-2 font-bold rounded-lg transition-colors text-sm shrink-0"
              >
                <Play size={14} />
                Load
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz CTA */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the AI Security & PQC quiz to verify your understanding.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
