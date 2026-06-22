// SPDX-License-Identifier: GPL-3.0-only
/**
 * EmbeddedLearn context — true only when a Learn module is rendered INSIDE the
 * Simulation (embedded panel) rather than on its own hub page. Modules use it to
 * suppress cross-navigation chrome (e.g. the "Take the quiz" CTA) that would jump
 * the player out of the sim. Defaults to false, so normal hub pages are unchanged.
 */
import { createContext, useContext, type ReactNode } from 'react'

const EmbeddedLearnContext = createContext(false)

export function EmbeddedLearnProvider({ children }: { children: ReactNode }) {
  return <EmbeddedLearnContext.Provider value={true}>{children}</EmbeddedLearnContext.Provider>
}

/** True when rendered inside the simulation's embedded Learn panel. */
export function useEmbeddedLearn(): boolean {
  return useContext(EmbeddedLearnContext)
}
