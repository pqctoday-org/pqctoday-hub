// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Which questions were asked in which state, so a suggestion already asked is not offered again while the focused objective and
 * the learner's progress are unchanged, also after the conversation is gone. Kept on this device only. What is stored is a list
 * of pairs of two 32-bit hashes (as 8 hex digits): one of the question, one of the objective and progress it was asked under.
 * No question text, no objective text, nothing that can be read back as words. The list holds the most recent 300 pairs.
 * This store only remembers what the Assistant asked; it never reads or writes the journey.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { questionKey } from '@/components/Assistant/askedKey'
import { guardedJSONStorage } from './guardedStorage'

export interface AskedEntry {
  /** Hash of the question. */
  q: string
  /** Hash of the state it was asked in. */
  s: string
}

export const ASKED_MAX_ENTRIES = 300

const HEX8 = /^[0-9a-f]{8}$/

/** The stored entries that have the shape of a pair of hashes, newest last, at most the limit; anything else is dropped. */
export function readEntries(persisted: unknown): { entries: AskedEntry[] } {
  const raw = (persisted as { entries?: unknown } | null)?.entries
  if (!Array.isArray(raw)) return { entries: [] }
  const entries = raw.filter(
    (e): e is AskedEntry =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as AskedEntry).q === 'string' &&
      typeof (e as AskedEntry).s === 'string' &&
      HEX8.test((e as AskedEntry).q) &&
      HEX8.test((e as AskedEntry).s)
  )
  return { entries: entries.slice(-ASKED_MAX_ENTRIES) }
}

interface AssistantAskedState {
  entries: AskedEntry[]
  /** Remember these questions as asked in this state. A pair already held is not added twice. */
  remember: (questions: readonly string[], state: string) => void
  clear: () => void
}

export const useAssistantAskedStore = create<AssistantAskedState>()(
  persist(
    (set, get) => ({
      entries: [],
      remember: (questions, state) => {
        const have = new Set(get().entries.map((e) => `${e.q}:${e.s}`))
        const added: AskedEntry[] = []
        for (const question of questions) {
          const entry = { q: questionKey(question), s: state }
          const id = `${entry.q}:${entry.s}`
          if (have.has(id)) continue
          have.add(id)
          added.push(entry)
        }
        if (added.length === 0) return
        set({ entries: [...get().entries, ...added].slice(-ASKED_MAX_ENTRIES) })
      },
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pqc-assistant-asked',
      version: 1,
      storage: guardedJSONStorage(),
      partialize: (s) => ({ entries: s.entries }),
      // One shape so far: a list of pairs of hashes.
      migrate: (persisted) => readEntries(persisted),
      // A damaged value reads as an empty list.
      merge: (persisted, current) => ({ ...current, ...readEntries(persisted) }),
      // A failed read leaves the list empty.
      onRehydrateStorage: () => (_state, error) => {
        if (error)
          console.error('The Assistant questions could not be read from this device.', error)
      },
    }
  )
)
