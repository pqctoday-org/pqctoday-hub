// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PerformanceBenchmarkDesigner } from './PerformanceBenchmarkDesigner'
import { BENCHMARK_DATA } from '../data/testingConstants'
vi.mock('../data/testingConstants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/testingConstants')>()
  return { ...actual, BENCHMARK_DATA: structuredClone(actual.BENCHMARK_DATA) }
})
const originalData = structuredClone(BENCHMARK_DATA)
beforeEach(() => {
  Object.assign(BENCHMARK_DATA, structuredClone(originalData))
})

describe('benchmark metric flight interpretation', () => {
  it('distinguishes the certificate flight from the independently selectable ClientHello metric', () => {
    render(<PerformanceBenchmarkDesigner />)
    fireEvent.click(screen.getByRole('button', { name: 'Certificate Size' }))
    expect(
      screen.getByText(
        'Leaf certificate size (affects the Certificate message flight, not ClientHello)'
      )
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'ClientHello Size' }))
    expect(screen.queryByText(/Leaf certificate size/)).not.toBeInTheDocument()
    expect(screen.getByText(/TLS ClientHello byte count/)).toBeVisible()
  })
})

describe('modeled per-direction TCP segment teaching', () => {
  it('calculates from the actual ClientHello sample bytes, including the unflagged classical case', () => {
    render(<PerformanceBenchmarkDesigner />)
    fireEvent.click(screen.getByRole('button', { name: 'ClientHello Size' }))
    for (const [label, bytes, segments] of [
      ['Classical', 320, 1],
      ['Hybrid PQC', 1504, 2],
      ['Pure PQC', 1536, 2],
    ] as const) {
      const note = screen.getByRole('note', { name: `${label} ClientHello segment estimate` })
      expect(note).toHaveTextContent(
        `Client → server: ${bytes.toLocaleString()} modeled ClientHello bytes`
      )
      expect(note).toHaveTextContent(`${segments} TCP segment${segments === 1 ? '' : 's'}`)
      expect(note).toHaveTextContent('assuming a 1,460 B MSS')
      expect(note).toHaveTextContent('not a measured packet trace')
    }
    expect(screen.queryByText(/adds 1 extra RTT/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Satellite/ }))
    expect(
      screen.getByRole('note', { name: 'Hybrid PQC ClientHello segment estimate' })
    ).toHaveTextContent('2 TCP segments')
    expect(screen.queryByText(/adds 1 extra RTT/)).not.toBeInTheDocument()
  })
  it.each([
    [1460, 1],
    [1461, 2],
    [2920, 2],
    [2921, 3],
  ])(
    'renders %i modeled ClientHello bytes as %i segments at the existing MSS',
    (bytes, segments) => {
      BENCHMARK_DATA.classical.wan.clientHelloBytes = bytes
      BENCHMARK_DATA.classical.wan.fragmentation = false
      render(<PerformanceBenchmarkDesigner />)
      fireEvent.click(screen.getByRole('button', { name: 'ClientHello Size' }))
      const note = screen.getByRole('note', { name: 'Classical ClientHello segment estimate' })
      expect(note).toHaveTextContent(`${segments} TCP segment${segments === 1 ? '' : 's'}`)
      expect(note).toHaveTextContent('assumes these bytes are packed into TCP payloads')
    }
  )
  it('keeps the server leaf certificate separate and does not invent full-flight segment counts', () => {
    render(<PerformanceBenchmarkDesigner />)
    fireEvent.click(screen.getByRole('button', { name: 'Certificate Size' }))
    const note = screen.getByRole('note', { name: 'Hybrid PQC Certificate flight scope' })
    expect(note).toHaveTextContent('Server → client: modeled leaf certificate size 4.8KB')
    expect(note).toHaveTextContent('not the complete Certificate message or server flight')
    expect(note).toHaveTextContent('chain, framing and other handshake messages')
    expect(
      screen.queryByRole('note', { name: /ClientHello segment estimate/ })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/adds 1 extra RTT/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'TLS Handshake' }))
    expect(screen.queryByRole('note', { name: /Certificate flight scope/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /TLS Handshake —/ })).toBeInTheDocument()
  })
})
