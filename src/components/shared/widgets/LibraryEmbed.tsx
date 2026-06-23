// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryEmbed — renders the PQC Library inside the simulation (under the
 * "● Simulation mode" header) instead of navigating the player out to /library.
 *
 * LibraryViewRedesign is URL-driven (it reads/writes filters via useSearchParams),
 * which inside /simulation would corrupt the sim's own route, and it can't be
 * wrapped in its own <Router> (React Router forbids nested routers). Its `simEmbed`
 * prop backs the filter URL state with LOCAL state and hides the PageHeader so the
 * sim bar stays on top — the same approach as MigrateEmbed/MigrateView.
 *
 * Renders the redesigned library (the default /library page) so the sim shows the
 * same surface as the standalone route — NOT the legacy LibraryView (/library/legacy).
 */
import { LibraryViewRedesign } from '@/components/Library/redesign/LibraryViewRedesign'

export function LibraryEmbed({ query }: { query?: string } = {}) {
  return <LibraryViewRedesign simEmbed simEmbedQuery={query} />
}
