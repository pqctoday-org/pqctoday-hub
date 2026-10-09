// SPDX-License-Identifier: GPL-3.0-only
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'

/**
 * A one-line prompt shown above a phone page, on every page except the home page, to a visitor who has
 * not picked a role yet. It replaces the full-page role picker those pages used to show: a phone visitor
 * (and a search crawler, which never has a stored role) gets the page they asked for, with its text,
 * and picks a role from here instead. "Pick your role" opens the same role sheet as the header's role
 * pill; the cross dismisses the prompt for good, exactly like Skip on the picker.
 */
export function MobileRolePrompt({ onPick }: { onPick: () => void }) {
  const skipPersonalization = usePersonaStore((s) => s.skipPersonalization)
  const markPickerSeen = usePersonaStore((s) => s.markPickerSeen)

  return (
    <div
      role="region"
      aria-label="Choose your role"
      data-testid="mobile-role-prompt"
      className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
    >
      <p className="min-w-0 flex-1 text-[12.5px] text-foreground">
        Pick a role to tune what you see.
      </p>
      <Button
        type="button"
        onClick={onPick}
        className="h-8 shrink-0 rounded-lg bg-primary px-3 text-[12px] font-bold text-primary-foreground"
      >
        Pick your role
      </Button>
      <Button
        type="button"
        variant="ghost"
        aria-label="Dismiss"
        onClick={() => {
          skipPersonalization()
          markPickerSeen()
        }}
        className="h-8 w-8 shrink-0 p-0"
      >
        <X size={14} aria-hidden="true" />
      </Button>
    </div>
  )
}
