// SPDX-License-Identifier: GPL-3.0-only
import { useSyncExternalStore } from 'react'

/**
 * Which address the app last showed its "page not found" screen for, so that PageMeta (which sits
 * above the routes and cannot see which one matched) can mark that page noindex and leave its
 * canonical out. PageMeta compares it with the current address, so a mark left behind after the visitor
 * moves on does nothing.
 */
let notFoundPath: string | null = null
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const emit = () => {
  for (const listener of listeners) listener()
}

export function markNotFound(path: string): void {
  if (notFoundPath === path) return
  notFoundPath = path
  emit()
}

export function useNotFoundPath(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => notFoundPath,
    () => null
  )
}
