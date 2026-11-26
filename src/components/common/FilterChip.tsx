// SPDX-License-Identifier: AGPL-3.0-only
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FilterChip = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-chip text-xs text-chip-foreground font-bold">
    {label}
    <Button
      variant="ghost"
      onClick={onClear}
      aria-label={`Remove ${label} filter`}
      className="hover:text-foreground transition-colors"
    >
      <X size={12} />
    </Button>
  </span>
)
