// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Binary,
  Gauge,
  KeyRound,
  ListChecks,
  Scale,
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
  FheSchemesSection,
} from './FheSections'
import {
  FheCostSection,
  FheReferencesList,
  FheStandardsSection,
  FheUseCasesSection,
} from './FheContextSections'
import type { OpenLifecycleView } from '../workshop/fheRotationSharedData'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
  /** Open the key-rotation or shared-decryption view in the concepts or the flows step. */
  onOpenLifecycleView?: OpenLifecycleView
}

export const Introduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
  onOpenLifecycleView,
}) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      <LearnSection
        sectionId="fhe-fundamentals"
        title="What FHE Is, and What It Promises"
        icon={<Sigma size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <FheFundamentalsSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-schemes"
        title="Schemes, Data Types and Noisy Results"
        icon={<Binary size={24} className="text-primary" />}
      >
        <FheSchemesSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-use-cases"
        title="Where FHE Is Used"
        icon={<ListChecks size={24} className="text-primary" />}
      >
        <FheUseCasesSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-cost"
        title="The Cost, and How It Is Being Reduced"
        icon={<Gauge size={24} className="text-primary" />}
      >
        <FheCostSection />
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
        sectionId="fhe-standards"
        title="Standards and Compliance"
        icon={<Scale size={24} className="text-primary" />}
      >
        <FheStandardsSection />
      </LearnSection>

      <LearnSection
        sectionId="fhe-implementations"
        title="Open-Source Implementations"
        icon={<Server size={24} className="text-primary" />}
      >
        <FheImplementationsSection onOpenLifecycleView={onOpenLifecycleView} />
      </LearnSection>

      <LearnSection
        sectionId="fhe-hsm-custody"
        title="Advanced: HSM Custody and Assurance"
        icon={<ShieldCheck size={24} className="text-primary" />}
      >
        <FheCustodySection onOpenLifecycleView={onOpenLifecycleView} />
      </LearnSection>

      <FheReferencesList />

      {/* ── Workshop CTA ────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Ready to test the concepts?</h3>
            <p className="text-sm text-muted-foreground">
              Start with noise, encoding and circuit design. The advanced path then follows HSM
              custody, controlled decryption, rotation and shared decryption.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Open Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Reading Complete ─────────────────────────────────────────────── */}
      <ReadingCompleteButton />
    </div>
  )
}
