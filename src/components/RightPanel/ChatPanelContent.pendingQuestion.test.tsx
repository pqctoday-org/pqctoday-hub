// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { ChatPanelContent } from './ChatPanelContent'
import { useChatStore } from '@/store/useChatStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import '@testing-library/jest-dom'

// These tests use the real chat and panel stores: the question is queued by the same store call the
// Ask Assistant buttons use, and the effect that sends it reacts to the store changing.

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/timeline', search: '', hash: '', state: null }),
}))

vi.mock('@/services/chat/RetrievalService', () => ({
  retrievalService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockReturnValue([]),
  },
}))

vi.mock('../Chat/ChatMessage', () => ({ ChatMessage: () => null }))
vi.mock('../Chat/ProviderSetup', () => ({ ProviderSetup: () => null }))
vi.mock('../Chat/ModelDownloadBanner', () => ({ ModelDownloadBanner: () => null }))
vi.mock('../About/SampleQuestionsModal', () => ({ SampleQuestionsModal: () => null }))
vi.mock('../Chat/ConversationMenu', () => ({ ConversationMenu: () => null }))
vi.mock('@/services/chat/WebLLMService', () => ({
  initializeEngine: vi.fn().mockResolvedValue(undefined),
  isEngineReady: vi.fn().mockReturnValue(false),
  WEBLLM_MODELS: [],
}))

const mockSendQuery = vi.fn()
vi.mock('@/hooks/useChatSend', () => ({
  useChatSend: () => ({
    sendQuery: mockSendQuery,
    abort: vi.fn(),
    pageContext: {
      page: 'Timeline',
      relevantSources: ['timeline'],
      suggestedQuestions: [],
      persona: null,
      tab: undefined,
    },
    retryLastQuery: vi.fn(),
    editAndResend: vi.fn(),
  }),
}))

Element.prototype.scrollIntoView = vi.fn()

const QUESTION = 'What does ML-KEM replace?'

describe('ChatPanelContent: a question queued by an Ask Assistant button', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSendQuery.mockClear()
    useChatStore.setState({ provider: 'gemini', pendingQuestion: null })
    useRightPanelStore.getState().open('chat')
  })

  afterEach(() => {
    vi.useRealTimers()
    useChatStore.setState({ pendingQuestion: null })
  })

  it('is sent once the panel has waited past the hand-off delay, and then cleared', () => {
    render(<ChatPanelContent />)
    act(() => {
      useChatStore.getState().setPendingQuestion(QUESTION)
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockSendQuery).toHaveBeenCalledTimes(1)
    expect(mockSendQuery).toHaveBeenCalledWith(QUESTION)
    expect(useChatStore.getState().pendingQuestion).toBeNull()
  })

  it('is sent when the question was already queued before the panel mounted', () => {
    useChatStore.setState({ pendingQuestion: QUESTION })
    render(<ChatPanelContent />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockSendQuery).toHaveBeenCalledTimes(1)
    expect(mockSendQuery).toHaveBeenCalledWith(QUESTION)
  })

  it('is not sent twice when the panel re-renders while it waits', () => {
    const { rerender } = render(<ChatPanelContent />)
    act(() => {
      useChatStore.getState().setPendingQuestion(QUESTION)
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender(<ChatPanelContent />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockSendQuery).toHaveBeenCalledTimes(1)
  })

  it('is not sent when the panel unmounts first, and stays queued for the next time it opens', () => {
    const { unmount } = render(<ChatPanelContent />)
    act(() => {
      useChatStore.getState().setPendingQuestion(QUESTION)
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockSendQuery).not.toHaveBeenCalled()
    expect(useChatStore.getState().pendingQuestion).toBe(QUESTION)

    render(<ChatPanelContent />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockSendQuery).toHaveBeenCalledTimes(1)
    expect(mockSendQuery).toHaveBeenCalledWith(QUESTION)
  })
})
