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

// Which real workbench view each sim catalog step opens on.
//   discovery       → the "Discovery & validation tooling" domain in the Replace tab
//   pilots          → the Replace tab (browse & pick Tier-1 assets to pilot)
//   cyclonedx-export → the Plan tab's real "Export plan + CBOM" button
//                      (PlanTab.tsx's downloadPlanCbom — CycloneDX-flavoured JSON
//                      keyed to the player's own migration plan). Wave 5 (WP5.2):
//                      re-added after being dropped for lacking a matching surface
//                      — this one has a genuine, real button, unlike a hypothetical
//                      standalone "cbom-scanner" catalog view, which still doesn't
//                      exist anywhere in the workbench (discovery already covers
//                      that ground) and stays deliberately unmapped.
const CATALOG_FOCUS: Record<string, { tab: MigrateTab; domain?: DomainId }> = {
  discovery: { tab: 'replace', domain: 'discovery' },
  pilots: { tab: 'replace' },
  'cyclonedx-export': { tab: 'plan' },
}

export function MigrateWorkbenchEmbed({ catalogId }: { catalogId?: string }) {
  const focus = catalogId ? CATALOG_FOCUS[catalogId] : undefined
  return <MigrationWorkbench embedded focus={focus} />
}
