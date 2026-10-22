// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { StateReviewGuide } from './StateReviewGuide'

it('distinguishes the requirement, assessment methods and demonstration limits', () => {
  render(<StateReviewGuide />)
  const guide = screen.getByRole('region', { name: 'Reviewing state protection' })
  expect(guide).toHaveTextContent(
    'before exporting a signature or accepting another signing request'
  )
  expect(guide).toHaveTextContent('not a prescribed NIST test checklist')
  expect(guide).toHaveTextContent('does not prove reuse impossible')
  expect(guide).toHaveTextContent('does not perform hardware power-loss testing')
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
})
