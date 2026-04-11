// SPDX-License-Identifier: GPL-3.0-only
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FilterChip = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium">
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
