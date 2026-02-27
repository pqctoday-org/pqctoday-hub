import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from './useChatStore'
import type { ChatMessage } from '@/types/ChatTypes'

function createMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random()}`,
    role: 'user',
    content: 'Test message',
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useChatStore.setState({
      apiKey: null,
      messages: [],
      model: 'gemini-2.5-flash',
      isLoading: false,
      isStreaming: false,
      error: null,
      streamingContent: '',
    })
  })

  describe('initial state', () => {
    it('has null apiKey, empty messages, and gemini-2.5-flash model', () => {
      const state = useChatStore.getState()
      expect(state.apiKey).toBeNull()
      expect(state.messages).toEqual([])
      expect(state.model).toBe('gemini-2.5-flash')
    })
  })

  describe('setApiKey', () => {
    it('stores key and clears error', () => {
      useChatStore.setState({ error: 'previous error' })
      useChatStore.getState().setApiKey('test-key-123')
      const state = useChatStore.getState()
      expect(state.apiKey).toBe('test-key-123')
      expect(state.error).toBeNull()
    })

    it('clears key when set to null', () => {
      useChatStore.getState().setApiKey('some-key')
      useChatStore.getState().setApiKey(null)
      expect(useChatStore.getState().apiKey).toBeNull()
    })
  })

  describe('addMessage', () => {
    it('appends message to messages array', () => {
      const msg = createMessage({ content: 'Hello' })
      useChatStore.getState().addMessage(msg)
      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].content).toBe('Hello')
    })

    it('caps at 50 messages (MAX_PERSISTED_MESSAGES)', () => {
      const store = useChatStore.getState()
      // Add 55 messages
      for (let i = 0; i < 55; i++) {
        store.addMessage(createMessage({ id: `msg-${i}`, content: `Message ${i}` }))
      }
      const messages = useChatStore.getState().messages
      expect(messages.length).toBe(50)
      // Should keep the latest 50 (messages 5-54)
      expect(messages[0].content).toBe('Message 5')
      expect(messages[49].content).toBe('Message 54')
    })
  })

  describe('clearMessages', () => {
    it('empties messages and streamingContent', () => {
      useChatStore.getState().addMessage(createMessage())
      useChatStore.setState({ streamingContent: 'partial response' })
      useChatStore.getState().clearMessages()
      const state = useChatStore.getState()
      expect(state.messages).toEqual([])
      expect(state.streamingContent).toBe('')
    })
  })

  describe('setModel', () => {
    it('updates model', () => {
      useChatStore.getState().setModel('gemini-2.0-flash')
      expect(useChatStore.getState().model).toBe('gemini-2.0-flash')
    })
  })

  describe('appendStreamingContent', () => {
    it('concatenates to existing streamingContent', () => {
      useChatStore.getState().setStreamingContent('Hello')
      useChatStore.getState().appendStreamingContent(' World')
      expect(useChatStore.getState().streamingContent).toBe('Hello World')
    })
  })

  describe('setLoading / setStreaming / setError', () => {
    it('updates respective fields', () => {
      const store = useChatStore.getState()
      store.setLoading(true)
      expect(useChatStore.getState().isLoading).toBe(true)

      store.setStreaming(true)
      expect(useChatStore.getState().isStreaming).toBe(true)

      store.setError('Something went wrong')
      expect(useChatStore.getState().error).toBe('Something went wrong')
    })
  })

  describe('migration', () => {
    it('migrates gemini-2.0-flash to gemini-2.5-flash for version < 2', () => {
      // Simulate v1 persisted state
      const migratedState = useChatStore.persist.getOptions().migrate?.(
        {
          apiKey: 'key',
          messages: [],
          model: 'gemini-2.0-flash',
        },
        1
      )
      expect(migratedState).toHaveProperty('model', 'gemini-2.5-flash')
    })

    it('preserves gemini-2.5-flash for version >= 2', () => {
      const migratedState = useChatStore.persist.getOptions().migrate?.(
        {
          apiKey: 'key',
          messages: [],
          model: 'gemini-2.5-flash',
        },
        2
      )
      expect(migratedState).toHaveProperty('model', 'gemini-2.5-flash')
    })

    it('handles null/undefined persisted state safely', () => {
      const migratedState = useChatStore.persist.getOptions().migrate?.(null, 0)
      expect(migratedState).toHaveProperty('apiKey', null)
      expect(migratedState).toHaveProperty('messages', [])
      expect(migratedState).toHaveProperty('model', 'gemini-2.5-flash')
    })
  })
})
