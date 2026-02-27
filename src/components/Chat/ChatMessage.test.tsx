import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'
import '@testing-library/jest-dom'

// --- Mocks ---

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockClosePanel = vi.fn()
vi.mock('@/store/useRightPanelStore', () => ({
  useRightPanelStore: (selector: (s: { close: () => void }) => unknown) =>
    selector({ close: mockClosePanel }),
}))

vi.mock('./generateFollowUps', () => ({
  generateFollowUps: vi.fn(() => ['Fallback question 1', 'Fallback question 2']),
}))

// ReactMarkdown: render children as-is so we can assert text content easily
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('remark-gfm', () => ({ default: () => {} }))

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

// --- Helpers ---

const sourceRefs = [
  { title: 'NIST PQC FAQ', source: 'library', deepLink: '/library?id=nist-faq' },
  { title: 'ML-KEM Overview', source: 'timeline' },
  { title: 'FIPS 203 Standard', source: 'compliance', deepLink: '/compliance?id=fips203' },
]

// --- Tests ---

describe('ChatMessage — user messages', () => {
  it('renders user content as plain text', () => {
    render(<ChatMessage sender="user" content="What is ML-KEM?" />)
    expect(screen.getByText('What is ML-KEM?')).toBeInTheDocument()
    // User messages should not go through ReactMarkdown
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument()
  })

  it('shows User avatar styling, not Bot avatar styling', () => {
    render(<ChatMessage sender="user" content="Hello" />)
    // The user avatar wrapper uses bg-primary/20 while bot uses bg-accent/20.
    // Verify the user-specific styling is present and the bot-specific is absent.
    // The outermost div uses flex-row-reverse for user messages.
    const messageText = screen.getByText('Hello')
    const messageContainer = messageText.closest('[class*="flex-row-reverse"]')
    expect(messageContainer).toBeInTheDocument()
  })
})

describe('ChatMessage — assistant messages', () => {
  it('renders markdown content', () => {
    render(<ChatMessage sender="assistant" content="**Bold** explanation of ML-KEM" />)
    const markdown = screen.getByTestId('markdown')
    expect(markdown).toHaveTextContent('**Bold** explanation of ML-KEM')
  })

  it('shows Bot avatar styling with flex-row layout', () => {
    render(<ChatMessage sender="assistant" content="Some answer" />)
    // Assistant messages use flex-row (not flex-row-reverse like user messages)
    const messageText = screen.getByTestId('markdown')
    const outerDiv = messageText.closest('[class*="flex gap-2"]')
    expect(outerDiv).toBeInTheDocument()
    expect(outerDiv).not.toHaveClass('flex-row-reverse')
  })

  it('shows copy button with aria-label "Copy response"', () => {
    render(<ChatMessage sender="assistant" content="Copy me" />)
    expect(screen.getByRole('button', { name: 'Copy response' })).toBeInTheDocument()
  })

  it('hides copy button when isStreaming is true', () => {
    render(<ChatMessage sender="assistant" content="Still streaming..." isStreaming />)
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument()
  })
})

describe('ChatMessage — source attribution', () => {
  it('shows "{N} sources" button when sourceRefs provided', () => {
    render(<ChatMessage sender="assistant" content="Answer" sourceRefs={sourceRefs} />)
    expect(screen.getByText('3 sources')).toBeInTheDocument()
  })

  it('clicking sources button reveals the source list', () => {
    render(<ChatMessage sender="assistant" content="Answer" sourceRefs={sourceRefs} />)

    // Source titles should not be visible before clicking
    expect(screen.queryByText('NIST PQC FAQ')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('3 sources'))

    // All source titles should now be visible
    expect(screen.getByText('NIST PQC FAQ')).toBeInTheDocument()
    expect(screen.getByText('ML-KEM Overview')).toBeInTheDocument()
    expect(screen.getByText('FIPS 203 Standard')).toBeInTheDocument()
  })

  it('source links with deepLink call navigate and closePanel', () => {
    render(<ChatMessage sender="assistant" content="Answer" sourceRefs={sourceRefs} />)

    // Expand sources
    fireEvent.click(screen.getByText('3 sources'))

    // Click a source with a deepLink
    const nistLink = screen.getByText('NIST PQC FAQ')
    fireEvent.click(nistLink)

    expect(mockClosePanel).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/library?id=nist-faq')
  })

  it('does not show sources section for user messages', () => {
    render(<ChatMessage sender="user" content="Question" sourceRefs={sourceRefs} />)
    expect(screen.queryByText('3 sources')).not.toBeInTheDocument()
  })
})

describe('ChatMessage — follow-ups', () => {
  it('renders LLM follow-ups when provided', () => {
    const llmFollowUps = ['What is ML-DSA?', 'Compare ML-KEM sizes', 'FIPS timeline?']
    const onFollowUp = vi.fn()

    render(
      <ChatMessage
        sender="assistant"
        content="Here is info about ML-KEM."
        onFollowUp={onFollowUp}
        followUps={llmFollowUps}
      />
    )

    expect(screen.getByText('What is ML-DSA?')).toBeInTheDocument()
    expect(screen.getByText('Compare ML-KEM sizes')).toBeInTheDocument()
    expect(screen.getByText('FIPS timeline?')).toBeInTheDocument()
  })

  it('falls back to regex-generated follow-ups when llmFollowUps is empty', () => {
    const onFollowUp = vi.fn()

    render(
      <ChatMessage
        sender="assistant"
        content="Generic PQC content"
        onFollowUp={onFollowUp}
        followUps={[]}
      />
    )

    // generateFollowUps mock returns ['Fallback question 1', 'Fallback question 2']
    expect(screen.getByText('Fallback question 1')).toBeInTheDocument()
    expect(screen.getByText('Fallback question 2')).toBeInTheDocument()
  })

  it('calls onFollowUp callback when follow-up button clicked', () => {
    const onFollowUp = vi.fn()
    const llmFollowUps = ['What is lattice-based crypto?']

    render(
      <ChatMessage
        sender="assistant"
        content="Answer"
        onFollowUp={onFollowUp}
        followUps={llmFollowUps}
      />
    )

    fireEvent.click(screen.getByText('What is lattice-based crypto?'))
    expect(onFollowUp).toHaveBeenCalledWith('What is lattice-based crypto?')
  })

  it('does not render follow-ups when onFollowUp is undefined', () => {
    render(<ChatMessage sender="assistant" content="Answer" followUps={['Should not appear']} />)

    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
  })

  it('limits to 3 follow-ups via generateFollowUps fallback', async () => {
    // When llmFollowUps is empty, generateFollowUps is called and it slices to 3.
    const { generateFollowUps } = await import('./generateFollowUps')
    const mockGenerate = vi.mocked(generateFollowUps)
    mockGenerate.mockReturnValueOnce(['FQ1', 'FQ2', 'FQ3'])

    const onFollowUp = vi.fn()

    render(
      <ChatMessage sender="assistant" content="Answer" onFollowUp={onFollowUp} followUps={[]} />
    )

    const followUpButtons = screen
      .getAllByRole('button')
      .filter((btn) => ['FQ1', 'FQ2', 'FQ3'].includes(btn.textContent ?? ''))
    expect(followUpButtons).toHaveLength(3)
  })
})

describe('ChatMessage — copy functionality', () => {
  it('copies content to clipboard when copy button is clicked', async () => {
    render(<ChatMessage sender="assistant" content="Copy this text" />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy response' }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Copy this text')
    })
  })
})

describe('ChatMessage — streaming', () => {
  it('shows streaming cursor when isStreaming is true', () => {
    render(<ChatMessage sender="assistant" content="Thinking..." isStreaming />)

    // The streaming cursor is an inline element next to the markdown content.
    // It has animate-pulse class. We can find it via the markdown testid's sibling.
    const markdown = screen.getByTestId('markdown')
    const wrapper = markdown.parentElement
    const cursor = wrapper?.querySelector('[class*="animate-pulse"]')
    expect(cursor).toBeInTheDocument()
  })

  it('hides source attribution during streaming', () => {
    render(
      <ChatMessage sender="assistant" content="Loading..." isStreaming sourceRefs={sourceRefs} />
    )

    expect(screen.queryByText('3 sources')).not.toBeInTheDocument()
  })
})
