// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import { FileClock } from 'lucide-react'

/**
 * Placeholder every stub renders until its owner replaces the file (build spec
 * §4). Visible on purpose: a stub must never read as finished content.
 */
export const DraftPending = ({ owner }: { owner: string }) => (
  <div
    className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground"
    data-testid="draft-pending"
  >
    <FileClock size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    <span>
      <strong className="text-foreground">Draft — content pending</strong> ({owner} author)
    </span>
  </div>
)
