// SPDX-License-Identifier: GPL-3.0-only
/**
 * ReportEmbed — renders the Executive Report INSIDE the simulation instead of
 * navigating the player out to /report.
 *
 * The `report` reference step appears in several trees (p3, p4, verify-close,
 * foundations). Before this widget it was the one full-page reference with no
 * embed, so those steps navigated away and broke the "stay under the sim header"
 * rule. ReportView already supports a `simEmbed` prop that hides its breadcrumb +
 * PageHeader and reads (never writes) the page URL, so embedding is a thin wrapper
 * — same pattern as MigrateEmbed. Completion is the standard visited-ref mark
 * (reviewed-on-open).
 */
import { ReportView } from '@/components/Report/ReportView'

export function ReportEmbed() {
  return <ReportView simEmbed />
}
