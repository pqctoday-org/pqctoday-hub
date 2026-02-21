import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface KeyManagementExercisesProps {
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

export const KeyManagementExercises: React.FC<KeyManagementExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'lifecycle-generation',
      title: '1. Key Generation: Classical vs PQC',
      description:
        'Walk through the Generation stage of the key lifecycle. Compare RSA-2048 key generation (256-byte public key) with ML-KEM-768 (1,184-byte public key) and ML-DSA-65 (1,952-byte public key). Observe how the HSM handles larger key material.',
      badge: 'Lifecycle',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'ML-KEM-768 public keys are 4.6x larger than RSA-2048. This directly impacts certificate sizes, TLS handshakes, and HSM storage capacity. The key generation process itself is comparable in speed.',
      config: { step: 0 },
    },
    {
      id: 'hsm-keygen-wrap',
      title: '2. HSM Key Generation & Wrapping',
      description:
        'Step through the first three PKCS#11 operations: generate an ML-KEM-768 key pair inside the HSM, export the public key, and use encapsulation to wrap an AES-256 session key.',
      badge: 'HSM',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'The private key never leaves the HSM boundary (CKA_SENSITIVE=TRUE). ML-KEM encapsulation replaces RSA-OAEP for key wrapping, producing 1,088-byte ciphertexts instead of 256 bytes.',
      config: { step: 1 },
    },
    {
      id: 'hsm-sign-verify',
      title: '3. ML-DSA Signing in the HSM',
      description:
        'Complete the HSM operation flow: sign data with ML-DSA-65 and verify the signature. Compare the 3,309-byte ML-DSA signature with a 64-byte ECDSA P-256 signature.',
      badge: 'Signatures',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'ML-DSA-65 signatures are 51x larger than ECDSA P-256. This has major implications for certificate chains, CRLs, OCSP responses, and any protocol that transmits signatures.',
      config: { step: 1 },
    },
    {
      id: 'rotation-inventory',
      title: '4. Enterprise Key Inventory',
      description:
        'Examine the key inventory for Quantum Financial Services Corp: 500 certificates across 5 categories, 10 HSMs. Identify which keys are quantum-vulnerable and calculate the storage impact of PQC migration.',
      badge: 'Planning',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'Of 500 certificates, 400 use quantum-vulnerable algorithms (RSA, ECDSA). Only the 100 AES-256 data encryption keys are already quantum-safe. Total public key storage increases by approximately 7x after migration.',
      config: { step: 2 },
    },
    {
      id: 'rotation-compliance',
      title: '5. Compliance-Driven Rotation Schedule',
      description:
        'Plan a rotation schedule aligned with CNSA 2.0 (2025–2033 phased timeline), NIST IR 8547 (draft: deprecate by 2030, disallow by 2035), PCI DSS v4.0, and DORA. Calculate the bandwidth impact of rotating 500 certificates to PQC algorithms.',
      badge: 'Compliance',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'The compliance deadlines create a clear migration timeline: PCI DSS crypto inventory required by 2025 (Req. 12.3.3), DORA ICT risk framework effective January 2025, CNSA 2.0 phased from 2025 (prefer PQC) to 2033 (exclusively PQC for all NSS), and NIST IR 8547 proposing classical deprecation by 2030. Rotation schedules must account for larger certificates and signatures.',
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
          Work through these scenarios to understand key lifecycle management, HSM operations, and
          PQC migration planning. Each exercise pre-configures the Workshop &mdash; click &quot;Load
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
                Take the PQC quiz to test what you&apos;ve learned about key management and HSMs.
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
