// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The width the learner chose for the docked Assistant. Kept on this device only: a number of
 * pixels, nothing else. `null` means "automatic": 520 px on a wide window, 400 px on a narrower one.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guardedJSONStorage } from './guardedStorage'

export const ASSISTANT_WIDTH_MIN = 400
export const ASSISTANT_WIDTH_MAX = 640
/** Step of the Wider and Narrower buttons. */
export const ASSISTANT_WIDTH_STEP = 60
/** Step of the arrow keys on the resize handle. */
export const ASSISTANT_WIDTH_KEY_STEP = 20
/** The page always keeps at least this much room beside the drawer. */
export const ASSISTANT_PAGE_MIN_PX = 640
/** The window width from which the automatic width is the wide one. */
const WIDE_WINDOW_PX = 1280
const AUTOMATIC_WIDE = 520

const viewportWidth = (): number => (typeof window === 'undefined' ? 1440 : window.innerWidth)

/** The width used when the learner has not chosen one. */
export function automaticWidth(viewport: number = viewportWidth()): number {
  return viewport >= WIDE_WINDOW_PX ? AUTOMATIC_WIDE : ASSISTANT_WIDTH_MIN
}

/** The widest the drawer may be in a window of this width. Never below the minimum. */
export function maxWidthFor(viewport: number = viewportWidth()): number {
  return Math.max(
    ASSISTANT_WIDTH_MIN,
    Math.min(ASSISTANT_WIDTH_MAX, viewport - ASSISTANT_PAGE_MIN_PX)
  )
}

export function clampWidth(px: number, viewport: number = viewportWidth()): number {
  if (!Number.isFinite(px)) return automaticWidth(viewport)
  return Math.round(Math.min(maxWidthFor(viewport), Math.max(ASSISTANT_WIDTH_MIN, px)))
}

/** The stored width, or null (automatic) for anything that is not a number. */
function readWidth(persisted: unknown): { width: number | null } {
  const width = (persisted as { width?: unknown } | null)?.width
  return { width: typeof width === 'number' && Number.isFinite(width) ? width : null }
}

interface AssistantWidthState {
  /** The chosen width in pixels, or null for the automatic one. */
  width: number | null
  setWidth: (px: number) => void
  /** One step wider or narrower than what shows now. */
  wider: () => void
  narrower: () => void
  /** Back to the automatic width. */
  reset: () => void
}

export const useAssistantWidthStore = create<AssistantWidthState>()(
  persist(
    (set, get) => ({
      width: null,
      setWidth: (px) => set({ width: clampWidth(px) }),
      wider: () =>
        set({ width: clampWidth((get().width ?? automaticWidth()) + ASSISTANT_WIDTH_STEP) }),
      narrower: () =>
        set({ width: clampWidth((get().width ?? automaticWidth()) - ASSISTANT_WIDTH_STEP) }),
      reset: () => set({ width: null }),
    }),
    {
      name: 'pqc-assistant-width',
      version: 1,
      storage: guardedJSONStorage(),
      partialize: (s) => ({ width: s.width }),
      // One shape so far: a number of pixels or null.
      migrate: (persisted) => readWidth(persisted),
      // A damaged value reads as "automatic".
      merge: (persisted, current) => ({ ...current, ...readWidth(persisted) }),
      // A failed read leaves the automatic width.
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('The Assistant width could not be read from this device.', error)
      },
    }
  )
)
