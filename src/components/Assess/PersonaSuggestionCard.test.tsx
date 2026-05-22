// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PersonaSuggestionCard } from './PersonaSuggestionCard'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/utils/analytics', () => ({
  logEvent: vi.fn(),
  personaLabel: (l?: string) => l,
  logPersonaSelected: vi.fn(),
}))

vi.mock('@/data/learningPersonas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/learningPersonas')>()
  return {
    ...actual,
    inferPersonaFromAssessment: vi.fn(),
  }
})

type TeamSize = '1-10' | '11-50' | '51-200' | '200-plus'
const seedComplete = (overrides: Partial<{ teamSize: TeamSize }> = {}) => {
  useAssessmentStore.setState({
    assessmentStatus: 'complete',
    teamSize: overrides.teamSize ?? '11-50',
    migrationStatus: 'planning',
    cryptoAgility: 'partially-abstracted',
    currentCrypto: ['rsa-2048'],
    complianceRequirements: ['fips-140-3'],
    cryptoUseCases: ['tls'],
    infrastructure: ['cloud'],
  })
}

describe('PersonaSuggestionCard', () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.clearAllMocks()
    useAssessmentStore.setState({ assessmentStatus: 'not-started' })
    usePersonaStore.setState({ selectedPersona: null })
    const { inferPersonaFromAssessment } = await import('@/data/learningPersonas')
    vi.mocked(inferPersonaFromAssessment).mockReturnValue(null)
  })

  it('renders nothing when the assessment is not complete', async () => {
    const { container } = render(<PersonaSuggestionCard />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when the inferred persona matches the current selection', async () => {
    seedComplete()
    usePersonaStore.setState({ selectedPersona: 'developer' })
    const { inferPersonaFromAssessment } = await import('@/data/learningPersonas')
    vi.mocked(inferPersonaFromAssessment).mockReturnValue('developer')
    const { container } = render(<PersonaSuggestionCard />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the suggestion when inferred persona differs', async () => {
    seedComplete()
    usePersonaStore.setState({ selectedPersona: 'curious' })
    const { inferPersonaFromAssessment } = await import('@/data/learningPersonas')
    vi.mocked(inferPersonaFromAssessment).mockReturnValue('developer')
    render(<PersonaSuggestionCard />)
    expect(screen.getByText(/Switch to/)).toBeInTheDocument()
    expect(screen.getByText(/Stay with/)).toBeInTheDocument()
  })

  it('switching updates the persona store and dismisses', async () => {
    seedComplete()
    usePersonaStore.setState({ selectedPersona: 'curious' })
    const { inferPersonaFromAssessment } = await import('@/data/learningPersonas')
    vi.mocked(inferPersonaFromAssessment).mockReturnValue('developer')
    render(<PersonaSuggestionCard />)
    fireEvent.click(screen.getByRole('button', { name: /switch to/i }))
    expect(usePersonaStore.getState().selectedPersona).toBe('developer')
  })

  it('staying writes a 30-day suppression key to localStorage', async () => {
    seedComplete()
    usePersonaStore.setState({ selectedPersona: 'curious' })
    const { inferPersonaFromAssessment } = await import('@/data/learningPersonas')
    vi.mocked(inferPersonaFromAssessment).mockReturnValue('developer')
    render(<PersonaSuggestionCard />)
    fireEvent.click(screen.getByRole('button', { name: /stay with/i }))
    const expiry = parseInt(localStorage.getItem('persona-suggestion-suppressed-until') ?? '0', 10)
    expect(expiry).toBeGreaterThan(Date.now())
    expect(expiry).toBeLessThanOrEqual(Date.now() + 31 * 24 * 60 * 60 * 1000)
  })

  it('does not render while a previous suppression is still active', async () => {
    seedComplete()
    usePersonaStore.setState({ selectedPersona: 'curious' })
    localStorage.setItem(
      'persona-suggestion-suppressed-until',
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )
    const { inferPersonaFromAssessment } = await import('@/data/learningPersonas')
    vi.mocked(inferPersonaFromAssessment).mockReturnValue('developer')
    const { container } = render(<PersonaSuggestionCard />)
    expect(container.firstChild).toBeNull()
  })
})
