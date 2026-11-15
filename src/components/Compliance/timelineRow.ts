// SPDX-License-Identifier: AGPL-3.0-only
import type { TimelineEvent } from '@/types/timeline'
import type { TimelineDocumentRow } from '@/components/Timeline/TimelineDocumentDetailPopover'

/** The record the shared timeline panel shows for one event. */
export function timelineEventToRow(ev: TimelineEvent): TimelineDocumentRow {
  return {
    countryName: ev.countryName,
    org: ev.orgName,
    phase: ev.phase,
    type: ev.type,
    title: ev.title,
    eventId: ev.eventId,
    startYear: ev.startYear,
    endYear: ev.endYear,
    description: ev.description,
    sourceUrl: ev.sourceUrl,
    sourceDate: ev.sourceDate,
    status: ev.status,
    bindingForce: ev.bindingForce,
    mandateType: ev.mandateType,
    reviewStatus: ev.reviewStatus,
    complianceRefs: ev.complianceRefs,
  }
}
