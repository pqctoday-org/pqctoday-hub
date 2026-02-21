import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface EmailSigningExercisesProps {
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

export const EmailSigningExercises: React.FC<EmailSigningExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'cert-comparison',
      title: '1. RSA vs ML-DSA Certificate Fields',
      description:
        'Examine an S/MIME signing certificate side by side: RSA-2048 vs ML-DSA-65. Compare the public key sizes, signature sizes, and total certificate footprint. Note which fields are identical and which change.',
      badge: 'Certificates',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The X.509 extensions (keyUsage, extKeyUsage, subjectAltName) are identical for both algorithms. Only the algorithm OID, key size (256 vs 1,952 bytes), and signature size (256 vs 3,309 bytes) differ.',
      config: { step: 0 },
    },
    {
      id: 'signing-pipeline',
      title: '2. CMS SignedData Pipeline',
      description:
        'Walk through the four-stage signing pipeline: content preparation, SHA-256 hashing, signature generation, and CMS wrapping. Step through each stage and observe how the ASN.1 tree builds up.',
      badge: 'Signing',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'The CMS SignedData structure is algorithm-agnostic by design. The signer info contains the algorithm OID and signature bytes, but the overall structure is the same for ECDSA and ML-DSA.',
      config: { step: 1 },
    },
    {
      id: 'kem-vs-transport',
      title: '3. KEM vs Key Transport for Encryption',
      description:
        'Toggle between RSA key transport and ML-KEM encryption modes. Compare how the CEK is delivered to the recipient in each case. Pay attention to the extra KDF and key-wrap steps in the KEM flow.',
      badge: 'Encryption',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'RSA directly encrypts the CEK (one step). ML-KEM requires three steps: encapsulation, key derivation (HKDF), and key wrapping (AES-WRAP). Despite the extra complexity, KEM is quantum-safe.',
      config: { step: 2 },
    },
    {
      id: 'recipient-info',
      title: '4. KEMRecipientInfo Deep Dive',
      description:
        'Study the RecipientInfo comparison table in the encryption demo. Understand every field of KEMRecipientInfo (RFC 9629) and how it differs from the classical KeyTransRecipientInfo.',
      badge: 'RFC 9629',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'KEMRecipientInfo adds three new concepts: kemct (KEM ciphertext), kdf (key derivation function), and wrap (key wrap algorithm). These replace the single encryptedKey field in KeyTransRecipientInfo.',
      config: { step: 2 },
    },
    {
      id: 'migration-strategy',
      title: '5. Dual-Algorithm Migration Strategy',
      description:
        'Review the S/MIME extensions in the certificate viewer, then examine how smimeCapabilities enables gradual PQC rollout. Consider how an organization would maintain both RSA and ML-DSA certificates during transition.',
      badge: 'Migration',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'During migration, senders include both KeyTransRecipientInfo (RSA) and KEMRecipientInfo (ML-KEM) for the same recipient. The smimeCapabilities attribute signals which algorithms each party supports.',
      config: { step: 0 },
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
          Work through these scenarios to understand S/MIME certificate structure, CMS signing, and
          KEM-based encryption. Each exercise pre-configures the Workshop &mdash; click &quot;Load
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
                Take the PQC quiz to test what you&apos;ve learned about email and document signing.
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
