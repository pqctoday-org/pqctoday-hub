// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared-widget re-export of ReportTimelineStrip so Business Center and other
 * callers can embed the country PQC-phase strip without reaching into
 * `components/Report/`. The Report still owns the canonical implementation;
 * this module is a stable import path for consumers outside Report.
 */
export { ReportTimelineStrip as CountryTimelineStrip } from '@/components/Report/ReportTimelineStrip'
