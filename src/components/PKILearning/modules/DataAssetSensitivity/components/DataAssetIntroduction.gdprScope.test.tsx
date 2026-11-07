// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DataAssetIntroduction } from './DataAssetIntroduction'

describe('data asset introduction: GDPR scope', () => {
  it('scopes GDPR by Art. 3 rather than by where a person is resident', () => {
    render(
      <MemoryRouter>
        <DataAssetIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Global Data Protection Laws/ }))
    const text = document.body.textContent ?? ''
    expect(text).toContain(
      'Personal data where GDPR Art. 3 applies (for example offering goods or services to, or monitoring the behaviour of, people in the EU)'
    )
    expect(text).not.toContain('EU resident PII')
  })
})
