// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { GitBranch } from 'lucide-react'
import { Button } from './button'
import { HistoryModal } from './HistoryModal'

interface HistoryButtonProps {
  itemId: string
  /** LM-ID (e.g. "LM-001") for learn modules, PT-ID (e.g. "PT-001") for tools */
  trackingId: string
  itemLabel?: string
  version?: string
  lastReviewed?: string
}

export const HistoryButton = ({
  itemId,
  trackingId,
  itemLabel,
  version,
  lastReviewed,
}: HistoryButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Convert "LM-001" → "lm-001" for GitHub label matching
  const ghLabel = trackingId.toLowerCase()

  const label = itemLabel ?? `${trackingId} · ${itemId}`

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20"
        aria-label={`View revision history for ${label}`}
        title={version ? `v${version}` : undefined}
      >
        <GitBranch size={14} />
        {version && <span className="text-xs font-mono text-muted-foreground">v{version}</span>}
      </Button>

      <HistoryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        itemId={itemId}
        itemLabel={label}
        version={version}
        lastReviewed={lastReviewed}
        ghLabel={ghLabel}
      />
    </>
  )
}
