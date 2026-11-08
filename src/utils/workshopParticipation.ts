// SPDX-License-Identifier: AGPL-3.0-only
import type { WorkshopCompletionSignal } from '@/types/Workshop'

/** Activity credit is not a per-task check or a technical test result. */
export function describeWorkshopParticipation(signal?: WorkshopCompletionSignal): string {
  const manual =
    'Review the activity, then use the manual completion control; this action is not observed automatically.'
  if (!signal) return manual
  switch (signal.kind) {
    case 'route-visited':
      return `Viewing ${signal.route} can mark participation in the current step. It does not establish that its tasks or tests passed.`
    case 'assessment-complete':
      return 'A newly completed assessment on this step’s resource can mark participation. Earlier assessment work is not counted automatically.'
    case 'module-progress':
      return `${signal.minSteps} newly recorded module activities on this step’s resource can mark participation. Earlier progress is not counted automatically; this is not a technical test result.`
    case 'bookmark-added':
      return signal.surface === 'library' || signal.surface === 'timeline'
        ? `A new ${signal.surface} bookmark on this step’s resource can mark participation. Earlier bookmarks are not counted automatically.`
        : manual
    case 'filter-applied':
      return manual
  }
}
