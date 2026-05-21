// SPDX-License-Identifier: GPL-3.0-only
import { createContext, useContext } from 'react'

interface WorkshopNavigationContextValue {
  selectTool: (id: string) => void
}

export const WorkshopNavigationContext = createContext<WorkshopNavigationContextValue>({
  selectTool: () => {},
})

export const useWorkshopNavigation = () => useContext(WorkshopNavigationContext)
