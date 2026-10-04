// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  HardDrive,
  KeyRound,
  Server,
  ShieldCheck,
  Sigma,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import {
  FheCustodySection,
  FheFundamentalsSection,
  FheImplementationsSection,
  FheKeysOperationsSection,
  FheQuantumSection,
} from './FheSections'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      <LearnSection
        sectionId="fhe-fundamentals"
        title="Compute Without Trusting the Hardware"
        icon={<Sigma size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <FheFundamentalsSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-keys-operations"
        title="Keys, Operations and AES Data"
        icon={<KeyRound size={24} className="text-primary" />}
      >
        <FheKeysOperationsSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-quantum"
        title="FHE Against the Quantum Threat"
        icon={<AlertTriangle size={24} className="text-primary" />}
      >
        <FheQuantumSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-hsm-custody"
        title="The HSM as FHE Key Custodian"
        icon={<ShieldCheck size={24} className="text-primary" />}
      >
        <FheCustodySection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-implementations"
        title="Open-Source Implementations"
        icon={<Server size={24} className="text-primary" />}
      >
        <FheImplementationsSection />
      </LearnSection>

      {/* ── Workshop CTA ────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Ready to follow the keys?</h3>
            <p className="text-sm text-muted-foreground">
              Step through six encrypt, compute and decrypt scenarios and see where every key and
              every piece of data sits.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Open Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Related Resources ────────────────────────────────────────────── */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/confidential-computing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                Confidential Computing &amp; TEEs
              </div>
              <div className="text-xs text-muted-foreground">
                The other way to protect data in use: trust the hardware instead of the maths
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <HardDrive size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                The hardware that holds the FHE secret key and signs the public key set
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <KeyRound size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                Key lifecycle management for keys that live in hardware
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Reading Complete ─────────────────────────────────────────────── */}
      <ReadingCompleteButton />
    </div>
  )
}
