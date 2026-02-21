import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
  category?: 'kem' | 'signature'
  algorithm?: string
  mode?: 'kem' | 'signature'
}

interface HybridCryptoExercisesProps {
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

export const HybridCryptoExercises: React.FC<HybridCryptoExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'kem-key-sizes',
      title: '1. KEM Key Size Comparison',
      description:
        'Generate X25519, ML-KEM-768, and X25519MLKEM768 key pairs side-by-side. Compare their public key sizes to see how much overhead the hybrid approach adds.',
      badge: 'KEM',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'X25519MLKEM768 public key (1,216 bytes) is roughly X25519 (32 bytes) + ML-KEM-768 (1,184 bytes). The hybrid overhead is minimal compared to the PQC component alone.',
      config: { step: 0, category: 'kem' },
    },
    {
      id: 'sig-key-sizes',
      title: '2. Signature Key Size Impact',
      description:
        'Switch to signature mode and generate ECDSA P-256 and ML-DSA-65 key pairs. See the dramatic difference in key and signature sizes between classical and PQC.',
      badge: 'Signatures',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'ML-DSA-65 private keys (4,032 bytes) are 126x larger than ECDSA P-256 (32 bytes). Signatures are 3,309 bytes vs 72 bytes. This is the main PQC migration challenge for bandwidth-constrained systems.',
      config: { step: 0, category: 'signature' },
    },
    {
      id: 'kem-encap-decap',
      title: '3. KEM Encapsulation Round-Trip',
      description:
        'Run the full encap/decap workflow with both ML-KEM-768 and X25519MLKEM768. Verify that encapsulated and decapsulated shared secrets match — proving correctness.',
      badge: 'Crypto',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Both algorithms produce matching shared secrets. The hybrid X25519MLKEM768 takes slightly longer due to running both X25519 and ML-KEM internally, but the security benefit is significant.',
      config: { step: 1, mode: 'kem' },
    },
    {
      id: 'sign-verify',
      title: '4. Classical vs PQC Sign/Verify',
      description:
        'Sign the same message with ECDSA P-256 and ML-DSA-65, then verify both. Compare the performance and signature sizes.',
      badge: 'Crypto',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'ECDSA is faster for individual operations, but ML-DSA-65 provides quantum resistance. In a composite scheme, both signatures would be generated and verified together.',
      config: { step: 1, mode: 'signature' },
    },
    {
      id: 'pqc-certificate',
      title: '5. PQC Certificate Generation',
      description:
        'Generate self-signed certificates with both ECDSA P-256 and ML-DSA-65. Inspect the certificate fields to see how PQC algorithm OIDs differ from classical ones.',
      badge: 'Certs',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The ML-DSA-65 certificate is significantly larger than ECDSA. The parsed output shows different algorithm OIDs and much larger public key and signature fields embedded in the certificate structure.',
      config: { step: 2, algorithm: 'all' },
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
          Work through these scenarios to understand hybrid cryptography in practice. Each exercise
          pre-configures the Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
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
                Take the Hybrid Cryptography quiz to test what you&apos;ve learned.
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
