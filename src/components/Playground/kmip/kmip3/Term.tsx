// SPDX-License-Identifier: GPL-3.0-only
//
// Term — glossary-aware label wrapper. Native `<abbr title>` for an
// immediate, keyboard-accessible tooltip (same idiom already used by
// `KmipPlaygroundView.tsx`'s local `Term`/`GLOSSARY`, generalized to the full
// wire-tag + concept glossary and wired to `GlossaryContext` so hover/focus
// also pins the rail's "now viewing" card.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useGlossary } from './GlossaryContext'
import { lookupGlossaryDef } from './glossary'

export function Term({
  glossaryKey,
  children,
  className,
}: {
  /** A `TAG_GLOSSARY` tag name or `TERMS` id. */
  glossaryKey: string
  children: ReactNode
  className?: string
}) {
  const { setActive } = useGlossary()
  const def = lookupGlossaryDef(glossaryKey)

  if (!def) return <>{children}</>

  return (
    <abbr
      title={def}
      onMouseEnter={() => setActive(glossaryKey)}
      onFocus={() => setActive(glossaryKey)}
      className={cn(
        'cursor-help border-b border-dotted border-muted-foreground/60 no-underline',
        className
      )}
    >
      {children}
    </abbr>
  )
}
