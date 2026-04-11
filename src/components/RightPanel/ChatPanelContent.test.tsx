// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatPanelContent } from './ChatPanelContent'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/timeline', search: '', hash: '', state: null }),
}))

vi.mock('@/services/chat/RetrievalService', () => ({
  retrievalService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockReturnValue([]),
  },
}))

// Mock ChatMessage to avoid deep react-markdown dependency tree
vi.mock('../Chat/ChatMessage', () => ({
  ChatMessage: ({ content, sender }: { content: string; sender: string }) => (
    <div data-testid={`chat-message-${sender}`}>{content}</div>
  ),
}))

// Mock ProviderSetup (replaces old ApiKeySetup)
vi.mock('../Chat/ProviderSetup', () => ({
  ProviderSetup: () => <div data-testid="provider-setup">Choose Your AI Assistant</div>,
}))

// Mock ModelDownloadBanner
vi.mock('../Chat/ModelDownloadBanner', () => ({
  ModelDownloadBanner: () => null,
}))

// Mock WebLLMService
vi.mock('@/services/chat/WebLLMService', () => ({
  initializeEngine: vi.fn().mockResolvedValue(undefined),
  isEngineReady: vi.fn().mockReturnValue(false),
  WEBLLM_MODELS: [
    {
      id: 'Qwen3-1.7B-q4f16_1-MLC',
      label: 'Qwen 3 1.7B (1.0 GB)',
      sizeGB: 1.0,
      maxContextLength: 8_192,
    },
  ],
}))

// Mock SampleQuestionsModal
vi.mock('../About/SampleQuestionsModal', () => ({
  SampleQuestionsModal: ({
    isOpen,
    onSendQuestion,
  }: {
    isOpen: boolean
    onSendQuestion?: (q: string) => void
  }) =>
    isOpen ? (
      <div data-testid="sample-questions-modal">
        <Button onClick={() => onSendQuestion?.('Test question from modal')}>Send Test</Button>
      </div>
    ) : null,
}))

// Mock ConversationMenu
vi.mock('../Chat/ConversationMenu', () => ({
  ConversationMenu: () => null,
}))

// --- Controllable store and hook mocks ---

let mockRightPanelState = { isOpen: true }

vi.mock('@/store/useRightPanelStore', () => ({
  useRightPanelStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ isOpen: mockRightPanelState.isOpen, close: vi.fn() }),
}))

const defaultChatState = {
  apiKey: 'test-api-key',
  setApiKey: vi.fn(),
  provider: 'gemini' as string | null,
  setProvider: vi.fn(),
  localModel: 'Qwen3-1.7B-q4f16_1-MLC',
  localContextWindow: 4_096,
  setLocalModel: vi.fn(),
  setLocalContextWindow: vi.fn(),
  messages: [] as Array<{
    id: string
    role: string
    content: string
    timestamp: number
    sourceRefs?: Array<{ title: string; source: string }>
    followUps?: string[]
  }>,
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null as string | null,
  clearMessages: vi.fn(),
  setMessageFeedback: vi.fn(),
  pendingQuestion: null as string | null,
  setPendingQuestion: vi.fn(),
  conversations: [],
  activeConversationId: null as string | null,
  webllmStatus: 'idle' as string,
  webllmProgress: null,
  webllmError: null as string | null,
  setWebLLMStatus: vi.fn(),
  setWebLLMProgress: vi.fn(),
  setWebLLMError: vi.fn(),
}

let mockChatState = { ...defaultChatState }

vi.mock('@/store/useChatStore', () => ({
  useChatStore: (selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(mockChatState) : mockChatState,
}))

const mockSendQuery = vi.fn()
const defaultPageContext = {
  page: 'Timeline',
  relevantSources: ['timeline'],
  suggestedQuestions: ['What are the NIST PQC deadlines?', 'Show country migration timelines'],
  persona: null as string | null,
  tab: undefined as string | undefined,
}

let mockPageContext = { ...defaultPageContext }

vi.mock('@/hooks/useChatSend', () => ({
  useChatSend: () => ({
    sendQuery: mockSendQuery,
    abort: vi.fn(),
    pageContext: mockPageContext,
    retryLastQuery: vi.fn(),
    editAndResend: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// jsdom stubs
// ---------------------------------------------------------------------------

Element.prototype.scrollIntoView = vi.fn()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  mockRightPanelState = { isOpen: true }
  mockChatState = {
    ...defaultChatState,
    setApiKey: vi.fn(),
    setProvider: vi.fn(),
    clearMessages: vi.fn(),
    setWebLLMStatus: vi.fn(),
    setWebLLMProgress: vi.fn(),
    setWebLLMError: vi.fn(),
    messages: [],
    error: null,
  }
  mockPageContext = { ...defaultPageContext }
  mockSendQuery.mockClear()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatPanelContent', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('renders header with "PQC Assistant" label', () => {
    render(<ChatPanelContent />)
    expect(screen.getByText('PQC Assistant')).toBeInTheDocument()
  })

  it('shows provider label in header', () => {
    render(<ChatPanelContent />)
    expect(screen.getByText('Cloud')).toBeInTheDocument()
  })

  it('shows ProviderSetup when provider is null', () => {
    mockChatState = { ...mockChatState, provider: null }
    render(<ChatPanelContent />)

    expect(screen.getByTestId('provider-setup')).toBeInTheDocument()
    expect(screen.queryByLabelText('Message input')).not.toBeInTheDocument()
  })

  it('shows chat interface when provider is set', () => {
    render(<ChatPanelContent />)
    expect(screen.getByLabelText('Message input')).toBeInTheDocument()
    expect(screen.getByLabelText('Send message')).toBeInTheDocument()
  })

  it('shows suggested questions in empty state', () => {
    render(<ChatPanelContent />)

    expect(screen.getByText(/Ask me anything about post-quantum cryptography/)).toBeInTheDocument()
    expect(screen.getByText('What are the NIST PQC deadlines?')).toBeInTheDocument()
    expect(screen.getByText('Show country migration timelines')).toBeInTheDocument()
  })

  it('renders messages from store', () => {
    mockChatState = {
      ...mockChatState,
      messages: [
        { id: 'u1', role: 'user', content: 'Hello PQC', timestamp: 1000 },
        {
          id: 'a1',
          role: 'assistant',
          content: 'PQC stands for Post-Quantum Cryptography.',
          timestamp: 2000,
          sourceRefs: [],
          followUps: [],
        },
      ],
    }

    render(<ChatPanelContent />)
    expect(screen.getByText('Hello PQC')).toBeInTheDocument()
    expect(screen.getByText('PQC stands for Post-Quantum Cryptography.')).toBeInTheDocument()
  })

  it('shows loading dots when isLoading and not isStreaming', () => {
    mockChatState = { ...mockChatState, isLoading: true, isStreaming: false }
    render(<ChatPanelContent />)

    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(3)
  })

  it('shows error message when error is set', () => {
    mockChatState = { ...mockChatState, error: 'Something went wrong.' }
    render(<ChatPanelContent />)

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  it('sends question via SampleQuestionsModal onSendQuestion', () => {
    render(<ChatPanelContent />)

    // Open sample questions modal
    fireEvent.click(screen.getByLabelText('Sample questions'))
    expect(screen.getByTestId('sample-questions-modal')).toBeInTheDocument()

    // Click the send button in the mock
    fireEvent.click(screen.getByText('Send Test'))
    expect(mockSendQuery).toHaveBeenCalledWith('Test question from modal')
  })
})
