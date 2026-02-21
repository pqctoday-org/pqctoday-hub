import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '../data/learningPersonas'

interface PersonaState {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  setPersona: (persona: PersonaId) => void
  clearPersona: () => void
  markPickerSeen: () => void
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      selectedPersona: null,
      hasSeenPersonaPicker: false,

      setPersona: (persona) => set({ selectedPersona: persona, hasSeenPersonaPicker: true }),

      clearPersona: () => set({ selectedPersona: null, hasSeenPersonaPicker: false }),

      markPickerSeen: () => set({ hasSeenPersonaPicker: true }),
    }),
    {
      name: 'pqc-learning-persona',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
