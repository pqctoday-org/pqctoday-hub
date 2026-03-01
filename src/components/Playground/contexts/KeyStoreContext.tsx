// SPDX-License-Identifier: GPL-3.0-only
import { createContext, useContext } from 'react'

import type { KeyStoreContextType } from './types'
export type { KeyStoreContextType }

export const KeyStoreContext = createContext<KeyStoreContextType | undefined>(undefined)

export const useKeyStoreContext = () => {
  const context = useContext(KeyStoreContext)
  if (!context) {
    throw new Error('useKeyStoreContext must be used within a KeyStoreProvider')
  }
  return context
}
