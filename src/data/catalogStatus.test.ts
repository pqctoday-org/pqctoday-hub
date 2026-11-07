// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { canonicalToAvailability } from './catalogStatus'

describe('canonicalToAvailability', () => {
  it('maps the pre-shared-key status to its own value, not partial or unverified', () => {
    expect(canonicalToAvailability('psk')).toBe('psk')
    expect(canonicalToAvailability('  PSK ')).toBe('psk')
  })

  it('keeps the other statuses unchanged', () => {
    expect(canonicalToAvailability('available')).toBe('available')
    expect(canonicalToAvailability('partial')).toBe('partial')
    expect(canonicalToAvailability('roadmap')).toBe('roadmap')
    expect(canonicalToAvailability('planned')).toBe('roadmap')
    expect(canonicalToAvailability('none')).toBe('none')
    expect(canonicalToAvailability('unknown')).toBe('unverified')
    expect(canonicalToAvailability(undefined)).toBe('unverified')
  })
})
