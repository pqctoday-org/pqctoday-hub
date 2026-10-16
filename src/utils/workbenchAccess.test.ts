// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { hidesWorkbench } from './workbenchAccess'

describe('hidesWorkbench', () => {
  it('shows the workbench to curious readers once they choose every control', () => {
    expect(hidesWorkbench('curious', 'preview')).toBe(true)
    expect(hidesWorkbench('curious', 'gated')).toBe(true)
    expect(hidesWorkbench('curious', 'unlocked')).toBe(false)
  })

  it('keeps it hidden for executive and GRC readers whatever their view setting', () => {
    expect(hidesWorkbench('executive', 'unlocked')).toBe(true)
    expect(hidesWorkbench('grc', 'unlocked')).toBe(true)
  })

  it('shows it to every technical role and to a visitor with no role', () => {
    for (const role of ['developer', 'architect', 'researcher', 'ops', 'cert-engineer'] as const) {
      expect(hidesWorkbench(role, 'unlocked')).toBe(false)
    }
    expect(hidesWorkbench(null, 'unlocked')).toBe(false)
  })
})
