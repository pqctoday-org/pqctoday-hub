// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface ProvesPanelProps {
  proves: string[]
  doesNotProve: string[]
}

/** "What this proves / does not prove" — shown on every screen of the lab. */
export const ProvesPanel: FC<ProvesPanelProps> = ({ proves, doesNotProve }) => (
  <section
    aria-label="What this proves and does not prove"
    data-testid="evidence-proves-panel"
    className="glass-panel p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
  >
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
        <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" />
        What this proves
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
        {proves.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
        <XCircle size={14} className="text-status-error" aria-hidden="true" />
        What this does not prove
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
        {doesNotProve.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  </section>
)
