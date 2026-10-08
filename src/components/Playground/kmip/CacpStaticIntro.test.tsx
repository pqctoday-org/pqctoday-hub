// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CacpStaticIntro } from './KmipPlaygroundView'

/**
 * /playground/cacp-kmip opens this view inside the tool route, which already has the page's level-one
 * heading; the intro used to add a second one while the engine booted, so a static capture taken at that
 * moment found two (the nightly build failed on it).
 */
describe('CacpStaticIntro', () => {
  it('carries the level-one heading by default (the /playground/cacp page)', () => {
    render(<CacpStaticIntro />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Crypto-Agility Control Plane' })
    ).toBeInTheDocument()
  })

  it('is a level-two heading inside the tool route, so the page keeps exactly one level-one heading', () => {
    render(<CacpStaticIntro headingLevel="h2" />)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Crypto-Agility Control Plane' })
    ).toBeInTheDocument()
  })
})
