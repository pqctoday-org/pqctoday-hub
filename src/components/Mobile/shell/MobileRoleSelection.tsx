// SPDX-License-Identifier: GPL-3.0-only
import { RoleHomeView } from '@/components/RoleHome/RoleHomeView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MobileSheet } from '../primitives/Sheet'

/**
 * "Who's asking?" (handoff "Role selection"). Reuses RoleHomeView verbatim —
 * same six persona cards, same hand-authored urgency/first-win copy the
 * desktop LandingView shows for the identical no-persona state, not a
 * duplicated mobile copy.
 *
 * Two render modes, sharing one component:
 *  - First run (`variant="firstRun"`): renders as normal scrollable content
 *    inside MainLayout's regular header/content/bottom-nav column — not a
 *    fixed full-viewport takeover. An earlier version used `fixed inset-0`,
 *    which visually covered the header and bottom nav even after they were
 *    made to render during first run — real gap found by the user directly
 *    ("i dont see the top bar and bottom bar"), confirmed via a
 *    zero-header/zero-nav DOM check, and against the target design screenshot
 *    (which shows both chrome elements present on the first-run screen). No
 *    dismiss — matches the handoff ("Happens once, on first run... there is
 *    no intermediate confirmation screen"). Skipping is still offered
 *    (RoleHomeView's own "Show me everything" footer), it just isn't a sheet
 *    you can flick away.
 *  - Later switching (`variant="switch"`): the SAME cards in a dismissible
 *    MobileSheet, opened from the header's role pill — "the role is changed
 *    from the header pill, never re-asked [about region/industry]".
 */
export interface MobileRoleSelectionProps {
  variant: 'firstRun' | 'switch'
  /** Only used by `variant="switch"`. */
  open?: boolean
  onClose?: () => void
}

export function MobileRoleSelection({ variant, open, onClose }: MobileRoleSelectionProps) {
  const setPersona = usePersonaStore((s) => s.setPersona)
  const skipPersonalization = usePersonaStore((s) => s.skipPersonalization)
  const markPickerSeen = usePersonaStore((s) => s.markPickerSeen)

  const handleSelect = (id: Parameters<typeof setPersona>[0]) => {
    setPersona(id)
    markPickerSeen()
    onClose?.()
  }

  const handleSkip = () => {
    skipPersonalization()
    markPickerSeen()
    onClose?.()
  }

  if (variant === 'firstRun') {
    return <RoleHomeView onSelectPersona={handleSelect} onSkip={handleSkip} />
  }

  return (
    <MobileSheet
      open={open ?? false}
      onClose={() => onClose?.()}
      title="Change role"
      titleId="mobile-role-switch-title"
      maxHeightClassName="max-h-[85dvh]"
      large
      testId="mobile-role-switch"
    >
      <RoleHomeView onSelectPersona={handleSelect} onSkip={handleSkip} />
    </MobileSheet>
  )
}
