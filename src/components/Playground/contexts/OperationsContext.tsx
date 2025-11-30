import { createContext, useContext } from 'react'

import type { OperationsContextType } from './types'
export type { OperationsContextType }

export const OperationsContext = createContext<OperationsContextType | undefined>(undefined)

export const useOperationsContext = () => {
  const context = useContext(OperationsContext)
  if (!context) {
    throw new Error('useOperationsContext must be used within a OperationsProvider')
  }
  return context
}
