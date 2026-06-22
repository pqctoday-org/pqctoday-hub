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

export function MigrateWorkbenchEmbed() {
  return <MigrationWorkbench embedded />
}
