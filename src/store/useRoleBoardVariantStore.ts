// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '@/data/learningPersonas'

/**
 * useRoleBoardVariantStore — which of a role's three board options the visitor
 * last chose, remembered per role.
 *
 * Per role, not global: the three options mean different things for each
 * persona (an executive's "know your exposure" and a developer's "find the
 * crypto in your code" are not positions on one shared axis), so carrying a
 * single index across a persona switch would silently pick an unrelated board.
 *
 * Modeled on `useBookmarkStore.ts`/`useResearchFieldsStore.ts` per the repo's
 * persistence conventions (CLAUDE.md → "Persistence Conventions"): numeric
 * `version`, a `migrate()` that gives every field a safe default, and an
 * `onRehydrateStorage` crash guard.
 *
 * Values are plain strings, deliberately NOT validated against the variant
 * registry at read time — a future rename or retirement of a variant id then
 * degrades to "falls back to the role's order-1 board" rather than corrupting
 * the store. `LandingView` does that resolution.
 */
interface RoleBoardVariantState {
  /** role id -> chosen variant id. Absent means "not chosen yet". */
  selectedVariantByRole: Partial<Record<PersonaId, string>>
  selectVariant: (role: PersonaId, variantId: string) => void
  clearVariant: (role: PersonaId) => void
}

export const useRoleBoardVariantStore = create<RoleBoardVariantState>()(
  persist(
    (set) => ({
      selectedVariantByRole: {},
      selectVariant: (role, variantId) =>
        set((s) => ({ selectedVariantByRole: { ...s.selectedVariantByRole, [role]: variantId } })),
      clearVariant: (role) =>
        set((s) => {
          const next = { ...s.selectedVariantByRole }
          // eslint-disable-next-line security/detect-object-injection -- role is the typed PersonaId union, not user input
          delete next[role]
          return { selectedVariantByRole: next }
        }),
    }),
    {
      name: 'pqc-role-board-variant',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          const raw = state.selectedVariantByRole
          state.selectedVariantByRole =
            typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}
        }

        return state as unknown as RoleBoardVariantState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Role board variant store rehydration failed:', error)
        }
      },
    }
  )
)
