// SPDX-License-Identifier: AGPL-3.0-only
import { createContext, useContext } from 'react'

interface WorkshopNavigationContextValue {
  selectTool: (id: string) => void
}

export const WorkshopNavigationContext = createContext<WorkshopNavigationContextValue>({
  selectTool: () => {},
})

export const useWorkshopNavigation = () => useContext(WorkshopNavigationContext)

/**
 * The "next in sequence" card when a workshop component runs inside a Learn module's stepper
 * rather than the Playground. `undefined` (no provider) is the Playground, where the card names
 * the next tool; inside a module the module says what comes next on the learner's path, or `null`
 * on the last step so no card points anywhere.
 */
export interface ModuleWorkshopNext {
  name: string
  description: string
  open: () => void
}

export const ModuleWorkshopNextContext = createContext<ModuleWorkshopNext | null | undefined>(
  undefined
)
