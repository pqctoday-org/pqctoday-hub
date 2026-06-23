// SPDX-License-Identifier: GPL-3.0-only
/**
 * MigrateWorkbenchEmbed — renders the new PQC Migration Workbench inside the
 * simulation, under the "● Simulation mode" header.
 *
 * The /migrate route renders `MigrationWorkbench` (the redesign), but the sim's
 * Migrate reference embed was still pointing at the legacy `MigrateView` catalog
 * ("Enterprise Infrastructure Stack") — so the sim showed an old design the live
 * page no longer uses. MigrationWorkbench already ships an `embedded` prop made
 * for exactly this (hides the PageHeader, keeps filter state off the URL), so the
 * embed is a thin wrapper — same pattern as the other reference embeds.
 */
import { MigrationWorkbench } from '@/components/Migrate/Workbench/MigrationWorkbench'
import type { MigrateTab } from '@/store/useMigrateSelectionStore'
import type { DomainId } from '@/data/migrationAssets'

// Which real workbench view each sim catalog step opens on. Only the two catalog
// ids with a genuine matching surface are wired (the CBOM ones were dropped):
//   discovery → the "Discovery & validation tooling" domain in the Replace tab
//   pilots    → the Replace tab (browse & pick Tier-1 assets to pilot)
const CATALOG_FOCUS: Record<string, { tab: MigrateTab; domain?: DomainId }> = {
  discovery: { tab: 'replace', domain: 'discovery' },
  pilots: { tab: 'replace' },
}

export function MigrateWorkbenchEmbed({ catalogId }: { catalogId?: string }) {
  const focus = catalogId ? CATALOG_FOCUS[catalogId] : undefined
  return <MigrationWorkbench embedded focus={focus} />
}
