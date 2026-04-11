// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useNavigate } from 'react-router-dom'
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
      'How many stages are HNDL-exposed? Which has the highest migration priority? Toggle to PQC view to verify all stages turn green.',
    config: { step: 0 },
  },
  {
    id: 'synthetic-defense',
    title: '2. Synthetic Data Contamination Defense',
    description:
      'In the Data Authenticity Verifier, select "Web-Scraped Dataset". Enable all recommended verification layers. Compare the model collapse curves — how many generations before quality drops below 60 without verification vs with provenance verification?',
    badge: 'Authenticity',
    badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
    observe:
      'With provenance verification, quality stays above 84 at generation 5. Without, it hits 18. Compare ML-DSA-65 vs ECDSA P-256 signing overhead for data manifests.',
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
      'ML-KEM-768 is actually faster than RSA-2048 for key wrapping. Signature size increases ~50x but the model file is 140 GB — the signature overhead is negligible.',
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
      'The PQC chain is ~3-4x larger than classical. All 3 links are quantum-vulnerable. Identify which link has the longest credential lifetime and thus the highest HNDL risk.',
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
      'All 6 steps are quantum-vulnerable. The total PQC latency overhead is under 10% — well within acceptable limits for non-real-time commerce.',
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
      'Per-message overhead increases significantly due to ML-DSA signature size. At 10K msg/s, this may require bandwidth planning. NIST Level 3 security is achieved.',
    config: { step: 5 },
  },
  {
    id: 'scale-migration',
    title: '7. Enterprise AI Scale Migration',
    description:
      'In the Scale Encryption Planner, use the Enterprise preset (100 TB, 10M req/day, 3 regions). Review the phased migration roadmap and HNDL risk window. What is the total KMS operations per day?',
    badge: 'Scale',
    badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
    observe:
      'With 7-year retention, the HNDL risk is "High". The 4-phase migration takes ~27 months total. Phase 2 (hybrid TLS + key wrapping) provides the highest security uplift for the lowest effort.',
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
    <div className="space-y-6 max-w-4xl mx-auto">
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
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors text-sm shrink-0"
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
