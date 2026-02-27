import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatPanel } from './ChatPanel'
import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock framer-motion using shared mock
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/algorithms', search: '', hash: '', state: null }),
}))

// Mock retrievalService
vi.mock('@/services/chat/RetrievalService', () => ({
  retrievalService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockReturnValue([]),
  },
}))

// Mock ChatMessage to avoid deep dependency tree (react-markdown, remark-gfm, etc.)
vi.mock('./ChatMessage', () => ({
  ChatMessage: ({ content, sender }: { content: string; sender: string }) => (
    <div data-testid={`chat-message-${sender}`}>{content}</div>
  ),
}))

// Mock ApiKeySetup to isolate ChatPanel tests from API key validation logic
vi.mock('./ApiKeySetup', () => ({
  ApiKeySetup: () => <div data-testid="api-key-setup">Enter your Gemini API key</div>,
}))

// Mock SampleQuestionsModal to avoid deep dependency tree
vi.mock('../About/SampleQuestionsModal', () => ({
  SampleQuestionsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="sample-questions-modal">Sample Questions</div> : null,
}))

// --- Controllable store and hook mocks ---

const mockClosePanel = vi.fn()
let mockRightPanelState = { isOpen: true }

vi.mock('@/store/useRightPanelStore', () => ({
  useRightPanelStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isOpen: mockRightPanelState.isOpen,
      close: mockClosePanel,
    }),
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
}

let mockChatState = { ...defaultChatState }

vi.mock('@/store/useChatStore', () => ({
  useChatStore: (selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(mockChatState) : mockChatState,
}))

const mockSendQuery = vi.fn()
const mockAbort = vi.fn()
const defaultPageContext = {
  page: 'Algorithms',
  relevantSources: ['algorithms'],
  suggestedQuestions: ['What is ML-KEM?', 'Compare lattice-based KEMs'],
  persona: null as string | null,
  tab: undefined as string | undefined,
}

let mockPageContext = { ...defaultPageContext }

vi.mock('@/hooks/useChatSend', () => ({
  useChatSend: () => ({
    sendQuery: mockSendQuery,
    abort: mockAbort,
    pageContext: mockPageContext,
  }),
}))

// ---------------------------------------------------------------------------
// jsdom stubs
// ---------------------------------------------------------------------------

// scrollIntoView not available in jsdom
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
  mockClosePanel.mockClear()
  mockSendQuery.mockClear()
  mockAbort.mockClear()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatPanel', () => {
  beforeEach(() => {
    resetMocks()
  })

  // P1: Renders dialog with aria-label "PQC Assistant"
  it('renders dialog with aria-label "PQC Assistant"', () => {
    render(<ChatPanel />)
    const dialog = screen.getByRole('dialog', { name: 'PQC Assistant' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  // P2: Shows ApiKeySetup when apiKey is null
  it('shows ApiKeySetup when apiKey is null', () => {
    mockChatState = { ...mockChatState, apiKey: null as unknown as string }
    render(<ChatPanel />)

    // ApiKeySetup should render
    expect(screen.getByTestId('api-key-setup')).toBeInTheDocument()

    // Chat interface (message input, send button) should not be present
    expect(screen.queryByLabelText('Message input')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Send message')).not.toBeInTheDocument()
  })

  // P3: Shows chat interface when apiKey is set
  it('shows chat interface when apiKey is set', () => {
    render(<ChatPanel />)

    // Input and send button should be present
    expect(screen.getByLabelText('Message input')).toBeInTheDocument()
    expect(screen.getByLabelText('Send message')).toBeInTheDocument()

    // ApiKeySetup should NOT be rendered
    expect(screen.queryByTestId('api-key-setup')).not.toBeInTheDocument()
  })

  // P4: Displays page context in header ("-- Algorithms")
  it('displays page context in header', () => {
    render(<ChatPanel />)

    // The header shows "— {pageContext.page}"
    expect(screen.getByText(/Algorithms/)).toBeInTheDocument()
  })

  // P5: Shows suggested questions in empty state
  it('shows suggested questions in empty state', () => {
    render(<ChatPanel />)

    // Empty state text
    expect(screen.getByText(/Ask me anything about post-quantum cryptography/)).toBeInTheDocument()

    // Suggested questions from mockPageContext
    expect(screen.getByText('What is ML-KEM?')).toBeInTheDocument()
    expect(screen.getByText('Compare lattice-based KEMs')).toBeInTheDocument()
  })

  // P6: Renders messages from store
  it('renders messages from store', () => {
    mockChatState = {
      ...mockChatState,
      messages: [
        {
          id: 'u1',
          role: 'user',
          content: 'What is ML-KEM?',
          timestamp: 1000,
        },
        {
          id: 'a1',
          role: 'assistant',
          content: 'ML-KEM is a lattice-based key encapsulation mechanism.',
          timestamp: 2000,
          sourceRefs: [],
          followUps: [],
        },
      ],
    }

    render(<ChatPanel />)

    expect(screen.getByText('What is ML-KEM?')).toBeInTheDocument()
    expect(
      screen.getByText('ML-KEM is a lattice-based key encapsulation mechanism.')
    ).toBeInTheDocument()
  })

  // P7: Shows streaming content when isStreaming
  it('shows streaming content when isStreaming', () => {
    mockChatState = {
      ...mockChatState,
      isStreaming: true,
      streamingContent: 'ML-KEM is a lattice-based...',
    }

    render(<ChatPanel />)

    expect(screen.getByText('ML-KEM is a lattice-based...')).toBeInTheDocument()
  })

  // P8: Shows loading dots when isLoading and not isStreaming
  it('shows loading dots when isLoading and not isStreaming', () => {
    mockChatState = {
      ...mockChatState,
      isLoading: true,
      isStreaming: false,
    }

    render(<ChatPanel />)

    // Loading indicator renders 3 bouncing dots (span elements with animate-bounce)
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(3)
  })

  // P9: Shows error message when error is set
  it('shows error message when error is set', () => {
    mockChatState = {
      ...mockChatState,
      error: 'Invalid API key. Please check your key and try again.',
    }

    render(<ChatPanel />)

    expect(
      screen.getByText('Invalid API key. Please check your key and try again.')
    ).toBeInTheDocument()
  })

  // P10: Input disabled when isLoading or isStreaming
  it('input disabled when isLoading or isStreaming', () => {
    // Test with isLoading
    mockChatState = { ...mockChatState, isLoading: true }
    const { unmount } = render(<ChatPanel />)
    expect(screen.getByLabelText('Message input')).toBeDisabled()
    unmount()

    // Test with isStreaming
    resetMocks()
    mockChatState = { ...mockChatState, isStreaming: true, streamingContent: 'partial' }
    render(<ChatPanel />)
    expect(screen.getByLabelText('Message input')).toBeDisabled()
  })

  // P11: Send button disabled when input is empty
  it('send button disabled when input is empty', () => {
    render(<ChatPanel />)

    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeDisabled()
  })

  // P12: Escape key calls closePanel
  it('escape key calls closePanel', () => {
    render(<ChatPanel />)

    fireEvent.keyDown(window, { key: 'Escape' })

    // The Escape handler calls closePanel() directly (not handleClose)
    expect(mockClosePanel).toHaveBeenCalled()
  })
})
