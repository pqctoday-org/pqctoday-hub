import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ApiKeySetup } from './ApiKeySetup'
import '@testing-library/jest-dom'

const mockSetApiKey = vi.fn()

vi.mock('@/store/useChatStore', () => ({
  useChatStore: (selector: (s: { setApiKey: typeof mockSetApiKey }) => unknown) =>
    selector({ setApiKey: mockSetApiKey }),
}))

const mockValidateApiKey = vi.fn<(key: string) => Promise<boolean>>()

vi.mock('@/services/chat/GeminiService', () => ({
  validateApiKey: (...args: unknown[]) => mockValidateApiKey(args[0] as string),
}))

describe('ApiKeySetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the "Connect to Gemini AI" heading', () => {
    render(<ApiKeySetup />)
    expect(screen.getByText('Connect to Gemini AI')).toBeInTheDocument()
  })

  it('renders a password input for the API key', () => {
    render(<ApiKeySetup />)
    const input = screen.getByLabelText('Gemini API key')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders submit button disabled when input is empty', () => {
    render(<ApiKeySetup />)
    const button = screen.getByRole('button', { name: /save & connect/i })
    expect(button).toBeDisabled()
  })

  it('renders a link to Google AI Studio', () => {
    render(<ApiKeySetup />)
    const link = screen.getByRole('link', { name: /get your free api key/i })
    expect(link).toHaveAttribute('href', 'https://aistudio.google.com/apikey')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('calls setApiKey after successful validation', async () => {
    mockValidateApiKey.mockResolvedValue(true)

    render(<ApiKeySetup />)

    const input = screen.getByLabelText('Gemini API key')
    fireEvent.change(input, { target: { value: 'valid-api-key-123' } })

    const button = screen.getByRole('button', { name: /save & connect/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Connected successfully!')).toBeInTheDocument()
    })

    // setApiKey is called after a 500ms setTimeout
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockSetApiKey).toHaveBeenCalledWith('valid-api-key-123')
  })

  it('shows error message when validation returns false', async () => {
    mockValidateApiKey.mockResolvedValue(false)

    render(<ApiKeySetup />)

    const input = screen.getByLabelText('Gemini API key')
    fireEvent.change(input, { target: { value: 'bad-key' } })

    const button = screen.getByRole('button', { name: /save & connect/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText('This API key is not valid. Please check it and try again.')
      ).toBeInTheDocument()
    })

    expect(mockSetApiKey).not.toHaveBeenCalled()
  })

  it('shows network error message when validateApiKey throws', async () => {
    mockValidateApiKey.mockRejectedValue(new Error('Network failure'))

    render(<ApiKeySetup />)

    const input = screen.getByLabelText('Gemini API key')
    fireEvent.change(input, { target: { value: 'some-key' } })

    const button = screen.getByRole('button', { name: /save & connect/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText('Unable to reach Google AI. Please check your internet connection.')
      ).toBeInTheDocument()
    })
  })

  it('disables the submit button during validation', async () => {
    let resolveValidation!: (value: boolean) => void
    mockValidateApiKey.mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveValidation = resolve))
    )

    render(<ApiKeySetup />)

    const input = screen.getByLabelText('Gemini API key')
    fireEvent.change(input, { target: { value: 'test-key' } })

    const button = screen.getByRole('button', { name: /save & connect/i })
    fireEvent.click(button)

    // While validating, button should be disabled and show "Validating..."
    await waitFor(() => {
      expect(screen.getByText('Validating...')).toBeInTheDocument()
    })
    expect(button).toBeDisabled()

    // Resolve to finish the test cleanly
    await act(async () => {
      resolveValidation(true)
    })

    await waitFor(() => {
      expect(screen.getByText('Connected successfully!')).toBeInTheDocument()
    })
  })

  it('clears error when user types new input', async () => {
    mockValidateApiKey.mockResolvedValue(false)

    render(<ApiKeySetup />)

    const input = screen.getByLabelText('Gemini API key')
    fireEvent.change(input, { target: { value: 'bad-key' } })

    const button = screen.getByRole('button', { name: /save & connect/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText('This API key is not valid. Please check it and try again.')
      ).toBeInTheDocument()
    })

    // Typing new input should clear the error
    fireEvent.change(input, { target: { value: 'bad-keyx' } })

    expect(
      screen.queryByText('This API key is not valid. Please check it and try again.')
    ).not.toBeInTheDocument()
  })

  it('renders the privacy notice about local storage', () => {
    render(<ApiKeySetup />)
    expect(
      screen.getByText(
        'Your key is stored locally in your browser. It is never sent to our servers.'
      )
    ).toBeInTheDocument()
  })
})
