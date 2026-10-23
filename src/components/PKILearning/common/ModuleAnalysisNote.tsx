// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'

/**
 * Marks a sentence, list or table cell that is the module's own reading of the cited sources,
 * not something the sources state. Small, italic and muted, so it stays visible without
 * competing with the text. Every Learn section that separates sourced statements from the
 * module's own reasoning uses this one form.
 */
export const ModuleAnalysisNote = ({ children }: { children: ReactNode }) => (
  <em data-testid="module-analysis" className="text-xs text-muted-foreground">
    {children}
  </em>
)
