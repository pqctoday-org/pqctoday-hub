// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Learn tab. Renders every manifest `learnSections` entry, in manifest order,
 * inside the shared <LearnSection> (anchor, read tracking, path scope,
 * "Optional reference" badge, off-path hiding) and delegates the body to the
 * owner's section component via sectionRegistry.ts (build spec §4). Authors
 * never edit this file.
 */
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Atom,
  BadgeCheck,
  Compass,
  CreditCard,
  Landmark,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import manifest from '../manifest'
import { PRACTITIONER_DISCLAIMER, SECTION_COMPONENTS, type SectionGroup } from './sectionRegistry'

const GROUP_ICON = new Map<SectionGroup, LucideIcon>([
  ['core', Compass],
  ['fips', ShieldCheck],
  ['cc-eu', Landmark],
  ['pci', CreditCard],
  ['shared', Atom],
])

interface CertIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const CertIntroduction = ({ onNavigateToWorkshop }: CertIntroductionProps) => (
  <div className="w-full space-y-6">
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-status-warning/30 bg-status-warning/10 p-4"
      data-testid="cert-practitioner-disclaimer"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-warning" aria-hidden="true" />
      <p className="text-sm text-foreground">{PRACTITIONER_DISCLAIMER}</p>
    </div>

    {(manifest.learnSections ?? []).map((section, index) => {
      const entry = SECTION_COMPONENTS.get(section.id)
      if (!entry) return null
      const { Component, group } = entry
      const Icon = GROUP_ICON.get(group) ?? Compass
      return (
        <LearnSection
          key={section.id}
          sectionId={section.id}
          title={section.label}
          icon={<Icon size={20} className="text-primary" />}
          defaultOpen={index === 0}
        >
          <Component />
        </LearnSection>
      )
    })}

    <div className="flex items-center justify-start">
      <Button variant="gradient" onClick={onNavigateToWorkshop}>
        <BadgeCheck size={16} className="mr-2" aria-hidden="true" />
        Start Workshop
      </Button>
    </div>
    <ReadingCompleteButton />
  </div>
)
