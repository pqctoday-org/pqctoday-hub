import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatPanelContent } from './ChatPanelContent'
import '@testing-library/jest-dom'

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

// Mock ApiKeySetup
vi.mock('../Chat/ApiKeySetup', () => ({
  ApiKeySetup: () => <div data-testid="api-key-setup">Enter your Gemini API key</div>,
}))

// Mock SampleQuestionsModal
vi.mock('../About/SampleQuestionsModal', () => ({
  SampleQuestionsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="sample-questions-modal">Sample Questions</div> : null,
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
    clearMessages: vi.fn(),
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

  it('shows page context in header', () => {
    render(<ChatPanelContent />)
    expect(screen.getByText(/Timeline/)).toBeInTheDocument()
  })

  it('shows ApiKeySetup when apiKey is null', () => {
    mockChatState = { ...mockChatState, apiKey: null as unknown as string }
    render(<ChatPanelContent />)

    expect(screen.getByTestId('api-key-setup')).toBeInTheDocument()
    expect(screen.queryByLabelText('Message input')).not.toBeInTheDocument()
  })

  it('shows chat interface when apiKey is set', () => {
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
})
