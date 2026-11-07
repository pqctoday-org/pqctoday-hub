// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { CryptoAgilityExercises } from './CryptoAgilityExercises'

function exerciseText(): string {
  render(
    <MemoryRouter>
      <CryptoAgilityExercises onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return document.body.textContent ?? ''
}

describe('CryptoAgilityExercises national security timeline', () => {
  it('gives the three CNSSP 15 dates and scopes them to national security systems', () => {
    const text = exerciseText()
    expect(text).toMatch(/national security systems \(NSS\) only/i)
    expect(text).toMatch(/new NSS acquisitions from 1 January 2027/)
    expect(text).toMatch(/phased out by 31 December 2030 unless an exception is granted/)
    expect(text).toMatch(/mandated by 31 December 2031 unless otherwise noted/)
    expect(text).toMatch(/not an NSA requirement/i)
  })

  it('labels the 2022 equipment-by-equipment table as earlier planning context', () => {
    const text = exerciseText()
    expect(text).toMatch(/September 2022 advisory/)
    expect(text).toMatch(/earlier planning context, not the current schedule/i)
  })

  it('does not present the old 2030-signing and 2033-browser schedule as the current one', () => {
    const text = exerciseText()
    expect(text).not.toMatch(/sets phased deadlines: software\/firmware signing/i)
    expect(text).not.toMatch(/follow by 2033\./)
  })
})
