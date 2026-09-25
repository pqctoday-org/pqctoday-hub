// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { SOURCES, type ModuleSource, type SourceId } from '../data/sources'

interface CiteProps {
  /** Source key from data/sources.ts. */
  s: SourceId
  /** Section / algorithm / table locator inside that source, e.g. "§5.4". */
  at?: string
}

/**
 * Bracketed inline citation to a primary source. Kept deliberately small: the
 * point is that every claim carries its source where it is made, not in a
 * footnote a reader has to hunt for.
 */
export const Cite: React.FC<CiteProps> = ({ s, at }) => {
  const src: ModuleSource = SOURCES[s]
  const label = at ? `${src.short} ${at}` : src.short
  return (
    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
      [
      <a
        href={src.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        title={src.revision ? `${src.title} (${src.revision})` : src.title}
      >
        {label}
      </a>
      ]
    </span>
  )
}
