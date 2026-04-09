// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, ReactNode } from 'react'
import { getEmbedState } from './embedContext'
import type { EmbedState, EmbedConfig } from './embedContext'

const EmbedContext = createContext<EmbedState | undefined>(undefined)

export function EmbedProvider({ children }: { children: ReactNode }) {
  // Read once from the module singleton. Because it's set before React mounts
  // and never changes during an embed session, it doesn't need to be in React state.
  const state = getEmbedState()

  return <EmbedContext.Provider value={state}>{children}</EmbedContext.Provider>
}

/**
 * Get the full EmbedState (which may be { isEmbedded: false }).
 */
export function useEmbedState(): EmbedState {
  const context = useContext(EmbedContext)
  if (context === undefined) {
    throw new Error('useEmbedState must be used within an EmbedProvider')
  }
  return context
}

/**
 * Get the config for the current embed session.
 * Throws if called when not embedded. This is safer for components
 * that only mount inside the embed layout.
 */
export function useEmbed(): EmbedConfig {
  const state = useEmbedState()
  if (!state.isEmbedded) {
    throw new Error('useEmbed cannot be called when not embedded')
  }
  return state
}

/**
 * Convenience check.
 */
export function useIsEmbedded(): boolean {
  const state = useEmbedState()
  return state.isEmbedded
}
