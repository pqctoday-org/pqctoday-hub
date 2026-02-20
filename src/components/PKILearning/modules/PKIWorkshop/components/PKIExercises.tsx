import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PKIExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopStep?: (step: number) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  workshopStep: number
}

export const PKIExercises: React.FC<PKIExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopStep,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'classical-rsa',
      title: '1. Build a Classical PKI Chain (RSA)',
      description:
        'Generate an RSA-4096 Root CA, create an RSA-2048 CSR for a server certificate, sign it with the Root CA, then parse and verify the full chain.',
      badge: 'Classical',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Note the RSA key sizes (4096-bit for Root CA, 2048-bit for end entity), the sha256WithRSAEncryption signature algorithm, Basic Constraints (CA:TRUE vs CA:FALSE), and Key Usage extensions in the parsed output.',
      workshopStep: 0,
    },
    {
      id: 'pqc-mldsa',
      title: '2. PQC Certificate Chain (ML-DSA)',
      description:
        'Create a full post-quantum PKI chain using ML-DSA-87 for the Root CA and ML-DSA-44 for the end-entity certificate. Compare signature and key sizes with the RSA chain from Exercise 1.',
      badge: 'PQC',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'ML-DSA-87 signatures are ~4,627 bytes vs ~512 bytes for RSA-4096. Public keys are ~2,592 bytes. Check the OID values in the parsed output — you will see ml-dsa-87 instead of rsaEncryption.',
      workshopStep: 0,
    },
    {
      id: 'hash-based',
      title: '3. Hash-Based Signatures (SLH-DSA)',
      description:
        'Generate a Root CA using SLH-DSA-SHA2-128s (SPHINCS+) and compare its signature and key sizes with ML-DSA. Understand the trade-off between lattice-based and hash-based post-quantum signatures.',
      badge: 'Stateless Hash',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'SLH-DSA-SHA2-128s signatures are ~7,856 bytes (larger than ML-DSA) but rely only on hash function security. Notice the longer signing time compared to ML-DSA — the trade-off is conservative security assumptions vs performance.',
      workshopStep: 1,
    },
    {
      id: 'cross-algo',
      title: '4. Cross-Algorithm Chain Verification',
      description:
        'Create a Root CA with one algorithm (e.g., ML-DSA-87) and sign an end-entity CSR that was generated with a different algorithm (e.g., RSA-2048). Parse the signed certificate and verify the chain.',
      badge: 'Chain Verify',
      badgeColor: 'bg-tertiary/20 text-tertiary border-tertiary/50',
      observe:
        'The signature algorithm field in the signed certificate reflects the CA key (ML-DSA-87), not the subject key (RSA). The Subject Public Key Info still shows the original RSA key. Use the "Verify Chain" button in Step 4 to confirm the chain is valid.',
      workshopStep: 0,
    },
    {
      id: 'profiles',
      title: '5. Industry Profile Comparison',
      description:
        'Generate CSRs using different industry certificate profiles — Financial (ETSI EN 319 412-2), General IT (CA/Browser Forum TLS BR), and Telecom (3GPP TS 33.310) — and compare the required X.509 attributes and extensions.',
      badge: 'Compliance',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Each profile requires different mandatory Subject DN fields and certificate extensions. Financial profiles require organizationIdentifier; Telecom profiles add NF Type extensions. Click the "Info" button next to each profile to read the full standard documentation.',
      workshopStep: 0,
    },
  ]

  const handleStartExercise = (scenario: Scenario) => {
    onSetWorkshopStep?.(scenario.workshopStep)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these exercises in order to explore classical and post-quantum PKI workflows.
          Each exercise guides you through the Workshop tab — click &quot;Start Exercise&quot; to
          jump to the right step. Compare your results across exercises to understand the trade-offs
          between algorithm families.
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
                onClick={() => handleStartExercise(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Start Exercise
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
                Take the PQC quiz to test what you&apos;ve learned about PKI and post-quantum
                cryptography.
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
