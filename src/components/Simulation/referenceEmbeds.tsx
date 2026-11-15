// SPDX-License-Identifier: AGPL-3.0-only
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
import { lazy, type FC } from 'react'
import { markSimResume } from './simChrome'
import { MigrateWorkbenchEmbed } from '@/components/shared/widgets/MigrateWorkbenchEmbed'
import { LibraryEmbed } from '@/components/shared/widgets/LibraryEmbed'
import { ComplianceEmbed } from '@/components/shared/widgets/ComplianceEmbed'
import { ThreatsEmbed } from '@/components/shared/widgets/ThreatsEmbed'
import { ReportEmbed } from '@/components/shared/widgets/ReportEmbed'
import { MigrationVerification } from '@/components/BusinessCenter/tools/MigrationVerification'

export interface ReferenceEmbedProps {
  /** The step link's query string (e.g. `tab=landscape&industry=…`), for
   *  widgets that open on a tab or filter. Widgets that need none ignore it. */
  params?: string
}

export interface ReferenceEmbedSpec {
  /** Header chip label shown under the Simulation-mode bar. */
  label: string
  Component: FC
  /** For widgets that open on a tab or filter: rendered instead of
   *  `Component`, with the step link's query string. */
  ParamsComponent?: FC<ReferenceEmbedProps>
}

// Whole pages, loaded only when a player opens one, so the simulation's own
// bundle does not carry them. Rendered inside the sim pane's <Suspense>.
const LazyAlgorithms = lazy(() =>
  import('@/components/shared/widgets/AlgorithmsPageEmbed').then((m) => ({
    default: m.AlgorithmsPageEmbed,
  }))
)
const LazyLeaders = lazy(() =>
  import('@/components/shared/widgets/LeadersEmbed').then((m) => ({ default: m.LeadersEmbed }))
)
const LazyPatents = lazy(() =>
  import('@/components/shared/widgets/PatentsEmbed').then((m) => ({ default: m.PatentsEmbed }))
)
const LazyExplore = lazy(() =>
  import('@/components/shared/widgets/ExploreEmbed').then((m) => ({ default: m.ExploreEmbed }))
)
const AlgorithmsRef: FC<ReferenceEmbedProps> = ({ params }) => <LazyAlgorithms params={params} />
const LeadersRef: FC<ReferenceEmbedProps> = ({ params }) => <LazyLeaders params={params} />
const PatentsRef: FC<ReferenceEmbedProps> = ({ params }) => <LazyPatents params={params} />
const ExploreRef: FC = () => <LazyExplore onLeave={markSimResume} />
const noParams =
  (C: FC<ReferenceEmbedProps>): FC =>
  () => <C />

export const SIM_REFERENCE_EMBEDS: Record<string, ReferenceEmbedSpec> = {
  migrate: { label: 'Migrate', Component: MigrateWorkbenchEmbed },
  library: { label: 'Library', Component: LibraryEmbed },
  compliance: { label: 'Compliance', Component: ComplianceEmbed },
  // compliance-cert-check deep-links a specific cert (?cert=) on the standalone page;
  // embedded it shows the same Compliance view, opened on that same record (WP5.5 —
  // SimulationView parses the step's `?cert=` and passes it through as a prop).
  'compliance-cert-check': { label: 'Compliance', Component: ComplianceEmbed },
  threats: { label: 'Threats', Component: ThreatsEmbed },
  report: { label: 'Executive Report', Component: ReportEmbed },
  // Same Command-Center tool component VC.2's `activity` step embeds (imported
  // directly rather than via the lazy-loaded BUSINESS_TOOL_COMPONENTS registry,
  // matching every other entry here being a plain, non-lazy component) — reused
  // as-is, since it's already embed-safe there with no simEmbed prop needed.
  'migration-verification': { label: 'Migration Verification', Component: MigrationVerification },
  // The Resources tab's remaining pages (owner decision 2026-11-14, NAV-2):
  // each opened in place instead of leaving the run.
  'algorithms-catalog': {
    label: 'Algorithms',
    Component: noParams(AlgorithmsRef),
    ParamsComponent: AlgorithmsRef,
  },
  'algorithms-validation': {
    label: 'Algorithms',
    Component: noParams(AlgorithmsRef),
    ParamsComponent: AlgorithmsRef,
  },
  'industry-landscape': {
    label: 'Industry landscape',
    Component: noParams(AlgorithmsRef),
    ParamsComponent: AlgorithmsRef,
  },
  leaders: { label: 'Community', Component: noParams(LeadersRef), ParamsComponent: LeadersRef },
  patents: { label: 'Patents', Component: noParams(PatentsRef), ParamsComponent: PatentsRef },
  explore: { label: 'Explore', Component: ExploreRef },
}
