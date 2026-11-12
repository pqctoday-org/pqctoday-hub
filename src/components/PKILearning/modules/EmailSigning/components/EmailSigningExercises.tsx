// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

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
        'Compare the captured RSA-3072 / CMS RSA-PSS and ML-DSA-65 samples. Distinguish the public-key component from complete SPKI, certificate DER/PEM, CMS and MIME bytes. Change the unsigned outer Subject and PEM line endings; identify which totals change.',
      badge: 'Certificates',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The RSA modulus is only one component of its encoded public key. Inspect each actual issuer, certificate signature, extensions and validity; the certificate ratio is specific to these samples. Outer Subject changes MIME size without changing signed content, while PEM line endings change textual bytes without changing DER. These samples are not a proof of email-purpose profile compliance or equal security.',
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
        "RSA directly encrypts the CEK (one step). ML-KEM requires three steps: encapsulation, key derivation (HKDF), and key wrapping (AES-WRAP). The ML-KEM shared secret does not rest on RSA or elliptic curves, which Shor's algorithm breaks. A KEM alone is not the point: RSA-KEM (RFC 9690) uses the same KEM interface but still rests on RSA.",
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
        'KEMRecipientInfo adds fields for the KEM: kem (algorithm), kemct (KEM ciphertext), kdf (key derivation function), kekLength, an optional ukm, and wrap (key wrap algorithm). It keeps an encryptedKey field, so kemct and encryptedKey are two separate ciphertexts: kemct lets the recipient recompute the key-encryption key with their private key, and encryptedKey is the CEK wrapped under that key. In the CMS structure it sits in the ori choice of RecipientInfo: oriType is the id-ori-kem object identifier (1.2.840.113549.1.9.16.13.3) and oriValue is the KEMRecipientInfo.',
      config: { step: 2 },
    },
    {
      id: 'migration-strategy',
      title: '5. Dual-Algorithm Migration Strategy',
      description:
        'Review the S/MIME extensions in the certificate viewer, then examine what smimeCapabilities tells a sender about the algorithms a correspondent can handle. Consider how an organization would maintain both RSA and ML-DSA certificates during transition.',
      badge: 'Migration',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'A sender can put both a KeyTransRecipientInfo (RSA) and a KEMRecipientInfo (ML-KEM) in one message for the same recipient, but both entries wrap the same CEK, so anyone who can break the RSA entry can read the message: the weakest permitted decryption path sets the confidentiality. That is multiple-recipient fallback, not a hybrid KEM, which combines the shared secrets of two algorithms into one key-encryption key. The smimeCapabilities attribute is a partial list of the algorithms a signer says it can handle, in order of preference.',
      config: { step: 0 },
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
