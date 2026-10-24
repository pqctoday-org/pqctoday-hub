// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
/**
 * Learn tab. Renders every manifest `learnSections` entry, in manifest order,
 * inside the shared <LearnSection> (anchor, read tracking, path scope,
 * "Optional reference" badge, off-path hiding) and delegates the body to the
 * owner's section component via sectionRegistry.ts (build spec §4). Authors
 * never edit this file.
 */
import { Link } from 'react-router'
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
import { CertificationContexts, CertificationContextsPointer } from './CertificationContexts'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MODULE_LAST_REVIEWED } from '@/data/moduleContentRegistry'
import { ownerReviewStatusText } from '@/components/PKILearning/common/moduleReviewStatus'
import { PRACTITIONER_DISCLAIMER, type SectionEntry, type SectionGroup } from './sectionRegistry'

const GROUP_ICON = new Map<SectionGroup, LucideIcon>([
  ['core', Compass],
  ['fips', ShieldCheck],
  ['cc-eu', Landmark],
  ['pci', CreditCard],
  ['shared', Atom],
])

interface CertIntroductionProps {
  /** The module whose learnSections are rendered, in manifest order. */
  manifest: ModuleManifest
  /** That module's section id → owner component registry. */
  sections: ReadonlyMap<string, SectionEntry>
  onNavigateToWorkshop: () => void
}

/**
 * Shared Learn-tab renderer for the four certification modules (LM-065
 * fundamentals, LM-067 FIPS 140-3, LM-068 CC/EUCC/eIDAS, LM-071 PCI): the
 * practitioner disclaimer once, then each manifest section from the module's
 * own registry.
 */
export const CertIntroduction = ({
  manifest,
  sections,
  onNavigateToWorkshop,
}: CertIntroductionProps) => {
  const persona = usePersonaStore((state) => state.selectedPersona)
  const engineer = persona === 'cert-engineer'
  // The reader-role orientation is for the Fundamentals module only. This box is shared by the
  // four certification modules, and the other three keep the sentence they have always shown.
  const engineerOrientation = engineer && manifest.id === 'crypto-product-certification'

  return (
    <div className="w-full space-y-6">
      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-status-warning/30 bg-status-warning/10 p-4"
        data-testid="cert-practitioner-disclaimer"
      >
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-status-warning"
          aria-hidden="true"
        />
        <p className="text-sm text-foreground">
          {PRACTITIONER_DISCLAIMER} {ownerReviewStatusText(MODULE_LAST_REVIEWED[manifest.id])}
        </p>
      </div>

      <div
        className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground"
        data-testid="cert-audience-route"
      >
        <p className="font-semibold">
          {engineer ? 'Certification engineer route' : 'General security practitioner route'}
        </p>
        {engineerOrientation ? (
          <ul className="mt-1 space-y-1 text-foreground/80" data-testid="cert-route-orientation">
            <li>
              <strong className="font-semibold text-foreground">Lab tester:</strong> see who tests
              and who decides in each scheme, and where a lab’s report fits.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Vendor engineer:</strong> learn what
              each certificate covers, so a claim about your product matches its record.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Scheme reviewer:</strong> check
              which document, version and scope to read before you apply a scheme’s rules.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Next on this path:</strong>{' '}
              <Link
                className="text-primary underline-offset-2 hover:underline"
                to="/learn/fips-140-3-certification"
              >
                FIPS 140-3 Certification
              </Link>
              , then{' '}
              <Link
                className="text-primary underline-offset-2 hover:underline"
                to="/learn/acvp-lab-workflow"
              >
                ACVP Lab Workflow
              </Link>
              , which follows a vector set through to evidence. No test vectors are run in this
              module.
            </li>
          </ul>
        ) : (
          <p className="mt-1 text-foreground/80">
            {engineer
              ? 'Use the exact document revisions, requirement components, evidence boundaries and review questions. Workshop exports are structured as inputs to a laboratory or certification-body discussion.'
              : 'Focus on what each certificate can support, where its boundary stops, and which claims need confirmation. Exact component and submission details remain available as cited reference material.'}
          </p>
        )}
      </div>

      {['crypto-product-certification', 'cc-eucc-certification'].includes(manifest.id) && (
        <CertificationContexts />
      )}
      {manifest.id === 'fips-140-3-certification' && <CertificationContextsPointer />}

      {(manifest.learnSections ?? []).map((section, index) => {
        const entry = sections.get(section.id)
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
}
