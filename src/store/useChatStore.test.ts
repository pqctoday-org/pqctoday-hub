// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from './useChatStore'

const STORAGE_KEY = 'pqc-chat-storage'

/** What a visitor who had the old model chat switched on had in the browser (store version 14). */
const OLD_SNAPSHOT = {
  state: {
    apiKey: 'AIza-synthetic-test-key',
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    localModel: 'Qwen3-8B-q4f16_1-MLC',
    localContextWindow: 4096,
    conversations: [
      {
        id: 'conv-1',
        title: 'What is FIPS 203?',
        messages: [
          { id: 'u1', role: 'user', content: 'What is FIPS 203?', timestamp: 1 },
          { id: 'a1', role: 'assistant', content: 'ML-KEM.', timestamp: 2 },
        ],
        createdAt: 1,
        updatedAt: 2,
      },
    ],
    activeConversationId: 'conv-1',
  },
  version: 14,
}

describe('useChatStore', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    useChatStore.setState({ pendingQuestion: null })
  })

  it('holds only the question hand-off: no conversations, provider, model or key', () => {
    const state = useChatStore.getState() as unknown as Record<string, unknown>
    expect(Object.keys(state).sort()).toEqual(['pendingQuestion', 'setPendingQuestion'])
  })

  it('hands a question over and clears it', () => {
    useChatStore.getState().setPendingQuestion('What is ML-KEM?')
    expect(useChatStore.getState().pendingQuestion).toBe('What is ML-KEM?')
    useChatStore.getState().setPendingQuestion(null)
    expect(useChatStore.getState().pendingQuestion).toBeNull()
  })

  it('never writes the question or anything else into browser storage', () => {
    useChatStore.getState().setPendingQuestion('What is ML-KEM?')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.state).toEqual({})
    expect(JSON.stringify(stored)).not.toContain('ML-KEM')
  })

  describe('migration', () => {
    const migrate = (state: unknown, version: number) =>
      useChatStore.persist.getOptions().migrate?.(state, version)

    it('is at version 15', () => {
      expect(useChatStore.persist.getOptions().version).toBe(15)
    })

    it('discards everything an earlier version stored, whatever its version or shape', () => {
      for (const version of [0, 1, 3, 4, 9, 11, 13, 14]) {
        expect(migrate(OLD_SNAPSHOT.state, version), `v${version}`).toEqual({})
      }
      expect(migrate(null, 0)).toEqual({})
      expect(migrate({ conversations: 'broken', activeConversationId: 7 }, 14)).toEqual({})
    })
  })

  describe('a visitor who had the old model chat switched on', () => {
    it('loads without an error and nothing of the old chat is left in browser storage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(OLD_SNAPSHOT))
      await useChatStore.persist.rehydrate()

      const state = useChatStore.getState() as unknown as Record<string, unknown>
      expect(Object.keys(state).sort()).toEqual(['pendingQuestion', 'setPendingQuestion'])
      expect(state.pendingQuestion).toBeNull()

      const stored = localStorage.getItem(STORAGE_KEY) ?? ''
      expect(stored).not.toContain('AIza-synthetic-test-key')
      expect(stored).not.toMatch(/apiKey|provider|localModel|gemini|Qwen|conv-1|FIPS 203/)
      expect(JSON.parse(stored)).toEqual({ state: {}, version: 15 })
    })

    it('also loads a store from long before conversations existed, with a stored key', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: { apiKey: 'AIza-synthetic-test-key', messages: [{ id: 'u', role: 'user' }] },
          version: 3,
        })
      )
      await useChatStore.persist.rehydrate()
      const stored = localStorage.getItem(STORAGE_KEY) ?? ''
      expect(stored).not.toContain('AIza-synthetic-test-key')
      expect(JSON.parse(stored)).toEqual({ state: {}, version: 15 })
    })
  })
})
