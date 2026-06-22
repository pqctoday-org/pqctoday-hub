// SPDX-License-Identifier: GPL-3.0-only
/**
 * ProtocolMatrixEmbed (C5 — vertical slice) — renders the Algorithms page's
 * "Protocol Support" tab (PQCProtocolMatrix) inside the simulation.
 *
 * PQCProtocolMatrix owns all its filter/view state and only READS `?highlight=`
 * from the URL (it never writes search params), so it renders cleanly inside the
 * app's existing Router with no isolation needed — and it must NOT wrap itself in
 * a <Router>, since the app already has one (React Router forbids nesting:
 * "You cannot render a <Router> inside another <Router>"). In `/simulation` the
 * `highlight` param simply isn't present, so the auto-scroll no-ops.
 *
 * Per the C5-a decision, Protocol Support completes as a "reviewed" reference-mark
 * (visited-on-open), wired through the existing `reference` completion path.
 *
 * The two comparison tabs (Transition / Detailed) need AlgorithmsView's shared
 * state lifted into a hook before they can mount headless — that is the remaining
 * C5 work and is intentionally not attempted here.
 */
import { PQCProtocolMatrix } from '@/components/Algorithms/PQCProtocolMatrix'

export function ProtocolMatrixEmbed() {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <PQCProtocolMatrix />
    </div>
  )
}
