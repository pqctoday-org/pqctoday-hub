// SPDX-License-Identifier: GPL-3.0-only
/**
 * EmbeddedLearn context — true only when a Learn module is rendered INSIDE the
 * Simulation (embedded panel) rather than on its own hub page. Modules use it to
 * suppress cross-navigation chrome (e.g. the "Take the quiz" CTA) that would jump
 * the player out of the sim. Defaults to false, so normal hub pages are unchanged.
 *
 * Also carries optional initialTab/initialStep so the sim can open a learn module
 * directly at a specific workshop tab + step (parsed from the tree step's ?tab=&step=
 * URL). useModuleProgress reads these to override the normal URL-param deep-link.
 */
import { createContext, useContext, type ReactNode } from 'react'

interface EmbedLearnState {
  isEmbed: boolean
  initialTab?: string
  initialStep?: number
}

const EmbeddedLearnContext = createContext<EmbedLearnState>({ isEmbed: false })

export function EmbeddedLearnProvider({
  children,
  initialTab,
  initialStep,
}: {
  children: ReactNode
  initialTab?: string
  initialStep?: number
}) {
  return (
    <EmbeddedLearnContext.Provider value={{ isEmbed: true, initialTab, initialStep }}>
      {children}
    </EmbeddedLearnContext.Provider>
  )
}

/** True when rendered inside the simulation's embedded Learn panel. */
export function useEmbeddedLearn(): boolean {
  return useContext(EmbeddedLearnContext).isEmbed
}

/** Initial tab/step overrides provided by the simulation's embed params. */
export function useEmbedInit(): { initialTab?: string; initialStep?: number } {
  const { initialTab, initialStep } = useContext(EmbeddedLearnContext)
  return { initialTab, initialStep }
}
