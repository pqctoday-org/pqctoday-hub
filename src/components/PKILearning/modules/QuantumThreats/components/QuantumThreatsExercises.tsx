import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
  algorithmA?: string
  algorithmB?: string
}

interface QuantumThreatsExercisesProps {
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

export const QuantumThreatsExercises: React.FC<QuantumThreatsExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'rsa-degradation',
      title: '1. RSA-2048 Under Quantum Attack',
      description:
        "Use the Security Level tool to see how RSA-2048's 112-bit classical security drops to 0-bit quantum security. Compare with RSA-4096 to see that larger keys don't help against Shor's algorithm.",
      badge: "Shor's",
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        "Notice that RSA-2048, RSA-3072, and RSA-4096 all drop to 0-bit quantum security. Key size increases provide no defense against Shor's algorithm.",
      config: { step: 0, algorithmA: 'RSA-2048' },
    },
    {
      id: 'aes-comparison',
      title: '2. AES-128 vs AES-256 Quantum Security',
      description:
        "Compare how Grover's algorithm affects AES-128 (drops to 64-bit, insufficient) versus AES-256 (drops to 128-bit, still secure). The fix is simple: double the key size.",
      badge: "Grover's",
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        "AES-128's post-quantum security (64-bit) falls below the minimum 80-bit threshold. AES-256 retains 128-bit security — the recommended NIST Level 1 minimum.",
      config: { step: 0, algorithmA: 'AES-128', algorithmB: 'AES-256' },
    },
    {
      id: 'vuln-matrix',
      title: '3. Vulnerability Matrix: Who Survives?',
      description:
        "Open the full vulnerability matrix to see every algorithm's exposure to Shor's and Grover's attacks. Identify which algorithms are broken, weakened, or safe.",
      badge: 'Analysis',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'All asymmetric algorithms based on factoring or discrete logs are marked "broken." Symmetric algorithms are "weakened" but survivable with larger keys. PQC algorithms are fully safe.',
      config: { step: 1 },
    },
    {
      id: 'hndl-healthcare',
      title: '4. HNDL Risk: Healthcare Records',
      description:
        'Calculate the HNDL migration deadline for medical records that must remain confidential for 50 years. With a CRQC expected between 2030-2040, when should migration have started?',
      badge: 'HNDL',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'With 50-year data sensitivity and a CRQC in 2035, the migration deadline was 1985. This illustrates why healthcare data intercepted today is already at risk — HNDL is not a future problem.',
      config: { step: 3 },
    },
    {
      id: 'pqc-safe',
      title: '5. PQC Algorithms: Built for Quantum',
      description:
        'Compare ML-KEM-768 and ML-DSA-65 in the Key Size Analyzer. Verify that their classical and quantum security levels are identical — no degradation under quantum attack.',
      badge: 'PQC',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        "PQC algorithms maintain identical classical and quantum security bits. Their security is based on lattice problems, not factoring or discrete logs, so Shor's algorithm provides no advantage.",
      config: { step: 2, algorithmA: 'ML-KEM-768', algorithmB: 'ML-DSA-65' },
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
          Work through these scenarios to understand how quantum computing threatens current
          cryptography and why PQC algorithms are resistant. Each exercise pre-configures the
          Workshop — click &quot;Load &amp; Run&quot; to begin.
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
                Take the Quantum Threats quiz to test what you&apos;ve learned.
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
