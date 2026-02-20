import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface SimulationConfig {
  part: number
  profile?: 'A' | 'B' | 'C'
  pqcMode?: 'hybrid' | 'pure'
}

interface FiveGExercisesProps {
  onNavigateToSimulate: () => void
  onSetSimulationConfig?: (config: SimulationConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: SimulationConfig
}

export const FiveGExercises: React.FC<FiveGExercisesProps> = ({
  onNavigateToSimulate,
  onSetSimulationConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'profile-a',
      title: '1. Profile A: Classical SUCI (X25519)',
      description:
        'Run the full SUCI concealment flow using Profile A — Curve25519 (X25519) key exchange with AES-128-CTR encryption. This is the most common 5G privacy scheme deployed today.',
      badge: 'Classical',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Observe the 32-byte X25519 public keys, ECDH shared secret derivation, and the compact SUCI structure. Note the baseline handshake size for comparison with other profiles.',
      config: { part: 0, profile: 'A' },
    },
    {
      id: 'profile-b',
      title: '2. Profile B: NIST-Compliant SUCI (P-256)',
      description:
        'Switch to Profile B — NIST P-256 (secp256r1) curve. This profile is common in legacy-compliant deployments and US federal 5G networks requiring FIPS-approved algorithms.',
      badge: 'NIST',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        "Compare the 65-byte uncompressed P-256 public key with Profile A's 32-byte X25519 key. The SUCI structure is slightly larger due to the bigger public key.",
      config: { part: 0, profile: 'B' },
    },
    {
      id: 'profile-c-hybrid',
      title: '3. Profile C: Post-Quantum SUCI (Hybrid)',
      description:
        'Use Profile C in hybrid mode — combining X25519 classical ECDH with ML-KEM-768 lattice-based KEM. The shared secret is derived from both algorithms, providing quantum resistance with a classical fallback.',
      badge: 'Hybrid',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Notice the 1,184-byte ML-KEM public key and the dual shared secret derivation (Z_ecdh + Z_kem). The SUCI is significantly larger than Profile A/B due to the KEM ciphertext (~1,088 bytes).',
      config: { part: 0, profile: 'C', pqcMode: 'hybrid' },
    },
    {
      id: 'profile-c-pure',
      title: '4. Profile C: Post-Quantum SUCI (Pure)',
      description:
        'Use Profile C in pure PQC mode — ML-KEM-768 only, with no classical component. This is the target end-state for quantum-resistant subscriber privacy, using AES-256-CTR and HMAC-SHA3-256.',
      badge: 'PQC',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Compare with hybrid mode: no X25519 ephemeral key, only ML-KEM encapsulation. Notice AES-256 (vs AES-128 in Profile A/B) and SHA3-256 (vs SHA-256) for stronger post-quantum assurance.',
      config: { part: 0, profile: 'C', pqcMode: 'pure' },
    },
    {
      id: 'auth-flow',
      title: '5. 5G-AKA: Mutual Authentication',
      description:
        'Run the full 5G-AKA authentication flow: credential retrieval, RAND generation, MILENAGE computation (f1-f5), AUTN construction, and KAUSF derivation. See how the network and subscriber mutually prove their identity.',
      badge: 'Authentication',
      badgeColor: 'bg-tertiary/20 text-tertiary border-tertiary/50',
      observe:
        'Watch the MILENAGE algorithm compute all five functions (MAC-A, XRES, CK, IK, AK) from K, OPc, and RAND. Note that MILENAGE uses AES-128 — a symmetric algorithm that is already quantum-resistant.',
      config: { part: 1 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetSimulationConfig?.(scenario.config)
    onNavigateToSimulate()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Run these scenarios to compare classical, NIST-compliant, and post-quantum 5G security
          configurations. Each exercise pre-configures the simulator — click &quot;Load &amp;
          Run&quot; to apply the settings and switch to the Simulate tab.
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
                <Play size={14} fill="currentColor" /> Load & Run
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
                Take the Protocol Integration quiz to test what you&apos;ve learned.
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
