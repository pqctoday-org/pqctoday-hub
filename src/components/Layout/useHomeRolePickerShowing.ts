// SPDX-License-Identifier: AGPL-3.0-only
import { usePersonaStore } from '@/store/usePersonaStore'

/**
 * True while `/` is showing the first-run role picker: no role picked and
 * "Show me everything" not chosen — the same condition LandingView uses to
 * render RoleHomeView. The page-level "Related content" and "Next step"
 * blocks stay off then: until 2026-11-14 they rendered under the role cards,
 * pointing a first-time visitor somewhere else before they had picked a role.
 */
export function useHomeRolePickerShowing(route: string): boolean {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const hasSkippedPersonalization = usePersonaStore((s) => s.hasSkippedPersonalization)
  return route === '/' && !selectedPersona && !hasSkippedPersonalization
}
