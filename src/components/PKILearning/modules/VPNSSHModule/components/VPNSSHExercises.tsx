import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { IKEv2Mode } from '../data/ikev2Constants'
import type { SSHKexAlgorithm } from '../data/sshConstants'

export interface SimulationConfig {
  step: number
  ikev2Mode?: IKEv2Mode
  sshKex?: SSHKexAlgorithm
}

interface VPNSSHExercisesProps {
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

export const VPNSSHExercises: React.FC<VPNSSHExercisesProps> = ({
  onNavigateToSimulate,
  onSetSimulationConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'ikev2-classical',
      title: '1. Classical IKEv2 Handshake (ECP-256)',
      description:
        'Step through a standard IKEv2 handshake using ECDH Group 19 (secp256r1). Observe the IKE_SA_INIT and IKE_AUTH phases, payload structure, and the compact message sizes with classical DH.',
      badge: 'Classical',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        "The total handshake is approximately 1,400 bytes across 2 round trips. The KE payload carries a 64-byte ECP-256 public key. This baseline is quantum-vulnerable to Shor's algorithm.",
      config: { step: 0, ikev2Mode: 'classical' },
    },
    {
      id: 'ikev2-hybrid',
      title: '2. Hybrid IKEv2 with ML-KEM (AKE)',
      description:
        'Run a hybrid IKEv2 handshake per draft-ietf-ipsecme-ikev2-mlkem. Notice the Additional Key Exchange (AKE) payload in IKE_INTERMEDIATE that carries the ML-KEM-768 encapsulation key.',
      badge: 'Hybrid',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'The handshake grows to approximately 3,768 bytes and adds a third round trip for IKE_INTERMEDIATE. The ML-KEM encapsulation key (1,184 B) and ciphertext (1,088 B) dominate the size increase.',
      config: { step: 0, ikev2Mode: 'hybrid' },
    },
    {
      id: 'ssh-classical',
      title: '3. SSH Key Exchange (curve25519-sha256)',
      description:
        'Observe the classical SSH key exchange using X25519. Step through SSH_MSG_KEXINIT negotiation, ECDH_INIT, and ECDH_REPLY messages. Note the compact 32-byte public keys.',
      badge: 'SSH',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'X25519 produces 32-byte public keys and a 32-byte shared secret. The total handshake is under 1 KB. This is the most widely deployed SSH KEX but is quantum-vulnerable.',
      config: { step: 1, sshKex: 'curve25519-sha256' },
    },
    {
      id: 'ssh-mlkem',
      title: '4. SSH with ML-KEM-768 Hybrid (OpenSSH 9.9)',
      description:
        'Switch to mlkem768x25519-sha256, the NIST-standard hybrid KEX added in OpenSSH 9.9. Compare the message sizes with the classical X25519 exchange.',
      badge: 'PQC',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'The public key grows from 32 bytes to 1,216 bytes (X25519 + ML-KEM concatenated). The total handshake is approximately 3,296 bytes — a 3.3x increase. The shared secret doubles to 64 bytes.',
      config: { step: 1, sshKex: 'mlkem768x25519-sha256' },
    },
    {
      id: 'protocol-compare',
      title: '5. Cross-Protocol Size Comparison',
      description:
        'View the comprehensive comparison table across IKEv2, SSH, WireGuard, and TLS 1.3. Filter by protocol and mode to understand the relative impact of PQC on each protocol.',
      badge: 'Compare',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'WireGuard has the largest relative size increase (22x) due to its ultra-compact classical handshake. IKEv2 and SSH handle PQC sizes well through TCP or fragmentation support. TLS 1.3 maintains 1-RTT even with hybrid KEX.',
      config: { step: 2 },
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
          Work through these scenarios to compare VPN and SSH protocol behavior with classical,
          hybrid, and post-quantum key exchange. Each exercise pre-configures the Simulator &mdash;
          click &quot;Load &amp; Run&quot; to begin.
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
                Take the PQC quiz to test what you&apos;ve learned about VPN and SSH protocols.
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
