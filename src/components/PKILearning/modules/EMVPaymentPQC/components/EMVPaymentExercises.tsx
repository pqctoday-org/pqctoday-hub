// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { PAYMENT_NETWORKS } from '../data/paymentNetworkData'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
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

export const EMVPaymentExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()
  const visa = PAYMENT_NETWORKS.find((network) => network.id === 'visa')!
  const unionpay = PAYMENT_NETWORKS.find((network) => network.id === 'unionpay')!

  const scenarios: Scenario[] = [
    {
      id: 'network-pqc-readiness',
      title: '1. Network PQC Evidence Assessment \u2014 Compare Visa and UnionPay source scope',
      description:
        'In the Network Comparator, compare Visa and UnionPay side by side. Separate published research and guidance from a committed card-network rollout. Identify which statements have direct network evidence and which are tentative dependency-led planning. Explain why gross card circulation alone cannot establish the number of distinct vulnerable cards.',
      badge: 'Architecture',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe: `Visa: ${visa.pqcTimeline} ${visa.evidenceBasis} China UnionPay: ${unionpay.pqcTimeline} ${unionpay.evidenceBasis} The listed card counts are gross network circulation, with different reporting scopes and possible multi-badging; they do not establish distinct vulnerable cards, an at-risk total, or a readiness ranking. Use the linked publications to decide what evidence to request for the specific payment interface and deployment.`,
      config: { step: 0 },
    },
    {
      id: 'offline-vs-online',
      title: '2. Offline vs Online Quantum Attack Surface \u2014 Compare quantum-vulnerable steps',
      description:
        'In the Transaction Simulator, compare Online mode with Offline CDA mode. Toggle the quantum exposure overlay for both. Count the quantum-vulnerable steps in each. Identify which mode has higher HNDL exposure.',
      badge: 'Authentication',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Online mode has 2 quantum-vulnerable steps: the ICC certificate-chain verification during card authentication, and the TLS key exchange from terminal to acquirer. Issuer ARQC verification is NOT one of them — it is symmetric end to end. Offline CDA has 3 (ICC certificate verification, the combined AC+SDAD signature (Signed Dynamic Application Data), and the SDAD verification). Offline CDA is more dangerous because forged certificates enable counterfeit acceptance at any terminal without network connectivity. Online mode mitigates risk through real-time issuer authorization.',
      config: { step: 1 },
    },
    {
      id: 'cert-chain-size',
      title: '3. EMV Certificate Chain Size Impact \u2014 Compare RSA vs ML-DSA vs FN-DSA',
      description:
        'In the Card Provisioning Visualizer, toggle between RSA-2048, ML-DSA-44, and FN-DSA-512 certificate chains. Compare the total chain size for the 3 levels (payment-system CA \u2192 Issuer \u2192 ICC); the terminal holds the payment-system CA public key, so the card itself carries the issuer and ICC certificates. Assess whether FN-DSA-512 fits within typical EMV card NVM constraints (32-64 KB).',
      badge: 'Provisioning',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'RSA-2048 chain: ~1.2 KB (3 \u00d7 384 bytes). ML-DSA-44 chain: ~11.5 KB (3 \u00d7 3,832 bytes, each a 2,420 B signature + 1,312 B key + ~100 B of fields). FN-DSA-512: ~5.1 KB (3 \u00d7 1,687 bytes, each a 666 B signature + 897 B key + ~124 B of fields). The card itself carries only the issuer and ICC certificates (about 0.8 KB for RSA, 7.7 KB for ML-DSA-44, 3.4 KB for FN-DSA-512). FN-DSA is ~2.3\u00d7 smaller than ML-DSA but 4.4\u00d7 larger than RSA. At 5.1 KB, FN-DSA is smaller than ML-DSA at 11.5 KB; whether either fits depends on the chip and the application profile (the 32-64 KB card NVM range is this module\u2019s assumption). FIPS 206 standardization for FN-DSA (Falcon) is still pending, so it is not yet a deployable option.',
      config: { step: 2 },
    },
    {
      id: 'mobile-wallet-quantum',
      title:
        '4. Mobile Wallet Quantum Exposure \u2014 Identify component and transport dependencies',
      description:
        'In the Tokenization Explorer, select Visa VTS as the TSP and Apple Pay as the wallet. Walk through the 6-step provisioning flow. Distinguish AES/HMAC protection of a component from classical public-key exposure in the whole step. Identify the TLS key-establishment, certificate-authentication, wrapping and attestation boundaries. Count exposed and unassessed steps under the declared sample assumptions.',
      badge: 'Tokenization',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'All six VTS steps have classical public-key exposure under the Sample TLS assumption, including activation confirmation. AES protection of token generation or wrapping does not remove RSA/ECDH key-delivery or ECDSA attestation exposure. TLS key establishment and RSA/ECDSA certificate authentication are separate boundaries: changing key exchange alone does not settle authentication. With your own tools, request negotiated groups and signature algorithms, HSM operation/configuration evidence, and confirmation that they apply to the transaction path. These fictional counts do not verify a provider or deployed system.',
      config: { step: 3 },
    },
    {
      id: 'dukpt-quantum-analysis',
      title: '5. DUKPT Quantum Attack Analysis \u2014 Find the RSA vulnerability in key injection',
      description:
        'In the POS Crypto Analyzer, select Traditional POS and explore the Key Injection Ceremony. Step through all 4 phases. Identify the exact point where quantum computers create risk. Toggle between Classical and PQC modes to see the difference.',
      badge: 'Key Management',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        "DUKPT per-transaction key derivation uses symmetric crypto (quantum-safe). In this module's fictional RSA remote key loading case the exposure spans TWO steps: Step 2 wraps the terminal's derived initial key (not the BDK) under an RSA-2048 key-transport key, and Step 3 transports and unwraps it (RSA-2048 decryption at the terminal plus TLS). Compromising either exposes that terminal's initial key and the keys derived from it; the BDK stays inside the HSM (PCI PIN 20-3). ML-KEM-768 can be the key-establishment step at both, followed by a KDF and an authenticated key wrap (conceptual). Steps 1 (BDK generation and initial-key derivation inside the HSM) and 4 (terminal derivation) are symmetric and need no change.",
      config: { step: 4 },
    },
    {
      id: 'migration-priority',
      title: '6. End-to-End Migration Priority \u2014 Explore illustrative dependency chains',
      description:
        'In the Migration Risk Matrix, inspect the dependency graph. Identify a recorded dependency chain and components with no prerequisites recorded in this sample. What additional durations and constraints would you need before calculating a schedule critical path?',
      badge: 'Migration',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'This sample includes a chain from HSM key wrapping through key injection and card personalization to offline authentication. Other components, including e-commerce TLS, have no prerequisites recorded here. These assumed relationships help frame readiness questions; they do not require every preparation or pilot to wait for HSM migration, or establish a duration-based critical path. A real schedule needs scoped activity durations, constraints and validated dependencies. The module\u2019s assumed 3-5 year card cycle is an estimate, not a sourced duration for every activity.',
      config: { step: 5 },
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
          Work through these scenarios to explore payment network comparisons, EMV transaction
          flows, card provisioning, tokenization, DUKPT key management, and PQC migration planning.
          Each exercise pre-configures the Workshop &mdash; click &quot;Load &amp; Run&quot; to
          begin.
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
                Take the PQC quiz to test what you&apos;ve learned about EMV payment systems and
                quantum-safe migration.
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
