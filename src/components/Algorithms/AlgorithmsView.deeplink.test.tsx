// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link arrivals on /algorithms (2026-09-28 remediation): ?highlight
 * widens hidden rows with an Undo, unknown names say "not found", ?protocol
 * without ?tab lands on Protocol Support, and resource links bypass the
 * Curious preview card.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { AlgorithmsView } from './AlgorithmsView'
import { usePersonaStore } from '@/store/usePersonaStore'

const { algo } = vi.hoisted(() => ({
  algo: (name: string, fipsStandard: string, statusTier: string, status = 'Standardized') => ({
    name,
    fipsStandard,
    status,
    statusTier,
    family: name,
    cryptoFamily: 'Lattice',
    region: 'USA',
    securityLevel: 3,
    hasResearchGap: false,
  }),
}))

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: () => ({ hits: [], mode: 'idle' as const, loading: false }),
}))
vi.mock('./AlgorithmComparison', () => ({
  AlgorithmComparison: () => <div data-testid="transition-body" />,
}))
vi.mock('./AlgorithmDetailedComparison', () => ({
  AlgorithmDetailedComparison: ({
    filteredAlgorithms,
  }: {
    filteredAlgorithms: { name: string }[]
  }) => (
    <ul data-testid="detailed-body">
      {filteredAlgorithms.map((a) => (
        <li key={a.name}>{a.name}</li>
      ))}
    </ul>
  ),
}))
vi.mock('./PQCProtocolMatrix', () => ({
  PQCProtocolMatrix: () => <div data-testid="protocol-matrix" />,
}))
vi.mock('../../data/pqcAlgorithmsData', () => ({
  loadPQCAlgorithmsData: vi
    .fn()
    .mockResolvedValue([
      algo('ML-KEM-768', 'FIPS 203', 'final'),
      algo('HQC-128', 'FIPS 207 (in development)', 'fips-draft'),
      algo('Obscure-Candidate', 'None', 'candidate', 'Candidate'),
    ]),
  loadedFileMetadata: { filename: 'x.csv', date: null },
  getFunctionGroup: () => 'KEM',
  isClassical: () => false,
}))
vi.mock('../../data/algorithmsData', () => ({
  loadAlgorithmsData: vi.fn().mockResolvedValue([]),
  loadedTransitionMetadata: { filename: 'x.csv', date: null },
  getCryptoFamilyFromPQCName: () => 'Lattice',
  getTransitionFunctionGroup: () => 'KEM',
}))

function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AlgorithmsView />
      <Probe />
    </MemoryRouter>
  )

describe('AlgorithmsView — deep links', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: 'developer',
      viewAccess: 'unlocked',
      hasSeenPersonaPicker: true,
      experienceLevel: null,
    })
  })

  it('leaves filters alone when the highlighted row is already visible', async () => {
    renderAt('/algorithms?highlight=ML-KEM-768')
    expect(await screen.findByText('ML-KEM-768')).toBeInTheDocument()
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
    expect(urlSearch()).not.toContain('quickview=')
  })

  it('drops the NIST-picks default to show a hidden highlighted row, with Undo', async () => {
    renderAt('/algorithms?highlight=HQC-128')
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent('HQC-128')
    expect(await screen.findByText('HQC-128')).toBeInTheDocument()
    expect(urlSearch()).toContain('quickview=none')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(screen.queryByText('HQC-128')).not.toBeInTheDocument())
    expect(urlSearch()).not.toContain('quickview=')
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
  })

  it('clears the status filter too when the quick view alone is not enough', async () => {
    renderAt('/algorithms?highlight=Obscure-Candidate')
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent(
      /Filters were cleared/
    )
    expect(await screen.findByText('Obscure-Candidate')).toBeInTheDocument()
  })

  it('says "not found" when the highlight matches no algorithm', async () => {
    renderAt('/algorithms?highlight=Falcon-512')
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('Falcon-512')
  })

  it('honours ?quickview=none on load', async () => {
    renderAt('/algorithms?tab=detailed&quickview=none')
    expect(await screen.findByText('HQC-128')).toBeInTheDocument()
  })

  it('treats ?protocol without ?tab as the Protocol Support tab', async () => {
    renderAt('/algorithms?protocol=ssh')
    expect(await screen.findByTestId('protocol-matrix')).toBeInTheDocument()
    await waitFor(() => expect(urlSearch()).toContain('tab=support'))
  })

  it('a resource link bypasses the Curious preview card', async () => {
    usePersonaStore.setState({ selectedPersona: 'curious', viewAccess: 'preview' })
    renderAt('/algorithms?tab=support&protocol=ssh')
    expect(await screen.findByTestId('protocol-matrix')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /three you actually need to know/ })
    ).not.toBeInTheDocument()
  })

  it('a bare visit still shows the Curious preview card', async () => {
    usePersonaStore.setState({ selectedPersona: 'curious', viewAccess: 'preview' })
    renderAt('/algorithms?tab=support')
    expect(
      await screen.findByRole('heading', { name: /three you actually need to know/ })
    ).toBeInTheDocument()
  })
})
