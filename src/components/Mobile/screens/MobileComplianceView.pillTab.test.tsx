// SPDX-License-Identifier: AGPL-3.0-only
// Tapping a section pill on the phone view writes the section into ?tab=, the same
// param the desktop tabs use. Before, the pill changed the screen but left the old
// ?tab= in the URL, so Back and a shared link opened the previous section.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { MobileComplianceView } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'

function LocationProbe() {
  return <output data-testid="location-search">{useLocation().search}</output>
}
const urlParams = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')

describe('MobileComplianceView section pills write ?tab=', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustries: [],
      selectedRegion: null,
    })
  })

  it('replaces ?tab=records with the section the reader tapped', () => {
    render(
      <MemoryRouter initialEntries={['/compliance?tab=records']}>
        <MobileComplianceView records={[]} recordsLoaded />
        <LocationProbe />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'Records' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Landscape' }))
    expect(screen.getByRole('button', { name: 'Landscape' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(urlParams().get('tab')).not.toBe('records')
    expect(urlParams().get('tab')).toBeTruthy()
  })
})
