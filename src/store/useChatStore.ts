import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatMessage } from '../types/ChatTypes'

interface ChatState {
  // Persisted
  apiKey: string | null
  messages: ChatMessage[]
  model: string

  // Transient
  isOpen: boolean
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  streamingContent: string

  // Actions
  setApiKey: (key: string | null) => void
  addMessage: (message: ChatMessage) => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  clearMessages: () => void
  setModel: (model: string) => void
}

const MAX_PERSISTED_MESSAGES = 50

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      apiKey: null,
      messages: [],
      model: 'gemini-2.5-flash',
      isOpen: false,
      isLoading: false,
      isStreaming: false,
      error: null,
      streamingContent: '',

      setApiKey: (key) => set({ apiKey: key, error: null }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message].slice(-MAX_PERSISTED_MESSAGES),
        })),

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setError: (error) => set({ error }),
      setStreamingContent: (content) => set({ streamingContent: content }),
      appendStreamingContent: (chunk) =>
        set((state) => ({ streamingContent: state.streamingContent + chunk })),
      clearMessages: () => set({ messages: [], streamingContent: '' }),
      setModel: (model) => set({ model }),
    }),
    {
      name: 'pqc-chat-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
        model: state.model,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.apiKey = typeof state.apiKey === 'string' ? state.apiKey : null
        state.messages = Array.isArray(state.messages) ? state.messages : []
        state.model = typeof state.model === 'string' ? state.model : 'gemini-2.5-flash'
        // v1 → v2: migrate from retired gemini-2.0-flash to gemini-2.5-flash
        if (version < 2 && state.model === 'gemini-2.0-flash') {
          state.model = 'gemini-2.5-flash'
        }
        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Chat store rehydration failed:', error)
        }
      },
    }
  )
)
