// SPDX-License-Identifier: GPL-3.0-only
/**
 * MigrateEmbed (C7) — renders the Migrate product catalog inside the simulation.
 *
 * MigrateView is URL-driven (it reads filters from `useSearchParams` and writes
 * them back), which inside `/simulation` would corrupt the sim's own route. It
 * CANNOT be wrapped in its own <Router> to isolate that — the app already has a
 * Router and React Router forbids nesting one inside another ("You cannot render
 * a <Router> inside another <Router>"). Instead, MigrateView's `simEmbed` prop
 * makes it back its filter URL state with LOCAL state (see MigrateView), so it
 * never touches the page URL and needs no router of its own.
 *
 * `simEmbed` also suppresses the PageHeader so the sim's "● Simulation mode" bar
 * stays at the top.
 */
import { MigrateView } from '@/components/Migrate/MigrateView'

interface MigrateEmbedProps {
  /** Layer to pre-scope the catalog to (e.g. 'layer-1'). Reserved for a follow-up
   *  that seeds the initial layer filter — for now filters start from the user's
   *  last `activeLayer` in useMigrateSelectionStore. */
  catalogLayer?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MigrateEmbed({ catalogLayer: _catalogLayer }: MigrateEmbedProps) {
  return <MigrateView simEmbed />
}
