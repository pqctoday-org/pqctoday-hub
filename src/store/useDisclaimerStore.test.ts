// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useDisclaimerStore, parseMajorVersion } from './useDisclaimerStore'

describe('parseMajorVersion', () => {
  it('extracts major version from semver string', () => {
    expect(parseMajorVersion('2.44.3')).toBe(2)
    expect(parseMajorVersion('3.0.0')).toBe(3)
    expect(parseMajorVersion('10.1.2')).toBe(10)
  })

  it('returns 0 for invalid version strings', () => {
    expect(parseMajorVersion('')).toBe(0)
    expect(parseMajorVersion('abc')).toBe(0)
  })

  it('handles version strings with leading v', () => {
    // parseMajorVersion expects raw digits — 'v' prefix means no match
    expect(parseMajorVersion('v2.0.0')).toBe(0)
  })
})

describe('useDisclaimerStore', () => {
  beforeEach(() => {
    useDisclaimerStore.getState().resetForTesting()
  })

  it('initializes with null acknowledgedMajorVersion', () => {
    const state = useDisclaimerStore.getState()
    expect(state.acknowledgedMajorVersion).toBeNull()
  })

  it('hasAcknowledgedCurrentMajor returns false when null', () => {
    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(false)
  })

  it('acknowledgeDisclaimer sets the major version', () => {
    useDisclaimerStore.getState().acknowledgeDisclaimer()
    const state = useDisclaimerStore.getState()
    expect(state.acknowledgedMajorVersion).toBeTypeOf('number')
    expect(state.hasAcknowledgedCurrentMajor()).toBe(true)
  })

  it('resetForTesting clears acknowledged version', () => {
    useDisclaimerStore.getState().acknowledgeDisclaimer()
    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)

    useDisclaimerStore.getState().resetForTesting()
    expect(useDisclaimerStore.getState().acknowledgedMajorVersion).toBeNull()
    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(false)
  })
})
