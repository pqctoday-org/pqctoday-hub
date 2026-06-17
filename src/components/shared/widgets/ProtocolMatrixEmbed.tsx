// SPDX-License-Identifier: GPL-3.0-only
/**
 * ProtocolMatrixEmbed (C5 — vertical slice) — renders the Algorithms page's
 * "Protocol Support" tab (PQCProtocolMatrix) inside the simulation.
 *
 * PQCProtocolMatrix is already prop-less (it owns all its filter/view state and
 * only READS `?highlight=` from the URL), so it is the cheapest algorithm tab to
 * embed. It is wrapped in a MemoryRouter (initialEntries '/algorithms?tab=support')
 * so its `useSearchParams` read and its internal `<Link>`s to /migrate / tools stay
 * isolated from the `/simulation` route — a clicked link is a harmless no-op rather
 * than navigating the player out of the sim.
 *
 * Per the C5-a decision, Protocol Support completes as a "reviewed" reference-mark
 * (visited-on-open), NOT an emitted artifact — so this is wired through the existing
 * `reference` completion path (markRefVisited), no new completion semantics.
 *
 * The two comparison tabs (Transition / Detailed) need AlgorithmsView's shared
 * state lifted into a hook before they can mount headless — that is the remaining
 * C5 work and is intentionally not attempted here.
 */
import { MemoryRouter } from 'react-router-dom'
import { PQCProtocolMatrix } from '@/components/Algorithms/PQCProtocolMatrix'

export function ProtocolMatrixEmbed() {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <MemoryRouter initialEntries={['/algorithms?tab=support']}>
        <PQCProtocolMatrix />
      </MemoryRouter>
    </div>
  )
}
