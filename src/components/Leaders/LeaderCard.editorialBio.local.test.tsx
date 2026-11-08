// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeaderCard } from './LeaderCard'
import type { Leader } from '@/data/leadersData'

vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('../ui/EndorseButton', () => ({ EndorseButton: () => null }))
vi.mock('../ui/FlagButton', () => ({ FlagButton: () => null }))
vi.mock('./LeaderDetailSection', () => ({ LeaderDetailSection: () => null }))

const leader: Leader = {
  id: 'sample-editorial-profile',
  leaderId: 'sample-editorial-profile',
  name: 'Sample Leader',
  country: 'United States',
  title: 'Researcher',
  organizations: ['Sample Institute'],
  type: 'Academic',
  category: 'Research',
  sourceKind: 'curated',
  bio: 'An editorial account of work on “agility” and migration.',
}
describe('Editorial biography presentation', () => {
  it('preserves authored wording and inner quotation marks without fabricating a direct quotation', () => {
    render(<LeaderCard leader={leader} />)
    expect(screen.getByText(leader.bio).textContent).toBe(leader.bio)
    expect(screen.getByRole('heading', { name: leader.name })).toBeInTheDocument()
    expect(screen.getByText(leader.organizations[0])).toBeInTheDocument()
  })
})
