// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Round-trip counts in the Testing & Validation lesson, and the closing card of the Learn tab.
 *
 * A TCP connection costs one round trip before application data can flow (RFC 9293 section
 * 3.5, Figure 6) and a TLS 1.3 handshake one more (RFC 8446 section 2), so no text may
 * claim the TCP handshake takes six round trips or that TCP overhead is "6x" the crypto cost.
 * On the certification route the closing card names the two workshop steps on that route;
 * every other route keeps the seven-workshop text.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PQCTestingValidationModule } from './index'
import { PerformanceBenchmarkDesigner } from './workshop/PerformanceBenchmarkDesigner'
import manifest from './manifest'
import ragSummary from './rag-summary.md?raw'

const renderModule = () =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/pqc-testing-validation']}>
        <PQCTestingValidationModule />
      </MemoryRouter>
    </EmbedProvider>
  )

beforeEach(() => {
  useModuleStore.getState().resetProgress()
  usePersonaStore.getState().setPersona(null)
  window.history.replaceState(null, '', '/')
})

describe('Testing & Validation - TCP and TLS round trips', () => {
  it('Learn box cites RFC 9293 and RFC 8446 instead of an unsourced 6x figure', () => {
    renderModule()
    const box = screen.getByText('The TCP-to-TLS Overhead Insight').closest('div')!
    expect(box).toHaveTextContent(/A TCP connection costs one round trip/)
    expect(box).toHaveTextContent('RFC 9293 section 3.5')
    expect(box).toHaveTextContent('RFC 8446 section 2')
    expect(box.textContent).not.toMatch(/6×|6x|Research shows/)
  })

  it('the assistant summary no longer says the TCP handshake adds 6 round trips', () => {
    expect(ragSummary).not.toMatch(/6 RTTs|\(300ms\)/)
    expect(ragSummary).toContain('the TCP handshake costs one round trip (50ms)')
    expect(ragSummary).toContain('RFC 9293 section 3.5')
  })

  it('Benchmark Designer insight counts two round trips, not six', () => {
    render(<PerformanceBenchmarkDesigner />)
    fireEvent.click(screen.getByRole('button', { name: /key insights for this profile/ }))
    const insight = screen.getByText(
      /A TCP handshake plus a TLS 1\.3 handshake takes two round trips/
    )
    // default profile is the 50 ms WAN
    expect(insight).toHaveTextContent('(100ms at 50ms network RTT)')
    expect(insight.textContent).not.toContain('300ms')
  })
})

describe('Testing & Validation - closing card of the Learn tab', () => {
  it('names the two workshop steps on the certification route', () => {
    usePersonaStore.getState().setPersona('cert-engineer')
    renderModule()
    expect(useModuleStore.getState().modules[manifest.id]?.activeLearnPath).toBe(
      'certification-engineer'
    )
    expect(
      screen.getByText(
        'Work through the 2 workshop steps on your route (TVLA leakage analysis and ACVP validation).'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Work through 7 interactive workshops/)).not.toBeInTheDocument()
  })

  it.each([
    ['the network route', 'developer' as const],
    ['no route chosen', null],
  ])('%s keeps the seven-workshop text', (_label, persona) => {
    usePersonaStore.getState().setPersona(persona)
    renderModule()
    expect(
      screen.getByText(
        /Work through 7 interactive workshops covering passive discovery, active scanning, performance benchmarking, interop testing, TVLA analysis, strategy building, and ACVP validation\./
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/2 workshop steps on your route/)).not.toBeInTheDocument()
  })
})
