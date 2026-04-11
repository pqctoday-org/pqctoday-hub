// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

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

  const scenarios: Scenario[] = [
    {
      id: 'network-pqc-readiness',
      title:
        '1. Network PQC Readiness Assessment \u2014 Compare Visa and UnionPay quantum exposure',
      description:
        'In the Network Comparator, compare Visa and UnionPay side by side. Identify which network has the larger offline authentication exposure and which has a more advanced PQC posture. Calculate the total cards at risk across both networks.',
      badge: 'Architecture',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Visa has 4.6B cards with active PQC research (quantum lab since 2022), while UnionPay has 9.4B cards tied to China\u2019s pending GB/T standards. UnionPay\u2019s scale makes it the single largest quantum-vulnerable payment ecosystem. Combined offline exposure: ~14B cards using RSA-based CDA/DDA.',
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
        'Online mode has 2 quantum-vulnerable steps (TLS key exchange, HSM key wrapping). Offline CDA has 3 (ICC certificate verification, combined signature, chain verification). Offline CDA is more dangerous because forged certificates enable counterfeit acceptance at any terminal without network connectivity. Online mode mitigates risk through real-time issuer authorization.',
      config: { step: 1 },
    },
    {
      id: 'cert-chain-size',
      title: '3. EMV Certificate Chain Size Impact \u2014 Compare RSA vs ML-DSA vs FN-DSA',
      description:
        'In the Card Provisioning Visualizer, toggle between RSA-2048, ML-DSA-44, and FN-DSA-512 certificate chains. Compare the total chain size for all 4 levels (Root \u2192 Network \u2192 Issuer \u2192 ICC). Assess whether FN-DSA-512 fits within typical EMV card NVM constraints (32-64 KB).',
      badge: 'Provisioning',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'RSA-2048 chain: ~1.5 KB (4 \u00d7 384 bytes). ML-DSA-44 chain: ~15.3 KB (4 \u00d7 3,832 bytes). FN-DSA-512: ~6.7 KB (4 \u00d7 1,687 bytes). FN-DSA is 10\u00d7 smaller than ML-DSA but 4.4\u00d7 larger than RSA. At 6.7 KB, FN-DSA fits within 32-64 KB card NVM but ML-DSA at 15.3 KB is tight. FN-DSA-512 has smaller signatures than ML-DSA-44, which reduces storage on size-constrained card NVM. ML-DSA-44 at 15.3 KB chain is tight for 32 KB NVM. FIPS 206 standardization for FN-DSA (Falcon) is pending.',
      config: { step: 2 },
    },
    {
      id: 'mobile-wallet-quantum',
      title: '4. Mobile Wallet Quantum Exposure \u2014 Identify ECDSA vs AES steps in Apple Pay',
      description:
        'In the Tokenization Explorer, select Visa VTS as the TSP and Apple Pay as the wallet. Walk through the 6-step provisioning flow. Identify which steps use quantum-vulnerable asymmetric crypto (ECDSA/RSA) and which use quantum-safe symmetric crypto (AES). Count the total vulnerable points.',
      badge: 'Tokenization',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        '4 of 6 provisioning steps are quantum-vulnerable: (1) TLS enrollment uses RSA/ECDSA key exchange, (2) ID&V uses ECDSA token signing, (3) HSM key wrapping uses RSA-2048, (4) device attestation uses ECDSA. The per-transaction cryptogram generation (AES-256) and activation confirmation are quantum-safe. Priority: migrate TSP TLS and device attestation first.',
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
        'DUKPT per-transaction key derivation uses symmetric crypto (quantum-safe). The quantum vulnerability is specifically at Step 2: RSA-2048 key transport wrapping the BDK at the KIF. Compromising this RSA wrapping exposes the BDK, which can derive ALL past and future transaction keys. ML-KEM-768 key encapsulation replaces RSA at Step 2. The symmetric DUKPT chain (Steps 1 and 4) needs no change.',
      config: { step: 4 },
    },
    {
      id: 'migration-priority',
      title: '6. End-to-End Migration Priority \u2014 Identify the critical-path dependency chain',
      description:
        'In the Migration Risk Matrix, examine the dependency graph. Identify the critical-path migration sequence. Which 3 components must migrate first? What is the dependency chain that determines the minimum migration timeline?',
      badge: 'Migration',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Critical path: (1) Payment HSM key wrapping must migrate to ML-KEM first (enables all downstream changes), (2) Key injection ceremonies at KIFs must switch to ML-KEM key transport (unblocks terminal re-keying), (3) Card personalization must generate PQC certificates (unblocks offline auth). Dependency chain: HSM \u2192 KIF \u2192 Card Personalization \u2192 Offline Auth. This sets the minimum timeline at 5-7 years given the 3-5 year card replacement cycle.',
      config: { step: 5 },
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
