// SPDX-License-Identifier: AGPL-3.0-only
import { Eyebrow } from '@/components/storybook'
import { COPY } from './copy'

/**
 * The drawer header's objective area: "Objective", the focused objective's title, its state chip,
 * "Switch", "Go to your current step" and the update link.
 *
 * SEAM FOR THE JOURNEY LANE. Objectives belong to the journey store; the drawer only gives the
 * header a place for them. Replace the body of this component (keep its name and file) with the
 * focused objective. With no objective it must keep showing "No objective yet".
 */
export function ObjectiveHeaderSlot() {
  return (
    <div data-testid="objective-header-slot">
      <Eyebrow as="p">Objective</Eyebrow>
      <p className="text-xs text-muted-foreground">{COPY.noObjective}</p>
    </div>
  )
}
