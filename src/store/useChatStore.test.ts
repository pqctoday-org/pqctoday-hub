// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from './useChatStore'

const STORAGE_KEY = 'pqc-chat-storage'

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

  it('is not persisted: it has no storage layer and writes nothing into browser storage', () => {
    expect((useChatStore as unknown as { persist?: unknown }).persist).toBeUndefined()
    useChatStore.getState().setPendingQuestion('What is ML-KEM?')
    expect(localStorage.length).toBe(0)
  })
})
