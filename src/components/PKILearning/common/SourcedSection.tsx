// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { getStandard } from '@/data/standardsRegistry'

/** One lesson sentence that reports what a named Library document says, with the place it rests on. */
export interface SourcedSentence {
  id: string
  text: string
  /** Library reference id of the document the sentence rests on */
  sourceId: string
  /** Edition of the document, as the sentence was read */
  edition: string
  /** Where in the document the sentence rests */
  locator: string
}

export interface SourcedBlock {
  heading: string
  /** At most one sentence linking the block to the one before; a signpost, not a fact */
  bridge?: string
  sentences: SourcedSentence[]
}

export interface SourcedSectionData {
  /** Learn-section id, as listed in the module manifest */
  id: string
  title: string
  /** What the section is about and why it matters; a signpost, not a fact */
  lead: string
  blocks: SourcedBlock[]
}

export const SourcedLine: React.FC<{ sentence: SourcedSentence }> = ({ sentence }) => {
  const std = getStandard(sentence.sourceId)
  return (
    <li className="p-3 rounded-lg bg-muted/50 border border-border" data-claim={sentence.id}>
      <p className="text-sm text-foreground">{sentence.text}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Source:{' '}
        <Link to={std.deepLink} className="text-primary hover:underline">
          {sentence.edition}
        </Link>
        , {sentence.locator}
      </p>
    </li>
  )
}

/** The body of a lesson section built only from sourced sentences: a lead, then blocks under headings. */
export const SourcedSectionBody: React.FC<{ section: SourcedSectionData }> = ({ section }) => (
  <div className="space-y-5" data-sourced-section={section.id}>
    <p className="text-sm text-foreground/80">{section.lead}</p>
    {section.blocks.map((block) => (
      <div key={block.heading} className="space-y-2">
        <h3 className="font-semibold text-foreground">{block.heading}</h3>
        {block.bridge ? <p className="text-sm text-foreground/80">{block.bridge}</p> : null}
        <ul className="space-y-2">
          {block.sentences.map((s) => (
            <SourcedLine key={s.id} sentence={s} />
          ))}
        </ul>
      </div>
    ))}
  </div>
)
