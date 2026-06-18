// SPDX-License-Identifier: GPL-3.0-only
/**
 * SIM_REFERENCE_EMBEDS — the full-page reference resources that open EMBEDDED in
 * the sim (under the "● Simulation mode" header) instead of navigating away to
 * their own route, so the player always knows they're still in a simulation run.
 *
 * Each entry maps a REFERENCE_PHASES refId to its embed widget. Completion is the
 * standard visited-ref mark (set on open — a "reviewed" reference). The pure refId
 * set lives in `embedContract` (REFERENCE_EMBED_IDS) so canEmbedStep stays free of
 * component imports; `referenceEmbeds.test.ts` keeps the two in sync.
 *
 * Adding a reference (e.g. library / compliance / threats / report) = (1) make its
 * View accept a `simEmbed` prop that hides its PageHeader and stops it writing to
 * the page URL (see MigrateView / MigrateEmbed for the pattern), (2) add an embed
 * widget, (3) add an entry here + the id to REFERENCE_EMBED_IDS.
 */
import type { FC } from 'react'
import { MigrateEmbed } from '@/components/shared/widgets/MigrateEmbed'
import { LibraryEmbed } from '@/components/shared/widgets/LibraryEmbed'
import { ComplianceEmbed } from '@/components/shared/widgets/ComplianceEmbed'
import { ThreatsEmbed } from '@/components/shared/widgets/ThreatsEmbed'

export interface ReferenceEmbedSpec {
  /** Header chip label shown under the Simulation-mode bar. */
  label: string
  Component: FC
}

export const SIM_REFERENCE_EMBEDS: Record<string, ReferenceEmbedSpec> = {
  migrate: { label: 'Migrate', Component: MigrateEmbed },
  library: { label: 'Library', Component: LibraryEmbed },
  compliance: { label: 'Compliance', Component: ComplianceEmbed },
  // compliance-cert-check deep-links a specific cert (?cert=) on the standalone page;
  // embedded it shows the same Compliance view (the cert param is dropped in-sim).
  'compliance-cert-check': { label: 'Compliance', Component: ComplianceEmbed },
  threats: { label: 'Threats', Component: ThreatsEmbed },
}
