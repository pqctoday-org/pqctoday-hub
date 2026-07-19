// SPDX-License-Identifier: GPL-3.0-only
/**
 * ComplianceEmbed — renders the Compliance view inside the simulation (under the
 * "● Simulation mode" header) instead of navigating the player out to /compliance.
 *
 * ComplianceView is URL-driven (its filter/tab state syncs via useComplianceUrlState
 * → useSearchParams), which inside /simulation would corrupt the sim's route, and it
 * can't nest its own <Router>. Its `simEmbed` prop backs that state with LOCAL state,
 * hides the PageHeader, and hides the URL-writing tier filters — the same approach as
 * MigrateEmbed/LibraryEmbed.
 */
import { ComplianceView } from '@/components/Compliance/ComplianceView'

export function ComplianceEmbed({ initialTab, cert }: { initialTab?: string; cert?: string } = {}) {
  return <ComplianceView simEmbed initialTab={initialTab} initialCert={cert} />
}
