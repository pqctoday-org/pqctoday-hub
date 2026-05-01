// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilteredChipProps {
  context: string
  hiddenCount: number
  onRestore: (e: React.MouseEvent) => void
}

export const FilteredChip: React.FC<FilteredChipProps> = ({ context, hiddenCount, onRestore }) => (
  <Button
    variant="ghost"
    type="button"
    onClick={onRestore}
    className="flex items-center gap-1.5 text-xs px-2.5 py-1 h-auto rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 print:hidden"
    aria-label={`${hiddenCount} items filtered for ${context}. Click to restore.`}
  >
    <Filter size={11} aria-hidden="true" />
    Filtered for {context} · {hiddenCount} hidden · Restore
  </Button>
)
