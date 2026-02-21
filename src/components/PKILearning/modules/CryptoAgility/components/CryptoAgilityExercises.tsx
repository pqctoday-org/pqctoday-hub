import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
  backend?: string
}

interface CryptoAgilityExercisesProps {
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

export const CryptoAgilityExercises: React.FC<CryptoAgilityExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'rsa-to-hybrid',
      title: '1. RSA to Hybrid: Zero Code Changes',
      description:
        'Start with the RSA-2048 backend, then switch to X25519MLKEM768. Notice that the application code stays identical — only the configuration changes.',
      badge: 'Agility',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The encrypt()/keyExchange() calls in the application code never change. The abstraction layer maps the same API to different algorithm implementations.',
      config: { step: 0, backend: 'rsa' },
    },
    {
      id: 'anti-patterns',
      title: '2. Spot the Anti-Patterns',
      description:
        'Review the four common anti-patterns that block crypto agility: hardcoded algorithms, hardcoded buffer sizes, missing inventory, and single provider lock-in. Compare with the abstraction layer approach.',
      badge: 'Architecture',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Each anti-pattern would require code changes across multiple services to migrate. The provider model centralizes the algorithm choice in configuration.',
      config: { step: 0, backend: 'hybrid' },
    },
    {
      id: 'cbom-scan',
      title: '3. CBOM Vulnerability Scan',
      description:
        'Examine the sample CBOM of a typical enterprise. Filter by "Vulnerable" to see which algorithms need migration. Check the CycloneDX JSON format.',
      badge: 'CBOM',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'The majority of asymmetric algorithms (RSA, ECDSA, ECDH, Ed25519) are quantum-vulnerable. Symmetric algorithms (AES-256) and hashes (SHA-256) are generally safe. This is typical — most enterprises have 60-70% vulnerable assets.',
      config: { step: 1 },
    },
    {
      id: 'migration-phase1',
      title: '4. Migration Phase 1: Assessment',
      description:
        'Walk through Phase 1 of the 7-phase migration framework. Understand the tasks, framework alignment, and how it connects to the Assessment tool in this app.',
      badge: 'Migration',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Phase 1 (Assessment) produces a CBOM — the same artifact you explored in Exercise 3. Each subsequent phase builds on this inventory to prioritize, plan, test, and deploy.',
      config: { step: 2 },
    },
    {
      id: 'full-migration',
      title: '5. Complete Migration Walkthrough',
      description:
        'Walk through all 7 phases of the migration framework. Mark each phase complete as you go. Notice how the phases align with NIST IR 8547 and NSA CNSA 2.0 timelines.',
      badge: 'Full Plan',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'The framework spans from discovery through monitoring. NSA CNSA 2.0 requires phased PQC adoption: exclusive use for web/browsers/networking by 2030, and exclusive use across all legacy NSS by 2033.',
      config: { step: 2 },
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
          Work through these scenarios to understand crypto agility, CBOM scanning, and PQC
          migration planning. Each exercise pre-configures the Workshop &mdash; click &quot;Load
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
                Take the Crypto Agility quiz to test what you&apos;ve learned.
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
