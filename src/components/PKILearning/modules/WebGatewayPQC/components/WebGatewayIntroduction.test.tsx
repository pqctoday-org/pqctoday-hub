// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { WebGatewayIntroduction } from './WebGatewayIntroduction'

function pageText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <WebGatewayIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Web gateway introduction: measured versus illustrative figures', () => {
  it('does not present an unsourced edge-memory increase or firewall buffer size as an observation', () => {
    const t = pageText()
    expect(t).not.toMatch(/observed up to a 38% increase/)
    expect(t).not.toMatch(/hardcoded ~4 KB inspection buffer/)
    expect(t).not.toMatch(/drop the connection entirely/)
    expect(t).toMatch(/No published figure is used here, so measure it on your own traffic mix/)
    expect(t).toMatch(/test your own inspection path with a post-quantum handshake/)
  })

  it('labels the mitigation percentages and capacity figures illustrative', () => {
    const t = pageText()
    expect(t).toMatch(
      /percentages are illustrative planning inputs for the calculator, not measurements/
    )
    expect(t).toMatch(/Illustrative scenario figures, not measurements or vendor specifications/)
    expect(t).not.toMatch(/primary operational concern/)
  })

  it('keeps inspection blindness separate from the quantum risk of passthrough', () => {
    const t = pageText()
    expect(t).toMatch(
      /whether the session is post-quantum depends on what those two endpoints support/
    )
    expect(t).toMatch(/separate matter from the quantum risk/)
    expect(t).not.toMatch(/Zscaler, Bluecoat, McAfee Web Gateway/)
  })
})
