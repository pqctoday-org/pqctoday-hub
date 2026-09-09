// SPDX-License-Identifier: GPL-3.0-only
/**
 * embedRunContext (W6.1/W6.3) — the scenario an embedded hub resource is being
 * opened inside.
 *
 * The problem this solves: a hub view embedded in the Simulation is a general
 * tool. It has no idea which run opened it or which organisation the run is
 * about, so it falls back to the GLOBAL persona store — which, for a sample
 * organisation, holds whatever the visitor last chose for themselves, or
 * nothing. The audited symptom was Compliance asking the learner to pick an
 * industry and country that the Simulation header was already displaying.
 *
 * The fix is an ADAPTER, not a mutation. The plan is explicit about this:
 * "add adapters rather than mutating global profile stores". Writing the run's
 * sector/country into usePersonaStore would make the tool correct inside the
 * simulation by silently rewriting the learner's real preferences everywhere
 * else in the hub — a scenario about a fictional bank would change what the
 * visitor sees on /compliance tomorrow.
 *
 * So: a React context, defaulting to null. A consumer that finds null behaves
 * exactly as it does today on its standalone route; a consumer inside the
 * simulation prefers this over the persona store. Nothing is written anywhere.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react'

export interface EmbedRunContext {
  /** ISO country code of the run's organisation (matches jurisdictions `code`). */
  country: string
  /** The run's sector, in the vocabulary the hub's industry filters use. */
  sector: string
  /** Org size band. */
  size: string
  /** The seat the player occupies (persona id). */
  seat: string
  /** Which lifecycle phase opened this resource. */
  phase: string
  /** True when the run is a sample organisation rather than an assessed one —
   *  consumers that show provenance must be able to say which. */
  isSample: boolean
}

const Ctx = createContext<EmbedRunContext | null>(null)

export function EmbedRunContextProvider({
  value,
  children,
}: {
  value: EmbedRunContext
  children: ReactNode
}) {
  // Memoised on the primitive fields so an embed does not re-render on every
  // parent render of a very large view.
  const stable = useMemo(
    () => value,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value.country, value.sector, value.size, value.seat, value.phase, value.isSample]
  )
  return <Ctx.Provider value={stable}>{children}</Ctx.Provider>
}

/**
 * The run context, or null when the component is on its own route.
 * Consumers MUST treat null as "no scenario — behave normally", never as
 * "empty scenario".
 */
export function useEmbedRunContext(): EmbedRunContext | null {
  return useContext(Ctx)
}
