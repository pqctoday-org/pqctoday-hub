// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatMessage, ChatProvider, Conversation } from '../types/ChatTypes'
import type { WebLLMStatus, WebLLMProgress } from '../services/chat/WebLLMService'

interface ChatState {
  // Persisted
  apiKey: string | null
  provider: ChatProvider | null
  localModel: string
  conversations: Conversation[]
  activeConversationId: string | null
  model: string

  // Derived / synced (not persisted — computed from active conversation)
  messages: ChatMessage[]

  // Transient
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  streamingContent: string
  pendingQuestion: string | null
  webllmStatus: WebLLMStatus
  webllmProgress: WebLLMProgress | null
  webllmError: string | null

  // Actions
  setApiKey: (key: string | null) => void
  setProvider: (provider: ChatProvider | null) => void
  setLocalModel: (model: string) => void
  addMessage: (message: ChatMessage) => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  clearMessages: () => void
  setModel: (model: string) => void
  setMessageFeedback: (id: string, feedback: 'helpful' | 'unhelpful' | undefined) => void
  deleteMessagesFrom: (id: string) => void
  setPendingQuestion: (question: string | null) => void
  setWebLLMStatus: (status: WebLLMStatus) => void
  setWebLLMProgress: (progress: WebLLMProgress | null) => void
  setWebLLMError: (error: string | null) => void

  // Conversation actions
  createConversation: () => string
  switchConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
}

const MAX_MESSAGES_PER_CONVERSATION = 50
const MAX_CONVERSATIONS = 10

function generateConvId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function autoTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'New Chat'
  return first.content.length > 50 ? first.content.slice(0, 47) + '...' : first.content
}

function getActiveMessages(conversations: Conversation[], activeId: string | null): ChatMessage[] {
  if (!activeId) return []
  const conv = conversations.find((c) => c.id === activeId)
  return conv?.messages ?? []
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      provider: null,
      localModel: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
      conversations: [],
      activeConversationId: null,
      messages: [],
      model: 'gemini-2.5-flash',
      isLoading: false,
      isStreaming: false,
      error: null,
      streamingContent: '',
      pendingQuestion: null,
      webllmStatus: 'idle',
      webllmProgress: null,
      webllmError: null,

      setApiKey: (key) => set({ apiKey: key, error: null }),

      setProvider: (provider) => set({ provider, error: null, webllmError: null }),

      setLocalModel: (localModel) => set({ localModel }),

      addMessage: (message) =>
        set((state) => {
          let { conversations, activeConversationId } = state

          // Auto-create conversation if none active
          if (!activeConversationId || !conversations.find((c) => c.id === activeConversationId)) {
            const newId = generateConvId()
            const newConv: Conversation = {
              id: newId,
              title: 'New Chat',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            conversations = [...conversations, newConv]
            activeConversationId = newId
          }

          const updated = conversations.map((c) => {
            if (c.id !== activeConversationId) return c
            const newMessages = [...c.messages, message].slice(-MAX_MESSAGES_PER_CONVERSATION)
            return {
              ...c,
              messages: newMessages,
              title: c.title === 'New Chat' ? autoTitle(newMessages) : c.title,
              updatedAt: Date.now(),
            }
          })

          // Enforce max conversations (remove oldest)
          const trimmed =
            updated.length > MAX_CONVERSATIONS
              ? updated.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS)
              : updated

          return {
            conversations: trimmed,
            activeConversationId,
            messages: getActiveMessages(trimmed, activeConversationId),
          }
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setError: (error) => set({ error }),
      setStreamingContent: (content) => set({ streamingContent: content }),
      appendStreamingContent: (chunk) =>
        set((state) => ({ streamingContent: state.streamingContent + chunk })),

      clearMessages: () =>
        set((state) => {
          if (!state.activeConversationId) return { messages: [] }
          return {
            conversations: state.conversations.map((c) =>
              c.id === state.activeConversationId
                ? { ...c, messages: [], title: 'New Chat', updatedAt: Date.now() }
                : c
            ),
            messages: [],
            streamingContent: '',
          }
        }),

      setModel: (model) => set({ model }),

      setMessageFeedback: (id, feedback) =>
        set((state) => {
          const conversations = state.conversations.map((c) =>
            c.id === state.activeConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === id ? { ...m, feedback } : m)),
                }
              : c
          )
          return {
            conversations,
            messages: getActiveMessages(conversations, state.activeConversationId),
          }
        }),

      setPendingQuestion: (question) => set({ pendingQuestion: question }),

      setWebLLMStatus: (webllmStatus) => set({ webllmStatus }),
      setWebLLMProgress: (webllmProgress) => set({ webllmProgress }),
      setWebLLMError: (webllmError) => set({ webllmError }),

      deleteMessagesFrom: (id) =>
        set((state) => {
          if (!state.activeConversationId) return state
          const conversations = state.conversations.map((c) => {
            if (c.id !== state.activeConversationId) return c
            const idx = c.messages.findIndex((m) => m.id === id)
            if (idx === -1) return c
            return { ...c, messages: c.messages.slice(0, idx), updatedAt: Date.now() }
          })
          return {
            conversations,
            messages: getActiveMessages(conversations, state.activeConversationId),
          }
        }),

      createConversation: () => {
        const newId = generateConvId()
        const newConv: Conversation = {
          id: newId,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => {
          const updated = [...state.conversations, newConv]
          const trimmed =
            updated.length > MAX_CONVERSATIONS
              ? updated.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS)
              : updated
          return {
            conversations: trimmed,
            activeConversationId: newId,
            messages: [],
          }
        })
        return newId
      },

      switchConversation: (id) => {
        const state = get()
        if (state.isLoading || state.isStreaming) return
        const conv = state.conversations.find((c) => c.id === id)
        if (!conv) return
        set({
          activeConversationId: id,
          messages: conv.messages,
          error: null,
        })
      },

      deleteConversation: (id) =>
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id)
          if (state.activeConversationId === id) {
            // Switch to most recent remaining, or clear
            const next = remaining.sort((a, b) => b.updatedAt - a.updatedAt)[0]
            return {
              conversations: remaining,
              activeConversationId: next?.id ?? null,
              messages: next?.messages ?? [],
            }
          }
          return { conversations: remaining }
        }),

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
        })),
    }),
    {
      name: 'pqc-chat-storage',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        provider: state.provider,
        localModel: state.localModel,
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
        })),
        activeConversationId: state.activeConversationId,
        model: state.model,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.apiKey = typeof state.apiKey === 'string' ? state.apiKey : null
        state.model = typeof state.model === 'string' ? state.model : 'gemini-2.5-flash'

        // v1 → v2: migrate from retired gemini-2.0-flash to gemini-2.5-flash
        if (version < 2 && state.model === 'gemini-2.0-flash') {
          state.model = 'gemini-2.5-flash'
        }

        // v2 → v3: ensure feedback field exists on all messages
        if (version < 3) {
          const msgs = Array.isArray(state.messages) ? state.messages : []
          state.messages = msgs.map((m: ChatMessage) => ({
            ...m,
            feedback: m.feedback ?? undefined,
          }))
        }

        // v3 → v4: wrap flat messages[] into Conversation[]
        if (version < 4) {
          const existingMessages: ChatMessage[] = Array.isArray(state.messages)
            ? state.messages
            : []
          if (existingMessages.length > 0) {
            const firstUser = existingMessages.find((m) => m.role === 'user')
            const title = firstUser
              ? firstUser.content.length > 50
                ? firstUser.content.slice(0, 47) + '...'
                : firstUser.content
              : 'Previous Chat'
            const convId = 'conv-migrated'
            state.conversations = [
              {
                id: convId,
                title,
                messages: existingMessages,
                createdAt: existingMessages[0]?.timestamp ?? Date.now(),
                updatedAt: existingMessages[existingMessages.length - 1]?.timestamp ?? Date.now(),
              },
            ]
            state.activeConversationId = convId
          } else {
            state.conversations = []
            state.activeConversationId = null
          }
          // Remove flat messages from persisted state
          delete state.messages
        }

        // v4 → v5: add provider and localModel fields
        if (version < 5) {
          // Seamless upgrade: if user already has a valid Gemini API key,
          // auto-set provider to 'gemini' so they skip the ProviderSetup screen
          if (typeof state.apiKey === 'string' && state.apiKey.length > 0) {
            state.provider = 'gemini'
          } else {
            state.provider = null
          }
          state.localModel = 'Phi-3.5-mini-instruct-q4f16_1-MLC'
        }

        // Ensure conversations and activeConversationId exist
        state.conversations = Array.isArray(state.conversations) ? state.conversations : []
        state.activeConversationId =
          typeof state.activeConversationId === 'string' ? state.activeConversationId : null

        // Safety defaults for provider and localModel
        if (state.provider !== 'gemini' && state.provider !== 'local' && state.provider !== null) {
          state.provider = null
        }
        state.localModel =
          typeof state.localModel === 'string'
            ? state.localModel
            : 'Phi-3.5-mini-instruct-q4f16_1-MLC'

        return state
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Chat store rehydration failed:', error)
          return
        }
        // Sync `messages` from the active conversation after rehydration
        if (state) {
          const conv = state.conversations.find((c) => c.id === state.activeConversationId)
          state.messages = conv?.messages ?? []
        }
      },
    }
  )
)
