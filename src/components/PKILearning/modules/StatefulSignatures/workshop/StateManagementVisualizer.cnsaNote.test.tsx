// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The HSS level buttons offer two and three levels. NSA CNSA 2.0 FAQ v2.2, p. 11: "The multi-tree
 * algorithms HSS and XMSSMT are not allowed." The line next to the buttons has to say so.
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import type { UseHSMResult } from '@/hooks/useHSM'
import { StateManagementVisualizer } from './StateManagementVisualizer'

describe('StateManagementVisualizer: level buttons and CNSA 2.0', () => {
  it('says the multi-tree HSS is not allowed for National Security Systems', () => {
    render(
      <StateManagementVisualizer
        hsm={
          {
            isReady: false,
            moduleRef: { current: null },
            hSessionRef: { current: 0 },
            registerKey: vi.fn(),
          } as unknown as UseHSMResult
        }
      />
    )
    const note = screen.getByText(/NSA CNSA 2\.0 approves only single-tree LMS and XMSS/)
    expect(note.textContent!.replace(/\s+/g, ' ')).toBe(
      'NSA CNSA 2.0 approves only single-tree LMS and XMSS for National Security Systems; the multi-tree HSS is not allowed (FAQ v2.2, p. 11). L2 and L3 are shown for education.'
    )
    expect(screen.getByRole('button', { name: 'L2 — HSS' })).toBeInTheDocument()
  })
})
