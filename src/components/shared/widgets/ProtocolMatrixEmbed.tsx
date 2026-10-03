// SPDX-License-Identifier: GPL-3.0-only
/**
 * ProtocolMatrixEmbed (C5 — vertical slice) — renders the Algorithms page's
 * "Protocol Support" tab (PQCProtocolMatrix) inside the simulation.
 *
 * Rendered with `embedded`: on /algorithms the matrix mirrors its view/filter/
 * sort state (?matrixView/matrixQ/matrixStatus/matrixAvailability/matrixSort)
 * and the open protocol detail (?protocol=<id>) to the URL; embedded, all of
 * that stays LOCAL, so the simulation's own URL is never written (nor read —
 * a stray ?protocol on /simulation can't open a modal). Same contract as the
 * Timeline Gantt's `embedded` flag.
 * It must NOT wrap itself in a <Router>, since the app already has one (React
 * Router forbids nesting: "You cannot render a <Router> inside another
 * <Router>").
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
      <PQCProtocolMatrix embedded />
    </div>
  )
}
