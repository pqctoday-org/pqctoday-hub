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
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import type { MigrateTab } from '@/store/useMigrateSelectionStore'
import type { DomainId } from '@/data/migrationAssets'

// Which real workbench view each sim catalog step opens on.
//   discovery       → the "Discovery & validation tooling" domain in the Replace tab.
//                     Deliberately NOT scoped to the player's product selection
//                     (07192026, H1): this catalog step is about discovery TOOLING
//                     (scanners, CT-log tooling), which the player's own estate
//                     doesn't meaningfully filter — and P1 already consumes the
//                     real selection through crypto-vulnerability-watch. Forcing
//                     the selection in here would be a weak fit, not a strong one.
//   pilots          → plan-aware (07192026, H1 — closes the WP5.4 "cosmetic-only"
//                     partial): when the player has committed real assets to
//                     their migration plan on /migrate, the pilot-picking step
//                     opens on the Plan tab — their own selection IS the pilot
//                     candidate list. With no plan yet, it opens on Replace to
//                     browse and pick, as before.
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
  const hasPlan = useMigrateSelectionStore((s) => s.plan.length > 0)
  let focus = catalogId ? CATALOG_FOCUS[catalogId] : undefined
  if (catalogId === 'pilots' && hasPlan) focus = { tab: 'plan' }
  return <MigrationWorkbench embedded focus={focus} />
}
