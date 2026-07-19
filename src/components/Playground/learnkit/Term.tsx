// SPDX-License-Identifier: GPL-3.0-only
//
// Term — glossary-aware label wrapper. Native `<abbr title>` for an
// immediate, keyboard-accessible tooltip, wired to `GlossaryContext` so
// hover/focus also pins the rail's "now viewing" card. Definition comes
// from whichever `GlossaryData` the enclosing `GlossaryProvider` was given.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useGlossary } from './GlossaryContext'

export function Term({
  glossaryKey,
  children,
  className,
}: {
  /** A key into the active `GlossaryData.tagGlossary` or `terms[].id`. */
  glossaryKey: string
  children: ReactNode
  className?: string
}) {
  const { setActive, data } = useGlossary()
  const def = data.lookupDef(glossaryKey)

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
