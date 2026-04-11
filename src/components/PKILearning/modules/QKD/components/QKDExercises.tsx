// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Shield,
  Key,
  Globe,
  GraduationCap,
  ArrowRight,
  Network,
  Server,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  part: number
  eveEnabled?: boolean
  numQubits?: number
  protocol?: 'tls' | 'ikev2' | 'macsec' | 'ssh'
}

interface QKDExercisesProps {
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
  icon: React.ElementType
}

const scenarios: Scenario[] = [
  {
    id: 'detect-eve',
    title: '1. Detect the Eavesdropper',
    description:
      'Run BB84 with Eve enabled and 32 qubits. Watch how eavesdropping introduces errors that push the QBER above the 11% security threshold.',
    badge: 'Security',
    badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
    observe:
      'Notice the ~25% QBER when Eve intercepts every qubit. Compare this with the ~0% QBER in a clean channel.',
    config: { part: 0, eveEnabled: true, numQubits: 32 },
    icon: ShieldAlert,
  },
  {
    id: 'secure-exchange',
    title: '2. Secure Key Exchange',
    description:
      'Run BB84 without an eavesdropper using 16 qubits, then follow through to post-processing to see the complete key establishment pipeline.',
    badge: 'Protocol',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'QBER is ~0%, confirming no eavesdropper. The sifted key passes through error correction and privacy amplification to produce a usable secret.',
    config: { part: 0, eveEnabled: false, numQubits: 16 },
    icon: Shield,
  },
  {
    id: 'hybrid-derivation',
    title: '3. Hybrid Key Derivation',
    description:
      'Combine a QKD-derived secret with a simulated ML-KEM-768 shared secret via HKDF. See how hybrid key derivation provides defense in depth.',
    badge: 'Hybrid',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
    observe:
      'Both the QKD secret and ML-KEM secret contribute entropy. The HKDF output is secure even if one source is compromised.',
    config: { part: 1 },
    icon: Key,
  },
  {
    id: 'evaluate-deployments',
    title: '4. Evaluate QKD Deployments',
    description:
      'Explore the global deployment database. Filter by technology to see which deployments rely on trusted nodes and consider the security implications.',
    badge: 'Strategy',
    badgeColor: 'bg-accent/20 text-accent border-accent/50',
    observe:
      'Almost all fiber deployments over 100 km require trusted nodes. Satellite QKD avoids this but has lower key rates and limited availability windows.',
    config: { part: 2 },
    icon: Globe,
  },
  {
    id: 'inject-tls',
    title: '5. Inject QKD Key into TLS 1.3',
    description:
      'Use RFC 9258 to import a QKD-derived secret as a TLS 1.3 external PSK. See how the ImportedIdentity structure binds the key to a specific KDF and hash algorithm.',
    badge: 'Protocol',
    badgeColor: 'bg-primary/20 text-primary border-primary/50',
    observe:
      'The QKD secret is used directly as the PSK — it replaces the ECDH-derived Early Secret in the TLS 1.3 key schedule without any protocol modifications.',
    config: { part: 3, protocol: 'tls' },
    icon: Network,
  },
  {
    id: 'hsm-derivation',
    title: '6. HSM Key Derivation from QKD Secret',
    description:
      'Follow the ETSI GS QKD 014 → PKCS#11 → NIST SP 800-108 pipeline. Both Alice and Bob derive the same 256-bit session key inside their HSMs without transmitting the secret.',
    badge: 'Infrastructure',
    badgeColor: 'bg-warning/20 text-warning border-warning/50',
    observe:
      'The session key is identical on both sides even though it was never sent over any network. Only the key_ID reference is shared; the secret bytes were established by quantum physics.',
    config: { part: 4 },
    icon: Server,
  },
]

export const QKDExercises: React.FC<QKDExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const handleLoadScenario = (scenario: Scenario) => {
    if (onSetWorkshopConfig) {
      onSetWorkshopConfig(scenario.config)
    }
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">QKD Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Each exercise pre-configures the workshop with specific parameters. Click &quot;Load &amp;
          Run&quot; to jump directly into the scenario.
        </p>
      </div>

      {scenarios.map((scenario) => {
        const Icon = scenario.icon
        return (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-primary" />
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{scenario.description}</p>
                <div className="bg-muted/50 rounded p-3 border border-border">
                  <div className="text-xs font-bold text-muted-foreground mb-1">
                    What to observe
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.observe}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadScenario(scenario)}
                className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                Load &amp; Run <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )
      })}

      {/* Quiz Link */}
      <div className="glass-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={18} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">Test Your Knowledge</h3>
            </div>
            <p className="text-sm text-foreground/80">
              Ready to test what you&apos;ve learned about quantum key distribution? Take the PQC
              Quiz to assess your understanding.
            </p>
          </div>
          <Link
            to="/learn/quiz"
            className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            Take Quiz <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
