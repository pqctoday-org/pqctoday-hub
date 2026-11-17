// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuditSampleScopeExercise } from './AuditSampleScopeExercise'

describe('fictional audit scope comparison', () => {
  it('accepts the matching record and detects version, platform and date gaps, then recovers', () => {
    render(<AuditSampleScopeExercise />)
    const choose = (index: number) => fireEvent.click(screen.getAllByRole('radio')[index])
    const check = () => fireEvent.click(screen.getByRole('button', { name: 'Check sample scope' }))
    choose(0)
    check()
    expect(screen.getByRole('status')).toHaveTextContent('scope correspondence')
    for (const [value, message] of [
      ['1', 'another module version'],
      ['2', 'another platform'],
      ['3', 'expired before'],
    ]) {
      choose(Number(value))
      check()
      expect(screen.getByRole('status')).toHaveTextContent(message)
    }
    choose(0)
    check()
    expect(screen.getByRole('status')).toHaveTextContent('match')
  })
})
