// SPDX-License-Identifier: GPL-3.0-only
/**
 * MigrateEmbed (C7) — renders the Migrate product catalog inside the simulation
 * without corrupting the `/simulation` route's URL state.
 *
 * The core problem: MigrateView is URL-driven — it reads filters from
 * `useSearchParams` and writes back via `setSearchParams`. Inside `/simulation`
 * those writes would corrupt the sim's own URL. The fix: wrap in a `MemoryRouter`
 * scoped to `/migrate`, giving MigrateView its own isolated URL context. All
 * filter interactions stay inside the memory router; nothing escapes to the parent.
 *
 * `simEmbed={true}` suppresses the PageHeader so the sim's "● Simulation mode"
 * bar stays at the top and the player sees the catalog directly.
 */
import { MemoryRouter } from 'react-router-dom'
import { MigrateView } from '@/components/Migrate/MigrateView'

interface MigrateEmbedProps {
  /** Layer to pre-scope the catalog to (e.g. 'layer-1'). Reserved for a follow-up
   *  that seeds the initial layer filter — for now filters start from the user's
   *  last `activeLayer` in useMigrateSelectionStore. */
  catalogLayer?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MigrateEmbed({ catalogLayer: _catalogLayer }: MigrateEmbedProps) {
  return (
    <MemoryRouter initialEntries={['/migrate']}>
      <MigrateView simEmbed />
    </MemoryRouter>
  )
}
