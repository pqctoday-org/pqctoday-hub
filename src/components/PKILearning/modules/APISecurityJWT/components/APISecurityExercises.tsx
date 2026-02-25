import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface APISecurityExercisesProps {
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

export const APISecurityExercises: React.FC<APISecurityExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'decode-jwt',
      title: '1. Decode a JWT and identify the signing algorithm',
      description:
        'Paste a JWT into the inspector and examine the JOSE header. Identify the algorithm, token type, and claims. Switch between sample ES256 and ML-DSA-65 tokens to compare signature sizes.',
      badge: 'JWT Inspector',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The header is the only part that changes between algorithms. The ES256 signature is ~85 base64url characters while the ML-DSA-65 signature is ~4,412 characters.',
      config: { step: 0 },
    },
    {
      id: 'pqc-sign',
      title: '2. Sign a JWT with ML-DSA-65 and compare with ES256',
      description:
        'Select an algorithm, generate a simulated keypair, edit the payload claims, and sign. Compare the resulting JWT sizes between ES256 and ML-DSA-65. Note the verification status display.',
      badge: 'PQC Signing',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'The JWT structure is identical for both algorithms. Only the signature length differs dramatically: ~300 bytes total for ES256 vs ~4,700 bytes for ML-DSA-65.',
      config: { step: 1 },
    },
    {
      id: 'hybrid-jwt',
      title: '3. Create a hybrid JWT with dual signatures',
      description:
        'Explore the two hybrid approaches: nested JWT (inner + outer signatures) and composite headers. Create a hybrid token and examine the nested structure with both ES256 and ML-DSA-65 signatures.',
      badge: 'Hybrid JWT',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'The nested JWT approach wraps the entire ES256-signed JWT as the payload of an ML-DSA-65-signed outer JWT. The total size is roughly the sum of both JWTs.',
      config: { step: 2 },
    },
    {
      id: 'jwe-encrypt',
      title: '4. Encrypt a JWT payload using ML-KEM key agreement',
      description:
        'Walk through the JWE encryption flow step by step: ML-KEM keypair generation, encapsulation, HKDF key derivation, AES-256-GCM encryption, and JWE assembly. Reverse the flow with decryption.',
      badge: 'JWE Encryption',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'JWE has 5 parts (vs 3 for JWS): header, encrypted key (KEM ciphertext), IV, ciphertext, and authentication tag. The ML-KEM-768 ciphertext adds ~1,088 bytes.',
      config: { step: 3 },
    },
    {
      id: 'size-analysis',
      title: '5. Analyze token sizes across 7 algorithms',
      description:
        'Edit the JWT payload and observe how total token size changes across all 7 signing algorithms. Note the segmented bar chart showing header, payload, and signature proportions. Identify which algorithms exceed the 8 KB HTTP header limit.',
      badge: 'Size Analyzer',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'SLH-DSA-SHA2-128s produces the largest signature (7,856 bytes) but the smallest public key (32 bytes). ML-DSA-87 balances key and signature sizes. Only classical algorithms fit comfortably in standard HTTP headers.',
      config: { step: 4 },
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
          Work through these scenarios to understand JWT structure, PQC signing, hybrid tokens, JWE
          encryption, and size trade-offs. Each exercise pre-configures the Workshop &mdash; click
          &quot;Load &amp; Run&quot; to begin.
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
                Take the PQC quiz to test what you&apos;ve learned about API security and JWT
                migration.
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
