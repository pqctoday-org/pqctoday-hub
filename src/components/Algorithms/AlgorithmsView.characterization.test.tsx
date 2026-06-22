// SPDX-License-Identifier: GPL-3.0-only
/**
 * Characterization tests for AlgorithmsView's URL-sync contract — the SAFETY NET
 * for the upcoming `useAlgorithmExplorer` extraction (C5-full). These pin the
 * filter → URL writes and deep-link reads that the shell-focused
 * AlgorithmsView.test.tsx does NOT cover, so the refactor is provably
 * behaviour-preserving for the standalone /algorithms page. They must keep
 * passing unchanged before AND after the hook extraction.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import '@testing-library/jest-dom'
import { AlgorithmsView } from './AlgorithmsView'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: () => ({ hits: [], mode: 'idle' as const, loading: false }),
}))
vi.mock('./AlgorithmComparison', () => ({
  AlgorithmComparison: () => <div data-testid="transition-body" />,
}))
vi.mock('./AlgorithmDetailedComparison', () => ({
  AlgorithmDetailedComparison: () => <div data-testid="detailed-body" />,
}))
vi.mock('../../data/pqcAlgorithmsData', () => ({
  loadPQCAlgorithmsData: vi.fn().mockResolvedValue([]),
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

// Render the live URL search string into the DOM (no outer-variable mutation —
// the react-compiler lint rule forbids side effects in render).
function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const renderAt = (entry = '/algorithms') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AlgorithmsView />
      <Probe />
    </MemoryRouter>
  )

describe('AlgorithmsView — URL-sync characterization (pre-refactor net)', () => {
  beforeEach(() => {
    // A non-curious persona so the filter toolbar (incl. quick views) renders.
    usePersonaStore.setState({
      selectedPersona: 'developer',
      hasSeenPersonaPicker: true,
      experienceLevel: null,
    })
  })

  it('the NIST-picks quick view writes family=Lattice + status=Certified to the URL', async () => {
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: /NIST picks/i }))
    await waitFor(() => expect(urlSearch()).toContain('family=Lattice'))
    expect(urlSearch()).toContain('status=Certified')
  })

  it('the FIPS-validated quick view writes status=Certified with no family', async () => {
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: /FIPS-validated/i }))
    await waitFor(() => expect(urlSearch()).toContain('status=Certified'))
    expect(urlSearch()).not.toContain('family=')
  })

  it('the Everything quick view clears all filter params', async () => {
    renderAt('/algorithms?family=Lattice&status=Certified&level=5')
    fireEvent.click(await screen.findByRole('button', { name: /^Everything/i }))
    await waitFor(() => expect(urlSearch()).not.toContain('family='))
    expect(urlSearch()).not.toContain('status=')
    expect(urlSearch()).not.toContain('level=')
  })

  it('honours a deep-linked tab (?tab=detailed) over the persona default', async () => {
    renderAt('/algorithms?tab=detailed')
    expect(await screen.findByTestId('detailed-body')).toBeInTheDocument()
  })

  it('keeps the active tab in the URL when filters change (no tab loss)', async () => {
    renderAt('/algorithms?tab=detailed')
    await screen.findByTestId('detailed-body')
    fireEvent.click(await screen.findByRole('button', { name: /NIST picks/i }))
    await waitFor(() => expect(urlSearch()).toContain('family=Lattice'))
    // the detailed tab is still active + in the URL
    expect(urlSearch()).toContain('tab=detailed')
    expect(screen.getByTestId('detailed-body')).toBeInTheDocument()
  })
})
