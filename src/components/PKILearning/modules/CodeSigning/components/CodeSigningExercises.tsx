import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface CodeSigningExercisesProps {
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

export const CodeSigningExercises: React.FC<CodeSigningExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'binary-sign-verify',
      title: '1. Generate a ML-DSA-65 keypair and sign a binary hash',
      description:
        'Select ML-DSA-65 in the Workshop, generate a keypair, enter text to sign, and step through the signing and verification process. Compare the signature size against classical algorithms in the side-by-side panel.',
      badge: 'Signing',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The ML-DSA-65 signature is 3,309 bytes compared to 64 bytes for ECDSA P-256 — a 51x increase. However, signing and verification remain fast because lattice operations are computationally efficient.',
      config: { step: 0 },
    },
    {
      id: 'cert-chain-build',
      title: '2. Build a 3-level code signing certificate chain using PQC',
      description:
        'Click "Build Chain" in the Certificate Chain workshop to generate a Root CA (ML-DSA-87), Intermediate CA (ML-DSA-65), and Code Signing certificate (ML-DSA-44). Examine the ASN.1-style info for each certificate in the chain.',
      badge: 'Certificates',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'The Extended Key Usage on the end-entity certificate is Code Signing (OID 1.3.6.1.5.5.7.3.3). Each level uses a progressively smaller ML-DSA variant, balancing security requirements with key/signature size.',
      config: { step: 1 },
    },
    {
      id: 'rpm-size-compare',
      title: '3. Compare signature sizes: ECDSA vs ML-DSA-87 for RPM packages',
      description:
        'In the Package Signing workshop, toggle between Classical (RSA-4096), PQC (ML-DSA-87), and Hybrid (ML-DSA-87+Ed448) modes. Compare the RPM signature header sizes and observe how hybrid signing provides backward compatibility.',
      badge: 'Packages',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Hybrid mode produces a signature of ~4,741 bytes (ML-DSA-87 + Ed448 combined), but older RPM tools can still verify using just the Ed448 portion. This is the approach Red Hat has chosen for RHEL 10.',
      config: { step: 2 },
    },
    {
      id: 'sigstore-trace',
      title: '4. Trace a Sigstore verification from log entry to identity',
      description:
        'Step through all 7 stages of the Sigstore keyless signing flow. Pay attention to how the ephemeral key is created and destroyed, and how the transparency log provides a permanent, immutable record of the signing event.',
      badge: 'Sigstore',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'The key advantage of Sigstore is that no long-term private keys exist. The ephemeral ML-DSA-65 keypair lives for ~20 minutes, and the transparency log (Rekor) serves as the permanent verification anchor.',
      config: { step: 3 },
    },
    {
      id: 'secure-boot-chain',
      title: '5. Walk through the secure boot trust chain and compare firmware signing algorithms',
      description:
        'In the Secure Boot Chain workshop, step through all 4 stages of the boot trust chain. Toggle between LMS, XMSS, and ML-DSA to see how signature sizes and state management requirements differ. Run the firmware signing simulation and observe the state counter behavior for stateful algorithms.',
      badge: 'Firmware',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'LMS signatures (2,512 bytes) are smaller than ML-DSA (3,309 bytes), but require a monotonic state counter that must never be reset or cloned. CNSA 2.0 mandates LMS/XMSS for firmware signing in national security systems by 2030, despite the state management burden.',
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
          Work through these scenarios to understand binary signing, certificate chains, package
          signing, and keyless Sigstore verification. Each exercise pre-configures the Workshop
          &mdash; click &quot;Load &amp; Run&quot; to begin.
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
                Take the PQC quiz to test what you&apos;ve learned about code signing and supply
                chain security.
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
