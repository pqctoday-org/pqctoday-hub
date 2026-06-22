// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import {
  markSimResume,
  markSimExited,
  clearSimExcursion,
  hasSimExited,
  isSimResumePending,
} from './simChrome'

describe('simChrome excursion flags', () => {
  beforeEach(() => sessionStorage.clear())

  it('isSimResumePending: false with no flags', () => {
    expect(isSimResumePending()).toBe(false)
  })

  it('isSimResumePending: true after a resource peek (markSimResume)', () => {
    markSimResume()
    expect(isSimResumePending()).toBe(true)
  })

  it('isSimResumePending: false once the player quits via HUB (markSimExited)', () => {
    markSimResume()
    markSimExited() // a deliberate quit clears resume + sets exited
    expect(isSimResumePending()).toBe(false)
    expect(hasSimExited()).toBe(true)
  })

  it('isSimResumePending: false after clearSimExcursion (console re-open)', () => {
    markSimResume()
    clearSimExcursion()
    expect(isSimResumePending()).toBe(false)
  })
})
