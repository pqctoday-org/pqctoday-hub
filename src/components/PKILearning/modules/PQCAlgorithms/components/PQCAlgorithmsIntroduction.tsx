// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  KeyRound,
  Layers,
  Lock,
  PenLine,
  Hash,
  Landmark,
  AlertTriangle,
  Code2,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import { LESSON_OUTLINE, type OutlineBlock, type OutlineSection } from '../data/lessonOutline'
import { ClaimLine } from './ClaimLine'

interface Props {
  onNavigateToWorkshop: () => void
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'two-jobs-new-tools': <KeyRound size={20} className="text-primary" />,
  'the-families-at-a-glance': <Layers size={20} className="text-primary" />,
  'ml-kem-fips-203': <Lock size={20} className="text-primary" />,
  'ml-dsa-fips-204': <PenLine size={20} className="text-primary" />,
  'hash-based-signatures-in-brief': <Hash size={20} className="text-primary" />,
  'how-standards-bodies-map-use-cases-to-algorithms': (
    <Landmark size={20} className="text-primary" />
  ),
  'common-pitfalls-noted-in-the-standards': <AlertTriangle size={20} className="text-primary" />,
}

const PANEL_LABEL = {
  developers: { label: 'For developers', icon: <Code2 size={16} className="text-primary" /> },
  validation: {
    label: 'For validation engineers',
    icon: <ClipboardCheck size={16} className="text-primary" />,
  },
} as const

const BlockBody: React.FC<{ block: OutlineBlock }> = ({ block }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-foreground">{block.heading}</h3>
    {block.bridge ? <p className="text-sm text-muted-foreground">{block.bridge}</p> : null}
    {block.claims.map((id) => (
      <ClaimLine key={id} id={id} />
    ))}
  </div>
)

const Block: React.FC<{ block: OutlineBlock }> = ({ block }) => {
  if (block.panel === 'none') return <BlockBody block={block} />
  const { label, icon } = PANEL_LABEL[block.panel]
  return (
    <CollapsibleSection title={`${label}: ${block.heading}`} icon={icon} className="bg-muted/30">
      <div className="space-y-2" data-panel={block.panel}>
        {block.bridge ? <p className="text-sm text-muted-foreground">{block.bridge}</p> : null}
        {block.claims.map((id) => (
          <ClaimLine key={id} id={id} />
        ))}
      </div>
    </CollapsibleSection>
  )
}

const GoDeeper: React.FC<{ links: OutlineSection['goDeeper'] }> = ({ links }) => (
  <p className="text-sm text-muted-foreground">
    Go deeper:{' '}
    {links.map((m, i) => (
      <React.Fragment key={m.to}>
        {i > 0 ? ', ' : ''}
        <Link to={m.to} className="text-primary hover:underline">
          {m.label}
        </Link>
      </React.Fragment>
    ))}
  </p>
)

export const PQCAlgorithmsIntroduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      {LESSON_OUTLINE.map((section, i) => (
        <LearnSection
          key={section.id}
          sectionId={section.id}
          title={`${i + 1}. ${section.title}`}
          icon={SECTION_ICONS[section.id]}
          defaultOpen={i === 0}
        >
          <p className="text-muted-foreground">{section.lead}</p>
          {section.blocks.map((block) => (
            <Block key={block.heading} block={block} />
          ))}
          <GoDeeper links={section.goDeeper} />
          {i === LESSON_OUTLINE.length - 1 ? (
            <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
              Open the Workshop <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : null}
        </LearnSection>
      ))}

      <ReadingCompleteButton />
    </div>
  )
}
