// SPDX-License-Identifier: GPL-3.0-only
/**
 * Transition-tab comparison panel ↔ ?cmp=1 (2026-09-29). A shared
 * `?tab=transition&compare=a,b` link opens the panel (not just the tray),
 * and opening/closing it writes/clears ?cmp so the address bar reproduces it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { AlgorithmsView } from './AlgorithmsView'
import { usePersonaStore } from '@/store/usePersonaStore'

const { algo } = vi.hoisted(() => ({
  algo: (name: string, fipsStandard: string, statusTier: string, status = 'Standardized') => ({
    id: name.toLowerCase(),
    name,
    fipsStandard,
    status,
    statusTier,
    family: name,
    cryptoFamily: 'Lattice',
    region: 'USA',
    securityLevel: 3,
    hasResearchGap: false,
    aesEquivalent: 'AES-192',
    publicKeySize: 1184,
    privateKeySize: 2400,
    signatureCiphertextSize: 1088,
    sharedSecretSize: 32,
    keyGenCycles: '1x',
    signEncapsCycles: '1x',
    verifyDecapsCycles: '1x',
    stackRAM: 6000,
    optimizationTarget: 'Balanced',
    useCaseNotes: '',
    sizesUnknown: false,
    perfUnknown: false,
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
vi.mock('./AlgorithmComparisonPanel', async () => {
  const { Button } = await import('@/components/ui/button')
  return {
    AlgorithmComparisonPanel: ({
      algorithms,
      onClose,
    }: {
      algorithms: { name: string }[]
      onClose: () => void
    }) => (
      <div data-testid="comparison-panel">
        {algorithms.map((a) => a.name).join(',')}
        <Button onClick={onClose}>Close comparison</Button>
      </div>
    ),
  }
})
vi.mock('./PQCProtocolMatrix', () => ({
  PQCProtocolMatrix: () => <div data-testid="protocol-matrix" />,
}))
vi.mock('../../data/pqcAlgorithmsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/pqcAlgorithmsData')>()),
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
/** An in-app link followed while /algorithms is already mounted. */
function GoTo({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(to)}>
      {`go ${to}`}
    </Button>
  )
}
const renderAt = (entry: string, links: string[] = []) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AlgorithmsView />
      <Probe />
      {links.map((to) => (
        <GoTo key={to} to={to} />
      ))}
    </MemoryRouter>
  )

describe('AlgorithmsView — Transition compare panel (?cmp)', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: 'developer',
      viewAccess: 'unlocked',
      hasSeenPersonaPicker: true,
      experienceLevel: null,
    })
  })

  it('a shared tray link opens the panel and pins ?cmp=1', async () => {
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128')
    expect(await screen.findByTestId('comparison-panel')).toHaveTextContent('ML-KEM-768,HQC-128')
    await waitFor(() => expect(urlSearch()).toContain('cmp=1'))
  })

  it('closing the panel writes cmp=0 and keeps the tray', async () => {
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128&cmp=1')
    await screen.findByTestId('comparison-panel')
    fireEvent.click(screen.getByRole('button', { name: 'Close comparison' }))
    await waitFor(() => expect(urlSearch()).toContain('cmp=0'))
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
    expect(urlSearch()).toContain('compare=')
  })

  it('close then reload stays closed (cmp=0 is honoured on arrival)', async () => {
    const { unmount } = renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128')
    await screen.findByTestId('comparison-panel')
    fireEvent.click(screen.getByRole('button', { name: 'Close comparison' }))
    await waitFor(() => expect(urlSearch()).toContain('cmp=0'))
    const reloaded = `/algorithms${urlSearch()}`
    unmount()
    renderAt(reloaded)
    await screen.findByTestId('transition-body')
    await screen.findByRole('button', { name: /^Compare/ })
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
    expect(urlSearch()).toContain('cmp=0')
  })

  it('opening from the tray writes ?cmp=1', async () => {
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128&cmp=0')
    await screen.findByTestId('transition-body')
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /^Compare/ }))
    expect(await screen.findByTestId('comparison-panel')).toBeInTheDocument()
    await waitFor(() => expect(urlSearch()).toContain('cmp=1'))
  })

  it('opening from the tray survives the delayed scroll where scrollIntoView is missing', async () => {
    // jsdom has no scrollIntoView; the 100 ms scroll timer must not throw. vitest turns an
    // uncaught timer error into a failed run with every test still green (seen under load).
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128&cmp=0')
    await screen.findByTestId('transition-body')
    fireEvent.click(await screen.findByRole('button', { name: /^Compare/ }))
    expect(await screen.findByTestId('comparison-panel')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 200))
  })

  it('one algorithm in the tray does not open the panel', async () => {
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768')
    await screen.findByTestId('transition-body')
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
    expect(urlSearch()).not.toContain('cmp=')
  })

  it('removing down to one algorithm closes the panel and drops ?cmp', async () => {
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128')
    await screen.findByTestId('comparison-panel')
    await waitFor(() => expect(urlSearch()).toContain('cmp=1'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove HQC-128 from comparison' }))
    await waitFor(() => expect(urlSearch()).not.toContain('cmp='))
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
  })

  it('a tray change that leaves ≥2 closes the panel with cmp=0', async () => {
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128,Obscure-Candidate')
    await screen.findByTestId('comparison-panel')
    await waitFor(() => expect(urlSearch()).toContain('cmp=1'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Obscure-Candidate from comparison' })
    )
    await waitFor(() => expect(urlSearch()).toContain('cmp=0'))
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
  })

  it('follows a second ?compare link while already on the page', async () => {
    const next = '/algorithms?tab=transition&compare=ML-KEM-768,Obscure-Candidate&cmp=1'
    renderAt('/algorithms?tab=transition&compare=ML-KEM-768,HQC-128&cmp=0', [next])
    await screen.findByTestId('transition-body')
    expect(screen.queryByTestId('comparison-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `go ${next}` }))
    expect(await screen.findByTestId('comparison-panel')).toHaveTextContent(
      'ML-KEM-768,Obscure-Candidate'
    )
  })
})
