// SPDX-License-Identifier: GPL-3.0-only
/**
 * ThreatsEmbed — renders the Quantum Threats dashboard inside the simulation (under
 * the "● Simulation mode" header) instead of navigating the player out to /threats.
 *
 * ThreatsDashboard is URL-driven (filters sync via useSearchParams) and renders the
 * URL-writing TrustTierFilter, both of which would corrupt the sim route. Its
 * `simEmbed` prop backs filter state with LOCAL state, hides the PageHeader, and
 * hides the tier filter — the same approach as MigrateEmbed/LibraryEmbed.
 */
import { ThreatsDashboard } from '@/components/Threats/ThreatsDashboard'

export function ThreatsEmbed({ initialTab }: { initialTab?: 'list' | 'horizon' } = {}) {
  return <ThreatsDashboard simEmbed initialTab={initialTab} />
}
